/**
 * Investment OS Domain Model（Protocol v2.0）
 *
 * 这些类型是 Core 层的统一契约。Adapter 把已观察的真实来源数据转换成这些
 * 标准化事实，Sensor/Sync/Ledger/Engines 只消费这些类型，不感知天天基金原始字段。
 *
 * 分层（PRD §32）：Raw Source → Adapter → Normalized Fact（这里是这一层）→ Inference → Decision。
 * 严格区分 Fact / Inference / Suggestion：以下结构里，nullable / unknown 枚举表示"未知"，
 * 不得被静默猜测为完整或成功（PRD §6.4、shared/00 不变量 5）。
 */

export const INVESTMENT_PROTOCOL_VERSION = "2.0" as const;

/** 标识数据来源（脱敏占位，禁止携带真实账号 / Cookie / Token）。 */
export type SourceId = string;

/** 标识一个底层资产（基金代码或统一资产 ID）。 */
export type AssetId = string;

/** ISO 日期范围，start / end 均为 YYYY-MM-DD（含端点）。 */
export interface DateRange {
  start: string;
  end: string;
}

// ---------------------------------------------------------------------------
// Asset Metadata（PRD §18.3 Exposure 的统一资产模型）
// ---------------------------------------------------------------------------

export type AssetClass = "equity" | "bond" | "commodity" | "cash" | "other";

/** 暴露聚合维度，用于 Exposure Engine 切换展示。 */
export type ExposureDimension =
  | "index"
  | "region"
  | "assetClass"
  | "currency"
  | "theme";

/**
 * source: 来源接口/字段直接给出的标准值；
 * extracted: 从已采集的档案原文或复合字段中确定性提取并标准化；
 * classified: 来源没有直接表达该维度，按规则归类；
 * unknown: 当前来源不足以判断。
 */
export type MetadataQuality = "source" | "extracted" | "classified" | "unknown";

export interface AssetMetadataProvenance {
  assetClass: MetadataQuality;
  regions: MetadataQuality;
  indexes: MetadataQuality;
  currencies: MetadataQuality;
  themes: MetadataQuality;
}

/** 可核实的来源锚点；只保存短 URL 和披露日期，不保存网页或 Network 快照。 */
export interface AssetMetadataEvidence {
  sourceUrl: string;
  asOf?: string;
  /** 仅保存短字段标识，不复制网页正文，避免元数据存储随采集内容膨胀。 */
  sourceField?:
    | "tracked-index"
    | "benchmark"
    | "fund-profile"
    | "industry-allocation"
    | "currency";
  /** 档案页中的短栏目名，例如“投资目标”；不保存栏目正文。 */
  sourceSection?: string;
}

export interface AssetIndustryAllocation {
  name: string;
  weight: number;
}

export interface AssetMetadata {
  assetId: AssetId;
  name?: string;
  assetClass: AssetClass;
  regions: string[];
  indexes: string[];
  currencies: string[];
  themes: string[];
  provenance?: AssetMetadataProvenance;
  evidence?: Partial<Record<keyof AssetMetadataProvenance, AssetMetadataEvidence>>;
  /** 来源披露的行业配置，与“主题/策略”分开保存，避免把最大行业误当成基金策略。 */
  industryAllocations?: AssetIndustryAllocation[];
  industryEvidence?: AssetMetadataEvidence;
}

// ---------------------------------------------------------------------------
// Account / Portfolio / Holding（PRD §31）
// ---------------------------------------------------------------------------

/** 账户级时点快照。 */
export interface AccountSnapshot {
  id: string;
  source: SourceId;
  capturedAt: string;
  totalAsset: number;
  currentHoldingPnl?: number;
  cumulativePnl?: number;
}

/** 组合级时点快照。 */
export interface PortfolioSnapshot {
  id: string;
  date: string;
  totalAsset: number;
  holdingValue: number;
  cash?: number;
  currentHoldingPnl?: number;
  holdings: HoldingSnapshot[];
}

