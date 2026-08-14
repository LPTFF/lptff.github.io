/**
 * Investment Review 引擎：目标收益率止盈。
 *
 * 累计收益率 = (当前市值 - 持仓成本) / 持仓成本。
 * 达 targetReturnPct 触发复核事项（非自动赎回）。数据缺失降级 INSUFFICIENT_DATA，不臆造收益率。
 *
 * 与 trailing_stop 的区别：trailing_stop 是防守型（从高点回撤 X% 触发，锁定浮盈），
 * take_profit 是进攻型（收益率直接达目标即触发）；本规则无 HWM 状态机，收益率可从
 * holdings 的 costValue/marketValue 实时计算，无需持久化状态。
 *
 * 纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type { PerJudgmentCoverage, TakeProfitJudgment, TakeProfitRule, TakeProfitValue } from "../../domain";

export interface TakeProfitInput {
  assetId: string;
  rule: TakeProfitRule;
  ruleVersionId: string;
  /** 持仓成本（HoldingSnapshot.costValue）。 */
  costValue?: number;
  /** 当前市值（HoldingSnapshot.marketValue）。 */
  marketValue?: number;
  navAsOf?: string;
  coverage: PerJudgmentCoverage;
  asOf: string;
}

export function evaluateTakeProfit(input: TakeProfitInput): TakeProfitJudgment {
  const { assetId, rule, ruleVersionId, costValue, marketValue, navAsOf, coverage, asOf } = input;
  const judgmentId = `take_profit:${assetId}`;
  const baseValue: TakeProfitValue = {
    assetId,
    ruleVersionId,
    costValue,
    marketValue,
    targetReturnPct: rule.targetReturnPct,
    triggered: false,
    asOf: navAsOf ?? asOf,
  };

  // 数据缺失或成本非正：不臆造收益率，降级 INSUFFICIENT_DATA。
  if (costValue === undefined || marketValue === undefined || costValue <= 0) {
    return {
      judgmentId,
      question: "take_profit",
      status: "INSUFFICIENT_DATA",
      value: baseValue,
      reason: "持仓成本或市值缺失，无法计算累计收益率",
      ruleVersionRefs: [ruleVersionId],
      evidenceRefs: [],
      missingEvidence: ["持仓成本与当前市值"],
      stillAnswerable: [],
      nextStep: "由人确认持仓成本与最新市值后再判断止盈",
      coverage: {
        ...coverage,
        judgmentId,
        warnings: Array.from(new Set([...coverage.warnings, "take_profit:data-missing"])),
        affectedJudgmentIds: [judgmentId],
      },
    };
  }

  const currentReturnPct = (marketValue - costValue) / costValue;
  const triggered = currentReturnPct >= rule.targetReturnPct;
  const value: TakeProfitValue = { ...baseValue, currentReturnPct, triggered };
  const targetPct = (rule.targetReturnPct * 100).toFixed(0);
  const curPct = (currentReturnPct * 100).toFixed(2);

  return {
    judgmentId,
    question: "take_profit",
    status: "VALID",
    value,
    reason: triggered
      ? `累计收益率 ${curPct}% 已达目标 ${targetPct}%，触发复核（非自动赎回）`
      : `累计收益率 ${curPct}%，未达目标 ${targetPct}%`,
    ruleVersionRefs: [ruleVersionId],
    evidenceRefs: [`${assetId}:nav:${navAsOf ?? asOf}`],
    missingEvidence: [],
    stillAnswerable: [],
    nextStep: triggered ? "由人确认是否赎回或上调目标" : undefined,
    coverage: {
      ...coverage,
      judgmentId,
      warnings: triggered ? Array.from(new Set([...coverage.warnings, "take_profit:triggered"])) : coverage.warnings,
      affectedJudgmentIds: triggered ? [judgmentId] : [],
    },
  };
}