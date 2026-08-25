const statusElement = document.querySelector("#status");
const branchElement = document.querySelector("#branches");
const collectButton = document.querySelector("#collect");
const backupButton = document.querySelector("#backup");
const desensitizeButton = document.querySelector("#desensitize");
let exportAvailable = false;
let exportRunning = false;

// 领域模式切换：金融（基金采集 + 币安观察）/ 市场需求（BOSS直聘）/ 娱乐（快手/抖音）
// 互不干扰，上次选择记在本地，下次打开 popup 时恢复。旧版值 fund/crypto 一律归入金融。
const modeTabs = {
  finance: document.querySelector("#mode-finance"),
  market: document.querySelector("#mode-market"),
  entertainment: document.querySelector("#mode-entertainment"),
};
const modeSections = {
  finance: document.querySelector("#finance-mode"),
  market: document.querySelector("#market-mode"),
  entertainment: document.querySelector("#entertainment-mode"),
};

function setMode(mode) {
  const active = modeSections[mode] ? mode : "finance";
  for (const [name, tab] of Object.entries(modeTabs)) {
    tab.classList.toggle("active", name === active);
    tab.setAttribute("aria-selected", String(name === active));
  }
  for (const [name, section] of Object.entries(modeSections)) {
    section.hidden = name !== active;
  }
  try {
    localStorage.setItem("lptff-ext-mode", active);
  } catch {
    // 无痕模式下忽略偏好保存。
  }
}

for (const [name, tab] of Object.entries(modeTabs)) {
  tab.addEventListener("click", () => setMode(name));
}
try {
  const saved = localStorage.getItem("lptff-ext-mode");
  setMode(saved === "market" || saved === "entertainment" ? saved : "finance");
} catch {
  setMode("finance");
}

const stageLabels = {
  preparing: "正在准备采集环境…",
  hold: "正在读取账户与全部持仓…",
  collecting: "三条数据支线正在并行采集…",
  processing: "正在构建全面来源采集包…",
  completed: "全面来源采集完成",
  error: "自动采集失败",
  idle: "",
};

function send(message, attempt = 0) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const runtimeError = chrome.runtime.lastError;
      const missingReceiver = /Could not establish connection|Receiving end does not exist/i.test(runtimeError?.message || "");
      if (missingReceiver && attempt < 4) {
        setTimeout(() => send(message, attempt + 1).then(resolve, reject), 150 * (attempt + 1));
        return;
      }
      if (runtimeError) {
        reject(new Error(missingReceiver
          ? "插件后台尚未连接，请在 chrome://extensions 重新加载插件后重试"
          : runtimeError.message || "扩展通信失败"));
      } else resolve(response);
    });
  });
}

function setStatus(message, kind = "") {
  statusElement.textContent = message;
  statusElement.className = `collection-status${kind ? ` ${kind}` : ""}`;
}

