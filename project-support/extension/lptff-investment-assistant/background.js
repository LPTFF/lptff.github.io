importScripts("source-capture.js", "collection-policy.js", "observation-capture.js", "content/source-extractor.js");

const LPTFF_CONFIG_KEY = "lptffConfig";
const LPTFFConfig = {
  defaults: { pageTimeout: 30000, singleConcurrency: 4, queryConcurrency: 4, queryRanges: ["3"], observeSeconds: 90 },
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
      observeSeconds: boundedDuration(cfg.observeSeconds ?? cfg.cryptoObserveSeconds, this.defaults.observeSeconds),
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
      observeSeconds: boundedDuration(overrides.observeSeconds ?? overrides.cryptoObserveSeconds, current.observeSeconds),
    };
    await chrome.storage.local.set({ [LPTFF_CONFIG_KEY]: next });
    return next;
  },
};

const HOLD_URL = "https://trade.1234567.com.cn/myAssets/hold";
const QUERY_URL = "https://query.1234567.com.cn/";
const STAGING_KEY = "investmentStaging";
const RECEIPT_KEY = "investmentTransferReceipt";
const BINANCE_STAGING_KEY = "binanceStaging";
const BINANCE_RECEIPT_KEY = "binanceTransferReceipt";
// 多平台观察采集（金融：币安合约；市场需求：BOSS直聘；娱乐：快手/抖音）：每平台
// 独立暂存/回执/闹钟，键由平台 id 派生。旧版键 cryptoObservationStaging 已废弃
// （观察报告从未导入站点，无需迁移）。tabUrlPattern 用于查找已开页；pathFilter 判断
// 已开页能否作为观察页（币安要求期货路径，其他平台任意站内页）；fallbackUrl 是
// 无已开页时新开的采集页。
const OBSERVATION_STAGING_KEY = (platform) => `observationStaging:${platform}`;
const OBSERVATION_RECEIPT_KEY = (platform) => `observationReceipt:${platform}`;
const OBSERVATION_ALARM = (platform) => `lptff-observation-finish:${platform}`;
const OBSERVATION_PLATFORMS = {
  binance: {
    label: "币安合约",
    tabUrlPattern: "https://www.binance.com/*",
    pathFilter: (pathname) => /\/futures/i.test(pathname),
    fallbackUrl: "https://www.binance.com/zh-CN/futures/ETHUSDT",
    // 币安的余额、仓位、委托与配置主要在首屏加载时请求。使用同 profile 的后台副本
    // 从 document_start 被动观察，既不会清空首屏响应，也不刷新用户正在操作的合约页。
    dedicatedCaptureTab: true,
    fixedDurationSeconds: 30,
    minimumCaptureSeconds: 3,
  },
  zhipin: { label: "BOSS直聘", tabUrlPattern: "https://www.zhipin.com/*", pathFilter: (pathname) => /\/web\/geek\/(?:jobs?|job)/i.test(pathname), fallbackUrl: "https://www.zhipin.com/web/geek/jobs" },
  kuaishou: {
    label: "快手",
    tabUrlPattern: "https://www.kuaishou.com/*",
    pathFilter: (pathname) => /\/(?:new-reco|profile|short-video)/i.test(pathname),
    fallbackUrl: "https://www.kuaishou.com/new-reco",
    // 推荐流首批响应发生在应用启动阶段。始终从 document_start 打开同登录 profile
    // 的后台副本，避免在已加载页面里晚注入后漏掉首屏请求或命中页面缓存的原 fetch。
    dedicatedCaptureTab: true,
    automaticPaging: true,
  },
  douyin: {
    label: "抖音",
    tabUrlPattern: "https://www.douyin.com/*",
    pathFilter: (pathname) => /\/(?:jingxuan|recommend|user|video)/i.test(pathname),
    fallbackUrl: "https://www.douyin.com/user/self?from_tab_name=main&showSubTab=video&showTab=favorite_collection",
    preferredUrl: (url) => url.pathname === "/user/self"
      && url.searchParams.get("showTab") === "favorite_collection"
      && url.searchParams.get("showSubTab") === "video",
    requirePreferredUrl: true,
    dedicatedCaptureTab: true,
    immediateFinalize: true,
    maxInterestSearchTags: 8,
    maxInterestSearchConcurrency: 3,
  },
  hongguo: {
    label: "红果短剧",
    tabUrlPattern: "https://hongguoduanju.com/*",
    pathFilter: (pathname) => /^\/(?:$|category|detail|player)/i.test(pathname),
    fallbackUrl: "https://hongguoduanju.com/",
    preferredPath: (pathname) => /^\/(?:detail|player)/i.test(pathname),
    dedicatedCaptureTab: true,
    automaticPaging: true,
    fixedDurationSeconds: 30,
  },
};
const WEB_BRIDGE_LIFECYCLE_PORT = "lptff-web-bridge-lifecycle";
const webBridgePorts = new Set();
const preservedLoginTabIds = new Set();
const OFFSCREEN_PATH = "offscreen/offscreen.html";
let PAGE_TIMEOUT = 30000;

class LoginRequiredError extends Error {
  constructor(tabId) {
    super("已为你保留并打开天天基金登录页。请先完成登录，再回到基金复盘页面点击“重新采集”");
    this.name = "LoginRequiredError";
    this.reason = "login-required";
    this.tabId = tabId;
  }
}

function boundedConcurrency(value, fallback = 4) {
  return Math.max(1, Math.min(8, Number(value) || fallback));
}

// 观察窗口时长限制在 30 秒到 10 分钟：短于 chrome.alarms 的最小延迟，长于常规页面行为周期。
function boundedDuration(value, fallback = 90) {
  return Math.max(30, Math.min(600, Math.round(Number(value) || fallback)));
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
    task.tabIds = task.tabIds.filter((id) => id !== tabId);
    preservedLoginTabIds.add(tabId);
    await callChrome(chrome.tabs, chrome.tabs.update, tabId, { active: true });
    throw new LoginRequiredError(tabId);
  }
  if (hostname !== expectedHostname) {
    throw new Error(`采集页面跳转到了非预期地址：${currentUrl || "未知地址"}`);
  }
}

