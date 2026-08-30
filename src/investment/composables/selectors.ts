/**
 * 视图选择器：把 Ledger 标准事实转成页面需要的只读视图模型。
 *
 * 严格区分 Fact / Inference / Suggestion（PRD §6.4）：账户当前持仓 profitValue 聚合与累计盈亏分别
 * 返回，不得互相替代（PRD §17.2）；数据缺口必须给出"影响 / 不影响"两条结论（PRD §29）。
 */
import type {
  AccountSnapshot,
  Action,
  AssetMetadata,
  CoverageDataset,
  DailyPnL,
  DataCoverage,
  DecisionRecord,
  ExposureDimension,
  HoldingSnapshot,
  InvestmentScope,
  JudgmentResult,
  Policy,
  PolicyRule,
  PolicyVersion,
  PortfolioSnapshot,
  ReviewAction,
  ReviewSnapshot,
  StrategyRule,
  StrategyRuleVersion,
  Transaction,
} from "../domain";
import { confirmedBuyOrderRequestedAmount, confirmedUnitOf, transactionCashAmount } from "../domain";
import { classifyReviewJudgment } from "../engines/review/review-orchestrator";
import { aggregateExposure } from "../engines/exposure/exposure";
import { describeRuleRationale, type RuleRationale } from "../engines/policy/rule-rationale";
import type { BehaviorLogEntry } from "../engines/review/simulator-behavior";
import { HISTORICAL_CYCLES, navOfCycle, cycleLength, type IndexId } from "../engines/scenario/historical-cycles";
import type { AllCyclesResult } from "../engines/scenario/stress-test";

export interface AccountMetrics {
  totalAsset: number;
  currentHoldingPnl?: number;
  cumulativePnl?: number;
  maxDrawdown?: number;
  /** 当 currentHoldingPnl 缺失时为 true；兼容字段只表示持仓 profitValue 聚合，不提升其业务语义。 */
  holdingPnlUnknown: boolean;
}

export function buildAccountMetrics(
  account: AccountSnapshot | undefined,
  portfolio: PortfolioSnapshot | undefined,
  dailyPnl: DailyPnL[],
): AccountMetrics {
  const totalAsset = portfolio?.totalAsset ?? account?.totalAsset ?? 0;
  return {
    totalAsset,
    currentHoldingPnl: account?.currentHoldingPnl ?? portfolio?.currentHoldingPnl,
    cumulativePnl: account?.cumulativePnl,
    maxDrawdown: computeMaxDrawdown(dailyPnl),
    holdingPnlUnknown: (account?.currentHoldingPnl ?? portfolio?.currentHoldingPnl) === undefined,
  };
}

/** 基于 DailyPnL 累计现金流序列计算最大回撤（简化：按日累计 pnl 起算）。 */
export function computeMaxDrawdown(dailyPnl: DailyPnL[]): number | undefined {
  const series = [...dailyPnl].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!series.length) return undefined;
  let cumulative = 0;
  let peak = 0;
  let maxDd = 0;
  for (const point of series) {
    cumulative += point.pnl;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

// ---- 图表与明细核对 selector（investment-review.md 12.5）：只消费既有事实，不新增业务结论 ----

/** 累计盈亏逐日序列：按日聚合全部资产 pnl 后累加；日期缺口如实跳过，不插值不补零。 */
export interface CumulativePnlPoint {
  date: string;
  /** 当日全组合 pnl 合计（元）。 */
  pnl: number;
  /** 截至当日累计 pnl（元）。 */
  cumulative: number;
  /** 截至当日的历史峰值累计（回撤着色用，与 computeMaxDrawdown 同一口径）。 */
  runningPeak: number;
}

export function buildCumulativePnlSeries(dailyPnl: DailyPnL[]): CumulativePnlPoint[] {
  const byDate = new Map<string, number>();
  for (const p of dailyPnl) {
    byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.pnl);
  }
  const dates = [...byDate.keys()].sort();
  let cumulative = 0;
  let peak = 0;
  return dates.map((date) => {
    const pnl = Math.round((byDate.get(date) ?? 0) * 100) / 100;
    cumulative = Math.round((cumulative + pnl) * 100) / 100;
    if (cumulative > peak) peak = cumulative;
    return { date, pnl, cumulative, runningPeak: peak };
  });
}

/** 月度资金投入/流出序列（总览页）：买入=投入、卖出=流出；失败/撤销不计入，金额取确认优先。
 * 口径与明细页「买入金额」指标一致，投入合计可直接对账。 */
export interface MonthlyCashflowPoint {
  /** YYYY-MM。 */
  month: string;
  /** 当月投入（买入）金额合计（元）。 */
  buyAmount: number;
  /** 当月流出（卖出）金额合计（元）。 */
  sellAmount: number;
}

export function buildMonthlyCashflow(transactions: Transaction[]): MonthlyCashflowPoint[] {
  const byMonth = new Map<string, MonthlyCashflowPoint>();
  for (const t of transactions) {
    if (t.type !== "BUY" && t.type !== "SELL") continue;
    const month = (t.occurredAt ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const bucket = byMonth.get(month) ?? { month, buyAmount: 0, sellAmount: 0 };
    const value = transactionCashAmount(t);
    if (value === undefined) continue;
    if (t.type === "BUY") bucket.buyAmount = Math.round((bucket.buyAmount + value) * 100) / 100;
    else bucket.sellAmount = Math.round((bucket.sellAmount + value) * 100) / 100;
    byMonth.set(month, bucket);
  }
  return [...byMonth.values()].sort((a, b) => (a.month < b.month ? -1 : 1));
}

/** 交易明细核对行：逐笔翻译为可对账的只读行，不加任何“异常”标记（behaviorType 仅是信号）。 */
export interface TransactionLedgerRow {
  id: string;
  /** YYYY-MM-DD。 */
  date: string;
  assetId: string;
  assetName: string;
  type: Transaction["type"];
  amount: number;
  amountUnit: string;
  confirmedAmount?: number;
  confirmedAmountUnit?: string;
  status: Transaction["status"];
  /** 来源业务类型原文（逐笔核对锚点）；旧数据无原文时缺省，展示层回退系统翻译。 */
  businessTypeText?: string;
  /** 来源状态原文（逐笔核对锚点）；旧数据无原文时缺省，展示层回退系统翻译。 */
  statusText?: string;
  sourceType?: Transaction["sourceType"];
  behaviorType?: string;
  sourceTransactionId?: string;
}

/** 按月笔数分布（对账锚点：拿着来源 App 按月核对，不必逐页翻）。 */
export interface TransactionMonthBucket {
  month: string;
  count: number;
  buyCount: number;
  sellCount: number;
}

export interface TransactionLedgerView {
  /** 按日期升序的逐笔行。 */
  rows: TransactionLedgerRow[];
  total: number;
  /** 去重升序（过滤下拉用）。 */
  assetIds: string[];
  firstDate?: string;
  lastDate?: string;
  /** 按月升序。 */
  months: TransactionMonthBucket[];
}

export function buildTransactionLedger(transactions: Transaction[], assets: AssetMetadata[]): TransactionLedgerView {
  const nameById = new Map(assets.map((a) => [a.assetId, a.name ?? a.assetId]));
  const rows: TransactionLedgerRow[] = [...transactions]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0))
    .map((t) => ({
      id: t.id,
      date: (t.occurredAt ?? "").slice(0, 10),
      assetId: t.assetId,
      assetName: nameById.get(t.assetId) ?? t.assetId,
      type: t.type,
      amount: t.amount,
      amountUnit: t.amountUnit,
      confirmedAmount: t.confirmedAmount,
      confirmedAmountUnit: confirmedUnitOf(t),
      status: t.status,
      businessTypeText: t.businessTypeText,
      statusText: t.statusText,
      sourceType: t.sourceType,
      behaviorType: t.behaviorType ?? undefined,
      sourceTransactionId: t.sourceTransactionId,
    }));
  const monthMap = new Map<string, TransactionMonthBucket>();
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    const bucket = monthMap.get(month) ?? { month, count: 0, buyCount: 0, sellCount: 0 };
    bucket.count += 1;
    if (r.type === "BUY") bucket.buyCount += 1;
    if (r.type === "SELL") bucket.sellCount += 1;
    monthMap.set(month, bucket);
  }
  return {
    rows,
    total: rows.length,
    assetIds: [...new Set(rows.map((r) => r.assetId))].sort(),
    firstDate: rows[0]?.date,
    lastDate: rows.at(-1)?.date,
    months: [...monthMap.values()].sort((a, b) => (a.month < b.month ? -1 : 1)),
  };
}

/** 每日盈亏核对：范围、资产数与连续缺口区间；缺口只陈述“这些日期无记录”，不断言漏采。 */
export interface DailyPnlAuditView {
  firstDate?: string;
  lastDate?: string;
  pointCount: number;
  assetCount: number;
  /** 连续无记录天数超过阈值的区间（不含端点）。 */
  gaps: { from: string; to: string; days: number }[];
}

export function buildDailyPnlAudit(dailyPnl: DailyPnL[], gapThreshold = 3): DailyPnlAuditView {
  const dates = [...new Set(dailyPnl.map((p) => p.date))].sort();
  if (!dates.length) return { pointCount: 0, assetCount: 0, gaps: [] };
  const gaps: { from: string; to: string; days: number }[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 1; i < dates.length; i++) {
    const prev = Date.parse(`${dates[i - 1]}T00:00:00Z`);
    const next = Date.parse(`${dates[i]}T00:00:00Z`);
    const missingDays = Math.round((next - prev) / dayMs) - 1;
    if (missingDays > gapThreshold) {
      const from = new Date(prev + dayMs).toISOString().slice(0, 10);
      const to = new Date(next - dayMs).toISOString().slice(0, 10);
      gaps.push({ from, to, days: missingDays });
    }
  }
  return {
    firstDate: dates[0],
    lastDate: dates.at(-1),
    pointCount: dailyPnl.length,
    assetCount: new Set(dailyPnl.map((p) => p.assetId)).size,
    gaps,
  };
}

export interface PortfolioHoldingRow {
  assetId: string;
  name?: string;
  marketValue: number;
  pnl?: number;
  pnlRate?: number;
  pnlRateBasis?: HoldingSnapshot["pnlRateBasis"];
  pnlRateSourceField?: string;
  weight: number;
  indexes: string[];
  trackingIndexes: string[];
  benchmarkIndexes: string[];
  regions: string[];
  strategy?: string;
  metadataSource: "采集来源" | "原文提取" | "来源推导" | "待识别";
  metadataSourceUrl?: string;
  metadataAsOf?: string;
  metadataDetails: Array<{
    label: "跟踪指数" | "业绩基准指数" | "地区" | "主题";
    source: "字段采集" | "行业采集" | "跟踪标的" | "基准提取" | "档案提取" | "规则推导" | "待识别";
    sourceUrl?: string;
    asOf?: string;
    sourceSection?: string;
  }>;
}

export function buildPortfolioHoldings(
  portfolio: PortfolioSnapshot | undefined,
  assets: AssetMetadata[],
): PortfolioHoldingRow[] {
  if (!portfolio) return [];
  const assetMap = new Map(assets.map((a) => [a.assetId, a]));
  const totalValue = portfolio.holdings.reduce((s, h: HoldingSnapshot) => s + (h.marketValue || 0), 0) || 1;
  return portfolio.holdings.map((h) => {
    const meta = assetMap.get(h.assetId);
    const weight = h.weight ?? (h.marketValue || 0) / totalValue;
    const evidenceEntries = meta?.evidence ? Object.entries(meta.evidence) : [];
    const sourceEvidence = evidenceEntries.find(([dimension]) =>
      meta?.provenance?.[dimension as keyof NonNullable<typeof meta.provenance>] === "source",
    )?.[1] ?? evidenceEntries.find(([dimension]) =>
      meta?.provenance?.[dimension as keyof NonNullable<typeof meta.provenance>] === "extracted",
    )?.[1];
    const metadataDetails: PortfolioHoldingRow["metadataDetails"] = [
      {
        label: "跟踪指数",
        source: meta?.trackingIndexes?.length ? "跟踪标的" : "待识别",
        ...(meta?.trackingIndexEvidence?.sourceUrl ? { sourceUrl: meta.trackingIndexEvidence.sourceUrl } : {}),
      },
      {
        label: "业绩基准指数",
        source: meta?.benchmarkIndexes?.length ? "基准提取" : "待识别",
        ...(meta?.benchmarkIndexEvidence?.sourceUrl ? { sourceUrl: meta.benchmarkIndexEvidence.sourceUrl } : {}),
      },
      ...([ ["地区", "regions"], ["主题", "themes"] ] as const).map(([label, key]) => {
      const quality = meta?.provenance?.[key] ?? "unknown";
      const evidence = meta?.evidence?.[key];
      const source: PortfolioHoldingRow["metadataDetails"][number]["source"] = quality === "source"
        ? evidence?.sourceField === "tracked-index"
          ? "跟踪标的"
          : evidence?.sourceField === "industry-allocation"
            ? "行业采集"
            : "字段采集"
        : quality === "extracted"
          ? evidence?.sourceField === "benchmark" ? "基准提取" : "档案提取"
          : quality === "classified" ? "规则推导" : "待识别";
      return {
        label,
        source,
        ...(evidence?.sourceUrl ? { sourceUrl: evidence.sourceUrl } : {}),
        ...(evidence?.asOf ? { asOf: evidence.asOf } : {}),
        ...(evidence?.sourceSection ? { sourceSection: evidence.sourceSection } : {}),
      };
      }),
    ];
    return {
      assetId: h.assetId,
      name: h.name ?? meta?.name,
      marketValue: h.marketValue,
      pnl: h.pnl,
      pnlRate: h.pnlRate,
      pnlRateBasis: h.pnlRateBasis,
      pnlRateSourceField: h.pnlRateSourceField,
      weight,
      indexes: meta?.indexes ?? [],
      trackingIndexes: meta?.trackingIndexes ?? [],
      benchmarkIndexes: meta?.benchmarkIndexes ?? [],
      regions: meta?.regions ?? [],
      strategy: meta?.themes?.join(" / ") || undefined,
      metadataSource: Object.values(meta?.provenance ?? {}).includes("source")
        ? "采集来源"
        : Object.values(meta?.provenance ?? {}).includes("extracted")
          ? "原文提取"
          : Object.values(meta?.provenance ?? {}).includes("classified")
            ? "来源推导"
            : "待识别",
      metadataSourceUrl: sourceEvidence?.sourceUrl,
      metadataAsOf: sourceEvidence?.asOf,
      metadataDetails,
    };
  });
}

export type PortfolioNumericSortKey = "marketValue" | "pnl" | "pnlRate" | "weight";
export type SortOrder = "ascending" | "descending";

/** 数值排序不修改 Ledger 原数组；未知值固定置后，数值相同时保持原顺序。 */
export function sortPortfolioHoldings(
  rows: PortfolioHoldingRow[],
  key: PortfolioNumericSortKey,
  order: SortOrder,
): PortfolioHoldingRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aValue = a.row[key];
      const bValue = b.row[key];
      const aUnknown = aValue === undefined || !Number.isFinite(aValue);
      const bUnknown = bValue === undefined || !Number.isFinite(bValue);
      if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
      if (aUnknown && bUnknown) return a.index - b.index;
      const difference = Number(aValue) - Number(bValue);
      if (difference === 0) return a.index - b.index;
      return order === "ascending" ? difference : -difference;
    })
    .map(({ row }) => row);
}

