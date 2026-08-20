/**
 * Investment Review P0 编排（WP0-4）。
 *
 * 把仓位 / 操作合规 / 移动止损 / 减仓进度四个确定性引擎汇成一次复盘的不可变 ReviewSnapshot。
 * UI 只消费 snapshot，不重算 Core。纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type {
  DecisionRecord,
  ExecutionLink,
  InvestmentScope,
  JudgmentResult,
  OperationPlan,
  PerJudgmentCoverage,
  ReductionPlan,
  ReviewAction,
  ReviewSnapshot,
  StrategyRuleVersion,
  Transaction,
} from "../../domain";
import { gatherScopeFacts, buildPerJudgmentCoverage, type ReviewFacts } from "./scope";
import { evaluateOperationCompliance } from "./operation-compliance";
import { evaluatePosition } from "./position";
import { advanceTrailingStop } from "./trailing-stop";
import { computeReductionProgress } from "./reduction";
import { evaluateTakeProfit } from "./take-profit";
import type { StoredTrailingStopState } from "../../ledger/repository";

export type ReviewVerdict = "needs_action" | "conforming" | "undetermined";

export interface PostReductionSnapshot {
  assetId: string;
  positionPct?: number;
  eligible: boolean;
}

export interface ReviewInput {
  scope: InvestmentScope;
  facts: ReviewFacts;
  rules: StrategyRuleVersion[];
  decisions?: DecisionRecord[];
  plans?: OperationPlan[];
  links?: ExecutionLink[];
  previousTrailingStops?: StoredTrailingStopState[];
  reductionPlans?: ReductionPlan[];
  /** 可选的操作核对窗口；未传时沿用 facts.transactions。 */
  operationTransactions?: Transaction[];
  /** 可选的跨期减仓执行事实；未传时沿用 facts.transactions。 */
  reductionTransactions?: Transaction[];
  /** 减仓操作后快照（用于恢复复核）；缺省则对应资产减仓判断的 postEligible=false。 */
  postSnapshots?: PostReductionSnapshot[];
  /** 真实账户的管理边界；未传 scope 时沿用既有全量判断。 */
  management?: {
    operationReviewEnabled: boolean;
    historicalBaselineTransactions: number;
  };
  asOf: string;
}

function isNavFresh(navDate: string | undefined, asOf: string): boolean {
  if (!navDate) return false;
  const a = new Date(navDate + "T00:00:00Z").getTime();
  const b = new Date(asOf.slice(0, 10) + "T00:00:00Z").getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return b - a <= 7 * 86400000 && b >= a - 0;
}

/** 一次复盘只消费截至 asOf 最新的完整规则集，历史版本不重复生成判断。 */
export function resolveActiveStrategyRuleVersion(
  versions: StrategyRuleVersion[],
  scopeId: string,
  asOf: string,
): StrategyRuleVersion | undefined {
  return versions
    .filter((version) =>
      version.scopeId === scopeId
      && version.effectiveFrom <= asOf
      && (!version.effectiveTo || version.effectiveTo >= asOf),
    )
    .sort((a, b) => {
      const byDate = a.effectiveFrom.localeCompare(b.effectiveFrom);
      return byDate || a.version - b.version;
    })
    .at(-1);
}

