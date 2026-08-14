/**
 * Fixture 构建器：供七套 Mock 场景组装 InvestmentDataset。
 *
 * 全部为人工虚构数据（PRD §38-39）：基金代码、金额、日期、组合均不来自真实账户，
 * 禁止姓名替换 / 金额缩放等伪脱敏。日期基于固定基准 2026 年，便于断言。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  DailyPnL,
  DataCoverage,
  HoldingSnapshot,
  InvestmentDataset,
  PortfolioSnapshot,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../domain";
import { INVESTMENT_PROTOCOL_VERSION } from "../domain/types";

export type PartialContract<T> = Partial<T>;

export function makeAccount(o: PartialContract<AccountSnapshot> & Pick<AccountSnapshot, "totalAsset">): AccountSnapshot {
  return {
    id: o.id ?? `acct:${o.source ?? "mock"}:${o.capturedAt ?? "2026-08-08"}`,
    source: o.source ?? "mock",
    capturedAt: o.capturedAt ?? "2026-08-08T08:30:00+08:00",
    totalAsset: o.totalAsset,
    currentHoldingPnl: o.currentHoldingPnl,
    cumulativePnl: o.cumulativePnl,
  };
}

export function makeHolding(o: PartialContract<HoldingSnapshot> & Pick<HoldingSnapshot, "assetId" | "marketValue">): HoldingSnapshot {
  return {
    assetId: o.assetId,
    name: o.name,
    marketValue: o.marketValue,
    pnl: o.pnl,
    pnlRate: o.pnlRate,
    weight: o.weight,
    costValue: o.costValue,
    shares: o.shares,
    availableShares: o.availableShares,
    nav: o.nav,
    navDate: o.navDate,
  };
}

export function makeTransaction(
  o: PartialContract<Transaction> &
    Pick<Transaction, "occurredAt" | "assetId" | "type" | "amount">
): Transaction {
  const assetId = o.assetId;
  const occurredAt = o.occurredAt;
  const type = o.type;
  const amount = o.amount;
  return {
    id: o.id ?? `gen-tx:${assetId}:${occurredAt}:${type}:${amount}`,
    sourceTransactionId: o.sourceTransactionId,
    occurredAt,
    assetId,
    type,
    amount,
    amountUnit: o.amountUnit ?? "CNY",
    confirmedAmount: o.confirmedAmount,
    status: (o.status as TransactionStatus) ?? "confirmed",
    sourceType: o.sourceType ?? "auto_collect",
    behaviorType: o.behaviorType ?? null,
    policyId: o.policyId,
  };
}

export function makeDailyPnl(o: PartialContract<DailyPnL> & Pick<DailyPnL, "assetId" | "date" | "pnl">): DailyPnL {
  return {
    assetId: o.assetId,
    date: o.date,
    nav: o.nav,
    shares: o.shares,
    dailyReturn: o.dailyReturn,
    pnl: o.pnl,
  };
}

export function makeAsset(o: PartialContract<AssetMetadata> & Pick<AssetMetadata, "assetId">): AssetMetadata {
  return {
    assetId: o.assetId,
    name: o.name,
    assetClass: o.assetClass ?? "equity",
    regions: o.regions ?? [],
    indexes: o.indexes ?? [],
    currencies: o.currencies ?? [],
    themes: o.themes ?? [],
  };
}

export function makeCoverage(o: PartialContract<DataCoverage> & Pick<DataCoverage, "dataset">): DataCoverage {
  return {
    dataset: o.dataset,
    knownRanges: o.knownRanges ?? [],
    completeness: o.completeness ?? "complete",
    lastSyncedAt: o.lastSyncedAt ?? "2026-08-08T08:30:00+08:00",
    warningCodes: o.warningCodes ?? [],
  };
}

export function makePortfolio(o: PartialContract<PortfolioSnapshot> & Pick<PortfolioSnapshot, "holdings">): PortfolioSnapshot {
  const holdingValue = o.holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  return {
    id: o.id ?? `portfolio:${o.date ?? "2026-08-08"}`,
    date: o.date ?? "2026-08-08",
    totalAsset: o.totalAsset ?? holdingValue,
    holdingValue,
    cash: o.cash,
    currentHoldingPnl: o.currentHoldingPnl,
    holdings: o.holdings,
  };
}

export function makeDataset(o: Partial<InvestmentDataset> & Pick<InvestmentDataset, "transactions" | "dailyPnl" | "coverage" | "assets">): InvestmentDataset {
  return {
    version: INVESTMENT_PROTOCOL_VERSION,
    source: o.source ?? "mock",
    capturedAt: o.capturedAt ?? "2026-08-08T08:30:00+08:00",
    account: o.account,
    portfolio: o.portfolio,
    assets: o.assets,
    transactions: o.transactions,
    dailyPnl: o.dailyPnl,
    coverage: o.coverage,
    warnings: o.warnings ?? [],
  };
}

/** 在 [start, end] 内按天生成 N 个日期字符串（YYYY-MM-DD），用于 large fixture。 */
export function dailyDates(start: string, end: string, stepDays = 1): string[] {
  const out: string[] = [];
  const cursor = new Date(start + "T00:00:00Z");
  const stop = new Date(end + "T00:00:00Z");
  while (cursor <= stop) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + stepDays);
  }
  return out;
}