export interface CoverageGapView {
  dataset: CoverageDataset;
  completeness: DataCoverage["completeness"];
  missingRanges: string[];
  impact: string;
  notAffected: string;
  /** 恢复指引：该缺口如何补齐（下一步行动），形成缺口→影响→指引→去采集闭环。 */
  recover: string;
}

const DATASET_IMPACT: Record<CoverageDataset, { impact: string; notAffected: string; recover: string }> = {
  transactions: {
    impact: "无法可靠计算该时期的主动交易策略收益。",
    notAffected: "不影响当前持仓风险分析。",
    recover: "下载或重新加载 3.0.2 版插件，再点「重新采集投资数据」；完成后读取待导入数据。",
  },
  dailyPnl: {
    impact: "无法生成完整的每日盈亏曲线与最大回撤。",
    notAffected: "不影响当前持仓与风险结构展示。",
    recover: "点「重新采集投资数据」补齐每日净值与盈亏（采集按持仓日期逐日生成）。",
  },
  account: {
    impact: "无法确认账户资产状态。",
    notAffected: "不影响已记录持仓。",
    recover: "点「重新采集投资数据」重采账户总资产快照。",
  },
  holdings: {
    impact: "无法确认当前持仓。",
    notAffected: "不影响历史交易记录。",
    recover: "点「重新采集投资数据」重采当前持仓列表。",
  },
  fundDetail: {
    impact: "无法补齐底层资产元数据。",
    notAffected: "不影响已有暴露聚合。",
    recover: "点「重新采集投资数据」补齐每只基金的底层指数/地区/主题元数据。",
  },
};

export function buildCoverageGaps(coverage: DataCoverage[]): CoverageGapView[] {
  return coverage
    .filter((c) => c.completeness !== "complete")
    .map((c) => ({
      dataset: c.dataset,
      completeness: c.completeness,
      missingRanges: summarizeMissingRanges(c),
      impact: DATASET_IMPACT[c.dataset].impact,
      notAffected: DATASET_IMPACT[c.dataset].notAffected,
      recover: DATASET_IMPACT[c.dataset].recover,
    }));
}

function summarizeMissingRanges(c: DataCoverage): string[] {
  if (c.completeness === "unknown") return ["全部范围未知"];
  const pageWarning = c.warningCodes.find((warning) => warning.startsWith("eastmoney:transactions-pages:"));
  if (pageWarning) {
    const [observed = "0", expected = "?"] = pageWarning.slice("eastmoney:transactions-pages:".length).split("/");
    return [`交易分页只采集 ${observed}/${expected} 页`];
  }
  const recordWarning = c.warningCodes.find((warning) => warning.startsWith("eastmoney:transactions-records:"));
  if (recordWarning) {
    const [observed = "0", expected = "?"] = recordWarning.slice("eastmoney:transactions-records:".length).split("/");
    return [`交易记录只采集 ${observed}/${expected} 笔`];
  }
  const labels: Record<string, string> = {
    "eastmoney:transactions-partial": "存在未加载的交易分页",
    "eastmoney:transactions-source-warning": "交易来源接口返回异常",
  };
  const translated = c.warningCodes.map((warning) => labels[warning] || warning);
  return translated.length ? translated : ["存在未加载分页或历史范围"];
}

export interface RecentChangesView {
  transactionCount: number;
  buyCount: number;
  sellCount: number;
  summary: string;
}

export function buildRecentChanges(transactions: Transaction[]): RecentChangesView {
  const recent = transactions.slice(-50);
  const buyCount = recent.filter((t) => t.type === "BUY").length;
  const sellCount = recent.filter((t) => t.type === "SELL").length;
  const summary = recent.length
    ? `新增 ${recent.length} 笔交易（买入 ${buyCount} / 卖出 ${sellCount}）`
    : "暂无新增交易";
  return { transactionCount: recent.length, buyCount, sellCount, summary };
}

// ---- Investment Review P0 三栏结论（WP0-4）----
// 首屏按用户问题组织：需处理 / 已符合 / 暂不能判断。
// 每个结论可下钻到事实、规则版本、Coverage、限制和下一步。

const QUESTION_LABEL: Record<string, string> = {
  operation_compliance: "操作是否符合计划",
  position: "仓位是否越界",
  trailing_stop: "移动止损是否变化",
  reduction_progress: "减仓与恢复进度",
  take_profit: "目标收益率是否达标",
};

export type ReviewPrimaryAction =
  | "link_plan"
  | "record_review"
  | "sync_data"
  | "wait_confirmation"
  | "create_reduction_plan"
  | "manage_rule"
  | "track_portfolio";

export interface ReviewConclusionView {
  judgmentId: string;
  question: JudgmentResult<unknown>["question"];
  questionLabel: string;
  status: JudgmentResult<unknown>["status"];
  statusLabel: string;
  groupKey: string;
  groupTitle: string;
  subjectLabel: string;
  assetId?: string;
  occurredAt?: string;
  directionLabel?: string;
  executionLabel?: string;
  reason: string;
  meaning: string;
  cannotProve: string;
  nextStep?: string;
  primaryAction?: ReviewPrimaryAction;
  primaryActionLabel?: string;
  transactionId?: string;
  /** 是否有当时生效的规则版本（只在有时显示，避免"规则版本（无）"困扰用户）。 */
  ruleVersionLabel?: string;
  /** 人话证据摘要（替代内部 evidenceRefs 键）。 */
  evidenceSummary: string;
  missingEvidence: string[];
  /** 翻译后的 Coverage 警告（空则不渲染该行）。 */
  coverageWarnings: string[];
  limitation?: string;
  /** 关联的处置行动 id（若有）。 */
  actionId?: string;
  /** 当前处置状态（needy_action=尚未处置）。 */
  actionKind?: string;
  actionKindLabel?: string;
  actionNote?: string;
}

const STATUS_LABEL: Record<string, string> = {
  VALID: "证据已满足",
  PARTIAL: "执行进行中",
  STALE: "等待更新",
  INSUFFICIENT_DATA: "还缺证据",
  FAILED: "执行未完成",
  UNKNOWN: "等待来源确认",
};

const COVERAGE_WARNING_LABEL: Record<string, string> = {
  "denominator:none": "账户总额未声明",
  "denominator:ineligible": "账户总额缺失或不可靠",
  "trailing_stop:triggered": "移动止损已触发",
  "trailing_stop:nav-missing": "当前净值缺失",
  "trailing_stop:nav-stale": "当前净值陈旧",
  "trailing_stop:basis-unknown": "净值复权口径不清",
  "take_profit:triggered": "目标收益率已达标",
  "take_profit:data-missing": "持仓成本或市值缺失",
};

const EXECUTION_LABEL: Record<string, string> = {
  requested: "已申请未确认",
  partially_confirmed: "部分确认",
  confirmed: "已确认",
  failed: "失败",
  cancelled: "已撤销",
  unknown: "状态不清",
};

const REVIEW_ACTION_KIND_LABEL: Record<string, string> = {
  needy_action: "待处理",
  acknowledged: "已知晓",
  waiting_execution: "等待执行",
  waiting_confirmation: "等待确认",
  waiting_recheck: "等待复核",
  resolved: "已解决",
  dismissed_with_reason: "已忽略（带理由）",
};

const REDUCTION_STATE_LABEL: Record<string, string> = {
  planned: "已计划，待提交申请",
  requested: "已申请，未确认",
  partially_confirmed: "部分确认，进行中",
  confirmed: "已确认，待复核仓位",
  confirmed_not_restored: "已确认，但仍越界",
  restored: "已确认，仓位回到区间",
  failed: "失败",
  cancelled: "已撤销",
};

const DIR_LABEL: Record<string, string> = { BUY: "买入", SELL: "卖出" };

function pct(v: number | undefined): string {
  return v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;
}

function describeEvidence(j: JudgmentResult<unknown>): string {
  const v = j.value as Record<string, unknown>;
  switch (j.question) {
    case "position": {
      const asset = v.assetId ? `基金 ${v.assetId}` : "整个范围";
      const band = v.band as { minPct: number; maxPct: number } | undefined;
      return `已看：${asset} 当前仓位 ${pct(v.positionPct as number | undefined)}${band ? `，你的区间是 [${pct(band.minPct)}, ${pct(band.maxPct)}]` : ""}。`;
    }
    case "operation_compliance": {
      const parts: string[] = [];
      parts.push(`基金 ${v.assetId ?? "?"}，${DIR_LABEL[v.direction as string] ?? "操作"} ${v.amount ?? "?"} 元（${(v.occurredAt as string)?.slice(0, 10) ?? "?"}）`);
      parts.push(`确认状态：${EXECUTION_LABEL[v.executionStatus as string] ?? "未知"}`);
      if (v.planExists) parts.push("有匹配的事前计划");
      else parts.push("无匹配的事前计划");
      if (v.historicalAmountSignal) parts.push("历史金额偏离信号（仅提示，不等于违规）");
      return "已看：" + parts.join("；") + "。";
    }
    case "trailing_stop": {
      const parts: string[] = [`基金 ${v.assetId}`];
      if (v.currentHighWaterMark !== undefined) parts.push(`高水位 ${(v.currentHighWaterMark as number).toFixed(4)}`);
      if (v.stopLine !== undefined) parts.push(`止损线 ${(v.stopLine as number).toFixed(4)}`);
      parts.push(v.triggered ? "当前已触发" : "当前未触发");
      return "已看：" + parts.join("；") + "。";
    }
    case "reduction_progress": {
      const parts: string[] = [`基金 ${v.assetId}`, `状态：${REDUCTION_STATE_LABEL[v.state as string] ?? v.state}`];
      parts.push(`估算计划减仓 ${v.planned ?? 0} / 已确认 ${v.confirmed ?? 0} / 估算剩余 ${v.remaining ?? 0}；成交后按新持仓与新分母复核`);
      if (v.postPositionPct !== undefined) parts.push(`操作后仓位 ${pct(v.postPositionPct as number)}`);
      return "已看：" + parts.join("；") + "。";
    }
    case "take_profit": {
      const current = v.currentReturnPct as number | undefined;
      const target = v.targetReturnPct as number | undefined;
      return `已看：基金 ${v.assetId ?? "?"} 当前累计收益率 ${pct(current)}，你的目标是 ${pct(target)}。`;
    }
    default:
      return "";
  }
}

function translateWarnings(codes: string[]): string[] {
  return codes.map((c) => COVERAGE_WARNING_LABEL[c] ?? c);
}

function assetLabel(assetId: unknown, assets: AssetMetadata[]): string {
  if (!assetId) return "整个投资范围";
  const id = String(assetId);
  const asset = assets.find((item) => item.assetId === id);
  return asset?.name ? `${asset.name}（${id}）` : `基金 ${id}`;
}

interface ReviewPresentation {
  statusLabel: string;
  groupKey: string;
  groupTitle: string;
  meaning: string;
  cannotProve: string;
  primaryAction?: ReviewPrimaryAction;
  primaryActionLabel?: string;
}

function operationPresentation(value: Record<string, unknown>): ReviewPresentation {
  const conclusion = String(value.conclusion ?? "");
  const executionStatus = String(value.executionStatus ?? "unknown");
  const hasPriorPlan = Array.isArray(value.priorDecisionRecordIds)
    && value.priorDecisionRecordIds.length > 0;
  if (conclusion === "BREACH" && !value.planExists) {
    return hasPriorPlan
      ? {
          statusLabel: "等待关联",
          groupKey: "operation:link-plan",
          groupTitle: "已确认操作等待关联事前计划",
          meaning: "系统确认这笔操作已发生，也发现了交易前存在的候选计划，但不会替你猜测对应关系。",
          cannotProve: "尚不能证明它符合哪一份计划，也不代表交易结果错误。",
          primaryAction: "link_plan",
          primaryActionLabel: "选择对应的事前计划",
        }
      : {
          statusLabel: "计划记录缺口",
          groupKey: "operation:missing-plan",
          groupTitle: "已确认操作缺少可验证的事前计划",
          meaning: "系统确认这笔操作发生在计划核对启用之后，但没有找到交易前已保存的计划记录。",
          cannotProve: "这里只能证明管理流程有记录缺口，不能证明基金、方向或盈亏结果错误。",
          primaryAction: "record_review",
          primaryActionLabel: "记录本次复盘",
        };
  }
  if (conclusion === "COMPLIANT") {
    return {
      statusLabel: "按计划完成",
      groupKey: "operation:compliant",
      groupTitle: "操作已按关联计划完成",
      meaning: "来源执行结果与用户显式关联的事前计划一致。",
      cannotProve: "这不代表投资一定盈利，也不评价基金好坏。",
    };
  }
  if (executionStatus === "requested" || executionStatus === "partially_confirmed") {
    return {
      statusLabel: executionStatus === "requested" ? "等待确认" : "部分确认",
      groupKey: `operation:${executionStatus}`,
      groupTitle: executionStatus === "requested" ? "操作申请等待来源确认" : "操作仍在部分确认",
      meaning: "系统只确认申请或部分确认事实，最终执行尚未完成。",
      cannotProve: "当前不能判断最终是否按计划完成。",
      primaryAction: "sync_data",
      primaryActionLabel: "查看执行进度",
    };
  }
  if (executionStatus === "unknown") {
    return {
      statusLabel: "等待执行结果",
      groupKey: "operation:unknown-execution",
      groupTitle: "操作执行结果等待来源确认",
      meaning: "来源保留了操作记录，但没有提供系统可解释的最终执行状态。",
      cannotProve: "当前不能把它当作成功、失败或违规。",
      primaryAction: "sync_data",
      primaryActionLabel: "重新同步执行结果",
    };
  }
  return {
    statusLabel: STATUS_LABEL[String(value.status ?? "")] ?? "等待处理",
    groupKey: `operation:${conclusion}:${executionStatus}`,
    groupTitle: "操作需要进一步确认",
    meaning: "系统已经保留来源执行事实。",
    cannotProve: "当前证据不足以完成计划核对。",
    primaryAction: "sync_data",
    primaryActionLabel: "查看数据与证据",
  };
}

