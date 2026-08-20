/**
 * 视图选择器：把 Ledger 标准事实转成页面需要的只读视图模型。
 *
 * 严格区分 Fact / Inference / Suggestion（PRD §6.4）：账户当前持仓浮盈与累计盈亏分别
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
  PolicyVersion,
  PortfolioSnapshot,
  ReviewAction,
  ReviewSnapshot,
  StrategyRuleVersion,
  Transaction,
} from "../domain";
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
  /** 当 currentHoldingPnl 缺失时为 true，提醒页面不要把累计盈亏当持仓浮盈。 */
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

export interface PortfolioHoldingRow {
  assetId: string;
  name?: string;
  marketValue: number;
  pnl?: number;
  pnlRate?: number;
  weight: number;
  indexes: string[];
  regions: string[];
  strategy?: string;
  metadataSource: "采集来源" | "原文提取" | "来源推导" | "待识别";
  metadataSourceUrl?: string;
  metadataAsOf?: string;
  metadataDetails: Array<{
    label: "指数" | "地区" | "主题";
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
      ["指数", "indexes"],
      ["地区", "regions"],
      ["主题", "themes"],
    ].map(([label, dimension]) => {
      const key = dimension as "indexes" | "regions" | "themes";
      const quality = meta?.provenance?.[key] ?? "unknown";
      const evidence = meta?.evidence?.[key];
      const source = quality === "source"
        ? evidence?.sourceField === "tracked-index"
          ? "跟踪标的"
          : evidence?.sourceField === "industry-allocation"
            ? "行业采集"
            : "字段采集"
        : quality === "extracted"
          ? evidence?.sourceField === "benchmark" ? "基准提取" : "档案提取"
          : quality === "classified" ? "规则推导" : "待识别";
      return {
        label: label as "指数" | "地区" | "主题",
        source,
        ...(evidence?.sourceUrl ? { sourceUrl: evidence.sourceUrl } : {}),
        ...(evidence?.asOf ? { asOf: evidence.asOf } : {}),
        ...(evidence?.sourceSection ? { sourceSection: evidence.sourceSection } : {}),
      };
    });
    return {
      assetId: h.assetId,
      name: h.name ?? meta?.name,
      marketValue: h.marketValue,
      pnl: h.pnl,
      pnlRate: h.pnlRate,
      weight,
      indexes: meta?.indexes ?? [],
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
      parts.push(`计划减仓 ${v.planned ?? 0} / 已确认 ${v.confirmed ?? 0} / 剩余 ${v.remaining ?? 0}`);
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
  index: "指数依据",
  region: "投资市场",
  assetClass: "底层资产类型",
  currency: "计价币种",
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
  for (const sv of strategyRuleVersions) {
    for (const rule of sv.rules) {
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
  portfolio?: PortfolioSnapshot;
  assets: AssetMetadata[];
  /** 已算好的目标配置偏离（调用方用 buildAllocationDrift 产出）。 */
  allocationDrift: AllocationDrift[];
  actions: Action[];
  transactions: Transaction[];
  decisionRecords: DecisionRecord[];
  activeVersions: PolicyVersion[];
  strategyRuleVersions: StrategyRuleVersion[];
  coverage: DataCoverage[];
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

function appendAnalysisInstructions(push: (line: string) => void): void {
  push("请：");
  push("1. 分析支持与反对两方面；");
  push("2. 区分事实、假设和判断；");
  push("3. 检查我的原投资逻辑是否发生变化；");
  push("4. 提出还缺少哪些关键信息；");
  push("5. 不直接替我做最终投资决定。");
}

function summarizeTxByType(list: Transaction[]): string {
  const byType = new Map<string, number>();
  for (const t of list) byType.set(t.type, (byType.get(t.type) ?? 0) + 1);
  return Array.from(byType.entries()).map(([k, n]) => `${TX_TYPE_TEXT[k as Transaction["type"]] ?? k} ${n}`).join(" / ");
}

function pushBuySellSummary(push: (line: string) => void, list: Transaction[]): void {
  const buys = list.filter((t) => t.type === "BUY");
  const sells = list.filter((t) => t.type === "SELL");
  if (buys.length) push(`- 买入合计 ${moneyText(buys.reduce((s, t) => s + (t.confirmedAmount ?? t.amount), 0))} 元`);
  if (sells.length) push(`- 卖出合计 ${moneyText(sells.reduce((s, t) => s + (t.confirmedAmount ?? t.amount), 0))} 元`);
}

/**
 * 把账户状态 + 历史 + 投资逻辑 + 当前异常 + 规则 + 待判断问题拼装成一段可复制文本，
 * 交由通用大模型深度分析。产品卖的是高质量 Context，不是自己的模型能力。
 */
export function buildInvestmentContextPackage(input: ContextPackageInput): InvestmentContextPackage {
  const { policies, scope, portfolio, assets, allocationDrift, actions, transactions, decisionRecords, activeVersions, strategyRuleVersions, coverage, asOf, isSimulator = false } = input;
  const { lines, push, blank } = makeLineAppender();
  const targetLabel = isSimulator ? "参考" : "目标";

  push("【用户目标】");
  if (policies.length) {
    for (const p of policies) push(`- ${p.name}：${p.objective}`);
  } else {
    push("- （尚未声明投资目标与投资纪律）");
  }
  if (scope) {
    push(`- 投资范围：${scope.scopeType === "ACCOUNT" ? "账户级" : "声明组合"}；分母口径：${scope.denominatorSource === "account_total_asset" ? "账户总资产" : scope.denominatorSource === "declared_investable" ? "声明可投资金" : "未声明"}；基础币种：${scope.baseCurrency}`);
  }
  blank();

  push("【当前投资组合】");
  if (portfolio) {
    push(`- 总资产：${moneyText(portfolio.totalAsset)} 元；持仓市值：${moneyText(portfolio.holdingValue)} 元；现金：${portfolio.cash === undefined ? "—" : `${moneyText(portfolio.cash)} 元`}`);
    push("- 持仓清单：");
    const totalValue = portfolio.holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;
    const assetMap = new Map(assets.map((a) => [a.assetId, a]));
    for (const h of portfolio.holdings) {
      const weight = h.weight ?? (h.marketValue || 0) / totalValue;
      const name = h.name ?? assetMap.get(h.assetId)?.name ?? h.assetId;
      push(`  · ${name}（${h.assetId}）：市值 ${moneyText(h.marketValue)} 元，仓位 ${pctText(weight)}${h.pnl !== undefined ? `，浮盈 ${moneyText(h.pnl)} 元` : ""}`);
    }
  } else {
    push("- （尚无持仓快照，请先同步数据）");
  }
  blank();

  push(input.isSimulator ? "【资产配置规则（模拟演练预设，非你声明）】" : "【资产配置规则（你已声明）】");
  const targetRules = activeVersions.flatMap((v) => v.rules).filter((r) => r.kind === "target_allocation" || r.kind === "pause");
  const bandRules = strategyRuleVersions.flatMap((sv) => sv.rules).filter((r) => r.kind === "position_band" || r.kind === "reduction_target" || r.kind === "trailing_stop" || r.kind === "take_profit");
  if (targetRules.length) {
    push("- 维度配比规则：");
    for (const r of targetRules as { kind: string; dimension?: ExposureDimension; value?: string; targetPct?: number; minPct?: number; maxPct?: number }[]) {
      const dim = r.dimension ? `${DIMENSION_LABEL[r.dimension]} ` : "";
      const val = r.value ? `${r.value} ` : "";
      push(`  · ${describeRule(r)}：${dim}${val}${targetLabel} ${pctText(r.targetPct)}，区间 [${pctText(r.minPct)}, ${pctText(r.maxPct)}]`);
      const ratT = describeRuleRationale(r.kind);
      if (ratT) push(`    依据：${ratT.intent}（理论：${ratT.theoryRef}；${ratT.thresholdBasis}）`);
    }
  }
  if (bandRules.length) {
    push("- 单基金规则：");
    for (const r of bandRules as { kind: string; assetId?: string }[]) {
      const meta = r.assetId ? assets.find((a) => a.assetId === r.assetId) : undefined;
      const name = meta?.name ?? r.assetId ?? "（未指定）";
      push(`  · ${name}：${describeRule(r)}`);
      const ratB = describeRuleRationale(r.kind);
      if (ratB) push(`    依据：${ratB.intent}（理论：${ratB.theoryRef}；${ratB.thresholdBasis}）`);
    }
  }
  if (!targetRules.length && !bandRules.length) push(input.isSimulator ? "- （模拟器未预设目标配置规则）" : "- （尚未声明目标配置，系统不发明合理仓位）");
  blank();

  push("【本次异常】");
  const breached = allocationDrift.filter((d) => d.direction !== "within");
  if (breached.length) {
    push(isSimulator ? "- 配置偏离（对照演练预设）：" : "- 配置偏离：");
    for (const d of breached) {
      push(`  · ${d.label}：实际 ${pctText(d.actualPct)}，${targetLabel} ${pctText(d.targetPct)}，区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}] → ${DIRECTION_TEXT[d.direction]}`);
    }
  } else {
    push(isSimulator ? "- 配置偏离：（当前对照演练预设均在区间内）" : "- 配置偏离：（当前已声明规则均在区间内，或尚无目标配置）");
  }
  const openActions = actions.filter((a) => a.status === "open");
  if (openActions.length) {
    push("- 待处理事项：");
    for (const a of openActions) push(`  · ${ACTION_TYPE_TEXT[a.type] ?? a.type}${a.title ? `：${a.title}` : ""}`);
  }
  blank();

  push("【历史操作】");
  const recent = transactions.slice(-50);
  if (recent.length) {
    push(`- 近 ${recent.length} 笔交易：${summarizeTxByType(recent)}`);
    pushBuySellSummary(push, recent);
  } else {
    push("- （暂无已记录交易）");
  }
  blank();

  push("【原始投资逻辑】");
  const withRationale = decisionRecords.filter((d) => d.rationale);
  if (withRationale.length) {
    for (const d of withRationale) push(`- ${d.direction === "BUY" ? "买入" : "卖出"} ${d.assetId ?? ""}：${d.rationale}`);
  } else {
    push("- （暂未记录事前投资理由；建议在买入前记录为什么买、什么情况下继续持有、什么情况下认为原逻辑错误）");
  }
  blank();

  push("【相关投资纪律】");
  const allRules = [...activeVersions.flatMap((v) => v.rules), ...strategyRuleVersions.flatMap((sv) => sv.rules)];
  if (allRules.length) {
    const seen = new Set<string>();
    for (const r of allRules) {
      const key = `${r.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      push(`- ${describeRule(r)}`);
    }
  } else {
    push("- （尚未建立投资纪律）");
  }
  blank();

  push("【需要判断的问题】");
  if (breached.length) {
    push("- 当前配置偏离是否值得主动再平衡，还是由未来新增资金自然调整？");
  }
  if (openActions.some((a) => a.type === "ABNORMAL_TRANSACTION" || a.type === "UNCLASSIFIED_TRANSACTION")) {
    push("- 近期交易行为是否存在过度交易、追涨杀跌或偏离长期策略？");
  }
  if (openActions.some((a) => a.type === "RISK_REVIEW")) {
    push("- 当前风险集中度与回撤是否仍在可接受范围？");
  }
  if (!breached.length && !openActions.length) {
    push("- 当前系统未发现需要复盘的异常；如需思考，可聚焦长期策略是否仍成立。");
  }
  blank();

  appendAnalysisInstructions(push);
  blank();
  push(`（本上下文由基金复盘助手于 ${asOf} 自动装配，只含事实与用户声明规则，不含任何指标计算或买卖建议。）`);

  return { text: lines.join("\n") };
}

// ---- 单偏离聚焦 Context Package：只装配该偏离相关数据，不带全量组合 ----
// 用于配置偏离项的"深度分析→GPT"：减少噪声，只把与该偏离相关的基金/规则/历史交给通用模型。

export function buildFocusedDriftContextPackage(d: AllocationDrift, input: ContextPackageInput): InvestmentContextPackage {
  const { portfolio, assets, transactions, decisionRecords, asOf, isSimulator = false } = input;
  const { lines, push, blank } = makeLineAppender();
  const targetLabel = isSimulator ? "参考" : "目标";
  const relatedAssetIds = d.scope === "asset"
    ? (d.assetId ? [d.assetId] : [])
    : portfolio && d.dimension
      ? aggregateExposure(portfolio.holdings, assets, d.dimension).find((s) => s.value === d.value)?.assetIds ?? []
      : [];
  const relatedHoldings = (portfolio?.holdings ?? []).filter((h) => relatedAssetIds.includes(h.assetId));
  const relatedTx = transactions.filter((t) => relatedAssetIds.includes(t.assetId));
  const relatedDecisions = decisionRecords.filter((dr) => dr.assetId && relatedAssetIds.includes(dr.assetId));
  const totalValue = portfolio?.holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;

  push("【单偏离深度分析上下文】");
  blank();
  push("【本次异常】");
  push(`- ${d.label}：实际 ${pctText(d.actualPct)}，${targetLabel} ${pctText(d.targetPct)}，区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}] → ${DIRECTION_TEXT[d.direction]}`);
  if (d.rationale) {
    push(`- 规则意图：${d.rationale.intent}`);
    push(`- 理论脉络：${d.rationale.theoryRef}（${d.rationale.theoryDoc}）`);
    push(`- 阈值依据：${d.rationale.thresholdBasis}`);
  }
  blank();
  push("【相关持仓】");
  if (relatedHoldings.length) {
    for (const h of relatedHoldings) {
      const weight = h.weight ?? (h.marketValue || 0) / totalValue;
      push(`- ${h.name ?? h.assetId}（${h.assetId}）：市值 ${moneyText(h.marketValue)} 元，仓位 ${pctText(weight)}${h.pnl !== undefined ? `，浮盈 ${moneyText(h.pnl)} 元` : ""}${h.nav !== undefined ? `，净值 ${h.nav}` : ""}`);
    }
  } else {
    push("- （无直接相关持仓）");
  }
  blank();
  push("【目标规则】");
  push(`- ${d.ruleSource}：区间 [${pctText(d.minPct)}, ${pctText(d.maxPct)}]${d.targetPct !== undefined ? `，${targetLabel} ${pctText(d.targetPct)}` : ""}`);
  blank();
  push("【相关历史操作】");
  if (relatedTx.length) {
    push(`- 相关基金近 ${relatedTx.length} 笔交易：${summarizeTxByType(relatedTx)}`);
    pushBuySellSummary(push, relatedTx);
  } else {
    push("- （无相关交易记录）");
  }
  blank();
  push("【原始投资逻辑】");
  const withRationale = relatedDecisions.filter((dr) => dr.rationale);
  if (withRationale.length) {
    for (const dr of withRationale) push(`- ${dr.direction === "BUY" ? "买入" : "卖出"} ${dr.assetId}：${dr.rationale}`);
  } else {
    push("- （未记录该基金的事前投资理由；建议记录为什么买、什么情况下继续持有、什么情况下认为原逻辑错误）");
  }
  blank();
  push("【需要判断的问题】");
  push(`- ${d.direction === "over" ? "当前超上限：是否值得主动再平衡/减仓，还是由未来新增资金或分红再投自然调整？" : d.direction === "under" ? "当前低于下限：是否需要补仓，还是持仓结构本就该如此？" : "当前在区间内：是否仍需调整结构？"}`);
  push("- 该偏离是否源于市场风格变化？（可在复盘页用历史周期压力测试验证该基金在历史场景下的表现）");
  blank();
  appendAnalysisInstructions(push);
  blank();
  push(`（本上下文由基金复盘助手于 ${asOf} 针对单偏离自动装配，只含该偏离相关数据，不含全量组合；不计算指标、不替判断。）`);

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
