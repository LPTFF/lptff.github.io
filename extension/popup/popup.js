const statusElement = document.querySelector("#status");
const branchElement = document.querySelector("#branches");
const collectButton = document.querySelector("#collect");
const backupButton = document.querySelector("#backup");
const desensitizeButton = document.querySelector("#desensitize");
let exportAvailable = false;
let exportRunning = false;

// 领域模式切换：金融（基金采集 + 币安合约来源采集）/ 市场需求（BOSS直聘）/ 内容平台授权（抖音与B站固定作者）
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
const BOSS_FEATURES_KEY = "lptffBossFeatures";
const bossAutoDeliveryToggle = document.querySelector("#boss-auto-delivery-enabled");
const bossAiCommunicationToggle = document.querySelector("#boss-ai-communication-enabled");
const bossFeatureStatus = document.querySelector("#boss-feature-status");

async function loadBossFeatures() {
  const stored = await chrome.storage.local.get(BOSS_FEATURES_KEY);
  const features = stored[BOSS_FEATURES_KEY] || {};
  bossAutoDeliveryToggle.checked = features.autoDelivery !== false;
  bossAiCommunicationToggle.checked = features.aiCommunication !== false;
}

async function saveBossFeatures() {
  const features = {
    autoDelivery: bossAutoDeliveryToggle.checked,
    aiCommunication: bossAiCommunicationToggle.checked,
  };
  bossFeatureStatus.textContent = "正在应用功能开关…";
  await chrome.storage.local.set({ [BOSS_FEATURES_KEY]: features });
  const tabs = await chrome.tabs.query({ url: ["https://*.zhipin.com/*", "https://zhipin.com/*"] });
  await Promise.all(tabs.filter((tab) => Number.isInteger(tab.id)).map((tab) => chrome.tabs.reload(tab.id)));
  bossFeatureStatus.textContent = `自动投递已${features.autoDelivery ? "开启" : "关闭"}，AI 沟通小助手已${features.aiCommunication ? "开启" : "关闭"}；BOSS 页面已刷新。`;
}

for (const toggle of [bossAutoDeliveryToggle, bossAiCommunicationToggle]) {
  toggle.addEventListener("change", () => saveBossFeatures().catch((error) => {
    bossFeatureStatus.textContent = `开关保存失败：${error instanceof Error ? error.message : "未知错误"}`;
  }));
}
loadBossFeatures().catch((error) => {
  bossFeatureStatus.textContent = `开关读取失败：${error instanceof Error ? error.message : "未知错误"}`;
});

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
  const saved = new URLSearchParams(location.search).get("mode") || localStorage.getItem("lptff-ext-mode");
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

send({ type: "GET_CONFIG" }).then((response) => {
  if (!response?.ok || !response.config) return;
  document.querySelector("#cfg-timeout").value = response.config.pageTimeout;
  document.querySelector("#cfg-concurrency").value = response.config.singleConcurrency;
  document.querySelector("#cfg-query-concurrency").value = response.config.queryConcurrency;
  document.querySelector("#cfg-ranges").value = (response.config.queryRanges || []).join(",");
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