async function closeCollectorTab(tabId) {
  task.tabIds = task.tabIds.filter((id) => id !== tabId);
  if (preservedLoginTabIds.has(tabId)) return;
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
    reasons: ["DOM_PARSER", "BLOBS"],
    justification: "并发解析公开基金概况 HTML，并为超过 data URL 上限的本地 JSON 生成下载 Blob",
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
    if (error instanceof LoginRequiredError) throw error;
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

async function downloadData(data, filename) {
  const content = JSON.stringify(data, null, 2);
  let url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  // data: URL 会对中文 JSON 明显膨胀；大文件统一走 offscreen Blob。
  if (content.length > 128 * 1024) {
    await ensureOffscreenDocument();
    await waitForOffscreenReceiver();
    const startedAt = new Date(Date.now() - 1000).toISOString();
    const response = await chrome.runtime.sendMessage({
      type: "OFFSCREEN_DOWNLOAD",
      content,
      mimeType: "application/json;charset=utf-8",
      filename,
    });
    if (!response?.ok || !response.url) throw new Error(response?.error || "大文件下载未启动");
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const items = await chrome.downloads.search({ startedAfter: startedAt, orderBy: ["-startTime"], limit: 20 });
      const item = items.find((candidate) => candidate.url === response.url);
      if (item?.state === "interrupted") throw new Error(`下载中断：${item.error || filename}`);
      if (item?.state === "complete") {
        if (item.exists === false) throw new Error(`文件未落盘：${item.filename || filename}`);
        return { downloadId: item.id, filename: item.filename || filename };
      }
      await delay(200);
    }
    throw new Error(`下载等待超时：${filename}`);
  }
  const downloadId = await chrome.downloads.download({
    url,
    filename,
    // 扩展 popup 会在“另存为”窗口获得焦点时关闭，继而销毁 sendMessage
    // 响应端口。直接交给浏览器下载可让后台回调在 popup 生命周期内完成。
    saveAs: false,
    // 离线数据集保留每次生成结果；也避免 Chrome 下载库中的同名旧记录已被外部
    // 移除时，overwrite 卡在一个实际不存在的目标上。
    conflictAction: "uniquify",
  });
  if (!Number.isInteger(downloadId)) throw new Error(`Chrome 未创建下载任务：${filename}`);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const items = await chrome.downloads.search({ id: downloadId });
    const item = items?.[0];
    if (item?.state === "interrupted") throw new Error(`下载中断：${item.error || filename}`);
    if (item?.state === "complete") {
      if (item.exists === false) throw new Error(`Chrome 已完成下载记录，但文件未落盘：${item.filename || filename}`);
      return { downloadId, filename: item.filename || filename };
    }
    await delay(200);
  }
  throw new Error(`下载等待超时：${filename}`);
}

function buildDouyinInterestDataset(sourceCapture) {
  const entities = sourceCapture?.entities || {};
  const favoriteVideos = Array.isArray(entities.favoriteVideos) ? entities.favoriteVideos : [];
  const candidates = Array.isArray(entities.interestVideos) ? entities.interestVideos : [];
  const profile = entities.interestProfiles?.[0] || {};
  const searchQueue = Array.isArray(profile.searchTags)
    ? profile.searchTags.slice(0, OBSERVATION_PLATFORMS.douyin.maxInterestSearchTags || 8)
    : [];
  if (!favoriteVideos.length) throw new Error("没有采集到收藏视频，已保留上一份有效数据集；请确认抖音已登录且收藏合集可见");
  if (!searchQueue.length) throw new Error("收藏视频中没有可搜索的 #标签，已保留上一份有效数据集");
  if (!candidates.length) throw new Error("按收藏标签搜索后没有采集到相关视频，已保留上一份有效数据集；请稍后重试");

  const frequencyByTag = new Map(searchQueue.map((item) => [String(item.tag || ""), Number(item.count) || 0]));
  const videos = candidates
    .map((video) => {
      const matchedSearchTags = Array.isArray(video.matchedSearchTags) ? video.matchedSearchTags : [];
      const interestScore = matchedSearchTags.reduce((sum, tag) => sum + (frequencyByTag.get(String(tag)) || 0), 0);
      return { ...video, interestScore, matchedTagCount: matchedSearchTags.length };
    })
    .sort((left, right) => right.interestScore - left.interestScore
      || right.matchedTagCount - left.matchedTagCount
      || (Number(right.likeCount) || 0) - (Number(left.likeCount) || 0));

  return {
    protocol: "douyin-interest-video-dataset/1.0",
    kind: "interest-video-dataset",
    platform: "douyin",
    generatedAt: sourceCapture.capturedAt,
    sourcePage: sourceCapture.pageUrl,
    strategy: {
      basis: profile.basis || "favorite-collection-tags",
      description: "以我的收藏视频为兴趣种子，按 #标签频次搜索并汇总相关视频",
      seedVideoCount: favoriteVideos.length,
      taggedSeedVideoCount: Number(profile.taggedSeedVideoCount) || 0,
      searchedTagCount: searchQueue.length,
    },
    summary: {
      favoriteVideoCount: favoriteVideos.length,
      searchedTagCount: searchQueue.length,
      interestVideoCount: videos.length,
    },
    searchQueue,
    favoriteVideos,
    videos,
  };
}

async function exportSourceBackup() {
  const staging = await getStaging();
  if (!staging?.capture) throw new Error("当前没有全面来源采集包，请先完成采集");
  await downloadData(staging.capture, "lptff-investment-source-capture.json");
  return { ok: true };
}

// 脱敏导出：复用 source-capture.js 的 desensitizeSource（只掩盖能定位到账户/银行卡/交易的
// 个人识别信息，其余字段保留真实值），并照搬 desensitize-source.js 的残留自检——
// 32 位交易/追踪 ID 与银行卡尾号不允许残留，宁可失败也不生成假脱敏文件。
// 文件名与仓库 fixture 一致（eastmoney-source-desensitized.json），采集逻辑变更后可直接替换
// project-support/fixtures/investment/ 下的同名文件（serve/build 会同步到 public）。
async function exportDesensitizedSnapshot() {
  const staging = await getStaging();
  if (!staging?.capture) throw new Error("当前没有全面来源采集包，请先完成采集");
  const desensitized = globalThis.LPTFFSourceCapture.desensitizeSource(staging.capture);
  const text = JSON.stringify(desensitized);
  const residual = [];
  const hex32 = text.match(/\b[0-9a-f]{32}\b/g) || [];
  if (hex32.length) residual.push(`残留 32 位交易/追踪 ID ${hex32.length} 个`);
  const bankTail = text.match(/\|\s*\d{4,}\b/g) || [];
  if (bankTail.length) residual.push(`残留银行卡尾号 ${bankTail.length} 处`);
  if (residual.length) throw new Error(`脱敏自检失败：${residual.join("；")}，请改用「下载完整本地备份」并在仓库外用 desensitize-source.js 人工处理`);
  await downloadData(desensitized, "eastmoney-source-desensitized.json");
  return { ok: true };
}

async function runAutoCollection() {
  if (task.running) throw new Error("已有采集任务正在运行");
  const runningObservation = getRunningObservation();
  if (runningObservation) throw new Error(`${runningObservation.label}观察采集正在进行，请先结束观察再采集基金`);
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
  let queryTabId;
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
    queryTabId = await openCollectorTab(QUERY_URL);
    await assertCollectorPage(queryTabId, "query.1234567.com.cn");
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
        try {
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
          queryTabId = undefined;
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
    return {
      ok: false,
      error: task.warnings[task.warnings.length - 1],
      reason: error instanceof LoginRequiredError ? error.reason : undefined,
      warnings: [...task.warnings],
    };
  } finally {
    if (holdTabId) await closeCollectorTab(holdTabId);
    if (queryTabId) await closeCollectorTab(queryTabId);
    await closeTaskTabs();
    await closeOffscreenDocument();
    task.running = false;
    task.metrics.totalMs = task.metrics.startedAt ? Date.now() - Date.parse(task.metrics.startedAt) : 0;
    notifyProgress();
  }
}

