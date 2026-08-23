/**
 * Investment Review P0 引擎：减仓进度与恢复复核（WP0-3）。
 *
 * 系统只按用户事前目标区间计算恢复到区间所需的计划量，不预测最佳卖点。remaining 依据真实
 * 确认量与新 PositionSnapshot 重算；部分确认保持进行中；全额确认但仍越界为
 * confirmed_not_restored；只有确认且新快照回到规则范围才为 restored。
 *
 * 不变量：Action 关闭或申请提交都不等于减仓完成；申请 ≠ 确认（工程附录 §4 减仓）。
 *
 * 纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type {
  PerJudgmentCoverage,
  ReductionPlan,
  ReductionProceedsTreatment,
  ReductionProgressJudgment,
  ReductionProgressValue,
  ReductionState,
  Transaction,
} from "../../domain";
import { comparableTransactionValue } from "../../domain";

export interface ReductionInput {
  scopeId: string;
  assetId: string;
  triggerJudgmentId: string;
  targetBand: { minPct: number; maxPct: number };
  /** 用户确认并持久化的减仓计划；缺失时保持 planned/unknown，不猜数量。 */
  plan?: ReductionPlan;
  /** 范围内交易（含该资产 SELL）。 */
  transactions: Transaction[];
  /** 操作后仓位百分比（已由 caller 用新快照 + 分母算好）；nil 表示分母缺失或不合格。 */
  postPositionPct?: number;
  postEligible: boolean;
  ruleVersionRefs?: string[];
  coverage: PerJudgmentCoverage;
  asOf: string;
}

export interface ReductionQuantityInput {
  marketValue: number;
  denominatorValue: number;
  targetMaxPct: number;
  /** 赎回款留在范围内则分母不变；转出范围则持仓和分母同步减少。 */
  proceedsTreatment: ReductionProceedsTreatment;
  unit: "CNY" | "shares";
  nav?: number;
}

/**
 * 按用户目标上限估算最小减仓量：
 * - 赎回款留在范围内：x = M - tD；
 * - 赎回款离开范围：x = (M - tD) / (1 - t)。
 * 结果只是快照估算，成交后必须用新持仓和新分母复核。
 */
export function calculateReductionQuantity(input: ReductionQuantityInput): number {
  const { marketValue, denominatorValue, targetMaxPct, proceedsTreatment, unit, nav } = input;
  if (!Number.isFinite(marketValue) || marketValue < 0) throw new Error("基金市值必须是非负有限数");
  if (!Number.isFinite(denominatorValue) || denominatorValue <= 0) throw new Error("仓位分母必须大于 0");
  if (!Number.isFinite(targetMaxPct) || targetMaxPct < 0 || targetMaxPct > 1) throw new Error("目标仓位上限必须在 0 到 1 之间");
  if (proceedsTreatment !== "remain_in_scope_as_cash" && proceedsTreatment !== "leave_scope") {
    throw new Error("必须明确赎回款留在当前投资范围还是转出范围");
  }
  if (proceedsTreatment === "leave_scope" && targetMaxPct >= 1) throw new Error("资金转出范围时目标仓位上限必须小于 100%");
  const excess = Math.max(0, marketValue - denominatorValue * targetMaxPct);
  const amount = proceedsTreatment === "leave_scope" ? excess / (1 - targetMaxPct) : excess;
  if (unit === "CNY") return Math.round(amount * 100) / 100;
  if (!Number.isFinite(nav) || nav === undefined || nav <= 0) throw new Error("按份额规划时需要有效净值");
  return Math.round((amount / nav) * 10000) / 10000;
}

