(() => {
if (globalThis.__LPTFF_COLLECTOR_READY__) return;
globalThis.__LPTFF_COLLECTOR_READY__ = true;

const DATE_RE = /(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/;
const HOLD_PATH = "/request/hold";
const SINGLE_PATH = "/http/single/get";
const SENSITIVE_KEY = /(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|secret|bank(?:card)?|cardNo|phone|mobile|email|identity|idCard|cert(?:ificate)?(?:No|Id)?|(?:user|customer|account)(?:Name|No|Id))/i;

function textOf(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function normalizedCode(value) {
  const match = String(value || "").match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

function safeValue(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => safeValue(item)).filter((item) => item !== undefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([name]) => !SENSITIVE_KEY.test(name))
      .map(([name, item]) => [name, safeValue(item, name)])
      .filter(([, item]) => item !== undefined));
  }
  return value;
}

async function requestJson(path, options) {
  const response = await fetch(path, { credentials: "include", ...options });
  if (!response.ok) throw new Error(`接口请求失败（${response.status}）`);
  return safeValue(await response.json());
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
      if (event.source === window && event.origin === location.origin && event.data?.type === "LPTFF_NETWORK_DATA") {
        finish(event.data.data);
      }
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "LPTFF_GET_NETWORK_DATA" }, location.origin);
    setTimeout(() => finish({}), timeout);
  });
}

function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function waitForNetworkData(predicate, timeout = 12000) {
  const deadline = Date.now() + timeout;
  let latest = {};
  while (Date.now() < deadline) {
    latest = await requestNetworkData(300);
    if (predicate(latest)) return latest;
    await sleep(200);
  }
  return latest;
}

function clickElement(element) {
  if (!element) return false;
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  return true;
}

function parseHtmlTables(html) {
  const documentNode = new DOMParser().parseFromString(String(html || ""), "text/html");
  return Array.from(documentNode.querySelectorAll("table")).map((table, index) => {
    const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll(":scope > th, :scope > td")).map(textOf),
    ).filter((row) => row.some(Boolean));
    return {
      key: table.id || Array.from(table.classList).join(".") || `table-${index + 1}`,
      headers: rows[0] || [],
      rows: rows.slice(1),
    };
  });
}

function compactSinglePayload(payload) {
  if (!payload) return null;
  const { result, ...metadata } = payload;
  return {
    metadata: safeValue(metadata),
    tables: typeof result === "string" ? parseHtmlTables(result) : [],
  };
}

async function collectHoldSource() {
  const networkData = await waitForNetworkData((data) => Boolean(data.hold), 8000);
  const payload = networkData.hold || await requestJson(HOLD_PATH, {
    method: "POST",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  if (!payload?.succeed || !Array.isArray(payload.result?.assetList)) throw new Error("未读取到持仓接口数据");
  const result = safeValue(payload.result);
  const holdings = result.assetList;
  const { assetList: _assetList, ...account } = result;
  return {
    observedAt: new Date().toISOString(),
    account,
    holdings,
    requestCount: networkData.hold ? 0 : 1,
  };
}

async function collectFundDetail(holding) {
  const fundCode = normalizedCode(holding?.fundCode || holding?.code);
  if (!fundCode) return { fundCode: "", warnings: ["持仓缺少基金代码"], responses: {} };
  const entries = await Promise.all(["fene", "yingkui", "dingtou"].map(async (kind) => {
    try {
      const payload = await requestJson(SINGLE_PATH, {
        method: "POST",
        headers: { "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
        body: JSON.stringify({ fc: fundCode, dt: kind }),
      });
      return [kind, payload?.succeed ? compactSinglePayload(payload) : null, payload?.succeed ? "" : `${kind} 未返回成功结果`];
    } catch (error) {
      return [kind, null, `${kind}：${error instanceof Error ? error.message : "请求失败"}`];
    }
  }));
  const responses = Object.fromEntries(entries.map(([kind, response]) => [kind, response]));
  const warnings = entries.map(([, , warning]) => warning).filter(Boolean).map((warning) => `${fundCode}：${warning}`);
  return {
    fundCode,
    fundName: holding?.fundName || holding?.name || undefined,
    responses,
    warnings,
  };
}

async function collectFundDetails(holdings, concurrency = 4) {
  const results = new Array(holdings.length);
  let nextIndex = 0;
  let completed = 0;
  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= holdings.length) return;
      results[index] = await collectFundDetail(holdings[index]);
      completed += 1;
      chrome.runtime.sendMessage({
        type: "SOURCE_BRANCH_PROGRESS",
        branch: "privateDetails",
        completed,
        total: holdings.length,
      }).catch(() => {});
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), holdings.length || 1) }, worker));
  return { items: results.filter(Boolean), requestCount: holdings.length * 3 };
}

