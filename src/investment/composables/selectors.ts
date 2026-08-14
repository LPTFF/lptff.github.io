/**
 * 视图选择器：把 Ledger 标准事实转成页面需要的只读视图模型。
 *
 * 严格区分 Fact / Inference / Suggestion（PRD §6.4）：账户当前持仓浮盈与累计盈亏分别
 * 返回，不得互相替代（PRD §17.2）；数据缺口必须给出"影响 / 不影响"两条结论（PRD §29）。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  CoverageDataset,
  DailyPnL,
  DataCoverage,
  HoldingSnapshot,
  JudgmentResult,
  PortfolioSnapshot,
  ReviewAction,
  ReviewSnapshot,
  Transaction,
} from "../domain";
import { classifyReviewJudgment } from "../engines/review/review-orchestrator";

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
  metadataSource: "来源事实" | "归类" | "待识别";
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
        ? "来源事实"
        : Object.values(meta?.provenance ?? {}).includes("classified")
          ? "归类"
          : "待识别",
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
    recover: "点「重新采集投资数据」，插件采集时选择历史时间范围以拉全交易分页。",
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
  return c.warningCodes.length ? c.warningCodes : ["存在未加载分页或历史范围"];
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
  "denominator:none": "仓位分母未声明",
  "denominator:ineligible": "仓位分母缺失或不可靠",
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
          : "等待仓位分母";
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
