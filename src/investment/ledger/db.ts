/**
 * Investment Ledger：IndexedDB `investment-db` 封装（PRD §30、§46 LEDGER-001~007）。
 *
 * 本地优先：所有记录只写浏览器 IndexedDB，不上传服务器。版本化迁移（LEDGER-007）：
 * 新增 store 或字段走 INVESTMENT_DB_VERSION++，回调里按 oldVersion 分支推进。
 */
import type { Transaction, TransactionStatus } from "../domain";
import { transactionKey } from "../sync/keys";

export const INVESTMENT_DB_NAME = "investment-db";
export const INVESTMENT_DB_VERSION = 2;

export const StoreName = {
  // v1
  accounts: "accounts",
  portfolioSnapshots: "portfolioSnapshots",
  transactions: "transactions",
  dailyPnl: "dailyPnl",
  dataCoverage: "dataCoverage",
  assets: "assets",
  imports: "imports",
  policies: "policies",
  policyVersions: "policyVersions",
  patterns: "patterns",
  actions: "actions",
  evidence: "evidence",
  // v2：P0 纪律与执行复盘（Investment Review WP0-1~WP0-3）
  investmentScopes: "investmentScopes",
  strategyRuleVersions: "strategyRuleVersions",
  decisionRecords: "decisionRecords",
  operationPlans: "operationPlans",
  executionLinks: "executionLinks",
  trailingStopStates: "trailingStopStates",
  reductionPlans: "reductionPlans",
  reviewSnapshots: "reviewSnapshots",
  reviewActions: "reviewActions",
} as const;

export type StoreNameKey = keyof typeof StoreName;

/** v1 旧 TransactionStatus → v2 新枚举的幂等映射。 */
export const LEGACY_TX_STATUS_MAP: Record<string, TransactionStatus> = {
  PENDING: "requested",
  CONFIRMED: "confirmed",
  FAILED: "failed",
  UNKNOWN: "unknown",
};

function createV1Stores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(StoreName.accounts)) {
    db.createObjectStore(StoreName.accounts, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(StoreName.portfolioSnapshots)) {
    const store = db.createObjectStore(StoreName.portfolioSnapshots, { keyPath: "id" });
    store.createIndex("byDate", "date", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.transactions)) {
    const store = db.createObjectStore(StoreName.transactions, { keyPath: "id" });
    store.createIndex("byDedupKey", "dedupKey", { unique: false });
    store.createIndex("byAsset", "assetId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.dailyPnl)) {
    db.createObjectStore(StoreName.dailyPnl, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(StoreName.dataCoverage)) {
    db.createObjectStore(StoreName.dataCoverage, { keyPath: "dataset" });
  }
  if (!db.objectStoreNames.contains(StoreName.assets)) {
    db.createObjectStore(StoreName.assets, { keyPath: "assetId" });
  }
  if (!db.objectStoreNames.contains(StoreName.imports)) {
    db.createObjectStore(StoreName.imports, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(StoreName.policies)) {
    db.createObjectStore(StoreName.policies, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(StoreName.policyVersions)) {
    const store = db.createObjectStore(StoreName.policyVersions, { keyPath: "id" });
    store.createIndex("byPolicy", "policyId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.patterns)) {
    db.createObjectStore(StoreName.patterns, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(StoreName.actions)) {
    const store = db.createObjectStore(StoreName.actions, { keyPath: "id" });
    store.createIndex("byStatus", "status", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.evidence)) {
    db.createObjectStore(StoreName.evidence, { keyPath: "id" });
  }
}

function createV2Stores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(StoreName.investmentScopes)) {
    db.createObjectStore(StoreName.investmentScopes, { keyPath: "scopeId" });
  }
  if (!db.objectStoreNames.contains(StoreName.strategyRuleVersions)) {
    const store = db.createObjectStore(StoreName.strategyRuleVersions, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.decisionRecords)) {
    const store = db.createObjectStore(StoreName.decisionRecords, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.operationPlans)) {
    const store = db.createObjectStore(StoreName.operationPlans, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.executionLinks)) {
    const store = db.createObjectStore(StoreName.executionLinks, { keyPath: "id" });
    store.createIndex("byTransaction", "transactionId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.trailingStopStates)) {
    const store = db.createObjectStore(StoreName.trailingStopStates, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.reductionPlans)) {
    const store = db.createObjectStore(StoreName.reductionPlans, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.reviewSnapshots)) {
    const store = db.createObjectStore(StoreName.reviewSnapshots, { keyPath: "id" });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
  if (!db.objectStoreNames.contains(StoreName.reviewActions)) {
    const store = db.createObjectStore(StoreName.reviewActions, { keyPath: "id" });
    store.createIndex("byStatus", "kind", { unique: false });
    store.createIndex("byScope", "scopeId", { unique: false });
  }
}

/**
 * 迁移 v1 旧 TransactionStatus 值到 v2 新枚举，并重建 dedupKey（fingerprint 含 status，
 * 不重建会导致同一笔交易旧/新 fingerprint 不匹配，重复导入时双倍记账）。
 *
 * 幂等：新值已是新枚举时 map 查不到，跳过；重复调用安全。
 */
export async function migrateTransactionStatusIfNeeded(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains(StoreName.transactions)) return;
  const tx = db.transaction(StoreName.transactions, "readwrite");
  const store = tx.objectStore(StoreName.transactions);
  const all = (await reqToPromise(store.getAll())) as Array<Transaction & { dedupKey?: string }>;
  for (const record of all) {
    const mapped = LEGACY_TX_STATUS_MAP[record.status];
    if (!mapped) continue; // 已是新枚举
    const next: Transaction & { dedupKey?: string } = { ...record, status: mapped };
    next.dedupKey = transactionKey(next);
    store.put(next);
  }
  await txDone(tx);
}

function upgrade(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) createV1Stores(db);
  if (oldVersion < 2) createV2Stores(db);
}

/** 打开 Investment Ledger，自动执行结构迁移；status 数据迁移在打开成功后幂等执行。 */
export function openInvestmentDB(
  dbName: string = INVESTMENT_DB_NAME,
  version: number = INVESTMENT_DB_VERSION,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      upgrade(db, event.oldVersion);
    };
    request.onsuccess = () => {
      const db = request.result;
      migrateTransactionStatusIfNeeded(db)
        .then(() => resolve(db))
        .catch((err) => reject(err));
    };
    request.onerror = () => reject(request.error ?? new Error("indexedDB.open failed"));
  });
}

// ---- 通用 Promise 包装 ----

export function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 请求并可能返回 void 结果（put/delete/get）。 */
export async function requestResult<T>(req: IDBRequest<T>): Promise<T> {
  return reqToPromise(req);
}