// ---------------------------------------------------------------------------
// 多平台观察采集（金融：币安合约；市场需求：BOSS直聘；娱乐：快手/抖音）
// ---------------------------------------------------------------------------
// 设计：后台不自行请求各平台（网络路径、风控指纹均不可假设，且实测三个国内平台的
// 目标数据全部在登录墙后：BOSS 未登录 0 职位卡片、快手 graphql result:2、抖音壳页）；
// 观察桥只被动记录已登录页面自身发出的 fetch/XHR/WS/Worker 行为。观察窗口由
// chrome.alarms 兑现，popup 可提前结束。产出的 <platform>-observation-capture/0.9
// 报告供维护者登录调试时导出脱敏版核对端点契约；同批响应还会生成正式来源包。
// 同一时刻只允许一个平台的观察任务运行（与基金采集也互斥）。

const observationTasks = new Map();

function observationTaskOf(platformId) {
  if (!OBSERVATION_PLATFORMS[platformId]) throw new Error(`未知观察平台：${platformId}`);
  if (!observationTasks.has(platformId)) {
    observationTasks.set(platformId, {
      platform: platformId,
      label: OBSERVATION_PLATFORMS[platformId].label,
      running: false,
      stage: "idle",
      startedAt: 0,
      durationMs: 0,
      warnings: [],
      tabId: null,
      createdTab: false,
      historyState: null,
      finishing: false,
      searchTabIds: new Set(),
      seedVideoCount: 0,
      seedReady: false,
      searchCompleted: 0,
      searchTotal: 0,
      searchSucceeded: 0,
      searchFailed: 0,
      searchActive: 0,
      searchFinished: false,
      interestVideoCount: 0,
      completedDurationMs: 0,
    });
  }
  return observationTasks.get(platformId);
}

function getRunningObservation() {
  return [...observationTasks.values()].find((item) => item.running) || null;
}

function observationTaskSnapshot(task) {
  const branches = task.platform === "douyin" ? douyinObservationBranches(task) : undefined;
  return {
    platform: task.platform,
    label: task.label,
    running: task.running,
    stage: task.stage,
    warnings: [...task.warnings],
    remainingMs: task.running && task.platform !== "douyin" ? Math.max(0, task.startedAt + task.durationMs - Date.now()) : 0,
    historyState: task.historyState,
    searchCompleted: task.searchCompleted || 0,
    searchTotal: task.searchTotal || 0,
    searchActive: task.searchActive || 0,
    searchSucceeded: task.searchSucceeded || 0,
    searchFailed: task.searchFailed || 0,
    maxSearchConcurrency: task.platform === "douyin" ? OBSERVATION_PLATFORMS.douyin.maxInterestSearchConcurrency : 0,
    ...(branches ? { branches } : {}),
  };
}

function douyinObservationBranches(task) {
  const elapsed = task.completedDurationMs || (task.startedAt ? Math.max(0, Date.now() - task.startedAt) : 0);
  const finished = !task.running && task.stage === "completed";
  const failed = !task.running && task.stage === "error";
  const searchStatus = task.stage === "searchingInterests"
    ? "running"
    : task.searchFinished
      ? task.searchFailed > 0 ? "partial" : "completed"
      : failed ? "failed" : "pending";
  return {
    favoriteSeeds: {
      label: "收藏兴趣种子",
      status: task.seedReady ? "completed" : failed ? "failed" : task.running ? "running" : "pending",
      completed: task.seedReady ? task.seedVideoCount : 0,
      total: task.seedReady ? task.seedVideoCount : 0,
      detail: task.seedReady ? "标签已提取" : "读取登录态收藏",
    },
    tagSearch: {
      label: `标签并行搜索（${OBSERVATION_PLATFORMS.douyin.maxInterestSearchConcurrency} 路）`,
      status: searchStatus,
      completed: task.searchCompleted || 0,
      total: task.searchTotal || 0,
      detail: task.stage === "searchingInterests"
        ? `${task.searchActive || 0} 路进行中`
        : task.searchFailed > 0 ? `${task.searchFailed} 个失败` : "",
    },
    dataset: {
      label: "相关视频数据集",
      status: finished ? "completed" : failed ? "failed" : task.stage === "processing" ? "running" : "pending",
      completed: finished ? task.interestVideoCount : 0,
      total: finished ? task.interestVideoCount : 0,
      durationMs: finished || failed ? elapsed : 0,
      detail: finished ? "已去重并按兴趣排序" : task.stage === "processing" ? "去重、评分与排序" : "",
    },
  };
}

function notifyObservationProgress(task) {
  chrome.runtime.sendMessage({ type: "OBSERVATION_PROGRESS", ...observationTaskSnapshot(task) }).catch(() => {});
}

async function injectObservationReceiver(tabId) {
  await callChrome(chrome.scripting, chrome.scripting.executeScript, {
    target: { tabId },
    world: "MAIN",
    files: ["content/source-extractor.js", "content/observation-bridge.js"],
  });
  await callChrome(chrome.scripting, chrome.scripting.executeScript, {
    target: { tabId },
    world: "ISOLATED",
    files: ["content/observation-collector.js"],
  });
}

async function sendToObservationTab(tabId, message, platformLabel) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await callChrome(chrome.tabs, chrome.tabs.sendMessage, tabId, message);
    } catch (error) {
      lastError = error;
      if (attempt === 1 && isMissingReceiverError(error)) {
        try {
          await injectObservationReceiver(tabId);
        } catch (injectError) {
          lastError = injectError;
        }
      }
      await delay(500);
    }
  }
  if (isMissingReceiverError(lastError)) {
    throw new Error(`${platformLabel}观察采集脚本未连接。请确认已打开目标页面并完成加载，然后重试`);
  }
  throw lastError || new Error(`${platformLabel}采集页面未响应`);
}

