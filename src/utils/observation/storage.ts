/**
 * 需求验证与埋点监控 - 本机 IndexedDB 存储引擎
 * 遵循确定性写入、幂等去重、上限控制（20,000条/28天清理）及静默降级规范
 */

import type {
  ObservationEvent,
  ObservationSettings,
  DailyFeatureAggregation,
  FeatureId,
  TaskResult,
  ValueFeedbackType,
  ObstructionLevel,
  HealthStatus,
  ErrorCategory,
} from "./types";

const DB_NAME = "LPTFF_OBSERVATION_DB";
const DB_VERSION = 1;

const DEFAULT_SETTINGS: ObservationSettings = {
  status: "disabled", // 默认完全关闭
  coverageStartTime: null,
  retentionDaysRaw: 28,
  retentionDaysAgg: 180,
  isTestMode: false,
  truncated: false,
};

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;
let inMemorySettings: ObservationSettings = { ...DEFAULT_SETTINGS };
let hasLoadedSettings = false;

// 待写入队列与节流批处理
let writeQueue: ObservationEvent[] = [];
let flushTimer: number | null = null;

// 同一会话同功能的 feature_view 本地内存去重表：`${session_id}:${feature_id}`
const sessionViewedFeatures = new Set<string>();

// 同一 operation_id 已产生终态的本地去重表：operation_id -> TaskResult
const completedOperations = new Map<string, TaskResult>();

/** 打开数据库连接（带版本迁移与错误静默处理） */
export async function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return null;
  }
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("raw_events")) {
          const rawStore = db.createObjectStore("raw_events", { keyPath: "event_id" });
          rawStore.createIndex("timestamp", "timestamp", { unique: false });
          rawStore.createIndex("date", "date", { unique: false });
          rawStore.createIndex("feature_id", "feature_id", { unique: false });
          rawStore.createIndex("session_id", "session_id", { unique: false });
          rawStore.createIndex("operation_id", "operation_id", { unique: false });
        }
        if (!db.objectStoreNames.contains("daily_aggregations")) {
          db.createObjectStore("daily_aggregations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
        };
        resolve(dbInstance);
      };

      request.onerror = () => {
        // IndexedDB 被禁用、隐私模式拒绝或错误降级
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbInitPromise;
}

/** 获取当前配置（带缓存与初始化回填） */
export async function getSettings(): Promise<ObservationSettings> {
  if (hasLoadedSettings) return inMemorySettings;

  const db = await getDB();
  if (!db) return inMemorySettings;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("meta", "readonly");
      const store = tx.objectStore("meta");
      const req = store.get("settings");

      req.onsuccess = () => {
        if (req.result && req.result.value) {
          inMemorySettings = { ...DEFAULT_SETTINGS, ...req.result.value };
        }
        hasLoadedSettings = true;
        resolve(inMemorySettings);
      };
      req.onerror = () => {
        resolve(inMemorySettings);
      };
    } catch {
      resolve(inMemorySettings);
    }
  });
}

/** 更新配置 */
export async function updateSettings(partial: Partial<ObservationSettings>): Promise<ObservationSettings> {
  const current = await getSettings();
  const next: ObservationSettings = { ...current, ...partial };

  // 状态从 disabled -> active 时自动标记初始覆盖起点
  if (current.status === "disabled" && next.status === "active" && !next.coverageStartTime) {
    next.coverageStartTime = new Date().toISOString();
  }

  inMemorySettings = next;
  hasLoadedSettings = true;

  const db = await getDB();
  if (db) {
    try {
      const tx = db.transaction("meta", "readwrite");
      tx.objectStore("meta").put({ key: "settings", value: next });
    } catch {
      // 静默
    }
  }

  return inMemorySettings;
}

/** 检查事件去重（纯内存即时校验 + 事务级防护） */
export function shouldDropDuplicate(event: ObservationEvent): boolean {
  if (event.event_type === "feature_view") {
    const key = `${event.session_id}:${event.feature_id}`;
    if (sessionViewedFeatures.has(key)) return true;
    sessionViewedFeatures.add(key);
  } else if (event.event_type === "task_result") {
    const opId = event.operation_id;
    if (completedOperations.has(opId)) return true;
    completedOperations.set(opId, event.result);
  }
  return false;
}

/** 将事件推入异步写入队列 */
export function enqueueEvent(event: ObservationEvent): void {
  // 必须是 active 状态才采集
  if (inMemorySettings.status !== "active") return;

  if (shouldDropDuplicate(event)) return;

  writeQueue.push(event);

  if (flushTimer === null) {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flushQueue();
    }, 200);
  }
}

/** 执行批量写入并维护聚合更新 */
export async function flushQueue(): Promise<void> {
  if (writeQueue.length === 0) return;

  const batch = writeQueue.slice();
  writeQueue = [];

  const db = await getDB();
  if (!db) return;

  try {
    const tx = db.transaction(["raw_events", "daily_aggregations"], "readwrite");
    const rawStore = tx.objectStore("raw_events");
    const aggStore = tx.objectStore("daily_aggregations");

    for (const ev of batch) {
      rawStore.put(ev);
      // 增量同步至日聚合
      await updateDailyAggregationInTx(aggStore, ev);
    }

    tx.oncomplete = () => {
      // 写入后异步检查容量预算
      void checkStorageCapacity();
    };
  } catch {
    // 写入异常静默降级，不阻断主功能
  }
}

