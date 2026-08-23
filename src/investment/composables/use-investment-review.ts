/**
 * useInvestmentReview：Investment Review P0 一页复盘的响应式入口（WP0-4）。
 *
 * 单例 reactive state。Core 由 computeReview 纯函数计算，UI 只消费 snapshot / conclusions，
 * 不重算 Core。只从 Ledger 加载真实来源事实、用户范围与规则。
 */
import { computed, reactive } from "vue";
import type {
  InvestmentScope,
  JudgmentResult,
  PortfolioSnapshot,
  ReductionPlan,
  ReviewAction,
  ReviewActionKind,
  ReviewSnapshot,
  Transaction,
} from "../domain";
import { comparableTransactionValue } from "../domain";
import { InvestmentLedger } from "../ledger/repository";
import {
  classifyReviewJudgment,
  computeReview,
  resolveActiveStrategyRuleVersion,
  type PostReductionSnapshot,
  type ReviewComputation,
  type ReviewInput,
} from "../engines/review/review-orchestrator";
import { buildReviewConclusions, type ReviewConclusions } from "./selectors";
import { useInvestmentOS } from "./use-investment-os";

interface InvestmentReviewState {
  loaded: boolean;
  running: boolean;
  error?: string;
  snapshot?: ReviewSnapshot;
  scenarioName?: string;
}

const state = reactive<InvestmentReviewState>({
  loaded: false,
  running: false,
});

let ledger: InvestmentLedger | null = null;

function getLedger(): InvestmentLedger {
  if (!ledger) ledger = new InvestmentLedger();
  return ledger;
}

function normalizedPlanUnit(unit: string): "CNY" | "shares" | "pct" | undefined {
  const normalized = unit.trim().toLowerCase();
  if (["cny", "rmb", "元", "人民币"].includes(normalized)) return "CNY";
  if (["shares", "share", "份", "份额"].includes(normalized)) return "shares";
  if (["pct", "%", "percent", "percentage"].includes(normalized)) return "pct";
  return undefined;
}

/**
 * 只有全额确认后的新组合快照才可用于“已恢复”复核。账户分母之外的声明组合没有可验证的
 * 历史分母契约，因此保持 postEligible=false，不用当前快照倒推历史恢复。
 */
export function buildPostReductionSnapshots(
  scope: InvestmentScope,
  plans: ReductionPlan[],
  transactions: Transaction[],
  portfolios: PortfolioSnapshot[],
  asOf: string,
): PostReductionSnapshot[] {
  const latestPlans = new Map<string, ReductionPlan>();
  for (const plan of [...plans].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    latestPlans.set(plan.assetId, plan);
  }

  return [...latestPlans.values()].map((plan) => {
    const confirmedExecutions = transactions.filter((transaction) =>
      transaction.assetId === plan.assetId
      && transaction.type === "SELL"
      && transaction.status === "confirmed"
      && transaction.occurredAt.slice(0, 10) >= plan.createdAt.slice(0, 10)
      && normalizedPlanUnit(transaction.amountUnit) === plan.unit,
    );
    const confirmed = confirmedExecutions.reduce(
      (sum, transaction) => sum + comparableTransactionValue(transaction),
      0,
    );
    if (confirmed < plan.planned) {
      return { assetId: plan.assetId, eligible: false };
    }

    const confirmedThrough = confirmedExecutions
      .map((transaction) => transaction.occurredAt.slice(0, 10))
      .sort()
      .at(-1);
    const post = portfolios
      .filter((snapshot) => Boolean(confirmedThrough) && snapshot.date > confirmedThrough! && snapshot.date <= asOf)
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1);
    const denominatorEligible = scope.denominatorSource === "account_total_asset"
      && Boolean(post && Number.isFinite(post.totalAsset) && post.totalAsset > 0);
    if (!post || !denominatorEligible) {
      return { assetId: plan.assetId, eligible: false };
    }
    const holding = post.holdings.find((item) => item.assetId === plan.assetId);
    return {
      assetId: plan.assetId,
      eligible: true,
      positionPct: (holding?.marketValue ?? 0) / post.totalAsset,
    };
  });
}

function waitingKind(judgment: JudgmentResult<unknown>): ReviewActionKind {
  const value = judgment.value as Record<string, unknown>;
  if (judgment.question === "reduction_progress") {
    const reductionState = String(value.state ?? "");
    if (reductionState === "planned") return "waiting_execution";
    if (reductionState === "requested" || reductionState === "partially_confirmed") {
      return "waiting_confirmation";
    }
    return "waiting_recheck";
  }
  if (judgment.question === "operation_compliance") {
    const executionStatus = String(value.executionStatus ?? "");
    if (executionStatus === "requested" || executionStatus === "partially_confirmed" || executionStatus === "unknown") {
      return "waiting_confirmation";
    }
  }
  return "waiting_recheck";
}