function delegateSnapshots(networkData, timeType) {
  return (networkData.snapshots || []).filter((snapshot) =>
    snapshot.key === "delegate" && String(snapshot.requestBody?.timeType) === String(timeType),
  );
}

function queryCoverage(snapshots) {
  const pageSize = Math.max(...snapshots.map((snapshot) => Number(snapshot.requestBody?.pageSize) || 0), 0);
  const totalCount = Math.max(...snapshots.map((snapshot) => Number(snapshot.response?.data?.totalCount) || 0), 0);
  const expectedPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const pages = new Map(snapshots
    .map((snapshot) => [Number(snapshot.requestBody?.pageNum) || 0, snapshot])
    .filter(([pageNum]) => pageNum > 0));
  return { pageSize, totalCount, expectedPages, pages };
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

async function concurrentMap(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), items.length || 1) }, worker));
  return results;
}

function transactionPage(snapshot) {
  const response = snapshot?.response || {};
  const data = response.data || {};
  const { list, ...dataMeta } = data;
  return {
    pageNum: Number(snapshot?.requestBody?.pageNum) || 0,
    request: snapshot?.requestBody || {},
    responseMeta: { ...response, data: dataMeta },
    records: Array.isArray(list) ? list : [],
  };
}

function dedupeTransactionPages(snapshots) {
  const seen = new Set();
  let duplicateCount = 0;
  const pages = [...queryCoverage(snapshots).pages.values()]
    .map(transactionPage)
    .sort((a, b) => a.pageNum - b.pageNum)
    .map((page) => ({
      ...page,
      records: page.records.filter((record) => {
        const key = String(record?.id || record?.traceNo || JSON.stringify(record));
        if (seen.has(key)) {
          duplicateCount += 1;
          return false;
        }
        seen.add(key);
        return true;
      }),
    }));
  return { pages, duplicateCount };
}

