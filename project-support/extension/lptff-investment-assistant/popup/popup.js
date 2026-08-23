const statusElement = document.querySelector("#status");
const branchElement = document.querySelector("#branches");
const collectButton = document.querySelector("#collect");
const backupButton = document.querySelector("#backup");
const desensitizeButton = document.querySelector("#desensitize");
let exportAvailable = false;
let exportRunning = false;

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
  statusElement.className = kind;
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
  const state = {
    pending: "等待",
    running: "进行中",
    completed: "完成",
    partial: "部分完成",
  }[branch.status] || branch.status;
  return `${state}${count ? ` ${count}` : ""}${duration}`;
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
  return coverage.map((item) => `${item.dataset}：${item.completeness}`).join(" · ");
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
});

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
