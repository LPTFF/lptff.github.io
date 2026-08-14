/**
 * Investment Review P0 引擎：移动止损状态（WP0-3）。
 *
 * newHighWaterMark = max(previousHighWaterMark, eligibleCurrentNAV)
 * newStopLine      = max(previousStopLine, newHighWaterMark × (1 - drawdownPct))
 *
 * 不变量（工程附录 §4 止损）：
 * - 创新高时 high-water mark 与 stop line 上移；未创新高时 stop line 不动，绝不下移；
 * - stale / partial / unknown NAV 或 basis 不一致时不推进状态，历史状态保留；
 * - basis（分红/复权语义）unknown 时整体降级为 UNKNOWN，不制造确定性止损线；
 * - triggered 只创建复核/减仓事项，不执行交易。
 *
 * 纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type {
  PerJudgmentCoverage,
  TrailingStopJudgment,
  TrailingStopRule,
  TrailingStopStateValue,
} from "../../domain";
import type { StoredTrailingStopState } from "../../ledger/repository";

export interface TrailingStopInput {
  scopeId: string;
  assetId: string;
  rule: TrailingStopRule;
  ruleVersionId: string;
  previousState?: StoredTrailingStopState;
  /** 当前合格 NAV；nil 表示缺失或陈旧。 */
  currentNav?: number;
  navAsOf?: string;
  /** NAV 是否新鲜（来源日期足够新）。陈旧则不推进高水位。 */
  navFresh: boolean;
  coverage: PerJudgmentCoverage;
  asOf: string;
}

export interface TrailingStopResult {
  judgment: TrailingStopJudgment;
  /** 应持久化的新状态（用于下一轮单调不降比较）。 */
  nextState: StoredTrailingStopState;
}

export function advanceTrailingStop(input: TrailingStopInput): TrailingStopResult {
  const { scopeId, assetId, rule, ruleVersionId, previousState, currentNav, navAsOf, navFresh, coverage, asOf } = input;
  const judgmentId = `trailing_stop:${assetId}`;
  const stateId = `tss:${scopeId}:${assetId}`;
  const prevHWM = previousState?.currentHighWaterMark ?? previousState?.previousHighWaterMark;
  const prevStop = previousState?.stopLine;

  const baseValue: TrailingStopStateValue = {
    assetId,
    ruleVersionId,
    previousHighWaterMark: prevHWM,
    currentHighWaterMark: prevHWM,
    stopLine: prevStop,
    navBasis: rule.basis,
    asOf: navAsOf,
    triggered: false,
  };

  const baseState: StoredTrailingStopState = {
    id: stateId,
    scopeId,
    assetId,
    ruleVersionId,
    previousHighWaterMark: prevHWM,
    currentHighWaterMark: prevHWM,
    stopLine: prevStop,
    navBasis: rule.basis,
    asOf: navAsOf ?? previousState?.asOf,
    triggered: false,
  };

  // basis 语义不清：整体降级为 UNKNOWN，保留历史状态，不制造止损线。
  if (rule.basis === "unknown") {
    return {
      judgment: {
        judgmentId,
        question: "trailing_stop",
        status: "UNKNOWN",
        value: baseValue,
        reason: "分红/复权 basis 语义不清，无法推进移动止损状态",
        ruleVersionRefs: [ruleVersionId],
        evidenceRefs: [],
        missingEvidence: ["可验证的 NAV 复权 basis"],
        stillAnswerable: [],
        nextStep: "由人确认 NAV 复权口径后再生效止损规则",
        coverage: {
          ...coverage,
          judgmentId,
          warnings: Array.from(new Set([...coverage.warnings, "trailing_stop:basis-unknown"])),
          affectedJudgmentIds: [judgmentId],
        },
      },
      nextState: baseState,
    };
  }

  // 陈旧或缺失 NAV：不推进高水位，保留历史 stop line（绝不下移）。
  if (currentNav === undefined || !navFresh) {
    return {
      judgment: {
        judgmentId,
        question: "trailing_stop",
        status: currentNav === undefined ? "INSUFFICIENT_DATA" : "STALE",
        value: baseValue,
        reason: currentNav === undefined ? "NAV 缺失，无法推进高水位" : "NAV 陈旧，不推进高水位，止损线保留",
        ruleVersionRefs: [ruleVersionId],
        evidenceRefs: [],
        missingEvidence: ["新鲜的合格 NAV"],
        stillAnswerable: [],
        nextStep: "由人确认最新 NAV 后再推进移动止损",
        coverage: {
          ...coverage,
          judgmentId,
          warnings: Array.from(new Set([...coverage.warnings, currentNav === undefined ? "trailing_stop:nav-missing" : "trailing_stop:nav-stale"])),
          affectedJudgmentIds: [judgmentId],
        },
      },
      nextState: baseState,
    };
  }

  // 合格 NAV：更新高水位（单调不降）与止损线（max 保证不下移）。
  const newHWM = prevHWM === undefined ? currentNav : Math.max(prevHWM, currentNav);
  const candidateStop = newHWM * (1 - rule.drawdownPct);
  const newStop = prevStop === undefined ? candidateStop : Math.max(prevStop, candidateStop);
  const isNewHigh = prevHWM === undefined || currentNav > prevHWM;
  const triggered = currentNav <= newStop;

  const value: TrailingStopStateValue = {
    assetId,
    ruleVersionId,
    previousHighWaterMark: prevHWM,
    currentHighWaterMark: newHWM,
    stopLine: newStop,
    navBasis: rule.basis,
    asOf: navAsOf,
    triggered,
  };

  const nextState: StoredTrailingStopState = {
    ...baseState,
    previousHighWaterMark: prevHWM,
    currentHighWaterMark: newHWM,
    stopLine: newStop,
    asOf: navAsOf,
    triggered,
  };

  const reason = triggered
    ? `NAV ${currentNav} 已跌破止损线 ${newStop.toFixed(4)}，触发待人处理事项（非自动交易）`
    : isNewHigh
      ? `创新高，高水位上移至 ${newHWM.toFixed(4)}，止损线上移至 ${newStop.toFixed(4)}`
      : "未创新高，止损线不动（绝不下移）";

  return {
    judgment: {
      judgmentId,
      question: "trailing_stop",
      status: "VALID",
      value,
      reason,
      ruleVersionRefs: [ruleVersionId],
      evidenceRefs: [`${assetId}:nav:${navAsOf ?? asOf}`],
      missingEvidence: [],
      stillAnswerable: [],
      nextStep: triggered ? "由人确认是否进入赎回计划或复核" : undefined,
      coverage: {
        ...coverage,
        judgmentId,
        warnings: triggered ? Array.from(new Set([...coverage.warnings, "trailing_stop:triggered"])) : coverage.warnings,
        affectedJudgmentIds: triggered ? [judgmentId] : [],
      },
    },
    nextState,
  };
}