async function collectTransactionRange(timeType, concurrency, progress) {
  const warnings = [];
  const filter = document.querySelector(`.ulFilter.Delegate.Field li[data-timetype="${timeType}"]`);
  if (!filter) return { timeType: String(timeType), pages: [], warnings: [`未找到交易时间筛选项 ${timeType}`] };
  // “历史交易查询（超过1年）”是自定义日期范围（data-init=diy），点击只会弹出日期框，不会自动发起接口请求。
  if (String(filter.getAttribute("data-init")) === "diy") {
    return {
      timeType: String(timeType),
      pages: [],
      skipReason: "custom-date-dialog",
      note: "历史交易查询（超过1年）需自定义日期范围，简单时间筛选不适用；如需更长历史请在插件设置中调整查询范围",
    };
  }
  clickElement(filter);
  const networkData = await waitForNetworkData((data) => delegateSnapshots(data, timeType).length > 0, 12000);
  const initialSnapshots = delegateSnapshots(networkData, timeType);
  if (!initialSnapshots.length) return { timeType: String(timeType), pages: [], warnings: [`交易时间范围 ${timeType} 未捕获到接口响应`] };

  const range = queryCoverage(initialSnapshots);
  const totalPages = Math.min(range.expectedPages, 200);
  const missingPages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((pageNum) => !range.pages.has(pageNum));
  progress.total += range.pages.size + missingPages.length;
  progress.completed += range.pages.size;
  chrome.runtime.sendMessage({
    type: "SOURCE_BRANCH_PROGRESS",
    branch: "transactions",
    completed: progress.completed,
    total: progress.total,
  }).catch(() => {});
  const fetched = await concurrentMap(missingPages, concurrency, async (pageNum) => {
    let result;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = await requestDelegatePage(timeType, pageNum);
      if (result?.ok && result.snapshot) break;
      await sleep(500 * (attempt + 1));
    }
    progress.completed += 1;
    chrome.runtime.sendMessage({
      type: "SOURCE_BRANCH_PROGRESS",
      branch: "transactions",
      completed: progress.completed,
      total: progress.total,
    }).catch(() => {});
    if (!result?.ok || !result.snapshot) warnings.push(result?.error || `交易时间范围 ${timeType} 第 ${pageNum} 页未返回`);
    return result?.snapshot || null;
  });
  const snapshots = [...initialSnapshots, ...fetched.filter(Boolean)];
  const finalCoverage = queryCoverage(snapshots);
  const deduped = dedupeTransactionPages(snapshots);
  if (range.expectedPages > 200) warnings.push(`交易时间范围 ${timeType} 共 ${range.expectedPages} 页，超过单次采集上限 200 页`);
  else if (finalCoverage.pages.size < range.expectedPages) warnings.push(`交易时间范围 ${timeType} 分页未完整采集`);
  if (deduped.duplicateCount > 0) warnings.push(`交易分页发现 ${deduped.duplicateCount} 条跨页重复记录，结果需重新采集`);
  const recordCount = deduped.pages.reduce((sum, page) => sum + page.records.length, 0);
  if (range.expectedPages <= 200 && finalCoverage.pages.size === range.expectedPages && recordCount !== range.totalCount) {
    warnings.push(`交易分页记录数 ${recordCount}/${range.totalCount}，与接口总数不一致`);
  }
  return {
    timeType: String(timeType),
    pageSize: range.pageSize,
    totalCount: range.totalCount,
    expectedPages: range.expectedPages,
    pages: deduped.pages,
    warnings,
  };
}

async function collectTransactionRanges(ranges = ["3", "4"], concurrency = 4) {
  const progress = { completed: 0, total: 0 };
  const results = [];
  for (const timeType of ranges) {
    const result = await collectTransactionRange(timeType, concurrency, progress);
    results.push(result);
  }
  return {
    ranges: results,
    requestCount: results.reduce((sum, range) => sum + range.pages.length, 0),
  };
}

async function automatePage(message) {
  if (message.mode === "hold") return { ok: true, data: await collectHoldSource() };
  if (message.mode === "fund-details") {
    return { ok: true, data: await collectFundDetails(message.holdings || [], message.concurrency || 4) };
  }
  if (message.mode === "transactions") {
    return { ok: true, data: await collectTransactionRanges(message.ranges || ["3", "4"], message.concurrency || 4) };
  }
  return { ok: false, error: `不支持的采集模式：${message.mode || "unknown"}` };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "LPTFF_COLLECTOR_PING") {
    sendResponse({ ok: true, url: location.href });
    return false;
  }
  if (message?.type === "COLLECT_FUND_DATA") {
    const mode = /query\.1234567\.com\.cn/.test(location.hostname) ? "transactions" : "hold";
    automatePage({ mode }).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: `页面读取失败：${error instanceof Error ? error.message : "未知错误"}` });
    });
    return true;
  }
  if (message?.type === "AUTO_COLLECT_PAGE") {
    automatePage(message).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: `自动采集失败：${error instanceof Error ? error.message : "未知错误"}` });
    });
    return true;
  }
  return undefined;
});
})();