function judgmentPresentation(
  judgment: JudgmentResult<unknown>,
  value: Record<string, unknown>,
): ReviewPresentation | undefined {
  if (judgment.question === "operation_compliance") return operationPresentation(value);
  if (judgment.question === "position") {
    const direction = (value.deviation as { direction?: string } | undefined)?.direction;
    const statusLabel = direction === "over"
      ? "超过仓位上限"
      : direction === "under"
        ? "低于仓位下限"
        : direction === "within"
          ? "仓位在区间内"
          : "等待账户总额";
    return {
      statusLabel,
      groupKey: `position:${direction ?? judgment.status}`,
      groupTitle: direction === "over" || direction === "under" ? "仓位偏离你的区间" : "仓位规则检查",
      meaning: judgment.reason,
      cannotProve: "仓位偏离只说明当前事实与用户区间不一致，不评价基金好坏或未来收益。",
      primaryAction: direction === "over" ? "create_reduction_plan" : direction === "under" ? "track_portfolio" : judgment.status === "VALID" ? undefined : "sync_data",
      primaryActionLabel: direction === "over" ? "制定减仓计划" : direction === "under" ? "查看组合" : judgment.status === "VALID" ? undefined : "补齐仓位证据",
    };
  }
  if (judgment.question === "trailing_stop") {
    const triggered = value.triggered === true;
    return {
      statusLabel: triggered ? "移动止损已触发" : judgment.status === "VALID" ? "移动止损未触发" : STATUS_LABEL[judgment.status] ?? judgment.status,
      groupKey: `trailing_stop:${triggered ? "triggered" : judgment.status}`,
      groupTitle: triggered ? "移动止损触发待复核" : "移动止损状态",
      meaning: judgment.reason,
      cannotProve: "移动止损触发只表示需要人复核，不是自动赎回指令，也不预测后续涨跌。",
      primaryAction: triggered ? "create_reduction_plan" : judgment.status === "VALID" ? undefined : "sync_data",
      primaryActionLabel: triggered ? "制定减仓计划" : judgment.status === "VALID" ? undefined : "更新净值证据",
    };
  }
  if (judgment.question === "take_profit") {
    const triggered = value.triggered === true;
    return {
      statusLabel: triggered ? "收益目标已触发" : judgment.status === "VALID" ? "尚未达到收益目标" : STATUS_LABEL[judgment.status] ?? judgment.status,
      groupKey: `take_profit:${triggered ? "triggered" : judgment.status}`,
      groupTitle: triggered ? "收益目标触发待复核" : "收益目标检查",
      meaning: judgment.reason,
      cannotProve: "达到收益目标不等于必须赎回，也不证明规则长期有效。",
      primaryAction: triggered ? "create_reduction_plan" : judgment.status === "VALID" ? undefined : "sync_data",
      primaryActionLabel: triggered ? "制定减仓计划" : judgment.status === "VALID" ? undefined : "补齐成本与市值",
    };
  }
  if (judgment.question === "reduction_progress") {
    const state = String(value.state ?? "");
    const restored = state === "restored";
    const waiting = state === "requested" || state === "partially_confirmed" || state === "confirmed";
    return {
      statusLabel: REDUCTION_STATE_LABEL[state] ?? STATUS_LABEL[judgment.status] ?? judgment.status,
      groupKey: `reduction:${state || judgment.status}`,
      groupTitle: restored ? "减仓后已恢复到目标区间" : waiting ? "减仓正在等待执行或复核" : "减仓仍需处理",
      meaning: judgment.reason,
      cannotProve: "只有来源确认并用新的可比分母复算后，才能证明仓位已经恢复。",
      primaryAction: restored ? undefined : waiting ? "sync_data" : "create_reduction_plan",
      primaryActionLabel: restored ? undefined : waiting ? "更新执行与仓位" : "确认减仓计划",
    };
  }
  return undefined;
}

function toView(
  j: JudgmentResult<unknown>,
  assets: AssetMetadata[],
  action?: ReviewAction,
): ReviewConclusionView {
  const value = j.value as Record<string, unknown> & { limitation?: string };
  const presentation = judgmentPresentation(j, value);
  const subject = assetLabel(value.assetId, assets);
  const genericNeedsAction = classifyReviewJudgment(j, action) === "needs_action";
  const genericPrimaryAction: ReviewPrimaryAction | undefined = genericNeedsAction
    ? j.question === "reduction_progress" ? "track_portfolio" : "manage_rule"
    : j.status === "VALID" ? undefined : "sync_data";
  const genericActionLabel = genericPrimaryAction === "track_portfolio"
    ? "查看组合与恢复进度"
    : genericPrimaryAction === "manage_rule"
      ? "查看对应规则"
      : genericPrimaryAction === "sync_data"
        ? "查看数据与证据"
        : undefined;
  return {
    judgmentId: j.judgmentId,
    question: j.question,
    questionLabel: QUESTION_LABEL[j.question] ?? j.question,
    status: j.status,
    statusLabel: presentation?.statusLabel ?? STATUS_LABEL[j.status] ?? j.status,
    groupKey: presentation?.groupKey ?? `${j.question}:${j.status}:${j.reason}`,
    groupTitle: presentation?.groupTitle ?? (QUESTION_LABEL[j.question] ?? j.question),
    subjectLabel: subject,
    assetId: typeof value.assetId === "string" ? value.assetId : undefined,
    occurredAt: typeof value.occurredAt === "string" ? value.occurredAt.slice(0, 10) : undefined,
    directionLabel: DIR_LABEL[String(value.direction ?? "")],
    executionLabel: value.executionStatus
      ? EXECUTION_LABEL[String(value.executionStatus)] ?? String(value.executionStatus)
      : undefined,
    reason: j.reason,
    meaning: presentation?.meaning ?? j.reason,
    cannotProve: presentation?.cannotProve ?? "这项过程判断不评价基金优劣、未来收益，也不会触发自动交易。",
    nextStep: j.nextStep,
    primaryAction: presentation?.primaryAction ?? genericPrimaryAction,
    primaryActionLabel: presentation?.primaryActionLabel ?? genericActionLabel,
    transactionId: typeof value.transactionId === "string" ? value.transactionId : undefined,
    ruleVersionLabel: j.ruleVersionRefs.length ? "按当时生效的规则版本检查" : undefined,
    evidenceSummary: describeEvidence(j),
    missingEvidence: j.missingEvidence,
    coverageWarnings: translateWarnings(j.coverage.warnings),
    limitation: value.limitation,
    actionId: action?.id,
    actionKind: action?.kind,
    actionKindLabel: action ? (REVIEW_ACTION_KIND_LABEL[action.kind] ?? action.kind) : undefined,
    actionNote: action?.note,
  };
}

export interface ReviewConclusionGroup {
  key: string;
  title: string;
  items: ReviewConclusionView[];
}

export interface ReviewManagementStatus {
  state: "preparing" | "needs_action" | "waiting" | "complete";
  title: string;
  description: string;
  limitation: string;
  primaryAction?: "create_rule" | "create_plan" | "handle_review" | "sync_data";
  primaryActionLabel?: string;
}

export interface ReviewConclusions {
  needsAction: ReviewConclusionView[];
  conforming: ReviewConclusionView[];
  undetermined: ReviewConclusionView[];
  needsActionGroups: ReviewConclusionGroup[];
  conformingGroups: ReviewConclusionGroup[];
  undeterminedGroups: ReviewConclusionGroup[];
  management: ReviewManagementStatus;
  summary: ReviewSnapshot["coverageSummary"];
}

export interface ReviewSelectorContext {
  hasRules?: boolean;
  hasDecisionRecords?: boolean;
}

function groupConclusions(items: ReviewConclusionView[]): ReviewConclusionGroup[] {
  const groups = new Map<string, ReviewConclusionGroup>();
  for (const item of items) {
    const group = groups.get(item.groupKey);
    if (group) group.items.push(item);
    else groups.set(item.groupKey, { key: item.groupKey, title: item.groupTitle, items: [item] });
  }
  return [...groups.values()];
}

function managementStatus(
  snapshot: ReviewSnapshot,
  context: ReviewSelectorContext,
  needsAction: ReviewConclusionView[],
  undetermined: ReviewConclusionView[],
): ReviewManagementStatus {
  if (context.hasRules === false) {
    return {
      state: "preparing",
      title: "管理准备中：先声明第一条规则",
      description: "真实事实已经进入 Ledger，但系统不会替你发明仓位、止损或减仓阈值。",
      limitation: "当前状态只表示规则尚未建立，不评价基金或收益是否健康。",
      primaryAction: "create_rule",
      primaryActionLabel: "建立首版规则",
    };
  }
  if (snapshot.managementSummary?.operationReviewEnabled === false || context.hasDecisionRecords === false) {
    return {
      state: "preparing",
      title: "管理准备中：记录下一笔事前计划",
      description: "历史操作已作为管理基线保存；从第一笔事前计划之后的新操作开始核对。",
      limitation: "历史基线不会被事后改判为计划外，也不能补写成事前计划。",
      primaryAction: "create_plan",
      primaryActionLabel: "记录事前计划",
    };
  }
  if (needsAction.length) {
    return {
      state: "needs_action",
      title: `有 ${needsAction.length} 项管理流程需要处理`,
      description: "优先处理已确认的规则偏离或计划记录缺口，完成后再用新事实复核。",
      limitation: "待处理只描述管理过程，不代表基金选择或交易结果错误。",
      primaryAction: "handle_review",
      primaryActionLabel: "处理第一项",
    };
  }
  if (undetermined.length) {
    return {
      state: "waiting",
      title: `有 ${undetermined.length} 项正在等待执行或数据更新`,
      description: "系统保留未知，不用缺失证据制造确定结论。",
      limitation: "等待状态既不算符合，也不算违规。",
      primaryAction: "sync_data",
      primaryActionLabel: "更新数据与证据",
    };
  }
  return {
    state: "complete",
    title: "本期管理检查已完成",
    description: "当前已检查项目均有足够证据并完成过程核对。",
    limitation: "这不代表组合没有风险，也不承诺未来盈利。",
  };
}

/** 把 ReviewSnapshot 转成管理状态与三组用户结论，供 ReviewView 直接渲染。 */
export function buildReviewConclusions(
  snapshot: ReviewSnapshot | undefined,
  assets: AssetMetadata[] = [],
  context: ReviewSelectorContext = {},
): ReviewConclusions {
  const emptySummary = { checked: 0, breached: 0, unknown: 0, conforming: 0 };
  if (!snapshot) {
    return {
      needsAction: [],
      conforming: [],
      undetermined: [],
      needsActionGroups: [],
      conformingGroups: [],
      undeterminedGroups: [],
      management: {
        state: "preparing",
        title: "等待复盘事实",
        description: "请先导入账户事实或推进模拟器。",
        limitation: "没有事实时系统不会生成管理结论。",
      },
      summary: emptySummary,
    };
  }
  const actionByJudgment = new Map<string, ReviewAction>();
  for (const action of snapshot.reviewActions) {
    actionByJudgment.set(action.judgmentId, action);
  }
  const needsAction: ReviewConclusionView[] = [];
  const conforming: ReviewConclusionView[] = [];
  const undetermined: ReviewConclusionView[] = [];
  for (const judgment of snapshot.judgments) {
    const action = actionByJudgment.get(judgment.judgmentId);
    const view = toView(judgment, assets, action);
    const verdict = classifyReviewJudgment(judgment, action);
    if (verdict === "needs_action") needsAction.push(view);
    else if (verdict === "conforming") conforming.push(view);
    else undetermined.push(view);
  }
  return {
    needsAction,
    conforming,
    undetermined,
    needsActionGroups: groupConclusions(needsAction),
    conformingGroups: groupConclusions(conforming),
    undeterminedGroups: groupConclusions(undetermined),
    management: managementStatus(snapshot, context, needsAction, undetermined),
    summary: snapshot.coverageSummary,
  };
}

// ---- 目标配置 vs 实际偏离（Layer 1 State 强化）---------------------------
// 只对照用户已声明的规则（TargetAllocationRule / PositionBandRule），系统不发明阈值。
// 无规则时返回空数组，页面展示 unknown，不伪造"合理配置"。
// 与 P0 边界一致：阈值必须由用户事前声明。

export const DIMENSION_LABEL: Record<ExposureDimension, string> = {
  index: "风险映射指数",
  region: "投资市场",
  assetClass: "底层资产类型",
  currency: "份额计价币种",
  theme: "行业主题",
};

export const CONTEXT_ASSET_CLASS_LABEL: Record<string, string> = {
  equity: "股票",
  bond: "债券",
  commodity: "商品",
  cash: "货币",
  other: "其他",
};

export const CONTEXT_CURRENCY_LABEL: Record<string, string> = {
  CNY: "人民币",
  USD: "美元",
  HKD: "港币",
  EUR: "欧元",
};

function dimensionSliceLabel(dimension: ExposureDimension, value: string): string {
  if (dimension === "assetClass") return CONTEXT_ASSET_CLASS_LABEL[value] ?? value;
  if (dimension === "currency") return CONTEXT_CURRENCY_LABEL[value] ?? value;
  return value;
}

export interface AllocationDrift {
  scope: "dimension" | "asset";
  /** 维度规则才有：所属暴露维度。 */
  dimension?: ExposureDimension;
  /** 维度规则的取值（如 NASDAQ100 / US）。 */
  value?: string;
  /** 单基金规则才有：基金代码。 */
  assetId?: string;
  /** 人类可读标签（维度值中文名 / 基金名），供页面与 Context 包直接使用。 */
  label: string;
  /** 当前实际占比，0-1。 */
  actualPct: number;
  /** 用户声明目标，0-1；未声明时省略。 */
  targetPct?: number;
  minPct: number;
  maxPct: number;
  direction: "over" | "under" | "within";
  ruleSource: "target_allocation" | "position_band";
  /** 这条规则的理论依据（意图 + 理论概念 + 阈值诚实依据），让分析可追溯。 */
  rationale?: RuleRationale;
}

function driftDirection(actual: number, minPct: number, maxPct: number): AllocationDrift["direction"] {
  if (actual > maxPct) return "over";
  if (actual < minPct) return "under";
  return "within";
}

/**
 * 计算用户声明的目标配置与当前实际配置的偏离。
 * - 维度规则（TargetAllocationRule）：按 dimension 聚合暴露，取 value 切片占比对比 [min,max]。
 *   币种维度沿用"单币种不分析"原则，未知桶（未标注）不参与对比。
 * - 单基金规则（PositionBandRule）：取该持仓 weight 对比区间。
 * 不发明阈值、不评价基金好坏；偏离只表示当前事实与用户区间不一致。
 */
export function buildAllocationDrift(
  activeVersions: PolicyVersion[],
  strategyRuleVersions: StrategyRuleVersion[],
  portfolio: PortfolioSnapshot | undefined,
  assets: AssetMetadata[],
): AllocationDrift[] {
  if (!portfolio) return [];
  const out: AllocationDrift[] = [];
  const assetMap = new Map(assets.map((a) => [a.assetId, a]));

  for (const version of activeVersions) {
    for (const rule of version.rules) {
      if (rule.kind !== "target_allocation") continue;
      const slices = aggregateExposure(portfolio.holdings, assets, rule.dimension);
      const matched = rule.value ? slices.filter((s) => s.value === rule.value) : slices;
      for (const slice of matched) {
        if (slice.value === "（未标注）") continue;
        out.push({
          scope: "dimension",
          dimension: rule.dimension,
          value: slice.value,
          label: `${DIMENSION_LABEL[rule.dimension]} · ${dimensionSliceLabel(rule.dimension, slice.value)}`,
          actualPct: slice.pct,
          targetPct: rule.targetPct,
          minPct: rule.minPct,
          maxPct: rule.maxPct,
          direction: driftDirection(slice.pct, rule.minPct, rule.maxPct),
          ruleSource: "target_allocation",
          rationale: describeRuleRationale("target_allocation"),
        });
      }
    }
  }

  const totalValue = portfolio.holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;
  // StrategyRuleVersion 是完整规则集快照，不是增量规则。机械检查只能消费最新版本；
  // 若遍历全部历史版本，每次“重置为默认”都会把同一条偏离重复追加到结果中。
  const currentStrategyVersion = strategyRuleVersions.reduce<StrategyRuleVersion | undefined>(
    (latest, candidate) => !latest || candidate.version > latest.version ? candidate : latest,
    undefined,
  );
  for (const rule of currentStrategyVersion?.rules ?? []) {
    if (rule.kind !== "position_band") continue;
    if (!rule.assetId) continue;
    const holding = portfolio.holdings.find((h) => h.assetId === rule.assetId);
    if (!holding) continue;
    const meta = assetMap.get(rule.assetId);
    const weight = holding.weight ?? (holding.marketValue || 0) / totalValue;
    out.push({
      scope: "asset",
      assetId: rule.assetId,
      label: meta?.name ?? holding.name ?? rule.assetId,
      actualPct: weight,
      targetPct: rule.targetPct,
      minPct: rule.minPct,
      maxPct: rule.maxPct,
      direction: driftDirection(weight, rule.minPct, rule.maxPct),
      ruleSource: "position_band",
      rationale: describeRuleRationale("position_band"),
    });
  }

  return out;
}

