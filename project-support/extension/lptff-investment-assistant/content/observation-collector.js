// 多平台观察采集中继（ISOLATED world，服务 binance/zhipin/kuaishou/douyin 四域）。
// 职责与基金 collector 的 requestNetworkData 相同：在扩展后台（chrome.runtime 消息）
// 与 MAIN world 观察桥（window.postMessage）之间转发指令和观察数据，自身不接触页面业务数据。
(() => {
  if (globalThis.__LPTFF_OBSERVATION_COLLECTOR_READY__) return;
  globalThis.__LPTFF_OBSERVATION_COLLECTOR_READY__ = true;

  function installDouyinDatasetAction() {
    if (location.hostname !== "www.douyin.com" || location.pathname !== "/user/self") return;
    if (new URL(location.href).searchParams.get("showTab") !== "favorite_collection") return;
    if (document.querySelector("#lptff-douyin-dataset-action")) return;
    const host = document.createElement("div");
    host.id = "lptff-douyin-dataset-action";
    host.style.cssText = "position:fixed;right:24px;bottom:88px;z-index:2147483647";
    const shadow = host.attachShadow({ mode: "open" });
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", "抖音感兴趣视频数据集");
    panel.style.cssText = "width:294px;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(20,20,20,.94);color:#fff;box-shadow:0 10px 32px rgba(0,0,0,.32);font-family:system-ui";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "开始高效采集";
    button.style.cssText = "width:100%;border:0;border-radius:999px;padding:11px 18px;background:#fe2c55;color:#fff;font:600 14px/20px system-ui;cursor:pointer";
    const branches = document.createElement("div");
    branches.style.cssText = "display:grid;gap:6px;margin-top:10px";
    const initialBranches = {
      favoriteSeeds: { label: "收藏兴趣种子", status: "pending" },
      tagSearch: { label: "标签并行搜索（3 路）", status: "pending" },
      dataset: { label: "相关视频数据集", status: "pending" },
    };
    const renderBranches = (items = initialBranches) => {
      const fragment = document.createDocumentFragment();
      Object.values(items).forEach((branch) => {
        const row = document.createElement("div");
        row.dataset.status = branch.status;
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.07);font-size:12px;line-height:17px";
        const label = document.createElement("span");
        label.textContent = branch.label;
        const value = document.createElement("strong");
        const state = { pending: "等待", running: "进行中", completed: "完成", partial: "部分完成", failed: "失败" }[branch.status] || branch.status;
        const count = branch.total > 0 ? ` ${branch.completed || 0}/${branch.total}` : "";
        const detail = branch.detail ? ` · ${branch.detail}` : "";
        value.textContent = `${state}${count}${detail}`;
        value.style.color = branch.status === "completed" ? "#63e6a5" : branch.status === "failed" ? "#ff8098" : branch.status === "running" ? "#ffd166" : "#c7c7c7";
        row.append(label, value);
        fragment.append(row);
      });
      branches.replaceChildren(fragment);
    };
    renderBranches();
    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "下载当前数据集";
    download.style.cssText = "display:none;width:100%;margin-top:8px;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 12px;background:transparent;color:#fff;font:500 12px/18px system-ui;cursor:pointer";
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.style.cssText = "display:none;margin-top:8px;padding:2px 4px;color:#ddd;font:12px/18px system-ui";
    const setStatus = (message, isError = false) => {
      status.textContent = message;
      status.style.display = "block";
      status.style.color = isError ? "#ff8098" : "#ddd";
    };
    let cachedDataset = null;
    const downloadDataset = (dataset) => {
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "douyin-interest-video-dataset.json";
      anchor.hidden = true;
      document.documentElement.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
    const downloadCurrentDataset = async () => {
      if (!cachedDataset) {
        const response = await chrome.runtime.sendMessage({ type: "GET_DOUYIN_DATASET" });
        if (!response?.ok || !response.dataset) throw new Error(response?.error || "读取当前数据集失败");
        cachedDataset = response.dataset;
      }
      // cachedDataset 已就绪时，这一调用发生在 click 的同步用户激活栈内。
      downloadDataset(cachedDataset);
      return cachedDataset.summary;
    };
    let pollTimer = null;
    const poll = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: "GET_OBSERVATION_STATUS" });
        const state = response?.status?.platforms?.douyin;
        if (!state) return;
        if (state.observation?.branches) renderBranches(state.observation.branches);
        if (state.observation?.running) {
          button.disabled = true;
          button.style.opacity = ".65";
          if (state.observation.stage === "searchingInterests") {
            setStatus(`3 路并行搜索中 · 已完成 ${state.observation.searchCompleted || 0}/${state.observation.searchTotal || 0}`);
          } else if (state.observation.stage === "collectingSeeds") {
            setStatus("正在读取登录态收藏并提取兴趣标签…");
          } else if (state.observation.stage === "processing") {
            setStatus("正在去重、评分并生成最终数据集…");
          }
          return;
        }
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
        button.disabled = false;
        button.style.opacity = "1";
        if (state.observation?.stage === "error") {
          setStatus((state.observation.warnings || []).at(-1) || "生成失败，请重试", true);
        } else if (state.pending && state.receipt?.productSummary) {
          const summary = state.receipt.productSummary;
          if (!cachedDataset) {
            chrome.runtime.sendMessage({ type: "GET_DOUYIN_DATASET" })
              .then((result) => { if (result?.ok && result.dataset) cachedDataset = result.dataset; })
              .catch(() => {});
          }
          renderBranches({
            favoriteSeeds: { label: "收藏兴趣种子", status: "completed", completed: summary.favoriteVideoCount, total: summary.favoriteVideoCount },
            tagSearch: { label: "标签并行搜索（3 路）", status: "completed", completed: summary.searchedTagCount, total: summary.searchedTagCount },
            dataset: { label: "相关视频数据集", status: "completed", completed: summary.interestVideoCount, total: summary.interestVideoCount },
          });
          download.style.display = "block";
          setStatus(`已生成并下载：收藏 ${summary.favoriteVideoCount} 条，标签 ${summary.searchedTagCount} 个，相关视频 ${summary.interestVideoCount} 条`);
        }
      } catch {
        // 扩展重载的瞬间连接会短暂失效，下一次点击可恢复。
      }
    };
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.style.opacity = ".65";
      renderBranches();
      setStatus("正在启动高效采集…");
      try {
        const response = await chrome.runtime.sendMessage({ type: "START_OBSERVATION", platform: "douyin", durationSeconds: 30 });
        if (!response?.ok) throw new Error(response?.error || "启动失败");
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(poll, 1000);
        poll();
      } catch (error) {
        button.disabled = false;
        button.style.opacity = "1";
        setStatus(error instanceof Error ? error.message : "启动失败", true);
      }
    });
    download.addEventListener("click", async () => {
      download.disabled = true;
      try {
        await downloadCurrentDataset();
        setStatus("下载已启动，请在 Chrome 下载记录中查看");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "下载失败", true);
      } finally {
        download.disabled = false;
      }
    });
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type !== "OBSERVATION_PROGRESS" || message.platform !== "douyin") return;
      renderBranches(message.branches);
      if (message.running) {
        if (message.stage === "collectingSeeds") setStatus("正在读取登录态收藏并提取兴趣标签…");
        if (message.stage === "searchingInterests") setStatus(`3 路并行搜索中 · 已完成 ${message.searchCompleted || 0}/${message.searchTotal || 0}`);
        if (message.stage === "processing") setStatus("正在去重、评分并生成最终数据集…");
        return;
      }
      button.disabled = false;
      button.style.opacity = "1";
      if (message.stage === "completed") {
        download.style.display = "block";
        cachedDataset = null;
        chrome.runtime.sendMessage({ type: "GET_DOUYIN_DATASET" })
          .then((result) => {
            if (result?.ok && result.dataset) cachedDataset = result.dataset;
            setStatus("数据集已生成，请点击“下载当前数据集”保存文件");
          })
          .catch(() => setStatus("数据集已生成，请点击“下载当前数据集”保存文件"));
      }
      if (message.stage === "error") setStatus((message.warnings || []).at(-1) || "生成失败，请重试", true);
    });
    panel.append(button, branches, status, download);
    shadow.append(panel);
    document.documentElement.append(host);
    poll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installDouyinDatasetAction, { once: true });
  else installDouyinDatasetAction();

  function requestBridge(type, responseType, timeout = 4000) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (data) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMessage);
        resolve(data || null);
      };
      const onMessage = (event) => {
        if (event.source === window && event.origin === location.origin && event.data?.type === responseType) {
          finish(event.data.data);
        }
      };
      window.addEventListener("message", onMessage);
      window.postMessage({ type }, location.origin);
      setTimeout(() => finish(null), timeout);
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "OBSERVATION_PING") {
      sendResponse({ ok: true, url: location.href });
      return false;
    }
    if (message?.type === "OBSERVATION_READ") {
      requestBridge("LPTFF_OBS_GET_DATA", "LPTFF_OBS_DATA", 12000).then((data) => {
        if (data) sendResponse({ ok: true, data });
        else sendResponse({ ok: false, error: "观察桥未响应。请确认目标页面已加载并重新加载插件后重试" });
      });
      return true;
    }
    if (message?.type === "BINANCE_HISTORY_START") {
      requestBridge("LPTFF_BINANCE_HISTORY_START", "LPTFF_BINANCE_HISTORY_STATE", 4000).then((data) => {
        if (data) sendResponse({ ok: true, data });
        else sendResponse({ ok: false, error: "币安历史采集桥未响应" });
      });
      return true;
    }
    if (message?.type === "BINANCE_HISTORY_STATUS") {
      requestBridge("LPTFF_BINANCE_HISTORY_STATUS", "LPTFF_BINANCE_HISTORY_STATE", 4000).then((data) => {
        if (data) sendResponse({ ok: true, data });
        else sendResponse({ ok: false, error: "币安历史采集状态不可用" });
      });
      return true;
    }
    if (message?.type === "OBSERVATION_RESET") {
      requestBridge("LPTFF_OBS_RESET", "LPTFF_OBS_RESET_OK", 2000);
      // 重置无需等待确认：桥同步清空，这里立即返回即可。
      sendResponse({ ok: true });
      return false;
    }
    return undefined;
  });
})();
