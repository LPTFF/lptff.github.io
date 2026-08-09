/**
 * Investment OS Domain Model（Protocol v2.0）
 *
 * 这些类型是 Agent A Core 层的统一契约。Adapter（真实或 Mock）把来源数据转换成这些
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

export type MetadataQuality = "source" | "classified" | "unknown";

export interface AssetMetadataProvenance {
  assetClass: MetadataQuality;
  regions: MetadataQuality;
  indexes: MetadataQuality;
  currencies: MetadataQuality;
  themes: MetadataQuality;
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

export type TransactionType = "BUY" | "SELL" | "DIVIDEND" | "FEE" | "OTHER";

export type TransactionStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "UNKNOWN";

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
// 一次性同步数据集（Adapter 整体返回，便于 Mock Fixture 表达完整场景）
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