// ---- Investment Context Package（Layer 4 Think escalation）---------------
// 只装配上下文文本，不调 LLM、不计算指标、不替判断、不自动外传。
// 金额为用户自身数据，由用户主动复制/下载后交由通用模型；本函数不触网。
// 与 investment-review.md 第 10 节边界一致：AI 不计算核心指标——这里根本无 AI，仅 context 工程。

export interface ContextPackageInput {
  policies: Policy[];
  scope?: InvestmentScope;
  account?: AccountSnapshot;
  portfolio?: PortfolioSnapshot;
  assets: AssetMetadata[];
  /** 已算好的目标配置偏离（调用方用 buildAllocationDrift 产出）。 */
  allocationDrift: AllocationDrift[];
  actions: Action[];
  transactions: Transaction[];
  dailyPnl: DailyPnL[];
  decisionRecords: DecisionRecord[];
  activeVersions: PolicyVersion[];
  strategyRuleVersions: StrategyRuleVersion[];
  coverage: DataCoverage[];
  /** 最新完整原始采集档案；只用于生成可核查附件，不参与指标计算。 */
  sourceCapture?: unknown;
  asOf: string;
  /** 模拟演练场景：规则为模拟器预设，非用户声明，措辞需诚实标注。 */
  isSimulator?: boolean;
}

export interface InvestmentContextPackage {
  text: string;
}

function pctText(v: number | undefined): string {
  return v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;
}

