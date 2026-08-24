export const BINANCE_SOURCE_CAPTURE_PROTOCOL = "binance-source-capture/1.0";

export interface SourceCoverage {
  dataset: string;
  completeness: "complete" | "partial" | "unknown" | "failed";
  recordCount?: number;
  completeRecordCount?: number;
}

export interface BinanceSourceCapture {
  protocol: typeof BINANCE_SOURCE_CAPTURE_PROTOCOL;
  source: "binance";
  capturedAt: string;
  pageUrl?: string;
  coverage: SourceCoverage[];
  warnings: string[];
  historyRange?: {
    startAt: number;
    endAt: number;
    firstTradeTime?: number;
    windowDays: number;
    windowCount: number;
  };
  entities: {
    positions: Record<string, unknown>[];
    equity: Record<string, unknown>[];
    orders: Record<string, unknown>[];
    trades: Record<string, unknown>[];
    funding: Record<string, unknown>[];
    fundingHistory: Record<string, unknown>[];
    symbolConfigs: Record<string, unknown>[];
    orderHistory: Record<string, unknown>[];
    tradeHistory: Record<string, unknown>[];
    positionHistory: Record<string, unknown>[];
    transactionHistory: Record<string, unknown>[];
  };
}

export interface ContractReviewDataset {
  id: string;
  protocol: typeof BINANCE_SOURCE_CAPTURE_PROTOCOL;
  capturedAt: string;
  pageUrl?: string;
  positions: Record<string, unknown>[];
  equity: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  trades: Record<string, unknown>[];
  funding: Record<string, unknown>[];
  fundingHistory: Record<string, unknown>[];
  symbolConfigs: Record<string, unknown>[];
  orderHistory: Record<string, unknown>[];
  tradeHistory: Record<string, unknown>[];
  positionHistory: Record<string, unknown>[];
  transactionHistory: Record<string, unknown>[];
  historyRange?: BinanceSourceCapture["historyRange"];
  coverage: SourceCoverage[];
  warnings: string[];
  rawCapture: BinanceSourceCapture;
}
