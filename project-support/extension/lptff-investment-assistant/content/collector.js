const DATE_RE = /(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/;
const HOLD_PATH = "/request/hold";
const SINGLE_PATH = "/http/single/get";

function textOf(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function numberOf(value) {
  const text = String(value ?? "").replace(/,/g, "").replace(/元|份|%/g, "").trim();
  const match = text.match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function dateOf(value) {
  const text = String(value || "").trim();
  const match = text.match(DATE_RE);
  if (!match) return "";
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizedCode(value) {
  const match = String(value || "").match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

async function requestJson(path, options) {
  const response = await fetch(path, { credentials: "include", ...options });
  if (!response.ok) throw new Error(`接口请求失败（${response.status}）`);
  return response.json();
}

function mapHolding(item) {
  return {
    code: item.fundCode,
    name: item.fundName || `基金${item.fundCode}`,
    amount: Number(item.assetValue) || 0,
    profit: Number(item.profitValue) || 0,
    profitRate: Number(item.profitPercent) || 0,
    ratio: 0,
    nav: Number(item.nav) || 0,
    navDate: item.navdate || "",
    details: item,
  };
}

function transactionType(business) {
  return /卖出|赎回/.test(business)
    ? "SELL"
    : /分红|红利/.test(business)
      ? "DIVIDEND"
      : /买入|申购|定投/.test(business)
        ? "BUY"
        : "OTHER";
}

function mapTransaction(item) {
  return {
    date: dateOf(item.strikeStartDate),
    type: transactionType(item.businessTypeText1 || ""),
    fundCode: normalizedCode(item.productCode),
    fundName: item.productName || normalizedCode(item.productCode),
    amount: numberOf(item.applyCount),
    amountUnit: item.applyCountUnit || "",
    confirmedAmount: numberOf(item.confirmCount),
    confirmedAmountUnit: item.confirmCountUnit || "",
    status: item.appStateText || "",
    details: item,
  };
}

function requestNetworkData(timeout = 500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (data) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(data || {});
    };
    const onMessage = (event) => {
      if (event.source === window && event.data?.type === "LPTFF_NETWORK_DATA") finish(event.data.data);
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "LPTFF_GET_NETWORK_DATA" }, location.origin);
    setTimeout(() => finish({}), timeout);
  });
}

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function snapshotCount(networkData, key) {
  return Array.isArray(networkData.snapshots)
    ? networkData.snapshots.filter((snapshot) => !key || snapshot.key === key).length
    : 0;
}

async function waitForNetworkData(predicate, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let latest = {};
  while (Date.now() < deadline) {
    latest = await requestNetworkData(250);
    if (predicate(latest)) return latest;
    await sleep(250);
  }
  return latest;
}

function clickElement(element) {
  if (!element) return false;
  element.dispatchEvent(new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  }));
  return true;
}

function delegateSnapshots(networkData, timeType) {
  return (networkData.snapshots || []).filter((snapshot) =>
    snapshot.key === "delegate" && String(snapshot.requestBody?.timeType) === String(timeType),
  );
}

function queryCoverage(networkData, timeType) {
  const snapshots = delegateSnapshots(networkData, timeType);
  const pageSize = Math.max(...snapshots.map((snapshot) => Number(snapshot.requestBody?.pageSize) || 0), 0);
  const totalCount = Math.max(...snapshots.map((snapshot) => Number(snapshot.response?.data?.totalCount) || 0), 0);
  const expectedPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const capturedPages = new Set(snapshots.map((snapshot) => Number(snapshot.requestBody?.pageNum) || 0).filter(Boolean));
  return { pageSize, totalCount, expectedPages, capturedPages };
}

function requestDelegatePage(timeType, pageNum, timeout = 15000) {
  return new Promise((resolve) => {
    const requestId = `delegate:${timeType}:${pageNum}:${Date.now()}`;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(result);
    };
    const onMessage = (event) => {
      if (
        event.source === window &&
        event.origin === location.origin &&
        event.data?.type === "LPTFF_DELEGATE_PAGE_RESULT" &&
        event.data?.requestId === requestId
      ) finish(event.data);
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "LPTFF_FETCH_DELEGATE_PAGE", requestId, timeType, pageNum }, location.origin);
    setTimeout(() => finish({ ok: false, error: `交易时间范围 ${timeType} 第 ${pageNum} 页请求超时` }), timeout);
  });
}

