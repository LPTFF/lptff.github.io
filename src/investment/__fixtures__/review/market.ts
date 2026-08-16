/**
 * 基金牛熊周期模拟器：市场数据（人工虚构）。
 *
 * 9 个指数标的（沪深300/上证/创业板/科创50/国际黄金/标普500/纳斯达克100/恒生指数/恒生科技），24 期月度净值
 * （2024-01 → 2025-12），涵盖牛→顶→熊→底→反弹→震荡完整周期。净值由固定月度涨幅累乘得到，
 * 不随机、可断言。全部虚构，不引用任何真实基金名 / 净值 / 金额。
 */
import type { AssetMetadata } from "../../domain";
import type { IndexId } from "../../engines/scenario/historical-cycles";
import { makeAsset } from "../builders";

export type MarketAssetId = "F001" | "F002" | "F003" | "F004" | "F005" | "F006" | "F007" | "F008" | "F009";

export const MARKET_ASSETS: AssetMetadata[] = [
  makeAsset({ assetId: "F001", name: "沪深300（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["CSI300"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F002", name: "上证指数（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["SSE"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F003", name: "创业板指（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["ChiNext"], currencies: ["CNY"], themes: ["growth"] }),
  makeAsset({ assetId: "F004", name: "科创50（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["STAR50"], currencies: ["CNY"], themes: ["tech"] }),
  makeAsset({ assetId: "F005", name: "国际黄金（虚构）", assetClass: "commodity", regions: ["global"], indexes: ["GOLD"], currencies: ["CNY"], themes: ["hedge"] }),
  makeAsset({ assetId: "F006", name: "标普500（虚构）", assetClass: "equity", regions: ["US"], indexes: ["SP500"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F007", name: "纳斯达克100（虚构）", assetClass: "equity", regions: ["US"], indexes: ["NASDAQ100"], currencies: ["CNY"], themes: ["tech"] }),
  makeAsset({ assetId: "F008", name: "恒生指数（虚构）", assetClass: "equity", regions: ["HK"], indexes: ["HSI"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F009", name: "恒生科技指数（虚构）", assetClass: "equity", regions: ["HK"], indexes: ["HSTECH"], currencies: ["CNY"], themes: ["tech"] }),
];

export const MARKET_ASSET_IDS: MarketAssetId[] = ["F001", "F002", "F003", "F004", "F005", "F006", "F007", "F008", "F009"];

/** 月度阶段标签。 */
export type MarketPhase = "bull" | "top" | "bear" | "bottom" | "rebound" | "range";

export const PHASE_LABEL: Record<MarketPhase, string> = {
  bull: "牛市",
  top: "见顶",
  bear: "熊市",
  bottom: "触底",
  rebound: "反弹",
  range: "震荡",
};

/** 24 期阶段（期 0 = 起始，期 1-6 牛，7-9 顶，10-15 熊，16-18 底/反弹，19-24 震荡）。 */
export const MARKET_PHASES: MarketPhase[] = [
  "bull",  "bull",  "bull",  "bull",  "bull",  "bull",  // 0-5
  "top",   "top",   "top",                            // 6-8
  "bear",  "bear",  "bear",  "bear",  "bear",  "bear", // 9-14
  "bottom","rebound","rebound",                       // 15-17
  "range", "range", "range", "range", "range", "range", // 18-23
];

/** 24 期日期（期 0 = 2024-01，起始基准）。 */
export const MARKET_DATES: string[] = Array.from({ length: 24 }, (_, i) => {
  const year = 2024 + Math.floor(i / 12);
  const month = (i % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-15`;
});

/**
 * 月度涨幅（小数，0.05 = +5%）。固定常量数组，长度 24。
 * 设计：牛市成长板领涨，见顶成长板转跌而黄金避险走强，熊市普跌成长板跌幅最大，
 * 触底后成长板反弹最猛，震荡期小幅波动。
 */
export const MONTHLY_RETURNS: Record<MarketAssetId, number[]> = {
  F001: [0.00, 0.05, 0.04, 0.06, 0.05, 0.04,  0.03, 0.01, 0.00, -0.02, -0.05, -0.06, -0.04, -0.07, -0.05, -0.03,  0.06, 0.07, 0.08,  0.02, -0.01, 0.01, -0.02, 0.01],
  F002: [0.00, 0.04, 0.03, 0.05, 0.04, 0.03,  0.02, 0.01, 0.00, -0.01, -0.04, -0.05, -0.03, -0.06, -0.04, -0.02,  0.05, 0.06, 0.07,  0.01, -0.01, 0.00, -0.01, 0.01],
  F003: [0.00, 0.09, 0.08, 0.10, 0.11, 0.08,  0.05, 0.02, -0.02, -0.04, -0.09, -0.10, -0.08, -0.11, -0.08, -0.06,  0.10, 0.12, 0.14,  0.02, -0.02, 0.01, -0.03, 0.02],
  F004: [0.00, 0.11, 0.10, 0.12, 0.13, 0.09,  0.06, 0.01, -0.03, -0.05, -0.10, -0.12, -0.09, -0.13, -0.10, -0.07,  0.12, 0.14, 0.16,  0.03, -0.02, 0.01, -0.03, 0.02],
  F005: [0.00, 0.02, 0.01, 0.02, 0.01, 0.02,  0.03, 0.04, 0.05,  0.03, -0.02, 0.00, -0.01, 0.01, 0.00, 0.02,  0.02, 0.01, 0.00,  0.00, 0.01, 0.00, -0.01, 0.01],
  F006: [0.00, 0.04, 0.03, 0.05, 0.04, 0.03,  0.02, 0.01, 0.00, -0.01, -0.04, -0.05, -0.03, -0.04, -0.03, -0.02,  0.04, 0.05, 0.06,  0.01, 0.00, -0.01, 0.01, 0.00],
  F007: [0.00, 0.05, 0.04, 0.06, 0.05, 0.04,  0.03, 0.01, 0.00, -0.02, -0.05, -0.06, -0.04, -0.05, -0.04, -0.03,  0.05, 0.06, 0.07,  0.02, 0.00, -0.01, 0.01, 0.00],
  F008: [0.00, 0.05, 0.04, 0.06, 0.05, 0.04,  0.03, 0.01, 0.00, -0.03, -0.06, -0.07, -0.05, -0.08, -0.06, -0.04,  0.07, 0.08, 0.09,  0.02, -0.01, 0.01, -0.02, 0.01],
  F009: [0.00, 0.10, 0.09, 0.11, 0.12, 0.09,  0.05, 0.01, -0.03, -0.06, -0.12, -0.14, -0.10, -0.15, -0.12, -0.08,  0.13, 0.15, 0.17,  0.03, -0.02, 0.02, -0.03, 0.02],
};

/** 累计 NAV：起始 1.0000，按月度涨幅累乘。period 0 = 1.0（基准，未涨跌）。 */
export function navOf(assetId: MarketAssetId, period: number): number {
  const rets = MONTHLY_RETURNS[assetId];
  let nav = 1;
  // 月度涨幅数组的 index 0 对应 period 0（基准 0%），period k 用 rets[k]。
  for (let k = 1; k <= period && k < rets.length; k++) {
    nav *= 1 + rets[k];
  }
  return Math.round(nav * 10000) / 10000;
}

/** 取某期的所有标的 NAV。 */
export function navRow(period: number): Record<MarketAssetId, number> {
  return {
    F001: navOf("F001", period),
    F002: navOf("F002", period),
    F003: navOf("F003", period),
    F004: navOf("F004", period),
    F005: navOf("F005", period),
    F006: navOf("F006", period),
    F007: navOf("F007", period),
    F008: navOf("F008", period),
    F009: navOf("F009", period),
  };
}

export function phaseOf(period: number): MarketPhase {
  return MARKET_PHASES[period] ?? "range";
}

export function dateOf(period: number): string {
  return MARKET_DATES[period] ?? "2024-01-15";
}

export const TOTAL_PERIODS = MARKET_PHASES.length;

/** 9 个 IndexId（与 historical-cycles 对齐，F00X→CSI300/SSE/ChiNext/STAR50/GOLD/SP500/NASDAQ100/HSI/HSTECH）。 */
export const MARKET_INDEX_IDS: IndexId[] = MARKET_ASSETS
  .map((a) => a.indexes[0])
  .filter((ix): ix is IndexId => Boolean(ix)) as IndexId[];

/** IndexId → MarketAssetId 反查：真实持仓按其 IndexId 取对应的虚构净值曲线。 */
export function marketAssetForIndex(indexId: IndexId): MarketAssetId | undefined {
  const found = MARKET_ASSETS.find((a) => a.indexes.includes(indexId as string));
  return found?.assetId as MarketAssetId | undefined;
}

/** 取某期各 IndexId 的 NAV（真实模式按 IndexId 查净值用）。 */
export function navByIndexId(period: number): Record<IndexId, number> {
  const out = {} as Record<IndexId, number>;
  for (const a of MARKET_ASSETS) {
    const ix = a.indexes[0] as IndexId | undefined;
    if (ix) out[ix] = navOf(a.assetId as MarketAssetId, period);
  }
  return out;
}