async function findOrCreateObservationTab(platformId) {
  const config = OBSERVATION_PLATFORMS[platformId];
  const tabs = await callChrome(chrome.tabs, chrome.tabs.query, { url: config.tabUrlPattern });
  const usable = tabs.filter((tab) => {
    try {
      return config.pathFilter(new URL(tab.url || "").pathname);
    } catch {
      return false;
    }
  });
  if (config.dedicatedCaptureTab) {
    const active = usable.find((tab) => tab.active);
    const preferred = (config.preferredUrl || config.preferredPath) && usable.find((tab) => {
      try {
        const url = new URL(tab.url || "");
        return config.preferredUrl ? config.preferredUrl(url) : config.preferredPath(url.pathname);
      } catch {
        return false;
      }
    });
    const targetUrl = config.requirePreferredUrl
      ? (preferred?.url || config.fallbackUrl)
      : (preferred?.url || active?.url || usable[0]?.url || config.fallbackUrl);
    const tab = await callChrome(chrome.tabs, chrome.tabs.create, { url: targetUrl, active: false });
    if (!tab?.id) throw new Error(`无法创建${config.label}后台采集页`);
    const started = Date.now();
    while (Date.now() - started < PAGE_TIMEOUT) {
      const current = await callChrome(chrome.tabs, chrome.tabs.get, tab.id);
      if (current.status === "complete") {
        return { tabId: tab.id, created: true, reused: false, capturedFromNavigation: true };
      }
      await delay(200);
    }
    return {
      tabId: tab.id,
      created: true,
      reused: false,
      capturedFromNavigation: true,
      warning: `${config.label}后台采集页加载超时，观察可能不完整`,
    };
  }
  if (usable.length) {
    const active = usable.find((tab) => tab.active);
    const chosen = active || usable[0];
    return { tabId: chosen.id, created: false, reused: true };
  }
  // 用户已有该平台页面但不在观察路径：复用该标签页导航会打断用户操作，
  // 因此新开一个不激活的采集页。
  const tab = await callChrome(chrome.tabs, chrome.tabs.create, { url: config.fallbackUrl, active: false });
  if (!tab?.id) throw new Error(`无法创建${config.label}采集页面`);
  const started = Date.now();
  while (Date.now() - started < PAGE_TIMEOUT) {
    const current = await callChrome(chrome.tabs, chrome.tabs.get, tab.id);
    if (current.status === "complete") return { tabId: tab.id, created: true, reused: false };
    await delay(200);
  }
  // 页面未完全加载也继续：能采到多少算多少，覆盖度报告会如实反映未观察到的事实。
  return { tabId: tab.id, created: true, reused: false, warning: `${config.label}页面加载超时，观察可能不完整` };
}

async function startObservation(platformId, durationSeconds) {
  // 局部命名 obsTask：不遮蔽全局 task（基金采集任务），下面的基金互斥检查要用它。
  const obsTask = observationTaskOf(platformId);
  const running = getRunningObservation();
  if (running) {
    throw new Error(running.platform === platformId
      ? "该平台的观察任务正在运行，请等待结束或提前结束"
      : `${running.label}观察采集正在进行，同一时刻只能观察一个平台`);
  }
  if (task.running) throw new Error("基金采集正在进行，请先完成后再开始观察");
  const existing = await getObservationStaging(platformId);
  const replaceableEntertainment = ["kuaishou", "douyin", "hongguo"].includes(platformId);
  if (existing?.status === "pending" && !replaceableEntertainment) throw new Error("已有一份观察报告等待处理，请先导出或丢弃后再观察");

  const platformConfig = OBSERVATION_PLATFORMS[platformId];
  const durationMs = boundedDuration(platformConfig.fixedDurationSeconds || durationSeconds) * 1000;
  obsTask.running = true;
  obsTask.stage = "preparing";
  obsTask.startedAt = Date.now();
  obsTask.durationMs = durationMs;
  obsTask.warnings = [];
  if (existing?.status === "pending") obsTask.warnings.push("本次完成后将替换上一份未处理的娱乐清单；若本次失败，旧清单仍会保留");
  obsTask.tabId = null;
  obsTask.createdTab = false;
  obsTask.historyState = null;
  obsTask.searchCompleted = 0;
  obsTask.searchTotal = 0;
  obsTask.searchSucceeded = 0;
  obsTask.searchFailed = 0;
  obsTask.searchActive = 0;
  obsTask.searchFinished = false;
  obsTask.searchTabIds = new Set();
  obsTask.seedVideoCount = 0;
  obsTask.seedReady = false;
  obsTask.interestVideoCount = 0;
  obsTask.completedDurationMs = 0;
  obsTask.finishing = false;
  notifyObservationProgress(obsTask);

  try {
    const tab = await findOrCreateObservationTab(platformId);
    obsTask.tabId = tab.tabId;
    obsTask.createdTab = tab.created;
    if (tab.warning) obsTask.warnings.push(tab.warning);
    if (tab.capturedFromNavigation) {
      // 后台副本由 manifest 在 document_start 注入；保留首屏已经捕获的响应。
      const initial = await sendToObservationTab(tab.tabId, { type: "OBSERVATION_READ" }, obsTask.label);
      if (!initial?.ok || !initial.data) throw new Error(initial?.error || `${obsTask.label}后台采集桥未响应`);
    } else {
      await injectObservationReceiver(tab.tabId);
      // 复用现有页面时清零旧观察数据，让报告只覆盖本次观察窗口。
      await sendToObservationTab(tab.tabId, { type: "OBSERVATION_RESET" }, obsTask.label);
    }
    if (platformId === "binance") {
      const history = await sendToObservationTab(tab.tabId, { type: "BINANCE_HISTORY_START" }, obsTask.label);
      if (!history?.ok) throw new Error(history?.error || "币安全量历史采集未启动");
      obsTask.historyState = history.data;
    }
    obsTask.stage = platformId === "douyin" ? "collectingSeeds" : "observing";
    notifyObservationProgress(obsTask);
    if (platformConfig.immediateFinalize) {
      // 收藏页的观察桥会主动重放登录态收藏请求；读取成功后无需再等待固定观察窗口。
      // 延后一拍让 START_OBSERVATION 先回到调用方，随后自动完成整条数据集流水线。
      setTimeout(() => finishObservation(platformId), 0);
      return { ok: true, platform: platformId, durationMs: 0, observation: observationTaskSnapshot(obsTask) };
    }
    // 观察窗口由 popup 倒计时展示；chrome.alarms 兑现截止（popup 关闭也能正常收尾）。
    await chrome.alarms.clear(OBSERVATION_ALARM(platformId));
    await chrome.alarms.create(OBSERVATION_ALARM(platformId), { delayInMinutes: durationMs / 60000 });
    if (platformId === "binance") monitorBinanceCompletion(obsTask);
    if (platformConfig.automaticPaging) monitorEntertainmentCollection(obsTask);
    return { ok: true, platform: platformId, durationMs };
  } catch (error) {
    obsTask.warnings.push(error instanceof Error ? error.message : "观察启动失败");
    await resetObservationTask(obsTask);
    return { ok: false, error: obsTask.warnings[obsTask.warnings.length - 1] };
  }
}

async function monitorBinanceCompletion(obsTask) {
  const minimumMs = Number(OBSERVATION_PLATFORMS.binance.minimumCaptureSeconds || 3) * 1000;
  while (obsTask.running && !obsTask.finishing && Date.now() < obsTask.startedAt + obsTask.durationMs) {
    await delay(250);
    const history = await sendToObservationTab(obsTask.tabId, { type: "BINANCE_HISTORY_STATUS" }, obsTask.label).catch(() => null);
    if (!history?.ok || !history.data) continue;
    obsTask.historyState = history.data;
    obsTask.stage = history.data.running ? "collectingHistory" : "processing";
    notifyObservationProgress(obsTask);
    if (!history.data.running && Date.now() - obsTask.startedAt >= minimumMs) {
      await finishObservation("binance");
      return;
    }
  }
}

