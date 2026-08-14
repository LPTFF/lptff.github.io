/**
 * Investment Review P0 fixture matrix（WP0-1 ~ WP0-3）。
 *
 * 场景命名对齐工程附录 §5 的 Test Matrix。全部人工虚构：基金代码 F001-F004，
 * 金额整数，日期落在 2026 年。可用于驱动确定性 Core Oracle、属性与状态机测试。
 */
import type {
  DecisionRecord,
  ExecutionLink,
  InvestmentScope,
  OperationPlan,
  ReductionPlan,
  StrategyRuleVersion,
  Transaction,
} from "../../domain";
import type { ReviewFacts } from "../../engines/review/scope";
import type { StoredTrailingStopState } from "../../ledger/repository";
import {
  makeCoverage,
  makeHolding,
  makePortfolio,
  makeAccount,
  makeAsset,
  makeTransaction,
  makeDecisionRecord,
  makeOperationPlan,
  makeExecutionLink,
  makeStoredTrailingStopState,
  DEFAULT_AS_OF,
} from "./builders";

export interface ReviewScenario {
  name: string;
  description: string;
  scope: InvestmentScope;
  rules: StrategyRuleVersion[];
  facts: ReviewFacts;
  decisions?: DecisionRecord[];
  plans?: OperationPlan[];
  executionLinks?: ExecutionLink[];
  previousTrailingStops?: StoredTrailingStopState[];
  reductionPlans?: ReductionPlan[];
  asOf: string;
}

const ASSET_F001 = makeAsset({ assetId: "F001", name: "纳斯达克100（虚构）", assetClass: "equity", regions: ["US"], indexes: ["NASDAQ100"], currencies: ["CNY"], themes: ["tech"] });
const ASSET_F002 = makeAsset({ assetId: "F002", name: "标普500（虚构）", assetClass: "equity", regions: ["US"], indexes: ["SP500"], currencies: ["CNY"], themes: ["broad"] });
const ASSET_F003 = makeAsset({ assetId: "F003", name: "恒生科技（虚构）", assetClass: "equity", regions: ["HK"], indexes: ["HSTECH"], currencies: ["CNY"], themes: ["tech"] });
const ASSET_F004 = makeAsset({ assetId: "F004", name: "黄金ETF（虚构）", assetClass: "commodity", regions: ["global"], indexes: ["GOLD"], currencies: ["CNY"], themes: ["hedge"] });

const ALL_ASSETS = [ASSET_F001, ASSET_F002, ASSET_F003, ASSET_F004];