function columnFor(
  judgment: JudgmentResult<unknown>,
  action: ReviewAction | undefined,
): "needs_action" | "conforming" | "undetermined" {
  return classifyReviewJudgment(judgment, action);
}

/** 把跨复盘的处置状态映射到本轮事实；只有事实恢复后才自动 resolved。 */
export function reconcileReviewSnapshot(
  computedSnapshot: ReviewSnapshot,
  existingActions: ReviewAction[],
): ReviewSnapshot {
  const existingByJudgment = new Map(existingActions.map((action) => [action.judgmentId, action]));
  const generatedByJudgment = new Map(
    computedSnapshot.reviewActions.map((action) => [action.judgmentId, action]),
  );
  const reviewActions: ReviewAction[] = [];

  for (const judgment of computedSnapshot.judgments) {
    const verdict = classifyReviewJudgment(judgment);
    const existing = existingByJudgment.get(judgment.judgmentId);
    const generated = generatedByJudgment.get(judgment.judgmentId);
    let action: ReviewAction | undefined;

    if (verdict === "conforming") {
      if (existing) {
        action = { ...existing, kind: "resolved", resolvedAt: computedSnapshot.asOf };
      }
    } else if (verdict === "needs_action") {
      const waitingForNewFacts = Boolean(
        existing
        && ["waiting_execution", "waiting_confirmation", "waiting_recheck"].includes(existing.kind)
        && existing.updatedAt
        && computedSnapshot.asOf <= existing.updatedAt,
      );
      if (existing?.kind === "dismissed_with_reason" || existing?.kind === "acknowledged" || waitingForNewFacts) {
        action = existing;
      } else {
        action = {
          ...(existing ?? generated ?? {
            id: `act:review:${computedSnapshot.scopeId}:${judgment.judgmentId}`,
            scopeId: computedSnapshot.scopeId,
            judgmentId: judgment.judgmentId,
            createdAt: computedSnapshot.asOf,
          }),
          kind: "needy_action",
          resolvedAt: undefined,
        };
      }
    } else {
      action = {
        ...(existing ?? {
          id: `act:review:${computedSnapshot.scopeId}:${judgment.judgmentId}`,
          scopeId: computedSnapshot.scopeId,
          judgmentId: judgment.judgmentId,
          createdAt: computedSnapshot.asOf,
        }),
        kind: existing?.kind === "dismissed_with_reason" ? existing.kind : waitingKind(judgment),
        resolvedAt: existing?.kind === "dismissed_with_reason" ? existing.resolvedAt : undefined,
      };
    }
    if (action) reviewActions.push(action);
  }

  let breached = 0;
  let unknown = 0;
  let conforming = 0;
  for (const judgment of computedSnapshot.judgments) {
    const action = reviewActions.find((item) => item.judgmentId === judgment.judgmentId);
    const column = columnFor(judgment, action);
    if (column === "needs_action") breached++;
    else if (column === "conforming") conforming++;
    else unknown++;
  }
  return {
    ...computedSnapshot,
    reviewActions,
    coverageSummary: {
      checked: computedSnapshot.judgments.length,
      breached,
      unknown,
      conforming,
    },
  };
}

async function persistReviewComputation(
  l: InvestmentLedger,
  computation: ReviewComputation,
  existingActions: ReviewAction[],
): Promise<ReviewSnapshot> {
  const reconciled = reconcileReviewSnapshot(computation.snapshot, existingActions);
  for (const trailingState of computation.nextTrailingStates) {
    const judgment = computation.snapshot.judgments.find(
      (item) => item.judgmentId === `trailing_stop:${trailingState.assetId}`,
    );
    if (judgment?.status === "VALID") await l.putTrailingStopState(trailingState);
  }
  // 快照只持久化 Core 原始结果；可变处置状态独立存入 reviewActions，避免改写不可变快照。
  await l.putReviewSnapshot(computation.snapshot);
  for (const action of reconciled.reviewActions) await l.putReviewAction(action);
  return reconciled;
}

