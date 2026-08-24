import type { ContractReviewDataset } from "./domain";

const DB_NAME = "contract-review-db";
const STORE = "sourceCaptures";

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onupgradeneeded = () => {
      const store = opening.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("byCapturedAt", "capturedAt");
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
}

export class ContractReviewLedger {
  async put(dataset: ContractReviewDataset): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataset);
    await transactionDone(tx);
    db.close();
  }

  async list(): Promise<ContractReviewDataset[]> {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const values = await request(tx.objectStore(STORE).getAll()) as ContractReviewDataset[];
    await transactionDone(tx);
    db.close();
    const entityKeys = ["positions", "equity", "orders", "trades", "funding", "fundingHistory", "symbolConfigs", "orderHistory", "tradeHistory", "positionHistory", "transactionHistory"] as const;
    return values.map((value) => ({
      ...value,
      ...Object.fromEntries(entityKeys.map((key) => [key, Array.isArray(value[key]) ? value[key] : []])),
    }) as ContractReviewDataset).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }
}