function moneyText(v: number): string {
  return v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DIRECTION_TEXT: Record<AllocationDrift["direction"], string> = {
  over: "超过上限",
  under: "低于下限",
  within: "在区间内",
};

const ACTION_TYPE_TEXT: Record<Action["type"], string> = {
  POLICY_TRIGGER: "规则触发",
  RISK_REVIEW: "风险复核",
  UNCLASSIFIED_TRANSACTION: "未分类交易",
  ABNORMAL_TRANSACTION: "异常交易",
  DATA_REQUIRED: "数据待补",
};

const TX_TYPE_TEXT: Record<Transaction["type"], string> = {
  BUY: "买入",
  SELL: "卖出",
  DIVIDEND: "分红",
  FEE: "费用",
  TRANSFER: "账户转账",
  OTHER: "其他",
};

const TX_STATUS_TEXT: Record<Transaction["status"], string> = {
  requested: "已申请",
  partially_confirmed: "部分确认",
  confirmed: "已确认",
  failed: "失败",
  cancelled: "已撤销",
  unknown: "状态未知",
};

const TX_CAPTURE_TEXT: Record<NonNullable<Transaction["captureMethod"]>, string> = {
  extension_capture: "插件自动采集",
  manual_import: "手动导入",
  simulator: "模拟器生成",
  unknown: "采集路径未知",
};

const TX_EXECUTION_TEXT: Record<NonNullable<Transaction["executionMethod"]>, string> = {
  bank_auto_invest: "银行卡定投",
  unknown: "来源未披露",
};

function transactionStatusText(value: Transaction["status"]): string {
  return TX_STATUS_TEXT[value] ?? value;
}

function transactionCaptureText(value: Transaction["captureMethod"]): string {
  return value ? TX_CAPTURE_TEXT[value] ?? value : "采集路径未知";
}

function transactionExecutionText(value: Transaction["executionMethod"]): string {
  return value ? TX_EXECUTION_TEXT[value] ?? value : "来源未披露";
}

const RULE_KIND_TEXT: Record<string, string> = {
  target_allocation: "目标配比",
  regular_investment: "定期投资",
  additional_investment: "额外追加条件",
  pause: "暂停新增",
  review: "触发复核",
  position_band: "仓位区间",
  trailing_stop: "移动止损",
  reduction_target: "减仓目标",
  pause_window: "暂停窗口",
  take_profit: "目标止盈",
};

const ASSET_CLASS_TEXT: Record<AssetMetadata["assetClass"], string> = {
  equity: "权益类", bond: "债券类", commodity: "商品类", cash: "现金类", other: "其他/待识别",
};

const METADATA_QUALITY_TEXT: Record<string, string> = {
  source: "来源字段", extracted: "档案提取", classified: "规则归类", unknown: "未知",
};

const COVERAGE_DATASET_TEXT: Record<DataCoverage["dataset"], string> = {
  account: "账户", holdings: "持仓", dailyPnl: "每日盈亏", transactions: "交易历史", fundDetail: "基金档案",
};

const COVERAGE_COMPLETENESS_TEXT: Record<DataCoverage["completeness"], string> = {
  complete: "完成", partial: "部分完成", unknown: "未知",
};

const METADATA_DIMENSION_TEXT: Record<string, string> = {
  assetClass: "资产类别", regions: "地区", indexes: "指数", currencies: "份额计价币种", themes: "主题", industry: "行业",
};

const METADATA_SOURCE_FIELD_TEXT: Record<string, string> = {
  "tracked-index": "跟踪标的字段", benchmark: "业绩比较基准", "fund-profile": "基金档案", "industry-allocation": "行业配置", currency: "份额计价币种字段",
};

function describeRule(rule: { kind: string }): string {
  return RULE_KIND_TEXT[rule.kind] ?? rule.kind;
}

// ---- Context Package 公共片段：全量版与聚焦版共用，避免两处重复实现 ----
function makeLineAppender() {
  const lines: string[] = [];
  const push = (line: string): void => { lines.push(line); };
  const blank = (): void => { lines.push(""); };
  return { lines, push, blank };
}

function appendExternalAnalysisRequest(push: (line: string) => void, asOf: string, focus?: string): void {
  push("【交给外部模型的任务】");
  push(`- 这是截至 ${asOf} 的历史快照，不是实时行情。${focus ? `请围绕“${focus}”` : "请结合用户目标"}，自行检索并注明当前市场行情、基金最新公告/净值、宏观与同类比较信息的来源和时点后再分析。`);
  push("- 先核对下方 source / normalized / adapter-mapped / derived / declared-rule 分层和数据缺口；缺失事实保持未知，不以常识、字段名或数值巧合补齐。快照与最新外部信息冲突时，分别陈述，不覆盖原快照。");
  push("- 给出有条件的分析、关键不确定性和还需补充的信息，不直接替用户作最终投资决定。");
}

function appendContextDataGaps(
  push: (line: string) => void,
  input: Pick<ContextPackageInput, "coverage" | "sourceCapture" | "decisionRecords" | "account">,
  holdings: HoldingSnapshot[],
): void {
  push("【数据缺口与外部补充要求】");
  const incomplete = input.coverage.filter((item) => (item.latestSyncStatus ?? item.completeness) !== "complete");
  if (incomplete.length) {
    push(`- 本地采集覆盖未完成：${incomplete.map((item) => `${COVERAGE_DATASET_TEXT[item.dataset]}=${COVERAGE_COMPLETENESS_TEXT[item.latestSyncStatus ?? item.completeness]}`).join("；")}。不得把未观测记录解释为不存在。`);
  }
  if (!rawRecord(input.sourceCapture).protocol) {
    push("- 当前标准化账本没有可绑定的原始采集档案，字段级来源无法回查；需要重新采集或重新导入带原档的采集包。");
  }
  if (input.account?.totalAssetBasis === "derived_holding_sum") {
    push("- 来源没有账户总资产；当前分母只是可解析持仓市值合计的派生值，不能据此推断现金、在途资金或账户外资产为零。需要补采来源账户总资产字段。");
  }
  if (holdings.some((holding) => holding.pnl !== undefined && holding.pnlBasis !== "source_labeled_pnl" && holding.pnlBasis !== "derived_from_cost")) {
    push("- 持仓收益金额字段的业务标签未由来源证明；当前只保留原字段/标准化槽位及数值，不能解释为浮盈亏、累计收益或其他具名指标。");
  }
  if (holdings.some((holding) => holding.nav !== undefined && !holding.navDate)) {
    push("- 部分持仓有净值但缺净值日期，无法判断估值新鲜度。");
  }
  if (!input.decisionRecords.length) {
    push("- 本地没有事前投资理由、证伪条件或决策记录；不能从后续持仓和交易反推当时逻辑。");
  }
  push("- 采集包不包含生成时点之后的行情、基金公告、费率/限购变化、汇率、基准表现和宏观事件；这些必须由外部模型从最新可信来源补充，并与本快照分层展示。");
  push("- 标准化持仓尚未为 marketValue / shares / nav 等所有字段持久化逐字段来源路径；有原始核查附件时应逐项交叉核对，无法匹配的字段按未知处理。");
}

function summarizeTxByType(list: Transaction[]): string {
  const byType = new Map<string, number>();
  for (const t of list) byType.set(t.type, (byType.get(t.type) ?? 0) + 1);
  return Array.from(byType.entries()).map(([k, n]) => `${TX_TYPE_TEXT[k as Transaction["type"]] ?? k} ${n}`).join(" / ");
}

function pushBuySellSummary(push: (line: string) => void, list: Transaction[]): void {
  const buys = list.filter((t) => t.type === "BUY");
  const sells = list.filter((t) => t.type === "SELL");
  const buyCash = buys.map(confirmedBuyOrderRequestedAmount).filter((v): v is number => v !== undefined);
  const sellCash = sells.map(transactionCashAmount).filter((v): v is number => v !== undefined);
  if (buys.length) push(`- 已确认买入订单申请金额合计 ${moneyText(buyCash.reduce((s, v) => s + v, 0))} 元 ${metricTag("derived", "Σ 符合口径的已观测买入订单申请金额")}（${buyCash.length}/${buys.length} 笔为全额确认且申请单位为人民币）`);
  if (sells.length) push(`- 已确认卖出回款合计 ${moneyText(sellCash.reduce((s, v) => s + v, 0))} 元 ${metricTag("derived", "Σ 符合人民币口径的已观测卖出确认值")}（${sellCash.length}/${sells.length} 笔有可确认人民币口径）`);
}

function summarizeTxByStatus(list: Transaction[]): string {
  const byStatus = new Map<Transaction["status"], number>();
  for (const t of list) byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
  return Array.from(byStatus.entries()).map(([status, count]) => `${transactionStatusText(status)} ${count}`).join(" / ");
}

type ContextMetricProvenance = "source" | "normalized" | "derived" | "adapter-mapped" | "declared-rule";

function metricTag(type: ContextMetricProvenance, basis: string): string {
  return `〔provenance/type=${type}；依据=${basis}〕`;
}

function strategyRuleDetail(rule: StrategyRule): string {
  switch (rule.kind) {
    case "position_band":
      return `仓位区间 [${pctText(rule.minPct)}, ${pctText(rule.maxPct)}]${rule.targetPct === undefined ? "" : `，目标 ${pctText(rule.targetPct)}`}`;
    case "trailing_stop":
      return `移动止损，口径 ${rule.basis === "nav_adjusted" ? "复权净值" : rule.basis === "nav_unadjusted" ? "未复权净值" : "未知"}，回撤阈值 ${pctText(rule.drawdownPct)}，生效 ${rule.effectiveFrom}${rule.effectiveTo ? ` 至 ${rule.effectiveTo}` : ""}`;
    case "reduction_target":
      return `减仓后仓位目标（减到）[${pctText(rule.targetMinPct)}, ${pctText(rule.targetMaxPct)}]；不表示卖出当前持仓的 ${pctText(rule.targetMinPct)}–${pctText(rule.targetMaxPct)}；计划量取决于赎回款是否仍留在当前投资范围${rule.allowedWindow ? `；允许窗口 ${rule.allowedWindow.start} 至 ${rule.allowedWindow.end}` : ""}`;
    case "pause_window":
      return `暂停窗口 ${rule.window.start} 至 ${rule.window.end}${rule.reason ? `，原因：${rule.reason}` : ""}`;
    case "take_profit":
      return `目标止盈 ${pctText(rule.targetReturnPct)}；收益率口径为当前持仓成本收益率 =（当前持仓市值－可确认的当前持仓成本）/ 可确认的当前持仓成本，不使用来源展示收益率替代；生效 ${rule.effectiveFrom}${rule.effectiveTo ? ` 至 ${rule.effectiveTo}` : ""}`;
  }
}

function strategyRuleCurrentState(rule: StrategyRule, holding: HoldingSnapshot | undefined): string | undefined {
  if (rule.kind === "trailing_stop") {
    return "当前状态未知：本上下文未附带该规则版本的持久化净值高水位/止损线，不能只用当前净值倒推是否触发";
  }
  if (rule.kind === "take_profit") {
    if (!holding || holding.costValue === undefined || holding.costValue <= 0) {
      return "当前状态未知：缺少可确认的持仓成本，来源展示收益率不能替代目标止盈的成本收益率口径";
    }
    const currentReturn = (holding.marketValue - holding.costValue) / holding.costValue;
    return `当前持仓成本收益率 ${pctText(currentReturn)}，${currentReturn >= rule.targetReturnPct ? "已达到" : "未达到"}目标 ${pctText(rule.targetReturnPct)}（按当前市值与可确认的当前持仓成本计算；仅触发复核，不自动交易）`;
  }
  return undefined;
}

function reductionEstimateText(
  rule: StrategyRule,
  holding: HoldingSnapshot | undefined,
  portfolio: PortfolioSnapshot | undefined,
): string | undefined {
  if (rule.kind !== "reduction_target" || !holding || !portfolio || portfolio.totalAsset <= 0 || rule.targetMaxPct >= 1) return undefined;
  const excess = Math.max(0, holding.marketValue - portfolio.totalAsset * rule.targetMaxPct);
  if (excess <= 0) return "当前快照下已不高于减仓后仓位目标上限，无需估算卖出量；仍以最新快照复核为准";
  const remainInScope = Math.round(excess * 100) / 100;
  const leaveScope = Math.round(excess / (1 - rule.targetMaxPct) * 100) / 100;
  return `计划卖出金额为上下文派生估算值 ${metricTag("derived", `holding.marketValue、portfolio.totalAsset、目标上限；快照 ${portfolio.date}`)}（未计净值变化、费用和确认时差）：若赎回款留在范围内并计入现金、分母近似不变，估算 ${moneyText(remainInScope)} 元〔x=M−tD〕；若赎回款转出到银行卡并离开范围、分母与持仓同步减少，估算 ${moneyText(leaveScope)} 元〔x=(M−tD)/(1−t)〕。资金去向未确认前不存在唯一计划量；实际成交后必须用新的持仓市值和账户分母重新检测是否回到目标区间`;
}

function cumulativePnlContext(account: AccountSnapshot, sourceCapture?: unknown): string {
  if (account.cumulativePnl === undefined) return "";
  const captureAccount = rawRecord(rawRecord(sourceCapture).account);
  const namedValue = sourceNumber(captureAccount.totalProfit);
  const positionalValue = sourceNumber(rawRecord(rawArray(captureAccount.assetTotal)[2]).oldValue);
  if (namedValue !== undefined) {
    return `；累计盈亏 ${moneyText(account.cumulativePnl)} 元 ${metricTag("adapter-mapped", "来源具名字段 account.totalProfit")}`;
  }
  if (positionalValue !== undefined) {
    return `；累计盈亏 ${moneyText(account.cumulativePnl)} 元 ${metricTag("adapter-mapped", "原始 account.assetTotal[2].oldValue 的账户摘要位置契约")}（原采集未保留该位置的字段标签，因此是位置映射证据，不是具名字段证据，也不由当前持仓 profitValue 合计反推）`;
  }
  return `；累计盈亏 ${moneyText(account.cumulativePnl)} 元 ${metricTag("normalized", "标准化账本；当前无可核验原档")}`;
}

function accountTotalProvenance(account: AccountSnapshot, sourceCapture?: unknown): string {
  if (account.totalAssetBasis === "derived_holding_sum") {
    return metricTag("derived", "来源账户总资产缺失；Σ 可解析 holding.marketValue");
  }
  const sourceAccount = rawRecord(rawRecord(sourceCapture).account);
  const namedValue = sourceNumber(sourceAccount.totalAsset);
  const positionedValue = sourceNumber(rawRecord(rawArray(sourceAccount.assetTotal)[0]).oldValue);
  if (namedValue !== undefined) return metricTag("adapter-mapped", "已绑定原档 account.totalAsset");
  if (positionedValue !== undefined) return metricTag("adapter-mapped", "已绑定原档 account.assetTotal[0].oldValue");
  return metricTag("normalized", "AccountSnapshot.totalAsset；当前无可核验原字段路径");
}

function portfolioTotalProvenance(portfolio: PortfolioSnapshot): string {
  return portfolio.totalAssetBasis === "derived_holding_sum"
    ? metricTag("derived", "来源账户总资产缺失；Σ 可解析 holding.marketValue")
    : metricTag("normalized", "PortfolioSnapshot.totalAsset；复用账户标准化总资产");
}

function portfolioCashContext(portfolio: PortfolioSnapshot): string {
  if (portfolio.cash === undefined) return "现金残差未知（账户总资产与持仓市值无法形成有效的非负残差）";
  return `现金残差派生值 ${moneyText(portfolio.cash)} 元 ${metricTag("derived", "portfolio.totalAsset − Σ holding.marketValue")} = 账户总资产 ${moneyText(portfolio.totalAsset)} 元 − 当前持仓市值合计 ${moneyText(portfolio.holdingValue)} 元；不是来源直接披露的现金字段${portfolio.cash === 0 ? "，0 只表示本次快照在容差内没有正残差" : ""}`;
}

function versionTimeText(version: { createdAt?: string; effectiveFrom: string; effectiveTo?: string }): string {
  return `创建时点 ${version.createdAt ?? "未记录（旧版本，不能由生效日反推）"}；规则生效 ${version.effectiveFrom}${version.effectiveTo ? ` 至 ${version.effectiveTo}` : " 起"}`;
}

function policyRuleDetail(rule: PolicyRule): string {
  switch (rule.kind) {
    case "target_allocation":
      return `${DIMENSION_LABEL[rule.dimension]} ${rule.value}，目标 ${pctText(rule.targetPct)}，区间 [${pctText(rule.minPct)}, ${pctText(rule.maxPct)}]`;
    case "regular_investment":
      return `定期投资${rule.cadence ? `，频率 ${rule.cadence}` : ""}${rule.amount === undefined ? "" : `，金额 ${moneyText(rule.amount)} 元`}${rule.description ? `，说明 ${rule.description}` : ""}`;
    case "additional_investment":
      return `额外追加${rule.description ? `，说明 ${rule.description}` : ""}；条件 ${rule.conditions.join("；") || "未记录"}`;
    case "pause":
      return `${DIMENSION_LABEL[rule.dimension]} ${rule.value ?? "全部"} 达 ${pctText(rule.maxPct)} 后暂停新增`;
    case "review":
      return `触发复核${rule.description ? `，说明 ${rule.description}` : ""}；条件 ${rule.conditions.join("；") || "未记录"}`;
  }
}

function appendAssetMetadata(push: (line: string) => void, assets: AssetMetadata[]): void {
  if (!assets.length) {
    push("- （无基金档案）");
    return;
  }
  for (const asset of assets) {
    push(`- ${asset.name ?? asset.assetId}（${asset.assetId}）：资产类别 ${ASSET_CLASS_TEXT[asset.assetClass]}；地区 ${asset.regions.join("、") || "未知"}；跟踪指数 ${asset.trackingIndexes?.join("、") || "无明确跟踪标的"}；业绩基准指数 ${asset.benchmarkIndexes?.join("、") || "未知"}；份额计价币种 ${asset.currencies.join("、") || "未知"}；主题 ${asset.themes.join("、") || "未知"}`);
    if (asset.industryAllocations?.length) {
      push(`  · 行业配置：${asset.industryAllocations.map((item) => `${item.name} ${pctText(item.weight)}`).join("；")}`);
    }
    if (asset.provenance) {
      push(`  · 元数据质量：资产类别 ${METADATA_QUALITY_TEXT[asset.provenance.assetClass]}；地区 ${METADATA_QUALITY_TEXT[asset.provenance.regions]}；跟踪指数 ${METADATA_QUALITY_TEXT[asset.trackingIndexQuality ?? "unknown"]}；业绩基准指数 ${METADATA_QUALITY_TEXT[asset.benchmarkIndexQuality ?? "unknown"]}；份额计价币种 ${METADATA_QUALITY_TEXT[asset.provenance.currencies]}；主题 ${METADATA_QUALITY_TEXT[asset.provenance.themes]}`);
    }
    const evidence = Object.entries(asset.evidence ?? {}).filter(([dimension]) => dimension !== "indexes").map(([dimension, item]) => {
      const e = item as NonNullable<AssetMetadata["industryEvidence"]>;
      return `${METADATA_DIMENSION_TEXT[dimension] ?? dimension}：${e.sourceField ? METADATA_SOURCE_FIELD_TEXT[e.sourceField] ?? e.sourceField : "来源字段"}${e.asOf ? `（${e.asOf}）` : ""}${e.sourceUrl ? ` ${e.sourceUrl}` : ""}`;
    });
    if (asset.industryEvidence) {
      evidence.push(`行业：${asset.industryEvidence.sourceField ? METADATA_SOURCE_FIELD_TEXT[asset.industryEvidence.sourceField] ?? asset.industryEvidence.sourceField : "来源字段"}${asset.industryEvidence.asOf ? `（${asset.industryEvidence.asOf}）` : ""} ${asset.industryEvidence.sourceUrl}`);
    }
    if (asset.trackingIndexEvidence) evidence.push(`跟踪指数：跟踪标的字段 ${asset.trackingIndexEvidence.sourceUrl}`);
    if (asset.benchmarkIndexEvidence) evidence.push(`业绩基准指数：业绩比较基准 ${asset.benchmarkIndexEvidence.sourceUrl}`);
    if (evidence.length) push(`  · 来源锚点：${evidence.join("；")}`);
  }
}

function rawHoldingFor(sourceCapture: unknown, assetId: string): Record<string, unknown> | undefined {
  return rawArray(rawRecord(sourceCapture).holdings)
    .map(rawRecord)
    .find((item) => String(item.fundCode ?? item.code ?? "").match(/\d{6}/)?.[0] === assetId);
}

function matchingRawNumberField(
  sourceCapture: unknown,
  holding: HoldingSnapshot,
  value: number,
  candidates: string[],
  divisor = 1,
): string | undefined {
  const raw = rawHoldingFor(sourceCapture, holding.assetId);
  if (!raw) return undefined;
  return candidates.find((field) => {
    const rawValue = sourceNumber(raw[field]);
    return rawValue !== undefined && Math.abs(rawValue / divisor - value) < 0.000_005;
  });
}

function holdingMarketValueProvenance(holding: HoldingSnapshot, sourceCapture: unknown): string {
  const field = matchingRawNumberField(sourceCapture, holding, holding.marketValue, ["assetValue", "amount"]);
  return field
    ? metricTag("adapter-mapped", `已绑定同批原档 holdings.${field}，数值一致`)
    : metricTag("normalized", "HoldingSnapshot.marketValue；当前原档无法匹配字段路径");
}

function holdingNavProvenance(holding: HoldingSnapshot, sourceCapture: unknown): string {
  if (holding.nav === undefined) return "";
  const field = matchingRawNumberField(sourceCapture, holding, holding.nav, ["nav"]);
  return field
    ? metricTag("adapter-mapped", `已绑定同批原档 holdings.${field}，数值一致`)
    : metricTag("normalized", "HoldingSnapshot.nav；当前原档无法匹配字段路径");
}

function holdingNavDateProvenance(holding: HoldingSnapshot, sourceCapture: unknown): string {
  const raw = rawHoldingFor(sourceCapture, holding.assetId);
  const field = ["navdate", "navDate"].find((candidate) => {
    const match = String(raw?.[candidate] ?? "").match(/(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/);
    const normalized = match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
    return normalized === holding.navDate;
  });
  return field
    ? metricTag("adapter-mapped", `已绑定同批原档 holdings.${field}，日期一致`)
    : metricTag("normalized", "HoldingSnapshot.navDate；当前原档无法匹配字段路径");
}

function holdingReturnContext(holding: HoldingSnapshot, sourceCapture?: unknown): string {
  if (holding.pnlRate === undefined) return "";
  const rawField = matchingRawNumberField(sourceCapture, holding, holding.pnlRate, ["profitPercent", "profitRate"], 100);
  if (rawField) {
    return `，持仓收益率 ${pctText(holding.pnlRate)} ${metricTag("adapter-mapped", `已绑定同批原档 holdings.${rawField}，按百分数标准化且数值一致`)}（来源未披露计算公式）`;
  }
  if (holding.pnlRateBasis === "source_reported" && holding.pnlRateSourceField) {
    return `，持仓收益率 ${pctText(holding.pnlRate)} ${metricTag("adapter-mapped", `来源展示字段 ${holding.pnlRateSourceField}`)}（来源未披露计算公式）`;
  }
  if (holding.pnlRateBasis === "source_reported") {
    return `，持仓收益率 ${pctText(holding.pnlRate)} ${metricTag("normalized", "来源展示值，但旧账本未持久化原字段名")}（来源未披露计算公式）`;
  }
  if (holding.pnlRateBasis === "derived_from_cost") return `，持仓收益率 ${pctText(holding.pnlRate)} ${metricTag("derived", "当前市值与可确认持仓成本")}`;
  return `，持仓收益率 ${pctText(holding.pnlRate)} ${metricTag("normalized", "计算口径未知")}`;
}

function holdingProfitValueContext(holding: HoldingSnapshot, sourceCapture?: unknown): string {
  if (holding.pnl === undefined) return "";
  const rawField = matchingRawNumberField(sourceCapture, holding, holding.pnl, ["profitValue", "profit"]);
  if (rawField) {
    return `，持仓 ${rawField} ${moneyText(holding.pnl)} 元 ${metricTag("adapter-mapped", `已绑定同批原档 holdings.${rawField}，数值一致`)}（原字段业务语义未验证，不直接称为浮盈亏）`;
  }
  if (!holding.pnlSourceField) {
    return `，持仓收益金额标准化槽位 ${moneyText(holding.pnl)} 元 ${metricTag("normalized", "HoldingSnapshot.pnl；旧账本未持久化原字段名")}（来源业务语义与字段路径均未验证）`;
  }
  return `，持仓 ${holding.pnlSourceField} ${moneyText(holding.pnl)} 元 ${metricTag("adapter-mapped", `来源持仓字段 ${holding.pnlSourceField}`)}（原字段业务语义未验证，不直接称为浮盈亏）`;
}

function appendTransactionDetails(push: (line: string) => void, list: Transaction[]): void {
  if (!list.length) {
    push("- （暂无已记录交易）");
    return;
  }
  const ordered = [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  push(`- 当前已观测标准化交易明细（${ordered.length} 笔，按时间升序）${metricTag("normalized", "当前账本实际观测记录；不代表来源历史完整性")}：`);
  for (const t of ordered) {
    const requested = `${moneyText(t.amount)} ${t.amountUnit}`;
    const confirmed = t.confirmedAmount === undefined ? "未提供" : `${moneyText(t.confirmedAmount)} ${confirmedUnitOf(t) ?? "单位未知"}`;
    push(`  · ${t.occurredAt}｜${t.assetId}｜${TX_TYPE_TEXT[t.type] ?? t.type}${t.businessTypeText ? `（来源：${t.businessTypeText}）` : ""}｜申请 ${requested}｜确认 ${confirmed}｜状态 ${transactionStatusText(t.status)}${t.statusText ? `（来源：${t.statusText}）` : ""}｜采集路径 ${transactionCaptureText(t.captureMethod)}｜执行方式 ${transactionExecutionText(t.executionMethod)}${t.classificationWarning ? `｜分类警告 ${t.classificationWarning}` : ""}${t.behaviorType ? `｜行为分类 ${t.behaviorType}` : ""}`);
  }
}

function appendDailyPnlDetails(push: (line: string) => void, list: DailyPnL[]): void {
  if (!list.length) {
    push("- （暂无每日盈亏记录）");
    return;
  }
  const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date) || a.assetId.localeCompare(b.assetId));
  push(`- 当前已观测标准化每日盈亏明细（${ordered.length} 条，按日期升序）${metricTag("normalized", "当前账本实际观测日点；不代表逐日连续或历史完整")}：`);
  for (const p of ordered) {
    push(`  · ${p.date}｜${p.assetId}｜盈亏 ${moneyText(p.pnl)} 元${p.nav === undefined ? "" : `｜净值 ${p.nav}`}${p.shares === undefined ? "" : `｜份额 ${p.shares}`}${p.dailyReturn === undefined ? "" : `｜日收益率 ${pctText(p.dailyReturn)}`}`);
  }
}

function appendCoverage(push: (line: string) => void, coverage: DataCoverage[]): void {
  if (!coverage.length) {
    push("- （没有数据覆盖记录，完整性未知）");
    return;
  }
  for (const c of coverage) {
    const ranges = c.knownRanges.length ? c.knownRanges.map((r) => `${r.start} 至 ${r.end}`).join("、") : "无已知范围";
    const syncCount = c.syncExpectedCount === undefined ? "" : ` ${c.syncObservedCount ?? 0}/${c.syncExpectedCount}`;
    const observed = c.observedCount === undefined ? "数量未知" : `${c.observedCount} 条`;
    push(`- ${COVERAGE_DATASET_TEXT[c.dataset]}：同步状态 ${COVERAGE_COMPLETENESS_TEXT[c.latestSyncStatus ?? c.completeness]}${syncCount}；实际观测 ${observed}，范围 ${ranges}${c.observationNote ? `；边界 ${c.observationNote}` : ""}${c.lastSyncedAt ? `；最近同步 ${c.lastSyncedAt}` : ""}${c.warningCodes.length ? `；警告 ${c.warningCodes.join("、")}` : ""}`);
  }
}

function appendFocusedCoverage(
  push: (line: string) => void,
  coverage: DataCoverage[],
  counts: { holdings: number; assets: number; transactions: number; dailyPnl: number },
): void {
  push("- 全账户同步与观测覆盖（采集任务层）：");
  appendCoverage((line) => push(`  ${line}`), coverage);
  const total = (dataset: DataCoverage["dataset"]): string => {
    const count = coverage.find((item) => item.dataset === dataset)?.observedCount;
    return count === undefined ? "全账户数量未知" : `全账户观测 ${count} 条`;
  };
  push("- 本标的关联观测（问题筛选层，不表示该标的历史已完整采齐）：");
  push(`  · 当前持仓 ${counts.holdings} 条（${total("holdings")}）`);
  push(`  · 基金档案 ${counts.assets} 条（${total("fundDetail")}）`);
  push(`  · 交易 ${counts.transactions} 笔（${total("transactions")}）`);
  push(`  · 每日盈亏 ${counts.dailyPnl} 个日点（${total("dailyPnl")}）`);
}

function rawRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function rawArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sourceNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || String(value).trim() === "") return undefined;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function calendarLagDays(snapshotDate: string, factDate: string): number | undefined {
  const snapshotMs = Date.parse(`${snapshotDate}T00:00:00Z`);
  const factMs = Date.parse(`${factDate}T00:00:00Z`);
  if (!Number.isFinite(snapshotMs) || !Number.isFinite(factMs)) return undefined;
  return Math.round((snapshotMs - factMs) / 86_400_000);
}