function reviewRevision(input: ReviewInput, activeVersion?: StrategyRuleVersion): string {
  const material = JSON.stringify({
    scope: input.scope,
    rule: activeVersion,
    facts: input.facts,
    decisions: input.decisions ?? [],
    plans: input.plans ?? [],
    links: input.links ?? [],
    previousTrailingStops: input.previousTrailingStops ?? [],
    reductionPlans: input.reductionPlans ?? [],
    operationTransactions: input.operationTransactions ?? [],
    reductionTransactions: input.reductionTransactions ?? [],
    postSnapshots: input.postSnapshots ?? [],
    management: input.management,
  });
  let hash = 2166136261;
  for (let index = 0; index < material.length; index++) {
    hash ^= material.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export interface ReviewComputation {
  snapshot: ReviewSnapshot;
  nextTrailingStates: StoredTrailingStopState[];
}

/** 按问题与用户处置状态分类：需处理 / 已符合 / 暂不能判断。 */
export function classifyReviewJudgment(
  j: JudgmentResult<unknown>,
  action?: ReviewAction,
): ReviewVerdict {
  if (action) {
    if (action.kind === "needy_action") return "needs_action";
    if (action.kind === "resolved" && classifyReviewJudgment(j) === "conforming") return "conforming";
    return "undetermined";
  }
  if (j.status === "UNKNOWN" || j.status === "INSUFFICIENT_DATA" || j.status === "STALE" || j.status === "FAILED" || j.status === "PARTIAL") {
    // PARTIAL / FAILED / STALE / UNKNOWN / INSUFFICIENT_DATA 默认暂不能判断；
    // 操作合规的 BREACH（VALID）已在下面处理。
  }
  const value = j.value as Record<string, unknown>;
  switch (j.question) {
    case "operation_compliance": {
      const conclusion = value.conclusion as string;
      if (conclusion === "BREACH") return "needs_action";
      if (conclusion === "COMPLIANT") return "conforming";
      return "undetermined";
    }
    case "position": {
      const dev = value.deviation as { direction?: string } | undefined;
      if (dev?.direction === "over" || dev?.direction === "under") return "needs_action";
      if (dev?.direction === "within") return "conforming";
      return "undetermined";
    }
    case "trailing_stop": {
      if (value.triggered === true) return "needs_action";
      if (j.status === "VALID") return "conforming";
      return "undetermined";
    }
    case "take_profit": {
      if (value.triggered === true) return "needs_action";
      if (j.status === "VALID") return "conforming";
      return "undetermined";
    }
    case "reduction_progress": {
      const state = value.state as string;
      if (state === "restored") return "conforming";
      if (state === "requested" || state === "partially_confirmed" || state === "confirmed") return "undetermined";
      return "needs_action";
    }
    default:
      return "undetermined";
  }
}

export function computeReview(input: ReviewInput): ReviewComputation {
  const { scope, facts, rules, asOf } = input;
  const activeRuleVersion = resolveActiveStrategyRuleVersion(rules, scope.scopeId, asOf);
  const activeRules = activeRuleVersion ? [activeRuleVersion] : [];
  const scopeFacts = gatherScopeFacts(scope, facts);
  const baseCoverages = buildPerJudgmentCoverage(scope, facts, asOf);
  const coverageByQuestion: Record<string, PerJudgmentCoverage> = {
    operation: baseCoverages.find((c) => c.judgmentId === "operation")!,
    position: baseCoverages.find((c) => c.judgmentId === "position")!,
    trailing_stop: baseCoverages.find((c) => c.judgmentId === "trailing_stop")!,
    reduction: baseCoverages.find((c) => c.judgmentId === "reduction")!,
    take_profit: baseCoverages.find((c) => c.judgmentId === "take_profit")!,
  };

  const judgments: JudgmentResult<unknown>[] = [];
  const nextTrailingStates: StoredTrailingStopState[] = [];

  // 仓位：每条 position_band 规则一个判断（单基金规则若该标的无持仓则跳过——未持有无需判仓位）
  for (const version of activeRules) {
    for (const rule of version.rules) {
      if (rule.kind === "position_band") {
        if (rule.assetId && !scopeFacts.holdings.some((h) => h.assetId === rule.assetId)) continue;
        judgments.push(
          evaluatePosition({
            scopeFacts,
            rule,
            ruleVersionId: version.id,
            coverage: { ...coverageByQuestion.position },
            asOf,
          }),
        );
      }
    }
  }

  // 移动止损：每条 trailing_stop 规则一个判断（无持仓标的跳过——没买的基金无需止损判断）
  for (const version of activeRules) {
    for (const rule of version.rules) {
      if (rule.kind !== "trailing_stop") continue;
      const holding = scopeFacts.holdings.find((h) => h.assetId === rule.assetId);
      if (!holding) continue;
      const prev = input.previousTrailingStops?.find((s) => s.assetId === rule.assetId);
      const { judgment, nextState } = advanceTrailingStop({
        scopeId: scope.scopeId,
        assetId: rule.assetId,
        rule,
        ruleVersionId: version.id,
        previousState: prev,
        currentNav: holding?.nav,
        navAsOf: holding?.navDate,
        navFresh: isNavFresh(holding?.navDate, asOf),
        coverage: { ...coverageByQuestion.trailing_stop },
        asOf,
      });
      judgments.push(judgment);
      nextTrailingStates.push(nextState);
    }
  }

  // 目标收益率止盈：每条 take_profit 规则一个判断（无持仓跳过——没买的基金无需止盈判断）
  for (const version of activeRules) {
    for (const rule of version.rules) {
      if (rule.kind !== "take_profit") continue;
      const holding = scopeFacts.holdings.find((h) => h.assetId === rule.assetId);
      if (!holding) continue;
      judgments.push(
        evaluateTakeProfit({
          assetId: rule.assetId,
          rule,
          ruleVersionId: version.id,
          costValue: holding.costValue,
          marketValue: holding.marketValue,
          navAsOf: holding.navDate,
          coverage: { ...coverageByQuestion.take_profit },
          asOf,
        }),
      );
    }
  }

  // 操作合规：只有用户明确启用计划核对后，才按范围内每笔交易判断。
  if (input.management?.operationReviewEnabled !== false) {
    judgments.push(
      ...evaluateOperationCompliance({
        transactions: (input.operationTransactions ?? scopeFacts.transactions).filter(
          (transaction) => !scope.operationReviewFrom
            || transaction.occurredAt.slice(0, 10) >= scope.operationReviewFrom,
        ),
        decisions: input.decisions ?? [],
        plans: input.plans ?? [],
        links: input.links ?? [],
        rules: activeRules,
        asOf,
        coverage: { ...coverageByQuestion.operation },
      }),
    );
  }

  // 减仓：每条 reduction_target 规则一个判断（通常在仓位越界后由人创建计划）
  for (const version of activeRules) {
    for (const rule of version.rules) {
      if (rule.kind !== "reduction_target") continue;
      const post = input.postSnapshots?.find((p) => p.assetId === rule.assetId);
      const plan = input.reductionPlans
        ?.filter((item) => item.assetId === rule.assetId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .at(-1);
      const trigger = judgments.find((judgment) => {
        const value = judgment.value as Record<string, unknown>;
        if (value.assetId !== rule.assetId) return false;
        if (judgment.question === "position") {
          return (value.deviation as { direction?: string } | undefined)?.direction === "over";
        }
        return (judgment.question === "trailing_stop" || judgment.question === "take_profit")
          && value.triggered === true;
      });
      if (!plan && !trigger) continue;
      judgments.push(
        computeReductionProgress({
          scopeId: scope.scopeId,
          assetId: rule.assetId,
          triggerJudgmentId: plan?.triggerJudgmentId ?? trigger!.judgmentId,
          targetBand: { minPct: rule.targetMinPct, maxPct: rule.targetMaxPct },
          plan,
          transactions: input.reductionTransactions ?? scopeFacts.transactions,
          postPositionPct: post?.positionPct,
          postEligible: post?.eligible ?? false,
          ruleVersionRefs: [version.id],
          coverage: { ...coverageByQuestion.reduction },
          asOf,
        }),
      );
    }
  }

  const reviewActions: ReviewAction[] = [];
  let breached = 0;
  let unknown = 0;
  let conforming = 0;
  for (const j of judgments) {
    const verdict = classifyReviewJudgment(j);
    if (verdict === "needs_action") {
      breached++;
      reviewActions.push({
        id: `act:review:${scope.scopeId}:${j.judgmentId}`,
        scopeId: scope.scopeId,
        judgmentId: j.judgmentId,
        kind: "needy_action",
        createdAt: asOf,
      });
    } else if (verdict === "conforming") {
      conforming++;
    } else {
      unknown++;
    }
  }

  const snapshot: ReviewSnapshot = {
    id: `review:${scope.scopeId}:${asOf}:${reviewRevision(input, activeRuleVersion)}`,
    scopeId: scope.scopeId,
    asOf,
    judgments,
    reviewActions,
    coverageSummary: {
      checked: judgments.length,
      breached,
      unknown,
      conforming,
    },
    managementSummary: input.management
      ? {
          managementStartedAt: scope.managementStartedAt,
          operationReviewFrom: scope.operationReviewFrom,
          operationReviewEnabled: input.management.operationReviewEnabled,
          historicalBaselineTransactions: input.management.historicalBaselineTransactions,
        }
      : undefined,
    createdAt: asOf,
    immutable: true,
  };
  return { snapshot, nextTrailingStates };
}

/** 兼容现有调用方：只需要只读快照时仍返回 ReviewSnapshot。 */
export function runReview(input: ReviewInput): ReviewSnapshot {
  return computeReview(input).snapshot;
}
