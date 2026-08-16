/**
 * 规则依据映射：把每类规则关联到 agent/theories/investment-performance-and-decision-review.md
 * 领域内的理论概念，并诚实标注阈值数值的依据。
 *
 * 边界（investment-review.md 第 10 节 + 理论 README）：
 * - 理论提供的是"检查什么风险/约束什么行为"的原则，不给具体阈值；
 * - 具体阈值是风控惯例的示例值，非权威数值，须用户按自身风险承受声明；
 * - 因此 rationale 不声称"理论 = 这个数字"，只让每条规则可追溯到它的意图与理论脉络。
 */
import type { StrategyRule } from "../../domain";

export interface RuleRationale {
  /** 这条规则检查的风险或约束的行为。 */
  intent: string;
  /** 关联的理论概念（来自投资绩效与决策复盘理论框架领域）。 */
  theoryRef: string;
  /** 理论文档名，供人追溯全文。 */
  theoryDoc: string;
  /** 阈值数值的诚实依据：为何是这个数，以及它不是权威值。 */
  thresholdBasis: string;
}

export const RULE_RATIONALE: Record<string, RuleRationale> = {
  position_band: {
    intent: "控制单只基金的集中度暴露，避免单一标的过度占用仓位",
    theoryRef: "集中度风险 + 处置效应（Disposition）",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "区间与目标为风控惯例示例值，非权威阈值；须按你的风险承受与能力圈确认",
  },
  trailing_stop: {
    intent: "用移动止损锁定高水位收益、控制回撤；创新高时止损线上移，永不下移",
    theoryRef: "移动止损 + 过度交易（Overtrading）/ 情绪化持有",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "回撤阈值为常见止损惯例示例；净值复权口径不清时降级 unknown，不制造触发",
  },
  reduction_target: {
    intent: "触发后回到可控仓位的减仓目标，只计算计划量，不预测卖点",
    theoryRef: "处置效应（Disposition）/ 纪律化执行",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "目标区间为示例，须你事前声明；真实确认与操作后恢复须分别验证",
  },
  target_allocation: {
    intent: "按维度（指数/地区/资产类别）控制目标配比与偏离区间",
    theoryRef: "资产配置再平衡（Rebalancing）+ 集中度风险",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "目标与区间为示例，须你声明；超区间只提示检查，不自动再平衡",
  },
  pause: {
    intent: "某维度暴露达上限后暂停新增，避免风险继续集中",
    theoryRef: "集中度风险 + 投资政策声明（IPS）限额",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "上限为示例，须你声明；触发只生成待处理事项，不自动交易",
  },
  take_profit: {
    intent: "累计收益率达目标后触发复核，不自动交易",
    theoryRef: "纪律化止盈 + 处置效应（Disposition）",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "目标收益率为示例，须你声明；达标只表示待人复核，不代表必须赎回",
  },
  regular_investment: {
    intent: "按固定周期投入，平滑择时风险",
    theoryRef: "定投（成本平均）/ 减少择时偏差",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "周期与金额由你声明，系统不发明",
  },
  additional_investment: {
    intent: "允许在明确条件下额外追加",
    theoryRef: "投资政策声明（IPS）条件化授权",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "条件由你声明，系统不替你判断是否满足",
  },
  review: {
    intent: "满足条件后重新评估，触发复盘而非交易",
    theoryRef: "绩效评价（Appraisal）/ 结果偏差（Outcome Bias）防范",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "条件由你声明；复盘与交易分离",
  },
  pause_window: {
    intent: "在指定时间窗口暂停新增",
    theoryRef: "投资政策声明（IPS）/ 纪律化执行",
    theoryDoc: "投资绩效与决策复盘理论框架",
    thresholdBasis: "窗口由你声明",
  },
};

/** 取某类规则的依据；未登记返回 undefined（页面不渲染依据行，不伪造）。 */
export function describeRuleRationale(kind: string): RuleRationale | undefined {
  return RULE_RATIONALE[kind];
}

// ---- 默认规则集：基于 RULE_RATIONALE 风控惯例的示例阈值 -------------------
// 用于降低用户逐条声明阈值的管理成本。
// 边界（与 investment-review.md 第 10 节的调整，已记入第 12.2 节）：
// - 默认值是"理论原则的量化惯例参考"，不是权威数值，也不是系统发明的"合理仓位"；
// - 用户优先采纳默认即可让机械检查跑起来；对某条有疑问时外包通用模型分析后接受/忽略/调整；
// - 理论提供原则（见上方 RULE_RATIONALE），默认值是该原则下的常见量化示例。

export const DEFAULT_RULE_VALUES = {
  position_band: { minPct: 0, maxPct: 0.25, targetPct: 0.15 },
  trailing_stop: { drawdownPct: 0.1 },
  take_profit: { targetReturnPct: 0.2 },
  reduction_target: { targetMinPct: 0.1, targetMaxPct: 0.2 },
} as const;

/** 为给定资产集构建默认规则集：每只基金生成仓位区间/移动止损/目标止盈/减仓目标各一条。 */
export function buildDefaultStrategyRules(assetIds: string[], effectiveFrom: string): StrategyRule[] {
  const rules: StrategyRule[] = [];
  for (const assetId of assetIds) {
    const v = DEFAULT_RULE_VALUES;
    rules.push({ kind: "position_band", assetId, minPct: v.position_band.minPct, maxPct: v.position_band.maxPct, targetPct: v.position_band.targetPct });
    rules.push({ kind: "trailing_stop", assetId, basis: "nav_adjusted", drawdownPct: v.trailing_stop.drawdownPct, effectiveFrom });
    rules.push({ kind: "take_profit", assetId, targetReturnPct: v.take_profit.targetReturnPct, effectiveFrom });
    rules.push({ kind: "reduction_target", assetId, targetMinPct: v.reduction_target.targetMinPct, targetMaxPct: v.reduction_target.targetMaxPct });
  }
  return rules;
}