function durationOf(milliseconds) {
  const seconds = Math.max(0, Number(milliseconds) || 0) / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)} 秒` : `${Math.round(seconds)} 秒`;
}

function sizeOf(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  return value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function branchProgress(branch) {
  if (!branch) return "等待";
  const count = branch.total > 0 ? `${branch.completed}/${branch.total}` : "";
  const duration = branch.durationMs > 0 ? ` · ${durationOf(branch.durationMs)}` : "";
  const orderSources = branch.regularOrderCount >= 0 && branch.conditionalOrderCount >= 0 && (branch.regularOrderCount + branch.conditionalOrderCount > 0)
    ? ` · 基础单 ${branch.regularOrderCount} + 条件委托 ${branch.conditionalOrderCount}`
    : "";
  const deduplicated = branch.duplicateResponseCount > 0 ? ` · 跨段去重 ${branch.duplicateResponseCount}` : "";
  const detail = branch.detail ? ` · ${branch.detail}` : "";
  const state = {
    pending: "等待",
    running: "进行中",
    completed: "完成",
    partial: "部分完成",
    failed: "失败",
  }[branch.status] || branch.status;
  return `${state}${count ? ` ${count}` : ""}${detail}${orderSources}${deduplicated}${duration}`;
}

function updateBranches(progress) {
  const branches = progress?.branches;
  if (!branches) {
    branchElement.replaceChildren();
    return;
  }
  const fragment = document.createDocumentFragment();
  Object.values(branches).forEach((branch) => {
    const row = document.createElement("div");
    row.className = `branch branch-${branch.status}`;
    const label = document.createElement("span");
    label.textContent = branch.label;
    const value = document.createElement("strong");
    value.textContent = branchProgress(branch);
    row.append(label, value);
    fragment.append(row);
  });
  branchElement.replaceChildren(fragment);
}

function updateProgress(progress) {
  if (!progress) return;
  updateBranches(progress);
  const elapsed = progress.metrics?.elapsedMs ?? progress.metrics?.totalMs;
  const stagingSize = progress.metrics?.stagingBytes > 0 ? ` · 暂存 ${sizeOf(progress.metrics.stagingBytes)}` : "";
  const tabPeak = progress.metrics?.temporaryTabPeak > 0 ? ` · 临时页峰值 ${progress.metrics.temporaryTabPeak}` : "";
  const metrics = elapsed > 0
    ? `已用 ${durationOf(elapsed)} · 请求 ${progress.metrics?.requestCount || 0} · 交易页 ${progress.metrics?.transactionPages || 0}${tabPeak}${stagingSize}`
    : "复用 1 个账户页和 1 个交易页";
  const message = `${stageLabels[progress.stage] || "正在采集…"}${metrics ? ` ${metrics}` : ""}`;
  setStatus(message, progress.stage === "error" ? "error" : progress.stage === "completed" ? "success" : "");
  collectButton.disabled = Boolean(progress.running);
}

function formatCoverage(staging) {
  const coverage = staging?.capture?.coverage || staging?.dataset?.coverage || [];
  if (!coverage.length) return "";
  const labels = { account: "账户", fundDetails: "基金详情", publicFunds: "公开档案", transactions: "交易" };
  const states = { complete: "完整", partial: "部分完整", unknown: "未确认", failed: "失败" };
  return `数据质量 · ${coverage.map((item) => `${labels[item.dataset] || item.dataset} ${states[item.completeness] || item.completeness}`).join(" · ")}`;
}

function updateStaging(staging) {
  document.querySelector("#coverage").textContent = formatCoverage(staging);
  exportAvailable = Boolean(staging?.capture);
  backupButton.disabled = !exportAvailable || exportRunning;
  desensitizeButton.disabled = !exportAvailable || exportRunning;
}

function updateTransferStatus(status) {
  if (!status) return;
  updateProgress(status.collection);
  if (status.collection?.running) return;
  if (status.pending) {
    const summary = status.receipt?.summary;
    const timing = summary?.totalMs ? `，采集耗时 ${durationOf(summary.totalMs)}` : "";
    const warningCount = (summary?.coverage || []).reduce((sum, item) => sum + (item.warningCount || 0), 0);
    const warnings = warningCount ? `，${warningCount} 条来源警告` : "";
    setStatus(`全面来源采集包已就绪${timing}${warnings}，等待 Investment OS 导入。`, warningCount ? "" : "success");
    return;
  }
  if (status.receipt?.status === "imported") {
    setStatus("最近一批已写入 Investment OS，插件一次性暂存已清除。", "success");
  } else if (status.receipt?.status === "discarded") {
    setStatus("最近一批待导入数据已丢弃，可重新采集。");
  }
}

async function startCollection() {
  collectButton.disabled = true;
  setStatus("正在启动高效采集…");
  try {
    const response = await send({ type: "START_AUTO_COLLECTION" });
    if (!response?.ok) throw new Error(response?.error || "自动采集失败");
    const stagingResponse = await send({ type: "GET_INVESTMENT_STAGING" });
    if (stagingResponse?.ok) updateStaging(stagingResponse.staging);
  } catch (error) {
    collectButton.disabled = false;
    setStatus(error instanceof Error ? error.message : "自动采集失败", "error");
  }
}

async function exportData(type, successMessage) {
  if (exportRunning) return;
  exportRunning = true;
  backupButton.disabled = true;
  desensitizeButton.disabled = true;
  setStatus(type === "EXPORT_DESENSITIZED_SNAPSHOT" ? "正在脱敏并执行残留自检…" : "正在生成完整本地备份…");
  try {
    const response = await send({ type });
    if (!response?.ok) throw new Error(response?.error || "导出失败");
    const detail = response.summary?.fieldCount ? `（${response.summary.fieldCount} 个字段路径）` : "";
    setStatus(`${successMessage}${detail}`, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "导出失败", "error");
  } finally {
    exportRunning = false;
    backupButton.disabled = !exportAvailable;
    desensitizeButton.disabled = !exportAvailable;
  }
}

collectButton.addEventListener("click", startCollection);
backupButton.addEventListener("click", () => exportData("EXPORT_SOURCE_BACKUP", "完整本地备份已生成。"));
desensitizeButton.addEventListener("click", () => exportData("EXPORT_DESENSITIZED_SNAPSHOT", "脱敏快照已生成，可安全提交或替换仓库 fixture。"));

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "COLLECTION_PROGRESS") updateProgress(message);
  if (message?.type === "OBSERVATION_PROGRESS" && message.platform === "binance") updateBinanceProgress(message);
  else if (message?.type === "OBSERVATION_PROGRESS") updateObservationCard(message.platform, message);
});

// ---------------- 多平台观察采集（金融/市场需求/娱乐） ----------------

const binanceCollectButton = document.querySelector("#binance-collect");
const binanceStatusElement = document.querySelector("#binance-status");
const binanceBranchesElement = document.querySelector("#binance-branches");
const binanceCoverageElement = document.querySelector("#binance-coverage");
const binanceSourceBackup = document.querySelector("#binance-source-backup");
const binanceSourceDesensitized = document.querySelector("#binance-source-desensitized");
const binanceExportHint = document.querySelector("#binance-export-hint");
let binancePending = false;
let binanceTimer = null;

function setBinanceStatus(message, kind = "") {
  binanceStatusElement.textContent = message;
  binanceStatusElement.className = `collection-status${kind ? ` ${kind}` : ""}`;
}

function renderBinanceBranches(branches) {
  const fragment = document.createDocumentFragment();
  for (const branch of Object.values(branches || {})) {
    const row = document.createElement("div");
    row.className = `branch branch-${branch.status}`;
    const label = document.createElement("span");
    label.textContent = branch.label;
    const value = document.createElement("strong");
    value.textContent = branchProgress({ ...branch, durationMs: 0 });
    row.append(label, value);
    fragment.append(row);
  }
  binanceBranchesElement.replaceChildren(fragment);
}

function updateBinanceProgress(progress) {
  if (!progress) return;
  const running = Boolean(progress.running);
  binanceCollectButton.disabled = running || binancePending;
  if (running) {
    const stageText = progress.stage === "reading" || progress.stage === "processing"
      ? "正在合并并校验正式来源事实…"
      : "正在并行采集四类合约历史与账户快照…";
    setBinanceStatus(stageText);
    renderBinanceBranches(progress.branches || progress.historyState?.branches || {
      orderHistory: { label: "合约订单历史", status: "running", completed: 0, total: 0 },
      tradeHistory: { label: "交易历史", status: "running", completed: 0, total: 0 },
      positionHistory: { label: "持仓历史", status: "running", completed: 0, total: 0 },
      transactionHistory: { label: "资金流水", status: "running", completed: 0, total: 0 },
      snapshot: { label: "账户与行情快照", status: "running", completed: 0, total: 0 },
    });
    if (!binanceTimer) binanceTimer = setInterval(refreshBinanceStatus, 1000);
  } else if (binanceTimer) {
    clearInterval(binanceTimer);
    binanceTimer = null;
    refreshBinanceStatus();
  }
}

async function refreshBinanceStatus() {
  try {
    const response = await send({ type: "GET_BINANCE_STATUS" });
    if (!response?.ok) return;
    const status = response.status;
    binancePending = Boolean(status.pending);
    binanceCollectButton.disabled = Boolean(status.collection?.running) || binancePending;
    binanceSourceBackup.disabled = !binancePending;
    binanceSourceDesensitized.disabled = !binancePending;
    binanceSourceBackup.hidden = !binancePending;
    binanceSourceDesensitized.hidden = !binancePending;
    renderBinanceBranches(status.collection?.branches);
    if (status.collection?.running) {
      updateBinanceProgress(status.collection);
      return;
    }
    const counts = status.receipt?.summary?.entityCounts || {};
    const coverage = status.receipt?.summary?.coverage || [];
    const labels = { orderHistory: "订单历史", tradeHistory: "交易历史", positionHistory: "持仓历史", transactionHistory: "资金流水", positions: "当前头寸", equity: "权益", orders: "委托摘要", funding: "资金费率" };
    const states = { complete: "完整", partial: "部分完整", unknown: "未确认", failed: "失败" };
    binanceCoverageElement.textContent = coverage.length
      ? `数据质量 · ${coverage.map((item) => `${labels[item.dataset] || item.dataset} ${states[item.completeness] || item.completeness} ${item.completeRecordCount ?? 0}/${item.recordCount ?? 0}`).join(" · ")}`
      : "";
    if (binancePending) {
      const coreComplete = ["orderHistory", "tradeHistory", "positionHistory", "transactionHistory"].every((dataset) => coverage.find((item) => item.dataset === dataset)?.completeness === "complete");
      binanceExportHint.textContent = "正式来源包仍在插件一次性暂存中，可先下载，也可由 Investment OS 导入。";
      setBinanceStatus(`${coreComplete ? "全量来源包" : "来源包（存在归档缺口）"}已就绪：订单历史 ${counts.orderHistory || 0} · 交易历史 ${counts.tradeHistory || 0} · 持仓历史 ${counts.positionHistory || 0} · 资金流水 ${counts.transactionHistory || 0}。等待 Investment OS 导入。`, coreComplete ? "success" : "warning");
    } else if (status.receipt?.status === "imported") {
      binanceExportHint.textContent = "最近一批已自动导入，插件一次性暂存已清除；如需文件，请从 Investment OS 合约复盘台账导出。";
      setBinanceStatus(`最近一批已写入 Investment OS：订单历史 ${counts.orderHistory || 0} · 交易历史 ${counts.tradeHistory || 0} · 持仓历史 ${counts.positionHistory || 0} · 资金流水 ${counts.transactionHistory || 0}。插件暂存已安全清除。`, "success");
    } else if (status.receipt?.status === "discarded") {
      binanceExportHint.textContent = "最近一批已丢弃；重新采集后可下载或导入 Investment OS。";
      setBinanceStatus("最近一批已丢弃，可重新采集。");
    } else {
      binanceExportHint.textContent = "尚无可导出的合约来源；完成采集后可下载或导入 Investment OS。";
    }
  } catch {
    // 扩展后台重载期间由下一次刷新恢复。
  }
}

binanceCollectButton.addEventListener("click", async () => {
  binanceCollectButton.disabled = true;
  setBinanceStatus("正在准备后台采集页，四类历史与账户快照将并行采集…");
  renderBinanceBranches({
    orderHistory: { label: "合约订单历史", status: "running", completed: 0, total: 0 },
    tradeHistory: { label: "交易历史", status: "running", completed: 0, total: 0 },
    positionHistory: { label: "持仓历史", status: "running", completed: 0, total: 0 },
    transactionHistory: { label: "资金流水", status: "running", completed: 0, total: 0 },
    snapshot: { label: "账户与行情快照", status: "running", completed: 0, total: 0 },
  });
  try {
    const response = await send({ type: "START_BINANCE_COLLECTION" });
    if (!response?.ok) throw new Error(response?.error || "合约来源采集启动失败");
    updateBinanceProgress({ running: true, stage: "observing", remainingMs: response.durationMs });
  } catch (error) {
    binanceCollectButton.disabled = false;
    setBinanceStatus(error instanceof Error ? error.message : "合约来源采集启动失败", "error");
  }
});

async function exportBinanceSource(type, message) {
  if (!binancePending) {
    await refreshBinanceStatus();
    return;
  }
  binanceSourceBackup.disabled = true;
  binanceSourceDesensitized.disabled = true;
  try {
    const response = await send({ type, platform: "binance" });
    if (!response?.ok) throw new Error(response?.error || "导出失败");
    setBinanceStatus(message, "success");
  } catch (error) {
    if (/当前没有正式来源包/i.test(error instanceof Error ? error.message : "")) await refreshBinanceStatus();
    else setBinanceStatus(error instanceof Error ? error.message : "导出失败", "error");
  } finally {
    binanceSourceBackup.disabled = !binancePending;
    binanceSourceDesensitized.disabled = !binancePending;
  }
}

binanceSourceBackup.addEventListener("click", () => exportBinanceSource("EXPORT_OBSERVATION_SOURCE_BACKUP", "正式来源包已生成。"));
binanceSourceDesensitized.addEventListener("click", () => exportBinanceSource("EXPORT_OBSERVATION_SOURCE_DESENSITIZED", "脱敏正式来源包已生成。"));
refreshBinanceStatus();

// 观察平台清单与 background 的 OBSERVATION_PLATFORMS 对应：group 决定卡片挂在哪个
// 领域 tab；intro/loginHint 是面向维护者的登录调试操作指引，产品逻辑写在这里。
const OBSERVATION_PLATFORMS = [
  {
    id: "zhipin",
    name: "BOSS直聘",
    group: "market",
    intro: "采集 BOSS直聘职位列表响应，生成包含职位、公司、招聘者和搜索上下文的正式来源包。这是「一键获取高价值职位清单」的数据基础。",
    loginHint: "登录 BOSS直聘 → 打开搜索结果页 → 开始观察 → 搜索目标职位并翻 2–3 页（触发职位列表与分页参数）→ 用一次筛选、点开 1–2 个职位详情 → 等倒计时结束",
  },
  {
    id: "kuaishou",
    name: "快手",
    group: "entertainment",
    intro: "采集快手推荐流/主页响应，生成视频（文案/封面/播放地址/统计/时长）、作者和分页上下文正式来源包。",
    loginHint: "保持快手登录即可。插件会用同一登录 profile 打开不激活的后台副本，从首屏开始自动翻页并生成离线清单",
  },
  {
    id: "douyin",
    name: "抖音",
    group: "entertainment",
    intro: "以“我的收藏 → 视频”为兴趣种子，提取高频 #标签，自动逐标签搜索并采集候选视频，最终输出可直接消费的感兴趣视频数据集。",
    loginHint: "保持抖音登录；插件会自动打开“我 → 收藏 → 视频”、翻页读取收藏，再按前 8 个标签搜索相关视频",
  },
  {
    id: "hongguo",
    name: "红果短剧",
    group: "entertainment",
    intro: "采集红果官网公开片库或 APP 分享详情页，将当前分享剧标记为收藏种子，并生成名称、封面、集数、标签、简介、演员和播放/详情链接筛选基座。",
    loginHint: "官网本身没有登录/收藏功能。若要以 APP 收藏为种子，请在红果 APP 收藏页分享短剧链接并用 Chrome 打开，再执行采集；插件会保留当前详情并扩充相关短剧",
  },
];

const observationCards = new Map();

function buildObservationCard(platform) {
  const isDouyin = platform.id === "douyin";
  const card = document.createElement("article");
  card.className = "observation-card";
  const title = document.createElement("h3");
  title.textContent = isDouyin ? "抖音 · 感兴趣视频数据集" : `${platform.name} · ${platform.group === "entertainment" ? "离线清单采集" : "观察采集"}`;
  const intro = document.createElement("p");
  intro.textContent = platform.intro;
  const actions = document.createElement("div");
  actions.className = "observation-actions";
  const start = document.createElement("button");
  start.type = "button";
  start.textContent = isDouyin ? "开始高效采集" : platform.group === "entertainment" ? "一键采集离线清单" : "开始正式来源采集";
  const stop = document.createElement("button");
  stop.type = "button";
  stop.className = "secondary";
  stop.disabled = true;
  stop.textContent = isDouyin ? "立即生成当前结果" : platform.group === "entertainment" ? "提前结束并生成清单" : "提前结束并生成报告";
  actions.append(start);
  if (!isDouyin) actions.append(stop);
  const branches = document.createElement("div");
  branches.className = "branches observation-branches";
  if (isDouyin) {
    for (const label of ["收藏兴趣种子", "标签并行搜索（3 路）", "相关视频数据集"]) {
      const row = document.createElement("div");
      row.className = "branch branch-pending";
      const name = document.createElement("span");
      name.textContent = label;
      const value = document.createElement("strong");
      value.textContent = "等待";
      row.append(name, value);
      branches.append(row);
    }
  } else {
    branches.hidden = true;
  }
  const status = document.createElement("div");
  status.className = "observation-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = isDouyin
    ? "点击后自动读取收藏视频、提取高频 #标签、搜索相关视频，并下载可直接消费的数据集。"
    : platform.id === "binance"
    ? "采集数据只保存在本地。启动后自动打开不激活的后台副本，30 秒后生成报告并关闭副本。"
    : platform.group === "entertainment"
      ? "清单只保存在本地。启动后自动打开不激活的后台副本，从首屏开始采集并自动翻页，结束后关闭副本。"
      : "观察数据只保存在本地。启动后会清零页面内存中的旧观察记录，倒计时结束自动生成报告。";
  const advanced = document.createElement("details");
  advanced.className = "advanced";
  const summary = document.createElement("summary");
  summary.textContent = isDouyin ? "数据集设置" : "观察与导出设置";
  const durationLabel = document.createElement("label");
  durationLabel.textContent = platform.id === "binance" ? "自动采集时长（固定 30 秒） " : isDouyin ? "收藏页采集时长(秒, 30-600) " : "观察时长(秒, 30-600) ";
  const duration = document.createElement("input");
  duration.type = "number";
  duration.name = `${platform.id}-observation-duration`;
  duration.min = "30";
  duration.max = "600";
  duration.step = "10";
  if (platform.id === "binance") duration.disabled = true;
  durationLabel.append(duration);
  const saveConfig = document.createElement("button");
  saveConfig.type = "button";
  saveConfig.className = "secondary";
  saveConfig.textContent = isDouyin ? "保存采集设置" : "保存观察设置";
  if (platform.id === "binance") saveConfig.disabled = true;
  const sourceBackup = document.createElement("button");
  sourceBackup.type = "button";
  sourceBackup.className = "secondary";
  sourceBackup.disabled = true;
  sourceBackup.textContent = isDouyin ? "下载感兴趣视频数据集" : "下载正式来源包";
  const sourceDesensitize = document.createElement("button");
  sourceDesensitize.type = "button";
  sourceDesensitize.className = "secondary";
  sourceDesensitize.disabled = true;
  sourceDesensitize.textContent = isDouyin ? "下载脱敏数据集" : "下载脱敏正式来源包";
  const backup = document.createElement("button");
  backup.type = "button";
  backup.className = "secondary";
  backup.disabled = true;
  backup.textContent = "下载完整本地备份";
  const desensitize = document.createElement("button");
  desensitize.type = "button";
  desensitize.className = "secondary";
  desensitize.disabled = true;
  desensitize.textContent = "下载脱敏观察报告";
  const discard = document.createElement("button");
  discard.type = "button";
  discard.className = "secondary";
  discard.disabled = true;
  discard.textContent = isDouyin ? "清除当前数据集" : "丢弃当前报告";
  const hint = document.createElement("p");
  hint.className = "action-hint";
  hint.textContent = isDouyin
    ? `使用说明：${platform.loginHint}。收藏视频只用于提取兴趣标签；最终下载文件中的 videos 才是按兴趣搜索得到的相关视频，已包含封面、文案、统计、作者、时长和直达链接。`
    : `${platform.group === "entertainment" ? "使用说明" : "登录调试建议"}：${platform.loginHint}。正式来源包只含产品白名单实体；观察报告用于核对端点契约。「完整本地备份」含业务标识，仅限本地。`;
  advanced.append(summary);
  if (!isDouyin) advanced.append(durationLabel, saveConfig);
  advanced.append(sourceBackup, sourceDesensitize);
  if (!isDouyin) advanced.append(backup, desensitize);
  advanced.append(discard, hint);
  card.append(title, intro, actions, branches, status, advanced);
  document.querySelector(`#obs-group-${platform.group}`).append(card);
  return { card, status, branches, start, stop, sourceBackup, sourceDesensitize, backup, desensitize, discard, duration, saveConfig };
}

