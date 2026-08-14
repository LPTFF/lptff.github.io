importScripts("adapter/eastmoney-adapter.js", "collection-policy.js");

// LPTFF 采集配置：外置到 chrome.storage.local，popup「高级设置」可覆盖；默认值与原硬编码一致。
// 仅读写 storage，不触及真实采集/Cookie/Token/登录态。
const LPTFF_CONFIG_KEY = "lptffConfig";
const LPTFFConfig = {
  defaults: { pageTimeout: 30000, singleConcurrency: 4, queryRanges: ["3", "4"] },
  async load() {
    const stored = await chrome.storage.local.get(LPTFF_CONFIG_KEY);
    const cfg = stored[LPTFF_CONFIG_KEY] || {};
    return {
      pageTimeout: cfg.pageTimeout ?? this.defaults.pageTimeout,
      singleConcurrency: cfg.singleConcurrency ?? this.defaults.singleConcurrency,
      queryRanges:
        Array.isArray(cfg.queryRanges) && cfg.queryRanges.length ? cfg.queryRanges.map(String) : this.defaults.queryRanges,
    };
  },
  async save(overrides) {
    const current = await this.load();
    const next = {
      pageTimeout: Number(overrides.pageTimeout) || current.pageTimeout,
      singleConcurrency: Math.max(1, Math.min(8, Number(overrides.singleConcurrency) || current.singleConcurrency)),
      queryRanges:
        Array.isArray(overrides.queryRanges) && overrides.queryRanges.length
          ? overrides.queryRanges.map(String)
          : current.queryRanges,
    };
    await chrome.storage.local.set({ [LPTFF_CONFIG_KEY]: next });
    return next;
  },
};

const HOLD_URL = "https://trade.1234567.com.cn/myAssets/hold";
const QUERY_URL = "https://query.1234567.com.cn/";
const SINGLE_URL = (code) =>
  `https://trade.1234567.com.cn/myassets/single?iv=false&fc=${encodeURIComponent(code)}`;
const PUBLIC_FUND_URL = (code) =>
  `https://fund.eastmoney.com/${encodeURIComponent(code)}.html`;
const PUBLIC_PROFILE_URL = (code) =>
  `https://fundf10.eastmoney.com/jbgk_${encodeURIComponent(code)}.html`;
const PUBLIC_INDUSTRY_URL = (code) =>
  `https://api.fund.eastmoney.com/f10/HYPZ/?fundCode=${encodeURIComponent(code)}&year=`;
let PAGE_TIMEOUT = 30000;
let SINGLE_CONCURRENCY = 4;
let QUERY_RANGES = ["3", "4"];
const STAGING_KEY = "investmentStaging";
const RECEIPT_KEY = "investmentTransferReceipt";
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