function inBoundsHoldings() {
  return [
    makeHolding({ assetId: "F001", name: ASSET_F001.name, marketValue: 18204, weight: 0.42, shares: 7929, nav: 2.2611, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F002", name: ASSET_F002.name, marketValue: 11700, weight: 0.27, shares: 4900, nav: 2.39, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F003", name: ASSET_F003.name, marketValue: 9100, weight: 0.21, shares: 5200, nav: 1.75, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F004", name: ASSET_F004.name, marketValue: 4300, weight: 0.10, shares: 2100, nav: 2.04, navDate: "2026-08-08" }),
  ];
}

function fullCoverage() {
  return [
    makeCoverage({ dataset: "account", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "holdings", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "dailyPnl", knownRanges: [{ start: "2026-08-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "transactions", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
    makeCoverage({ dataset: "fundDetail", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }], completeness: "complete" }),
  ];
}

// ---- WP0-1 场景 ----

function noOperationInBounds(): ReviewScenario {
  const holdings = inBoundsHoldings();
  const totalAsset = holdings.reduce((s, h) => s + h.marketValue, 0);
  return {
    name: "no-operation-in-bounds",
    description: "完整规则与快照，本期无操作；只对已覆盖判断显示符合，未覆盖问题不被总结为正常",
    scope: {
      scopeId: "scope:demo",
      scopeType: "DECLARED_PORTFOLIO",
      includedAssetIds: ["F001", "F002", "F003", "F004"],
      baseCurrency: "CNY",
      denominatorSource: "account_total_asset",
      denominatorAsOf: DEFAULT_AS_OF,
      denominatorCoverage: makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      effectiveFrom: "2026-01-01",
      version: 1,
    },
    rules: [
      {
        id: "srv:demo:v1",
        scopeId: "scope:demo",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [
          { kind: "position_band", assetId: "F001", minPct: 0, maxPct: 0.5, targetPct: 0.4 },
          { kind: "trailing_stop", assetId: "F001", basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2026-01-01" },
        ],
      },
    ],
    facts: {
      account: makeAccount({ source: "review", totalAsset, capturedAt: `${DEFAULT_AS_OF}T08:30:00+08:00` }),
      portfolio: makePortfolio({ holdings, totalAsset }),
      assets: ALL_ASSETS,
      transactions: [],
      dailyPnl: [],
      coverage: fullCoverage(),
    },
    asOf: DEFAULT_AS_OF,
  };
}

function scopeDenominatorMissing(): ReviewScenario {
  const holdings = inBoundsHoldings();
  const base = noOperationInBounds();
  return {
    ...base,
    name: "scope-denominator-missing",
    description: "有基金市值，无可靠总资产分母；仅仓位 unknown，操作/止损可继续",
    scope: { ...base.scope, scopeId: "scope:no-denom", denominatorSource: "none", denominatorCoverage: undefined },
    facts: { ...base.facts, account: undefined, portfolio: makePortfolio({ holdings }) },
  };
}

function cnyNoFxTax(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "cny-no-fx-tax",
    description: "单币种人民币普通基金场景；P0 不要求 FX/通用税字段",
    scope: { ...base.scope, scopeId: "scope:cny", baseCurrency: "CNY" },
  };
}

function emptyScenario(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "empty",
    description: "无持仓/无操作是合法状态，不伪造问题",
    scope: { ...base.scope, scopeId: "scope:empty", includedAssetIds: [] },
    facts: {
      account: makeAccount({ source: "review", totalAsset: 0 }),
      portfolio: makePortfolio({ holdings: [], totalAsset: 0 }),
      assets: [],
      transactions: [],
      dailyPnl: [],
      coverage: fullCoverage().map((c) => (c.dataset === "holdings" ? { ...c, completeness: "complete" as const } : c)),
    },
  };
}

function versionChange(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "version-change",
    description: "scope 当前规则版本修改不改变历史；解析时取当时生效版本",
    scope: { ...base.scope, scopeId: "scope:version", version: 2, effectiveFrom: "2026-06-01" },
    rules: [
      { id: "srv:version:v1", scopeId: "scope:version", version: 1, effectiveFrom: "2026-01-01", effectiveTo: "2026-05-31", rules: [{ kind: "position_band", minPct: 0, maxPct: 0.6 }] },
      { id: "srv:version:v2", scopeId: "scope:version", version: 2, effectiveFrom: "2026-06-01", rules: [{ kind: "position_band", minPct: 0, maxPct: 0.5 }] },
    ],
  };
}

function unknownSchema(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "unknown-schema",
    description: "未知枚举（navBasis unknown）进入 unknown，输出 Required change",
    scope: { ...base.scope, scopeId: "scope:unknown-schema" },
    rules: [
      {
        id: "srv:unknown-schema:v1",
        scopeId: "scope:unknown-schema",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [{ kind: "trailing_stop", assetId: "F001", basis: "unknown", drawdownPct: 0.1, effectiveFrom: "2026-01-01" }],
      },
    ],
  };
}

// ---- 场景注册表 ----

const scenarios: Record<string, () => ReviewScenario> = {
  "no-operation-in-bounds": noOperationInBounds,
  "scope-denominator-missing": scopeDenominatorMissing,
  "cny-no-fx-tax": cnyNoFxTax,
  empty: emptyScenario,
  "version-change": versionChange,
  "unknown-schema": unknownSchema,
  "planned-confirmed-operation": plannedConfirmedOperation,
  "unplanned-operation": unplannedOperation,
  "over-plan-operation": overPlanOperation,
  "pause-conflict": pauseConflictOperation,
  "historical-amount-only": historicalAmountOnly,
  "partial-confirmation": partialConfirmation,
  "pending-or-duplicate": pendingOrDuplicate,
  "position-over-limit": positionOverLimit,
  "scope-mismatch": scopeMismatch,
  "stop-new-high": stopNewHigh,
  "stop-no-new-high": stopNoNewHigh,
  "stale-nav-stop": staleNavStop,
  "nav-basis-unknown": navBasisUnknown,
  "review-demo-combined": reviewDemoCombined,
};

// ---- WP0-2 场景：计划操作与真实执行对照 ----

function baseWithTransactions(txs: Transaction[], extra?: Partial<ReviewScenario>): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    ...extra,
    facts: { ...base.facts, transactions: txs },
  };
}

