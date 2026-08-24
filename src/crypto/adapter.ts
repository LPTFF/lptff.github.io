import { BINANCE_SOURCE_CAPTURE_PROTOCOL, type BinanceSourceCapture, type ContractReviewDataset } from "./domain";

const ENTITY_KEYS = ["positions", "equity", "orders", "trades", "funding", "fundingHistory", "symbolConfigs", "orderHistory", "tradeHistory", "positionHistory", "transactionHistory"] as const;

export function toContractReviewDataset(input: unknown): ContractReviewDataset {
  if (!input || typeof input !== "object") throw new Error("币安来源包不是有效对象");
  const capture = input as Partial<BinanceSourceCapture>;
  if (capture.protocol !== BINANCE_SOURCE_CAPTURE_PROTOCOL) throw new Error(`不支持的来源协议：${String(capture.protocol || "缺失")}`);
  if (capture.source !== "binance") throw new Error("来源包不是币安合约数据");
  if (!capture.capturedAt || Number.isNaN(Date.parse(capture.capturedAt))) throw new Error("来源包缺少有效采集时间");
  const entities = capture.entities && typeof capture.entities === "object" ? capture.entities : {} as BinanceSourceCapture["entities"];
  const normalized = Object.fromEntries(ENTITY_KEYS.map((key) => [key, Array.isArray(entities[key]) ? entities[key] : []])) as Pick<ContractReviewDataset, typeof ENTITY_KEYS[number]>;
  const rawCapture = { ...capture, entities: normalized, coverage: Array.isArray(capture.coverage) ? capture.coverage : [], warnings: Array.isArray(capture.warnings) ? capture.warnings.map(String) : [] } as BinanceSourceCapture;
  return {
    id: `binance:${capture.capturedAt}`,
    protocol: BINANCE_SOURCE_CAPTURE_PROTOCOL,
    capturedAt: capture.capturedAt,
    pageUrl: capture.pageUrl,
    historyRange: capture.historyRange,
    ...normalized,
    coverage: rawCapture.coverage,
    warnings: rawCapture.warnings,
    rawCapture,
  };
}