for (const platform of OBSERVATION_PLATFORMS) {
  const ui = buildObservationCard(platform);
  observationCards.set(platform.id, { ...ui, platform, running: false, exportAvailable: false, exportRunning: false });
}

const observationStageLabels = {
  preparing: "正在定位/打开目标页面并注入观察桥…",
  observing: "观察中：请在目标页面里正常操作，倒计时结束后自动生成报告",
  collectingSeeds: "正在读取登录态收藏视频并提取兴趣标签…",
  searchingInterests: "正在按收藏标签搜索并采集感兴趣视频…",
  reading: "正在读取观察数据并组装报告…",
  processing: "正在合并并校验正式来源事实…",
  collectingHistory: "正在并行采集历史事实…",
  completed: "观察报告已生成",
  error: "观察采集失败",
  idle: "",
};

function setObservationStatus(platformId, message, kind = "") {
  const ui = observationCards.get(platformId);
  if (!ui) return;
  ui.status.textContent = message;
  ui.status.className = `observation-status${kind ? ` ${kind}` : ""}`;
}

function updateObservationBranches(platformId, branches) {
  const ui = observationCards.get(platformId);
  if (!ui?.branches || platformId !== "douyin" || !branches) return;
  const fragment = document.createDocumentFragment();
  Object.values(branches).forEach((branch) => {
    const row = document.createElement("div");
    row.className = `branch branch-${branch.status}`;
    const label = document.createElement("span");
    label.textContent = branch.label;
    const value = document.createElement("strong");
    value.textContent = branchProgress(branch);
    row.append(label, value);
    fragment.append(row);
  });
  ui.branches.replaceChildren(fragment);
}