async function advanceEntertainmentFeed(obsTask, { force = false } = {}) {
  if (!obsTask.running || (!force && obsTask.finishing) || !obsTask.tabId) return;
  try {
    await callChrome(chrome.scripting, chrome.scripting.executeScript, {
      target: { tabId: obsTask.tabId },
      func: (platformId) => {
        if (platformId === "hongguo") {
          [...document.querySelectorAll("button")]
            .filter((button) => /查看更多|展开/.test(button.textContent || ""))
            .forEach((button) => button.click());
        }
        const candidates = [document.scrollingElement, ...document.querySelectorAll("main, [role='main'], div")]
          .filter((element, index, items) => element && items.indexOf(element) === index)
          .filter((element) => {
            const style = getComputedStyle(element);
            return element.scrollHeight > element.clientHeight + 120
              && /auto|scroll|overlay/.test(`${style.overflowY} ${style.overflow}`);
          })
          .sort((left, right) => (right.clientHeight * right.clientWidth) - (left.clientHeight * left.clientWidth));
        const target = candidates[0] || document.scrollingElement;
        const distance = Math.max(480, Math.round((target?.clientHeight || innerHeight) * 0.9));
        target?.scrollBy?.({ top: distance, behavior: "instant" });
        window.scrollBy({ top: distance, behavior: "instant" });
      },
      args: [obsTask.platform],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "自动翻页失败";
    if (!obsTask.warnings.includes(message)) obsTask.warnings.push(message);
  }
}

async function monitorEntertainmentCollection(obsTask) {
  while (obsTask.running && !obsTask.finishing && Date.now() < obsTask.startedAt + obsTask.durationMs) {
    await delay(2500);
    await advanceEntertainmentFeed(obsTask);
  }
}

function mergeObservationData(base, addition) {
  return {
    ...(base || {}),
    pageUrl: base?.pageUrl,
    restSnapshots: [...(base?.restSnapshots || []), ...(addition?.restSnapshots || [])],
    wsStreams: [...(base?.wsStreams || []), ...(addition?.wsStreams || [])],
    workerScripts: [...(base?.workerScripts || []), ...(addition?.workerScripts || [])],
    domSnapshots: [...(base?.domSnapshots || []), ...(addition?.domSnapshots || [])],
  };
}

async function waitForObservationNavigation(tabId, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const tab = await callChrome(chrome.tabs, chrome.tabs.get, tabId);
    if (tab?.status === "complete") return true;
    await delay(200);
  }
  return false;
}

async function collectDouyinInterestResults(obsTask, seedData) {
  const seedCapture = globalThis.LPTFFMultiDomainSourceExtractor.buildSourceCapture("douyin", {
    capturedAt: new Date().toISOString(),
    data: seedData,
    warnings: [],
    metrics: {},
  });
  const searchTags = (seedCapture.entities?.interestProfiles?.[0]?.searchTags || [])
    .slice(0, OBSERVATION_PLATFORMS.douyin.maxInterestSearchTags || 8);
  obsTask.seedVideoCount = (seedCapture.entities?.videos || []).filter((video) => video.isFavoriteSeed).length;
  obsTask.seedReady = true;
  notifyObservationProgress(obsTask);
  if (!searchTags.length) {
    obsTask.warnings.push("收藏视频中未提取到可搜索的 #标签，未生成感兴趣视频候选集");
    obsTask.searchFinished = true;
    notifyObservationProgress(obsTask);
    return seedData;
  }

  obsTask.stage = "searchingInterests";
  obsTask.searchTotal = searchTags.length;
  obsTask.searchCompleted = 0;
  obsTask.searchSucceeded = 0;
  obsTask.searchFailed = 0;
  obsTask.searchFinished = false;
  notifyObservationProgress(obsTask);

  const results = new Array(searchTags.length);
  let nextIndex = 0;
  const collectTag = async (item, index) => {
    let tabId = null;
    try {
      const tab = await callChrome(chrome.tabs, chrome.tabs.create, { url: item.searchUrl, active: false });
      tabId = tab?.id || null;
      if (!tabId) throw new Error(`无法打开搜索“${item.tag}”`);
      obsTask.searchTabIds.add(tabId);
      obsTask.searchActive += 1;
      notifyObservationProgress(obsTask);
      const loaded = await waitForObservationNavigation(tabId);
      if (!loaded) throw new Error(`搜索“${item.tag}”加载超时`);
      const searchTask = { ...obsTask, tabId };
      await delay(900);
      await advanceEntertainmentFeed(searchTask, { force: true });
      await delay(500);
      await advanceEntertainmentFeed(searchTask, { force: true });
      await delay(500);
      const result = await sendToObservationTab(tabId, { type: "OBSERVATION_READ" }, obsTask.label);
      if (!result?.ok || !result.data) throw new Error(result?.error || `搜索“${item.tag}”未返回数据`);
      results[index] = result.data;
      obsTask.searchSucceeded += 1;
    } catch (error) {
      obsTask.warnings.push(error instanceof Error ? error.message : `搜索“${item.tag}”采集失败`);
      obsTask.searchFailed += 1;
    } finally {
      if (tabId) {
        obsTask.searchTabIds.delete(tabId);
        try {
          await callChrome(chrome.tabs, chrome.tabs.remove, tabId);
        } catch {
          // 搜索页可能已被用户手动关闭。
        }
      }
      obsTask.searchActive = Math.max(0, obsTask.searchActive - 1);
      obsTask.searchCompleted += 1;
      notifyObservationProgress(obsTask);
    }
  };
  const worker = async () => {
    while (nextIndex < searchTags.length) {
      const index = nextIndex;
      nextIndex += 1;
      await collectTag(searchTags[index], index);
    }
  };
  const concurrency = Math.min(
    OBSERVATION_PLATFORMS.douyin.maxInterestSearchConcurrency || 3,
    searchTags.length,
  );
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  obsTask.searchFinished = true;
  notifyObservationProgress(obsTask);
  const combined = results.reduce(
    (current, result) => result ? mergeObservationData(current, result) : current,
    seedData,
  );
  return combined;
}

async function finishObservation(platformId) {
  const obsTask = observationTaskOf(platformId);
  if (!obsTask.running) return { ok: false, error: "没有正在进行的观察任务" };
  if (obsTask.finishing) return { ok: false, error: "采集结果正在生成" };
  obsTask.finishing = true;
  obsTask.stage = platformId === "douyin" ? "collectingSeeds" : "reading";
  notifyObservationProgress(obsTask);
  try {
    await chrome.alarms.clear(OBSERVATION_ALARM(platformId));
    if (platformId === "binance") {
      obsTask.stage = "collectingHistory";
      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        const history = await sendToObservationTab(obsTask.tabId, { type: "BINANCE_HISTORY_STATUS" }, obsTask.label);
        if (history?.ok && history.data) {
          obsTask.historyState = history.data;
          notifyObservationProgress(obsTask);
          if (!history.data.running) break;
        }
        await delay(500);
      }
      if (obsTask.historyState?.running) obsTask.warnings.push("币安全量历史采集等待超时，来源包将如实标记未完成分支");
    }
    const response = await sendToObservationTab(obsTask.tabId, { type: "OBSERVATION_READ" }, obsTask.label);
    if (!response?.ok || !response.data) throw new Error(response?.error || "未读取到观察数据");
    if (platformId === "douyin") {
      // 抖音个人页是 SPA：document.readyState=complete 早于收藏接口落入观察桥。
      // 这里按“已出现收藏实体”收敛，避免恢复固定倒计时，也避免空数据抢跑。
      let seedData = response.data;
      const seedDeadline = Date.now() + 15000;
      while (Date.now() < seedDeadline) {
        const seedCapture = globalThis.LPTFFMultiDomainSourceExtractor.buildSourceCapture("douyin", {
          capturedAt: new Date().toISOString(),
          data: seedData,
          warnings: [],
          metrics: {},
        });
        if ((seedCapture.entities?.favoriteVideos || []).length > 0) break;
        await delay(750);
        const retry = await sendToObservationTab(obsTask.tabId, { type: "OBSERVATION_READ" }, obsTask.label);
        if (retry?.ok && retry.data) seedData = mergeObservationData(seedData, retry.data);
      }
      response.data = await collectDouyinInterestResults(obsTask, seedData);
    }
    obsTask.stage = "processing";
    notifyObservationProgress(obsTask);
    const capturedAt = new Date().toISOString();
    const capture = globalThis.LPTFFObservationCapture.buildObservationCapture(platformId, {
      capturedAt,
      observedUntil: capturedAt,
      data: response.data,
      warnings: obsTask.warnings,
      metrics: {
        totalMs: Date.now() - obsTask.startedAt,
        configuredDurationMs: obsTask.durationMs,
        reusedExistingTab: !obsTask.createdTab,
      },
    });
    const summary = globalThis.LPTFFObservationCapture.summarizeObservation(capture);
    const sourceCapture = globalThis.LPTFFMultiDomainSourceExtractor.buildSourceCapture(platformId, {
      capturedAt,
      data: response.data,
      warnings: obsTask.warnings,
      metrics: capture.metrics,
    });
    const sourceSummary = globalThis.LPTFFMultiDomainSourceExtractor.summarizeSource(sourceCapture);
    const productDataset = platformId === "douyin" ? buildDouyinInterestDataset(sourceCapture) : null;
    const productSummary = productDataset?.summary || null;
    if (productSummary) obsTask.interestVideoCount = Number(productSummary.interestVideoCount) || 0;
    await callChrome(chrome.storage.local, chrome.storage.local.set, {
      [OBSERVATION_STAGING_KEY(platformId)]: {
        protocol: capture.protocol,
        sourceProtocol: sourceCapture.protocol,
        capturedAt: capture.capturedAt,
        status: "pending",
        capture,
        sourceCapture,
        ...(productDataset ? { productDataset } : {}),
      },
      [OBSERVATION_RECEIPT_KEY(platformId)]: {
        protocol: capture.protocol,
        sourceProtocol: sourceCapture.protocol,
        capturedAt: capture.capturedAt,
        status: "pending",
        summary,
        sourceSummary,
        ...(productSummary ? { productSummary } : {}),
      },
      ...(platformId === "binance" ? {
        [BINANCE_STAGING_KEY]: {
          protocol: sourceCapture.protocol,
          capturedAt: sourceCapture.capturedAt,
          status: "pending",
          capture: sourceCapture,
        },
        [BINANCE_RECEIPT_KEY]: {
          protocol: sourceCapture.protocol,
          capturedAt: sourceCapture.capturedAt,
          status: "pending",
          summary: sourceSummary,
        },
      } : {}),
    });
    obsTask.completedDurationMs = Date.now() - obsTask.startedAt;
    obsTask.stage = "completed";
    return { ok: true, summary, ...(productSummary ? { productSummary } : {}) };
  } catch (error) {
    obsTask.warnings.push(error instanceof Error ? error.message : "观察读取失败");
    obsTask.stage = "error";
    return { ok: false, error: obsTask.warnings[obsTask.warnings.length - 1] };
  } finally {
    if (obsTask.searchTabIds?.size) {
      try {
        await callChrome(chrome.tabs, chrome.tabs.remove, [...obsTask.searchTabIds]);
      } catch {
        // 搜索页可能已经在各自的 finally 中关闭。
      }
      obsTask.searchTabIds.clear();
    }
    if (obsTask.createdTab && obsTask.tabId) {
      // 只关闭本次新开的采集页；用户自己的页面永不关闭。
      try {
        await callChrome(chrome.tabs, chrome.tabs.remove, obsTask.tabId);
      } catch {
        // 页面可能已被用户手动关闭。
      }
    }
    obsTask.tabId = null;
    obsTask.running = false;
    obsTask.finishing = false;
    notifyObservationProgress(obsTask);
  }
}

