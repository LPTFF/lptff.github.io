/**
 * Mock Fixture 七套场景（PRD §38）。
 *
 * normal  / empty / partial / stale / failed / complex / large
 *
 * 全部人工虚构：基金代码 F001-F004，金额整数，日期落在 2025-2026 年。
 * 这些场景同时驱动 Mock Adapter、Sync 去重、Coverage 计算、引擎与页面边界测试。
 */
import type { AssetMetadata, DailyPnL, DataCoverage, HoldingSnapshot, InvestmentDataset, Transaction } from "../domain";
import {
  dailyDates,
  makeAccount,
  makeAsset,
  makeCoverage,
  makeDailyPnl,
  makeDataset,
  makeHolding,
  makePortfolio,
  makeTransaction,
} from "./builders";

export type ScenarioName = "normal" | "empty" | "partial" | "stale" | "failed" | "complex" | "large";

export type AdapterMethod = "getAccount" | "getHoldings" | "getTransactions" | "getDailyPnL" | "getCoverage";

export interface FixtureScenario {
  name: ScenarioName;
  description: string;
  dataset: InvestmentDataset;
  /** 让 Mock Adapter 的某个方法 reject，模拟来源失败（PRD §38 failed）。 */
  methodFailures?: Partial<Record<AdapterMethod, string>>;
  /** 交易分页未完成：getTransactions 返回 pagingComplete=false（PRD §38 partial）。 */
  transactionsPagingIncomplete?: boolean;
}

// ---------------------------------------------------------------------------
// 共享资产元数据
// ---------------------------------------------------------------------------

const ASSET_NASDAQ: AssetMetadata = makeAsset({
  assetId: "F001",
  name: "纳斯达克100指数（虚构）",
  assetClass: "equity",
  regions: ["US"],
  indexes: ["NASDAQ100"],
  currencies: ["USD"],
  themes: ["tech"],
});

const ASSET_SP500: AssetMetadata = makeAsset({
  assetId: "F002",
  name: "标普500指数（虚构）",
  assetClass: "equity",
  regions: ["US"],
  indexes: ["SP500"],
  currencies: ["USD"],
  themes: ["broad"],
});

const ASSET_HSTECH: AssetMetadata = makeAsset({
  assetId: "F003",
  name: "恒生科技指数（虚构）",
  assetClass: "equity",
  regions: ["HK"],
  indexes: ["HSTECH"],
  currencies: ["HKD"],
  themes: ["tech"],
});

const ASSET_GOLD: AssetMetadata = makeAsset({
  assetId: "F004",
  name: "黄金ETF（虚构）",
  assetClass: "commodity",
  regions: ["global"],
  indexes: ["GOLD"],
  currencies: ["USD"],
  themes: ["hedge"],
});

/** 与 F001 同暴露一个 NASDAQ100 基金，用于验证重复暴露识别（complex）。 */
const ASSET_NASDAQ2: AssetMetadata = makeAsset({
  assetId: "F005",
  name: "纳斯达克精选（虚构）",
  assetClass: "equity",
  regions: ["US"],
  indexes: ["NASDAQ100"],
  currencies: ["USD"],
  themes: ["tech"],
});

// ---------------------------------------------------------------------------
// normal：完整且无 warning 的基准场景
// ---------------------------------------------------------------------------

function normalHoldings(): HoldingSnapshot[] {
  return [
    makeHolding({ assetId: "F001", name: ASSET_NASDAQ.name, marketValue: 18204, pnl: 1236, weight: 0.42, shares: 7929.31, nav: 2.2611, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F003", name: ASSET_HSTECH.name, marketValue: 9100, pnl: -210, weight: 0.21, shares: 5200, nav: 1.75, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F004", name: ASSET_GOLD.name, marketValue: 4300, pnl: 180, weight: 0.10, shares: 2100, nav: 2.04, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F002", name: ASSET_SP500.name, marketValue: 11700, pnl: 640, weight: 0.27, shares: 4900, nav: 2.39, navDate: "2026-08-07" }),
  ];
}

function normalTransactions(): Transaction[] {
  return [
    makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 600 }),
    makeTransaction({ occurredAt: "2026-07-16", assetId: "F001", type: "BUY", amount: 600 }),
    makeTransaction({ occurredAt: "2026-07-23", assetId: "F001", type: "BUY", amount: 600 }),
    makeTransaction({ occurredAt: "2026-07-30", assetId: "F001", type: "BUY", amount: 600 }),
    makeTransaction({ occurredAt: "2026-07-09", assetId: "F003", type: "BUY", amount: 500 }),
    makeTransaction({ occurredAt: "2026-08-03", assetId: "F004", type: "BUY", amount: 1000, sourceTransactionId: "ext-F004-3" }),
  ];
}