function plannedConfirmedOperation(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 600, sourceTransactionId: "biz-1", status: "confirmed" });
  const decision = makeDecisionRecord({
    id: "dec:buy-f001-1",
    scopeId: "scope:demo",
    direction: "BUY",
    assetId: "F001",
    plannedAmount: 600,
    allowedWindow: { start: "2026-07-01", end: "2026-07-31" },
    decidedAt: "2026-07-01",
    rationale: "月度定投",
    strategyRuleVersionId: "srv:demo:v1",
  });
  const plan = makeOperationPlan({
    id: "plan:buy-f001-1",
    decisionRecordId: decision.id,
    scopeId: "scope:demo",
    plannedValue: 600,
    unit: "CNY",
  });
  const link = makeExecutionLink({ transactionId: tx.id, decisionRecordId: decision.id, linkMethod: "declared", confidence: "high" });
  return baseWithTransactions([tx], { decisions: [decision], plans: [plan], executionLinks: [link] });
}

function unplannedOperation(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 600, status: "confirmed" });
  const scenario = baseWithTransactions([tx]);
  return {
    ...scenario,
    scope: {
      ...scenario.scope,
      managementStartedAt: "2026-07-01T08:00:00.000Z",
      operationReviewFrom: "2026-07-02",
    },
  };
}

function overPlanOperation(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 1200, confirmedAmount: 1200, sourceTransactionId: "biz-2", status: "confirmed" });
  const decision = makeDecisionRecord({
    id: "dec:buy-f001-2",
    scopeId: "scope:demo",
    direction: "BUY",
    assetId: "F001",
    plannedAmount: 600,
    allowedWindow: { start: "2026-07-01", end: "2026-07-31" },
    decidedAt: "2026-07-01",
    strategyRuleVersionId: "srv:demo:v1",
  });
  const link = makeExecutionLink({ transactionId: tx.id, decisionRecordId: decision.id, linkMethod: "declared", confidence: "high" });
  return baseWithTransactions([tx], { decisions: [decision], plans: [makeOperationPlan({ id: "plan:buy-f001-2", decisionRecordId: decision.id, scopeId: "scope:demo", plannedValue: 600, unit: "CNY" })], executionLinks: [link] });
}

function pauseConflictOperation(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 600, sourceTransactionId: "biz-3", status: "confirmed" });
  const decision = makeDecisionRecord({
    id: "dec:buy-f001-3",
    scopeId: "scope:demo",
    direction: "BUY",
    assetId: "F001",
    plannedAmount: 600,
    allowedWindow: { start: "2026-07-01", end: "2026-07-31" },
    decidedAt: "2026-07-01",
    strategyRuleVersionId: "srv:pause:v1",
  });
  const link = makeExecutionLink({ transactionId: tx.id, decisionRecordId: decision.id, linkMethod: "declared", confidence: "high" });
  const base = noOperationInBounds();
  return {
    ...baseWithTransactions([tx], { decisions: [decision], executionLinks: [link] }),
    rules: [
      {
        id: "srv:pause:v1",
        scopeId: "scope:demo",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [
          { kind: "position_band", minPct: 0, maxPct: 0.5 },
          { kind: "pause_window", assetId: "F001", window: { start: "2026-07-01", end: "2026-07-31" }, reason: "暂停新增" },
        ],
      },
    ],
  };
}

