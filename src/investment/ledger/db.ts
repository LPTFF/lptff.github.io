/**
 * Investment Ledger：IndexedDB `investment-db` 封装（PRD §30、§46 LEDGER-001~007）。
 *
 * 本地优先：所有记录只写浏览器 IndexedDB，不上传服务器。版本化迁移（LEDGER-007）：
 * 新增 store 走 dbVersion++，回调可回滚注释保留。
 *
 * 测试环境通过 tests/investment/setup.ts 注入 fake-indexeddb。
 */

export const INVESTMENT_DB_NAME = "investment-db";
export const INVESTMENT_DB_VERSION = 1;

export const StoreName = {
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
} as const;

export type StoreNameKey = keyof typeof StoreName;

function upgrade(db: IDBDatabase): void {
  // v1：按 PRD §30 建立核心 stores 与索引。后续版本在 onupgradeneeded 分支里追加。
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

/** 打开 Investment Ledger，自动执行迁移。 */
export function openInvestmentDB(dbName: string = INVESTMENT_DB_NAME, version: number = INVESTMENT_DB_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      upgrade(db);
    };
    request.onsuccess = () => resolve(request.result);
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