function derivedHoldingPnlText(portfolio: PortfolioSnapshot | undefined, sourceCapture?: unknown): string {
  if (!portfolio?.holdings.length || portfolio.holdings.some((holding) => holding.pnl === undefined)) return "";
  const total = Math.round(portfolio.holdings.reduce((sum, holding) => sum + (holding.pnl ?? 0), 0) * 100) / 100;
  const allProfitValue = portfolio.holdings.every((holding) => holding.pnlSourceField === "profitValue"
    || (holding.pnl !== undefined && matchingRawNumberField(sourceCapture, holding, holding.pnl, ["profitValue"]) === "profitValue"));
  const fieldLabel = allProfitValue ? "profitValue" : "HoldingSnapshot.pnl 收益金额标准化槽位";
  const summarySecond = sourceNumber(rawRecord(rawArray(rawRecord(rawRecord(sourceCapture).account).assetTotal)[1]).oldValue);
  const crossCheck = summarySecond === undefined
    ? ""
    : Math.abs(total - summarySecond) < 0.005
      ? `；账户摘要第二项原始值亦为 ${moneyText(summarySecond)} 元，但来源未携带字段名，仅作数值一致性核查，不用于语义映射`
      : `；账户摘要第二项原始值为 ${moneyText(summarySecond)} 元，与该派生合计不一致，且来源未携带字段名，不用于语义映射`;
  return `；当前持仓 ${fieldLabel} 派生合计 ${moneyText(total)} 元 ${metricTag("derived", `Σ 当前 ${portfolio.holdings.length} 只持仓的 HoldingSnapshot.pnl`)}（来源业务语义未验证，不直接称为浮盈亏）${crossCheck}`;
}

function appendValuationFreshness(
  push: (line: string) => void,
  portfolio: PortfolioSnapshot,
  relatedHoldings: HoldingSnapshot[],
  drift: AllocationDrift,
): void {
  const focusedDates = [...new Set(relatedHoldings.map((holding) => holding.navDate).filter((date): date is string => Boolean(date)))].sort();
  const relatedIds = new Set(relatedHoldings.map((holding) => holding.assetId));
  const otherDates = [...new Set(portfolio.holdings
    .filter((holding) => !relatedIds.has(holding.assetId))
    .map((holding) => holding.navDate)
    .filter((date): date is string => Boolean(date)))].sort();
  const allDates = [...new Set(portfolio.holdings.map((holding) => holding.navDate).filter((date): date is string => Boolean(date)))].sort();
  const focusedLatest = focusedDates.at(-1);
  const otherLatest = otherDates.at(-1);
  const accountLatest = allDates.at(-1);
  const focusedLag = focusedLatest ? calendarLagDays(portfolio.date, focusedLatest) : undefined;
  const otherLag = otherLatest ? calendarLagDays(portfolio.date, otherLatest) : undefined;
  const relativeAccountNavLag = focusedLatest && accountLatest ? calendarLagDays(accountLatest, focusedLatest) : undefined;
  const boundaryDistance = drift.direction === "over"
    ? drift.actualPct - drift.maxPct
    : drift.direction === "under"
      ? drift.minPct - drift.actualPct
      : Math.min(drift.actualPct - drift.minPct, drift.maxPct - drift.actualPct);

  push(`- 估值日期边界：${portfolio.date} 是账户/组合采集形成的快照日，不代表所有持仓底层净值都更新到了该日。`);
  if (!focusedLatest) {
    push("- 估值新鲜度：本标的缺少可确认的净值日，无法计算相对快照日的滞后天数；仓位精度因此不能进一步确认。");
    return;
  }
  const focusedText = `本标的最新净值日 ${focusedLatest}${focusedLag === undefined ? "（快照自然日差未知）" : `（快照自然日差 ${Math.abs(focusedLag)} 天；${focusedLag >= 0 ? "净值日在快照日前" : "净值日在快照日后"}）`}`;
  const otherText = otherLatest
    ? `账户其他持仓最新净值日 ${otherLatest}${otherDates.length > 1 ? `，日期范围 ${otherDates[0]} 至 ${otherLatest}` : ""}${otherLag === undefined ? "" : `（最新值较快照日${otherLag >= 0 ? `滞后 ${otherLag}` : `晚 ${Math.abs(otherLag)}`} 个自然日）`}`
    : "账户其他持仓净值日未知";
  const asynchronous = allDates.length > 1;
  const relativeText = accountLatest && relativeAccountNavLag !== undefined
    ? `；相对账户最新 NAV 日期 ${accountLatest}，本标的${relativeAccountNavLag > 0 ? `落后 ${relativeAccountNavLag}` : relativeAccountNavLag < 0 ? `领先 ${Math.abs(relativeAccountNavLag)}` : "没有日期差"}${relativeAccountNavLag === 0 ? "" : " 天"}`
    : "";
  push(`- 估值新鲜度 ${metricTag("derived", "portfolio.date 与各 holding.navDate 的日期差")}：仓位 ${pctText(drift.actualPct)} ${metricTag("derived", "holding.marketValue / portfolio.totalAsset")}；${focusedText}${relativeText}；${otherText}。快照自然日差包含周末等非交易日，不等同于行情滞后相同数量的交易日。${asynchronous ? "各持仓净值日不一致，当前权重属于异步估值快照" : "已记录持仓净值日一致，但仍可能滞后于快照日"}；当前${drift.direction === "over" ? "超过上限" : drift.direction === "under" ? "低于下限" : "距最近边界"} ${(Math.max(0, boundaryDistance) * 100).toFixed(1)} 个百分点，接近阈值时不应把该偏离解释得过于精确。`);
}

/** GPT 核查附件去除个人/追踪标识；完整未删减对象仍保存在本地 sourceCaptures store。 */
function redactRawAudit(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactRawAudit);
  if (typeof value === "string") {
    // 表格响应中的“银行名称 | **** / 卡尾号”没有独立字段名，仍需按值清除关联支付标识。
    if (/(?:银行|卡).*(?:\*{3,}|\d{4})|(?:\*{3,}|\d{12,}).*(?:银行|卡)/i.test(value)) return "[关联支付标识已移除]";
    if (/\b\d{16,19}\b/.test(value) || /\b[A-Fa-f0-9]{32}\b/.test(value)) return "[追踪标识已移除]";
    return value;
  }
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/(?:account|bank|card|cookie|token|auth|trace|sourceTransactionId|transactionId|credential)/i.test(key)) continue;
    output[key] = redactRawAudit(child);
  }
  return output;
}

function rawTransactionsForAssets(capture: Record<string, unknown>, assetIds: Set<string>): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const range of rawArray(capture.transactionRanges)) {
    for (const page of rawArray(rawRecord(range).pages)) {
      for (const item of rawArray(rawRecord(page).records)) {
        const record = rawRecord(item);
        const code = String(record.productCode ?? record.fundCode ?? "");
        if (!assetIds.has(code)) continue;
        result.push({
          strikeStartDate: record.strikeStartDate,
          productCode: record.productCode,
          productName: record.productName ?? record.productShowName,
          businessTypeText1: record.businessTypeText1,
          applyCount: record.applyCount,
          applyCountUnit: record.applyCountUnit,
          confirmCount: record.confirmCount,
          confirmCountUnit: record.confirmCountUnit,
          appStateText: record.appStateText,
        });
      }
    }
  }
  return result;
}

function appendRawSourceAudit(
  push: (line: string) => void,
  sourceCapture: unknown,
  assetIds: string[],
  detailed: boolean,
): void {
  const capture = rawRecord(sourceCapture);
  if (!Object.keys(capture).length) {
    push("- 当前账本没有对应的完整原始采集档案；标准化事实可用，但无法在本地反查原字段。");
    return;
  }
  const ids = new Set(assetIds);
  const publicFunds = rawArray(capture.publicFunds).map(rawRecord).filter((item) => ids.has(String(item.fundCode ?? item.code ?? "")));
  const allHoldings = rawArray(capture.holdings).map(rawRecord);
  const holdings = allHoldings.filter((item) => ids.has(String(item.fundCode ?? item.code ?? "")));
  push(`- 原始采集档案 ${metricTag("source", "本地 sourceCaptures 原始对象")}：协议 ${String(capture.protocol ?? "未知")}；采集时间 ${String(capture.capturedAt ?? "未知")}；完整对象保存在本地 IndexedDB，以下仅复制与本问题有关且已去追踪标识的核查附件。`);
  if (!detailed) {
    const summaries = publicFunds.map((item) => ({
      fundCode: item.fundCode,
      fundName: item.fundName,
      fundType: item.fundType,
      trackedIndexText: item.trackedIndexText ?? rawRecord(item.fields)["跟踪标的"],
      benchmark: item.benchmark ?? rawRecord(item.fields)["业绩比较基准"],
      sourceUrl: item.sourceUrl,
    }));
    push(`- 当前组合原始指数/基准字段：${JSON.stringify(redactRawAudit(summaries), null, 2)}`);
    return;
  }
  const account = rawRecord(capture.account);
  const assetTotal = rawArray(account.assetTotal);
  const rawHoldingPnlValues = allHoldings.map((item) => sourceNumber(item.profitValue));
  const hasCompleteRawHoldingPnl = rawHoldingPnlValues.length > 0 && rawHoldingPnlValues.every((value): value is number => value !== undefined);
  const rawHoldingPnlTotal = hasCompleteRawHoldingPnl
    ? Math.round((rawHoldingPnlValues as number[]).reduce((sum, value) => sum + value, 0) * 100) / 100
    : undefined;
  const summarySecondValue = sourceNumber(rawRecord(assetTotal[1]).oldValue);
  const accountAnchor = {
    assetTotal: assetTotal.map((value, index) => ({
      index,
      semantic: index === 0
        ? "账户总资产（标准化为 account.totalAsset / portfolio.totalAsset）"
        : index === 1
          ? "来源账户摘要第二项（来源未携带字段名，不参与语义映射或标准化计算；只与持仓 profitValue 派生合计做数值一致性核查）"
          : index === 2
            ? "按当前适配器的账户摘要位置契约映射为累计盈亏（标准化为 account.cumulativePnl）；原采集未保留该位置字段标签，属于位置映射证据而非具名字段证据"
            : "来源未定义的额外账户摘要项",
      raw: value,
    })),
    holdingProfitValueConsistencyCheck: rawHoldingPnlTotal === undefined ? {
      status: "无法核查",
      reason: "并非所有当前持仓都提供可解析的 profitValue",
    } : {
      derivedFrom: `${allHoldings.length} 只当前持仓 profitValue 求和`,
      derivedTotal: rawHoldingPnlTotal,
      summarySecondRawValue: summarySecondValue,
      equal: summarySecondValue !== undefined && Math.abs(rawHoldingPnlTotal - summarySecondValue) < 0.005,
      semanticBoundary: "数值相等只用于交叉核验；既不证明无字段名的账户摘要第二项语义，也不证明 profitValue 等同于浮盈亏",
    },
  };
  const holdingAnchors = allHoldings.map((item) => ({
    fundCode: item.fundCode,
    fundName: item.fundName,
    assetValue: item.assetValue,
    assetObject: item.assetObject,
    profitValue: item.profitValue,
    profitPercent: item.profitPercent,
    nav: item.nav,
    navdate: item.navdate,
  }));
  const fundDetails = rawArray(capture.fundDetails).map(rawRecord).filter((item) => ids.has(String(item.fundCode ?? item.code ?? "")));
  const rawTransactions = rawTransactionsForAssets(capture, ids);
  const publicFacts = publicFunds.map((item) => ({
    fundCode: item.fundCode,
    fundName: item.fundName,
    fundType: item.fundType,
    trackedIndexText: item.trackedIndexText,
    benchmark: item.benchmark,
    investmentObjective: item.investmentObjective,
    fields: item.fields,
    sections: item.sections,
    industries: item.industries,
    industryAsOf: item.industryAsOf,
    sourceUrl: item.sourceUrl,
  }));
  push(`- 账户总资产原始锚点：${JSON.stringify(redactRawAudit(accountAnchor), null, 2)}`);
  push(`- 当前全部持仓精简原始锚点（${holdingAnchors.length} 只）：${JSON.stringify(redactRawAudit(holdingAnchors), null, 2)}`);
  push(`- 相关基金公开档案原始字段：${JSON.stringify(redactRawAudit(publicFacts), null, 2)}`);
  push(`- 相关持仓原始字段：${JSON.stringify(redactRawAudit(holdings), null, 2)}`);
  push(`- 相关交易映射原始字段（${rawTransactions.length} 笔）：${JSON.stringify(redactRawAudit(rawTransactions), null, 2)}`);
  push(`- 相关账户内基金详情原始响应：${JSON.stringify(redactRawAudit(fundDetails), null, 2)}`);
}

function appendDecisionDetails(push: (line: string) => void, list: DecisionRecord[]): void {
  if (!list.length) {
    push("- （没有相关事前决策记录）");
    return;
  }
  for (const d of [...list].sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))) {
    const planned = [
      d.plannedAmount === undefined ? "" : `金额 ${moneyText(d.plannedAmount)} 元`,
      d.plannedShares === undefined ? "" : `份额 ${d.plannedShares}`,
      d.plannedPct === undefined ? "" : `仓位 ${pctText(d.plannedPct)}`,
    ].filter(Boolean).join("、") || "未记录计划量";
    push(`- ${d.decidedAt}｜${d.direction === "BUY" ? "买入" : "卖出"} ${d.assetId ?? "组合"}｜${planned}｜状态 ${d.status}${d.allowedWindow ? `｜窗口 ${d.allowedWindow.start} 至 ${d.allowedWindow.end}` : ""}`);
    push(`  · 投资理由：${d.rationale || "未记录"}`);
    push(`  · 证伪条件：${d.failsIf || "未记录"}`);
    if (d.annotations.length) push(`  · 事后注释：${d.annotations.join("；")}`);
  }
}