/** 单只资产持仓快照。 */
export interface HoldingSnapshot {
  assetId: AssetId;
  name?: string;
  /** 当前市值（元）。 */
  marketValue: number;
  /** 持仓浮动盈亏（元），未知省略。 */
  pnl?: number;
  /** 持仓收益率（0-1），仅在来源明确提供时写入，未知省略。 */
  pnlRate?: number;
  /** 仓位比例（0-1）。 */
  weight?: number;
  /** 投入成本（元），未知省略。 */
  costValue?: number;
  shares?: number;
  availableShares?: number;
  nav?: number;
  navDate?: string;
}

// ---------------------------------------------------------------------------
// Transaction / DailyPnL（PRD §31）
// ---------------------------------------------------------------------------

export type TransactionType = "BUY" | "SELL" | "DIVIDEND" | "FEE" | "TRANSFER" | "OTHER";

/**
 * 申请与确认分离（WP0-2 / 工程附录 §2）。
 * - requested: 已提交申请，未确认
 * - partially_confirmed: 部分确认
 * - confirmed: 全额确认
 * - failed: 失败
 * - cancelled: 撤销
 * - unknown: 来源语义不清
 */
export type TransactionStatus =
  | "requested"
  | "partially_confirmed"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "unknown";

export type TransactionSourceType =
  | "auto_collect"
  | "manual_import"
  | "bank_auto_invest"
  | "unknown";

/**
 * 已标准化的交易事实（PRD §31）。
 * 去重首选 `sourceTransactionId`，缺失时退回 fingerprint（见 sync 模块）。
 */
export interface Transaction {
  id: string;
  sourceTransactionId?: string;
  /** ISO datetime。 */
  occurredAt: string;
  assetId: AssetId;
  type: TransactionType;
  amount: number;
  amountUnit: string;
  confirmedAmount?: number;
  status: TransactionStatus;
  sourceType?: TransactionSourceType;
  /** 来源业务名称确实没有映射时标记；不能仅凭 OTHER 推断为异常。 */
  classificationWarning?: "unmapped_transaction_type";
  /** 由 Behavior Engine 填充，未分类为 null / 省略。 */
  behaviorType?: BehaviorType | null;
  /** 关联的 Policy，由用户确认或规则匹配填充。 */
  policyId?: string;
}

/** 每日盈亏时序记录，去重键 `assetId + date`（PRD §10）。 */
export interface DailyPnL {
  assetId: AssetId;
  date: string;
  nav?: number;
  shares?: number;
  dailyReturn?: number;
  pnl: number;
}

// ---------------------------------------------------------------------------
// DataCoverage（PRD §11）
// ---------------------------------------------------------------------------

export type CoverageDataset =
  | "account"
  | "holdings"
  | "dailyPnl"
  | "transactions"
  | "fundDetail";

export type CoverageCompleteness = "complete" | "partial" | "unknown";

export interface DataCoverage {
  dataset: CoverageDataset;
  knownRanges: DateRange[];
  completeness: CoverageCompleteness;
  lastSyncedAt?: string;
  warningCodes: string[];
}

// ---------------------------------------------------------------------------
// Behavior（PRD §23）
// ---------------------------------------------------------------------------

export type BehaviorType =
  | "SYSTEMATIC_INVESTMENT"
  | "DISCRETIONARY_BUY"
  | "DISCRETIONARY_SELL"
  | "REBALANCE"
  | "UNKNOWN";

/** Behavior Engine 发现的稳定重复行为，可提示用户保存为 Policy（PRD §23）。 */
export interface DetectedPattern {
  id: string;
  detectedAt: string;
  behaviorType: BehaviorType;
  assetId?: AssetId;
  /** 周期描述，如 "monthly"、"weekly"。 */
  cadence?: string;
  typicalAmount?: number;
  occurrences: number;
  suggestedPolicyName?: string;
}

// ---------------------------------------------------------------------------
// Policy / PolicyVersion / PolicyRule（PRD §19-20）
// ---------------------------------------------------------------------------

export type PolicyStatus = "draft" | "active" | "paused" | "retired";