function normalDailyPnl(): DailyPnL[] {
  return [
    makeDailyPnl({ assetId: "F001", date: "2026-08-06", nav: 2.2602, shares: 7929.31, pnl: 71.4 }),
    makeDailyPnl({ assetId: "F001", date: "2026-08-07", nav: 2.2611, shares: 7929.31, pnl: 71.5 }),
    makeDailyPnl({ assetId: "F003", date: "2026-08-06", nav: 1.7488, shares: 5200, pnl: -30.6 }),
    makeDailyPnl({ assetId: "F003", date: "2026-08-07", nav: 1.75, shares: 5200, pnl: 6.2 }),
  ];
}

function normalCoverage(): DataCoverage[] {
  return [
    makeCoverage({ dataset: "account", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "holdings", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "dailyPnl", knownRanges: [{ start: "2026-08-01", end: "2026-08-07" }], completeness: "complete" }),
    makeCoverage({ dataset: "transactions", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "fundDetail", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
  ];
}

function normalDataset(): InvestmentDataset {
  const holdings = normalHoldings();
  const totalAsset = holdings.reduce((s, h) => s + h.marketValue, 0);
  return makeDataset({
    source: "mock-normal",
    account: makeAccount({ source: "mock-normal", capturedAt: "2026-08-08T08:30:00+08:00", totalAsset, currentHoldingPnl: 1846, cumulativePnl: 8889.39 }),
    portfolio: makePortfolio({ holdings }),
    assets: [ASSET_NASDAQ, ASSET_SP500, ASSET_HSTECH, ASSET_GOLD],
    transactions: normalTransactions(),
    dailyPnl: normalDailyPnl(),
    coverage: normalCoverage(),
  });
}

// ---------------------------------------------------------------------------
// empty：无持仓 / 无交易 / 资产为 0
// ---------------------------------------------------------------------------

function emptyDataset(): InvestmentDataset {
  return makeDataset({
    source: "mock-empty",
    account: makeAccount({ source: "mock-empty", totalAsset: 0 }),
    portfolio: makePortfolio({ holdings: [], totalAsset: 0 }),
    assets: [],
    transactions: [],
    dailyPnl: [],
    coverage: [
      makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-08-08", end: "2026-08-08" }], warningCodes: ["empty:no-data"] }),
      makeCoverage({ dataset: "holdings", completeness: "complete", knownRanges: [] }),
      makeCoverage({ dataset: "dailyPnl", completeness: "unknown", knownRanges: [] }),
      makeCoverage({ dataset: "transactions", completeness: "complete", knownRanges: [] }),
      makeCoverage({ dataset: "fundDetail", completeness: "unknown", knownRanges: [] }),
    ],
    warnings: ["empty:no-data"],
  });
}

// ---------------------------------------------------------------------------
// partial：交易历史与 DailyPnL 部分覆盖（PRD §38 partial）
// ---------------------------------------------------------------------------

function partialDataset(): InvestmentDataset {
  const holdings = [
    makeHolding({ assetId: "F001", name: ASSET_NASDAQ.name, marketValue: 18204, pnl: 1236, weight: 0.42 }),
    makeHolding({ assetId: "F003", name: ASSET_HSTECH.name, marketValue: 9100, pnl: -210, weight: 0.21 }),
  ];
  return makeDataset({
    source: "mock-partial",
    account: makeAccount({ source: "mock-partial", totalAsset: 27304, currentHoldingPnl: 1026, cumulativePnl: 4020 }),
    portfolio: makePortfolio({ holdings }),
    assets: [ASSET_NASDAQ, ASSET_HSTECH],
    transactions: normalTransactions().slice(0, 4),
    dailyPnl: [makeDailyPnl({ assetId: "F001", date: "2026-08-07", pnl: 71.5 })],
    coverage: [
      makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "holdings", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "dailyPnl", completeness: "partial", knownRanges: [{ start: "2026-08-07", end: "2026-08-07" }], warningCodes: ["partial:daily-pnl-window-only"] }),
      makeCoverage({ dataset: "transactions", completeness: "partial", knownRanges: [{ start: "2026-07-01", end: "2026-08-08" }], warningCodes: ["partial:history-before-2026-07-missing"] }),
      makeCoverage({ dataset: "fundDetail", completeness: "unknown", knownRanges: [] }),
    ],
    warnings: ["partial:history-before-2026-07-missing", "partial:daily-pnl-window-only"],
  });
}

// ---------------------------------------------------------------------------
// stale：数据完整但 lastSyncedAt 过旧（PRD §38 stale）
// ---------------------------------------------------------------------------

