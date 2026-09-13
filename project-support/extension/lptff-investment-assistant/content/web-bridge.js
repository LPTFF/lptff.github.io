(() => {
  const isAllowedOrigin =
    location.protocol === "http:" && ["localhost", "127.0.0.1"].includes(location.hostname)
    || location.origin === "https://lptff.github.io";

  if (!isAllowedOrigin) return;

  if (typeof window !== "undefined" && window.__LPTFF_WEB_BRIDGE_DISPOSE__) {
    try { window.__LPTFF_WEB_BRIDGE_DISPOSE__(); } catch {}
  }

  const CONTEXT_INVALIDATED_MESSAGE = "采集插件已重新加载或更新，当前页面旧连接已失效。请刷新当前页面后重试";
  let contextInvalidated = false;
  let lifecyclePort = null;

  function connectLifecyclePort() {
    if (lifecyclePort) return;
    if (!hasRuntimeContext()) return;

    try {
      const port = chrome.runtime.connect({ name: "lptff-web-bridge-lifecycle" });
      lifecyclePort = port;
      port.onDisconnect.addListener(() => {
        if (lifecyclePort === port) lifecyclePort = null;
        try {
          void chrome.runtime.lastError;
        } catch {}

        // 仅当 chrome.runtime.id 真正失效（如扩展在扩展管理页被重载或卸载）时，才标记 contextInvalidated。
        // 若 service worker 仅仅是正常闲置休眠，chrome.runtime.id 依然存在且完全有效，切勿误判失效！
        try {
          if (!chrome.runtime?.id) {
            contextInvalidated = true;
          }
        } catch {
          contextInvalidated = true;
        }
      });
    } catch {
      try {
        if (!chrome.runtime?.id) contextInvalidated = true;
      } catch {
        contextInvalidated = true;
      }
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
    if (contextInvalidated) {
      try {
        if (chrome.runtime?.id) {
          contextInvalidated = false;
          return true;
        }
      } catch {
        return false;
      }
      return false;
    }
    try {
      if (chrome.runtime?.id) return true;
    } catch {
      contextInvalidated = true;
      return false;
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

  function onWindowMessage(event) {
    if (event.source !== window || event.origin !== location.origin) return;
    if (!hasRuntimeContext()) {
      window.removeEventListener("message", onWindowMessage);
      return;
    }
    if (event.data?.type === "LPTFF_AUTHORIZED_CONTENT_REQUEST") {
      const actions = ["STATUS", "START", "START_ALL", "RESUME", "STOP", "LOGIN", "RESULT", "OPEN_ASSISTANT", "AI_CONFIG", "AI_REVEAL", "AI_CLEAR", "AI_TEST", "AI_CACHED", "AI_SAVE", "AI_ANALYZE"];
      if (!actions.includes(event.data.action)) return;
      forward({ type: `AUTHORIZED_CONTENT_${event.data.action}`, platform: event.data.platform, resume: event.data.resume,
        mode: event.data.mode, config: event.data.config, domain: event.data.domain, items: event.data.items, requestId: event.data.requestId }, "LPTFF_AUTHORIZED_CONTENT_RESPONSE");
    }
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
  }

  function onRuntimeMessage(message) {
    if (!hasRuntimeContext()) {
      try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch {}
      return;
    }
    if (message?.type === "AUTHORIZED_CONTENT_PROGRESS") {
      window.postMessage({
        source: "lptff-investment-assistant",
        type: "LPTFF_AUTHORIZED_CONTENT_PROGRESS",
        snapshot: message.snapshot,
      }, location.origin);
      return;
    }
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
  }

  window.addEventListener("message", onWindowMessage);
  chrome.runtime.onMessage.addListener(onRuntimeMessage);

  window.__LPTFF_WEB_BRIDGE_DISPOSE__ = () => {
    window.removeEventListener("message", onWindowMessage);
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch {}
    if (lifecyclePort) {
      try { lifecyclePort.disconnect(); } catch {}
      lifecyclePort = null;
    }
  };

  // 广播就绪事件，通知页面扩展已在线，实现免刷新秒连
  try {
    const manifest = (typeof chrome !== "undefined" && chrome.runtime?.getManifest) ? chrome.runtime.getManifest() : {};
    const version = manifest?.version || "3.25.0";
    const buildTag = (typeof window !== "undefined" && window.__LPTFF_EXTENSION_BUILD_INFO__?.buildTag)
      || (typeof self !== "undefined" && self.__LPTFF_EXTENSION_BUILD_INFO__?.buildTag)
      || "cand-3.25.0-bridge";
    const detail = {
      source: "lptff-investment-assistant",
      type: "LPTFF_EXTENSION_READY",
      version,
      buildTag,
      extensionId: (typeof chrome !== "undefined" && chrome.runtime?.id) ? chrome.runtime.id : "mobngggdpoodbnippllglhekfoneapao",
      timestamp: Date.now()
    };
    window.postMessage(detail, location.origin);
    try {
      window.dispatchEvent(new CustomEvent("LPTFF_EXTENSION_READY", { detail }));
    } catch {}
  } catch {}
})();
