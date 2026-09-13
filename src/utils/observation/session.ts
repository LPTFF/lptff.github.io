/**
 * 需求验证与埋点监控 - 会话管理
 * 连续 30 分钟无主动交互后，新交互开始新会话；会话规则版本化
 */

export const SESSION_RULES_VERSION = "1.0.0";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 分钟

let currentSessionId: string | null = null;
let lastInteractionTime = 0;
let isListenerAttached = false;

function generateRandomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "sess_" + Math.random().toString(36).slice(2, 11) + "_" + Date.now().toString(36);
}

function handleInteraction(): void {
  const now = Date.now();
  if (currentSessionId && lastInteractionTime > 0 && now - lastInteractionTime > INACTIVITY_TIMEOUT_MS) {
    // 超过 30 分钟无交互，轮换新会话
    currentSessionId = generateRandomId();
  }
  lastInteractionTime = now;
}

export function initSessionManager(): void {
  if (typeof window === "undefined" || isListenerAttached) return;

  // 节流监听用户主动动作
  let throttleTimer = 0;
  const throttledHandler = () => {
    const now = Date.now();
    if (now - throttleTimer > 2000) {
      throttleTimer = now;
      handleInteraction();
    }
  };

  window.addEventListener("pointerdown", throttledHandler, { passive: true });
  window.addEventListener("keydown", throttledHandler, { passive: true });
  isListenerAttached = true;
}

export function getSessionId(): string {
  const now = Date.now();
  if (!currentSessionId) {
    currentSessionId = generateRandomId();
    lastInteractionTime = now;
  } else if (lastInteractionTime > 0 && now - lastInteractionTime > INACTIVITY_TIMEOUT_MS) {
    currentSessionId = generateRandomId();
    lastInteractionTime = now;
  }
  return currentSessionId;
}

export function isPageForeground(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

export function resetSession(): void {
  currentSessionId = null;
  lastInteractionTime = 0;
}
