/**
 * 历史周期库：把当前组合平移到真实历史市场周期的净值曲线做压力测试（机构 scenario analysis 思路）。
 *
 * 边界（investment-review.md 第 12.4 节）：
 * - 月度涨幅为基于公开历史的**近似值**，用于呈现"市场风格"，非精确回测；
 * - 每段周期带 disclaimer，页面显著标注；
 * - IndexId 对齐 __fixtures__/review/market.ts 的 indexes 约定，便于复用现有 asset 元数据。
 */
export type IndexId = "CSI300" | "SSE" | "ChiNext" | "STAR50" | "SP500" | "NASDAQ100" | "GOLD" | "HSI" | "HSTECH";

export type CycleMarket = "CN" | "US" | "commodity" | "HK";

export interface HistoricalCycle {
  id: string;
  label: string;
  market: CycleMarket;
  start: string;
  end: string;
  description: string;
  disclaimer: string;
  /** 月度日期（YYYY-MM-15），第 0 期为基准。 */
  dates: string[];
  /** 各 IndexId 的月度涨幅（小数，0.05=+5%）；未列出的 IndexId 表示该周期无该市场基准。 */
  monthlyReturns: Partial<Record<IndexId, number[]>>;
}

const DISCLAIMER = "基于公开历史的近似月度涨幅，仅用于呈现市场风格，非精确回测；不预测未来，不作为投资依据。";

function monthlyDates(start: string, count: number): string[] {
  const [y, m] = start.split("-").map(Number);
  const out: string[] = [];
  let year = y;
  let month = m;
  for (let i = 0; i < count; i++) {
    out.push(`${year}-${String(month).padStart(2, "0")}-15`);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return out;
}

export const HISTORICAL_CYCLES: HistoricalCycle[] = [
  {
    id: "CN-2015-leverage",
    label: "A股 2015 杠杆牛→股灾",
    market: "CN",
    start: "2014-07",
    end: "2015-06",
    description: "2014 下半年牛市启动，2015 上半年杠杆牛加速见顶，6 月股灾崩盘；成长板块涨幅与回撤都最剧烈。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2014-07", 12),
    monthlyReturns: {
      CSI300: [0, 0.04, 0.03, 0.10, 0.12, 0.08, 0.05, 0.02, 0.10, 0.15, 0.18, -0.28],
      SSE: [0, 0.03, 0.02, 0.08, 0.10, 0.07, 0.04, 0.01, 0.08, 0.12, 0.13, -0.22],
      ChiNext: [0, 0.05, 0.04, 0.12, 0.15, 0.12, 0.10, 0.05, 0.15, 0.20, 0.25, -0.30],
    },
  },
  {
    id: "CN-2018-bear",
    label: "A股 2018 单边熊",
    market: "CN",
    start: "2018-01",
    end: "2018-12",
    description: "贸易摩擦与去杠杆背景下全年单边下行，成长与主板普跌。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2018-01", 12),
    monthlyReturns: {
      CSI300: [0, -0.02, 0.01, -0.02, -0.01, 0.02, -0.03, -0.05, 0.03, 0.01, -0.03, -0.05],
      SSE: [0, -0.01, 0.0, -0.03, -0.02, 0.01, -0.04, -0.05, 0.02, 0.0, -0.04, -0.06],
      ChiNext: [0, 0.02, 0.03, -0.04, -0.03, 0.0, -0.05, -0.07, 0.01, -0.02, -0.05, -0.08],
      STAR50: [0, -0.05, -0.03, -0.06, -0.04, -0.02, -0.07, -0.08, 0.0, -0.03, -0.06, -0.07],
    },
  },
  {
    id: "CN-2021-core-top",
    label: "A股 2021 核心资产顶→调整",
    market: "CN",
    start: "2021-02",
    end: "2022-03",
    description: "核心资产（茅指数/宁组合）见顶后估值消化，主板与成长先后调整。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2021-02", 12),
    monthlyReturns: {
      CSI300: [0, -0.02, 0.0, -0.01, 0.02, -0.04, -0.05, -0.02, 0.01, -0.03, -0.05, -0.07],
      ChiNext: [0, 0.03, 0.05, 0.02, -0.03, 0.04, -0.02, 0.01, 0.02, -0.05, -0.04, -0.05],
      STAR50: [0, 0.04, 0.03, -0.02, 0.05, 0.03, -0.01, 0.0, 0.03, -0.06, -0.07, -0.08],
    },
  },
  {
    id: "US-2008-crisis",
    label: "美股 2008 金融危机",
    market: "US",
    start: "2008-01",
    end: "2008-12",
    description: "雷曼破产前后系统系危机，标普与纳指全年深度下跌。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2008-01", 12),
    monthlyReturns: {
      SP500: [0, -0.06, -0.03, 0.01, -0.03, -0.07, -0.06, -0.09, 0.01, -0.12, -0.05, 0.01],
      NASDAQ100: [0, -0.05, -0.02, 0.02, -0.02, -0.06, -0.05, -0.08, 0.02, -0.10, -0.04, 0.02],
    },
  },
  {
    id: "US-2022-rate-bear",
    label: "美股 2022 加息熊",
    market: "US",
    start: "2022-01",
    end: "2022-12",
    description: "快速加息打压成长估值，纳指跌幅大于标普。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2022-01", 12),
    monthlyReturns: {
      SP500: [0, -0.05, -0.01, 0.0, -0.03, -0.05, 0.02, -0.04, -0.03, 0.02, -0.01, 0.0],
      NASDAQ100: [0, -0.07, -0.02, 0.0, -0.04, -0.07, 0.03, -0.05, -0.04, 0.03, -0.02, 0.0],
    },
  },
  {
    id: "GOLD-2020-hedge",
    label: "黄金 2020 避险牛",
    market: "commodity",
    start: "2020-01",
    end: "2020-12",
    description: "疫情避险与宽松推动黄金创历史高点后高位震荡。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2020-01", 12),
    monthlyReturns: {
      GOLD: [0, -0.01, -0.02, 0.05, 0.03, 0.04, 0.06, 0.04, -0.02, 0.0, -0.04, 0.05],
    },
  },
  {
    id: "HK-2008-crisis",
    label: "港股 2008 金融危机",
    market: "HK",
    start: "2008-01",
    end: "2008-12",
    description: "全球系统系危机下恒生指数全年深度下跌，10 月雷曼破产前后见最深回撤。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2008-01", 12),
    monthlyReturns: {
      HSI: [0, -0.15, -0.05, 0.09, 0.12, 0.04, -0.08, 0.02, -0.09, -0.16, -0.15, -0.09],
    },
  },
  {
    id: "HK-2018-trade-bear",
    label: "港股 2018 贸易摩擦熊",
    market: "HK",
    start: "2018-01",
    end: "2018-12",
    description: "年初见顶后贸易摩擦与加息夹击，恒生指数全年单边下行。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2018-01", 12),
    monthlyReturns: {
      HSI: [0, 0.04, -0.04, 0.01, 0.02, -0.01, -0.05, 0.02, -0.03, -0.06, -0.07, 0.02],
    },
  },
  {
    id: "HK-2021-22-tech-crackdown",
    label: "港股 2021-22 科技监管+加息",
    market: "HK",
    start: "2021-02",
    end: "2022-03",
    description: "2021 互联网反垄断与教育双减重锤恒生科技，2022 加息续跌；恒生科技回撤远深于恒指。",
    disclaimer: DISCLAIMER,
    dates: monthlyDates("2021-02", 12),
    monthlyReturns: {
      HSI: [0, -0.02, -0.01, 0.01, 0.02, -0.05, -0.07, -0.03, 0.01, -0.03, -0.04, -0.02],
      HSTECH: [0, -0.05, -0.02, 0.02, -0.03, -0.10, -0.12, -0.05, 0.02, -0.06, -0.08, -0.04],
    },
  },
];

