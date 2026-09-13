/**
 * 需求验证与埋点监控 - 高层业务埋点触发入口与排除防护
 * 严格执行字段白名单、防误采过滤、投资/合约复盘硬编码排除
 */

import { getSessionId, isPageForeground } from "./session";
import { enqueueEvent, getSettings } from "./storage";
import type {
  FeatureId,
  ActionId,
  TaskResult,
  TargetCategory,
  ErrorCategory,
  HealthStatus,
  ValueFeedbackType,
  ObstructionLevel,
  FeatureViewEvent,
  TaskStartEvent,
  TaskResultEvent,
  OutboundOpenEvent,
  ValueFeedbackEvent,
  FeatureHealthEvent,
} from "./types";

const CONTRACT_VERSION = "1.0.0";

// 显式受保护与硬性排除路径（通用钩子与自动逻辑严禁捕获）
const EXCLUDED_PATH_PREFIXES = ["/investment", "/contract-review"];

function isExcludedEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.toLowerCase();
  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
}

function getLocalDateAndTz(): { date: string; tzOffset: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    tzOffset: now.getTimezoneOffset(),
  };
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "ev_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
}

function generateOperationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "op_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
}

/** 检查当前是否允许记录 */
export async function isRecordingActive(): Promise<boolean> {
  if (isExcludedEnvironment()) return false;
  const settings = await getSettings();
  return settings.status === "active";
}

/**
 * 记录功能可见展示 (feature_view)
 * 仅在前台展示时触发，同一会话同功能仅计一次
 */
export async function recordFeatureView(featureId: FeatureId, featureVersion?: string): Promise<void> {
  if (isExcludedEnvironment() || !isPageForeground()) return;
  const settings = await getSettings();
  if (settings.status !== "active") return;

  const { date, tzOffset } = getLocalDateAndTz();
  const ev: FeatureViewEvent = {
    event_id: generateEventId(),
    event_type: "feature_view",
    feature_id: featureId,
    session_id: getSessionId(),
    timestamp: Date.now(),
    date,
    tz_offset: tzOffset,
    contract_version: CONTRACT_VERSION,
    feature_version: featureVersion,
    is_test: settings.isTestMode,
  };

  enqueueEvent(ev);
}

/**
 * 启动关键任务 (task_start)
 * 返回操作标识 operationId 和终态回调 finish
 */
export function startTask(
  featureId: FeatureId,
  actionId: ActionId,
  featureVersion?: string
): { operationId: string; finish: (result: TaskResult, errorCategory?: ErrorCategory) => void } {
  const operationId = generateOperationId();
  if (isExcludedEnvironment()) {
    return { operationId, finish: () => {} };
  }

  // 异步记录 task_start
  void getSettings().then((settings) => {
    if (settings.status !== "active") return;
    const { date, tzOffset } = getLocalDateAndTz();
    const ev: TaskStartEvent = {
      event_id: generateEventId(),
      event_type: "task_start",
      feature_id: featureId,
      action_id: actionId,
      operation_id: operationId,
      session_id: getSessionId(),
      timestamp: Date.now(),
      date,
      tz_offset: tzOffset,
      contract_version: CONTRACT_VERSION,
      feature_version: featureVersion,
      is_test: settings.isTestMode,
    };
    enqueueEvent(ev);
  });

  let hasFinished = false;
  const finish = (result: TaskResult, errorCategory?: ErrorCategory) => {
    if (hasFinished) return; // 单次操作至多一个终态
    hasFinished = true;

    if (isExcludedEnvironment()) return;
    void getSettings().then((settings) => {
      if (settings.status !== "active") return;
      const { date, tzOffset } = getLocalDateAndTz();
      const ev: TaskResultEvent = {
        event_id: generateEventId(),
        event_type: "task_result",
        feature_id: featureId,
        action_id: actionId,
        operation_id: operationId,
        session_id: getSessionId(),
        result,
        error_category: errorCategory,
        timestamp: Date.now(),
        date,
        tz_offset: tzOffset,
        contract_version: CONTRACT_VERSION,
        feature_version: featureVersion,
        is_test: settings.isTestMode,
      };
      enqueueEvent(ev);
    });
  };

  return { operationId, finish };
}

/**
 * 记录打开外部资源 (outbound_open)
 * 只证明外跳意图，只记录固定类别，禁止记录标题与具体链接
 */
export async function recordOutboundOpen(
  featureId: FeatureId,
  actionId: ActionId,
  targetCategory: TargetCategory
): Promise<void> {
  if (isExcludedEnvironment()) return;
  const settings = await getSettings();
  if (settings.status !== "active") return;

  const { date, tzOffset } = getLocalDateAndTz();
  const ev: OutboundOpenEvent = {
    event_id: generateEventId(),
    event_type: "outbound_open",
    feature_id: featureId,
    action_id: actionId,
    target_category: targetCategory,
    session_id: getSessionId(),
    timestamp: Date.now(),
    date,
    tz_offset: tzOffset,
    contract_version: CONTRACT_VERSION,
    is_test: settings.isTestMode,
  };

  enqueueEvent(ev);
}

/**
 * 记录定性自愿反馈 (value_feedback)
 * 无自由文本，无弹窗骚扰
 */
export async function recordValueFeedback(
  featureId: FeatureId,
  feedback: ValueFeedbackType,
  obstructionLevel?: ObstructionLevel
): Promise<void> {
  if (isExcludedEnvironment()) return;
  const settings = await getSettings();
  if (settings.status !== "active") return;

  const { date, tzOffset } = getLocalDateAndTz();
  const ev: ValueFeedbackEvent = {
    event_id: generateEventId(),
    event_type: "value_feedback",
    feature_id: featureId,
    session_id: getSessionId(),
    feedback,
    obstruction_level: obstructionLevel,
    timestamp: Date.now(),
    date,
    tz_offset: tzOffset,
    contract_version: CONTRACT_VERSION,
    is_test: settings.isTestMode,
  };

  enqueueEvent(ev);
}

/**
 * 记录运行健康状态 (feature_health)
 * 不计入人的活跃或需求
 */
export async function recordFeatureHealth(featureId: FeatureId, healthStatus: HealthStatus): Promise<void> {
  if (isExcludedEnvironment()) return;
  const settings = await getSettings();
  if (settings.status !== "active") return;

  const { date, tzOffset } = getLocalDateAndTz();
  const ev: FeatureHealthEvent = {
    event_id: generateEventId(),
    event_type: "feature_health",
    feature_id: featureId,
    session_id: getSessionId(),
    health_status: healthStatus,
    timestamp: Date.now(),
    date,
    tz_offset: tzOffset,
    contract_version: CONTRACT_VERSION,
    is_test: settings.isTestMode,
  };

  enqueueEvent(ev);
}