/**
 * 把账户状态 + 历史 + 投资逻辑 + 当前异常 + 规则 + 待判断问题拼装成一段可复制文本，
 * 交由通用大模型深度分析。产品卖的是高质量 Context，不是自己的模型能力。
 */
export function buildInvestmentContextPackage(input: ContextPackageInput): InvestmentContextPackage {
  const { policies, scope, account, portfolio, assets, allocationDrift, actions, transactions, dailyPnl, decisionRecords, activeVersions, strategyRuleVersions, coverage, sourceCapture, asOf, isSimulator = false } = input;
  const { lines, push, blank } = makeLineAppender();
  const targetLabel = isSimulator ? "参考" : "目标";

  push("【用户目标】");
  push(`- 指标标签：统一使用 ${metricTag("source", "原始采集字段")}、${metricTag("normalized", "标准化账本事实")}、${metricTag("adapter-mapped", "适配器字段/位置映射")}、${metricTag("derived", "由已标记事实计算")}、${metricTag("declared-rule", "用户声明规则")}。`);
  if (policies.length) {
    for (const p of policies) push(`- ${p.name}：${p.objective}`);
  } else {
    push("- （尚未声明投资目标与投资纪律）");
  }
  if (scope) {
    push(`- 投资范围：${scope.scopeType === "ACCOUNT" ? "账户级" : "声明组合"}；分母口径：${scope.denominatorSource === "account_total_asset" ? "账户总资产" : scope.denominatorSource === "declared_investable" ? "声明可投资金" : "未声明"}；账户基础币种：${scope.baseCurrency} ${metricTag("declared-rule", "InvestmentScope")}；范围版本生效日 ${scope.effectiveFrom} ${metricTag("declared-rule", "InvestmentScope.effectiveFrom")}（只表示该复盘范围版本从何时适用，不代表行情/交易数据从该日开始）${scope.managementStartedAt ? `；首次纳入本地管理 ${scope.managementStartedAt}` : ""}${scope.denominatorAsOf ? `；账户分母快照日 ${scope.denominatorAsOf} ${metricTag("normalized", "InvestmentScope.denominatorAsOf")}（不是所有底层持仓的净值日）` : ""}`);
  }
  blank();

  push("【当前投资组合】");
  if (account) {
    push(`- 账户快照：采集于 ${account.capturedAt}；总资产 ${moneyText(account.totalAsset)} 元 ${accountTotalProvenance(account, sourceCapture)}${derivedHoldingPnlText(portfolio, sourceCapture)}${cumulativePnlContext(account, sourceCapture)}`);
  }
  if (portfolio) {
    push(`- 总资产：${moneyText(portfolio.totalAsset)} 元 ${portfolioTotalProvenance(portfolio)}；持仓市值合计：${moneyText(portfolio.holdingValue)} 元 ${metricTag("derived", "Σ holding.marketValue")}；${portfolioCashContext(portfolio)}`);
    push("- 持仓清单：");
    const totalValue = portfolio.holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;
    const assetMap = new Map(assets.map((a) => [a.assetId, a]));
    for (const h of portfolio.holdings) {
      const weight = h.weight ?? (h.marketValue || 0) / totalValue;
      const name = h.name ?? assetMap.get(h.assetId)?.name ?? h.assetId;
      push(`  · ${name}（${h.assetId}）：市值 ${moneyText(h.marketValue)} 元 ${holdingMarketValueProvenance(h, sourceCapture)}，仓位 ${pctText(weight)} ${metricTag("derived", "holding.marketValue / portfolio.totalAsset")}${holdingProfitValueContext(h, sourceCapture)}`);
    }
  } else {
    push("- （尚无持仓快照，请先同步数据）");
  }
  blank();

  push("【基金档案与暴露元数据】");
  appendAssetMetadata(push, assets);
  blank();

  push(input.isSimulator ? "【当前规则集（模拟演练预设，非你声明）】" : "【当前目标与投资纪律规则】");
  const policyRules = activeVersions.flatMap((v) => v.rules);
  const strategyRules = strategyRuleVersions.flatMap((sv) => sv.rules);
  if (policyRules.length) {
    push("- 目标与组合规则：");
    for (const r of policyRules) {
      push(`  · ${describeRule(r)}：${policyRuleDetail(r)} ${metricTag("declared-rule", "当前生效组合规则版本")}`);
    }
  }
  if (strategyRules.length) {
    push("- 单基金规则：");
    for (const r of strategyRules) {
      const meta = r.assetId ? assets.find((a) => a.assetId === r.assetId) : undefined;
      const name = meta?.name ?? r.assetId ?? "（未指定）";
      push(`  · ${name}：${strategyRuleDetail(r)} ${metricTag("declared-rule", "当前生效单基金规则版本")}`);
    }
  }
  if (!policyRules.length && !strategyRules.length) push(input.isSimulator ? "- （模拟器未预设规则）" : "- （尚未声明规则，系统不发明合理仓位）");
  blank();

  push("【本次异常】");
  const breached = allocationDrift.filter((d) => d.direction !== "within");
  if (breached.length) {
    push(isSimulator ? "- 配置偏离（对照演练预设）：" : "- 配置偏离：");
    for (const d of breached) {
      push(`  · ${d.label}：实际 ${pctText(d.actualPct)} ${metricTag("derived", "持仓市值 / 账户总资产")}，${targetLabel} ${pctText(d.targetPct)}、区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}] ${metricTag("declared-rule", "当前生效配置规则")} → ${DIRECTION_TEXT[d.direction]}`);
    }
  } else {
    push(isSimulator ? "- 配置偏离：（当前对照演练预设均在区间内）" : "- 配置偏离：（当前已声明规则均在区间内，或尚无目标配置）");
  }
  const openActions = actions.filter((a) => a.status === "open");
  if (openActions.length) {
    push("- 待处理事项：");
    for (const a of openActions) push(`  · ${ACTION_TYPE_TEXT[a.type] ?? a.type}${a.title ? `：${a.title}` : ""}${a.detail ? `；${a.detail}` : ""}（创建于 ${a.createdAt}）`);
  }
  blank();

  push("【当前已观测历史操作】");
  if (transactions.length) {
    push(`- 业务类型汇总（含失败/撤销申请）：${summarizeTxByType(transactions)}`);
    push(`- 状态汇总：${summarizeTxByStatus(transactions)}`);
  }
  pushBuySellSummary(push, transactions);
  appendTransactionDetails(push, transactions);
  blank();

  push("【当前已观测每日盈亏轨迹】");
  appendDailyPnlDetails(push, dailyPnl);
  blank();

  push("【事前投资逻辑与证伪条件】");
  appendDecisionDetails(push, decisionRecords);
  blank();

  push("【规则版本与变更原因】");
  if (activeVersions.length || strategyRuleVersions.length) {
    for (const v of activeVersions) push(`- 组合规则版本 ${v.version}：${versionTimeText(v)}${v.changeReason ? `；变更原因 ${v.changeReason}` : ""}`);
    for (const v of strategyRuleVersions) push(`- 单基金规则版本 ${v.version}：${versionTimeText(v)}${v.changeReason ? `；变更原因 ${v.changeReason}` : ""}`);
  } else {
    push("- （尚未建立规则版本）");
  }
  blank();

  push("【数据覆盖与可信边界】");
  appendCoverage(push, coverage);
  push("- 隐私边界：分析上下文不包含账户号、交易追踪 ID、内部记录 ID、银行卡/关联支付标识或认证信息；这些字段不参与投资判断。");
  blank();

  appendContextDataGaps(push, input, portfolio?.holdings ?? []);
  blank();

  push("【采集原始事实核查附件（非核心计算输入）】");
  appendRawSourceAudit(push, sourceCapture, portfolio?.holdings.map((holding) => holding.assetId) ?? assets.map((asset) => asset.assetId), false);
  push("- 分层边界：核心指标与规则判断只使用上面的标准化账本；本附件仅用于回看来源字段和发现映射损失，不能取代原始档案或标准化事实。");
  blank();

  appendExternalAnalysisRequest(push, asOf);
  blank();
  push(`（本上下文由基金复盘助手于 ${asOf} 自动装配，包含当前本地账本已观测并标准化的组合快照、基金档案、交易、每日盈亏、规则、决策记录和覆盖信息；“当前已观测”不表示来源历史完整或逐日连续。不含个人识别/追踪标识。不重算来源业务指标；允许并显式标记基于标准化事实的可追溯上下文派生量；不替你判断。）`);

  return { text: lines.join("\n") };
}

// ---- 单偏离聚焦 Context Package：问题聚焦，并保留判断所需的当前组合快照与已观测相关明细 ----
// 用于配置偏离项的"深度分析→GPT"：不再把丰富来源事实压成少量摘要。