function callChrome(target, method, ...args) {
  return new Promise((resolve, reject) => {
    method.call(target, ...args, (result) => {
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
      return await callChrome(chrome.tabs, chrome.tabs.sendMessage, tabId, message);
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw lastError || new Error("页面脚本未响应");
}

async function openAndCollect(url, mode, options = {}) {
  const tab = await callChrome(chrome.tabs, chrome.tabs.create, { url, active: false });
  if (!tab?.id) throw new Error("无法创建采集页面");
  task.tabIds.push(tab.id);

  try {
    const started = Date.now();
    while (Date.now() - started < PAGE_TIMEOUT) {
      const current = await callChrome(chrome.tabs, chrome.tabs.get, tab.id);
      if (current.status === "complete") break;
      await delay(250);
    }
    return await sendToTab(tab.id, {
      type: "AUTO_COLLECT_PAGE",
      mode,
      ranges: options.ranges,
      fundName: options.fundName,
      fundCode: options.fundCode,
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
    profit: detail.profit ?? base.profit,
    profitRate: detail.profitRate ?? base.profitRate,
    shares: detail.shares ?? base.shares,
    availableShares: detail.availableShares ?? base.availableShares,
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

function mergeFundData(holdResult, singleResults, queryResults, publicDetails = []) {
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
    publicFundDetails: publicDetails,
    raw: {
      capturedAt: new Date().toISOString(),
      pageUrl: HOLD_URL,
      snapshots: mergeSnapshots([holdResult, ...singleResults, ...queryResultList]),
      collectionWarnings: [...new Set(warnings)],
    },
    collectionWarnings: [...new Set(warnings)],
  });
}

async function stageInvestmentDataset(dataset, summary) {
  await callChrome(chrome.storage.local, chrome.storage.local.set, {
    [STAGING_KEY]: {
      protocol: dataset.version,
      capturedAt: dataset.capturedAt,
      status: "pending",
      dataset,
    },
    [RECEIPT_KEY]: {
      protocol: dataset.version,
      capturedAt: dataset.capturedAt,
      status: "pending",
      summary,
    },
  });
}

async function getStaging() {
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, STAGING_KEY);
  return result?.[STAGING_KEY] || null;
}

async function getTransferStatus() {
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, [STAGING_KEY, RECEIPT_KEY]);
  return {
    extensionVersion: chrome.runtime.getManifest().version,
    pending: Boolean(result?.[STAGING_KEY]),
    receipt: result?.[RECEIPT_KEY] || null,
    collection: taskSnapshot(),
  };
}

async function acknowledgeStaging() {
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, [STAGING_KEY, RECEIPT_KEY]);
  const staging = result?.[STAGING_KEY];
  const receipt = result?.[RECEIPT_KEY];
  await callChrome(chrome.storage.local, chrome.storage.local.remove, STAGING_KEY);
  if (staging || receipt) {
    await callChrome(chrome.storage.local, chrome.storage.local.set, {
      [RECEIPT_KEY]: {
        protocol: staging?.protocol || receipt?.protocol || "2.0",
        capturedAt: staging?.capturedAt || receipt?.capturedAt || "",
        acknowledgedAt: new Date().toISOString(),
        status: "imported",
        summary: receipt?.summary,
      },
    });
  }
}

async function discardStaging() {
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, [STAGING_KEY, RECEIPT_KEY]);
  const staging = result?.[STAGING_KEY];
  const receipt = result?.[RECEIPT_KEY];
  await callChrome(chrome.storage.local, chrome.storage.local.remove, STAGING_KEY);
  if (staging || receipt) {
    await callChrome(chrome.storage.local, chrome.storage.local.set, {
      [RECEIPT_KEY]: {
        protocol: staging?.protocol || receipt?.protocol || "2.0",
        capturedAt: staging?.capturedAt || receipt?.capturedAt || "",
        acknowledgedAt: new Date().toISOString(),
        status: "discarded",
        summary: receipt?.summary,
      },
    });
  }
}

async function downloadData(data, filename = "fund-data.json") {
  const content = JSON.stringify(data, null, 2);
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  await callChrome(chrome.downloads, chrome.downloads.download, {
    url,
    filename,
    saveAs: true,
    conflictAction: "uniquify",
  });
}

async function closeTaskTabs() {
  const tabIds = [...task.tabIds];
  task.tabIds = [];
  await Promise.all(tabIds.map(async (tabId) => {
    try {
      await callChrome(chrome.tabs, chrome.tabs.remove, tabId);
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

async function collectPublicCurrency(code) {
  const response = await fetch(PUBLIC_FUND_URL(code), { credentials: "omit" });
  if (!response.ok) throw new Error(`基金详情请求失败（HTTP ${response.status}）`);
  const html = await response.text();
  const match = html.match(/\bvar\s+currency\s*=\s*["']([^"']+)["']/i);
  return match ? String(match[1]).trim() : "";
}

async function collectPublicIndustry(code) {
  const response = await fetch(PUBLIC_INDUSTRY_URL(code), {
    credentials: "omit",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`行业配置请求失败（HTTP ${response.status}）`);
  const payload = await response.json();
  if (payload?.ErrCode !== 0) throw new Error(payload?.ErrMsg || "行业配置未返回有效数据");
  const latest = Array.isArray(payload?.Data?.QuarterInfos) ? payload.Data.QuarterInfos[0] : null;
  return {
    asOf: latest?.JZRQ || undefined,
    industries: Array.isArray(latest?.HYPZInfo)
      ? latest.HYPZInfo.map((item) => ({
          name: String(item?.HYMC || "").trim(),
          weightPct: Number(item?.ZJZBL),
        })).filter((item) => item.name && Number.isFinite(item.weightPct) && item.weightPct > 0)
      : [],
  };
}

async function collectPublicDetail(holding) {
  const code = normalizedCode(holding.code);
  const profileResult = await openAndCollect(PUBLIC_PROFILE_URL(code), "public-profile", {
    fundCode: code,
  });
  if (!profileResult?.ok || !profileResult.data) {
    throw new Error(profileResult?.error || "公开基金概况未返回数据");
  }
  const optional = await Promise.allSettled([
    collectPublicCurrency(code),
    collectPublicIndustry(code),
  ]);
  const currency = optional[0].status === "fulfilled" ? optional[0].value : "";
  const industry = optional[1].status === "fulfilled" ? optional[1].value : { industries: [] };
  if (optional[0].status === "rejected") {
    task.warnings.push(`${code}：${optional[0].reason instanceof Error ? optional[0].reason.message : "计价币种采集失败"}`);
  }
  if (optional[1].status === "rejected") {
    task.warnings.push(`${code}：${optional[1].reason instanceof Error ? optional[1].reason.message : "行业配置采集失败"}`);
  }
  return { ...profileResult.data, ...industry, currency: currency || undefined };
}

async function collectPublicDetails(holdings) {
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
        results.push(await collectPublicDetail(holding));
      } catch (error) {
        task.warnings.push(`${code}：${error instanceof Error ? error.message : "公开基金档案采集失败"}`);
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

async function runAutoCollection(options = {}) {
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
    // 每次采集开始时加载用户配置（popup「高级设置」覆盖默认值），下次采集生效。
    const cfg = await LPTFFConfig.load();
    PAGE_TIMEOUT = cfg.pageTimeout;
    SINGLE_CONCURRENCY = cfg.singleConcurrency;
    QUERY_RANGES = cfg.queryRanges;
    setStage("hold", { currentFund: "" });
    const holdResult = await openAndCollect(HOLD_URL, "hold");
    if (!holdResult?.ok || !holdResult.data) {
      throw new Error(holdResult?.error || "未读取到持仓数据，请确认已登录天天基金");
    }

    const holdings = holdResult.data.holdings || [];
    const codes = [...new Set(holdings.map((holding) => normalizedCode(holding.code)).filter(Boolean))];
    task.fundTotal = codes.length * 2;
    notifyProgress();
    setStage("single", { currentFund: "", activeFunds: [] });
    const singleResults = await collectSingles(holdings);
    const publicDetails = await collectPublicDetails(holdings);

    setStage("transactions", { currentFund: "", activeFunds: [] });
    const queryResults = await Promise.all(QUERY_RANGES.map(collectQueryRange));
    task.transactionSnapshots = queryResults
      .filter(Boolean)
      .flatMap((result) => result.data?.raw?.snapshots || [])
      .filter((snapshot) => snapshot.key === "delegate")
      .length;
    notifyProgress();

    setStage("downloading");
    const data = mergeFundData(holdResult, singleResults, queryResults, publicDetails);
    const investmentDataset = globalThis.LPTFFInvestmentAdapter.toInvestmentDataset(data);
    const persistence = globalThis.LPTFFCollectionPolicy.persistencePlan(options);
    const summary = globalThis.LPTFFCollectionPolicy.summarizeDataset(
      investmentDataset,
      persistence.downloadBackup,
    );
    if (persistence.stageDataset) await stageInvestmentDataset(investmentDataset, summary);
    if (persistence.downloadBackup) await downloadData(data);
    setStage("completed", {
      currentFund: "",
      activeFunds: [],
      transactionSnapshots: data.raw.snapshots.filter((snapshot) => snapshot.key === "delegate").length,
    });
    return { ok: true, summary };
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
  const [tab] = await callChrome(chrome.tabs, chrome.tabs.query, { active: true, lastFocusedWindow: true });
  if (!tab?.id) throw new Error("找不到当前页面");
  const response = await sendToTab(tab.id, { type: "COLLECT_FUND_DATA" });
  if (!response?.ok || !response.data) throw new Error(response?.error || "当前页面未识别到基金数据");
  await downloadData(response.data);
  return response;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_INVESTMENT_STAGING") {
    getStaging().then((staging) => sendResponse({ ok: true, staging })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "ACK_INVESTMENT_STAGING") {
    acknowledgeStaging().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "GET_INVESTMENT_STATUS") {
    getTransferStatus().then((status) => sendResponse({ ok: true, status })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "DISCARD_INVESTMENT_STAGING") {
    discardStaging().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "START_AUTO_COLLECTION") {
    const options = globalThis.LPTFFCollectionPolicy.collectionOptions(
      message,
      sender,
      chrome.runtime.getURL(""),
    );
    runAutoCollection(options).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "GET_CONFIG") {
    LPTFFConfig.load().then((config) => sendResponse({ ok: true, config })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "SAVE_CONFIG") {
    LPTFFConfig.save(message.config || {}).then((config) => sendResponse({ ok: true, config })).catch((error) => sendResponse({ ok: false, error: error.message }));
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
