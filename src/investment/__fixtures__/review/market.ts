/**
 * A 股基金牛熊周期模拟器：市场数据（人工虚构）。
 *
 * 7 个指数标的（沪深300/上证/创业板/科创50/国际黄金/标普500/纳斯达克100），24 期月度净值
 * （2024-01 → 2025-12），涵盖牛→顶→熊→底→反弹→震荡完整周期。净值由固定月度涨幅累乘得到，
 * 不随机、可断言。全部虚构，不引用任何真实基金名 / 净值 / 金额。
 */
import type { AssetMetadata } from "../../domain";
import { makeAsset } from "../builders";

export type MarketAssetId = "F001" | "F002" | "F003" | "F004" | "F005" | "F006" | "F007";

export const MARKET_ASSETS: AssetMetadata[] = [
  makeAsset({ assetId: "F001", name: "沪深300（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["CSI300"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F002", name: "上证指数（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["SSE"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F003", name: "创业板指（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["ChiNext"], currencies: ["CNY"], themes: ["growth"] }),
  makeAsset({ assetId: "F004", name: "科创50（虚构）", assetClass: "equity", regions: ["CN"], indexes: ["STAR50"], currencies: ["CNY"], themes: ["tech"] }),
  makeAsset({ assetId: "F005", name: "国际黄金（虚构）", assetClass: "commodity", regions: ["global"], indexes: ["GOLD"], currencies: ["CNY"], themes: ["hedge"] }),
  makeAsset({ assetId: "F006", name: "标普500（虚构）", assetClass: "equity", regions: ["US"], indexes: ["SP500"], currencies: ["CNY"], themes: ["broad"] }),
  makeAsset({ assetId: "F007", name: "纳斯达克100（虚构）", assetClass: "equity", regions: ["US"], indexes: ["NASDAQ100"], currencies: ["CNY"], themes: ["tech"] }),
];

export const MARKET_ASSET_IDS: MarketAssetId[] = ["F001", "F002", "F003", "F004", "F005", "F006", "F007"];

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
  };
}

export function phaseOf(period: number): MarketPhase {
  return MARKET_PHASES[period] ?? "range";
}

export function dateOf(period: number): string {
  return MARKET_DATES[period] ?? "2024-01-15";
}

export const TOTAL_PERIODS = MARKET_PHASES.length;