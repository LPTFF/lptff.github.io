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

export type ContractRiskPriority = "critical" | "high" | "medium" | "info";

export interface ContractRiskRules {
  maxLeverage: number;
  maxRiskPerTradePct: number;
  maxMarginPerTradePct: number;
  maxSymbolExposurePct: number;
  maxConcurrentPositions: number;
  maxDailyLossPct: number;
  maxConsecutiveLosses: number;
  cooldownHoursAfterLossStreak: number;
  maxTradesPerDay: number;
  minRewardRiskRatio: number;
  requireStopLoss: boolean;
}

export interface ContractRiskFinding {
  id: string;
  priority: ContractRiskPriority;
  category: "data" | "leverage" | "stop" | "position" | "concentration" | "loss_streak" | "direction" | "frequency";
  title: string;
  summary: string;
  evidence: string[];
  nextRule: string;
  affectedSymbols: string[];
}

export interface ContractReviewMetrics {
  closedPositions: number;
  winRatePct: number;
  netPnl: number;
  largestLoss: number;
  currentLossStreak: number;
  maxLossStreak: number;
  maxLeverage: number;
  protectedOpenPositions: number;
  unprotectedOpenPositions: number;
  busiestTradingDay: number;
  dominantSymbol?: string;
  dominantSymbolPct: number;
}

export interface ContractPerformanceSlice {
  key: string;
  label: string;
  trades: number;
  winRatePct: number;
  netPnl: number;
  profitFactor?: number;
  averagePnl: number;
}

export interface ContractPerformanceAnalysis {
  grossProfit: number;
  grossLoss: number;
  profitFactor?: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  payoffRatio?: number;
  totalTradingFees: number;
  totalFunding: number;
  feeDragPct?: number;
  maximumDrawdown: number;
  maximumDrawdownPct?: number;
  worstFiveAverageLoss: number;
  averageHoldingMinutes: number;
  winningHoldingMinutes: number;
  losingHoldingMinutes: number;
  stopProtectedClosedPct?: number;
  profitableDaysPct: number;
  bestDayPnl: number;
  worstDayPnl: number;
  bySymbol: ContractPerformanceSlice[];
  byDirection: ContractPerformanceSlice[];
  byLeverage: ContractPerformanceSlice[];
  byHoldingPeriod: ContractPerformanceSlice[];
  byTradingSession: ContractPerformanceSlice[];
  byWeekday: ContractPerformanceSlice[];
  equityCurve: Array<{ time: number; cumulativePnl: number; drawdown: number }>;
}

export interface ContractReviewSnapshot {
  id: string;
  capturedAt: string;
  rules: ContractRiskRules;
  findings: ContractRiskFinding[];
  metrics: ContractReviewMetrics;
  analysis: ContractPerformanceAnalysis;
  checkedAt: string;
}

export interface TradePreflightInput {
  symbol: string;
  direction: "LONG" | "SHORT";
  leverage: number;
  accountEquity: number;
  entryPrice: number;
  stopPrice?: number;
  takeProfitPrice?: number;
  quantity: number;
  currentSymbolExposurePct: number;
  currentOpenPositions: number;
  consecutiveLosses: number;
  thesis: string;
}

export interface TradePreflightCheck {
  id: string;
  severity: "block" | "warn" | "pass";
  label: string;
  detail: string;
}

export interface TradePreflightResult {
  verdict: "blocked" | "review" | "pass";
  checks: TradePreflightCheck[];
  notional: number;
  initialMargin: number;
  riskAmount?: number;
  riskPct?: number;
  rewardRiskRatio?: number;
  checkedAt: string;
}

export interface ContractReviewConclusion {
  id: string;
  createdAt: string;
  snapshotId: string;
  findingIds: string[];
  summary: string;
  reusableRule: string;
}

export interface ContractReviewManagementState {
  rules: ContractRiskRules;
  acknowledgedFindingIds: string[];
  conclusions: ContractReviewConclusion[];
  preflightHistory: Array<{
    id: string;
    input: TradePreflightInput;
    result: TradePreflightResult;
  }>;
}
