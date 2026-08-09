/**
 * 旧版 fund-data.json（协议 v1.1）→ Investment OS Domain（v2.0）迁移适配器。
 *
 * 复用 src/utils/fund/fund-schema 的校验归一化能力，把 flat 的旧数据映射进时序账本模型。
 * 迁移属于 Inference（PRD §6.4/§32）：凡是旧协议无法还原的事实（如真实 DailyPnL 时序、
 * 底层资产元数据、持仓浮盈 vs 累计盈亏的区分）都必须在 warnings 里显式说明，不得伪造。
 */
import type {
  AccountSnapshot,
  AssetMetadata,
  DailyPnL,
  DataCoverage,
  HoldingSnapshot,
  InvestmentDataset,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../domain";
import { INVESTMENT_PROTOCOL_VERSION } from "../domain/types";
import { validateFundData, type FundData, type FundTransaction } from "../../utils/fund/fund-schema";

/** 把旧 FundTransaction.type 映射为 v2 TransactionType。 */
function mapTxType(type: FundTransaction["type"]): TransactionType {
  switch (type) {
    case "BUY":
      return "BUY";
    case "SELL":
      return "SELL";
    case "DIVIDEND":
      return "DIVIDEND";
    default:
      return "OTHER";
  }
}

/** 把旧 status（任意字符串）映射为 v2 TransactionStatus，未知归 UNKNOWN。 */
function mapTxStatus(status?: string): TransactionStatus {
  if (!status) return "UNKNOWN";
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("成功") || s === "已确认") return "CONFIRMED";
  if (s.includes("pending") || s.includes("处理") || s === "未确认") return "PENDING";
  if (s.includes("fail") || s.includes("失败")) return "FAILED";
  return "UNKNOWN";
}

/** 旧数据无法区分单基金底层结构，先用占位 AssetMetadata 收口，Exposure 待补充。 */
function deriveAssetMetadata(holdings: FundData["holdings"]): AssetMetadata[] {
  return holdings.map((h) => ({
    assetId: h.code,
    name: h.name,
    assetClass: "equity",
    regions: [],
    indexes: [],
    currencies: [],
    themes: [],
    provenance: {
      assetClass: "unknown",
      regions: "unknown",
      indexes: "unknown",
      currencies: "unknown",
      themes: "unknown",
    },
  }));
}

/**
 * 把已校验的旧 FundData 迁移为 v2.0 InvestmentDataset。
 * capturedAt 取旧 updateTime；累计收益与逐只持仓盈亏保持为互不替代的独立事实。
 */
export function migrateLegacyFundData(raw: unknown): InvestmentDataset {
  const result = validateFundData(raw);
  if (!result.data) {
    throw new Error(`legacy migration: 旧 fund-data 校验失败：${result.errors.join("；")}`);
  }
  const fund = result.data;
  const capturedAt = fund.updateTime || new Date().toISOString().slice(0, 10);

  const account: AccountSnapshot = {
    id: `legacy-account:${fund.source || "unknown"}:${capturedAt}`,
    source: fund.source || "legacy",
    capturedAt,
    totalAsset: fund.account.totalAsset,
    cumulativePnl: fund.account.totalProfit,
  };

  const holdings: HoldingSnapshot[] = fund.holdings.map((h) => ({
    assetId: h.code,
    name: h.name,
    marketValue: h.amount,
    pnl: h.profit,
    weight: typeof h.ratio === "number" ? h.ratio / 100 : undefined,
    shares: h.shares,
    availableShares: h.availableShares,
    nav: h.nav,
    navDate: h.navDate,
  }));

  const holdingValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  const currentHoldingPnl = holdings.length && holdings.every((holding) => holding.pnl !== undefined)
    ? holdings.reduce((sum, holding) => sum + (holding.pnl ?? 0), 0)
    : undefined;
  const cashDifference = fund.account.totalAsset - holdingValue;
  const cashTolerance = Math.max(0.01, Math.abs(fund.account.totalAsset) * 0.0001);
  const cash = cashDifference >= -cashTolerance
    ? Math.abs(cashDifference) <= cashTolerance ? 0 : cashDifference
    : undefined;
  account.currentHoldingPnl = currentHoldingPnl;

  const transactions: Transaction[] = fund.transactions.map((tx, idx) => ({
    id: `legacy-tx:${tx.fundCode}:${tx.date}:${tx.type}:${tx.amount}:${idx}`,
    occurredAt: tx.date,
    assetId: tx.fundCode,
    type: mapTxType(tx.type),
    amount: tx.amount,
    amountUnit: tx.amountUnit || "CNY",
    confirmedAmount: tx.confirmedAmount,
    status: mapTxStatus(tx.status),
    sourceType: "manual_import",
  }));

  const coverage: DataCoverage[] = [
    {
      dataset: "account",
      knownRanges: [{ start: capturedAt, end: capturedAt }],
      completeness: "complete",
      lastSyncedAt: capturedAt,
      warningCodes: [],
    },
    {
      dataset: "holdings",
      knownRanges: [{ start: capturedAt, end: capturedAt }],
      completeness: "complete",
      lastSyncedAt: capturedAt,
      warningCodes: [],
    },
    {
      dataset: "transactions",
      knownRanges: deriveTransactionRange(fund.transactions),
      completeness: fund.collectionWarnings?.length ? "partial" : "complete",
      lastSyncedAt: capturedAt,
      warningCodes: (fund.collectionWarnings ?? []).map((c) => `legacy:${c}`),
    },
    {
      dataset: "dailyPnl",
      knownRanges: [],
      completeness: "unknown",
      lastSyncedAt: capturedAt,
      warningCodes: ["legacy:no-daily-pnl-series"],
    },
    {
      dataset: "fundDetail",
      knownRanges: [],
      completeness: "unknown",
      lastSyncedAt: capturedAt,
      warningCodes: ["legacy:no-fund-detail"],
    },
  ];

  const dailyPnl: DailyPnL[] = [];

  const warnings: string[] = [
    "legacy:migrated-from-v1.1",
    ...(currentHoldingPnl === undefined ? ["legacy:current-holding-pnl-incomplete"] : []),
    ...(cash === undefined ? ["legacy:cash-derivation-invalid"] : []),
    "legacy:asset-metadata-pending-exposure-engine",
  ];
  if (fund.collectionWarnings?.length) {
    warnings.push(`legacy:collection-warnings-${fund.collectionWarnings.length}`);
  }

  return {
    version: INVESTMENT_PROTOCOL_VERSION,
    source: fund.source || "legacy",
    capturedAt,
    account,
    portfolio: {
      id: `legacy-portfolio:${capturedAt}`,
      date: capturedAt,
      totalAsset: fund.account.totalAsset,
      holdingValue,
      cash,
      currentHoldingPnl,
      holdings,
    },
    assets: deriveAssetMetadata(fund.holdings),
    transactions,
    dailyPnl,
    coverage,
    warnings,
  };
}

function deriveTransactionRange(txs: FundTransaction[]): { start: string; end: string }[] {
  if (!txs.length) return [];
  const dates = txs.map((t) => t.date).filter(Boolean).sort();
  if (!dates.length) return [];
  return [{ start: dates[0], end: dates[dates.length - 1] }];
}