function historicalAmountOnly(): ReviewScenario {
  // 建立历史基线：F004 多笔小额买入 + 一笔 3 倍大额但仍在计划内。
  const txs = [
    makeTransaction({ occurredAt: "2026-05-09", assetId: "F004", type: "BUY", amount: 1000, status: "confirmed" }),
    makeTransaction({ occurredAt: "2026-06-09", assetId: "F004", type: "BUY", amount: 1000, status: "confirmed" }),
    makeTransaction({ occurredAt: "2026-07-09", assetId: "F004", type: "BUY", amount: 1000, status: "confirmed" }),
    makeTransaction({ occurredAt: "2026-08-03", assetId: "F004", type: "BUY", amount: 12000, sourceTransactionId: "biz-big", status: "confirmed" }),
  ];
  const decision = makeDecisionRecord({
    id: "dec:buy-f004-big",
    scopeId: "scope:demo",
    direction: "BUY",
    assetId: "F004",
    plannedAmount: 12000,
    allowedWindow: { start: "2026-08-01", end: "2026-08-31" },
    decidedAt: "2026-08-01",
    strategyRuleVersionId: "srv:demo:v1",
  });
  const link = makeExecutionLink({ transactionId: txs[3].id, decisionRecordId: decision.id, linkMethod: "declared", confidence: "high" });
  return baseWithTransactions(txs, { decisions: [decision], executionLinks: [link] });
}

function partialConfirmation(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 1200, confirmedAmount: 600, sourceTransactionId: "biz-4", status: "partially_confirmed" });
  const decision = makeDecisionRecord({
    id: "dec:buy-f001-4",
    scopeId: "scope:demo",
    direction: "BUY",
    assetId: "F001",
    plannedAmount: 1200,
    allowedWindow: { start: "2026-07-01", end: "2026-07-31" },
    decidedAt: "2026-07-01",
    strategyRuleVersionId: "srv:demo:v1",
  });
  const link = makeExecutionLink({ transactionId: tx.id, decisionRecordId: decision.id, linkMethod: "declared", confidence: "high" });
  return baseWithTransactions([tx], { decisions: [decision], executionLinks: [link] });
}

function pendingOrDuplicate(): ReviewScenario {
  const tx = makeTransaction({ occurredAt: "2026-07-09", assetId: "F001", type: "BUY", amount: 600, sourceTransactionId: "biz-5", status: "requested" });
  return baseWithTransactions([tx]);
}

// ---- WP0-3 场景：仓位、移动止损、减仓恢复 ----

function positionOverLimit(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "position-over-limit",
    description: "F001 仓位 42% 超过上限 30%；手算 deviation 一致",
    rules: [
      {
        id: "srv:position-cap:v1",
        scopeId: "scope:demo",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [{ kind: "position_band", assetId: "F001", minPct: 0, maxPct: 0.3, targetPct: 0.2 }],
      },
    ],
  };
}

function scopeMismatch(): ReviewScenario {
  const base = noOperationInBounds();
  return {
    ...base,
    name: "scope-mismatch",
    description: "基金市值与分母来自不同范围，仓位为 INSUFFICIENT_DATA，不拼接",
    scope: {
      ...base.scope,
      scopeId: "scope:mismatch",
      denominatorSource: "account_total_asset",
      denominatorCoverage: makeCoverage({
        dataset: "account",
        completeness: "partial",
        knownRanges: [{ start: "2026-08-08", end: "2026-08-08" }],
        warningCodes: ["scope-mismatch:denominator-from-other-scope"],
      }),
    },
  };
}

