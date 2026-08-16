import { INVESTMENT_PROTOCOL_VERSION } from "../domain";
import type {
  AssetMetadata,
  DataCoverage,
  DailyPnL,
  HoldingSnapshot,
  InvestmentDataset,
  Transaction,
} from "../domain";

export const EASTMONEY_SOURCE_CAPTURE_PROTOCOL = "eastmoney-source-capture/1.0" as const;

type SourceRecord = Record<string, unknown>;

export interface EastmoneySourceCapture {
  protocol: typeof EASTMONEY_SOURCE_CAPTURE_PROTOCOL;
  source: string;
  capturedAt: string;
  account?: SourceRecord;
  holdings: SourceRecord[];
  fundDetails: SourceRecord[];
  publicFunds: SourceRecord[];
  transactionRanges: SourceRecord[];
  coverage?: SourceRecord[];
  warnings?: string[];
  metrics?: SourceRecord;
}

function recordOf(value: unknown): SourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as SourceRecord : {};
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberOf(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value ?? "").replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const parsed = numberOf(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function textOf(value: unknown): string {
  return String(value ?? "").trim();
}

function dateOf(value: unknown): string {
  const text = textOf(value);
  const match = text.match(/(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
}

function codeOf(value: unknown): string {
  const match = textOf(value).match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

function uniqueText(values: unknown[]): string[] {
  return [...new Set(values.map(textOf).filter(Boolean))];
}

function detailMap(capture: EastmoneySourceCapture): Map<string, SourceRecord> {
  return new Map(capture.fundDetails
    .map((detail) => [codeOf(detail.fundCode), detail] as const)
    .filter(([code]) => Boolean(code)));
}

function publicMap(capture: EastmoneySourceCapture): Map<string, SourceRecord> {
  return new Map(capture.publicFunds
    .map((detail) => [codeOf(detail.fundCode), detail] as const)
    .filter(([code]) => Boolean(code)));
}

interface SourceTable {
  key: string;
  headers: string[];
  rows: string[][];
}

function tablesOf(detail: SourceRecord, responseKind: string): SourceTable[] {
  const responses = recordOf(detail.responses);
  const response = recordOf(responses[responseKind]);
  return arrayOf(response.tables).map((table) => {
    const item = recordOf(table);
    return {
      key: textOf(item.key),
      headers: arrayOf(item.headers).map(textOf),
      rows: arrayOf(item.rows).map((row) => arrayOf(row).map(textOf)),
    };
  });
}

function tableMatching(detail: SourceRecord, responseKind: string, pattern: RegExp): SourceTable | undefined {
  return tablesOf(detail, responseKind).find((table) => pattern.test(table.key));
}

function hasDetailResponse(detail: SourceRecord | undefined, responseKind: string): boolean {
  if (!detail) return false;
  return Object.keys(recordOf(recordOf(detail.responses)[responseKind])).length > 0;
}

function detailFullyObserved(detail: SourceRecord | undefined): boolean {
  return Boolean(
    detail
    && !arrayOf(detail.warnings).length
    && ["fene", "yingkui", "dingtou"].every((kind) => hasDetailResponse(detail, kind)),
  );
}

function publicDetailFullyObserved(detail: SourceRecord | undefined): boolean {
  return Boolean(
    detail
    && !arrayOf(detail.warnings).length
    && (Object.keys(fieldsOf(detail)).length || Object.keys(recordOf(detail.sections)).length),
  );
}

function shareFacts(detail: SourceRecord | undefined): { availableShares?: number; shares?: number; marketValue?: number } {
  if (!detail) return {};
  const table = tableMatching(detail, "fene", /fene/i) ?? tablesOf(detail, "fene")[0];
  const values = table?.rows[0] ?? [];
  return {
    availableShares: optionalNumber(values[1]),
    shares: optionalNumber(values[2]),
    marketValue: optionalNumber(values[3]),
  };
}

function mapHolding(item: SourceRecord, detail: SourceRecord | undefined, totalAsset: number): HoldingSnapshot | null {
  const assetId = codeOf(item.fundCode ?? item.code);
  if (!assetId) return null;
  const share = shareFacts(detail);
  const marketValue = optionalNumber(item.assetValue ?? item.amount) ?? share.marketValue ?? 0;
  const pnl = optionalNumber(item.profitValue ?? item.profit);
  const pnlRate = optionalNumber(item.profitPercent ?? item.profitRate);
  const nav = optionalNumber(item.nav);
  return {
    assetId,
    name: textOf(item.fundName ?? item.name) || undefined,
    marketValue,
    ...(pnl === undefined ? {} : { pnl }),
    ...(pnlRate === undefined ? {} : { pnlRate: pnlRate / 100 }),
    ...(totalAsset > 0 ? { weight: marketValue / totalAsset } : {}),
    ...(share.shares === undefined ? {} : { shares: share.shares }),
    ...(share.availableShares === undefined ? {} : { availableShares: share.availableShares }),
    ...(nav === undefined ? {} : { nav }),
    ...(dateOf(item.navdate ?? item.navDate) ? { navDate: dateOf(item.navdate ?? item.navDate) } : {}),
  };
}

function transactionType(value: unknown): Transaction["type"] {
  const text = textOf(value);
  if (/卖出|赎回/.test(text)) return "SELL";
  if (/分红|红利/.test(text)) return "DIVIDEND";
  if (/买入|申购|定投/.test(text)) return "BUY";
  return "OTHER";
}

function transactionStatus(value: unknown): Transaction["status"] {
  const text = textOf(value).toLowerCase();
  if (!text) return "unknown";
  if (/撤销|取消|cancel/.test(text)) return "cancelled";
  if (/失败|fail|拒绝/.test(text)) return "failed";
  if (/部分|partial/.test(text)) return "partially_confirmed";
  if (/处理中|待确认|pending|申请/.test(text)) return "requested";
  if (/成功|已确认|confirm|完成/.test(text)) return "confirmed";
  return "unknown";
}

function transactionSourceType(item: SourceRecord): Transaction["sourceType"] {
  return /银行卡定投|银行定投|自动定投/.test(JSON.stringify(item)) ? "bank_auto_invest" : "unknown";
}

function transactionId(item: SourceRecord, index: number, occurredAt: string, assetId: string, type: string, amount: number): string {
  const stable = textOf(item.sourceTransactionId ?? item.transactionId ?? item.id);
  return stable ? `eastmoney-tx:${stable}` : `eastmoney-tx:${occurredAt.slice(0, 10)}:${assetId}:${type}:${amount}:${index}`;
}

function transactionRecords(capture: EastmoneySourceCapture): SourceRecord[] {
  const seen = new Set<string>();
  const records: SourceRecord[] = [];
  for (const range of capture.transactionRanges) {
    for (const page of arrayOf(range.pages)) {
      for (const item of arrayOf(recordOf(page).records)) {
        const record = recordOf(item);
        const stableId = textOf(record.sourceTransactionId ?? record.transactionId ?? record.id);
        const fingerprintParts = [record.strikeStartDate, record.productCode, record.businessTypeText1, record.applyCount, record.confirmCount, record.appStateText]
          .map(textOf);
        const stable = stableId || (fingerprintParts.some(Boolean) ? fingerprintParts.join("|") : "");
        if (stable && seen.has(stable)) continue;
        if (stable) seen.add(stable);
        records.push(record);
      }
    }
  }
  return records;
}

function mapTransaction(item: SourceRecord, index: number): Transaction | null {
  const assetId = codeOf(item.productCode ?? item.fundCode);
  const occurredAt = dateOf(item.strikeStartDate ?? item.date);
  if (!assetId || !occurredAt) return null;
  const type = transactionType(item.businessTypeText1 ?? item.type);
  const amount = numberOf(item.applyCount ?? item.amount);
  const status = transactionStatus(item.appStateText ?? item.status);
  const id = transactionId(item, index, occurredAt, assetId, type, amount);
  const stable = textOf(item.sourceTransactionId ?? item.transactionId ?? item.id);
  const confirmedAmount = optionalNumber(item.confirmCount ?? item.confirmedAmount);
  return {
    id,
    ...(stable ? { sourceTransactionId: stable } : {}),
    occurredAt,
    assetId,
    type,
    amount,
    amountUnit: textOf(item.applyCountUnit ?? item.amountUnit) || "CNY",
    ...(confirmedAmount === undefined ? {} : { confirmedAmount }),
    status,
    sourceType: transactionSourceType(item),
  };
}

function rowValue(table: SourceTable, row: string[], patterns: RegExp[]): string {
  const index = table.headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
  return index >= 0 ? row[index] : "";
}

function dailyPnl(detail: SourceRecord): DailyPnL[] {
  const assetId = codeOf(detail.fundCode);
  const table = tableMatching(detail, "yingkui", /yingkui/i) ?? tablesOf(detail, "yingkui")[0];
  if (!assetId || !table) return [];
  return table.rows.map((row) => {
    const date = dateOf(rowValue(table, row, [/日期|时间|净值日/i]));
    const pnlText = rowValue(table, row, [/盈亏|收益额|收益金额|损益/i]);
    if (!date || pnlText === "") return null;
    const dailyReturnText = rowValue(table, row, [/收益率|回报率/i]);
    return {
      assetId,
      date,
      pnl: numberOf(pnlText),
      ...(dailyReturnText === "" ? {} : { dailyReturn: numberOf(dailyReturnText) / 100 }),
    };
  }).filter((item): item is DailyPnL => Boolean(item));
}

function fieldsOf(detail: SourceRecord): SourceRecord {
  return recordOf(detail.fields);
}

function sourceIndexes(detail: SourceRecord): string[] {
  const tracked = textOf(detail.trackedIndexText ?? fieldsOf(detail)["跟踪标的"]);
  return tracked && !/无跟踪标的|暂无|不适用/.test(tracked) ? [tracked] : [];
}

function classifiedIndexes(detail: SourceRecord): string[] {
  // 优先用真实跟踪标的（指数基金精确）；主动基金无跟踪标的时才退回 benchmark 推断。
  const tracked = sourceIndexes(detail);
  if (tracked.length) return tracked;
  const benchmark = textOf(detail.benchmark ?? fieldsOf(detail)["业绩比较基准"]);
  const items = benchmark.split(/[+，,；;]/).map((component) => {
    const normalized = component
      .replace(/^.*?汇率调整的/, "")
      .replace(/收益率.*$/, "")
      .replace(/\*.*$/, "")
      .replace(/^人民币计价的/, "")
      .trim();
    const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*[×x*]/);
    const weight = weightMatch ? Number(weightMatch[1]) : 0;
    const cleaned = normalized.replace(/^\d+(?:\.\d+)?%?\s*[×x*]\s*/, "").trim();
    const match = cleaned.match(/([^*]{2,50}?指数)$/);
    return { weight, name: match ? match[1].trim() : "" };
  }).filter((it) => it.name);
  if (!items.length) return [];
  // 取基准里权重最大的成分作为主风格代表（并列最大者都取），避免把 benchmark 全部复合成分
  // （如「45%×沪深300 + 45%×恒生 + 10%×中证全债」）平铺成多个指数标签污染底层暴露。
  const maxWeight = Math.max(...items.map((it) => it.weight));
  const mains = maxWeight === 0 ? [items[0]] : items.filter((it) => it.weight === maxWeight);
  return uniqueText(mains.map((it) => it.name));
}

/** 地区归类只看基金实际跟踪的标的/基准/名称/类型，不看投资范围里"可投"品种列举，
 *  以免"美国存托凭证""港股通"等宽泛可投文本污染地区（如恒生科技被误归美国）。 */
function regionSourceText(detail: SourceRecord): string {
  const fields = fieldsOf(detail);
  return [
    detail.trackedIndexText, detail.benchmark, detail.fundName, detail.fundType,
    fields["跟踪标的"], fields["业绩比较基准"], fields["基金简称"], fields["基金类型"],
  ].map(textOf).filter(Boolean).join(" ");
}

function classifiedRegions(detail: SourceRecord): string[] {
  const text = regionSourceText(detail);
  const regions: string[] = [];
  if (/美国|美股|纳斯达克|标普/.test(text)) regions.push("美国");
  if (/香港|港股|恒生/.test(text)) regions.push("中国香港");
  if (/日本|日经/.test(text)) regions.push("日本");
  if (/越南/.test(text)) regions.push("越南");
  if (/印度/.test(text)) regions.push("印度");
  if (/欧洲|欧元区/.test(text)) regions.push("欧洲");
  if (/中国境内|内地|A股|沪深|中证|上证|深证|创业板|科创/.test(text)) regions.push("中国内地");
  if (!regions.length && /全球|环球|境外|QDII/i.test(text)) regions.push("全球");
  // 商品类资产（黄金/原油等）无地理地区时归"全球"，便于组合页暴露统计。
  if (!regions.length && classifiedAssetClass(detail) === "commodity") regions.push("全球");
  return uniqueText(regions);
}

function classifiedCurrency(detail: SourceRecord): string[] {
  const text = textOf(detail.currency);
  if (/^(?:元|人民币|CNY)$/i.test(text)) return ["CNY"];
  if (/^(?:美元|USD)$/i.test(text)) return ["USD"];
  if (/^(?:港元|港币|HKD)$/i.test(text)) return ["HKD"];
  if (/^(?:欧元|EUR)$/i.test(text)) return ["EUR"];
  return [];
}

function classifiedThemes(detail: SourceRecord): string[] {
  const industries = arrayOf(detail.industries).map(recordOf)
    .map((industry) => ({ name: textOf(industry.HYMC ?? industry.name), weight: numberOf(industry.ZJZBL ?? industry.weightPct) }))
    .filter((industry) => industry.name && industry.weight > 0);
  if (industries.length) {
    const largest = Math.max(...industries.map((industry) => industry.weight));
    return uniqueText(industries.filter((industry) => industry.weight === largest).map((industry) => industry.name));
  }
  // 商品类资产（黄金/原油/贵金属）无行业配置时，按跟踪标的给主题，避免组合页"待识别"。
  if (classifiedAssetClass(detail) === "commodity") {
    const fields = fieldsOf(detail);
    const text = [detail.trackedIndexText, detail.benchmark, detail.fundName, fields["跟踪标的"]]
      .map(textOf).filter(Boolean).join(" ");
    const themes: string[] = [];
    if (/黄金|Au9999|贵金属/.test(text)) themes.push("黄金");
    if (/原油|石油/.test(text)) themes.push("原油");
    if (!themes.length && /商品/.test(text)) themes.push("商品");
    return uniqueText(themes);
  }
  return [];
}

function classifiedAssetClass(detail: SourceRecord): AssetMetadata["assetClass"] {
  const fields = fieldsOf(detail);
  const fundType = textOf(detail.fundType ?? fields["基金类型"]);
  const fundName = textOf(detail.fundName ?? fields["基金简称"]);
  const benchmark = textOf(detail.benchmark ?? fields["业绩比较基准"]);
  const objective = textOf(detail.investmentObjective);

  // 资产类别以“基金类型”字段为准；投资范围中的“货币市场工具”是各债券/固收基金共有表述，不作为货基信号。
  const typeText = [fundType, fundName].join(" ");
  if (/货币型|货币市场基金/.test(typeText)) return "cash";
  if (/债券型|纯债|固收|中短债/.test(typeText)) return "bond";
  if (/黄金|原油|商品.*型|贵金属/.test(typeText)) return "commodity";
  if (/股票型|混合型|指数型|ETF|联接|QDII/.test(typeText)) return "equity";

  // 类型字段缺失时，只从目标/基准做保守判断。
  const intentText = [objective, benchmark].join(" ");
  if (/货币市场基金|货币型基金/.test(intentText)) return "cash";
  if (/债券|纯债|固收/.test(intentText)) return "bond";
  if (/黄金|原油|商品|贵金属/.test(intentText)) return "commodity";
  return "other";
}

function mapAsset(holding: SourceRecord, detail: SourceRecord): AssetMetadata | null {
  const assetId = codeOf(holding.fundCode ?? holding.code);
  if (!assetId) return null;
  const directIndexes = sourceIndexes(detail);
  const indexes = directIndexes.length ? directIndexes : classifiedIndexes(detail);
  const regions = classifiedRegions(detail);
  const currencies = classifiedCurrency(detail);
  const themes = classifiedThemes(detail);
  const assetClass = classifiedAssetClass(detail);
  return {
    assetId,
    name: textOf(holding.fundName ?? holding.name ?? detail.fundName) || undefined,
    assetClass,
    regions,
    indexes,
    currencies,
    themes,
    provenance: {
      assetClass: assetClass === "other" ? "unknown" : "classified",
      regions: regions.length ? "classified" : "unknown",
      indexes: indexes.length ? (directIndexes.length ? "source" : "classified") : "unknown",
      currencies: currencies.length ? "classified" : "unknown",
      themes: themes.length ? "classified" : "unknown",
    },
  };
}

function transactionCoverageComplete(capture: EastmoneySourceCapture): boolean {
  if (!capture.transactionRanges.length) return false;
  return capture.transactionRanges.every((range) => {
    // “历史交易查询（>1年）”为自定义日期范围，简单筛选不适用；采集器明确跳过，不判为部分。
    if (recordOf(range).skipReason === "custom-date-dialog") return true;
    if (arrayOf(range.warnings).length) return false;
    const expected = numberOf(range.expectedPages);
    const totalCount = numberOf(range.totalCount);
    const pages = arrayOf(range.pages).map((page) => numberOf(recordOf(page).pageNum));
    if (expected === 0) return totalCount === 0 && pages.includes(1);
    return expected <= 200 && Array.from({ length: expected }, (_, index) => index + 1).every((page) => pages.includes(page));
  });
}

function rangesFromDates(dates: string[]): Array<{ start: string; end: string }> {
  const sorted = dates.filter(Boolean).sort();
  return sorted.length ? [{ start: sorted[0], end: sorted[sorted.length - 1] }] : [];
}

function coverageEntry(dataset: DataCoverage["dataset"], dates: string[], completeness: DataCoverage["completeness"], capturedAt: string, warningCodes: string[]): DataCoverage {
  return { dataset, knownRanges: rangesFromDates(dates), completeness, lastSyncedAt: capturedAt, warningCodes: [...new Set(warningCodes)] };
}

export function toInvestmentDataset(capture: EastmoneySourceCapture): InvestmentDataset {
  if (capture.protocol !== EASTMONEY_SOURCE_CAPTURE_PROTOCOL) throw new Error(`不支持的来源采集协议：${capture.protocol}`);
  const capturedAt = capture.capturedAt || new Date().toISOString();
  const capturedDate = capturedAt.slice(0, 10);
  const details = detailMap(capture);
  const publicDetails = publicMap(capture);
  const accountSource = recordOf(capture.account);
  const hasAccount = Boolean(capture.account && typeof capture.account === "object" && !Array.isArray(capture.account));
  const assetTotals = arrayOf(accountSource.assetTotal).map(recordOf);
  const fallbackHoldingValue = capture.holdings.reduce((sum, item) => sum + numberOf(item.assetValue ?? item.amount), 0);
  const totalAsset = numberOf(assetTotals[0]?.oldValue ?? accountSource.totalAsset) || fallbackHoldingValue;
  const holdings = capture.holdings
    .map((holding) => mapHolding(holding, details.get(codeOf(holding.fundCode ?? holding.code)), totalAsset))
    .filter((holding): holding is HoldingSnapshot => Boolean(holding));
  const transactions = transactionRecords(capture)
    .map(mapTransaction)
    .filter((transaction): transaction is Transaction => Boolean(transaction));
  const dailyPnlRecords = capture.fundDetails.flatMap(dailyPnl);
  const currentHoldingPnl = holdings.every((holding) => holding.pnl !== undefined)
    ? holdings.reduce((sum, holding) => sum + (holding.pnl || 0), 0)
    : undefined;
  const holdingValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const difference = totalAsset - holdingValue;
  const tolerance = Math.max(0.01, Math.abs(totalAsset) * 0.0001);
  const cash = difference >= -tolerance ? Math.abs(difference) <= tolerance ? 0 : difference : undefined;
  const transactionComplete = transactionCoverageComplete(capture);
  const detailComplete = !holdings.length || holdings.every((holding) => detailFullyObserved(details.get(holding.assetId)));
  const dailyPnlComplete = !holdings.length || holdings.every((holding) => hasDetailResponse(details.get(holding.assetId), "yingkui"));
  const publicComplete = !holdings.length || holdings.every((holding) => publicDetailFullyObserved(publicDetails.get(holding.assetId)));
  const warnings = [...new Set([
    ...(capture.warnings || []).map(() => "eastmoney:source-warning"),
    ...(transactionComplete ? [] : ["eastmoney:transactions-partial"]),
    ...(dailyPnlComplete ? [] : ["eastmoney:daily-pnl-unknown"]),
    ...(detailComplete ? [] : ["eastmoney:fund-detail-partial"]),
    ...(publicComplete ? [] : ["eastmoney:fund-metadata-partial"]),
    ...(currentHoldingPnl === undefined ? ["eastmoney:current-holding-pnl-incomplete"] : []),
    ...(cash === undefined ? ["eastmoney:cash-derivation-invalid"] : []),
  ])];
  const account = hasAccount ? {
    id: `eastmoney-account:${capturedAt}`,
    source: capture.source || "1234567",
    capturedAt,
    totalAsset,
    ...(currentHoldingPnl === undefined ? {} : { currentHoldingPnl }),
    cumulativePnl: numberOf(assetTotals[2]?.oldValue ?? accountSource.totalProfit),
  } : undefined;
  const portfolio = account ? {
    id: `eastmoney-portfolio:${capturedAt}`,
    date: capturedDate,
    totalAsset,
    holdingValue,
    ...(cash === undefined ? {} : { cash }),
    ...(currentHoldingPnl === undefined ? {} : { currentHoldingPnl }),
    holdings,
  } : undefined;
  return {
    version: INVESTMENT_PROTOCOL_VERSION,
    source: capture.source || "1234567",
    capturedAt,
    account,
    portfolio,
    assets: capture.holdings
      .map((holding) => mapAsset(holding, publicDetails.get(codeOf(holding.fundCode ?? holding.code)) || {}))
      .filter((asset): asset is AssetMetadata => Boolean(asset)),
    transactions,
    dailyPnl: dailyPnlRecords,
    coverage: [
      coverageEntry("account", account ? [capturedDate] : [], account ? "complete" : "unknown", capturedAt, []),
      coverageEntry("holdings", hasAccount ? [capturedDate] : [], hasAccount ? "complete" : "unknown", capturedAt, []),
      coverageEntry("transactions", transactions.map((item) => item.occurredAt.slice(0, 10)), transactionComplete ? "complete" : transactions.length ? "partial" : "unknown", capturedAt, transactionComplete ? [] : ["eastmoney:transactions-partial"]),
      coverageEntry("dailyPnl", dailyPnlRecords.map((item) => item.date), dailyPnlComplete ? "complete" : dailyPnlRecords.length ? "partial" : "unknown", capturedAt, dailyPnlComplete ? [] : ["eastmoney:daily-pnl-unknown"]),
      coverageEntry("fundDetail", hasAccount ? [capturedDate] : [], hasAccount ? detailComplete && publicComplete ? "complete" : "partial" : "unknown", capturedAt, detailComplete && publicComplete ? [] : ["eastmoney:fund-metadata-partial"]),
    ],
    warnings,
  };
}