async function collectQueryPages(ranges = ["3", "4"]) {
  const warnings = [];
  let networkData = await requestNetworkData();

  for (const timeType of ranges) {
    const filter = document.querySelector(`.ulFilter.Delegate.Field li[data-timetype="${timeType}"]`);
    if (!filter) {
      warnings.push(`未找到交易时间筛选项 ${timeType}`);
      continue;
    }

    clickElement(filter);
    const loaded = await waitForNetworkData(
      (data) => delegateSnapshots(data, timeType).length > 0,
      12000,
    );
    networkData = loaded;
    if (!delegateSnapshots(networkData, timeType).length) {
      warnings.push(`交易时间范围 ${timeType} 未捕获到接口响应`);
      continue;
    }

    let rangeCoverage = queryCoverage(networkData, timeType);
    const totalPages = Math.min(rangeCoverage.expectedPages, 200);
    for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
      if (rangeCoverage.capturedPages.has(pageNum)) continue;
      const result = await requestDelegatePage(timeType, pageNum);
      if (!result?.ok) {
        warnings.push(`交易时间范围 ${timeType} 第 ${pageNum} 页未捕获到接口响应`);
        break;
      }
      networkData = await waitForNetworkData(
        (data) => queryCoverage(data, timeType).capturedPages.has(pageNum),
        5000,
      );
      rangeCoverage = queryCoverage(networkData, timeType);
      if (!rangeCoverage.capturedPages.has(pageNum)) {
        warnings.push(`交易时间范围 ${timeType} 第 ${pageNum} 页未写入采集快照`);
        break;
      }
    }

    rangeCoverage = queryCoverage(networkData, timeType);
    if (rangeCoverage.expectedPages > 200) {
      warnings.push(`交易时间范围 ${timeType} 共 ${rangeCoverage.expectedPages} 页，超过单次采集上限 200 页`);
    } else if (rangeCoverage.capturedPages.size < rangeCoverage.expectedPages) {
      warnings.push(`交易时间范围 ${timeType} 分页未完整采集`);
    }
  }

  return { warnings };
}

function parseHtmlTable(html, selector) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const table = documentNode.querySelector(selector);
  if (!table) return { headers: [], rows: [] };
  const headers = Array.from(table.querySelectorAll("thead th, tr:first-child th")).map(textOf);
  const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
    Array.from(row.querySelectorAll("td,th")).map(textOf),
  );
  return { headers, rows };
}

function parseSingleHtml(html) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const values = Array.from(documentNode.querySelectorAll("table.fene tr:nth-child(2) td")).map(textOf);
  return {
    availableShares: numberOf(values[1]),
    shares: numberOf(values[2]),
    value: numberOf(values[3]),
  };
}

function singlePayload(networkData, dt) {
  const single = networkData.single;
  if (single?.[dt]) return single[dt];
  if (dt === "fene" && single?.succeed) return single;
  return null;
}

async function requestSinglePayload(fundCode, dt, networkData) {
  return singlePayload(networkData, dt) || requestJson(SINGLE_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
    body: JSON.stringify({ fc: fundCode, dt }),
  });
}

function holdingNameFromPayload(payload, fundCode) {
  const item = payload?.result?.assetList?.find((holding) => normalizedCode(holding.fundCode) === fundCode);
  return item?.fundName || "";
}

