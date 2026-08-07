/**
 * fund-analysis：基于 FundData 派生分析指标，供图表与复盘文字消费。
 * 纯函数，便于单元测试与回放。
 */
import type { FundData, FundHolding } from "./fund-schema";

export interface PerformancePoint {
  date: string;
  /** 累计收益（元） */
  cumulativeProfit: number;
  /** 单日收益（元） */
  dailyProfit: number;
}

export interface PerformanceSummary {
  /** 累计收益（元） */
  totalProfit: number;
  /** 单日最大盈利（元） */
  maxDailyGain: number;
  /** 单日最大亏损（元） */
  maxDailyLoss: number;
  /** 收益率（%） */
  profitRate: number;
  /** 曲线点位 */
  series: PerformancePoint[];
}

export interface HoldingMetric extends FundHolding {
  /** 占累计收益的比例（%） */
  profitContribution: number;
}

export interface ReviewReport {
  updateTime: string;
  totalAsset: number;
  totalProfit: number;
  profitRate: number;
  holdingCount: number;
  transactionCount: number;
  buyCount: number;
  sellCount: number;
  /** 表现最好的基金 */
  bestFund?: FundHolding;
  /** 表现最差的基金 */
  worstFund?: FundHolding;
  /** 按收益贡献排序的持仓 */
  rankedHoldings: HoldingMetric[];
  /** 海外/主题基金仓位占比（%）—— 简单按名称关键词估算 */
  overseasRatio: number;
  /** 自动生成的文字总结段落 */
  summary: string;
}

/**
 * 由交易流水模拟出累计收益曲线。
 * MVP 假设：每笔交易当日产生金额变动，累计收益按账户 totalProfit 归一化缩放。
 * 真实曲线需要每日净值，这里给出与持仓收益一致的演示曲线。
 */
export function buildPerformance(data: FundData): PerformanceSummary {
  const txs = [...(data.transactions || [])].sort((a, b) => a.date.localeCompare(b.date));
  const totalProfit = data.account?.totalProfit ?? 0;
  const series: PerformancePoint[] = [];

  if (txs.length === 0) {
    // 没有交易则只有终点
    series.push({ date: data.updateTime || "今日", cumulativeProfit: totalProfit, dailyProfit: totalProfit });
  } else {
    // 按交易日期聚合：每笔买入视为正贡献、卖出视为负贡献的简化模型
    let cumulative = 0;
    let lastCumulative = 0;
    let lastDate = "";
    for (const t of txs) {
      const sign = t.type === "SELL" ? -1 : 1;
      cumulative += sign * t.amount * 0.01; // 简化：把金额按 1% 折算成演示收益增量
      const daily = cumulative - lastCumulative;
      series.push({ date: t.date, cumulativeProfit: round2(cumulative), dailyProfit: round2(daily) });
      lastCumulative = cumulative;
      lastDate = t.date;
    }
    // 把演示曲线终值缩放到真实累计收益，保证与账户一致
    const scale = totalProfit !== 0 && cumulative !== 0 ? totalProfit / cumulative : 1;
    series.forEach((p) => {
      p.cumulativeProfit = round2(p.cumulativeProfit * scale);
      p.dailyProfit = round2(p.dailyProfit * scale);
    });
    // 末点对齐 totalProfit
    if (series.length) {
      series[series.length - 1].cumulativeProfit = round2(totalProfit);
    }
    if (!lastDate) {
      void lastDate;
    }
  }

  const dailyProfits = series.map((p) => p.dailyProfit);
  return {
    totalProfit: round2(totalProfit),
    maxDailyGain: round2(Math.max(0, ...dailyProfits)),
    maxDailyLoss: round2(Math.min(0, ...dailyProfits)),
    profitRate: data.account?.profitRate ?? 0,
    series,
  };
}

/** 按收益贡献排序持仓 */
export function rankHoldings(data: FundData): HoldingMetric[] {
  const totalProfit = data.holdings.reduce((s, h) => s + Math.abs(h.profit), 0) || 1;
  return [...data.holdings]
    .map((h) => ({
      ...h,
      profitContribution: round2((Math.abs(h.profit) / totalProfit) * 100),
    }))
    .sort((a, b) => b.profit - a.profit);
}

/** 估算海外/主题基金仓位占比（按名称关键词，仅作风险提示） */
export function estimateOverseasRatio(data: FundData): number {
  const keywords = ["纳斯达克", "标普", "美国", "海外", "全球", "日经", "德国", "France".toLowerCase()];
  const overseasAmount = data.holdings
    .filter((h) => keywords.some((k) => h.name.toLowerCase().includes(k)))
    .reduce((s, h) => s + h.amount, 0);
  const total = data.holdings.reduce((s, h) => s + h.amount, 0) || 1;
  return round2((overseasAmount / total) * 100);
}

/** 生成投资复盘报告 */
export function buildReview(data: FundData): ReviewReport {
  const ranked = rankHoldings(data);
  const overseasRatio = estimateOverseasRatio(data);
  const txs = data.transactions || [];
  const buyCount = txs.filter((t) => t.type === "BUY").length;
  const sellCount = txs.filter((t) => t.type === "SELL").length;
  const best = ranked[0] && ranked[0].profit > 0 ? ranked[0] : undefined;
  const worst = ranked.length ? ranked[ranked.length - 1] : undefined;

  const lines: string[] = [];
  lines.push(`截至 ${data.updateTime || "数据更新时间"}，你的基金总资产为 ${data.account.totalAsset.toFixed(2)} 元，累计收益 ${data.account.totalProfit.toFixed(2)} 元，收益率 ${data.account.profitRate.toFixed(2)}%。`);
  lines.push(`当前共持有 ${data.holdings.length} 只基金，期间发生 ${txs.length} 次交易（买入 ${buyCount} 次，卖出 ${sellCount} 次）。`);
  if (best) {
    lines.push(`表现最好的是 ${best.name}（${best.code}），累计收益 ${best.profit.toFixed(2)} 元，收益率 ${best.profitRate.toFixed(2)}%。`);
  }
  if (worst && worst.profit < 0) {
    lines.push(`表现较弱的是 ${worst.name}（${worst.code}），累计亏损 ${Math.abs(worst.profit).toFixed(2)} 元。`);
  }
  if (overseasRatio >= 30) {
    lines.push(`风险提示：海外/主题基金仓位约 ${overseasRatio.toFixed(1)}%，占比较高，需关注汇率与海外市场波动。`);
  } else {
    lines.push(`海外/主题基金仓位约 ${overseasRatio.toFixed(1)}%，整体结构偏均衡。`);
  }

  return {
    updateTime: data.updateTime,
    totalAsset: data.account.totalAsset,
    totalProfit: data.account.totalProfit,
    profitRate: data.account.profitRate,
    holdingCount: data.holdings.length,
    transactionCount: txs.length,
    buyCount,
    sellCount,
    bestFund: best,
    worstFund: worst,
    rankedHoldings: ranked,
    overseasRatio,
    summary: lines.join("\n\n"),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}