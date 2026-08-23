import { INVESTMENT_PROTOCOL_VERSION } from "../domain";
import type {
  AssetMetadata,
  DataCoverage,
  DailyPnL,
  HoldingSnapshot,
  InvestmentDataset,
  Transaction,
} from "../domain";
import { explicitThemesFromSourceText } from "../metadata/themes";

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
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const match = String(value).replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
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
  const marketValue = optionalNumber(item.assetValue ?? item.amount) ?? share.marketValue;
  if (marketValue === undefined) return null;
  const pnl = optionalNumber(item.profitValue ?? item.profit);
  const pnlRate = optionalNumber(item.profitPercent ?? item.profitRate);
  const nav = optionalNumber(item.nav);
  return {
    assetId,
    name: textOf(item.fundName ?? item.name) || undefined,
    marketValue,
    ...(pnl === undefined ? {} : {
      pnl,
      pnlBasis: "source_profit_value_semantics_unverified" as const,
      pnlSourceField: item.profitValue !== undefined ? "profitValue" : "profit",
    }),
    ...(pnlRate === undefined ? {} : {
      pnlRate: pnlRate / 100,
      pnlRateBasis: "source_reported" as const,
      pnlRateSourceField: "profitPercent",
    }),
    ...(totalAsset > 0 ? { weight: marketValue / totalAsset } : {}),
    ...(share.shares === undefined ? {} : { shares: share.shares }),
    ...(share.availableShares === undefined ? {} : { availableShares: share.availableShares }),
    ...(nav === undefined ? {} : { nav }),
    ...(dateOf(item.navdate ?? item.navDate) ? { navDate: dateOf(item.navdate ?? item.navDate) } : {}),
  };
}

function transactionType(value: unknown): Transaction["type"] {
  // 来源文本可能带排版空格（如“转入投 资账户”），匹配前先压缩空白。
  const text = textOf(value).replace(/\s+/g, "");
  if (/转入投资账户|转出投资账户/.test(text)) return "TRANSFER";
  if (/卖出|赎回/.test(text)) return "SELL";
  if (/分红|红利/.test(text)) return "DIVIDEND";
  if (/买入|申购|定投/.test(text)) return "BUY";
  return "OTHER";
}

function transactionStatus(value: unknown): Transaction["status"] {
  // 来源文本可能带排版空格；「已撤单」不含「撤销」二字，需单列。
  const text = textOf(value).toLowerCase().replace(/\s+/g, "");
  if (!text) return "unknown";
  if (/撤销|撤单|取消|cancel/.test(text)) return "cancelled";
  if (/失败|fail|拒绝/.test(text)) return "failed";
  if (/部分|partial/.test(text)) return "partially_confirmed";
  // 「已受理(支付完成)」只表示申购申请的支付环节完成，尚不是基金份额确认。
  // 必须先于末尾的「完成」匹配，否则会被误判为 confirmed。
  if (/已受理|处理中|待确认|pending|申请/.test(text)) return "requested";
  if (/成功|已确认|confirm|完成/.test(text)) return "confirmed";
  return "unknown";
}

function transactionExecutionMethod(item: SourceRecord): Transaction["executionMethod"] {
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
  const amount = optionalNumber(item.applyCount ?? item.amount);
  if (amount === undefined) return null;
  const status = transactionStatus(item.appStateText ?? item.status);
  // 来源原文透传（业务类型/状态）：逐笔核对以原文为准，系统翻译仅作展示色与聚合口径。
  const businessTypeText = textOf(item.businessTypeText1) || undefined;
  const statusText = textOf(item.appStateText) || undefined;
  const id = transactionId(item, index, occurredAt, assetId, type, amount);
  const stable = textOf(item.sourceTransactionId ?? item.transactionId ?? item.id);
  const confirmedAmount = optionalNumber(item.confirmCount ?? item.confirmedAmount);
  const confirmedAmountUnit = confirmedAmount === undefined
    ? undefined
    : textOf(item.confirmCountUnit ?? item.confirmedAmountUnit) || undefined;
  return {
    id,
    ...(stable ? { sourceTransactionId: stable } : {}),
    occurredAt,
    assetId,
    type,
    amount,
    amountUnit: textOf(item.applyCountUnit ?? item.amountUnit) || "UNKNOWN",
    ...(confirmedAmount === undefined ? {} : { confirmedAmount }),
    ...(confirmedAmountUnit ? { confirmedAmountUnit } : {}),
    status,
    ...(businessTypeText ? { businessTypeText } : {}),
    ...(statusText ? { statusText } : {}),
    // sourceType 是旧版混合字段：普通交易继续保持 unknown，避免把“插件采集”误当作“执行方式”。
    sourceType: transactionExecutionMethod(item) === "bank_auto_invest" ? "bank_auto_invest" : "unknown",
    captureMethod: "extension_capture",
    executionMethod: transactionExecutionMethod(item),
    ...(type === "OTHER" ? { classificationWarning: "unmapped_transaction_type" as const } : {}),
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
    const pnl = optionalNumber(pnlText);
    if (pnl === undefined) return null;
    const dailyReturn = dailyReturnText === "" ? undefined : optionalNumber(dailyReturnText);
    return {
      assetId,
      date,
      pnl,
      ...(dailyReturn === undefined ? {} : { dailyReturn: dailyReturn / 100 }),
    };
  }).filter((item): item is DailyPnL => Boolean(item));
}

