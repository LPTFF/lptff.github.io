/**
 * Investment Review P0 引擎集合（WP0-1 ~ WP0-4）。
 *
 * 全部纯函数，由人工 fixture 驱动；不读取真实页面 DOM / Cookie / Token / Raw Snapshot /
 * 登录态或完整 Network Logs。Core 不依赖 LLM。
 *
 * 模块按工作包递增导出：WP0-1 投资范围与按问题数据状态；WP0-2 操作执行对照；
 * WP0-3 仓位/止损/减仓；WP0-4 复盘编排。
 */
export {
  resolveActiveScope,
  gatherScopeFacts,
  buildPerJudgmentCoverage,
  type ReviewFacts,
  type ScopeFacts,
} from "./scope";
export {
  evaluateOperationCompliance,
  transitionPlan,
  assertDecisionImmutable,
  type OperationComplianceInput,
} from "./operation-compliance";
export { evaluatePosition, type PositionInput } from "./position";
export { advanceTrailingStop, type TrailingStopInput, type TrailingStopResult } from "./trailing-stop";
export { evaluateTakeProfit, type TakeProfitInput } from "./take-profit";
export { computeReductionProgress, type ReductionInput } from "./reduction";
export { runReview, classifyReviewJudgment, type ReviewInput, type ReviewVerdict, type PostReductionSnapshot } from "./review-orchestrator";
export { generateActions, defaultToggles, resetBehaviorSeq, type BehaviorInput, type BehaviorOutput, type BehaviorToggles, type BehaviorLogEntry } from "./simulator-behavior";