async function resetObservationTask(obsTask) {
  await chrome.alarms.clear(OBSERVATION_ALARM(obsTask.platform));
  if (obsTask.searchTabIds?.size) {
    try {
      await callChrome(chrome.tabs, chrome.tabs.remove, [...obsTask.searchTabIds]);
    } catch {
      // 已关闭的搜索页无需再次处理。
    }
    obsTask.searchTabIds.clear();
  }
  if (obsTask.createdTab && obsTask.tabId) {
    try {
      await callChrome(chrome.tabs, chrome.tabs.remove, obsTask.tabId);
    } catch {
      // 同上。
    }
  }
  obsTask.tabId = null;
  obsTask.createdTab = false;
  obsTask.historyState = null;
  obsTask.searchCompleted = 0;
  obsTask.searchTotal = 0;
  obsTask.searchSucceeded = 0;
  obsTask.searchFailed = 0;
  obsTask.searchActive = 0;
  obsTask.searchFinished = false;
  obsTask.running = false;
  obsTask.finishing = false;
  notifyObservationProgress(obsTask);
}

async function getObservationStaging(platformId) {
  const key = OBSERVATION_STAGING_KEY(platformId);
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, key);
  return result?.[key] || null;
}

function binanceBranches(sourceSummary, running, historyState) {
  const counts = sourceSummary?.entityCounts || {};
  const coverageDetails = new Map((sourceSummary?.coverage || []).map((item) => [item.dataset, item]));
  const coverage = new Map([...coverageDetails].map(([dataset, item]) => [dataset, item.completeness]));
  const historyBranches = historyState?.branches || {};
  const branch = (dataset, label) => {
    const live = historyBranches[dataset];
    const archived = coverageDetails.get(dataset);
    const completed = Number(live?.recordCount ?? archived?.recordCount ?? counts[dataset] ?? 0);
    const total = Number(live?.expectedCount ?? archived?.expectedCount ?? completed);
    const completeness = live?.completeness || coverage.get(dataset);
    return {
      dataset,
      label,
      status: running ? (live?.status || "running") : completeness === "complete" ? "completed" : completeness === "failed" ? "failed" : "partial",
      completed,
      total,
      pageCount: Number(live?.pageCount ?? archived?.pageCount ?? 0),
      windowsCompleted: Number(live?.windowsCompleted ?? archived?.windowsCompleted ?? 0),
      windowsTotal: Number(live?.windowsTotal ?? archived?.windowsTotal ?? 0),
      missingOrderCount: Number(live?.missingOrderCount ?? archived?.missingOrderCount ?? 0),
      regularOrderCount: Number(live?.regularOrderCount ?? archived?.regularOrderCount ?? -1),
      conditionalOrderCount: Number(live?.conditionalOrderCount ?? archived?.conditionalOrderCount ?? -1),
      duplicateResponseCount: Number(live?.duplicateResponseCount ?? archived?.duplicateResponseCount ?? 0),
      limitation: live?.limitation || archived?.limitation,
    };
  };
  const snapshotTotal = Number(counts.equity || 0) + Number(counts.positions || 0) + Number(counts.funding || 0) + Number(counts.fundingHistory || 0) + Number(counts.symbolConfigs || 0);
  const snapshotComplete = ["equity", "positions", "funding"].every((name) => coverage.get(name) === "complete");
  return {
    orderHistory: branch("orderHistory", "合约订单历史"),
    tradeHistory: branch("tradeHistory", "交易历史"),
    positionHistory: branch("positionHistory", "持仓历史"),
    transactionHistory: branch("transactionHistory", "资金流水"),
    snapshot: {
      dataset: "snapshot",
      label: "账户与行情快照",
      status: running ? "running" : snapshotComplete ? "completed" : "partial",
      completed: running ? 0 : snapshotTotal,
      total: running ? 0 : snapshotTotal,
    },
  };
}