// 任一平台观察运行中时每秒轮询刷新倒计时（后台只在阶段变化时推送），无运行任务时停轮询。
let observationPollTimer = null;

function syncObservationPolling() {
  const anyRunning = [...observationCards.values()].some((ui) => ui.running);
  if (anyRunning && !observationPollTimer) {
    observationPollTimer = setInterval(() => {
      refreshObservationStatus();
    }, 1000);
  } else if (!anyRunning && observationPollTimer) {
    clearInterval(observationPollTimer);
    observationPollTimer = null;
  }
}

function updateObservationCard(platformId, progress) {
  const ui = observationCards.get(platformId);
  if (!ui || !progress) return;
  updateObservationBranches(platformId, progress.branches);
  if (progress.running) {
    ui.running = true;
    const remaining = Math.max(0, Number(progress.remainingMs) || 0);
    const suffix = platformId === "douyin" && progress.stage === "searchingInterests"
      ? `${progress.searchCompleted || 0}/${progress.searchTotal || 0} 个标签 · ${progress.searchActive || 0} 路进行中`
      : progress.stage === "observing"
      ? `剩余 ${Math.ceil(remaining / 1000)} 秒`
      : "";
    const stageLabel = (platformId === "binance" || ui.platform.group === "entertainment") && progress.stage === "observing"
      ? "后台自动采集中，无需操作页面"
      : observationStageLabels[progress.stage] || "观察中…";
    const message = `${stageLabel}${suffix ? ` · ${suffix}` : ""}`;
    setObservationStatus(platformId, message);
    ui.start.disabled = true;
    ui.stop.disabled = platformId === "binance" || platformId === "douyin" || progress.stage !== "observing";
    syncObservationPolling();
    return;
  }
  ui.running = false;
  ui.start.disabled = false;
  ui.stop.disabled = true;
  syncObservationPolling();
  if (progress.stage === "error") {
    const warning = (progress.warnings || []).join("；");
    setObservationStatus(platformId, `${platformId === "douyin" ? "生成" : "观察"}失败：${warning || "未知错误"}`, "error");
  }
  refreshObservationStatus();
}

