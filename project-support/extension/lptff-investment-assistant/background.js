importScripts("source-capture.js", "collection-policy.js");

const LPTFF_CONFIG_KEY = "lptffConfig";
const LPTFFConfig = {
  defaults: { pageTimeout: 30000, singleConcurrency: 4, queryConcurrency: 4, queryRanges: ["3"] },
  async load() {
    const stored = await chrome.storage.local.get(LPTFF_CONFIG_KEY);
    const cfg = stored[LPTFF_CONFIG_KEY] || {};
    return {
      pageTimeout: cfg.pageTimeout ?? this.defaults.pageTimeout,
      singleConcurrency: cfg.singleConcurrency ?? this.defaults.singleConcurrency,
      queryConcurrency: cfg.queryConcurrency ?? this.defaults.queryConcurrency,
      queryRanges: Array.isArray(cfg.queryRanges) && cfg.queryRanges.length
        ? cfg.queryRanges.map(String)
        : this.defaults.queryRanges,
    };
  },
  async save(overrides) {
    const current = await this.load();
    const next = {
      pageTimeout: Number(overrides.pageTimeout) || current.pageTimeout,
      singleConcurrency: boundedConcurrency(overrides.singleConcurrency, current.singleConcurrency),
      queryConcurrency: boundedConcurrency(overrides.queryConcurrency, current.queryConcurrency),
      queryRanges: Array.isArray(overrides.queryRanges) && overrides.queryRanges.length
        ? overrides.queryRanges.map(String)
        : current.queryRanges,
    };
    await chrome.storage.local.set({ [LPTFF_CONFIG_KEY]: next });
    return next;
  },
};

const HOLD_URL = "https://trade.1234567.com.cn/myAssets/hold";
const QUERY_URL = "https://query.1234567.com.cn/";
const STAGING_KEY = "investmentStaging";
const RECEIPT_KEY = "investmentTransferReceipt";
const OFFSCREEN_PATH = "offscreen/offscreen.html";
let PAGE_TIMEOUT = 30000;

function boundedConcurrency(value, fallback = 4) {
  return Math.max(1, Math.min(8, Number(value) || fallback));
}

function emptyBranch(label) {
  return { label, status: "pending", completed: 0, total: 0, durationMs: 0 };
}

const task = {
  running: false,
  stage: "idle",
  warnings: [],
  tabIds: [],
  tabPeak: 0,
  requestCounts: { hold: 0, privateDetails: 0, publicFunds: 0, transactions: 0 },
  branches: {
    privateDetails: emptyBranch("账户内基金详情"),
    publicFunds: emptyBranch("公开基金档案"),
    transactions: emptyBranch("交易分页"),
  },
  metrics: { startedAt: "", totalMs: 0, requestCount: 0, transactionPages: 0, stagingBytes: 0, temporaryTabPeak: 0 },
};

function taskSnapshot() {
  return {
    running: task.running,
    stage: task.stage,
    warnings: [...task.warnings],
    branches: Object.fromEntries(Object.entries(task.branches).map(([name, branch]) => [name, { ...branch }])),
    metrics: { ...task.metrics, elapsedMs: task.running && task.metrics.startedAt ? Date.now() - Date.parse(task.metrics.startedAt) : task.metrics.totalMs },
  };
}

function notifyProgress(extra = {}) {
  chrome.runtime.sendMessage({ type: "COLLECTION_PROGRESS", ...taskSnapshot(), ...extra }).catch(() => {});
}

function setStage(stage) {
  task.stage = stage;
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

function isMissingReceiverError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /Could not establish connection|Receiving end does not exist/i.test(message);
}

async function injectCollectorReceiver(tabId) {
  await callChrome(chrome.scripting, chrome.scripting.executeScript, {
    target: { tabId },
    world: "MAIN",
    files: ["content/network-bridge.js"],
  });
  await callChrome(chrome.scripting, chrome.scripting.executeScript, {
    target: { tabId },
    world: "ISOLATED",
    files: ["content/collector.js"],
  });
}

async function sendToTab(tabId, message) {
  let lastError;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await callChrome(chrome.tabs, chrome.tabs.sendMessage, tabId, message);
    } catch (error) {
      lastError = error;
      if (attempt === 1 && isMissingReceiverError(error)) {
        try {
          await injectCollectorReceiver(tabId);
        } catch (injectError) {
          lastError = injectError;
        }
      }
      await delay(500);
    }
  }
  if (isMissingReceiverError(lastError)) {
    throw new Error("天天基金采集脚本未连接。请确认页面已登录并完成加载，然后重新采集");
  }
  throw lastError || new Error("天天基金采集页面未响应");
}