/** 从 Ledger 真实范围与规则运行复盘。无 scope 时返回 false。 */
async function loadReviewFromLedger(today: string): Promise<boolean> {
  if (state.running) return false;
  state.running = true;
  state.error = undefined;
  try {
    const l = getLedger();
    const scope = await l.getActiveScope(today);
    if (!scope) {
      state.loaded = false;
      return false;
    }
    const [
      rules,
      decisions,
      plans,
      links,
      existingReviewActions,
      previousTrailingStops,
      reductionPlans,
      account,
      portfolios,
      allTransactions,
      dailyPnl,
      coverage,
      assets,
    ] = await Promise.all([
      l.getStrategyRuleVersions(scope.scopeId),
      l.getDecisionRecords(scope.scopeId),
      l.getOperationPlans(scope.scopeId),
      l.getExecutionLinks(),
      l.getReviewActions(scope.scopeId),
      l.getTrailingStopStates(scope.scopeId),
      l.getReductionPlans(scope.scopeId),
      l.getLatestAccount(),
      l.getPortfolioSnapshots(),
      l.getAllTransactions(),
      l.getAllDailyPnl(),
      l.getCoverage(),
      l.getAssets(),
    ]);
    const portfolio = portfolios.at(-1);
    const asOfMonth = today.slice(0, 7);
    const scopedTransactions = allTransactions.filter((transaction) =>
      scope.includedAssetIds.includes(transaction.assetId),
    );
    const operationTransactions = scopedTransactions.filter(
      (transaction) => transaction.occurredAt.slice(0, 7) === asOfMonth,
    );
    const operationReviewEnabled = Boolean(scope.operationReviewFrom && scope.operationReviewFrom <= today);
    const historicalBaselineTransactions = scope.operationReviewFrom
      ? scopedTransactions.filter(
          (transaction) => transaction.occurredAt.slice(0, 10) < scope.operationReviewFrom!,
        ).length
      : scopedTransactions.length;
    const postSnapshots = buildPostReductionSnapshots(
      scope,
      reductionPlans,
      scopedTransactions,
      portfolios,
      today,
    );
    const facts = {
      account,
      portfolio: portfolio
        ? {
            ...portfolio,
            holdings: portfolio.holdings.filter((holding) =>
              scope.includedAssetIds.includes(holding.assetId),
            ),
          }
        : undefined,
      assets,
      transactions: operationTransactions,
      dailyPnl,
      coverage,
    };
    const computation = computeReview({
      scope,
      facts,
      rules,
      decisions,
      plans,
      links,
      previousTrailingStops,
      reductionPlans,
      operationTransactions,
      reductionTransactions: scopedTransactions,
      postSnapshots,
      management: {
        operationReviewEnabled,
        historicalBaselineTransactions,
      },
      asOf: today,
    });
    state.snapshot = await persistReviewComputation(l, computation, existingReviewActions);
    state.scenarioName = undefined;
    state.loaded = true;
    return true;
  } catch (e) {
    state.error = (e as Error).message;
    return false;
  } finally {
    state.running = false;
  }
}

async function resolveReviewAction(
  actionId: string,
  kind: "acknowledged" | "waiting_execution" | "waiting_confirmation" | "waiting_recheck" | "resolved" | "dismissed_with_reason",
  note?: string,
): Promise<void> {
  if (!state.snapshot) return;
  const actionAsOf = state.snapshot.asOf;
  const closesAction = kind === "acknowledged" || kind === "resolved" || kind === "dismissed_with_reason";
  const actions = state.snapshot.reviewActions.map((action) =>
    action.id === actionId
      ? {
          ...action,
          kind,
          updatedAt: actionAsOf,
          resolvedAt: closesAction ? actionAsOf : undefined,
          note: note ?? action.note,
        }
      : action,
  );
  const updated = reconcileReviewSnapshot(
    { ...state.snapshot, reviewActions: actions },
    actions,
  );
  // 显式 resolved 不能绕过事实复核；reconcile 会把仍偏离的判断重新打开。
  state.snapshot = updated;
  const action = updated.reviewActions.find((item) => item.id === actionId);
  if (action) await getLedger().putReviewAction(action);
}

const os = useInvestmentOS();
const conclusions = computed<ReviewConclusions>(() => buildReviewConclusions(
  state.snapshot,
  os.state.assets,
  {
    hasRules: os.state.strategyRuleVersions.length > 0,
    hasDecisionRecords: os.state.decisionRecords.length > 0,
  },
));

export function useInvestmentReview() {
  return {
    state,
    conclusions,
    loadReviewFromLedger,
    resolveReviewAction,
  };
}
