(() => {
  const isAllowedOrigin =
    location.protocol === "http:" && ["localhost", "127.0.0.1"].includes(location.hostname)
    || location.origin === "https://lptff.github.io";

  if (!isAllowedOrigin) return;

  const CONTEXT_INVALIDATED_MESSAGE = "采集插件已重新加载或更新，当前页面旧连接已失效。请刷新当前页面后重试";
  let contextInvalidated = false;
  let lifecyclePort = null;

  function connectLifecyclePort() {
    if (lifecyclePort || contextInvalidated) return;

    try {
      const port = chrome.runtime.connect({ name: "lptff-web-bridge-lifecycle" });
      lifecyclePort = port;
      port.onDisconnect.addListener(() => {
        let disconnectMessage = "";
        try {
          // Reading lastError prevents Chrome from reporting an unchecked error.
          disconnectMessage = chrome.runtime.lastError?.message || "";
        } catch {
          contextInvalidated = true;
        }

        if (lifecyclePort === port) lifecyclePort = null;
        if (/back\/forward cache/i.test(disconnectMessage)) return;
        contextInvalidated = true;
      });
    } catch {
      contextInvalidated = true;
    }
  }

  connectLifecyclePort();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) connectLifecyclePort();
  });

  function postResponse(message, responseType, response) {
    try {
      const cleanResponse = response !== undefined && response !== null ? JSON.parse(JSON.stringify(response)) : response;
      window.postMessage({
        source: "lptff-investment-assistant",
        type: responseType,
        requestId: message.requestId,
        response: cleanResponse,
      }, location.origin);
    } catch (err) {
      console.error("[web-bridge] postResponse serialization error:", err);
      try {
        window.postMessage({
          source: "lptff-investment-assistant",
          type: responseType,
          requestId: message.requestId,
          response: { ok: false, error: "扩展响应序列化失败: " + (err instanceof Error ? err.message : String(err)) },
        }, location.origin);
      } catch {}
    }
  }

  function hasRuntimeContext() {
    if (contextInvalidated) return false;
    try {
      if (chrome.runtime?.id) return true;
    } catch {
      // An extension reload invalidates the old content-script context.
    }
    contextInvalidated = true;
    return false;
  }

  function forward(message, responseType, attempt = 0) {
    if (!hasRuntimeContext()) {
      postResponse(message, responseType, { ok: false, error: CONTEXT_INVALIDATED_MESSAGE });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        let runtimeError;
        try {
          runtimeError = chrome.runtime.lastError;
        } catch {
          contextInvalidated = true;
          postResponse(message, responseType, { ok: false, error: CONTEXT_INVALIDATED_MESSAGE });
          return;
        }

        const missingReceiver = /Could not establish connection|Receiving end does not exist/i.test(runtimeError?.message || "");
        if (missingReceiver && attempt < 4) {
          setTimeout(() => forward(message, responseType, attempt + 1), 150 * (attempt + 1));
          return;
        }
        postResponse(message, responseType, response || {
          ok: false,
          error: missingReceiver
            ? "采集插件后台尚未连接。请在 chrome://extensions 确认加载插件，并刷新当前页面"
            : runtimeError?.message || "采集插件后台未响应，请在 chrome://extensions 重新加载插件后刷新本页面",
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || "");
      if (/Extension context invalidated/i.test(errorMessage) || !hasRuntimeContext()) {
        contextInvalidated = true;
        postResponse(message, responseType, { ok: false, error: CONTEXT_INVALIDATED_MESSAGE });
        return;
      }
      postResponse(message, responseType, {
        ok: false,
        error: errorMessage || "采集插件通信失败，请刷新当前页面后重试",
      });
    }
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
    if (event.data?.type === "LPTFF_BINANCE_GET_STAGING") {
      forward({ type: "GET_BINANCE_STAGING", requestId: event.data.requestId }, "LPTFF_BINANCE_STAGING");
    }
    if (event.data?.type === "LPTFF_BINANCE_GET_STATUS") {
      forward({ type: "GET_BINANCE_STATUS", requestId: event.data.requestId }, "LPTFF_BINANCE_STATUS");
    }
    if (event.data?.type === "LPTFF_BINANCE_ACK_STAGING") {
      forward({ type: "ACK_BINANCE_STAGING", requestId: event.data.requestId }, "LPTFF_BINANCE_STAGING_ACKNOWLEDGED");
    }
    if (event.data?.type === "LPTFF_BINANCE_DISCARD_STAGING") {
      forward({ type: "DISCARD_BINANCE_STAGING", requestId: event.data.requestId }, "LPTFF_BINANCE_STAGING_DISCARDED");
    }
    if (event.data?.type === "LPTFF_BINANCE_START_COLLECTION") {
      forward({ type: "START_BINANCE_COLLECTION", requestId: event.data.requestId }, "LPTFF_BINANCE_COLLECTION_STARTED");
    }
    if (event.data?.type === "LPTFF_BINANCE_STOP_COLLECTION") {
      forward({ type: "STOP_OBSERVATION", platform: "binance", requestId: event.data.requestId }, "LPTFF_BINANCE_COLLECTION_STOPPED");
    }
    if (event.data?.type === "LPTFF_CAREER_CHECK_STATUS") {
      forward({ type: "GET_CAREER_STATUS", requestId: event.data.requestId }, "LPTFF_CAREER_STATUS");
    }
    if (event.data?.type === "LPTFF_CAREER_EXTRACT_PROFILE") {
      forward({
        type: "EXTRACT_CAREER_PROFILE",
        requestId: event.data.requestId,
        resumeText: event.data.resumeText,
        meta: event.data.meta,
      }, "LPTFF_CAREER_PROFILE_EXTRACTED");
    }
    if (event.data?.type === "LPTFF_CAREER_MATCH_DIRECTIONS") {
      forward({
        type: "MATCH_CAREER_DIRECTIONS",
        requestId: event.data.requestId,
        profile: event.data.profile,
        marketSnapshot: event.data.marketSnapshot,
        preferences: event.data.preferences,
      }, "LPTFF_CAREER_DIRECTIONS_MATCHED");
    }
    if (event.data?.type === "LPTFF_CAREER_GET_SAVED") {
      forward({ type: "GET_CAREER_SAVED", requestId: event.data.requestId }, "LPTFF_CAREER_SAVED");
    }
    if (event.data?.type === "LPTFF_CAREER_CLEAR_DATA") {
      forward({ type: "CLEAR_CAREER_DATA", requestId: event.data.requestId }, "LPTFF_CAREER_DATA_CLEARED");
    }
    if (event.data?.type === "LPTFF_CAREER_SYNC_AUTOPILOT") {
      forward({
        type: "SYNC_CAREER_AUTOPILOT",
        requestId: event.data.requestId,
        snippet: event.data.snippet,
      }, "LPTFF_CAREER_AUTOPILOT_SYNCED");
    }
    if (event.data?.type === "LPTFF_CAREER_GET_GEMINI_CONFIG") {
      forward({ type: "GET_CAREER_GEMINI_CONFIG", requestId: event.data.requestId }, "LPTFF_CAREER_GEMINI_CONFIG");
    }
    if (event.data?.type === "LPTFF_CAREER_REVEAL_GEMINI_KEY") {
      forward({ type: "REVEAL_CAREER_GEMINI_KEY", requestId: event.data.requestId }, "LPTFF_CAREER_GEMINI_KEY_REVEALED");
    }
    if (event.data?.type === "LPTFF_CAREER_SAVE_GEMINI_CONFIG") {
      forward({
        type: "SAVE_CAREER_GEMINI_CONFIG",
        requestId: event.data.requestId,
        model: event.data.model,
        geminiKey: event.data.geminiKey,
      }, "LPTFF_CAREER_GEMINI_CONFIG_SAVED");
    }
    if (event.data?.type === "LPTFF_CAREER_TEST_GEMINI") {
      forward({
        type: "TEST_CAREER_GEMINI",
        requestId: event.data.requestId,
        config: event.data.config,
      }, "LPTFF_CAREER_GEMINI_TESTED");
    }
    if (event.data?.type === "LPTFF_CAREER_CLEAR_GEMINI_KEY") {
      forward({ type: "CLEAR_CAREER_GEMINI_KEY", requestId: event.data.requestId }, "LPTFF_CAREER_GEMINI_KEY_CLEARED");
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "OBSERVATION_PROGRESS" && message.platform === "binance") {
      window.postMessage({ source: "lptff-investment-assistant", type: "LPTFF_BINANCE_COLLECTION_PROGRESS", progress: message }, location.origin);
      return;
    }
    if (message?.type !== "COLLECTION_PROGRESS") return;
    window.postMessage({
      source: "lptff-investment-assistant",
      type: "LPTFF_INVESTMENT_COLLECTION_PROGRESS",
      progress: message,
    }, location.origin);
  });
})();