async function openCollectorTab(url) {
  const tab = await callChrome(chrome.tabs, chrome.tabs.create, { url, active: false });
  if (!tab?.id) throw new Error("无法创建采集页面");
  task.tabIds.push(tab.id);
  task.tabPeak = Math.max(task.tabPeak, task.tabIds.length);
  task.metrics.temporaryTabPeak = task.tabPeak;
  notifyProgress();
  const started = Date.now();
  while (Date.now() - started < PAGE_TIMEOUT) {
    const current = await callChrome(chrome.tabs, chrome.tabs.get, tab.id);
    if (current.status === "complete") return tab.id;
    await delay(200);
  }
  throw new Error(`采集页面加载超时：${url}`);
}

async function assertCollectorPage(tabId, expectedHostname) {
  const tab = await callChrome(chrome.tabs, chrome.tabs.get, tabId);
  const currentUrl = tab?.url || "";
  let hostname = "";
  try {
    hostname = new URL(currentUrl).hostname;
  } catch {
    // The URL check below reports the actionable collection error.
  }
  if (hostname === "login.1234567.com.cn") {
    throw new Error("天天基金登录状态已失效，请先登录天天基金并确认可以打开持仓页面，然后重新采集");
  }
  if (hostname !== expectedHostname) {
    throw new Error(`采集页面跳转到了非预期地址：${currentUrl || "未知地址"}`);
  }
}

async function closeCollectorTab(tabId) {
  task.tabIds = task.tabIds.filter((id) => id !== tabId);
  try {
    await callChrome(chrome.tabs, chrome.tabs.remove, tabId);
  } catch {
    return;
  }
}

async function closeTaskTabs() {
  const tabIds = [...task.tabIds];
  task.tabIds = [];
  await Promise.all(tabIds.map((tabId) => closeCollectorTab(tabId)));
}

async function ensureOffscreenDocument() {
  const url = chrome.runtime.getURL(OFFSCREEN_PATH);
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
    if (contexts.length) return;
  } else if (await chrome.offscreen.hasDocument()) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ["DOM_PARSER"],
    justification: "并发解析公开基金概况 HTML，避免为每只基金打开完整标签页",
  });
}

async function waitForOffscreenReceiver() {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await callChrome(chrome.runtime, chrome.runtime.sendMessage, { type: "OFFSCREEN_PING" });
      if (response?.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(isMissingReceiverError(lastError)
    ? "公开基金采集服务尚未就绪，请重新采集"
    : `公开基金采集服务启动失败：${lastError instanceof Error ? lastError.message : "未知错误"}`);
}

async function closeOffscreenDocument() {
  try {
    if (!chrome.offscreen.hasDocument || await chrome.offscreen.hasDocument()) await chrome.offscreen.closeDocument();
  } catch {
    return;
  }
}

async function collectPublicFunds(holdings, concurrency) {
  await ensureOffscreenDocument();
  try {
    await waitForOffscreenReceiver();
    const response = await callChrome(chrome.runtime, chrome.runtime.sendMessage, {
      type: "OFFSCREEN_COLLECT_PUBLIC_FUNDS",
      holdings,
      concurrency,
    });
    if (!response?.ok) throw new Error(response?.error || "公开基金档案未返回数据");
    return response.items || [];
  } finally {
    await closeOffscreenDocument();
  }
}

function startBranch(name, total = 0) {
  task.branches[name] = { ...task.branches[name], status: "running", completed: 0, total, durationMs: 0 };
  notifyProgress();
  return Date.now();
}

function finishBranch(name, startedAt, status = "completed") {
  const branch = task.branches[name];
  task.branches[name] = {
    ...branch,
    status,
    completed: status === "completed" ? Math.max(branch.completed, branch.total) : branch.completed,
    durationMs: Date.now() - startedAt,
  };
  notifyProgress();
}

function markBranchPartial(name, partial) {
  if (!partial || task.branches[name].status !== "completed") return;
  task.branches[name] = { ...task.branches[name], status: "partial" };
  notifyProgress();
}

async function runBranch(name, total, operation, fallback, warningLabel) {
  const startedAt = startBranch(name, total);
  try {
    const result = await operation();
    finishBranch(name, startedAt);
    return result;
  } catch (error) {
    const message = `${warningLabel}：${error instanceof Error ? error.message : "采集失败"}`;
    task.warnings.push(message);
    finishBranch(name, startedAt, "partial");
    return fallback;
  }
}

function buildCoverage(holdings, fundDetails, publicFunds, transactionRanges, capturedAt) {
  const completeCount = (items) => items.filter((item) => !(item.warnings || []).length).length;
  const pagedRanges = transactionRanges.filter((range) => range.skipReason !== "custom-date-dialog");
  const transactionPages = pagedRanges.reduce((sum, range) => sum + (range.pages || []).length, 0);
  const transactionExpected = pagedRanges.reduce((sum, range) => {
    const expectedPages = Math.min(range.expectedPages || 0, 200);
    return sum + (expectedPages > 0 ? expectedPages : (range.pages || []).length ? 1 : 0);
  }, 0);
  return [
    { dataset: "account", completeness: "complete", observedCount: holdings.length, capturedAt },
    { dataset: "fundDetails", completeness: completeCount(fundDetails) === holdings.length ? "complete" : fundDetails.length ? "partial" : "unknown", observedCount: fundDetails.length, expectedCount: holdings.length, capturedAt },
    { dataset: "publicFunds", completeness: completeCount(publicFunds) === holdings.length ? "complete" : publicFunds.length ? "partial" : "unknown", observedCount: publicFunds.length, expectedCount: holdings.length, capturedAt },
    { dataset: "transactions", completeness: transactionExpected > 0 && transactionPages === transactionExpected ? "complete" : transactionPages ? "partial" : "unknown", observedCount: transactionPages, expectedCount: transactionExpected, capturedAt },
  ];
}

async function stageSourceCapture(capture, summary) {
  await callChrome(chrome.storage.local, chrome.storage.local.set, {
    [STAGING_KEY]: {
      protocol: capture.protocol,
      capturedAt: capture.capturedAt,
      status: "pending",
      capture,
    },
    [RECEIPT_KEY]: {
      protocol: capture.protocol,
      capturedAt: capture.capturedAt,
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
        protocol: staging?.protocol || receipt?.protocol || globalThis.LPTFFSourceCapture.PROTOCOL,
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
        protocol: staging?.protocol || receipt?.protocol || globalThis.LPTFFSourceCapture.PROTOCOL,
        capturedAt: staging?.capturedAt || receipt?.capturedAt || "",
        acknowledgedAt: new Date().toISOString(),
        status: "discarded",
        summary: receipt?.summary,
      },
    });
  }
}