function fieldsOf(detail: SourceRecord): SourceRecord {
  return recordOf(detail.fields);
}

function sectionsOf(detail: SourceRecord): SourceRecord {
  return recordOf(detail.sections);
}

function sourceIndexes(detail: SourceRecord): string[] {
  const tracked = textOf(detail.trackedIndexText ?? fieldsOf(detail)["跟踪标的"]);
  return tracked && !/无跟踪标的|暂无|不适用/.test(tracked) ? [tracked] : [];
}

function benchmarkIndexes(detail: SourceRecord): string[] {
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

function indexesOf(detail: SourceRecord): {
  values: string[];
  quality: "source" | "extracted" | "unknown";
  sourceField?: "tracked-index" | "benchmark";
} {
  const tracked = sourceIndexes(detail);
  if (tracked.length) return { values: tracked, quality: "source", sourceField: "tracked-index" };
  const benchmark = benchmarkIndexes(detail);
  return benchmark.length
    ? { values: benchmark, quality: "extracted", sourceField: "benchmark" }
    : { values: [], quality: "unknown" };
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

/**
 * 只从档案页明确描述“主要投资市场”的句子提取地区。
 * 不扫描宽泛的投资范围品种列表，避免把“可投资美国存托凭证”等许可范围误当实际地区暴露。
 */
function sourceRegions(detail: SourceRecord): string[] {
  const collected = arrayOf(detail.marketEvidence)
    .map(recordOf)
    .map((item) => textOf(item.region))
    .filter(Boolean);
  if (collected.length) return uniqueText(collected);
  const sections = sectionsOf(detail);
  const text = [
    detail.investmentObjective,
    sections["投资目标"],
    sections["投资范围"],
    sections["风险收益特征"],
  ].map(textOf).filter(Boolean).join(" ");
  const regions: string[] = [];
  if (/主要投资(?:的境外市场)?(?:于|为)美国(?:证券)?市场|主要投资美国纳斯达克交易所|主要投资于美国证券市场/.test(text)) regions.push("美国");
  if (/主要投资(?:的境外市场)?(?:于|为)(?:中国)?香港(?:证券)?市场|主要投资于港股/.test(text)) regions.push("中国香港");
  if (/主要投资于(?:中国)?境内证券市场|主要投资于A股市场/.test(text)) regions.push("中国内地");
  if (/主要投资于全球(?:证券)?市场/.test(text)) regions.push("全球");
  return uniqueText(regions);
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
  // 商品类资产（黄金/原油等）无地理地区时归"全球"，便于持仓页暴露统计。
  if (!regions.length && classifiedAssetClass(detail) === "commodity") regions.push("全球");
  return uniqueText(regions);
}

function regionsOf(detail: SourceRecord): {
  values: string[];
  quality: "extracted" | "classified" | "unknown";
  sourceSection?: string;
} {
  const extracted = sourceRegions(detail);
  if (extracted.length) {
    const sourceSection = textOf(recordOf(arrayOf(detail.marketEvidence)[0]).sourceField);
    return {
      values: extracted,
      quality: "extracted",
      ...(sourceSection ? { sourceSection } : {}),
    };
  }
  const classified = classifiedRegions(detail);
  return classified.length
    ? { values: classified, quality: "classified" }
    : { values: [], quality: "unknown" };
}

function classifiedCurrency(detail: SourceRecord): string[] {
  const text = textOf(detail.currency);
  if (/^(?:元|人民币|CNY)$/i.test(text)) return ["CNY"];
  if (/^(?:美元|USD)$/i.test(text)) return ["USD"];
  if (/^(?:港元|港币|HKD)$/i.test(text)) return ["HKD"];
  if (/^(?:欧元|EUR)$/i.test(text)) return ["EUR"];
  return [];
}

function sourceIndustries(detail: SourceRecord): Array<{ name: string; weight: number }> {
  return arrayOf(detail.industries).map(recordOf)
    // 东方财富 ZJZBL / weightPct 使用百分数数值（56.61 表示 56.61%）；领域模型统一保存 0–1 比例。
    .map((industry) => ({ name: textOf(industry.HYMC ?? industry.name), weight: numberOf(industry.ZJZBL ?? industry.weightPct) / 100 }))
    .filter((industry) => industry.name && industry.weight > 0);
}

function themesOf(detail: SourceRecord): {
  values: string[];
  quality: "source" | "extracted" | "unknown";
  evidenceKind?: "profile" | "industry";
} {
  const fields = fieldsOf(detail);
  // 只看标题型来源字段；投资范围/策略正文会列举“银行存款”等可投工具，不能当主题。
  const explicitThemes = explicitThemesFromSourceText([
    detail.fundName,
    detail.trackedIndexText,
    fields["基金简称"],
    fields["跟踪标的"],
  ]);
  if (explicitThemes.length) {
    return { values: explicitThemes, quality: "extracted", evidenceKind: "profile" };
  }

  const industries = sourceIndustries(detail);
  if (industries.length) {
    const largest = Math.max(...industries.map((industry) => industry.weight));
    return {
      values: uniqueText(industries.filter((industry) => industry.weight === largest).map((industry) => industry.name)),
      quality: "source",
      evidenceKind: "industry",
    };
  }
  return { values: [], quality: "unknown" };
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
  const indexes = indexesOf(detail);
  const trackingIndexes = sourceIndexes(detail);
  const benchmarks = benchmarkIndexes(detail);
  const regions = regionsOf(detail);
  const currencies = classifiedCurrency(detail);
  const themes = themesOf(detail);
  const assetClass = classifiedAssetClass(detail);
  const profileSourceUrl = textOf(detail.sourceUrl);
  const industrySourceUrl = textOf(detail.industrySourceUrl)
    || (sourceIndustries(detail).length ? `https://fundf10.eastmoney.com/hytz_${assetId}.html` : "");
  const industryAsOf = dateOf(detail.industryAsOf);
  const industries = sourceIndustries(detail);
  const themeSourceUrl = themes.evidenceKind === "profile" ? profileSourceUrl : industrySourceUrl;
  return {
    assetId,
    name: textOf(holding.fundName ?? holding.name ?? detail.fundName) || undefined,
    assetClass,
    regions: regions.values,
    indexes: indexes.values,
    trackingIndexes,
    benchmarkIndexes: benchmarks,
    trackingIndexQuality: trackingIndexes.length ? "source" : "unknown",
    benchmarkIndexQuality: benchmarks.length ? "extracted" : "unknown",
    currencies,
    themes: themes.values,
    provenance: {
      assetClass: assetClass === "other" ? "unknown" : "classified",
      regions: regions.quality,
      indexes: indexes.quality,
      currencies: currencies.length ? "classified" : "unknown",
      themes: themes.quality,
    },
    evidence: {
      ...(indexes.values.length && profileSourceUrl ? {
        indexes: { sourceUrl: profileSourceUrl, sourceField: indexes.sourceField },
      } : {}),
      ...(regions.values.length && profileSourceUrl ? {
        regions: {
          sourceUrl: profileSourceUrl,
          sourceField: "fund-profile",
          ...(regions.sourceSection ? { sourceSection: regions.sourceSection } : {}),
        },
      } : {}),
      ...(themes.quality !== "unknown" && themeSourceUrl
        ? { themes: {
            sourceUrl: themeSourceUrl,
            sourceField: themes.evidenceKind === "industry" ? "industry-allocation" : "fund-profile",
            ...(themes.evidenceKind === "industry" && industryAsOf ? { asOf: industryAsOf } : {}),
          } }
        : {}),
    },
    ...(trackingIndexes.length && profileSourceUrl ? {
      trackingIndexEvidence: { sourceUrl: profileSourceUrl, sourceField: "tracked-index" as const },
    } : {}),
    ...(benchmarks.length && profileSourceUrl ? {
      benchmarkIndexEvidence: { sourceUrl: profileSourceUrl, sourceField: "benchmark" as const },
    } : {}),
    industryAllocations: industries,
    ...(industries.length ? { industryAllocationScale: "ratio" as const } : {}),
    ...(industrySourceUrl ? {
      industryEvidence: {
        sourceUrl: industrySourceUrl,
        sourceField: "industry-allocation",
        ...(industryAsOf ? { asOf: industryAsOf } : {}),
      },
    } : {}),
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
    const pageSize = numberOf(range.pageSize);
    const rawPages = arrayOf(range.pages).map(recordOf);
    const pages = rawPages.map((page) => numberOf(page.pageNum));
    const recordCount = rawPages.reduce((sum, page) => sum + arrayOf(page.records).length, 0);
    if (expected === 0) return totalCount === 0 && pages.includes(1) && recordCount === 0;
    return expected <= 200
      && pageSize > 0
      && expected === Math.ceil(totalCount / pageSize)
      && recordCount === totalCount
      && Array.from({ length: expected }, (_, index) => index + 1).every((page) => pages.includes(page));
  });
}

function transactionCoverageWarnings(capture: EastmoneySourceCapture): string[] {
  const warnings: string[] = [];
  for (const rawRange of capture.transactionRanges) {
    const range = recordOf(rawRange);
    if (range.skipReason === "custom-date-dialog") continue;
    const expected = numberOf(range.expectedPages);
    const rawPages = arrayOf(range.pages).map(recordOf);
    const pageNums = new Set(rawPages.map((page) => numberOf(page.pageNum)).filter(Boolean));
    const recordCount = rawPages.reduce((sum, page) => sum + arrayOf(page.records).length, 0);
    const totalCount = numberOf(range.totalCount);
    if (expected > pageNums.size) {
      warnings.push(`eastmoney:transactions-pages:${pageNums.size}/${expected}`);
    }
    if (recordCount !== totalCount) warnings.push(`eastmoney:transactions-records:${recordCount}/${totalCount}`);
    if (arrayOf(range.warnings).length) warnings.push("eastmoney:transactions-source-warning");
  }
  return [...new Set(warnings)];
}

function rangesFromDates(dates: string[]): Array<{ start: string; end: string }> {
  const sorted = dates.filter(Boolean).sort();
  return sorted.length ? [{ start: sorted[0], end: sorted[sorted.length - 1] }] : [];
}

function coverageEntry(
  dataset: DataCoverage["dataset"],
  dates: string[],
  completeness: DataCoverage["completeness"],
  capturedAt: string,
  warningCodes: string[],
  detail: Pick<DataCoverage, "syncObservedCount" | "syncExpectedCount" | "observedCount" | "observationUnit" | "observationNote">,
): DataCoverage {
  return {
    dataset,
    knownRanges: rangesFromDates(dates),
    completeness,
    latestSyncStatus: completeness,
    lastSyncedAt: capturedAt,
    warningCodes: [...new Set(warningCodes)],
    ...detail,
  };
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
  const positionedTotalAsset = optionalNumber(assetTotals[0]?.oldValue);
  const namedTotalAsset = optionalNumber(accountSource.totalAsset);
  const rawHoldingValues = capture.holdings.map((item) => optionalNumber(item.assetValue ?? item.amount));
  const fallbackHoldingValue = rawHoldingValues.length && rawHoldingValues.every((value) => value !== undefined)
    ? rawHoldingValues.reduce((sum, value) => sum + (value ?? 0), 0)
    : undefined;
  const totalAsset = positionedTotalAsset ?? namedTotalAsset ?? fallbackHoldingValue;
  const totalAssetBasis = positionedTotalAsset !== undefined
    ? "source_positioned" as const
    : namedTotalAsset !== undefined
      ? "source_named" as const
      : fallbackHoldingValue !== undefined
        ? "derived_holding_sum" as const
        : undefined;
  const holdings = capture.holdings
    .map((holding) => mapHolding(holding, details.get(codeOf(holding.fundCode ?? holding.code)), totalAsset ?? 0))
    .filter((holding): holding is HoldingSnapshot => Boolean(holding));
  const txSourceRecords = transactionRecords(capture);
  const transactions = txSourceRecords
    .map(mapTransaction)
    .filter((transaction): transaction is Transaction => Boolean(transaction));
  // 历史交易中出现但已无持仓（无详情页采集）的基金，assets 表缺失会使名称映射断裂（展示为纯代码）：
  // 从交易记录自身携带的 productName 补“仅名称”骨架元数据，分类字段全 unknown，不伪造分类。
  const nameFromTransactions = new Map<string, string>();
  for (const item of txSourceRecords) {
    const code = codeOf(item.productCode ?? item.fundCode);
    const name = textOf(item.productName ?? item.productShowName);
    if (code && name && !nameFromTransactions.has(code)) nameFromTransactions.set(code, name);
  }
  const dailyPnlRecords = capture.fundDetails.flatMap(dailyPnl);
  const currentHoldingPnl = holdings.length && holdings.every((holding) => holding.pnl !== undefined)
    ? holdings.reduce((sum, holding) => sum + (holding.pnl || 0), 0)
    : undefined;
  const holdingValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const difference = totalAsset === undefined ? undefined : totalAsset - holdingValue;
  const tolerance = totalAsset === undefined ? undefined : Math.max(0.01, Math.abs(totalAsset) * 0.0001);
  // 来源没有独立现金字段；这里只保存“账户总资产 - 当前持仓市值合计”的非负残差。
  // 0 表示本次快照在容差内无正残差，不证明账户产品语义上的现金余额为 0。
  const cash = difference !== undefined && tolerance !== undefined && difference >= -tolerance ? Math.abs(difference) <= tolerance ? 0 : difference : undefined;
  const transactionMappingComplete = transactions.length === txSourceRecords.length;
  const transactionComplete = transactionCoverageComplete(capture) && transactionMappingComplete;
  const transactionSyncExpected = capture.transactionRanges.reduce((sum, range) => sum + numberOf(range.expectedPages), 0);
  const transactionSyncObserved = capture.transactionRanges.reduce((sum, range) => sum + new Set(arrayOf(range.pages).map((page) => numberOf(recordOf(page).pageNum))).size, 0);
  const transactionWarnings = transactionComplete ? [] : [
    "eastmoney:transactions-partial",
    ...transactionCoverageWarnings(capture),
    ...(transactionMappingComplete ? [] : ["eastmoney:transaction-amount-unparseable"]),
  ];
  const holdingMappingComplete = holdings.length === capture.holdings.length;
  const detailComplete = holdingMappingComplete && (!holdings.length || holdings.every((holding) => detailFullyObserved(details.get(holding.assetId))));
  const dailyPnlComplete = holdingMappingComplete && (!holdings.length || holdings.every((holding) => hasDetailResponse(details.get(holding.assetId), "yingkui")));
  const publicComplete = holdingMappingComplete && (!holdings.length || holdings.every((holding) => publicDetailFullyObserved(publicDetails.get(holding.assetId))));
  const warnings = [...new Set([
    ...(capture.warnings || []).map(() => "eastmoney:source-warning"),
    ...transactionWarnings,
    ...(dailyPnlComplete ? [] : ["eastmoney:daily-pnl-unknown"]),
    ...(detailComplete ? [] : ["eastmoney:fund-detail-partial"]),
    ...(publicComplete ? [] : ["eastmoney:fund-metadata-partial"]),
    ...(holdingMappingComplete ? [] : ["eastmoney:holding-value-unparseable"]),
    ...(totalAsset === undefined ? ["eastmoney:account-total-asset-missing"] : []),
    ...(totalAssetBasis === "derived_holding_sum" ? ["eastmoney:account-total-asset-derived"] : []),
    ...(currentHoldingPnl === undefined ? ["eastmoney:current-holding-pnl-incomplete"] : []),
    ...(cash === undefined ? ["eastmoney:cash-derivation-invalid"] : []),
  ])];
  const cumulativePnl = optionalNumber(assetTotals[2]?.oldValue ?? accountSource.totalProfit);
  const account = hasAccount && totalAsset !== undefined ? {
    id: `eastmoney-account:${capturedAt}`,
    source: capture.source || "1234567",
    capturedAt,
    totalAsset,
    ...(totalAssetBasis ? { totalAssetBasis } : {}),
    ...(currentHoldingPnl === undefined ? {} : { currentHoldingPnl }),
    ...(cumulativePnl === undefined ? {} : { cumulativePnl }),
  } : undefined;
  const portfolio = account ? {
    id: `eastmoney-portfolio:${capturedAt}`,
    date: capturedDate,
    totalAsset: account.totalAsset,
    ...(totalAssetBasis ? { totalAssetBasis } : {}),
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
    assets: (() => {
      const held = capture.holdings
        .map((holding) => mapAsset(holding, publicDetails.get(codeOf(holding.fundCode ?? holding.code)) || {}))
        .filter((asset): asset is AssetMetadata => Boolean(asset));
      const heldIds = new Set(held.map((asset) => asset.assetId));
      const extras: AssetMetadata[] = [];
      for (const [code, name] of nameFromTransactions) {
        if (heldIds.has(code)) continue;
        extras.push({
          assetId: code,
          name,
          assetClass: "other",
          regions: [],
          indexes: [],
          currencies: [],
          themes: [],
          provenance: { assetClass: "unknown", regions: "unknown", indexes: "unknown", currencies: "unknown", themes: "unknown" },
        });
      }
      return [...held, ...extras];
    })(),
    transactions,
    dailyPnl: dailyPnlRecords,
    coverage: [
      coverageEntry("account", account ? [capturedDate] : [], account ? totalAssetBasis === "derived_holding_sum" ? "partial" : "complete" : "unknown", capturedAt, totalAssetBasis === "derived_holding_sum" ? ["eastmoney:account-total-asset-derived"] : [], {
        syncObservedCount: account ? 1 : 0, syncExpectedCount: 1, observedCount: account ? 1 : 0,
        observationUnit: "snapshot", observationNote: totalAssetBasis === "derived_holding_sum" ? "来源未提供账户总资产；当前值由完整持仓市值求和，仅作为派生分母。" : "账户时点快照；同步完成不代表连续历史覆盖。",
      }),
      coverageEntry("holdings", hasAccount ? [capturedDate] : [], hasAccount ? holdingMappingComplete ? "complete" : "partial" : "unknown", capturedAt, holdingMappingComplete ? [] : ["eastmoney:holding-value-unparseable"], {
        syncObservedCount: hasAccount ? 1 : 0, syncExpectedCount: 1, observedCount: holdings.length,
        observationUnit: "holding", observationNote: "当前持仓时点记录。",
      }),
      coverageEntry("transactions", transactions.map((item) => item.occurredAt.slice(0, 10)), transactionComplete ? "complete" : transactions.length ? "partial" : "unknown", capturedAt, transactionWarnings, {
        syncObservedCount: transactionSyncObserved, syncExpectedCount: transactionSyncExpected, observedCount: transactions.length,
        observationUnit: "transaction", observationNote: "日期范围是已采集交易的最早/最晚日期，不证明区间内每天都有交易。",
      }),
      coverageEntry("dailyPnl", dailyPnlRecords.map((item) => item.date), dailyPnlComplete ? "complete" : dailyPnlRecords.length ? "partial" : "unknown", capturedAt, dailyPnlComplete ? [] : ["eastmoney:daily-pnl-unknown"], {
        syncObservedCount: holdings.filter((holding) => hasDetailResponse(details.get(holding.assetId), "yingkui")).length,
        syncExpectedCount: holdings.length, observedCount: dailyPnlRecords.length, observationUnit: "daily_pnl",
        observationNote: "同步完成仅表示每只当前持仓的盈亏接口已响应；实际日期可能不连续。",
      }),
      coverageEntry("fundDetail", hasAccount ? [capturedDate] : [], hasAccount ? detailComplete && publicComplete ? "complete" : "partial" : "unknown", capturedAt, detailComplete && publicComplete ? [] : ["eastmoney:fund-metadata-partial"], {
        syncObservedCount: holdings.filter((holding) => detailFullyObserved(details.get(holding.assetId)) && publicDetailFullyObserved(publicDetails.get(holding.assetId))).length,
        syncExpectedCount: holdings.length, observedCount: holdings.length, observationUnit: "fund",
        observationNote: "覆盖当前持仓基金档案；不代表历史已清仓基金均有完整档案。",
      }),
    ],
    warnings,
  };
}