function staleDataset(): InvestmentDataset {
  const ds = normalDataset();
  const staleAt = "2026-01-12T09:00:00+08:00";
  return {
    ...ds,
    source: "mock-stale",
    account: { ...ds.account!, source: "mock-stale", capturedAt: staleAt },
    coverage: ds.coverage.map((c) => ({ ...c, lastSyncedAt: staleAt })),
    warnings: ["stale:data-older-than-threshold"],
  };
}

// ---------------------------------------------------------------------------
// failed：account/holdings 成功，transactions 失败（PRD §38 failed）
// ---------------------------------------------------------------------------

function failedDataset(): InvestmentDataset {
  const holdings = [makeHolding({ assetId: "F001", name: ASSET_NASDAQ.name, marketValue: 18204, pnl: 1236, weight: 1.0 })];
  return makeDataset({
    source: "mock-failed",
    account: makeAccount({ source: "mock-failed", totalAsset: 18204, currentHoldingPnl: 1236, cumulativePnl: 2000 }),
    portfolio: makePortfolio({ holdings }),
    assets: [ASSET_NASDAQ],
    transactions: [],
    dailyPnl: [],
    coverage: [
      makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "holdings", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "transactions", completeness: "unknown", knownRanges: [], warningCodes: ["failed:transactions-adapter-error"] }),
      makeCoverage({ dataset: "dailyPnl", completeness: "unknown", knownRanges: [], warningCodes: ["failed:transactions-adapter-error"] }),
      makeCoverage({ dataset: "fundDetail", completeness: "unknown", knownRanges: [] }),
    ],
    warnings: ["failed:transactions-adapter-error"],
  });
}

// ---------------------------------------------------------------------------
// complex：多基金、多批次、字段差异、重复底层、规则触发、异常交易（PRD §38 complex）
// ---------------------------------------------------------------------------