async function refreshObservationStatus() {
  try {
    const response = await send({ type: "GET_OBSERVATION_STATUS" });
    if (!response?.ok) return;
    const platforms = response.status?.platforms || {};
    for (const [platformId, state] of Object.entries(platforms)) {
      const ui = observationCards.get(platformId);
      if (!ui) continue;
      ui.exportAvailable = Boolean(state.pending);
      ui.backup.disabled = !ui.exportAvailable || ui.exportRunning;
      ui.desensitize.disabled = !ui.exportAvailable || ui.exportRunning;
      ui.sourceBackup.disabled = !ui.exportAvailable || ui.exportRunning;
      ui.sourceDesensitize.disabled = !ui.exportAvailable || ui.exportRunning;
      ui.discard.disabled = !state.pending;
      if (state.observation?.running) {
        updateObservationCard(platformId, state.observation);
        continue;
      }
      if (state.pending) {
        if (platformId === "douyin") {
          const product = state.receipt?.productSummary || {};
          updateObservationBranches(platformId, {
            favoriteSeeds: { label: "收藏兴趣种子", status: "completed", completed: product.favoriteVideoCount || 0, total: product.favoriteVideoCount || 0, detail: "标签已提取" },
            tagSearch: { label: "标签并行搜索（3 路）", status: "completed", completed: product.searchedTagCount || 0, total: product.searchedTagCount || 0 },
            dataset: { label: "相关视频数据集", status: "completed", completed: product.interestVideoCount || 0, total: product.interestVideoCount || 0, detail: "已去重并按兴趣排序" },
          });
          setObservationStatus(platformId, `感兴趣视频数据集已生成：收藏种子 ${product.favoriteVideoCount || 0} 条 · 搜索标签 ${product.searchedTagCount || 0} 个 · 相关视频 ${product.interestVideoCount || 0} 条。文件已自动下载，也可再次下载或重新生成。`, "success");
          continue;
        }
        const summary = state.receipt?.summary;
        const observed = (summary?.coverage || []).filter((item) => item.completeness === "observed").length;
        const total = (summary?.coverage || []).length;
        const warnings = summary?.warningCount ? `，${summary.warningCount} 条提示` : "";
        // 核心字段确认度：产品数据诉求（实体×字段）的观察命中情况，未观察的硬依赖实体单独点名。
        const coreList = (summary?.coreFields || []).map((item) => `${item.entity} ${item.observedFieldCount}/${item.totalFieldCount}`).join(" · ");
        const missingCore = (summary?.coreFields || []).filter((item) => item.required === "must" && item.completeness === "unobserved");
        const coreSummary = coreList ? `核心字段：${coreList}。` : "";
        const coreMissingHint = missingCore.length ? `未观察到硬依赖实体：${missingCore.map((item) => item.entity).join("、")}，请按登录指引补充观察。` : "";
        const entityCounts = state.receipt?.sourceSummary?.entityCounts || {};
        const entitySummary = Object.entries(entityCounts).filter(([, count]) => count > 0).map(([name, count]) => `${name} ${count}`).join(" · ");
        const sourceHint = entitySummary ? `正式来源：${entitySummary}。` : "正式来源包尚无实体，请按登录指引触发目标数据。";
        const transportSummary = platformId === "hongguo"
          ? `DOM 页面 ${summary?.domSnapshotCount || 0} 个`
          : `REST 端点 ${summary?.restEndpointCount || 0} 个 · WS 流 ${summary?.wsStreamCount || 0} 个`;
        setObservationStatus(platformId, `采集报告已就绪：${transportSummary} · 覆盖 ${observed}/${total} 类${warnings}。${sourceHint}${coreSummary}${coreMissingHint}可下载正式来源包、观察报告或丢弃。`, warnings || missingCore.length || !entitySummary ? "" : "success");
        continue;
      }
      if (state.receipt?.status === "discarded") {
        setObservationStatus(platformId, "上一份观察报告已丢弃，可重新观察。");
      }
    }
  } catch {
    // 后台未就绪时静默，下一次刷新重试。
  }
}