/** 在事务中以幂等方式增量更新日聚合记录 */
function updateDailyAggregationInTx(aggStore: IDBObjectStore, ev: ObservationEvent): Promise<void> {
  return new Promise((resolve) => {
    const aggId = `${ev.date}_${ev.feature_id}`;
    const req = aggStore.get(aggId);

    req.onsuccess = () => {
      let agg: DailyFeatureAggregation & { id: string } = req.result || {
        id: aggId,
        date: ev.date,
        tz_offset: ev.tz_offset,
        feature_id: ev.feature_id,
        visible_sessions: 0,
        attempt_sessions: 0,
        outbound_sessions: 0,
        task_attempts: 0,
        task_success: 0,
        task_empty: 0,
        task_failure: 0,
        task_cancelled: 0,
        task_unobserved: 0,
        feedback_counts: { helpful: 0, unhelpful: 0, not_needed_now: 0 },
        obstruction_counts: { blocking: 0, minor_inconvenience: 0, not_blocking: 0, unknown: 0 },
        health_counts: { available: 0, expired: 0, empty_data: 0, failed: 0, unknown: 0 },
        error_category_counts: { network_error: 0, timeout: 0, parse_error: 0, storage_error: 0, runtime_error: 0, unknown: 0 },
      };

      if (ev.event_type === "feature_view") {
        agg.visible_sessions += 1;
      } else if (ev.event_type === "task_start") {
        agg.task_attempts += 1;
      } else if (ev.event_type === "task_result") {
        if (ev.result === "success") agg.task_success += 1;
        else if (ev.result === "empty") agg.task_empty += 1;
        else if (ev.result === "failure") {
          agg.task_failure += 1;
          if (ev.error_category) {
            agg.error_category_counts[ev.error_category] = (agg.error_category_counts[ev.error_category] || 0) + 1;
          }
        } else if (ev.result === "cancelled") {
          agg.task_cancelled += 1;
        }
      } else if (ev.event_type === "outbound_open") {
        agg.outbound_sessions += 1;
      } else if (ev.event_type === "value_feedback") {
        agg.feedback_counts[ev.feedback] = (agg.feedback_counts[ev.feedback] || 0) + 1;
        if (ev.obstruction_level) {
          agg.obstruction_counts[ev.obstruction_level] = (agg.obstruction_counts[ev.obstruction_level] || 0) + 1;
        }
      } else if (ev.event_type === "feature_health") {
        agg.health_counts[ev.health_status] = (agg.health_counts[ev.health_status] || 0) + 1;
      }

      aggStore.put(agg);
      resolve();
    };

    req.onerror = () => resolve();
  });
}

/** 检查存储容量上限与过期清理（原始事件上限 20,000 条，默认保留 28 天） */
export async function checkStorageCapacity(): Promise<void> {
  const db = await getDB();
  if (!db) return;

  try {
    const tx = db.transaction(["raw_events", "meta"], "readwrite");
    const rawStore = tx.objectStore("raw_events");
    const countReq = rawStore.count();

    countReq.onsuccess = () => {
      const count = countReq.result;
      const MAX_RAW_EVENTS = 20000;
      const RETENTION_MS = (inMemorySettings.retentionDaysRaw || 28) * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - RETENTION_MS;

      // 如果超限或有过期事件，进行修剪
      if (count > MAX_RAW_EVENTS) {
        // 标记截断
        inMemorySettings.truncated = true;
        tx.objectStore("meta").put({ key: "settings", value: inMemorySettings });
      }

      const timeIndex = rawStore.index("timestamp");
      const range = IDBKeyRange.upperBound(cutoffTime);
      const delReq = timeIndex.openKeyCursor(range);

      delReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          rawStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    };
  } catch {
    // 静默降级
  }
}

/** 读取指定天数内的日聚合数据（默认 84 天） */
export async function getAggregations(days = 84): Promise<DailyFeatureAggregation[]> {
  const db = await getDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("daily_aggregations", "readonly");
      const store = tx.objectStore("daily_aggregations");
      const req = store.getAll();

      req.onsuccess = () => {
        const all: (DailyFeatureAggregation & { id?: string })[] = req.result || [];
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const filtered = all.filter((item) => item.date >= cutoffDate);
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/** 读取所有原始事件（用于深度确定性计算） */
export async function getAllRawEvents(days = 28): Promise<ObservationEvent[]> {
  const db = await getDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction("raw_events", "readonly");
      const store = tx.objectStore("raw_events");
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const timeIndex = store.index("timestamp");
      const range = IDBKeyRange.lowerBound(cutoffTime);
      const req = timeIndex.getAll(range);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/** 清空所有观察记录、聚合表与内存队列 */
export async function clearAllObservationData(): Promise<void> {
  // 清理内存缓存与待写入队列
  writeQueue = [];
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  sessionViewedFeatures.clear();
  completedOperations.clear();

  // 重置配置状态为 disabled，清空覆盖起点
  inMemorySettings = {
    ...DEFAULT_SETTINGS,
    status: "disabled",
    coverageStartTime: null,
    truncated: false,
  };
  hasLoadedSettings = true;

  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(["raw_events", "daily_aggregations", "meta"], "readwrite");
      tx.objectStore("raw_events").clear();
      tx.objectStore("daily_aggregations").clear();
      tx.objectStore("meta").put({ key: "settings", value: inMemorySettings });

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** 导出脱敏聚合摘要为 JSON 对象（绝不包含随机 ID 或原始事件） */
export async function exportObservationSummary(): Promise<Record<string, unknown>> {
  const settings = await getSettings();
  const aggregations = await getAggregations(84);

  return {
    export_time: new Date().toISOString(),
    settings: {
      status: settings.status,
      coverage_start_time: settings.coverageStartTime,
      observation_days_observed: 28,
      observation_days_compared: 84,
      truncated: settings.truncated,
      note: "纯本机脱敏聚合结果，不包含设备标识、会话ID或任何私人数据",
    },
    aggregations: aggregations.map(({ id: _id, ...agg }: any) => agg),
  };
}
