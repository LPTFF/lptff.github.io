/**
 * Investment Review P0 引擎：仓位判断（WP0-3）。
 *
 * positionPct = 范围内基金市值 / 范围分母。分母缺失、范围不一致或估值不可比时只把 PositionJudgment
 * 降级为 INSUFFICIENT_DATA，不阻断操作/止损判断（工程附录 §4 仓位不变量）。
 * 不能拿单只基金自身市值作分母后声称仓位 100%；没有用户区间规则时不发明"合理仓位"。
 *
 * 纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type {
  PerJudgmentCoverage,
  PositionBandRule,
  PositionJudgment,
  PositionJudgmentValue,
} from "../../domain";
import type { ScopeFacts } from "./scope";

export interface PositionInput {
  scopeFacts: ScopeFacts;
  /** 当时的仓位区间规则；缺省表示该问题无用户规则，判断降级为 UNKNOWN。 */
  rule?: PositionBandRule;
  ruleVersionId?: string;
  coverage: PerJudgmentCoverage;
  asOf: string;
}

export function evaluatePosition(input: PositionInput): PositionJudgment {
  const { scopeFacts, rule, ruleVersionId, coverage, asOf } = input;
  const judgmentId = rule?.assetId ? `position:${rule.assetId}` : "position:scope";

  // 无用户区间规则：不发明合理仓位，只显示事实。
  if (!rule) {
    const value: PositionJudgmentValue = {
      denominatorEligible: scopeFacts.denominatorEligible,
      positionPct: undefined,
      limitation: "未声明仓位区间规则，系统不发明合理仓位",
    };
    return {
      judgmentId,
      question: "position",
      status: "UNKNOWN",
      value,
      reason: "没有用户事前仓位区间规则，无法判定越界",
      ruleVersionRefs: ruleVersionId ? [ruleVersionId] : [],
      evidenceRefs: [],
      missingEvidence: ["仓位区间规则"],
      stillAnswerable: [],
      coverage: {
        ...coverage,
        judgmentId,
        affectedJudgmentIds: [],
      },
    };
  }

  // 计算分子：单基金取该基金市值；组合规则取范围内基金市值合计。
  const numerator = rule.assetId
    ? scopeFacts.holdings.find((h) => h.assetId === rule.assetId)?.marketValue ?? 0
    : scopeFacts.eligibleFundMarketValue;

  // 分母不合格：只降级仓位判断，不阻断其他。
  if (!scopeFacts.denominatorEligible || scopeFacts.denominatorValue === undefined) {
    const value: PositionJudgmentValue = {
      assetId: rule.assetId,
      denominatorEligible: false,
      positionPct: undefined,
      limitation: scopeFacts.scope.denominatorSource === "none"
        ? "范围未声明仓位分母"
        : "分母数据缺失或不可靠",
    };
    return {
      judgmentId,
      question: "position",
      status: "INSUFFICIENT_DATA",
      value,
      reason: "仓位分母缺失或不可靠，仓位百分比暂不能判断；操作与止损判断不受影响",
      ruleVersionRefs: ruleVersionId ? [ruleVersionId] : [],
      evidenceRefs: [],
      missingEvidence: ["可靠的总资产/可投资资金分母"],
      stillAnswerable: ["operation_compliance", "trailing_stop", "reduction_progress"],
      nextStep: "由人确认范围总资产或可投资资金",
      coverage: {
        ...coverage,
        judgmentId,
        warnings: Array.from(new Set([...coverage.warnings, "denominator:ineligible"])),
        affectedJudgmentIds: [judgmentId],
      },
    };
  }

  const positionPct = numerator / scopeFacts.denominatorValue;
  const deviation = computeDeviation(positionPct, rule.minPct, rule.maxPct);
  const value: PositionJudgmentValue = {
    assetId: rule.assetId,
    denominatorEligible: true,
    positionPct,
    band: { minPct: rule.minPct, maxPct: rule.maxPct, targetPct: rule.targetPct },
    deviation,
  };

  const status = deviation.direction === "within" ? "VALID" : deviation.direction === "unknown" ? "UNKNOWN" : "VALID";
  const reason = deviation.direction === "within"
    ? `仓位 ${pct(positionPct)} 落在区间 [${pct(rule.minPct)}, ${pct(rule.maxPct)}] 内`
    : deviation.direction === "over"
      ? `仓位 ${pct(positionPct)} 超过上限 ${pct(rule.maxPct)}`
      : deviation.direction === "under"
        ? `仓位 ${pct(positionPct)} 低于下限 ${pct(rule.minPct)}`
        : "仓位偏离方向未知";

  return {
    judgmentId,
    question: "position",
    status,
    value,
    reason,
    ruleVersionRefs: ruleVersionId ? [ruleVersionId] : [],
    evidenceRefs: rule.assetId ? [`${rule.assetId}:marketValue`, `${scopeFacts.scope.scopeId}:denominator`] : [`${scopeFacts.scope.scopeId}:marketValue`, `${scopeFacts.scope.scopeId}:denominator`],
    missingEvidence: [],
    stillAnswerable: [],
    nextStep: deviation.direction === "within" ? undefined : "由人确认是否调整持仓或修订区间规则",
    coverage: {
      ...coverage,
      judgmentId,
      affectedJudgmentIds: deviation.direction === "over" || deviation.direction === "under" ? [judgmentId] : [],
    },
  };
}

function computeDeviation(
  positionPct: number,
  minPct: number,
  maxPct: number,
): { pct: number; direction: "over" | "under" | "within" | "unknown" } {
  if (positionPct > maxPct) return { pct: positionPct - maxPct, direction: "over" };
  if (positionPct < minPct) return { pct: minPct - positionPct, direction: "under" };
  return { pct: 0, direction: "within" };
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}