/**
 * Sync 去重键（PRD §10 SENSOR-002）。
 *
 * Transaction 首选 sourceTransactionId；缺失时回退 fingerprint：
 * date + fundCode(assetId) + type + amount + status。
 * DailyPnL 去重键：assetId + date。
 */
import type { DailyPnL, Transaction } from "../domain";

/** 计算交易稳定键。优先 sourceTransactionId，否则 fingerprint。 */
export function transactionKey(tx: Transaction): string {
  if (tx.sourceTransactionId && tx.sourceTransactionId.trim()) {
    return `sid:${tx.sourceTransactionId}`;
  }
  const date = tx.occurredAt.slice(0, 10);
  return `fp:${date}:${tx.assetId}:${tx.type}:${tx.amount}:${tx.status}`;
}

/** DailyPnL 去重键 assetId + date。 */
export function dailyPnlKey(pnl: DailyPnL): string {
  return `${pnl.assetId}:${pnl.date}`;
}
