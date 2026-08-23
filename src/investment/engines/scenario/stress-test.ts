/**
 * 历史周期压力测试：把当前持仓平移到历史周期净值曲线上，重算回撤、末态暴露与配置偏离。
 *
 * 平移语义：以当前市值为基准点，第 k 期模拟市值 = 当前市值 × 周期累计净值；不模拟交易、不预测未来。
 * 未匹配周期基准的持仓（如 A 股资产在美股周期下）市值不变，标注 matched=false，不伪造收益。
 */
import type { AssetMetadata, HoldingSnapshot, PolicyVersion, PortfolioSnapshot, StrategyRuleVersion } from "../../domain";
import { aggregateExposure, type ExposureSlice } from "../exposure/exposure";
import { buildAllocationDrift, type AllocationDrift } from "../../composables/selectors";
import { HISTORICAL_CYCLES, cycleLength, navOfCycle, normalizeIndexId, type CycleMarket, type HistoricalCycle, type IndexId } from "./historical-cycles";

export interface StressTestAssetResult {
  assetId: string;
  name?: string;
  indexId?: IndexId;
  matched: boolean;
  startMarketValue: number;
  endMarketValue: number;
  /** 末态相对基准收益率，0-1；未匹配时省略。 */
  endReturnPct?: number;
}

export interface StressTestResult {
  cycleId: string;
  cycleLabel: string;
  description: string;
  disclaimer: string;
  startTotalAsset: number;
  endTotalAsset: number;
  /** 最大回撤（元），基于周期内累计总资产序列。 */
  maxDrawdown: number;
  /** 最大回撤占峰值比例，0-1。 */
  maxDrawdownPct: number;
  /** 周期内逐期总资产序列（第 0 期为基准），供净值曲线绘制；不另行外推。 */
  periodSeries: { date: string; totalAsset: number }[];
  assetResults: StressTestAssetResult[];
  endExposureSlices: ExposureSlice[];
  endDrift: AllocationDrift[];
}

/** 取 holding 对应资产在周期内的 IndexId：只用主跟踪指数（indexes[0]）归一化，
 *  该指数在该周期有数据才匹配；无该周期基准返回 undefined（matched=false，市值不变，不伪造）。
 *  不遍历辅助指数硬塞——避免如科创50基金（indexes 含 STAR50 + 辅助 SSE）在无 STAR50 数据的周期
 *  被误配到 SSE、算出与该基金无关的收益率，让金额"不明不白"。 */
function resolveIndexId(meta: AssetMetadata | undefined, cycle: HistoricalCycle): IndexId | undefined {
  if (!meta || !meta.indexes.length) return undefined;
  const nid = normalizeIndexId(meta.indexes[0]);
  return nid && cycle.monthlyReturns[nid] ? nid : undefined;
}

export function buildHistoricalStressTest(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
  cycle: HistoricalCycle,
  activeVersions: PolicyVersion[],
  strategyRuleVersions: StrategyRuleVersion[],
): StressTestResult {
  const assetMap = new Map(assets.map((a) => [a.assetId, a]));
  const length = cycleLength(cycle);

  const assetResults: StressTestAssetResult[] = holdings.map((h) => {
    const meta = assetMap.get(h.assetId);
    const indexId = resolveIndexId(meta, cycle);
    const matched = Boolean(indexId && cycle.monthlyReturns[indexId]);
    const endNav = matched && indexId ? navOfCycle(cycle, indexId, length - 1) : 1;
    const startMarketValue = h.marketValue || 0;
    const endMarketValue = Math.round(startMarketValue * (endNav ?? 1) * 100) / 100;
    return {
      assetId: h.assetId,
      name: h.name ?? meta?.name,
      indexId,
      matched,
      startMarketValue,
      endMarketValue,
      endReturnPct: matched && endNav !== undefined ? Math.round((endNav - 1) * 10000) / 10000 : undefined,
    };
  });

  // 周期内累计总资产序列（每期各 holding 按其净值序列平移）
  const series: number[] = [];
  for (let k = 0; k < length; k++) {
    let total = 0;
    for (const h of holdings) {
      const meta = assetMap.get(h.assetId);
      const indexId = resolveIndexId(meta, cycle);
      const matched = Boolean(indexId && cycle.monthlyReturns[indexId]);
      const nav = matched && indexId ? navOfCycle(cycle, indexId, k) : 1;
      total += (h.marketValue || 0) * (nav ?? 1);
    }
    series.push(Math.round(total * 100) / 100);
  }

  let peak = series[0] ?? 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownPct = peak > 0 ? dd / peak : 0;
    }
  }

  const endHoldings: HoldingSnapshot[] = holdings.map((h, i) => ({
    ...h,
    marketValue: assetResults[i].endMarketValue,
  }));
  const endTotalAsset = assetResults.reduce((s, r) => s + r.endMarketValue, 0);
  const endPortfolio: PortfolioSnapshot = {
    id: `stress:${cycle.id}`,
    date: cycle.dates[length - 1] ?? cycle.end,
    totalAsset: endTotalAsset,
    holdingValue: endTotalAsset,
    holdings: endHoldings,
  };

  return {
    cycleId: cycle.id,
    cycleLabel: cycle.label,
    description: cycle.description,
    disclaimer: cycle.disclaimer,
    startTotalAsset: series[0] ?? 0,
    endTotalAsset,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10000) / 10000,
    periodSeries: series.map((totalAsset, k) => ({ date: cycle.dates[k] ?? `${cycle.start}+${k}`, totalAsset })),
    assetResults,
    endExposureSlices: aggregateExposure(endHoldings, assets, "index"),
    endDrift: buildAllocationDrift(activeVersions, strategyRuleVersions, endPortfolio, assets),
  };
}

