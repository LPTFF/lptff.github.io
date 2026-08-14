/**
 * Exposure Engine（PRD §18.3-18.5、EPIC 6）
 *
 * 把"基金产品数量"推导为"实际底层风险暴露"：按 index / region / assetClass /
 * currency / theme 聚合持仓市值，并识别多只基金共属同一底层（重复暴露，只报告事实）。
 */
import type {
  AssetMetadata,
  ExposureDimension,
  HoldingSnapshot,
} from "../../domain";

export interface ExposureSlice {
  dimension: ExposureDimension;
  value: string;
  marketValue: number;
  pct: number;
  assetIds: string[];
}

export interface ExposureCoverage {
  dimension: ExposureDimension;
  slices: ExposureSlice[];
  knownMarketValue: number;
  unknownMarketValue: number;
  knownPct: number;
  unknownPct: number;
  multiLabel: boolean;
}

export interface SharedExposure {
  dimension: ExposureDimension;
  value: string;
  /** 与该标签关联的持仓市值；多标签维度之间不可相加。 */
  associatedMarketValue: number;
  /** 与该标签关联的仓位比例；不是来源未提供时的底层权重估算。 */
  associatedPct: number;
  assetIds: string[];
}

/** 取一只资产在某个维度上的取值集合（index/region/currency/theme 为数组，assetClass 为单值）。 */
function dimensionValues(asset: AssetMetadata, dimension: ExposureDimension): string[] {
  switch (dimension) {
    case "index":
      return asset.indexes;
    case "region":
      return asset.regions;
    case "currency":
      return asset.currencies;
    case "theme":
      return asset.themes;
    case "assetClass":
      return asset.assetClass === "other" ? [] : [asset.assetClass];
  }
}

/**
 * 按维度聚合暴露。一只基金若在维度上有多个取值（如同时含 NASDAQ100 和 SP500），
 * 其市值分别计入两个取值——这是事实层面的多次暴露，不是复制资金。
 */
export function aggregateExposure(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
  dimension: ExposureDimension,
): ExposureSlice[] {
  const assetMap = new Map(assets.map((a) => [a.assetId, a]));
  const buckets = new Map<string, { marketValue: number; assetIds: Set<string> }>();

  for (const h of holdings) {
    const meta = assetMap.get(h.assetId);
    const values = meta ? dimensionValues(meta, dimension) : [];
    // 无元数据的 holding 归入“（未标注）”桶，而非静默跳过（PRD §29 不静默 unknown）。
    const labels = values.length ? values : ["（未标注）"];
    for (const v of labels) {
      const bucket = buckets.get(v) ?? { marketValue: 0, assetIds: new Set<string>() };
      bucket.marketValue += h.marketValue || 0;
      bucket.assetIds.add(h.assetId);
      buckets.set(v, bucket);
    }
  }

  const total = holdings.reduce((s, h) => s + (h.marketValue || 0), 0) || 1;
  return Array.from(buckets.entries())
    .map(([value, b]) => ({
      dimension,
      value,
      marketValue: b.marketValue,
      pct: b.marketValue / total,
      assetIds: Array.from(b.assetIds),
    }))
    .sort((a, b) => b.marketValue - a.marketValue);
}

export function exposureCoverage(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
  dimension: ExposureDimension,
): ExposureCoverage {
  const assetMap = new Map(assets.map((asset) => [asset.assetId, asset]));
  const total = holdings.reduce((sum, holding) => sum + (holding.marketValue || 0), 0);
  let knownMarketValue = 0;
  let unknownMarketValue = 0;

  for (const holding of holdings) {
    const asset = assetMap.get(holding.assetId);
    const values = asset ? dimensionValues(asset, dimension) : [];
    if (values.length) knownMarketValue += holding.marketValue || 0;
    else unknownMarketValue += holding.marketValue || 0;
  }

  return {
    dimension,
    slices: aggregateExposure(holdings, assets, dimension),
    knownMarketValue,
    unknownMarketValue,
    knownPct: total > 0 ? knownMarketValue / total : 0,
    unknownPct: total > 0 ? unknownMarketValue / total : 0,
    multiLabel: dimension !== "assetClass",
  };
}

/**
 * 共同暴露：至少两只基金关联同一已知标签。未知桶只用于 Coverage，不构成共同暴露。
 * 币种仅在组合出现多个已知币种时分析，避免把单一 CNY 计价误报为集中风险。
 */
export function detectSharedExposures(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
): SharedExposure[] {
  const dimensions: ExposureDimension[] = ["index", "region", "currency", "theme"];
  const out: SharedExposure[] = [];

  for (const dimension of dimensions) {
    const knownSlices = aggregateExposure(holdings, assets, dimension)
      .filter((slice) => slice.value !== "（未标注）");
    if (dimension === "currency" && knownSlices.length < 2) continue;

    for (const slice of knownSlices) {
      if (slice.assetIds.length < 2) continue;
      out.push({
        dimension,
        value: slice.value,
        associatedMarketValue: slice.marketValue,
        associatedPct: slice.pct,
        assetIds: slice.assetIds,
      });
    }
  }

  return out.sort((a, b) => b.associatedMarketValue - a.associatedMarketValue);
}

/** @deprecated 使用 detectSharedExposures；保留导出以兼容旧调用。 */
export const detectDuplicateExposures = detectSharedExposures;

/** 取某维度 top N 暴露，用于控制台风险摘要（PRD §17.3）。 */
export function topExposures(
  holdings: HoldingSnapshot[],
  assets: AssetMetadata[],
  dimension: ExposureDimension = "index",
  n = 4,
): ExposureSlice[] {
  return aggregateExposure(holdings, assets, dimension).slice(0, n);
}