export function computeReductionProgress(input: ReductionInput): ReductionProgressJudgment {
  const { assetId, triggerJudgmentId, targetBand, plan, transactions, postPositionPct, postEligible, coverage } = input;
  const judgmentId = `reduction:${assetId}`;
  const planned = plan?.planned ?? 0;

  const sellTxs = plan
    ? transactions.filter((transaction) =>
        transaction.assetId === assetId
        && transaction.type === "SELL"
        && transaction.occurredAt.slice(0, 10) >= plan.createdAt.slice(0, 10),
      )
    : [];
  const compatibleUnit = (unit: string): boolean => {
    const normalized = unit.trim().toLowerCase();
    if (plan?.unit === "CNY") return ["cny", "rmb", "元", "人民币"].includes(normalized);
    if (plan?.unit === "shares") return ["shares", "share", "份", "份额"].includes(normalized);
    if (plan?.unit === "pct") return ["pct", "%", "percent", "percentage"].includes(normalized);
    return false;
  };
  const incompatibleExecution = sellTxs.some((transaction) => !compatibleUnit(transaction.amountUnit));
  const comparableSellTxs = sellTxs.filter((transaction) => compatibleUnit(transaction.amountUnit));
  const requested = comparableSellTxs
    .filter((t) => t.status === "requested")
    .reduce((s, t) => s + t.amount, 0);
  const confirmed = comparableSellTxs
    .filter((t) => t.status === "confirmed" || t.status === "partially_confirmed")
    .reduce((s, t) => s + comparableTransactionValue(t), 0);
  const fullyConfirmed = comparableSellTxs
    .filter((t) => t.status === "confirmed")
    .reduce((s, t) => s + comparableTransactionValue(t), 0);
  const failedAny = comparableSellTxs.some((t) => t.status === "failed");
  const cancelledAny = comparableSellTxs.some((t) => t.status === "cancelled");
  const remaining = Math.max(0, planned - confirmed);

  let state: ReductionState;
  let status: ReductionProgressJudgment["status"];
  let reason: string;
  let nextStep: string | undefined;
  let limitation: string | undefined;

  if (!plan || planned <= 0) {
    state = "planned";
    status = "UNKNOWN";
    reason = "尚未确认可复算的减仓估算计划量，系统不预测卖点";
    limitation = "需要先由人确认目标区间、赎回款是否离开投资范围，以及系统按当前快照估算的计划量";
    nextStep = "确认并保存减仓计划";
  } else if (incompatibleExecution) {
    state = "requested";
    status = "UNKNOWN";
    reason = "减仓计划与来源执行量的口径不同，无法可靠累计进度";
    limitation = "缺少金额、份额或仓位口径之间的可靠换算依据";
    nextStep = "补齐同一估值边界的换算证据后重新复核";
  } else if (fullyConfirmed >= planned) {
    // 全额确认：必须用新快照复核是否回到区间，Action 关闭或申请提交都不算完成。
    if (postEligible && postPositionPct !== undefined) {
      const within = postPositionPct >= targetBand.minPct && postPositionPct <= targetBand.maxPct;
      if (within) {
        state = "restored";
        status = "VALID";
        reason = `已确认且新仓位 ${(postPositionPct * 100).toFixed(2)}% 回到目标区间 [${(targetBand.minPct * 100).toFixed(2)}%, ${(targetBand.maxPct * 100).toFixed(2)}%]`;
      } else {
        state = "confirmed_not_restored";
        status = "VALID";
        reason = `已确认但新仓位 ${(postPositionPct * 100).toFixed(2)}% 仍越界，尚未恢复`;
        nextStep = "由人确认是否追加减仓或修订目标区间";
      }
    } else {
      state = "confirmed";
      status = "PARTIAL";
      reason = "已确认减仓，但操作后仓位分母不可比，无法复核恢复";
      limitation = "操作后分母缺失，恢复未复算";
      nextStep = "由人补齐操作后总资产分母后重新复核";
    }
  } else if (confirmed > 0) {
    state = "partially_confirmed";
    status = "PARTIAL";
        reason = `部分确认 ${confirmed}/${planned}（计划量为快照估算），减仓进行中，remaining=${remaining}`;
    nextStep = "等待剩余份额确认并复核仓位";
  } else if (requested > 0) {
    state = "requested";
    status = "PARTIAL";
    reason = "已提交申请但未确认，申请不等于减仓完成";
    nextStep = "等待来源确认结果后复核仓位";
  } else if (failedAny) {
    state = "failed";
    status = "FAILED";
    reason = "减仓交易失败，未构成有效执行";
    nextStep = "由人确认是否重新提交减仓";
  } else if (cancelledAny) {
    state = "cancelled";
    status = "FAILED";
    reason = "减仓交易已撤销";
    nextStep = "由人确认撤销原因并决定后续";
  } else {
    state = "planned";
    status = "VALID";
    reason = "已有基于快照的减仓估算计划，尚未申请或确认；成交后仍须用新持仓和新分母复核";
    nextStep = "由人提交减仓申请";
  }

  const value: ReductionProgressValue = {
    assetId,
    triggerJudgmentId,
    targetBand,
    planned,
    requested,
    confirmed,
    remaining,
    postPositionPct: postEligible ? postPositionPct : undefined,
    state,
    limitation,
  };

  const needsFollowUp = state !== "restored";
  return {
    judgmentId,
    question: "reduction_progress",
    status,
    value,
    reason,
    ruleVersionRefs: input.ruleVersionRefs ?? plan?.ruleVersionRefs ?? [],
    evidenceRefs: [...(plan ? [plan.id] : []), ...sellTxs.map((t) => t.id)],
    missingEvidence: !plan
      ? ["用户确认的减仓计划量"]
      : incompatibleExecution
        ? ["计划与执行口径的可靠换算依据"]
        : state === "confirmed"
          ? ["操作后总资产分母"]
          : [],
    stillAnswerable: [],
    nextStep,
    coverage: {
      ...coverage,
      judgmentId,
      affectedJudgmentIds: needsFollowUp ? [judgmentId] : [],
    },
  };
}