function stopBase(prevHwm: number, prevStop: number, nav: number, navDate: string, name: string, description: string): ReviewScenario {
  const holdings = [makeHolding({ assetId: "F001", name: ASSET_F001.name, marketValue: 18204, shares: 7929, nav, navDate })];
  const totalAsset = holdings.reduce((s, h) => s + h.marketValue, 0);
  return {
    name,
    description,
    scope: {
      scopeId: `scope:${name}`,
      scopeType: "DECLARED_PORTFOLIO",
      includedAssetIds: ["F001"],
      baseCurrency: "CNY",
      denominatorSource: "account_total_asset",
      denominatorAsOf: DEFAULT_AS_OF,
      denominatorCoverage: makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      effectiveFrom: "2026-01-01",
      version: 1,
    },
    rules: [
      {
        id: `srv:${name}:v1`,
        scopeId: `scope:${name}`,
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [{ kind: "trailing_stop", assetId: "F001", basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2026-01-01" }],
      },
    ],
    facts: {
      account: makeAccount({ source: "review", totalAsset, capturedAt: `${DEFAULT_AS_OF}T08:30:00+08:00` }),
      portfolio: makePortfolio({ holdings, totalAsset }),
      assets: [ASSET_F001],
      transactions: [],
      dailyPnl: [],
      coverage: fullCoverage(),
    },
    previousTrailingStops: [
      makeStoredTrailingStopState({
        id: `tss:scope:${name}:F001`,
        scopeId: `scope:${name}`,
        assetId: "F001",
        ruleVersionId: `srv:${name}:v1`,
        previousHighWaterMark: prevHwm,
        currentHighWaterMark: prevHwm,
        stopLine: prevStop,
        navBasis: "nav_adjusted",
        asOf: "2026-08-07",
      }),
    ],
    asOf: DEFAULT_AS_OF,
  };
}

function stopNewHigh(): ReviewScenario {
  // prev hwm 2.0 stop 1.8；当前 2.2611 创新高 → 上移
  return stopBase(2.0, 1.8, 2.2611, "2026-08-08", "stop-new-high", "NAV 创新高，high-water mark 与 stop line 上移");
}

function stopNoNewHigh(): ReviewScenario {
  // prev hwm 2.3 stop 2.07；当前 2.2611 未创新高 → stop line 不动
  return stopBase(2.3, 2.07, 2.2611, "2026-08-08", "stop-no-new-high", "NAV 未创新高，stop line 不变（绝不下移）");
}

function staleNavStop(): ReviewScenario {
  // 当前 NAV 但日期陈旧 → 不推进
  return stopBase(2.3, 2.07, 2.2611, "2026-07-01", "stale-nav-stop", "NAV 过期，不推进高水位，不生成确定性触发");
}

function navBasisUnknown(): ReviewScenario {
  const sc = stopBase(2.0, 1.8, 2.2611, "2026-08-08", "nav-basis-unknown", "分红/复权 basis 语义不清 → stop state 为 unknown，历史状态保留");
  return {
    ...sc,
    rules: [
      {
        id: "srv:nav-basis-unknown:v1",
        scopeId: "scope:nav-basis-unknown",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [{ kind: "trailing_stop", assetId: "F001", basis: "unknown", drawdownPct: 0.1, effectiveFrom: "2026-01-01" }],
      },
    ],
    previousTrailingStops: [
      makeStoredTrailingStopState({
        id: "tss:scope:nav-basis-unknown:F001",
        scopeId: "scope:nav-basis-unknown",
        assetId: "F001",
        ruleVersionId: "srv:nav-basis-unknown:v1",
        previousHighWaterMark: 2.0,
        currentHighWaterMark: 2.0,
        stopLine: 1.8,
        navBasis: "unknown",
        asOf: "2026-08-07",
      }),
    ],
  };
}

// ---- 综合演示场景：三栏均有内容，用于人工审查 ----
function reviewDemoCombined(): ReviewScenario {
  const holdings = [
    makeHolding({ assetId: "F001", name: ASSET_F001.name, marketValue: 25200, shares: 11146, nav: 2.2611, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F002", name: ASSET_F002.name, marketValue: 12000, shares: 5020, nav: 2.39, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F003", name: ASSET_F003.name, marketValue: 9000, shares: 5142, nav: 1.75, navDate: "2026-08-08" }),
    makeHolding({ assetId: "F004", name: ASSET_F004.name, marketValue: 13800, shares: 6764, nav: 2.04, navDate: "2026-08-08" }),
  ];
  const totalAsset = holdings.reduce((s, h) => s + h.marketValue, 0); // 60000
  const tx1 = makeTransaction({ occurredAt: "2026-08-08", assetId: "F002", type: "BUY", amount: 1000, sourceTransactionId: "cbiz-1", status: "confirmed" });
  const tx2 = makeTransaction({ occurredAt: "2026-08-08", assetId: "F004", type: "BUY", amount: 5000, sourceTransactionId: "cbiz-2", status: "confirmed" });
  const tx3 = makeTransaction({ occurredAt: "2026-08-08", assetId: "F001", type: "BUY", amount: 600, confirmedAmount: 300, sourceTransactionId: "cbiz-3", status: "partially_confirmed" });
  const tx4 = makeTransaction({ occurredAt: "2026-08-08", assetId: "F003", type: "SELL", amount: 2000, sourceTransactionId: "cbiz-4", status: "requested" });
  const dec1 = makeDecisionRecord({
    id: "dec:c:buy-f002",
    scopeId: "scope:combined",
    direction: "BUY",
    assetId: "F002",
    plannedAmount: 1000,
    allowedWindow: { start: "2026-08-01", end: "2026-08-31" },
    decidedAt: "2026-08-01",
    rationale: "F002 月度定投",
    strategyRuleVersionId: "srv:combined:v1",
  });
  const dec3 = makeDecisionRecord({
    id: "dec:c:buy-f001",
    scopeId: "scope:combined",
    direction: "BUY",
    assetId: "F001",
    plannedAmount: 600,
    allowedWindow: { start: "2026-08-01", end: "2026-08-31" },
    decidedAt: "2026-08-01",
    rationale: "F001 计划加仓",
    strategyRuleVersionId: "srv:combined:v1",
  });
  return {
    name: "review-demo-combined",
    description: "综合演示：仓位越界 + 止损触发 + 计划外操作 + 部分确认 + 待确认，三栏均有内容",
    scope: {
      scopeId: "scope:combined",
      scopeType: "DECLARED_PORTFOLIO",
      includedAssetIds: ["F001", "F002", "F003", "F004"],
      baseCurrency: "CNY",
      denominatorSource: "account_total_asset",
      denominatorAsOf: DEFAULT_AS_OF,
      denominatorCoverage: makeCoverage({ dataset: "account", completeness: "complete", knownRanges: [{ start: "2026-01-01", end: "2026-08-08" }] }),
      effectiveFrom: "2026-01-01",
      version: 1,
    },
    rules: [
      {
        id: "srv:combined:v1",
        scopeId: "scope:combined",
        version: 1,
        effectiveFrom: "2026-01-01",
        rules: [
          { kind: "position_band", assetId: "F001", minPct: 0, maxPct: 0.3, targetPct: 0.2 },
          { kind: "position_band", assetId: "F003", minPct: 0.05, maxPct: 0.25 },
          { kind: "trailing_stop", assetId: "F001", basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2026-01-01" },
          { kind: "trailing_stop", assetId: "F003", basis: "nav_adjusted", drawdownPct: 0.1, effectiveFrom: "2026-01-01" },
        ],
      },
    ],
    facts: {
      account: makeAccount({ source: "review-combined", totalAsset, capturedAt: `${DEFAULT_AS_OF}T08:30:00+08:00` }),
      portfolio: makePortfolio({ holdings, totalAsset }),
      assets: ALL_ASSETS,
      transactions: [tx1, tx2, tx3, tx4],
      dailyPnl: [],
      coverage: fullCoverage(),
    },
    decisions: [dec1, dec3],
    plans: [
      makeOperationPlan({ id: "plan:c:buy-f002", decisionRecordId: dec1.id, scopeId: "scope:combined", plannedValue: 1000, unit: "CNY" }),
      makeOperationPlan({ id: "plan:c:buy-f001", decisionRecordId: dec3.id, scopeId: "scope:combined", plannedValue: 600, unit: "CNY" }),
    ],
    executionLinks: [
      makeExecutionLink({ transactionId: tx1.id, decisionRecordId: dec1.id, linkMethod: "declared", confidence: "high" }),
      makeExecutionLink({ transactionId: tx3.id, decisionRecordId: dec3.id, linkMethod: "declared", confidence: "high" }),
    ],
    previousTrailingStops: [
      makeStoredTrailingStopState({
        id: "tss:scope:combined:F001",
        scopeId: "scope:combined",
        assetId: "F001",
        ruleVersionId: "srv:combined:v1",
        previousHighWaterMark: 2.3,
        currentHighWaterMark: 2.3,
        stopLine: 2.07,
        navBasis: "nav_adjusted",
        asOf: "2026-08-07",
      }),
      makeStoredTrailingStopState({
        id: "tss:scope:combined:F003",
        scopeId: "scope:combined",
        assetId: "F003",
        ruleVersionId: "srv:combined:v1",
        previousHighWaterMark: 2.5,
        currentHighWaterMark: 2.5,
        stopLine: 2.25,
        navBasis: "nav_adjusted",
        asOf: "2026-08-07",
      }),
    ],
    asOf: DEFAULT_AS_OF,
  };
}

export function getReviewScenario(name: string): ReviewScenario {
  const factory = scenarios[name];
  if (!factory) throw new Error(`getReviewScenario: 未知场景 ${name}`);
  return factory();
}

export function listReviewScenarios(): string[] {
  return Object.keys(scenarios);
}