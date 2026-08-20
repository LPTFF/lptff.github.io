(() => {
  const isAllowedOrigin =
    location.protocol === "http:" && ["localhost", "127.0.0.1"].includes(location.hostname)
    || location.origin === "https://lptff.github.io";

  if (!isAllowedOrigin) return;

  function forward(message, responseType, attempt = 0) {
    chrome.runtime.sendMessage(message, (response) => {
      const runtimeError = chrome.runtime.lastError;
      const missingReceiver = /Could not establish connection|Receiving end does not exist/i.test(runtimeError?.message || "");
      if (missingReceiver && attempt < 4) {
        setTimeout(() => forward(message, responseType, attempt + 1), 150 * (attempt + 1));
        return;
      }
      window.postMessage({
        source: "lptff-investment-assistant",
        type: responseType,
        requestId: message.requestId,
        response: response || {
          ok: false,
          error: missingReceiver
            ? "采集插件后台尚未连接。请在 chrome://extensions 重新加载插件，并刷新当前基金复盘页面"
            : runtimeError?.message || "Investment 插件后台未响应，请在 chrome://extensions 重新加载插件后刷新本页面",
        },
      }, location.origin);
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    if (event.data?.type === "LPTFF_INVESTMENT_GET_STAGING") {
      forward({ type: "GET_INVESTMENT_STAGING", requestId: event.data.requestId }, "LPTFF_INVESTMENT_STAGING");
    }
    if (event.data?.type === "LPTFF_INVESTMENT_ACK_STAGING") {
      forward({ type: "ACK_INVESTMENT_STAGING", requestId: event.data.requestId }, "LPTFF_INVESTMENT_STAGING_ACKNOWLEDGED");
    }
    if (event.data?.type === "LPTFF_INVESTMENT_GET_STATUS") {
      forward({ type: "GET_INVESTMENT_STATUS", requestId: event.data.requestId }, "LPTFF_INVESTMENT_STATUS");
    }
    if (event.data?.type === "LPTFF_INVESTMENT_DISCARD_STAGING") {
      forward({ type: "DISCARD_INVESTMENT_STAGING", requestId: event.data.requestId }, "LPTFF_INVESTMENT_STAGING_DISCARDED");
    }
    if (event.data?.type === "LPTFF_INVESTMENT_START_COLLECTION") {
      forward({
        type: "START_AUTO_COLLECTION",
        requestId: event.data.requestId,
      }, "LPTFF_INVESTMENT_COLLECTION_STARTED");
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "COLLECTION_PROGRESS") return;
    window.postMessage({
      source: "lptff-investment-assistant",
      type: "LPTFF_INVESTMENT_COLLECTION_PROGRESS",
      progress: message,
    }, location.origin);
  });
})();
