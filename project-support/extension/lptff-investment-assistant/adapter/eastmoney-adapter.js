(() => {
  const VERSION = "2.0";
  const SOURCE = "1234567";

  function numberOf(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const match = String(value ?? "").replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function dateOf(value) {
    const text = String(value || "").trim();
    const match = text.match(/(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/);
    return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
  }

  function codeOf(value) {
    const match = String(value || "").match(/\b\d{6}\b/);
    return match ? match[0] : "";
  }

  function stableId(item) {
    const details = item?.details || {};
    return String(details.sourceTransactionId || details.transactionId || details.id || "").trim();
  }

  function transactionType(type) {
    return type === "BUY" || type === "SELL" || type === "DIVIDEND" ? type : "OTHER";
  }

  function transactionStatus(status) {
    const text = String(status || "").toLowerCase();
    if (!text) return "UNKNOWN";
    if (/失败|fail|拒绝|撤销/.test(text)) return "FAILED";
    if (/处理中|待确认|pending|申请/.test(text)) return "PENDING";
    if (/成功|已确认|confirm|完成/.test(text)) return "CONFIRMED";
    return "UNKNOWN";
  }

  function sourceType(item) {
    const text = JSON.stringify(item?.details || {}) + String(item?.status || "");
    if (/银行卡定投|银行定投|自动定投/.test(text)) return "bank_auto_invest";
    return "unknown";
  }

  function fingerprint(tx) {
    return [tx.occurredAt.slice(0, 10), tx.assetId, tx.type, tx.amount, tx.status].join(":");
  }

  function mapTransaction(item, index) {
    const assetId = codeOf(item.fundCode);
    const occurredAt = dateOf(item.date) || String(item.date || "");
    const type = transactionType(item.type);
    const status = transactionStatus(item.status);
    const sourceTransactionId = stableId(item);
    const base = {
      id: sourceTransactionId ? `eastmoney-tx:${sourceTransactionId}` : `eastmoney-tx:${fingerprint({ occurredAt, assetId, type, amount: numberOf(item.amount), status })}:${index}`,
      occurredAt,
      assetId,
      type,
      amount: numberOf(item.amount),
      amountUnit: item.amountUnit || "CNY",
      confirmedAmount: item.confirmedAmount === undefined ? undefined : numberOf(item.confirmedAmount),
      status,
      sourceType: sourceType(item),
    };
    return sourceTransactionId ? { ...base, sourceTransactionId } : base;
  }

  function mapHolding(item) {
    return {
      assetId: codeOf(item.code),
      name: item.name || undefined,
      marketValue: numberOf(item.amount),
      pnl: item.profit === undefined ? undefined : numberOf(item.profit),
      pnlRate: item.profitRate === undefined ? undefined : numberOf(item.profitRate) / 100,
      weight: typeof item.ratio === "number" ? item.ratio / 100 : undefined,
      shares: item.shares === undefined ? undefined : numberOf(item.shares),
      availableShares: item.availableShares === undefined ? undefined : numberOf(item.availableShares),
      nav: item.nav === undefined ? undefined : numberOf(item.nav),
      navDate: dateOf(item.navDate) || item.navDate || undefined,
    };
  }

  function uniqueText(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function detailByCode(data) {
    return new Map(
      (Array.isArray(data?.publicFundDetails) ? data.publicFundDetails : [])
        .map((detail) => [codeOf(detail?.fundCode), detail])
        .filter(([code]) => Boolean(code)),
    );
  }

  function sourceIndexes(detail) {
    const tracked = String(detail?.trackedIndexText || "").trim();
    if (tracked && !/无跟踪标的|暂无|不适用/.test(tracked)) return [tracked];
    return [];
  }

  function classifiedIndexes(detail) {
    const benchmark = String(detail?.benchmark || "");
    return uniqueText(
      benchmark.split(/[+，,；;]/).flatMap((component) => {
        const normalized = component
          .replace(/^.*?汇率调整的/, "")
          .replace(/收益率.*$/, "")
          .replace(/\*.*$/, "")
          .trim();
        const match = normalized.match(/([^*]{2,50}?指数)$/);
        return match ? [match[1].trim()] : [];
      }),
    );
  }

  function classifiedRegions(detail) {
    const text = [
      detail?.investmentScope,
      detail?.investmentObjective,
      detail?.fundType,
      detail?.benchmark,
      detail?.fundName,
    ].filter(Boolean).join(" ");
    const regions = [];
    if (/美国|美股|纳斯达克|标普/.test(text)) regions.push("美国");
    if (/香港|港股|恒生/.test(text)) regions.push("中国香港");
    if (/日本|日经/.test(text)) regions.push("日本");
    if (/越南/.test(text)) regions.push("越南");
    if (/印度/.test(text)) regions.push("印度");
    if (/欧洲|欧元区/.test(text)) regions.push("欧洲");
    if (/中国境内|内地|A股|沪深|中证|上证|深证|创业板|科创/.test(text)) regions.push("中国内地");
    if (!regions.length && /全球|环球|境外|QDII/i.test(text)) regions.push("全球");
    return uniqueText(regions);
  }

  function classifiedCurrency(detail) {
    const text = String(detail?.currency || "").trim();
    if (/^(?:元|人民币|CNY)$/i.test(text)) return ["CNY"];
    if (/^(?:美元|USD)$/i.test(text)) return ["USD"];
    if (/^(?:港元|港币|HKD)$/i.test(text)) return ["HKD"];
    if (/^(?:欧元|EUR)$/i.test(text)) return ["EUR"];
    return [];
  }

  function classifiedThemes(detail) {
    const industries = (Array.isArray(detail?.industries) ? detail.industries : [])
      .map((industry) => ({ name: String(industry?.name || "").trim(), weightPct: numberOf(industry?.weightPct) }))
      .filter((industry) => industry.name && industry.weightPct > 0);
    if (!industries.length) return [];
    const largestWeight = Math.max(...industries.map((industry) => industry.weightPct));
    return uniqueText(
      industries.filter((industry) => industry.weightPct === largestWeight).map((industry) => industry.name),
    );
  }

  function classifiedAssetClass(detail) {
    const text = [detail?.fundType, detail?.fundName, detail?.investmentScope].filter(Boolean).join(" ");
    if (/货币/.test(text)) return "cash";
    if (/债券|纯债|固收/.test(text)) return "bond";
    if (/黄金|商品|原油|贵金属/.test(text)) return "commodity";
    if (/股票|指数|ETF|联接/.test(text)) return "equity";
    return "other";
  }

  function mapAsset(item, details) {
    const detail = details.get(codeOf(item.code));
    const directIndexes = sourceIndexes(detail);
    const indexes = directIndexes.length ? directIndexes : classifiedIndexes(detail);
    const regions = classifiedRegions(detail);
    const currencies = classifiedCurrency(detail);
    const themes = classifiedThemes(detail);
    const assetClass = classifiedAssetClass(detail);
    return {
      assetId: codeOf(item.code),
      name: item.name || detail?.fundName || undefined,
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

  function rowValue(headers, row, patterns) {
    const index = headers.findIndex((header) => patterns.some((pattern) => pattern.test(String(header))));
    return index >= 0 ? row[index] : "";
  }

  function extractDailyPnl(holding) {
    const table = holding?.details?.profitTable;
    if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) return [];
    return table.rows.map((row) => {
      const date = dateOf(rowValue(table.headers, row, [/日期|时间|净值日/i]));
      const pnlText = rowValue(table.headers, row, [/盈亏|收益额|收益金额|损益/i]);
      if (!date || pnlText === "") return null;
      const dailyReturnText = rowValue(table.headers, row, [/收益率|回报率/i]);
      return {
        assetId: codeOf(holding.code),
        date,
        pnl: numberOf(pnlText),
        ...(dailyReturnText === "" ? {} : { dailyReturn: numberOf(dailyReturnText) / 100 }),
      };
    }).filter(Boolean);
  }

  function rangesFromTransactions(transactions) {
    const dates = transactions.map((item) => item.occurredAt.slice(0, 10)).filter(Boolean).sort();
    return dates.length ? [{ start: dates[0], end: dates[dates.length - 1] }] : [];
  }

  function warningCodes(data) {
    const warnings = Array.isArray(data?.collectionWarnings) ? data.collectionWarnings : [];
    return [...new Set(warnings.map((warning) => {
      const text = String(warning);
      if (/^已捕获\s*\d+\s*个交易查询响应/.test(text)) return null;
      if (/未找到交易时间筛选|未捕获到接口响应|未捕获交易接口响应|第\s*\d+\s*页未捕获|仅捕获到一个交易查询响应|分页未完整采集|超过单次采集上限/.test(text)) {
        return "eastmoney:transactions-partial";
      }
      if (/盈亏.*(?:失败|缺失|未捕获)/.test(text)) return "eastmoney:daily-pnl-missing";
      if (/定投.*(?:失败|缺失|未捕获)/.test(text)) return "eastmoney:fund-detail-investment-plan-missing";
      return "eastmoney:source-warning";
    }).filter(Boolean))];
  }

  function transactionPagingComplete(data) {
    const snapshots = (data?.raw?.snapshots || []).filter((snapshot) => snapshot?.key === "delegate");
    return ["3", "4"].every((timeType) => {
      const rangeSnapshots = snapshots.filter((snapshot) => String(snapshot.requestBody?.timeType) === timeType);
      if (!rangeSnapshots.length) return false;
      const pageSize = Math.max(...rangeSnapshots.map((snapshot) => numberOf(snapshot.requestBody?.pageSize)), 0);
      const totalCounts = [...new Set(rangeSnapshots.map((snapshot) => numberOf(snapshot.response?.data?.totalCount)))];
      if (pageSize <= 0 || totalCounts.length !== 1) return false;
      const expectedPages = Math.ceil(totalCounts[0] / pageSize);
      if (expectedPages <= 0 || expectedPages > 200) return false;
      const pages = new Map();
      for (const snapshot of rangeSnapshots) {
        const pageNum = numberOf(snapshot.requestBody?.pageNum);
        const list = snapshot.response?.data?.list;
        if (pageNum < 1 || pageNum > expectedPages || !Array.isArray(list)) return false;
        const expectedLength = pageNum < expectedPages
          ? pageSize
          : totalCounts[0] - pageSize * (expectedPages - 1);
        if (list.length !== expectedLength) return false;
        pages.set(pageNum, true);
      }
      return Array.from({ length: expectedPages }, (_, index) => index + 1).every((pageNum) => pages.has(pageNum));
    });
  }

  function holdingFacts(holdings, totalAsset) {
    const holdingValue = holdings.reduce((sum, item) => sum + item.marketValue, 0);
    const currentHoldingPnl = holdings.length && holdings.every((item) => item.pnl !== undefined)
      ? holdings.reduce((sum, item) => sum + item.pnl, 0)
      : undefined;
    const difference = totalAsset - holdingValue;
    const tolerance = Math.max(0.01, Math.abs(totalAsset) * 0.0001);
    const cash = difference >= -tolerance
      ? Math.abs(difference) <= tolerance ? 0 : difference
      : undefined;
    return { holdingValue, currentHoldingPnl, cash };
  }

  function coverage(dataset, knownRanges, completeness, lastSyncedAt, warningCodesList) {
    return { dataset, knownRanges, completeness, lastSyncedAt, warningCodes: warningCodesList };
  }

  function toInvestmentDataset(data) {
    const capturedAt = data?.raw?.capturedAt || new Date().toISOString();
    const capturedDate = capturedAt.slice(0, 10);
    const holdings = Array.isArray(data?.holdings) ? data.holdings.map(mapHolding).filter((item) => item.assetId) : [];
    const totalAsset = data?.account ? numberOf(data.account.totalAsset) : 0;
    const facts = holdingFacts(holdings, totalAsset);
    const account = data?.account ? {
      id: `eastmoney-account:${capturedAt}`,
      source: SOURCE,
      capturedAt,
      totalAsset,
      ...(facts.currentHoldingPnl === undefined ? {} : { currentHoldingPnl: facts.currentHoldingPnl }),
      cumulativePnl: numberOf(data.account.totalProfit),
    } : undefined;
    const transactions = Array.isArray(data?.transactions)
      ? data.transactions.map(mapTransaction).filter((item) => item.assetId && item.occurredAt)
      : [];
    const dailyPnl = Array.isArray(data?.holdings) ? data.holdings.flatMap(extractDailyPnl) : [];
    const warnings = warningCodes(data);
    const dailyWarnings = dailyPnl.length ? [] : ["eastmoney:daily-pnl-unknown"];
    const transactionPartial = warnings.includes("eastmoney:transactions-partial") || !transactions.length || !transactionPagingComplete(data);
    const transactionWarnings = transactionPartial ? ["eastmoney:transactions-partial"] : [];
    const publicDetails = detailByCode(data);
    const detailCount = holdings.filter((holding) => publicDetails.has(holding.assetId)).length;
    const detailCompleteness = holdings.length && detailCount === holdings.length
      ? "complete"
      : detailCount
        ? "partial"
        : "unknown";
    const detailWarnings = detailCompleteness === "complete"
      ? []
      : [detailCompleteness === "partial" ? "eastmoney:fund-metadata-partial" : "eastmoney:fund-metadata-unknown"];
    const coverage = [
      coverageEntry("account", account ? [{ start: capturedDate, end: capturedDate }] : [], account ? "complete" : "unknown", capturedAt, []),
      coverageEntry("holdings", holdings.length ? [{ start: capturedDate, end: capturedDate }] : [], holdings.length ? "complete" : "unknown", capturedAt, []),
      coverageEntry("transactions", rangesFromTransactions(transactions), transactionPartial ? "partial" : "complete", capturedAt, transactionWarnings),
      coverageEntry("dailyPnl", rangesFromTransactions(dailyPnl.map((item) => ({ occurredAt: item.date }))), dailyPnl.length ? "complete" : "unknown", capturedAt, dailyWarnings),
      coverageEntry("fundDetail", detailCount ? [{ start: capturedDate, end: capturedDate }] : [], detailCompleteness, capturedAt, detailWarnings),
    ];
    const portfolio = account ? {
      id: `eastmoney-portfolio:${capturedAt}`,
      date: capturedDate,
      totalAsset: account.totalAsset,
      holdingValue: facts.holdingValue,
      ...(facts.cash === undefined ? {} : { cash: facts.cash }),
      ...(facts.currentHoldingPnl === undefined ? {} : { currentHoldingPnl: facts.currentHoldingPnl }),
      holdings,
    } : undefined;
    const factWarnings = [
      ...(account && facts.currentHoldingPnl === undefined ? ["eastmoney:current-holding-pnl-incomplete"] : []),
      ...(account && facts.cash === undefined ? ["eastmoney:cash-derivation-invalid"] : []),
    ];
    return {
      version: VERSION,
      source: SOURCE,
      capturedAt,
      account,
      portfolio,
      assets: Array.isArray(data?.holdings) ? data.holdings.map((item) => mapAsset(item, publicDetails)).filter((item) => item.assetId) : [],
      transactions,
      dailyPnl,
      coverage,
      warnings: [...new Set([...warnings, ...dailyWarnings, ...transactionWarnings, ...detailWarnings, ...factWarnings])],
    };
  }

  function coverageEntry(dataset, knownRanges, completeness, lastSyncedAt, warningCodesList) {
    return { dataset, knownRanges, completeness, lastSyncedAt, warningCodes: [...new Set(warningCodesList)] };
  }

  globalThis.LPTFFInvestmentAdapter = { toInvestmentDataset };
})();
