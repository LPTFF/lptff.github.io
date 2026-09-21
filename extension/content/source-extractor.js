// 多平台正式来源采集提取器（MAIN world 与 background service worker 共用）。
  // 只从页面登录态中的只读响应挑选产品白名单字段；认证请求模板永远停留在
  // observation-bridge 的 MAIN world 内存中，不进入这里或任何持久化结果。
(() => {
  if (globalThis.LPTFFMultiDomainSourceExtractor) return;

  const PROTOCOL_VERSION = "1.0";

  function array(value) {
    return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  }

  function compact(value) {
    if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value)
        .map(([key, item]) => [key, compact(item)])
        .filter(([, item]) => item !== undefined));
    }
    if (value === undefined || value === null || value === "") return undefined;
    return value;
  }

  function first(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  function firstUrl(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return firstUrl(value[0]);
    if (!value || typeof value !== "object") return undefined;
    return firstUrl(first(value.urlList, value.url_list, value.urls, value.url));
  }

  function unique(items, keyOf) {
    const seen = new Set();
    return items.filter((item) => {
      const key = String(keyOf(item) || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function newestFirst(items, field) {
    return [...items].sort((left, right) => (Number(right?.[field]) || Date.parse(right?.[field]) || 0) - (Number(left?.[field]) || Date.parse(left?.[field]) || 0));
  }

  function source(path, capturedAt) {
    return { endpoint: path, capturedAt };
  }


  function extractBinance(snapshot) {
    const { path, response, capturedAt, collectionDataset } = snapshot;
    const payload = response?.data ?? response;
    const result = {};
    if (/\/user-data\/user-position$/i.test(path)) {
      result.positions = array(payload).map((item) => compact({
        symbol: item.symbol,
        positionSide: item.positionSide,
        positionAmount: first(item.positionAmount, item.positionAmt),
        entryPrice: item.entryPrice,
        breakEvenPrice: item.breakEvenPrice,
        markPrice: item.markPrice,
        liquidationPrice: item.liquidationPrice,
        unrealizedProfit: first(item.unrealizedProfit, item.unRealizedProfit),
        isolatedMargin: item.isolatedMargin,
        notionalValue: item.notionalValue,
        initialMargin: item.initialMargin,
        maintenanceMargin: first(item.maintMargin, item.maintenanceMargin),
        updateTime: item.updateTime,
        source: source(path, capturedAt),
      }));
    }
    if (/\/user-data\/user-balance$/i.test(path)) {
      result.equity = array(payload).map((item) => compact({
        asset: item.asset,
        walletBalance: first(item.walletBalance, item.balance),
        marginBalance: item.marginBalance,
        availableBalance: item.availableBalance,
        unrealizedProfit: first(item.unrealizedProfit, item.unRealizedProfit),
        initialMargin: item.initialMargin,
        positionInitialMargin: item.positionInitialMargin,
        openOrderInitialMargin: item.openOrderInitialMargin,
        maintenanceMargin: item.maintenanceMargin,
        maxWithdrawAmount: item.maxWithdrawAmount,
        source: source(path, capturedAt),
      }));
    }
    if (/\/user-data\/symbol-config$/i.test(path)) {
      const rows = payload?.symbolConfigItemList ?? payload;
      result.symbolConfigs = array(rows).map((item) => compact({
        symbol: item.symbol,
        marginType: item.marginType,
        leverage: item.leverage,
        maxNotionalValue: item.maxNotionalValue,
        autoAddMargin: item.autoAddMargin,
        source: source(path, capturedAt),
      }));
    }
    if (/\/order\/(?:open-orders|filled-order|order-history)$/i.test(path)) {
      const recordType = /\/order-history$/i.test(path)
        ? "regularOrderHistory"
        : /\/filled-order$/i.test(path) ? "filledOrderSummary" : "openOrder";
      const dataset = collectionDataset === "orderHistory" ? "orderHistory" : "orders";
      result[dataset] = array(payload).map((item) => compact({
        recordType,
        historyId: recordType === "regularOrderHistory" ? `regular:${first(item.orderId, item.id)}` : undefined,
        orderId: first(item.orderId, item.id),
        clientOrderId: item.clientOrderId,
        symbol: item.symbol,
        side: item.side,
        positionSide: item.positionSide,
        type: first(item.type, item.origType),
        originalType: item.origType,
        status: item.status,
        price: item.price,
        averagePrice: item.avgPrice,
        originalQuantity: item.origQty,
        executedQuantity: item.executedQty,
        executedQuoteQuantity: item.executedQuoteQty,
        reduceOnly: item.reduceOnly,
        closePosition: item.closePosition,
        insertedAt: item.insertTime,
        updatedAt: item.updateTime,
        source: source(path, capturedAt),
      }));
    }
    if (/\/order\/get-all-algo-order$/i.test(path)) {
      result.orderHistory = array(payload).map((item) => compact({
        recordType: "conditionalOrderHistory",
        historyId: `conditional:${item.algoId}`,
        algoId: item.algoId,
        orderId: item.actualOrderId,
        clientOrderId: item.clientAlgoId,
        symbol: item.symbol,
        side: item.side,
        positionSide: item.positionSide,
        type: item.orderType,
        status: item.algoStatus,
        price: item.price,
        averagePrice: item.actualPrice,
        originalQuantity: item.quantity,
        executedQuantity: item.actualQty,
        reduceOnly: item.reduceOnly,
        closePosition: item.closePosition,
        triggerPrice: item.triggerPrice,
        workingType: item.workingType,
        insertedAt: item.createTime,
        updatedAt: item.updateTime,
        triggeredAt: item.triggerTime,
        rejectReason: item.rejectReason,
        source: source(path, capturedAt),
      }));
    }
    if (/\/user-data\/trade-history$/i.test(path)) {
      const rows = payload?.rows ?? payload?.list ?? payload;
      const dataset = collectionDataset === "tradeHistory" ? "tradeHistory" : "trades";
      result[dataset] = array(rows).map((item) => compact({
        tradeId: first(item.tradeId, item.id),
        orderId: item.orderId,
        symbol: item.symbol,
        side: item.side,
        positionSide: item.positionSide,
        price: item.price,
        quantity: first(item.qty, item.quantity, item.executedQty),
        quoteQuantity: first(item.quoteQty, item.quoteQuantity),
        realizedProfit: first(item.realizedPnl, item.realizedProfit),
        commission: first(item.commission, item.fee),
        commissionAsset: item.commissionAsset,
        time: first(item.time, item.insertTime, item.updateTime),
        maker: first(item.maker, item.isMaker),
        activeBuy: item.activeBuy,
        source: source(path, capturedAt),
      }));
    }
    if (/\/user-data\/position\/history$/i.test(path)) {
      result.positionHistory = array(payload).map((item) => compact({
        positionId: first(item.positionId, item.id),
        recordId: item.id,
        symbol: item.symbol,
        side: item.side,
        positionSide: item.positionSide,
        type: item.type,
        status: item.status,
        openedAt: item.opened,
        closedAt: item.closed,
        updatedAt: item.updateTime,
        averageOpenPrice: item.avgCost,
        averageClosePrice: item.avgClosePrice,
        closingPnl: item.closingPnl,
        maxOpenInterest: item.maxOpenInterest,
        closedVolume: item.closedVolume,
        openedVolume: item.openedVolume,
        positionAmount: item.positionAmount,
        leverage: item.leverage,
        isolated: item.isolated,
        fundingFee: item.fundingFee,
        tradingFee: item.tradingFee,
        tradingFeeTotal: item.tradingFeeTotal,
        insuranceClearFee: item.insuranceClearFee,
        roi: item.roi,
        source: source(path, capturedAt),
      }));
    }
    if (/\/user-data\/transaction-history$/i.test(path)) {
      result.transactionHistory = array(payload).map((item) => compact({
        transactionId: first(item.tranId, item.id),
        recordId: item.id,
        asset: item.asset,
        type: first(item.balancetype, item.balanceTypeStr),
        typeLabel: item.balanceTypeStr,
        amount: first(item.balanceDelta, item.balanceDeltaStr),
        description: item.balanceInfo,
        time: item.time,
        symbol: item.symbol,
        source: source(path, capturedAt),
      }));
    }
    if (/\/premiumIndex$/i.test(path)) {
      result.funding = array(payload).map((item) => compact({
        symbol: item.symbol,
        markPrice: item.markPrice,
        indexPrice: item.indexPrice,
        fundingRate: first(item.lastFundingRate, item.fundingRate),
        nextFundingTime: item.nextFundingTime,
        time: item.time,
        source: source(path, capturedAt),
      }));
    }
    if (/\/get-funding-rate-history$/i.test(path)) {
      result.fundingHistory = array(payload).map((item) => compact({
        symbol: item.symbol,
        fundingRate: first(item.lastFundingRate, item.fundingRate),
        markPrice: item.markPrice,
        fundingIntervalHours: item.fundingIntervalHours,
        calculatedAt: first(item.calcTime, item.time),
        source: source(path, capturedAt),
      }));
    }
    return compact(result) || {};
  }

  function extractZhipin(snapshot) {
    const { path, response, query, capturedAt } = snapshot;
    const data = response?.zpData ?? response?.data ?? response;
    const rows = data?.jobList ?? data?.list ?? data?.jobListData ?? [];
    if (!Array.isArray(rows)) return {};
    const jobs = rows.map((item) => {
      const jobId = first(item.encryptJobId, item.jobId, item.encryptId);
      return compact({
        jobId,
        jobName: first(item.jobName, item.bossTitle),
        salary: first(item.salaryDesc, item.salary),
        experience: first(item.jobExperience, item.postExperience),
        degree: first(item.jobDegree, item.postDegree),
        city: first(item.cityName, item.city),
        areaDistrict: item.areaDistrict,
        businessDistrict: item.businessDistrict,
        labels: first(item.jobLabels, item.skills),
        activeTime: first(item.activeTimeDesc, item.lastModifyTime),
        welfare: item.welfareList,
        jobUrl: first(item.jobUrl, item.jobDetailUrl, jobId ? `https://www.zhipin.com/job_detail/${jobId}.html` : undefined),
        company: compact({
          name: first(item.brandName, item.companyName),
          industry: first(item.brandIndustry, item.industryName),
          scale: first(item.brandScaleName, item.brandScale),
          stage: first(item.brandStageName, item.brandStage),
          logo: firstUrl(first(item.brandLogo, item.logo)),
        }),
        boss: compact({
          name: item.bossName,
          title: item.bossTitle,
          online: first(item.bossOnline, item.bossActive, item.activeDesc),
        }),
        source: source(path, capturedAt),
      });
    });
    return compact({
      jobs,
      searchContext: {
        query: first(query?.query, query?.keyword),
        city: first(query?.city, query?.cityCode),
        page: first(query?.page, query?.pageNo),
        pageSize: query?.pageSize,
        hasMore: first(data?.hasMore, data?.has_more),
        totalCount: first(data?.totalCount, data?.total),
        source: source(path, capturedAt),
      },
    }) || {};
  }

  const EXTRACTORS = { binance: extractBinance, zhipin: extractZhipin };

  function extractSnapshot(platform, snapshot) {
    const extractor = EXTRACTORS[platform];
    if (!extractor || !snapshot?.response || typeof snapshot.response !== "object") return {};
    return extractor(snapshot);
  }

  function mergeSourceData(platform, snapshots, pageUrl) {
    const chunks = snapshots.map((item) => item.sourceData || {}).filter(Boolean);
    if (platform === "binance") {
      const allSymbolConfigs = unique(chunks.flatMap((item) => item.symbolConfigs || []), (item) => item.symbol);
      const equity = unique(chunks.flatMap((item) => item.equity || []), (item) => item.asset);
      const orders = unique(chunks.flatMap((item) => item.orders || []), (item) => item.orderId);
      const trades = unique(chunks.flatMap((item) => item.trades || []), (item) => item.tradeId);
      const orderHistory = newestFirst(unique(chunks.flatMap((item) => item.orderHistory || []), (item) => item.historyId || `${item.recordType || "order"}:${item.algoId || item.orderId || ""}`), "updatedAt");
      const tradeHistory = newestFirst(unique(chunks.flatMap((item) => item.tradeHistory || []), (item) => item.tradeId), "time");
      const positionHistory = newestFirst(unique(chunks.flatMap((item) => item.positionHistory || []), (item) => `${item.positionId || item.recordId}:${item.updatedAt || item.closedAt || ""}`), "updatedAt");
      const transactionHistory = newestFirst(unique(chunks.flatMap((item) => item.transactionHistory || []), (item) => `${item.recordId || item.transactionId}:${item.time || ""}:${item.type || ""}:${item.amount || ""}:${item.symbol || ""}`), "time");
      const rawPositions = unique(chunks.flatMap((item) => item.positions || []), (item) => `${item.symbol}:${item.positionSide || "BOTH"}`);
      const pageSymbol = (() => {
        try {
          return new URL(pageUrl || "").pathname.match(/\/futures\/([^/?#]+)/i)?.[1]?.toUpperCase();
        } catch {
          return undefined;
        }
      })();
      const relevantSymbols = new Set([
        pageSymbol,
        ...rawPositions.map((item) => item.symbol),
        ...orders.map((item) => item.symbol),
        ...trades.map((item) => item.symbol),
        ...orderHistory.map((item) => item.symbol),
        ...tradeHistory.map((item) => item.symbol),
        ...positionHistory.map((item) => item.symbol),
        ...transactionHistory.map((item) => item.symbol),
      ].filter(Boolean));
      const symbolConfigs = allSymbolConfigs.filter((item) => relevantSymbols.has(item.symbol));
      const configBySymbol = new Map(symbolConfigs.map((item) => [item.symbol, item]));
      const positions = rawPositions
        .map((item) => compact({ ...item, leverage: configBySymbol.get(item.symbol)?.leverage, marginType: configBySymbol.get(item.symbol)?.marginType }));
      return {
        positions,
        equity,
        orders,
        trades,
        orderHistory,
        tradeHistory,
        positionHistory,
        transactionHistory,
        funding: unique(chunks.flatMap((item) => item.funding || []), (item) => item.symbol)
          .filter((item) => relevantSymbols.has(item.symbol)),
        fundingHistory: unique(chunks.flatMap((item) => item.fundingHistory || []), (item) => `${item.symbol}:${item.calculatedAt}`)
          .filter((item) => relevantSymbols.has(item.symbol)),
        symbolConfigs,
      };
    }
    if (platform === "zhipin") {
      return {
        jobs: unique(chunks.flatMap((item) => item.jobs || []), (item) => item.jobId || item.jobUrl),
        searchContexts: chunks.map((item) => item.searchContext).filter(Boolean),
      };
    }
    return {};
  }

  function observedDatasetsOf(platform, snapshots) {
    const observed = new Set();
    for (const snapshot of snapshots || []) {
      const data = snapshot?.sourceData;
      if (!data || typeof data !== "object") continue;
      if (platform === "binance") {
        for (const name of ["positions", "equity", "orders", "trades", "funding", "orderHistory", "tradeHistory", "positionHistory", "transactionHistory"]) {
          if (Object.prototype.hasOwnProperty.call(data, name)) observed.add(name);
        }
      } else if (platform === "zhipin" && Object.prototype.hasOwnProperty.call(data, "jobs")) {
        observed.add("jobs");
        observed.add("searchContext");
      }
    }
    return observed;
  }

  function coverageOf(platform, entities, observedDatasets = new Set()) {
    const present = (value) => value !== undefined && value !== null && value !== "";
    const item = (dataset, rows, complete) => {
      const list = rows || [];
      const completeCount = list.filter(complete).length;
      return {
        dataset,
        completeness: !list.length
          ? (observedDatasets.has(dataset) ? "complete" : "unknown")
          : completeCount === list.length ? "complete" : "partial",
        recordCount: list.length,
        completeRecordCount: completeCount,
      };
    };
    if (platform === "binance") return [
      item("positions", entities.positions, (row) => ["symbol", "positionSide", "leverage", "entryPrice", "liquidationPrice", "markPrice", "positionAmount", "marginType"].every((key) => present(row?.[key]))),
      item("equity", entities.equity, (row) => ["asset", "marginBalance", "availableBalance", "initialMargin"].every((key) => present(row?.[key]))),
      item("orders", entities.orders, (row) => {
        const isFilledSummary = row?.recordType === "filledOrderSummary" || /\/filled-order$/i.test(row?.source?.endpoint || "");
        const fields = isFilledSummary
          ? ["orderId", "symbol", "side", "status", "executedQuantity", "averagePrice", "updatedAt", "reduceOnly"]
          : ["orderId", "symbol", "side", "positionSide", "type", "status", "originalQuantity", "executedQuantity", "updatedAt", "reduceOnly"];
        return fields.every((key) => present(row?.[key]));
      }),
      item("orderHistory", entities.orderHistory, (row) => ["historyId", "symbol", "side", "type", "status", "originalQuantity", "executedQuantity", "updatedAt"].every((key) => present(row?.[key]))),
      item("tradeHistory", entities.tradeHistory, (row) => ["tradeId", "orderId", "symbol", "side", "price", "quantity", "time"].every((key) => present(row?.[key]))),
      item("positionHistory", entities.positionHistory, (row) => ["positionId", "symbol", "positionSide", "status", "openedAt", "updatedAt"].every((key) => present(row?.[key]))),
      item("transactionHistory", entities.transactionHistory, (row) => ["transactionId", "asset", "type", "amount", "time"].every((key) => present(row?.[key]))),
      item("funding", entities.funding, (row) => ["symbol", "fundingRate", "nextFundingTime"].every((key) => present(row?.[key]))),
    ];
    if (platform === "zhipin") return [
      item("jobs", entities.jobs, (row) => [row?.jobName, row?.salary, row?.experience, row?.degree, row?.city, row?.jobUrl, row?.company?.name, row?.company?.industry].every(present)),
      item("searchContext", entities.searchContexts, (row) => [row?.query, row?.city, row?.page].every(present)),
    ];
    return [];
  }

  function buildSourceCapture(platform, input) {
    const snapshots = input?.data?.restSnapshots || [];
    const history = input?.data?.historyCollection || null;
    const combinedSnapshots = [...snapshots, ...(input?.data?.domSnapshots || []), ...(history?.chunks || [])];
    const entities = mergeSourceData(platform, combinedSnapshots, input?.data?.pageUrl);
    let coverage = coverageOf(platform, entities, observedDatasetsOf(platform, combinedSnapshots));
    if (platform === "binance" && history?.branches) {
      coverage = coverage.map((item) => {
        const branch = history.branches[item.dataset];
        if (!branch) return item;
        const traversal = branch.completeness || (branch.status === "completed" ? "complete" : branch.status === "failed" ? "failed" : "partial");
        const completeness = traversal === "failed" ? "failed" : traversal === "complete" && item.completeness === "complete" ? "complete" : "partial";
        return compact({ ...item, ...branch, dataset: item.dataset, completeness, recordCount: item.recordCount, completeRecordCount: item.completeRecordCount });
      });
    }
    const warnings = [...new Set([...(input?.warnings || []), ...Object.values(history?.branches || {}).map((branch) => branch?.limitation).filter(Boolean), ...coverage
      .filter((item) => item.completeness !== "complete")
      .map((item) => item.completeness === "unknown"
        ? `未采集到正式数据集：${item.dataset}`
        : `正式数据集字段不完整：${item.dataset}（${item.completeRecordCount}/${item.recordCount}）`)])];
    return compact({
      protocol: `${platform}-source-capture/${PROTOCOL_VERSION}`,
      kind: "source-capture",
      source: platform,
      capturedAt: input?.capturedAt || new Date().toISOString(),
      pageUrl: input?.data?.pageUrl,
      entities,
      coverage,
      warnings,
      historyRange: platform === "binance" ? history?.range : undefined,
      officialBaseline: platform === "binance" ? {
        product: "U本位合约",
        datasets: ["orderHistory", "tradeHistory", "positionHistory", "transactionHistory"],
        officialSingleExportMaxMonths: 12,
        collectionMode: "all-existing-read-only-history",
      } : undefined,
      metrics: platform === "binance" ? { ...(input?.metrics || {}), historyRequestCount: history?.requestCount || 0 } : (input?.metrics || {}),
    });
  }

  function summarizeSource(capture) {
    return {
      protocol: capture?.protocol,
      entityCounts: Object.fromEntries(Object.entries(capture?.entities || {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])),
      coverage: capture?.coverage || [],
      warningCount: capture?.warnings?.length || 0,
    };
  }

  function desensitizeSource(capture) {
    const idKey = /^(?:historyId|algoId|orderId|clientOrderId|tradeId|positionId|transactionId|recordId|jobId|videoId|authorId|seriesId)$/;
    const originals = new Map();
    let seq = 0;
    function collect(value, key = "") {
      if (Array.isArray(value)) return value.forEach((item) => collect(item, key));
      if (value && typeof value === "object") return Object.entries(value).forEach(([name, item]) => collect(item, name));
      if (idKey.test(key) && value !== undefined && value !== null && String(value).length >= 6 && !originals.has(String(value))) {
        seq += 1;
        originals.set(String(value), `ID-${String(seq).padStart(4, "0")}`);
      }
    }
    collect(capture);
    function mask(value, key = "") {
      if (Array.isArray(value)) return value.map((item) => mask(item, key));
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, mask(item, name)]));
      if (value === undefined || value === null) return value;
      let text = String(value);
      if (idKey.test(key) && originals.has(text)) return originals.get(text);
      for (const [original, pseudo] of originals) text = text.split(original).join(pseudo);
      text = text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<EMAIL-MASKED>");
      text = text.replace(/(?<![0-9])1[3-9][0-9]{9}(?![0-9])/g, "<PHONE-MASKED>");
      return typeof value === "string" ? text : value;
    }
    return { desensitized: mask(capture), maskedOriginals: [...originals.keys()] };
  }

  function residualCheck(capture, originals) {
    const serialized = JSON.stringify(capture);
    const residual = [];
    if ((originals || []).some((item) => item && serialized.includes(item))) residual.push("业务标识原值仍有残留");
    if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(serialized)) residual.push("邮箱仍有残留");
    if (/(?<![0-9])1[3-9][0-9]{9}(?![0-9])/.test(serialized)) residual.push("手机号仍有残留");
    return residual;
  }

  globalThis.LPTFFMultiDomainSourceExtractor = Object.freeze({
    protocolOf: (platform) => `${platform}-source-capture/${PROTOCOL_VERSION}`,
    extractSnapshot,
    buildSourceCapture,
    summarizeSource,
    desensitizeSource,
    residualCheck,
  });
})();