export interface Policy {
  id: string;
  name: string;
  objective: string;
  status: PolicyStatus;
  currentVersionId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  rules: PolicyRule[];
  changeReason?: string;
}

export type PolicyRule =
  | TargetAllocationRule
  | RegularInvestmentRule
  | AdditionalInvestmentRule
  | PauseRule
  | ReviewRule;

/** 目标配比规则：某维度目标 X%，允许 [min, max]。 */
export interface TargetAllocationRule {
  kind: "target_allocation";
  dimension: ExposureDimension;
  /** 维度取值，如 "NASDAQ" / "US"。 */
  value: string;
  targetPct: number;
  minPct: number;
  maxPct: number;
}

/** 正常定期投资规则。 */
export interface RegularInvestmentRule {
  kind: "regular_investment";
  description?: string;
  cadence?: string;
  amount?: number;
}

/** 允许额外增加的条件。 */
export interface AdditionalInvestmentRule {
  kind: "additional_investment";
  description?: string;
  conditions: string[];
}

/** 超过最大风险暴露后暂停新增。 */
export interface PauseRule {
  kind: "pause";
  dimension: ExposureDimension;
  value?: string;
  maxPct: number;
}

/** 满足条件后重新评估。 */
export interface ReviewRule {
  kind: "review";
  description?: string;
  conditions: string[];
}

// ---------------------------------------------------------------------------
// Action（PRD §22）
// ---------------------------------------------------------------------------

export type ActionType =
  | "POLICY_TRIGGER"
  | "RISK_REVIEW"
  | "UNCLASSIFIED_TRANSACTION"
  | "ABNORMAL_TRANSACTION"
  | "DATA_REQUIRED";

export type ActionStatus = "open" | "resolved" | "ignored";

export interface Action {
  id: string;
  type: ActionType;
  title?: string;
  status: ActionStatus;
  createdAt: string;
  resolvedAt?: string;
  detail?: string;
  /** 关联触发的交易，用于异常 / 未分类 Action。 */
  transactionId?: string;
  /** 关联触发的 Policy，用于规则触发 Action。 */
  policyId?: string;
}

// ---------------------------------------------------------------------------
// Evidence（PRD §25-27，V2.5 预留：本次仅定义结构，不实现引擎）
// ---------------------------------------------------------------------------

export type EvidenceStrength =
  | "INSUFFICIENT"
  | "WEAK"
  | "MODERATE"
  | "STRONG";

export interface Evidence {
  id: string;
  policyId?: string;
  observationPeriod: DateRange;
  executions: number;
  investedAmount: number;
  pnl: number;
  xirr?: number;
  twr?: number;
  maxDrawdown?: number;
  ruleDeviations: number;
  strength: EvidenceStrength;
}

// ---------------------------------------------------------------------------
// 一次性同步数据集（Adapter 整体返回真实来源标准化事实）
// ---------------------------------------------------------------------------