export function buildFocusedDriftContextPackage(d: AllocationDrift, input: ContextPackageInput): InvestmentContextPackage {
  const {
    policies, scope, account, portfolio, assets, transactions, dailyPnl, decisionRecords,
    actions, activeVersions, strategyRuleVersions, coverage, sourceCapture, asOf, isSimulator = false,
  } = input;
  const { lines, push, blank } = makeLineAppender();
  const targetLabel = isSimulator ? "参考" : "目标";
  const relatedAssetIds = d.scope === "asset"
    ? (d.assetId ? [d.assetId] : [])
    : portfolio && d.dimension
      ? aggregateExposure(portfolio.holdings, assets, d.dimension).find((s) => s.value === d.value)?.assetIds ?? []
      : [];
  const relatedHoldings = (portfolio?.holdings ?? []).filter((h) => relatedAssetIds.includes(h.assetId));
  const relatedAssets = assets.filter((a) => relatedAssetIds.includes(a.assetId));
  const relatedTx = transactions.filter((t) => relatedAssetIds.includes(t.assetId));
  const relatedDailyPnl = dailyPnl.filter((p) => relatedAssetIds.includes(p.assetId));
  const relatedDecisions = decisionRecords.filter((dr) => dr.assetId && relatedAssetIds.includes(dr.assetId));
  const relatedTxIds = new Set(relatedTx.map((t) => t.id));
  const relatedPolicyIds = new Set(activeVersions.flatMap((v) => v.rules.some((r) => r.kind === "target_allocation" && r.dimension === d.dimension && r.value === d.value) ? [v.policyId] : []));
  const relatedActions = actions.filter((a) =>
    (a.transactionId && relatedTxIds.has(a.transactionId))
    || (a.policyId && relatedPolicyIds.has(a.policyId))
    || relatedAssetIds.some((id) => `${a.title ?? ""} ${a.detail ?? ""}`.includes(id)),
  );
  const totalValue = portfolio?.holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;

  push("【单偏离深度分析上下文】");
  blank();

  push("【分析边界】");
  push("- 问题聚焦于本次配置偏离，并提供当前组合快照及该偏离相关的全部已观测标准化基金档案、交易、每日盈亏、规则、决策和覆盖信息；“全部已观测”不表示来源历史完整或逐日连续。");
  push("- 事实字段来自当前本地账本；规则和投资逻辑来自你的本地声明。系统不补造缺失字段。");
  push("- 事实分层：原始事实用于核查采集字段，标准化事实用于统一语义；不重算来源业务指标，但允许基于标准化事实计算明确、可追溯的上下文派生量（如仓位差、日期差、持仓汇总校验），并显式标记为派生值。");
  push(`- 关键指标标签：${metricTag("source", "原始采集字段")}、${metricTag("normalized", "标准化账本事实")}、${metricTag("adapter-mapped", "适配器字段/位置映射")}、${metricTag("derived", "由已标记事实计算")}、${metricTag("declared-rule", "用户声明规则")}。`);
  blank();

  push("【本次异常】");
  push(`- ${d.label}：实际 ${pctText(d.actualPct)} ${metricTag("derived", "holding.marketValue / portfolio.totalAsset")}，${targetLabel} ${pctText(d.targetPct)}、区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}] ${metricTag("declared-rule", "当前生效配置规则")} → ${DIRECTION_TEXT[d.direction]}`);
  blank();

  push("【账户、投资范围与当前组合快照】");
  if (account) {
    push(`- 账户快照：采集于 ${account.capturedAt}；总资产 ${moneyText(account.totalAsset)} 元 ${accountTotalProvenance(account, sourceCapture)}${derivedHoldingPnlText(portfolio, sourceCapture)}${cumulativePnlContext(account, sourceCapture)}`);
  }
  if (scope) {
    const denominatorText = scope.denominatorSource === "account_total_asset" ? "账户总资产" : scope.denominatorSource === "declared_investable" ? "声明可投资金" : "未声明";
    push(`- 投资范围：${scope.scopeType === "ACCOUNT" ? "账户级" : "声明组合"}；分母口径 ${denominatorText}；账户基础币种 ${scope.baseCurrency} ${metricTag("declared-rule", "InvestmentScope")}`);
    push(`- 范围时点：范围版本生效日 ${scope.effectiveFrom} ${metricTag("declared-rule", "InvestmentScope.effectiveFrom")}（只表示该复盘范围版本从何时适用，不代表交易/行情数据起始日）${scope.managementStartedAt ? `；首次纳入本地管理 ${scope.managementStartedAt}` : ""}${scope.denominatorAsOf ? `；账户总资产分母快照日 ${scope.denominatorAsOf} ${metricTag("normalized", "InvestmentScope.denominatorAsOf")}（不是所有底层持仓的净值日）` : ""}`);
  }
  if (portfolio) {
    push(`- 组合快照日（账户采集日，不等于所有底层净值日）：${portfolio.date}；总资产 ${moneyText(portfolio.totalAsset)} 元 ${portfolioTotalProvenance(portfolio)}；持仓市值合计 ${moneyText(portfolio.holdingValue)} 元 ${metricTag("derived", "Σ holding.marketValue")}；${portfolioCashContext(portfolio)}`);
    push(`- 当前持仓结构（${portfolio.holdings.length} 只）：`);
    for (const h of [...portfolio.holdings].sort((a, b) => b.marketValue - a.marketValue)) {
      const weight = h.weight ?? (h.marketValue || 0) / totalValue;
      push(`  · ${h.name ?? h.assetId}（${h.assetId}）：市值 ${moneyText(h.marketValue)} 元 ${holdingMarketValueProvenance(h, sourceCapture)}，仓位 ${pctText(weight)} ${metricTag("derived", "holding.marketValue / portfolio.totalAsset")}${holdingProfitValueContext(h, sourceCapture)}${holdingReturnContext(h, sourceCapture)}${h.costValue === undefined ? "" : `，投入成本 ${moneyText(h.costValue)} 元 ${metricTag("normalized", "可确认持仓成本")}`}`);
    }
    appendValuationFreshness(push, portfolio, relatedHoldings, d);
  } else {
    push("- （尚无组合快照）");
  }
  blank();

  push("【相关持仓】");
  if (relatedHoldings.length) {
    for (const h of relatedHoldings) {
      const weight = h.weight ?? (h.marketValue || 0) / totalValue;
      push(`- ${h.name ?? h.assetId}（${h.assetId}）：市值 ${moneyText(h.marketValue)} 元 ${holdingMarketValueProvenance(h, sourceCapture)}，仓位 ${pctText(weight)} ${metricTag("derived", "holding.marketValue / portfolio.totalAsset")}${holdingProfitValueContext(h, sourceCapture)}${holdingReturnContext(h, sourceCapture)}${h.costValue !== undefined ? `，投入成本 ${moneyText(h.costValue)} 元 ${metricTag("normalized", "可确认持仓成本")}` : ""}${h.shares !== undefined ? `，份额 ${h.shares} ${metricTag("normalized", "HoldingSnapshot.shares；字段级原始路径未持久化")}` : ""}${h.availableShares !== undefined ? `，可用份额 ${h.availableShares} ${metricTag("normalized", "HoldingSnapshot.availableShares；字段级原始路径未持久化")}` : ""}${h.nav !== undefined ? `，净值 ${h.nav} ${holdingNavProvenance(h, sourceCapture)}` : ""}${h.navDate ? `（净值日 ${h.navDate} ${holdingNavDateProvenance(h, sourceCapture)}）` : ""}`);
    }
  } else {
    push("- （无直接相关持仓）");
  }
  blank();

  push("【相关基金当前已观测档案与暴露元数据】");
  appendAssetMetadata(push, relatedAssets);
  blank();

  push("【目标规则及同基金其他纪律】");
  const relatedStrategyRules = strategyRuleVersions.flatMap((version) =>
    version.rules.filter((rule) => rule.assetId && relatedAssetIds.includes(rule.assetId)).map((rule) => ({ version, rule })),
  );
  if (!relatedStrategyRules.length) {
    push(`- ${RULE_KIND_TEXT[d.ruleSource] ?? d.ruleSource}：区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}]${d.targetPct !== undefined ? `，${targetLabel} ${pctText(d.targetPct)}` : ""} ${metricTag("declared-rule", "当前生效配置规则")}`);
  }
  for (const { version, rule } of relatedStrategyRules) {
    push(`- 版本 ${version.version} · ${rule.assetId}：${strategyRuleDetail(rule)} ${metricTag("declared-rule", `StrategyRuleVersion ${version.version}`)}；${versionTimeText(version)}${version.changeReason ? `；版本原因：${version.changeReason}` : ""}`);
    const currentState = strategyRuleCurrentState(rule, relatedHoldings.find((holding) => holding.assetId === rule.assetId));
    if (currentState) push(`  · 当前派生状态 ${metricTag("derived", "规则参数与具备资格的标准化持仓事实")}：${currentState}`);
    const reductionEstimate = reductionEstimateText(rule, relatedHoldings.find((holding) => holding.assetId === rule.assetId), portfolio);
    if (reductionEstimate) push(`  · 减仓估算边界：${reductionEstimate}`);
  }
  const futureRules = relatedStrategyRules.filter(({ version }) => portfolio && version.effectiveFrom > portfolio.date);
  const unknownRuleCreation = relatedStrategyRules.some(({ version }) => !version.createdAt);
  const rulesCreatedAfterCapture = relatedStrategyRules.filter(({ version }) => version.createdAt && account && version.createdAt > account.capturedAt);
  push(`- 检查时点：本上下文生成于 ${asOf}；配置对比使用 ${portfolio?.date ?? "未知"} 的最新已知持仓快照。`);
  if (futureRules.length && portfolio) push(`- ⚠ 事后规则边界：相关规则从 ${futureRules.map(({ version }) => version.effectiveFrom).sort()[0]} 起生效，晚于持仓快照 ${portfolio.date}。这里仅表示“在 ${asOf} 用现行规则检查最新已知状态”，不能据此认定 ${portfolio.date} 当日或更早已经违规，也不能用于解释生效前交易。`);
  if (unknownRuleCreation) push("- ⚠ 规则创建时点缺口：该旧版本没有记录实际创建时点，即使生效日与持仓快照同日，也无法证明规则在快照采集前已经存在。因此它只能用于当前检查，不能用于认定历史违规或评价生效前交易。");
  if (rulesCreatedAfterCapture.length && account) push(`- ⚠ 事后规则边界：规则实际创建于 ${rulesCreatedAfterCapture.map(({ version }) => version.createdAt).filter(Boolean).sort()[0]}，晚于账户快照采集时点 ${account.capturedAt}；只能作为当前检查规则，不能污染该快照的历史复盘。`);
  for (const v of activeVersions) {
    for (const rule of v.rules) {
      const policyCreatedAt = policies.find((policy) => policy.id === v.policyId)?.createdAt;
      push(`- 组合规则版本 ${v.version} · ${describeRule(rule)}：${policyRuleDetail(rule)} ${metricTag("declared-rule", `PolicyVersion ${v.version}`)}；${versionTimeText({ ...v, createdAt: v.createdAt ?? policyCreatedAt })}`);
    }
  }
  if (policies.length) push(`- 相关目标声明：${policies.map((p) => `${p.name}：${p.objective}`).join("；")}`);
  blank();

  push("【相关当前已观测历史操作】");
  if (relatedTx.length) {
    push(`- 业务类型汇总（含失败/撤销申请）：${summarizeTxByType(relatedTx)}`);
    push(`- 状态汇总：${summarizeTxByStatus(relatedTx)}`);
    pushBuySellSummary(push, relatedTx);
  }
  appendTransactionDetails(push, relatedTx);
  blank();

  push("【相关当前已观测每日盈亏轨迹】");
  appendDailyPnlDetails(push, relatedDailyPnl);
  blank();

  push("【采集原始事实核查附件（非核心计算输入）】");
  appendRawSourceAudit(push, sourceCapture, relatedAssetIds, true);
  push("- 分层边界：上述标准化账本是指标与规则判断依据；本附件只核查采集原字段是否被正确提取。完整未删减采集对象仅保存在本地，不随 GPT 上下文外传。");
  blank();

  push("【原始投资逻辑、计划与证伪条件】");
  appendDecisionDetails(push, relatedDecisions);
  blank();

  push("【相关待处理事项】");
  if (relatedActions.length) {
    for (const a of relatedActions) push(`- ${ACTION_TYPE_TEXT[a.type] ?? a.type}｜${a.status}｜${a.createdAt}${a.title ? `｜${a.title}` : ""}${a.detail ? `｜${a.detail}` : ""}`);
  } else {
    push("- （没有与该基金、交易或规则明确关联的待处理事项）");
  }
  blank();

  push("【数据覆盖与可信边界】");
  appendFocusedCoverage(push, coverage, {
    holdings: relatedHoldings.length,
    assets: relatedAssets.length,
    transactions: relatedTx.length,
    dailyPnl: relatedDailyPnl.length,
  });
  push(`- 本问题其他关联事实：事前决策 ${relatedDecisions.length} 条；关联事项 ${relatedActions.length} 条。`);
  push("- 隐私边界：分析上下文不包含账户号、交易追踪 ID、内部记录 ID、银行卡/关联支付标识或认证信息；这些字段不参与投资判断。");
  blank();

  appendContextDataGaps(push, { coverage, sourceCapture, decisionRecords: relatedDecisions, account }, relatedHoldings);
  blank();

  appendExternalAnalysisRequest(push, asOf, `${d.label}当前相对用户声明规则${DIRECTION_TEXT[d.direction]}`);
  blank();
  push(`（本上下文由基金复盘助手于 ${asOf} 针对单偏离自动装配，包含当前组合快照、当前本地账本中与该偏离相关的全部已观测标准化事实，以及用于核查映射的脱敏原字段附件；“全部已观测”不表示来源历史完整或逐日连续，完整原档仍仅在本地。不重算来源业务指标；允许并显式标记可追溯的上下文派生量；不替你判断。）`);

  return { text: lines.join("\n") };
}

// ---- 牛熊演练风险发现：把当期行为/配置偏离翻译成"事实依据 + 对应历史市场阶段会出的问题" ----
// 不替用户判断是否要买卖，只降低理解成本：把"X 阶段对 Y 基金做了 Z"绑定到该基金所在市场的真实历史最差周期。
export interface SimFinding {
  level: "risk" | "info";
  /** 一句话结论：什么阶段对哪只基金做了什么、对应什么历史周期会出问题。 */
  title: string;
  /** 事实依据：操作明细 / 偏离数值 + 该基金对应历史周期的真实回撤与后果。 */
  detail: string;
}

const PHASE_LABEL_SHORT: Record<string, string> = {
  bull: "牛市", top: "见顶", bear: "熊市", bottom: "触底", rebound: "反弹", range: "震荡",
};

/** 该 IndexId 所在市场的历史最差周期及末态收益（基于 historical-cycles 真实月度涨幅累乘）。 */
function worstCycleForIndex(indexId: IndexId): { label: string; endReturnPct: number } | undefined {
  const candidates = HISTORICAL_CYCLES.filter((c) => c.monthlyReturns[indexId]);
  if (!candidates.length) return undefined;
  let worst = candidates[0];
  let worstNav = navOfCycle(worst, indexId, cycleLength(worst) - 1);
  for (const c of candidates) {
    const nav = navOfCycle(c, indexId, cycleLength(c) - 1);
    if (nav !== undefined && (worstNav === undefined || nav < worstNav)) {
      worstNav = nav;
      worst = c;
    }
  }
  if (worstNav === undefined) return undefined;
  return { label: worst.label, endReturnPct: worstNav - 1 };
}

/**
 * 行为风险 → 绑定该笔交易的具体基金：用该基金 IndexId 找其市场历史最差周期与末态回撤，
 * 给出"本期对该基金做了什么 + 若再现该周期会怎样"的一一对应结论。
 * - 风险行为（浮盈加仓/重仓猛干/追涨杀跌）：顺风/避险资产不报；其余绑定该基金市场历史最差周期。
 * - 规律定投：每笔都体现——标的在不利历史周期会持续加仓下跌资产(risk)；顺风标的风险有限(info)；
 *   标的未匹配历史周期则说明无法定位(info)，不静默漏报。
 */
function behaviorRiskNote(
  behavior: string,
  assetId: string | undefined,
  indexIdByAsset: Record<string, IndexId>,
): { level: "risk" | "info"; note: string } | undefined {
  const ix = assetId ? indexIdByAsset[assetId] : undefined;
  const worst = ix ? worstCycleForIndex(ix) : undefined;
  const adverse = worst ? worst.endReturnPct < 0 : false;
  const histClause = worst
    ? `该基金所在市场的历史最差周期「${worst.label}」末态约 ${pctText(worst.endReturnPct)}；`
    : "该基金未匹配到历史周期基准、无法定位其市场历史风险；";
  if (behavior === "规律定投") {
    if (!worst) return { level: "info", note: `${histClause}定投纪律本身平滑择时风险，长期成本平均。` };
    if (adverse) return { level: "risk", note: `${histClause}定投纪律平滑择时，但该定投标的在该周期里会持续加仓下跌资产，累计浮亏随周期扩大。` };
    return { level: "info", note: `${histClause}该定投标的在该周期顺风，定投风险有限。` };
  }
  // 风险行为：顺风/避险资产不报
  if (worst && !adverse) return undefined;
  if (behavior === "浮盈加仓") return { level: "risk", note: `${histClause}本期加仓放大了该暴露，若再现此周期，这部分仓位会随该基金深跌被套。` };
  if (behavior === "重仓猛干") return { level: "risk", note: `${histClause}重仓该单标的放大集中度，若再现此周期，该标的回撤会远超组合均值。` };
  if (behavior === "追涨杀跌") return { level: "risk", note: `${histClause}追涨杀跌易在转折点做反，若再现此周期会放大该基金的操作偏差。` };
  return undefined;
}

/**
 * 由牛熊演练当期行为与配置偏离归纳"风险发现"，每笔操作都体现、不静默漏报。
 * - 行为：浮盈加仓/重仓猛干/追涨杀跌/规律定投 → 绑定该笔交易基金与其市场历史周期（risk 或 info）。
 * - 配置偏离：超上限/低下限 → 事实数值与"该阶段若不调整偏离会扩大"。
 * - 全部无风险无偏离时返回一条 info，明确"本期未发现需关注的风险"。
 */
export function buildSimFindings(
  phase: string,
  asOf: string,
  logs: BehaviorLogEntry[],
  drift: AllocationDrift[],
  indexIdByAsset: Record<string, IndexId>,
  realDateByAsset: Record<string, string>,
): SimFinding[] {
  const out: SimFinding[] = [];
  const phaseLabel = PHASE_LABEL_SHORT[phase] ?? phase;
  for (const log of logs) {
    const r = behaviorRiskNote(log.behavior, log.assetId, indexIdByAsset);
    if (!r) continue;
    const realDate = log.assetId ? realDateByAsset[log.assetId] : undefined;
    out.push({
      level: r.level,
      title: `${phaseLabel}阶段 · ${log.behavior}`,
      detail: `事实：${log.text}。时间：演练模拟 ${asOf}、该基金最近真实交易 ${realDate ?? "—"}。${r.note}`,
    });
  }
  for (const d of drift.filter((x) => x.direction !== "within")) {
    const dirText = d.direction === "over" ? "超上限" : "低下限";
    out.push({
      level: "risk",
      title: `${phaseLabel}阶段 · 配置偏离：${d.label}`,
      detail: `事实：${asOf}（演练模拟）· 实际 ${pctText(d.actualPct)}，声明区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}]，${dirText}；${phaseLabel}阶段若不调整，偏离会在后续期继续扩大。`,
    });
  }
  if (!out.length) out.push({ level: "info", title: `${phaseLabel}阶段未发现需关注的风险`, detail: "本期无行为风险，配置偏离均在声明区间内。" });
  return out;
}

// ---- 历史周期压力测试发现：把"最脆弱场景 + 最差资产"绑定到具体基金与真实交易日期 ----
// 与演练发现同一思路：指出具体基金、它所在市场的历史压力周期、可核实的回撤数值与真实交易日期。
export function buildStressFindings(
  result: AllCyclesResult,
  assets: AssetMetadata[],
  realDateByAsset: Record<string, string>,
): SimFinding[] {
  const w = result.worstCycle;
  const worstAssetId = w?.worstAssetId;
  if (!result.hasHoldings || !w || !worstAssetId) return [];
  const out: SimFinding[] = [];
  const asset = assets.find((a) => a.assetId === worstAssetId);
  const assetName = asset?.name ?? w.worstAssetName ?? "—";
  const realDate = realDateByAsset[worstAssetId];
  out.push({
    level: "risk",
    title: `最脆弱场景「${w.cycleLabel}」· 最差资产 ${assetName}`,
    detail: `事实：该历史周期组合回撤 ${pctText(w.maxDrawdownPct)}，${assetName} 末态约 ${pctText(w.worstAssetEndReturnPct)}；该基金最近真实交易 ${realDate ?? "—"}。该周期即该基金所在市场的历史压力场景，可按真实交易日期核实该基金、在上方选该周期复算回撤。`,
  });
  if (result.bestCycle && result.bestCycle.cycleId !== w.cycleId) {
    const b = result.bestCycle;
    out.push({ level: "info", title: `最稳健场景「${b.cycleLabel}」`, detail: `事实：该历史周期组合回撤仅 ${pctText(b.maxDrawdownPct)}，为最稳健的历史市场风格，可作对照（非预测未来）。` });
  }
  return out;
}
