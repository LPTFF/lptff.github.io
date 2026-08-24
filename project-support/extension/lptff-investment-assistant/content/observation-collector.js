// 多平台观察采集中继（ISOLATED world，服务 binance/zhipin/kuaishou/douyin 四域）。
// 职责与基金 collector 的 requestNetworkData 相同：在扩展后台（chrome.runtime 消息）
// 与 MAIN world 观察桥（window.postMessage）之间转发指令和观察数据，自身不接触页面业务数据。
(() => {
  if (globalThis.__LPTFF_OBSERVATION_COLLECTOR_READY__) return;
  globalThis.__LPTFF_OBSERVATION_COLLECTOR_READY__ = true;

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
      requestBridge("LPTFF_OBS_GET_DATA", "LPTFF_OBS_DATA", 6000).then((data) => {
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