export interface InvestmentDataset {
  version: typeof INVESTMENT_PROTOCOL_VERSION;
  source: SourceId;
  capturedAt: string;
  account?: AccountSnapshot;
  portfolio?: PortfolioSnapshot;
  assets: AssetMetadata[];
  transactions: Transaction[];
  dailyPnl: DailyPnL[];
  coverage: DataCoverage[];
  /** Adapter / Sensor 产出的人类可读警告码与摘要。 */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// P0 纪律与执行复盘（Investment Review WP0-1 ~ WP0-3）
// 工程附录 §2-4。这些类型是由真实来源标准化事实驱动的 Core 契约；
// Core 不读取真实页面 DOM / Cookie / Token / Raw Snapshot / 登录态或完整 Network Logs。
// ---------------------------------------------------------------------------

/** 投资范围类型：单只基金是范围内的分析对象，不自动成为仓位分母。 */
export type InvestmentScopeType = "ACCOUNT" | "DECLARED_PORTFOLIO";

/** 仓位分母来源：none 时仓位判断降级为 INSUFFICIENT_DATA，不阻断其他判断。 */
export type DenominatorSource =
  | "account_total_asset"
  | "declared_investable"
  | "none";

/**
 * 用户声明的投资范围（WP0-1）。定义一次复盘包含什么，以及仓位百分比的分母口径。
 * 未声明的其他资产既不能自动纳入，也不能当作不存在。
 */
export interface InvestmentScope {
  scopeId: string;
  scopeType: InvestmentScopeType;
  /** 纳入范围的资产/账户引用（基金代码或统一资产 ID）。 */
  includedAssetIds: AssetId[];
  /** 明确排除项。 */
  excludedAssetIds?: AssetId[];
  baseCurrency: string;
  denominatorSource: DenominatorSource;
  /** 分母估值时点（YYYY-MM-DD）。 */
  denominatorAsOf?: string;
  /** 分母自身的 Coverage：分母数据不完整时只降级仓位判断。 */
  denominatorCoverage?: DataCoverage;
  effectiveFrom: string;
  effectiveTo?: string;
  /** 首次由 Investment OS 管理该范围的时间。后续同步必须保留，不能用最近采集时间覆盖。 */
  managementStartedAt?: string;
  /** 从该日期起才核对操作是否有事前计划；缺省表示尚未启用计划核对。 */
  operationReviewFrom?: string;
  /** 版本号：修订创建新版本，旧版本 effectiveTo，永不 mutate（沿用 PolicyVersion 范式）。 */
  version: number;
}

// ---- 事前规则（StrategyRuleVersion）-----------------------------------------

export type StrategyRule =
  | PositionBandRule
  | TrailingStopRule
  | ReductionTargetRule
  | PauseWindowRule
  | TakeProfitRule;

/** 单基金或组合仓位区间：用户事前声明，系统不发明"合理仓位"。 */
export interface PositionBandRule {
  kind: "position_band";
  /** 缺省表示该规则适用于 scope 维度的总仓位；否则针对单基金。 */
  assetId?: AssetId;
  targetPct?: number;
  minPct: number;
  maxPct: number;
}

/** 移动止损规则：basis 必须明确，语义不清时降级为 unknown（不制造止损线）。 */
export interface TrailingStopRule {
  kind: "trailing_stop";
  assetId: AssetId;
  basis: "nav_adjusted" | "nav_unadjusted" | "unknown";
  /** 回撤阈值，0-1。 */
  drawdownPct: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

/** 减仓目标区间：触发后用户希望回到的仓位范围。系统只按此计算恢复量，不预测卖点。 */
export interface ReductionTargetRule {
  kind: "reduction_target";
  assetId: AssetId;
  targetMinPct: number;
  targetMaxPct: number;
  allowedWindow?: DateRange;
}

/** 减仓计划：触发依据 + 目标区间 + 计划量，跨复盘保留以跟踪进度。 */
export interface ReductionPlan {
  id: string;
  scopeId: string;
  assetId: AssetId;
  triggerJudgmentId: string;
  targetBand: { minPct: number; maxPct: number };
  planned: number;
  unit: PlanValueUnit;
  ruleVersionRefs: string[];
  createdAt: string;
}

/** 新增暂停窗口规则（pause/conflict 场景）：与现有 PauseRule 区别在于按时间窗而非暴露阈值。 */
export interface PauseWindowRule {
  kind: "pause_window";
  assetId?: AssetId;
  window: DateRange;
  reason?: string;
}

/**
 * 目标收益率止盈规则：累计收益率（持仓成本→当前市值）达阈值时触发复核（不自动交易）。
 * 阈值由用户事前声明，系统不发明"合理止盈点"——与 position_band / trailing_stop 同属用户规则。
 * 主流机构对止盈不替用户决定，仅提供工具；本规则只生成待复核事项。
 */
export interface TakeProfitRule {
  kind: "take_profit";
  assetId: AssetId;
  /** 目标收益率，0-1（如 0.2 = 20%）。 */
  targetReturnPct: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

/** 策略规则版本：独立于现有 PolicyVersion，承载 P0 的仓位/止损/减仓规则。 */
export interface StrategyRuleVersion {
  id: string;
  scopeId: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  rules: StrategyRule[];
  changeReason?: string;
}

// ---- 事前计划与执行（WP0-2）-------------------------------------------------

export type PlanDirection = "BUY" | "SELL";

export type PlanValueUnit = "CNY" | "shares" | "pct";

/** 事前决策记录：核心字段不可被事后执行或解释覆盖，修订只追加 annotation。 */
export interface DecisionRecord {
  id: string;
  scopeId: string;
  policyVersionId?: string;
  strategyRuleVersionId?: string;
  assetId?: AssetId;
  direction: PlanDirection;
  plannedAmount?: number;
  plannedShares?: number;
  plannedPct?: number;
  allowedWindow?: DateRange;
  rationale?: string;
  decidedAt: string;
  failsIf?: string;
  status: "draft" | "recorded" | "reviewed";
  /** 事后追加，不改写前字段。 */
  annotations: string[];
  /** 标记事前不可变：true 时 Core 拒绝用已发生交易补写为 DecisionRecord。 */
  immutable: true;
}

/** 操作计划：把决策落成可执行的计划量。 */
export interface OperationPlan {
  id: string;
  decisionRecordId: string;
  scopeId: string;
  plannedValue: number;
  unit: PlanValueUnit;
  executionWindow?: DateRange;
  ruleVersionRefs: string[];
}

/** 计划与真实执行的关联：无法可靠关联时保持 unlinked，不按金额/日期相近自动猜测。 */
export interface ExecutionLink {
  id: string;
  transactionId?: string;
  decisionRecordId?: string;
  linkMethod: "source_id" | "declared" | "unlinked";
  confidence: "high" | "low" | "unknown";
  note?: string;
}

export type ExecutionStatus = TransactionStatus;

/** 计划状态机：draft → recorded → linked|unlinked → reviewed。 */
export type PlanStatus = "draft" | "recorded" | "linked" | "unlinked" | "reviewed";

export type ExecutionState =
  | "requested"
  | "partially_confirmed"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "unknown";

/** 操作偏离维度：分别独立输出，不合并为一个综合 deviation。 */
export interface OperationDeviation {
  dimension: "object" | "direction" | "amount" | "shares" | "pct" | "unit" | "timing";
  expected?: string;
  actual?: string;
  note?: string;
}

// ---- 按问题判断的通用结果（WP0-1/2/3 共用）----------------------------------

export type JudgmentStatus =
  | "VALID"
  | "PARTIAL"
  | "STALE"
  | "INSUFFICIENT_DATA"
  | "FAILED"
  | "UNKNOWN";

export type ProcessStatus = "COMPLIANT" | "PARTIAL" | "BREACH" | "INSUFFICIENT_DATA";

/** 用户问题枚举：页面必须把工程状态翻译成"哪个问题、当前结论、缺什么、还能回答什么"。 */
export type JudgmentQuestion =
  | "operation_compliance"
  | "position"
  | "trailing_stop"
  | "reduction_progress"
  | "take_profit";

/** 按问题的 Coverage：一个判断证据不足不阻断无依赖关系的判断。 */
export interface PerJudgmentCoverage {
  judgmentId: string;
  sources: string[];
  window?: DateRange;
  pagingComplete?: boolean;
  freshness?: "fresh" | "stale" | "unknown";
  warnings: string[];
  affectedJudgmentIds: string[];
}

/** 通用判断结果。value 是该问题的具体结论形态（操作/仓位/止损/减仓）。 */
export interface JudgmentResult<T> {
  judgmentId: string;
  question: JudgmentQuestion;
  status: JudgmentStatus;
  value: T;
  reason: string;
  ruleVersionRefs: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  /** 仍可回答的其他问题：一个缺口不污染整个复盘。 */
  stillAnswerable: JudgmentQuestion[];
  nextStep?: string;
  coverage: PerJudgmentCoverage;
}

// ---- 仓位判断（WP0-3）-------------------------------------------------------

export interface PositionJudgmentValue {
  assetId?: AssetId;
  denominatorEligible: boolean;
  positionPct?: number;
  band?: { minPct: number; maxPct: number; targetPct?: number };
  deviation?: { pct: number; direction: "over" | "under" | "within" | "unknown" };
  limitation?: string;
}

export type PositionJudgment = JudgmentResult<PositionJudgmentValue>;

// ---- 移动止损状态（WP0-3）---------------------------------------------------

export interface TrailingStopStateValue {
  assetId: AssetId;
  ruleVersionId: string;
  previousHighWaterMark?: number;
  currentHighWaterMark?: number;
  stopLine?: number;
  navBasis: "nav_adjusted" | "nav_unadjusted" | "unknown";
  asOf?: string;
  triggered: boolean;
}

export type TrailingStopJudgment = JudgmentResult<TrailingStopStateValue>;

// ---- 目标收益率止盈 --------------------------------------------------------

export interface TakeProfitValue {
  assetId: AssetId;
  ruleVersionId: string;
  costValue?: number;
  marketValue?: number;
  /** 当前累计收益率，0-1（基于成本至市值）。数据缺失时 undefined。 */
  currentReturnPct?: number;
  targetReturnPct: number;
  triggered: boolean;
  asOf?: string;
}

export type TakeProfitJudgment = JudgmentResult<TakeProfitValue>;

// ---- 减仓进度（WP0-3）-------------------------------------------------------

export type ReductionState =
  | "planned"
  | "requested"
  | "partially_confirmed"
  | "confirmed"
  | "confirmed_not_restored"
  | "restored"
  | "failed"
  | "cancelled";

export interface ReductionProgressValue {
  assetId: AssetId;
  triggerJudgmentId: string;
  targetBand: { minPct: number; maxPct: number };
  planned: number;
  requested: number;
  confirmed: number;
  remaining: number;
  postPositionPct?: number;
  state: ReductionState;
  limitation?: string;
}

export type ReductionProgressJudgment = JudgmentResult<ReductionProgressValue>;

// ---- 操作合规结果（WP0-2）---------------------------------------------------

export interface OperationComplianceValue {
  /** 关联到的决策记录；无计划时为 undefined。 */
  decisionRecordId?: string;
  transactionId?: string;
  /** 可读事实（用于下钻，不暴露内部键）。 */
  assetId?: AssetId;
  amount?: number;
  occurredAt?: string;
  direction?: PlanDirection;
  /** 交易前已存在、可由用户显式选择的记录；仅为候选，不代表自动匹配。 */
  priorDecisionRecordIds?: string[];
  planExists: boolean;
  deviations: OperationDeviation[];
  pauseConflict?: { ruleVersionId: string; window: DateRange };
  executionStatus: ExecutionState;
  /** 历史金额偏离只作为补充信号，不产生规则 breach。 */
  historicalAmountSignal?: boolean;
  conclusion: ProcessStatus;
}

export type OperationComplianceJudgment = JudgmentResult<OperationComplianceValue>;

// ---- 复盘行动与快照（WP0-1/4）-----------------------------------------------

export type ReviewActionKind =
  | "needy_action"
  | "acknowledged"
  | "waiting_execution"
  | "waiting_confirmation"
  | "waiting_recheck"
  | "resolved"
  | "dismissed_with_reason";

/** 复盘行动：与现有 Action 分库，避免污染既有 policy/behavior Action。 */
export interface ReviewAction {
  id: string;
  scopeId: string;
  judgmentId: string;
  kind: ReviewActionKind;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  note?: string;
}

/** 一次复盘的不可变快照：UI 只消费它，不重算 Core。 */
export interface ReviewSnapshot {
  id: string;
  scopeId: string;
  asOf: string;
  judgments: JudgmentResult<unknown>[];
  reviewActions: ReviewAction[];
  coverageSummary: {
    checked: number;
    breached: number;
    unknown: number;
    conforming: number;
  };
  /** 管理边界摘要；用于解释哪些历史事实没有进入计划合规判断。 */
  managementSummary?: {
    managementStartedAt?: string;
    operationReviewFrom?: string;
    operationReviewEnabled: boolean;
    historicalBaselineTransactions: number;
  };
  createdAt: string;
  immutable: true;
}
