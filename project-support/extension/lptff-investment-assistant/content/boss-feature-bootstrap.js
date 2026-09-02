(() => {
  if (globalThis.__LPTFF_BOSS_FEATURE_BOOTSTRAP__) return;
  globalThis.__LPTFF_BOSS_FEATURE_BOOTSTRAP__ = true;
  chrome.runtime.sendMessage({ type: "BOSS_FEATURE_BOOTSTRAP" }, (response) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (!response?.ok) console.error("BOSS 功能加载失败", response?.error || "未知错误");
  });
})();
