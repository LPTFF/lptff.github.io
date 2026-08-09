const status = document.querySelector("#status");
const buttons = Array.from(document.querySelectorAll("button"));

const stageLabels = {
  hold: "正在采集全部持仓…",
  single: "正在采集单基金详情…",
  transactions: "正在采集当前和历史交易…",
  downloading: "正在整理并下载…",
  completed: "自动采集完成，JSON 备份已下载；等待 Investment OS 导入本批数据",
  error: "自动采集失败",
  idle: "",
};

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = kind;
}

function formatProgress(progress) {
  const label = stageLabels[progress.stage] || progress.stage || "正在采集…";
  const fund = progress.stage === "single" && progress.activeFunds?.length
    ? `（并行 ${progress.activeFunds.join("、")}，已完成 ${progress.completedFunds}/${progress.fundTotal}）`
    : progress.stage === "single"
      ? `（已完成 ${progress.completedFunds}/${progress.fundTotal}）`
      : "";
  const transactions = progress.stage === "transactions"
    ? ` 已并行查询当前/历史范围，已捕获 ${progress.transactionSnapshots || 0} 个交易请求。`
    : "";
  return `${label}${fund}${transactions}`;
}

function updateProgress(progress) {
  if (!progress) return;
  const message = formatProgress(progress);
  const kind = progress.stage === "error" ? "error" : progress.stage === "completed" ? "success" : "";
  setStatus(message, kind);
}

function formatCoverage(staging) {
  const coverage = staging?.dataset?.coverage || [];
  if (!coverage.length) return "";
  return coverage.map((item) => `${item.dataset}：${item.completeness}`).join(" · ");
}

function updateCoverage(staging) {
  const element = document.querySelector("#coverage");
  if (element) element.textContent = formatCoverage(staging);
}

function updateTransferStatus(status) {
  if (!status || status.collection?.running) return;
  if (status.pending) {
    setStatus("采集完成，等待 Investment OS 读取；JSON 备份与待导入数据均已生成。", "success");
    return;
  }
  if (status.receipt?.status === "imported") {
    setStatus("最近一批已写入 Investment OS，本次插件暂存已清除；Ledger 数据仍保留。", "success");
    return;
  }
  if (status.receipt?.status === "discarded") {
    setStatus("最近一批待导入数据已丢弃，可重新同步生成新批次。");
  }
}

function request() {
  buttons.forEach((button) => { button.disabled = true; });
  setStatus("正在启动自动采集…");
  chrome.runtime.sendMessage({ type: "START_AUTO_COLLECTION" }, (response) => {
    if (chrome.runtime.lastError) {
      buttons.forEach((button) => { button.disabled = false; });
      setStatus(chrome.runtime.lastError.message || "扩展通信失败", "error");
      return;
    }
    if (!response?.ok) {
      buttons.forEach((button) => { button.disabled = false; });
      setStatus(response?.error || "自动采集失败", "error");
      return;
    }
    chrome.runtime.sendMessage({ type: "GET_INVESTMENT_STAGING" }, (stagingResponse) => {
      if (!chrome.runtime.lastError && stagingResponse?.ok) updateCoverage(stagingResponse.staging);
    });
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "COLLECTION_PROGRESS") return;
  updateProgress(message);
  if (message.stage === "completed" || message.stage === "error") {
    buttons.forEach((button) => { button.disabled = false; });
  }
});

document.querySelector("#export").addEventListener("click", request);
chrome.runtime.sendMessage({ type: "GET_COLLECTION_STATUS" }, (response) => {
  if (!chrome.runtime.lastError && response?.ok && response.status?.running) {
    buttons.forEach((button) => { button.disabled = true; });
    updateProgress(response.status);
  }
});
chrome.runtime.sendMessage({ type: "GET_INVESTMENT_STATUS" }, (response) => {
  if (!chrome.runtime.lastError && response?.ok) updateTransferStatus(response.status);
});
