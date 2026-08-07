const HOLD_URL = "https://trade.1234567.com.cn/myAssets/hold";
const QUERY_URL = "https://query.1234567.com.cn/";
const SINGLE_URL = (code) =>
  `https://trade.1234567.com.cn/myassets/single?iv=false&fc=${encodeURIComponent(code)}`;
const PAGE_TIMEOUT = 30000;
const SINGLE_CONCURRENCY = 4;
const QUERY_RANGES = ["3", "4"];
const SENSITIVE_KEY = /(?:authorization|access[-_]?token|token|cookie|set[-_]?cookie|session(?:[-_]?id)?|password|secret)/i;

const task = {
  running: false,
  stage: "idle",
  currentFund: "",
  fundTotal: 0,
  completedFunds: 0,
  transactionSnapshots: 0,
  activeFunds: [],
  warnings: [],
  tabIds: [],
};

function taskSnapshot() {
  return {
    running: task.running,
    stage: task.stage,
    currentFund: task.currentFund,
    fundTotal: task.fundTotal,
    completedFunds: task.completedFunds,
    transactionSnapshots: task.transactionSnapshots,
    activeFunds: [...task.activeFunds],
    warnings: [...task.warnings],
  };
}

function notifyProgress(extra = {}) {
  const message = { type: "COLLECTION_PROGRESS", ...taskSnapshot(), ...extra };
  chrome.runtime.sendMessage(message).catch(() => {});
}

function setStage(stage, extra = {}) {
  task.stage = stage;
  Object.assign(task, extra);
  notifyProgress();
}