async function getBinanceStaging() {
  const stored = await callChrome(chrome.storage.local, chrome.storage.local.get, [BINANCE_STAGING_KEY, OBSERVATION_STAGING_KEY("binance")]);
  if (stored?.[BINANCE_STAGING_KEY]) return stored[BINANCE_STAGING_KEY];
  const legacy = stored?.[OBSERVATION_STAGING_KEY("binance")];
  return legacy?.sourceCapture ? { protocol: legacy.sourceCapture.protocol, capturedAt: legacy.sourceCapture.capturedAt, status: "pending", capture: legacy.sourceCapture } : null;
}

async function getBinanceStatus() {
  const stored = await callChrome(chrome.storage.local, chrome.storage.local.get, [BINANCE_STAGING_KEY, BINANCE_RECEIPT_KEY, OBSERVATION_STAGING_KEY("binance"), OBSERVATION_RECEIPT_KEY("binance")]);
  const staging = stored?.[BINANCE_STAGING_KEY] || (stored?.[OBSERVATION_STAGING_KEY("binance")]?.sourceCapture ? { capture: stored[OBSERVATION_STAGING_KEY("binance")].sourceCapture } : null);
  const legacyReceipt = stored?.[OBSERVATION_RECEIPT_KEY("binance")];
  const receipt = stored?.[BINANCE_RECEIPT_KEY] || (legacyReceipt ? { protocol: legacyReceipt.sourceProtocol, capturedAt: legacyReceipt.capturedAt, status: "pending", summary: legacyReceipt.sourceSummary } : null);
  const observation = observationTaskSnapshot(observationTaskOf("binance"));
  return { extensionVersion: chrome.runtime.getManifest().version, pending: Boolean(staging), receipt, collection: { ...observation, branches: binanceBranches(receipt?.summary, observation.running, observation.historyState) } };
}

async function acknowledgeBinanceStaging() {
  const staging = await getBinanceStaging();
  if (!staging?.capture) throw new Error("没有可确认的币安来源采集包");
  await callChrome(chrome.storage.local, chrome.storage.local.remove, [BINANCE_STAGING_KEY, OBSERVATION_STAGING_KEY("binance")]);
  await callChrome(chrome.storage.local, chrome.storage.local.set, { [BINANCE_RECEIPT_KEY]: { protocol: staging.protocol, capturedAt: staging.capturedAt, acknowledgedAt: new Date().toISOString(), status: "imported", summary: globalThis.LPTFFMultiDomainSourceExtractor.summarizeSource(staging.capture) } });
}

async function discardBinanceStaging() {
  const staging = await getBinanceStaging();
  await callChrome(chrome.storage.local, chrome.storage.local.remove, [BINANCE_STAGING_KEY, OBSERVATION_STAGING_KEY("binance")]);
  if (staging) await callChrome(chrome.storage.local, chrome.storage.local.set, { [BINANCE_RECEIPT_KEY]: { protocol: staging.protocol, capturedAt: staging.capturedAt, acknowledgedAt: new Date().toISOString(), status: "discarded", summary: globalThis.LPTFFMultiDomainSourceExtractor.summarizeSource(staging.capture) } });
}

// 一次读取全部平台的暂存/回执：popup 打开时拉一次即可刷新所有观察卡片。
async function getObservationStatus() {
  const platformIds = globalThis.LPTFFObservationCapture.platforms();
  const keys = [];
  for (const platformId of platformIds) {
    keys.push(OBSERVATION_STAGING_KEY(platformId), OBSERVATION_RECEIPT_KEY(platformId));
  }
  const stored = await callChrome(chrome.storage.local, chrome.storage.local.get, keys);
  const platforms = {};
  for (const platformId of platformIds) {
    if (!OBSERVATION_PLATFORMS[platformId]) continue;
    const obsTask = observationTaskOf(platformId);
    platforms[platformId] = {
      label: obsTask.label,
      observation: observationTaskSnapshot(obsTask),
      pending: Boolean(stored?.[OBSERVATION_STAGING_KEY(platformId)]),
      receipt: stored?.[OBSERVATION_RECEIPT_KEY(platformId)] || null,
    };
  }
  return { extensionVersion: chrome.runtime.getManifest().version, platforms };
}

async function discardObservationStaging(platformId) {
  const stagingKey = OBSERVATION_STAGING_KEY(platformId);
  const receiptKey = OBSERVATION_RECEIPT_KEY(platformId);
  const result = await callChrome(chrome.storage.local, chrome.storage.local.get, [stagingKey, receiptKey]);
  const staging = result?.[stagingKey];
  const receipt = result?.[receiptKey];
  await callChrome(chrome.storage.local, chrome.storage.local.remove, stagingKey);
  if (staging || receipt) {
    await callChrome(chrome.storage.local, chrome.storage.local.set, {
      [receiptKey]: {
        protocol: staging?.protocol || receipt?.protocol || globalThis.LPTFFObservationCapture.protocolOf(platformId),
        capturedAt: staging?.capturedAt || receipt?.capturedAt || "",
        acknowledgedAt: new Date().toISOString(),
        status: "discarded",
        summary: receipt?.summary,
        sourceSummary: receipt?.sourceSummary,
        productSummary: receipt?.productSummary,
      },
    });
  }
}

async function exportObservationBackup(platformId) {
  const staging = await getObservationStaging(platformId);
  if (!staging?.capture) throw new Error("当前没有观察报告，请先完成观察采集");
  await downloadData(staging.capture, `${platformId}-observation-capture.json`);
  return { ok: true };
}