async function startObservation(platformId) {
  const ui = observationCards.get(platformId);
  if (!ui) return;
  ui.start.disabled = true;
  setObservationStatus(platformId, platformId === "douyin" ? "正在启动数据集生成…" : "正在启动观察…");
  try {
    const durationSeconds = Number(ui.duration.value) || undefined;
    const response = await send({ type: "START_OBSERVATION", platform: platformId, durationSeconds });
    if (!response?.ok) throw new Error(response?.error || (platformId === "douyin" ? "数据集生成启动失败" : "观察启动失败"));
    updateObservationCard(platformId, response.observation || { running: true, stage: platformId === "douyin" ? "collectingSeeds" : "observing", remainingMs: response.durationMs });
    refreshObservationStatus();
  } catch (error) {
    ui.start.disabled = false;
    setObservationStatus(platformId, error instanceof Error ? error.message : (platformId === "douyin" ? "数据集生成启动失败" : "观察启动失败"), "error");
  }
}

async function stopObservation(platformId) {
  const ui = observationCards.get(platformId);
  if (!ui) return;
  ui.stop.disabled = true;
  setObservationStatus(platformId, platformId === "douyin" ? "正在生成最终视频数据集…" : "正在读取观察数据…");
  try {
    const response = await send({ type: "STOP_OBSERVATION", platform: platformId });
    if (!response?.ok) throw new Error(response?.error || "观察读取失败");
  } catch (error) {
    setObservationStatus(platformId, error instanceof Error ? error.message : "观察读取失败", "error");
  } finally {
    refreshObservationStatus();
  }
}