function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function callChrome(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

async function sendToTab(tabId, message) {
  let lastError;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await callChrome(chrome.tabs.sendMessage, tabId, message);
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw lastError || new Error("页面脚本未响应");
}

async function openAndCollect(url, mode, options = {}) {
  const tab = await callChrome(chrome.tabs.create, { url, active: false });
  if (!tab?.id) throw new Error("无法创建采集页面");
  task.tabIds.push(tab.id);

  try {
    const started = Date.now();
    while (Date.now() - started < PAGE_TIMEOUT) {
      const current = await callChrome(chrome.tabs.get, tab.id);
      if (current.status === "complete") break;
      await delay(250);
    }
    return await sendToTab(tab.id, {
      type: "AUTO_COLLECT_PAGE",
      mode,
      ranges: options.ranges,
      fundName: options.fundName,
    });
  } catch (error) {
    throw new Error(`${mode} 页面采集失败：${error instanceof Error ? error.message : "未知错误"}`);
  }
}

function safeValue(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => safeValue(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([name, item]) => [name, safeValue(item, name)])
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
}

function snapshotFingerprint(snapshot) {
  return JSON.stringify({
    key: snapshot.key,
    method: snapshot.method,
    path: snapshot.path,
    query: snapshot.query,
    requestBody: snapshot.requestBody,
  });
}

function mergeSnapshots(results) {
  const seen = new Set();
  return results.flatMap((result) => result?.data?.raw?.snapshots || []).filter((snapshot) => {
    const fingerprint = snapshotFingerprint(snapshot);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function normalizedCode(value) {
  const match = String(value || "").match(/\b\d{6}\b/);
  return match ? match[0] : "";
}

function mergeHolding(base, detail) {
  if (!detail) return base;
  return {
    ...base,
    shares: detail.shares || base.shares,
    availableShares: detail.availableShares || base.availableShares,
    details: { ...(base.details || {}), ...(detail.details || {}) },
  };
}

function uniqueTransactions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.details?.id || [
      item?.date,
      item?.fundCode,
      item?.type,
      item?.amount,
      item?.confirmedAmount,
      item?.status,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeFundData(holdResult, singleResults, queryResults) {
  const holdData = holdResult.data;
  const queryResultList = Array.isArray(queryResults)
    ? queryResults.filter(Boolean)
    : queryResults
      ? [queryResults]
      : [];
  const detailByCode = new Map(
    singleResults
      .map((result) => result?.data?.holdings?.[0])
      .filter(Boolean)
      .map((holding) => [normalizedCode(holding.code), holding]),
  );
  const holdings = (holdData.holdings || []).map((holding) =>
    mergeHolding(holding, detailByCode.get(normalizedCode(holding.code))),
  );
  const transactions = uniqueTransactions(queryResultList.flatMap((result) => result?.data?.transactions || []));
  const warnings = [
    ...(holdResult.data.collectionWarnings || []),
    ...singleResults.flatMap((result) => result?.data?.collectionWarnings || []),
    ...queryResultList.flatMap((result) => result?.data?.collectionWarnings || []),
    ...task.warnings,
  ];

  return safeValue({
    version: "1.1",
    source: "1234567",
    updateTime: new Date().toISOString().slice(0, 10),
    account: holdData.account,
    holdings,
    transactions,
    raw: {
      capturedAt: new Date().toISOString(),
      pageUrl: HOLD_URL,
      snapshots: mergeSnapshots([holdResult, ...singleResults, ...queryResultList]),
      collectionWarnings: [...new Set(warnings)],
    },
    collectionWarnings: [...new Set(warnings)],
  });
}

async function downloadData(data) {
  const content = JSON.stringify(data, null, 2);
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  await callChrome(chrome.downloads.download, {
    url,
    filename: "fund-data.json",
    saveAs: true,
    conflictAction: "uniquify",
  });
}

async function closeTaskTabs() {
  const tabIds = [...task.tabIds];
  task.tabIds = [];
  await Promise.all(tabIds.map(async (tabId) => {
    try {
      await callChrome(chrome.tabs.remove, tabId);
    } catch {
      return undefined;
    }
    return undefined;
  }));
}

async function collectSingles(holdings) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= holdings.length) return;
      const holding = holdings[index];
      const code = normalizedCode(holding.code);
      task.activeFunds = [...task.activeFunds, code];
      notifyProgress();
      try {
        const result = await openAndCollect(SINGLE_URL(code), "single", {
          fundName: holding.name,
        });
        if (result?.ok && result.data) results.push(result);
        else task.warnings.push(`${code}：${result?.error || "单基金详情未返回数据"}`);
      } catch (error) {
        task.warnings.push(`${code}：${error instanceof Error ? error.message : "单基金详情采集失败"}`);
      } finally {
        task.activeFunds = task.activeFunds.filter((item) => item !== code);
        task.completedFunds += 1;
        notifyProgress();
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(SINGLE_CONCURRENCY, holdings.length) }, worker));
  return results;
}

async function collectQueryRange(timeType) {
  try {
    const result = await openAndCollect(QUERY_URL, "query", { ranges: [timeType] });
    if (!result?.ok && !result?.data) {
      task.warnings.push(`交易时间范围 ${timeType}：${result?.error || "未返回数据"}`);
      return null;
    }
    return result;
  } catch (error) {
    task.warnings.push(`交易时间范围 ${timeType}：${error instanceof Error ? error.message : "交易查询采集失败"}`);
    return null;
  }
}

async function runAutoCollection() {
  if (task.running) throw new Error("已有采集任务正在运行");
  task.running = true;
  task.warnings = [];
  task.currentFund = "";
  task.fundTotal = 0;
  task.completedFunds = 0;
  task.transactionSnapshots = 0;
  task.activeFunds = [];
  notifyProgress();

  try {
    setStage("hold", { currentFund: "" });
    const holdResult = await openAndCollect(HOLD_URL, "hold");
    if (!holdResult?.ok || !holdResult.data) {
      throw new Error(holdResult?.error || "未读取到持仓数据，请确认已登录天天基金");
    }

    const holdings = holdResult.data.holdings || [];
    const codes = [...new Set(holdings.map((holding) => normalizedCode(holding.code)).filter(Boolean))];
    task.fundTotal = codes.length;
    notifyProgress();
    setStage("single", { currentFund: "", activeFunds: [] });
    const singleResults = await collectSingles(holdings);

    setStage("transactions", { currentFund: "", activeFunds: [] });
    const queryResults = await Promise.all(QUERY_RANGES.map(collectQueryRange));
    task.transactionSnapshots = queryResults
      .filter(Boolean)
      .flatMap((result) => result.data?.raw?.snapshots || [])
      .filter((snapshot) => snapshot.key === "delegate")
      .length;
    notifyProgress();

    setStage("downloading");
    const data = mergeFundData(holdResult, singleResults, queryResults);
    await downloadData(data);
    setStage("completed", {
      currentFund: "",
      activeFunds: [],
      transactionSnapshots: data.raw.snapshots.filter((snapshot) => snapshot.key === "delegate").length,
    });
    return { ok: true, data };
  } catch (error) {
    task.warnings.push(error instanceof Error ? error.message : "自动采集失败");
    setStage("error");
    return { ok: false, error: task.warnings[task.warnings.length - 1], warnings: [...task.warnings] };
  } finally {
    await closeTaskTabs();
    task.running = false;
    if (task.stage !== "completed" && task.stage !== "error") task.stage = "idle";
    notifyProgress();
  }
}

async function exportCurrentPage() {
  const [tab] = await callChrome(chrome.tabs.query, { active: true, lastFocusedWindow: true });
  if (!tab?.id) throw new Error("找不到当前页面");
  const response = await sendToTab(tab.id, { type: "COLLECT_FUND_DATA" });
  if (!response?.ok || !response.data) throw new Error(response?.error || "当前页面未识别到基金数据");
  await downloadData(response.data);
  return response;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "START_AUTO_COLLECTION") {
    runAutoCollection().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "GET_COLLECTION_STATUS") {
    sendResponse({ ok: true, status: taskSnapshot() });
    return false;
  }

  if (message?.type === "EXPORT_CURRENT_PAGE") {
    exportCurrentPage().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return undefined;
});