async function resolveFundName(fundCode, networkData, fundName) {
  if (fundName) return fundName;
  const holdPayload = networkData.hold || await requestJson(HOLD_PATH, {
    method: "POST",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  return holdingNameFromPayload(holdPayload, fundCode) || fundCode;
}

async function collectHoldingsPage(networkData) {
  const payload = networkData.hold || await requestJson(HOLD_PATH, {
    method: "POST",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  if (!payload?.succeed || !payload.result?.assetList?.length) throw new Error("未读取到持仓接口数据");
  const holdings = payload.result.assetList.map(mapHolding);
  const total = holdings.reduce((sum, item) => sum + item.amount, 0);
  return {
    holdings: holdings.map((item) => ({ ...item, ratio: total > 0 ? Number(((item.amount / total) * 100).toFixed(2)) : 0 })),
    account: {
      totalAsset: Number(payload.result.assetTotal?.[0]?.oldValue) || total,
      totalProfit: Number(payload.result.assetTotal?.[2]?.oldValue) || 0,
      profitRate: total > 0 ? Number(((Number(payload.result.assetTotal?.[2]?.oldValue) / total) * 100).toFixed(2)) : 0,
    },
  };
}

async function collectSinglePage(networkData, fundName) {
  const fundCode = normalizedCode(new URL(location.href).searchParams.get("fc"));
  if (!fundCode) throw new Error("当前页面缺少基金代码");

  const payloads = await Promise.all(["fene", "yingkui", "dingtou"].map(async (dt) => {
    try {
      const payload = await requestSinglePayload(fundCode, dt, networkData);
      return [dt, payload?.succeed && typeof payload.result === "string" ? payload : null];
    } catch {
      return [dt, null];
    }
  }));
  const responses = Object.fromEntries(payloads);
  const sharePayload = responses.fene;
  if (!sharePayload) throw new Error("未读取到单基金份额接口数据");

  const detail = parseSingleHtml(sharePayload.result);
  const warnings = [];
  const profitPayload = responses.yingkui;
  const planPayload = responses.dingtou;
  if (!profitPayload) warnings.push("未读取到单基金每日盈亏接口数据");
  if (!planPayload) warnings.push("未读取到单基金定投计划接口数据");

  const resolvedFundName = await resolveFundName(fundCode, networkData, fundName);
  const holding = {
    code: fundCode,
    name: resolvedFundName,
    amount: detail.value,
    profit: 0,
    profitRate: 0,
    ratio: 100,
    shares: detail.shares,
    availableShares: detail.availableShares,
    details: {
      shareTable: detail,
      shareHtml: sharePayload.result,
      profitTable: profitPayload
        ? parseHtmlTable(profitPayload.result, "table.yingkui")
        : { headers: [], rows: [] },
      profitHtml: profitPayload?.result || "",
      investmentPlanTable: planPayload
        ? parseHtmlTable(planPayload.result, "table.dingtou")
        : { headers: [], rows: [] },
      investmentPlanHtml: planPayload?.result || "",
    },
  };
  return {
    holdings: [holding],
    account: { totalAsset: detail.value, totalProfit: holding.profit, profitRate: holding.profitRate },
    warnings,
  };
}

function delegateItems(networkData) {
  const snapshots = Array.isArray(networkData.delegate) ? networkData.delegate : [];
  return snapshots.flatMap((snapshot) => Array.isArray(snapshot?.response?.data?.list) ? snapshot.response.data.list : []);
}

function uniqueTransactions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.details?.id || [item.date, item.fundCode, item.type, item.amount, item.confirmedAmount, item.status].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pageUrl() {
  const current = new URL(location.href);
  current.hash = "";
  return current.toString();
}

async function collect(fundName) {
  const url = location.href;
  if (!/trade\.1234567\.com\.cn|query\.1234567\.com\.cn/.test(url)) {
    return { ok: false, error: "当前页面不是支持的天天基金页面" };
  }

  const warnings = [];
  let holdings = [];
  let account = { totalAsset: 0, totalProfit: 0, profitRate: 0 };
  const networkData = await requestNetworkData();

  try {
    if (/\/myassets\/single/i.test(location.pathname)) {
      const singleResult = await collectSinglePage(networkData, fundName);
      ({ holdings, account } = singleResult);
      warnings.push(...singleResult.warnings);
    } else if (/\/myassets\/hold/i.test(location.pathname)) {
      ({ holdings, account } = await collectHoldingsPage(networkData));
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "接口数据读取失败");
  }

  let transactions = [];
  if (/query\.1234567\.com\.cn/.test(location.hostname)) {
    const rawItems = delegateItems(networkData);
    if (rawItems.length) {
      transactions = uniqueTransactions(rawItems.map(mapTransaction).filter((item) => item.fundCode));
    } else {
      warnings.push("未捕获交易接口响应，未生成交易记录");
    }
    if (Array.isArray(networkData.delegate) && networkData.delegate.length === 1) {
      warnings.push("当前仅捕获到一个交易查询响应；请切换历史时间范围并翻页后重新导出，以获取更多已加载记录");
    }
  }

  if (!holdings.length && !transactions.length) {
    return { ok: false, error: warnings.join("；") || "未识别到基金数据；请确认页面已登录并完成加载" };
  }

  return {
    ok: true,
    data: {
      version: "1.1",
      source: "1234567",
      updateTime: today(),
      account,
      holdings,
      transactions,
      raw: {
        capturedAt: new Date().toISOString(),
        pageUrl: pageUrl(),
        snapshots: Array.isArray(networkData.snapshots) ? networkData.snapshots : [],
        collectionWarnings: warnings,
      },
      collectionWarnings: warnings,
    },
  };
}

function appendWarnings(result, extraWarnings) {
  if (!result?.ok || !extraWarnings.length) return result;
  const warnings = [...new Set([...(result.data.collectionWarnings || []), ...extraWarnings])];
  result.data.collectionWarnings = warnings;
  result.data.raw.collectionWarnings = warnings;
  return result;
}

async function automatePage(mode, ranges, fundName) {
  if (mode === "query") {
    const automation = await collectQueryPages(Array.isArray(ranges) && ranges.length ? ranges : ["3", "4"]);
    return appendWarnings(await collect(fundName), automation.warnings);
  }

  if (mode === "single") {
    await waitForNetworkData(
      (data) => Boolean(data.single?.fene && data.single?.yingkui && data.single?.dingtou),
      20000,
    );
  } else if (mode === "hold") {
    await waitForNetworkData(
      (data) => Boolean(data.hold),
      15000,
    );
  }

  return collect(fundName);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "COLLECT_FUND_DATA") {
    collect().then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: `页面读取失败：${error instanceof Error ? error.message : "未知错误"}` });
    });
    return true;
  }

  if (message?.type === "AUTO_COLLECT_PAGE") {
    automatePage(message.mode, message.ranges, message.fundName).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: `自动采集失败：${error instanceof Error ? error.message : "未知错误"}` });
    });
    return true;
  }

  return undefined;
});