// ---- 一键全部周期压力测试：一次跑完所有历史周期，返回结论汇总 ----

export interface CycleStressSummary {
  cycleId: string;
  cycleLabel: string;
  market: CycleMarket;
  maxDrawdownPct: number;
  endTotalAsset: number;
  breachedCount: number;
  /** 该周期末态的具体配置偏离项（超上限/低下限），汇总直接指出是哪项偏离、数值多少，而非仅给项数。 */
  breachedDrift: AllocationDrift[];
  /** 该周期内末态收益率最低的已匹配资产名（最脆弱资产）。 */
  worstAssetName?: string;
  /** 最脆弱资产的 assetId，用于发现绑定到具体基金与真实交易日期。 */
  worstAssetId?: string;
  /** 最脆弱资产末态收益率（0-1），用于发现给出可核实的事实数值。 */
  worstAssetEndReturnPct?: number;
}

export interface AllCyclesResult {
  summaries: CycleStressSummary[];
  /** 最大回撤周期（最脆弱场景）。 */
  worstCycle?: CycleStressSummary;
  /** 最小回撤周期（最稳健场景）。 */
  bestCycle?: CycleStressSummary;
  startTotalAsset: number;
  hasHoldings: boolean;
}

/** 一次跑完所有历史周期，返回汇总：最脆弱/最稳健场景 + 各周期回撤 + 末态偏离。 */
export function buildAllCyclesStressTest(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
  activeVersions: PolicyVersion[],
  strategyRuleVersions: StrategyRuleVersion[],
): AllCyclesResult {
  if (!holdings.length) return { summaries: [], startTotalAsset: 0, hasHoldings: false };
  const summaries: CycleStressSummary[] = HISTORICAL_CYCLES.map((c) => {
    const r = buildHistoricalStressTest(holdings, assets, c, activeVersions, strategyRuleVersions);
    const breachedDrift = r.endDrift.filter((d) => d.direction !== "within");
    const worst = [...r.assetResults].filter((a) => a.matched).sort((a, b) => (a.endReturnPct ?? 0) - (b.endReturnPct ?? 0))[0];
    return {
      cycleId: c.id,
      cycleLabel: c.label,
      market: c.market,
      maxDrawdownPct: r.maxDrawdownPct,
      endTotalAsset: r.endTotalAsset,
      breachedCount: breachedDrift.length,
      breachedDrift,
      worstAssetName: worst?.name,
      worstAssetId: worst?.assetId,
      worstAssetEndReturnPct: worst?.endReturnPct,
    };
  });
  const sorted = [...summaries].sort((a, b) => b.maxDrawdownPct - a.maxDrawdownPct);
  const startTotalAsset = holdings.reduce((s, h) => s + (h.marketValue || 0), 0);
  return { summaries, worstCycle: sorted[0], bestCycle: sorted.at(-1), startTotalAsset, hasHoldings: true };
}