async function downloadData(data, filename, saveAs) {
  const content = JSON.stringify(data, null, 2);
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  await callChrome(chrome.downloads, chrome.downloads.download, {
    url,
    filename,
    saveAs,
    conflictAction: "overwrite",
  });
}

async function exportSourceBackup() {
  const staging = await getStaging();
  if (!staging?.capture) throw new Error("当前没有全面来源采集包，请先完成采集");
  await downloadData(staging.capture, "lptff-investment-source-capture.json", true);
  return { ok: true };
}

async function runAutoCollection() {
  if (task.running) throw new Error("已有采集任务正在运行");
  const existing = await getStaging();
  if (existing?.status === "pending") throw new Error("已有一批数据等待导入或丢弃，请先处理后再重新采集");

  task.running = true;
  task.stage = "preparing";
  task.warnings = [];
  task.tabIds = [];
  task.tabPeak = 0;
  task.requestCounts = { hold: 0, privateDetails: 0, publicFunds: 0, transactions: 0 };
  task.branches = {
    privateDetails: emptyBranch("账户内基金详情"),
    publicFunds: emptyBranch("公开基金档案"),
    transactions: emptyBranch("交易分页"),
  };
  task.metrics = { startedAt: new Date().toISOString(), totalMs: 0, requestCount: 0, transactionPages: 0, stagingBytes: 0, temporaryTabPeak: 0 };
  notifyProgress();

  let holdTabId;
  try {
    const cfg = await LPTFFConfig.load();
    PAGE_TIMEOUT = cfg.pageTimeout;
    setStage("hold");
    holdTabId = await openCollectorTab(HOLD_URL);
    await assertCollectorPage(holdTabId, "trade.1234567.com.cn");
    const holdResponse = await sendToTab(holdTabId, { type: "AUTO_COLLECT_PAGE", mode: "hold" });
    if (!holdResponse?.ok || !holdResponse.data) throw new Error(holdResponse?.error || "未读取到持仓数据，请确认已登录天天基金");
    const holdings = holdResponse.data.holdings || [];
    task.requestCounts.hold = Number(holdResponse.data.requestCount || 0);
    task.metrics.requestCount = task.requestCounts.hold;
    const capturedAt = new Date().toISOString();
    task.branches.privateDetails.total = holdings.length;
    task.branches.publicFunds.total = holdings.length;
    setStage("collecting");

    const privatePromise = runBranch(
      "privateDetails",
      holdings.length,
      async () => {
        try {
          const response = await sendToTab(holdTabId, {
            type: "AUTO_COLLECT_PAGE",
            mode: "fund-details",
            holdings,
            concurrency: cfg.singleConcurrency,
          });
          if (!response?.ok) throw new Error(response?.error || "账户内基金详情未返回数据");
          return response.data || { items: [], requestCount: 0 };
        } finally {
          await closeCollectorTab(holdTabId);
          holdTabId = undefined;
        }
      },
      { items: [], requestCount: 0 },
      "账户内基金详情不完整",
    );
    const publicPromise = runBranch(
      "publicFunds",
      holdings.length,
      async () => ({ items: await collectPublicFunds(holdings, cfg.singleConcurrency), requestCount: holdings.length * 3 }),
      { items: [], requestCount: 0 },
      "公开基金档案不完整",
    );
    const transactionPromise = runBranch(
      "transactions",
      0,
      async () => {
        const queryTabId = await openCollectorTab(QUERY_URL);
        try {
          await assertCollectorPage(queryTabId, "query.1234567.com.cn");
          const response = await sendToTab(queryTabId, {
            type: "AUTO_COLLECT_PAGE",
            mode: "transactions",
            ranges: cfg.queryRanges,
            concurrency: cfg.queryConcurrency,
          });
          if (!response?.ok) throw new Error(response?.error || "交易分页未返回数据");
          return response.data || { ranges: [], requestCount: 0 };
        } finally {
          await closeCollectorTab(queryTabId);
        }
      },
      { ranges: [], requestCount: 0 },
      "交易分页不完整",
    );

    const [privateDetails, publicFunds, transactions] = await Promise.all([privatePromise, publicPromise, transactionPromise]);
    markBranchPartial(
      "privateDetails",
      privateDetails.items.length !== holdings.length || privateDetails.items.some((item) => (item.warnings || []).length),
    );
    markBranchPartial(
      "publicFunds",
      publicFunds.items.length !== holdings.length || publicFunds.items.some((item) => (item.warnings || []).length),
    );
    markBranchPartial(
      "transactions",
      transactions.ranges.length !== cfg.queryRanges.length || transactions.ranges.some((range) => (range.warnings || []).length),
    );
    setStage("processing");
    task.metrics.requestCount = Number(holdResponse.data.requestCount || 0)
      + Number(privateDetails.requestCount || 0)
      + Number(publicFunds.requestCount || 0)
      + Number(transactions.requestCount || 0);
    task.metrics.transactionPages = (transactions.ranges || []).reduce((sum, range) => sum + (range.pages || []).length, 0);
    const metrics = {
      totalMs: Date.now() - Date.parse(task.metrics.startedAt),
      requestCount: task.metrics.requestCount,
      transactionPages: task.metrics.transactionPages,
      temporaryTabPeak: task.tabPeak,
      branches: Object.fromEntries(Object.entries(task.branches).map(([name, branch]) => [name, { durationMs: branch.durationMs, status: branch.status }])),
    };
    const capture = globalThis.LPTFFSourceCapture.buildCapture({
      capturedAt,
      account: holdResponse.data.account,
      holdings,
      fundDetails: privateDetails.items,
      publicFunds: publicFunds.items,
      transactionRanges: transactions.ranges,
      coverage: buildCoverage(holdings, privateDetails.items, publicFunds.items, transactions.ranges, capturedAt),
      warnings: task.warnings,
      metrics,
    });
    task.metrics.stagingBytes = JSON.stringify(capture).length;
    const summary = globalThis.LPTFFCollectionPolicy.summarizeCapture(capture);
    await stageSourceCapture(capture, summary);
    task.metrics.totalMs = Date.now() - Date.parse(task.metrics.startedAt);
    setStage("completed");
    return { ok: true, summary };
  } catch (error) {
    task.warnings.push(error instanceof Error ? error.message : "自动采集失败");
    setStage("error");
    return { ok: false, error: task.warnings[task.warnings.length - 1], warnings: [...task.warnings] };
  } finally {
    if (holdTabId) await closeCollectorTab(holdTabId);
    await closeTaskTabs();
    await closeOffscreenDocument();
    task.running = false;
    task.metrics.totalMs = task.metrics.startedAt ? Date.now() - Date.parse(task.metrics.startedAt) : 0;
    notifyProgress();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SOURCE_BRANCH_PROGRESS") {
    const branch = task.branches[message.branch];
    if (branch) {
      branch.completed = Number(message.completed) || 0;
      branch.total = Math.max(branch.total, Number(message.total) || 0);
      const multiplier = message.branch === "transactions" ? 1 : 3;
      task.requestCounts[message.branch] = branch.completed * multiplier;
      task.metrics.requestCount = Object.values(task.requestCounts).reduce((sum, count) => sum + count, 0);
      if (message.branch === "transactions") task.metrics.transactionPages = branch.completed;
      notifyProgress();
    }
    return false;
  }
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
    try {
      globalThis.LPTFFCollectionPolicy.collectionOptions(message, sender, chrome.runtime.getURL(""));
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "无权启动采集" });
      return false;
    }
    runAutoCollection().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "EXPORT_SOURCE_BACKUP") {
    exportSourceBackup().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
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
  return undefined;
});