export function getCycle(id: string): HistoricalCycle | undefined {
  return HISTORICAL_CYCLES.find((c) => c.id === id);
}

/** 周期第 k 期累计净值（基准 1.0）；未登记的 IndexId 返回 undefined。 */
export function navOfCycle(cycle: HistoricalCycle, indexId: IndexId, period: number): number | undefined {
  const rets = cycle.monthlyReturns[indexId];
  if (!rets) return undefined;
  let nav = 1;
  for (let k = 1; k <= period && k < rets.length; k++) {
    nav *= 1 + rets[k];
  }
  return Math.round(nav * 10000) / 10000;
}

// 中文指数名 → 英文 IndexId 对照：让真实采集的基金（中文标签如"纳斯达克100指数"）
// 能对应到历史周期的英文码曲线（CSI300/SP500 等），压力测试才在真实数据下生效。
const INDEX_ALIASES: Array<[RegExp, IndexId]> = [
  [/沪深\s*300|CSI\s*300/i, "CSI300"],
  [/上证|沪综|SSE/i, "SSE"],
  [/创业板|ChiNext/i, "ChiNext"],
  [/科创\s*50|STAR\s*50/i, "STAR50"],
  [/恒生\s*科技|HSTECH|HANG\s*SENG\s*TECH/i, "HSTECH"],
  [/恒生(?:指)?|HSI|Hang\s*Seng\s*Index/i, "HSI"],
  [/标普\s*500|S&P\s*500|SP\s*500/i, "SP500"],
  [/纳斯达克\s*100|NASDAQ\s*100/i, "NASDAQ100"],
  [/黄金|GOLD/i, "GOLD"],
];

/** 把任意指数文本（中文/英文/带"指数"后缀）归一化到历史周期 IndexId；无法识别返回 undefined。 */
export function normalizeIndexId(text: string): IndexId | undefined {
  if (!text) return undefined;
  for (const [re, id] of INDEX_ALIASES) {
    if (re.test(text)) return id;
  }
  return undefined;
}

/** 周期长度（期数）。 */
export function cycleLength(cycle: HistoricalCycle): number {
  const anyKey = Object.keys(cycle.monthlyReturns)[0] as IndexId | undefined;
  if (!anyKey) return cycle.dates.length;
  return cycle.monthlyReturns[anyKey]?.length ?? cycle.dates.length;
}