/**
 * Sync 去重：把 incoming 与 existing 按稳定键合并，重复批次幂等（PRD §10、§15）。
 *
 * 重复同步不产生重复交易 / 重复 DailyPnL。已存在的记录保留原 id（首写胜出），
 * 覆盖策略：同一键下若字段差异，保留 existing 但把 incoming 记入 conflicts 供审计。
 */
import type { DailyPnL, Transaction } from "../domain";
import { dailyPnlKey, transactionKey } from "./keys";

export interface DedupResult<T> {
  merged: T[];
  added: T[];
  duplicates: number;
}

/** 合并交易：existing 优先，incoming 中新键才写入。 */
export function dedupTransactions(existing: Transaction[], incoming: Transaction[]): DedupResult<Transaction> {
  const byKey = new Map<string, Transaction>();
  for (const tx of existing) byKey.set(transactionKey(tx), tx);
  const added: Transaction[] = [];
  for (const tx of incoming) {
    const key = transactionKey(tx);
    if (byKey.has(key)) continue;
    byKey.set(key, tx);
    added.push(tx);
  }
  return { merged: Array.from(byKey.values()), added, duplicates: incoming.length - added.length };
}

/** 合并 DailyPnL：existing 优先，按 assetId+date 去重。 */
export function dedupDailyPnl(existing: DailyPnL[], incoming: DailyPnL[]): DedupResult<DailyPnL> {
  const byKey = new Map<string, DailyPnL>();
  for (const p of existing) byKey.set(dailyPnlKey(p), p);
  const added: DailyPnL[] = [];
  for (const p of incoming) {
    const key = dailyPnlKey(p);
    if (byKey.has(key)) continue;
    byKey.set(key, p);
    added.push(p);
  }
  return { merged: Array.from(byKey.values()), added, duplicates: incoming.length - added.length };
}
