/**
 * 基金数据标准协议（fund-data.json）
 *
 * 该协议由 Chrome 扩展 (LPTFF Investment Assistant) 从天天基金页面采集后生成，
 * 网页端导入后统一使用此结构。所有字段均为前端本地使用，不上传服务器。
 */

/** 账户总览 */
export interface FundAccount {
  /** 总资产（元） */
  totalAsset: number;
  /** 累计收益（元） */
  totalProfit: number;
  /** 累计收益率（%） */
  profitRate: number;
}

/** 单只基金持仓 */
export interface FundHolding {
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 当前持仓金额（元） */
  amount: number;
  /** 累计收益（元） */
  profit: number;
  /** 累计收益率（%） */
  profitRate: number;
  /** 仓位比例（%） */
  ratio: number;
}

/** 交易流水 */
export interface FundTransaction {
  /** 交易日期 YYYY-MM-DD */
  date: string;
  /** 交易类型：BUY=买入 / SELL=卖出 / DIVIDEND=分红 */
  type: "BUY" | "SELL" | "DIVIDEND";
  /** 基金代码 */
  fundCode: string;
  /** 基金名称 */
  fundName: string;
  /** 交易金额（元） */
  amount: number;
}

/** 标准协议根结构 */
export interface FundData {
  /** 协议版本 */
  version: string;
  /** 数据来源标识（天天基金账号脱敏后的占位） */
  source: string;
  /** 数据更新时间 YYYY-MM-DD */
  updateTime: string;
  /** 账户总览 */
  account: FundAccount;
  /** 持仓列表 */
  holdings: FundHolding[];
  /** 交易流水 */
  transactions: FundTransaction[];
}

/** 校验结果 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** 经过修复/补全后的数据（即使有非阻断性警告也会回填默认值） */
  data: FundData | null;
}

export const FUND_DATA_VERSION = "1.0";

/** 创建一份空数据，用于补全缺失字段 */
export function createEmptyFundData(): FundData {
  return {
    version: FUND_DATA_VERSION,
    source: "",
    updateTime: "",
    account: { totalAsset: 0, totalProfit: 0, profitRate: 0 },
    holdings: [],
    transactions: [],
  };
}

/**
 * 校验并归一化导入的原始 JSON。
 * 不抛异常，所有错误以字符串形式返回，便于 UI 展示。
 */
export function validateFundData(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["数据不是合法的 JSON 对象"], data: null };
  }
  const obj = raw as Record<string, unknown>;
  const data = createEmptyFundData();

  data.version = typeof obj.version === "string" ? obj.version : FUND_DATA_VERSION;
  data.source = typeof obj.source === "string" ? obj.source : "";
  data.updateTime = typeof obj.updateTime === "string" ? obj.updateTime : "";

  // account
  const acc = (obj.account || {}) as Record<string, unknown>;
  data.account = {
    totalAsset: toNumber(acc.totalAsset),
    totalProfit: toNumber(acc.totalProfit),
    profitRate: toNumber(acc.profitRate),
  };

  // holdings
  if (Array.isArray(obj.holdings)) {
    data.holdings = obj.holdings.map((h, i) => {
      const item = (h || {}) as Record<string, unknown>;
      return {
        code: String(item.code ?? ""),
        name: String(item.name ?? `基金${i + 1}`),
        amount: toNumber(item.amount),
        profit: toNumber(item.profit),
        profitRate: toNumber(item.profitRate),
        ratio: toNumber(item.ratio),
      };
    });
  } else {
    errors.push("holdings 字段缺失或不是数组");
  }

  // transactions
  if (Array.isArray(obj.transactions)) {
    data.transactions = obj.transactions.map((t) => {
      const item = (t || {}) as Record<string, unknown>;
      const type = item.type as FundTransaction["type"];
      return {
        date: String(item.date ?? ""),
        type: type === "BUY" || type === "SELL" || type === "DIVIDEND" ? type : "BUY",
        fundCode: String(item.fundCode ?? ""),
        fundName: String(item.fundName ?? ""),
        amount: toNumber(item.amount),
      };
    });
  } else {
    data.transactions = [];
  }

  if (data.holdings.length === 0 && data.account.totalAsset === 0) {
    errors.push("未检测到任何持仓数据");
  }

  return { ok: errors.length === 0, errors, data: errors.length === 0 ? data : data };
}

function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}