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
  PortfolioSnapshot,
  Transaction,
} from "../domain";

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
  weight?: number;
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

export interface CoverageGapView {
  dataset: CoverageDataset;
  completeness: DataCoverage["completeness"];
  missingRanges: string[];
  impact: string;
  notAffected: string;
}

const DATASET_IMPACT: Record<CoverageDataset, { impact: string; notAffected: string }> = {
  transactions: {
    impact: "无法可靠计算该时期的主动交易策略收益。",
    notAffected: "不影响当前持仓风险分析。",
  },
  dailyPnl: {
    impact: "无法生成完整的每日盈亏曲线与最大回撤。",
    notAffected: "不影响当前持仓与风险结构展示。",
  },
  account: { impact: "无法确认账户资产状态。", notAffected: "不影响已记录持仓。" },
  holdings: { impact: "无法确认当前持仓。", notAffected: "不影响历史交易记录。" },
  fundDetail: { impact: "无法补齐底层资产元数据。", notAffected: "不影响已有暴露聚合。" },
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
