/**
 * InvestmentSourceAdapter（PRD §36）
 *
 * 把来源数据转换为标准 Domain 事实的抽象。Core 只依赖这个接口；真实环境由
 * EastmoneyInvestmentSourceAdapter 实现（Agent B 领地），Agent A 只用 Mock。
 *
 * 接口必须可被 Mock Adapter 完全替换（shared/00 不变量 1）。部分成功 / 字段缺失
 * 必须通过 Coverage + warnings 显式表达，而不是抛出或静默补全。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  DailyPnL,
  DataCoverage,
  DateRange,
  HoldingSnapshot,
  Transaction,
} from "../domain";

/** 交易批次：Adapter 返回交易时携带范围与是否分页完成。 */
export interface TransactionBatch {
  transactions: Transaction[];
  range?: DateRange;
  /** false 表示还有未加载分页或历史范围，调用方不得标记 complete。 */
  pagingComplete: boolean;
}

export interface InvestmentSourceAdapter {
  /** 标识来源（脱敏）。 */
  readonly source: string;

  getAccount(): Promise<AccountSnapshot>;
  getHoldings(): Promise<HoldingSnapshot[]>;
  /** 来源可提供的资产元数据（可能为空，由 Core 用户配置补充）。 */
  getAssets(): Promise<AssetMetadata[]>;
  getTransactions(range?: DateRange): Promise<TransactionBatch>;
  getDailyPnL(assetId: string): Promise<DailyPnL[]>;
  getCoverage(): Promise<DataCoverage[]>;
}
