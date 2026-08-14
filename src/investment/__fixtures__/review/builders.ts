/**
 * Investment Review P0 fixture 构建器（WP0-1 ~ WP0-3）。
 *
 * 全部人工虚构：基金代码 F001-F004，金额整数，日期落在 2026 年固定基准。
 * 禁止姓名替换/金额缩放等伪脱敏；不可还原任何真实账户。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  DailyPnL,
  DataCoverage,
  DecisionRecord,
  ExecutionLink,
  HoldingSnapshot,
  InvestmentScope,
  OperationPlan,
  PortfolioSnapshot,
  ReductionPlan,
  StrategyRule,
  StrategyRuleVersion,
  Transaction,
} from "../../domain";
import { makeAccount, makeAsset, makeCoverage, makeHolding, makePortfolio } from "../builders";
import type { ReviewFacts } from "../../engines/review/scope";
import type { StoredTrailingStopState } from "../../ledger/repository";

export type PartialContract<T> = Partial<T>;

const DEFAULT_AS_OF = "2026-08-09";

// ---- InvestmentScope ----

export function makeScope(o: PartialContract<InvestmentScope> & Pick<InvestmentScope, "scopeId">): InvestmentScope {
  return {
    scopeType: o.scopeType ?? "DECLARED_PORTFOLIO",
    includedAssetIds: o.includedAssetIds ?? ["F001", "F002", "F003", "F004"],
    excludedAssetIds: o.excludedAssetIds,
    baseCurrency: o.baseCurrency ?? "CNY",
    denominatorSource: o.denominatorSource ?? "account_total_asset",
    denominatorAsOf: o.denominatorAsOf ?? DEFAULT_AS_OF,
    denominatorCoverage: o.denominatorCoverage,
    effectiveFrom: o.effectiveFrom ?? "2026-01-01",
    effectiveTo: o.effectiveTo,
    managementStartedAt: o.managementStartedAt,
    operationReviewFrom: o.operationReviewFrom,
    version: o.version ?? 1,
    scopeId: o.scopeId,
  };
}

// ---- StrategyRuleVersion ----

export function makeStrategyRuleVersion(
  o: PartialContract<StrategyRuleVersion> & Pick<StrategyRuleVersion, "id" | "scopeId" | "rules">,
): StrategyRuleVersion {
  return {
    id: o.id,
    scopeId: o.scopeId,
    version: o.version ?? 1,
    effectiveFrom: o.effectiveFrom ?? "2026-01-01",
    effectiveTo: o.effectiveTo,
    rules: o.rules,
    changeReason: o.changeReason,
  };
}

export function makePositionBand(o: { assetId?: string; minPct: number; maxPct: number; targetPct?: number }): StrategyRule {
  return { kind: "position_band", assetId: o.assetId, minPct: o.minPct, maxPct: o.maxPct, targetPct: o.targetPct };
}

export function makeTrailingStopRule(o: { assetId: string; drawdownPct: number; basis?: "nav_adjusted" | "nav_unadjusted" | "unknown"; effectiveFrom?: string }): StrategyRule {
  return {
    kind: "trailing_stop",
    assetId: o.assetId,
    basis: o.basis ?? "nav_adjusted",
    drawdownPct: o.drawdownPct,
    effectiveFrom: o.effectiveFrom ?? "2026-01-01",
  };
}

export function makeReductionTarget(o: { assetId: string; targetMinPct: number; targetMaxPct: number }): StrategyRule {
  return { kind: "reduction_target", assetId: o.assetId, targetMinPct: o.targetMinPct, targetMaxPct: o.targetMaxPct };
}

export function makePauseWindow(o: { assetId?: string; start: string; end: string; reason?: string }): StrategyRule {
  return { kind: "pause_window", assetId: o.assetId, window: { start: o.start, end: o.end }, reason: o.reason };
}

// ---- DecisionRecord / OperationPlan / ExecutionLink ----

export function makeDecisionRecord(
  o: PartialContract<DecisionRecord> & Pick<DecisionRecord, "id" | "scopeId" | "direction" | "decidedAt">,
): DecisionRecord {
  return {
    id: o.id,
    scopeId: o.scopeId,
    policyVersionId: o.policyVersionId,
    strategyRuleVersionId: o.strategyRuleVersionId,
    assetId: o.assetId,
    direction: o.direction,
    plannedAmount: o.plannedAmount,
    plannedShares: o.plannedShares,
    plannedPct: o.plannedPct,
    allowedWindow: o.allowedWindow,
    rationale: o.rationale,
    decidedAt: o.decidedAt,
    failsIf: o.failsIf,
    status: o.status ?? "recorded",
    annotations: o.annotations ?? [],
    immutable: true,
  };
}

export function makeOperationPlan(
  o: PartialContract<OperationPlan> & Pick<OperationPlan, "id" | "decisionRecordId" | "scopeId" | "plannedValue" | "unit">,
): OperationPlan {
  return {
    id: o.id,
    decisionRecordId: o.decisionRecordId,
    scopeId: o.scopeId,
    plannedValue: o.plannedValue,
    unit: o.unit,
    executionWindow: o.executionWindow,
    ruleVersionRefs: o.ruleVersionRefs ?? [],
  };
}

export function makeExecutionLink(o: PartialContract<ExecutionLink>): ExecutionLink {
  return {
    id: o.id ?? `link:${o.transactionId ?? "na"}:${o.decisionRecordId ?? "na"}`,
    transactionId: o.transactionId,
    decisionRecordId: o.decisionRecordId,
    linkMethod: o.linkMethod ?? "unlinked",
    confidence: o.confidence ?? "unknown",
    note: o.note,
  };
}

// ---- ReductionPlan / StoredTrailingStopState ----

export function makeReductionPlan(
  o: PartialContract<ReductionPlan> & Pick<ReductionPlan, "id" | "scopeId" | "assetId" | "triggerJudgmentId" | "planned">,
): ReductionPlan {
  return {
    id: o.id,
    scopeId: o.scopeId,
    assetId: o.assetId,
    triggerJudgmentId: o.triggerJudgmentId,
    targetBand: o.targetBand ?? { minPct: 0, maxPct: 0.2 },
    planned: o.planned,
    unit: o.unit ?? "CNY",
    ruleVersionRefs: o.ruleVersionRefs ?? [],
    createdAt: o.createdAt ?? DEFAULT_AS_OF,
  };
}

export function makeStoredTrailingStopState(
  o: PartialContract<StoredTrailingStopState> & Pick<StoredTrailingStopState, "id" | "scopeId" | "assetId" | "ruleVersionId">,
): StoredTrailingStopState {
  return {
    id: o.id,
    scopeId: o.scopeId,
    assetId: o.assetId,
    ruleVersionId: o.ruleVersionId,
    previousHighWaterMark: o.previousHighWaterMark,
    currentHighWaterMark: o.currentHighWaterMark,
    stopLine: o.stopLine,
    navBasis: o.navBasis ?? "nav_adjusted",
    asOf: o.asOf ?? DEFAULT_AS_OF,
    triggered: o.triggered ?? false,
  };
}

// ---- ReviewFacts 复用现有 builders ----

export function makeReviewHolding(o: PartialContract<HoldingSnapshot> & Pick<HoldingSnapshot, "assetId" | "marketValue">): HoldingSnapshot {
  return makeHolding(o);
}

export function makeReviewAsset(o: PartialContract<AssetMetadata> & Pick<AssetMetadata, "assetId">): AssetMetadata {
  return makeAsset(o);
}

export function makeReviewCoverage(o: PartialContract<DataCoverage> & Pick<DataCoverage, "dataset">): DataCoverage {
  return makeCoverage(o);
}

export function makeReviewAccount(o: PartialContract<AccountSnapshot> & Pick<AccountSnapshot, "totalAsset">): AccountSnapshot {
  return makeAccount(o);
}

export function makeReviewPortfolio(o: PartialContract<PortfolioSnapshot> & Pick<PortfolioSnapshot, "holdings">): PortfolioSnapshot {
  return makePortfolio(o);
}

/** 组装一个 ReviewFacts，便于在场景里一次性给出 account/portfolio/transactions/dailyPnl/coverage。 */
export function makeReviewFacts(o: Partial<ReviewFacts> & Pick<ReviewFacts, "assets" | "transactions" | "dailyPnl" | "coverage">): ReviewFacts {
  return {
    account: o.account,
    portfolio: o.portfolio,
    assets: o.assets,
    transactions: o.transactions,
    dailyPnl: o.dailyPnl,
    coverage: o.coverage,
  };
}

export { makeAccount, makeHolding, makeTransaction, makeDailyPnl, makeAsset, makeCoverage, makePortfolio } from "../builders";
export { DEFAULT_AS_OF };
export type { DailyPnL, Transaction } from "../../domain";