function complexDataset(): InvestmentDataset {
  const holdings = [
    makeHolding({ assetId: "F001", name: ASSET_NASDAQ.name, marketValue: 19000, pnl: 1300, weight: 0.40, shares: 8300, nav: 2.3, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F005", name: ASSET_NASDAQ2.name, marketValue: 8000, pnl: 500, weight: 0.17, shares: 3600, nav: 2.22, navDate: "2026-08-07" }),
    // F001 + F005 同为 NASDAQ100，合计 57% —— 用于触发 NASDAQ 超配规则与重复暴露
    makeHolding({ assetId: "F003", name: ASSET_HSTECH.name, marketValue: 9000, pnl: -200, weight: 0.19, shares: 5100, nav: 1.75, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F004", name: ASSET_GOLD.name, marketValue: 5600, pnl: 260, weight: 0.12, shares: 2750, nav: 2.04, navDate: "2026-08-07" }),
    makeHolding({ assetId: "F002", name: ASSET_SP500.name, marketValue: 5800, pnl: 320, weight: 0.12, shares: 2430, nav: 2.39, navDate: "2026-08-07" }),
  ];
  const transactions: Transaction[] = [
    // 系统定投（银行卡定投，月度规律）
    ...["2026-05-09", "2026-06-09", "2026-07-09", "2026-08-09"].map((d) =>
      makeTransaction({ occurredAt: d, assetId: "F001", type: "BUY", amount: 600, sourceTransactionId: `bank-${d}` }),
    ),
    // 主动择时买入
    makeTransaction({ occurredAt: "2026-06-20", assetId: "F005", type: "BUY", amount: 4000, sourceTransactionId: "manual-1", sourceType: "manual_import" }),
    // 卖出（再平衡候选）
    makeTransaction({ occurredAt: "2026-07-15", assetId: "F003", type: "SELL", amount: 1500, sourceTransactionId: "manual-2", sourceType: "manual_import" }),
    // 异常金额（明显高于历史正常）
    makeTransaction({ occurredAt: "2026-08-01", assetId: "F004", type: "BUY", amount: 12000, sourceTransactionId: "manual-3", sourceType: "manual_import" }),
    // 未确认交易
    makeTransaction({ occurredAt: "2026-08-05", assetId: "F002", type: "BUY", amount: 800, status: "PENDING", sourceTransactionId: "pending-1" }),
    // 失败交易
    makeTransaction({ occurredAt: "2026-08-06", assetId: "F002", type: "BUY", amount: 800, status: "FAILED", sourceTransactionId: "failed-1" }),
  ];
  return makeDataset({
    source: "mock-complex",
    account: makeAccount({ source: "mock-complex", totalAsset: 47400, currentHoldingPnl: 2180, cumulativePnl: 6900 }),
    portfolio: makePortfolio({ holdings }),
    assets: [ASSET_NASDAQ, ASSET_NASDAQ2, ASSET_HSTECH, ASSET_GOLD, ASSET_SP500],
    transactions,
    dailyPnl: [
      makeDailyPnl({ assetId: "F001", date: "2026-08-06", pnl: 80 }),
      makeDailyPnl({ assetId: "F001", date: "2026-08-07", pnl: 82 }),
      makeDailyPnl({ assetId: "F005", date: "2026-08-07", pnl: 40 }),
    ],
    coverage: [
      makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "holdings", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "dailyPnl", completeness: "partial", knownRanges: [{ start: "2026-08-06", end: "2026-08-07" }], warningCodes: ["complex:short-daily-window"] }),
      makeCoverage({ dataset: "transactions", completeness: "complete", knownRanges: [{ start: "2026-05-01", end: "2026-08-08" }] }),
      makeCoverage({ dataset: "fundDetail", completeness: "partial", knownRanges: [{ start: "2026-05-01", end: "2026-08-08" }], warningCodes: ["complex:fund-detail-incomplete"] }),
    ],
    warnings: ["complex:short-daily-window", "complex:nasdaq-overweight", "complex:abnormal-amount-detected"],
  });
}

// ---------------------------------------------------------------------------
// large：大量交易 / DailyPnL，用于性能与批量去重（PRD §38 large）
// ---------------------------------------------------------------------------

function largeDataset(): InvestmentDataset {
  const dates = dailyDates("2025-01-01", "2026-08-07"); // 约 584 天
  const transactions: Transaction[] = [];
  const dailyPnl: DailyPnL[] = [];
  dates.forEach((date, i) => {
    // 每日一笔 F001 定投 + 偶发主动买入
    transactions.push(makeTransaction({ occurredAt: date, assetId: "F001", type: "BUY", amount: 200, sourceTransactionId: `bank-${date}` }));
    if (i % 17 === 0) transactions.push(makeTransaction({ occurredAt: date, assetId: "F003", type: "BUY", amount: 350 }));
    // 每日每只资产一条 DailyPnL
    dailyPnl.push(makeDailyPnl({ assetId: "F001", date, pnl: 10 + (i % 5) }));
    dailyPnl.push(makeDailyPnl({ assetId: "F003", date, pnl: -2 + (i % 3) }));
  });
  const holdings = [
    makeHolding({ assetId: "F001", name: ASSET_NASDAQ.name, marketValue: 200000, pnl: 12000, weight: 0.8 }),
    makeHolding({ assetId: "F003", name: ASSET_HSTECH.name, marketValue: 50000, pnl: -800, weight: 0.2 }),
  ];
  return makeDataset({
    source: "mock-large",
    account: makeAccount({ source: "mock-large", totalAsset: 250000, currentHoldingPnl: 11200, cumulativePnl: 30000 }),
    portfolio: makePortfolio({ holdings }),
    assets: [ASSET_NASDAQ, ASSET_HSTECH],
    transactions,
    dailyPnl,
    coverage: [
      makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2025-01-01", end: "2026-08-07" }] }),
      makeCoverage({ dataset: "holdings", completeness: "complete", knownRanges: [{ start: "2025-01-01", end: "2026-08-07" }] }),
      makeCoverage({ dataset: "dailyPnl", completeness: "complete", knownRanges: [{ start: "2025-01-01", end: "2026-08-07" }] }),
      makeCoverage({ dataset: "transactions", completeness: "complete", knownRanges: [{ start: "2025-01-01", end: "2026-08-07" }] }),
      makeCoverage({ dataset: "fundDetail", completeness: "partial", knownRanges: [{ start: "2025-01-01", end: "2026-08-07" }], warningCodes: ["large:fund-detail-sampled"] }),
    ],
  });
}

// ---------------------------------------------------------------------------
// 场景注册表
// ---------------------------------------------------------------------------

export const fixtures: Record<ScenarioName, () => FixtureScenario> = {
  normal: () => ({ name: "normal", description: "完整账户/持仓/交易/DailyPnL，无 warning", dataset: normalDataset() }),
  empty: () => ({ name: "empty", description: "无持仓、无交易、资产为 0", dataset: emptyDataset() }),
  partial: () => ({
    name: "partial",
    description: "交易历史与 DailyPnL 部分覆盖，Coverage 标 partial",
    dataset: partialDataset(),
    transactionsPagingIncomplete: true,
  }),
  stale: () => ({ name: "stale", description: "数据完整但 lastSyncedAt 过旧", dataset: staleDataset() }),
  failed: () => ({
    name: "failed",
    description: "account/holdings 成功，getTransactions 失败",
    dataset: failedDataset(),
    methodFailures: { getTransactions: "adapter-failed:transactions-error" },
  }),
  complex: () => ({ name: "complex", description: "多基金/多批次/重复底层/规则触发/异常交易", dataset: complexDataset() }),
  large: () => ({ name: "large", description: "大量交易与 DailyPnL，用于性能/批量去重", dataset: largeDataset() }),
};

export function getFixture(name: ScenarioName): FixtureScenario {
  return fixtures[name]();
}