async function exportObservationData(platformId, type, successMessage) {
  const ui = observationCards.get(platformId);
  if (!ui || ui.exportRunning) return;
  ui.exportRunning = true;
  ui.backup.disabled = true;
  ui.desensitize.disabled = true;
  ui.sourceBackup.disabled = true;
  ui.sourceDesensitize.disabled = true;
  const desensitizing = type === "EXPORT_OBSERVATION_DESENSITIZED" || type === "EXPORT_OBSERVATION_SOURCE_DESENSITIZED";
  setObservationStatus(platformId, desensitizing ? "正在脱敏并执行残留自检…" : "正在生成本地文件…");
  try {
    if (platformId === "douyin" && (type === "EXPORT_OBSERVATION_SOURCE_BACKUP" || type === "EXPORT_OBSERVATION_SOURCE_DESENSITIZED")) {
      const response = await send({ type: "GET_DOUYIN_DATASET", desensitized: type === "EXPORT_OBSERVATION_SOURCE_DESENSITIZED" });
      if (!response?.ok || !response.dataset) throw new Error(response?.error || "读取当前数据集失败");
      const blob = new Blob([JSON.stringify(response.dataset, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = type === "EXPORT_OBSERVATION_SOURCE_DESENSITIZED"
        ? "douyin-interest-video-dataset-desensitized.json"
        : "douyin-interest-video-dataset.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setObservationStatus(platformId, successMessage, "success");
      return;
    }
    const response = await send({ type, platform: platformId });
    if (!response?.ok) throw new Error(response?.error || "导出失败");
    setObservationStatus(platformId, successMessage, "success");
  } catch (error) {
    setObservationStatus(platformId, error instanceof Error ? error.message : "导出失败", "error");
  } finally {
    ui.exportRunning = false;
    ui.backup.disabled = !ui.exportAvailable;
    ui.desensitize.disabled = !ui.exportAvailable;
    ui.sourceBackup.disabled = !ui.exportAvailable;
    ui.sourceDesensitize.disabled = !ui.exportAvailable;
  }
}

for (const [platformId, ui] of observationCards) {
  ui.start.addEventListener("click", () => startObservation(platformId));
  ui.stop.addEventListener("click", () => stopObservation(platformId));
  ui.backup.addEventListener("click", () => exportObservationData(platformId, "EXPORT_OBSERVATION_BACKUP", "完整观察备份已生成。"));
  ui.desensitize.addEventListener("click", () => exportObservationData(platformId, "EXPORT_OBSERVATION_DESENSITIZED", "脱敏观察报告已生成，可安全交付核对端点契约。"));
  ui.sourceBackup.addEventListener("click", () => exportObservationData(platformId, "EXPORT_OBSERVATION_SOURCE_BACKUP", platformId === "douyin" ? "感兴趣视频数据集已下载。" : "正式来源包已生成。"));
  ui.sourceDesensitize.addEventListener("click", () => exportObservationData(platformId, "EXPORT_OBSERVATION_SOURCE_DESENSITIZED", platformId === "douyin" ? "脱敏数据集已下载。" : "脱敏正式来源包已生成。"));
  ui.discard.addEventListener("click", async () => {
    try {
      const response = await send({ type: "DISCARD_OBSERVATION_STAGING", platform: platformId });
      if (!response?.ok) throw new Error(response?.error || "丢弃失败");
      setObservationStatus(platformId, platformId === "douyin" ? "当前数据集已清除，可重新生成。" : "观察报告已丢弃，可重新观察。");
    } catch (error) {
      setObservationStatus(platformId, error instanceof Error ? error.message : "丢弃失败", "error");
    } finally {
      refreshObservationStatus();
    }
  });
  ui.saveConfig.addEventListener("click", async () => {
    try {
      const response = await send({ type: "SAVE_CONFIG", config: { observeSeconds: Number(ui.duration.value) } });
      if (!response?.ok) throw new Error(response?.error || "保存设置失败");
      fillObservationDurations(response.config.observeSeconds);
      setObservationStatus(platformId, platformId === "douyin" ? "采集设置已保存，下次生成生效。" : "观察设置已保存（对所有观察平台生效），下次观察生效。", "success");
    } catch (error) {
      setObservationStatus(platformId, error instanceof Error ? error.message : "保存设置失败", "error");
    }
  });
}

// 观察时长是全局配置（四个观察平台共用一个值）：填充/保存时同步所有卡片输入框。
function fillObservationDurations(seconds) {
  for (const ui of observationCards.values()) {
    ui.duration.value = ui.platform.id === "binance" ? 30 : seconds;
  }
}

send({ type: "GET_CONFIG" }).then((response) => {
  if (!response?.ok || !response.config) return;
  document.querySelector("#cfg-timeout").value = response.config.pageTimeout;
  document.querySelector("#cfg-concurrency").value = response.config.singleConcurrency;
  document.querySelector("#cfg-query-concurrency").value = response.config.queryConcurrency;
  document.querySelector("#cfg-ranges").value = (response.config.queryRanges || []).join(",");
  fillObservationDurations(response.config.observeSeconds);
}).catch(() => {});

document.querySelector("#cfg-save").addEventListener("click", async () => {
  const config = {
    pageTimeout: Number(document.querySelector("#cfg-timeout").value),
    singleConcurrency: Number(document.querySelector("#cfg-concurrency").value),
    queryConcurrency: Number(document.querySelector("#cfg-query-concurrency").value),
    queryRanges: document.querySelector("#cfg-ranges").value.split(",").map((item) => item.trim()).filter(Boolean),
  };
  try {
    const response = await send({ type: "SAVE_CONFIG", config });
    if (!response?.ok) throw new Error(response?.error || "保存设置失败");
    setStatus("采集设置已保存，下次采集生效。", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "保存设置失败", "error");
  }
});

send({ type: "GET_INVESTMENT_STATUS" }).then((response) => {
  if (response?.ok) updateTransferStatus(response.status);
}).catch(() => {});
send({ type: "GET_INVESTMENT_STAGING" }).then((response) => {
  if (response?.ok) updateStaging(response.staging);
}).catch(() => {});
refreshObservationStatus();