// 脱敏导出：业务标识值替换为稳定伪 ID，残留自检发现被脱敏原值/邮箱/手机号残留时
// 宁可失败也不生成假脱敏文件，与基金脱敏导出同一标准。
async function exportObservationDesensitized(platformId) {
  const staging = await getObservationStaging(platformId);
  if (!staging?.capture) throw new Error("当前没有观察报告，请先完成观察采集");
  const { desensitized, maskedOriginals } = globalThis.LPTFFObservationCapture.desensitizeObservation(staging.capture);
  const residual = globalThis.LPTFFObservationCapture.residualCheck(desensitized, maskedOriginals);
  if (residual.length) throw new Error(`脱敏自检失败：${residual.join("；")}，请改用「下载完整本地备份」并人工处理`);
  await downloadData(desensitized, `${platformId}-observation-desensitized.json`);
  return { ok: true };
}

async function exportObservationSourceBackup(platformId) {
  const staging = await getObservationStaging(platformId);
  if (platformId === "douyin") {
    if (!staging?.productDataset) throw new Error("当前没有感兴趣视频数据集，请先生成一次数据集");
    await downloadData(staging.productDataset, "douyin-interest-video-dataset.json");
    return { ok: true };
  }
  if (!staging?.sourceCapture) throw new Error("当前没有正式来源包，请先完成一次采集");
  await downloadData(staging.sourceCapture, `${platformId}-source-capture.json`);
  return { ok: true };
}

async function exportObservationSourceDesensitized(platformId) {
  const staging = await getObservationStaging(platformId);
  if (platformId === "douyin") {
    if (!staging?.productDataset) throw new Error("当前没有感兴趣视频数据集，请先生成一次数据集");
    const { desensitized, maskedOriginals } = globalThis.LPTFFMultiDomainSourceExtractor.desensitizeSource(staging.productDataset);
    const residual = globalThis.LPTFFMultiDomainSourceExtractor.residualCheck(desensitized, maskedOriginals);
    if (residual.length) throw new Error(`脱敏自检失败：${residual.join("；")}`);
    await downloadData(desensitized, "douyin-interest-video-dataset-desensitized.json");
    return { ok: true };
  }
  if (!staging?.sourceCapture) throw new Error("当前没有正式来源包，请先完成一次采集");
  const { desensitized, maskedOriginals } = globalThis.LPTFFMultiDomainSourceExtractor.desensitizeSource(staging.sourceCapture);
  const residual = globalThis.LPTFFMultiDomainSourceExtractor.residualCheck(desensitized, maskedOriginals);
  if (residual.length) throw new Error(`脱敏自检失败：${residual.join("；")}`);
  await downloadData(desensitized, `${platformId}-source-desensitized.json`);
  return { ok: true };
}

chrome.alarms.onAlarm.addListener((alarm) => {
  const match = /^lptff-observation-finish:(.+)$/.exec(alarm?.name || "");
  if (!match) return;
  const platformId = match[1];
  const obsTask = observationTasks.get(platformId);
  if (obsTask?.running) {
    finishObservation(platformId).catch(() => {
      obsTask.stage = "error";
      obsTask.running = false;
      notifyObservationProgress(obsTask);
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "generate-douyin-dataset") return;
  startObservation("douyin", 30).catch((error) => {
    const obsTask = observationTaskOf("douyin");
    obsTask.warnings.push(error instanceof Error ? error.message : "抖音数据集生成启动失败");
    obsTask.stage = "error";
    obsTask.running = false;
    notifyObservationProgress(obsTask);
  });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== WEB_BRIDGE_LIFECYCLE_PORT) return;
  webBridgePorts.add(port);
  port.onDisconnect.addListener(() => {
    // Chrome closes extension ports when their page enters the back/forward cache.
    // Reading lastError keeps that expected lifecycle event out of the error log.
    void chrome.runtime.lastError;
    webBridgePorts.delete(port);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => preservedLoginTabIds.delete(tabId));

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
  if (message?.type === "EXPORT_DESENSITIZED_SNAPSHOT") {
    exportDesensitizedSnapshot().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
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
  if (message?.type === "START_OBSERVATION") {
    try {
      globalThis.LPTFFCollectionPolicy.observationCollectionOptions(message, sender, chrome.runtime.getURL(""));
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "无权启动观察采集" });
      return false;
    }
    Promise.resolve()
      .then(() => startObservation(String(message.platform || ""), Number(message.durationSeconds)))
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "START_BINANCE_COLLECTION") {
    try {
      globalThis.LPTFFCollectionPolicy.binanceCollectionOptions(message, sender, chrome.runtime.getURL(""));
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "无权启动合约采集" });
      return false;
    }
    startObservation("binance", 30).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "GET_BINANCE_STAGING") {
    getBinanceStaging().then((staging) => sendResponse({ ok: true, staging })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "GET_BINANCE_STATUS") {
    getBinanceStatus().then((status) => sendResponse({ ok: true, status })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "ACK_BINANCE_STAGING") {
    acknowledgeBinanceStaging().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "DISCARD_BINANCE_STAGING") {
    discardBinanceStaging().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "STOP_OBSERVATION") {
    finishObservation(String(message.platform || "")).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "GET_OBSERVATION_STATUS") {
    getObservationStatus().then((status) => sendResponse({ ok: true, status })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "GET_OBSERVATION_STAGING") {
    getObservationStaging(String(message.platform || "")).then((staging) => sendResponse({ ok: true, staging })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "GET_DOUYIN_DATASET") {
    const senderUrl = String(sender?.url || sender?.tab?.url || "");
    const allowed = senderUrl.startsWith(chrome.runtime.getURL("")) || senderUrl.startsWith("https://www.douyin.com/");
    if (!allowed) {
      sendResponse({ ok: false, error: "无权读取抖音数据集" });
      return false;
    }
    getObservationStaging("douyin")
      .then((staging) => {
        if (!staging?.productDataset) return sendResponse({ ok: false, error: "当前没有感兴趣视频数据集，请先生成一次数据集" });
        if (!message.desensitized) return sendResponse({ ok: true, dataset: staging.productDataset });
        const { desensitized, maskedOriginals } = globalThis.LPTFFMultiDomainSourceExtractor.desensitizeSource(staging.productDataset);
        const residual = globalThis.LPTFFMultiDomainSourceExtractor.residualCheck(desensitized, maskedOriginals);
        if (residual.length) return sendResponse({ ok: false, error: `脱敏自检失败：${residual.join("；")}` });
        return sendResponse({ ok: true, dataset: desensitized });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "DISCARD_OBSERVATION_STAGING") {
    discardObservationStaging(String(message.platform || "")).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "EXPORT_OBSERVATION_BACKUP") {
    exportObservationBackup(String(message.platform || "")).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "EXPORT_OBSERVATION_DESENSITIZED") {
    exportObservationDesensitized(String(message.platform || "")).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "EXPORT_OBSERVATION_SOURCE_BACKUP") {
    exportObservationSourceBackup(String(message.platform || "")).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "EXPORT_OBSERVATION_SOURCE_DESENSITIZED") {
    exportObservationSourceDesensitized(String(message.platform || "")).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  return undefined;
});
