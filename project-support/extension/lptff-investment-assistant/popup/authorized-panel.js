(() => {
  const call = async (action, payload = {}) => {
    const response = await chrome.runtime.sendMessage({ type: `AUTHORIZED_CONTENT_${action}`, ...payload });
    if (!response?.ok) throw new Error(response?.error || "扩展未响应");
    return response;
  };
  const cards = new Map();
  const labels = { idle: "尚未采集", running: "采集中", success: "采集完成", partial: "部分来源未完成，可打开来源检查登录", cancelled: "已停止", failed: "采集失败，保留原结果" };
  let timer;
  const policy = fetch(chrome.runtime.getURL("content-freshness.json")).then(response => response.json());
  async function freshness(state) {
    const rule = await policy;
    const times = (state.sources || []).map(source => source.lastSuccessAt || (source.state === "success" ? state.updatedAt : 0));
    if (!times.length || times.some(time => !time || time > Date.now() + 60000)) return "尚未确认采集时间";
    if (state.state !== "success") return "上次采集未完成";
    const age = Date.now() - Math.min(...times);
    return age >= rule.refreshAfterMs ? "信息已过期，建议刷新" : age >= rule.warnAfterMs ? "信息即将过期" : "信息在有效期内";
  }
  async function refresh() {
    clearTimeout(timer);
    try {
      const status = await call("STATUS");
      const busy = Object.values(status.platforms).some(item => item.state === "running");
      for (const [platform, card] of cards) {
        const state = status.platforms[platform];
        card.status.textContent = `${labels[state.state] || state.state} · 本机 ${state.count} 条 · ${await freshness(state)}。网站浮窗可载入结果。`;
        card.start.disabled = busy;
        card.stop.hidden = state.state !== "running";
      }
      timer = setTimeout(refresh, busy ? 2000 : 60000);
    } catch (error) { for (const card of cards.values()) card.status.textContent = error.message; }
  }
  const host = document.querySelector("#authorized-platforms");
  for (const [platform, title, scope] of [
    ["douyin", "抖音 · 作者作品", "李子栗、独孤十一；仅采集作者作品。"],
    ["bilibili", "哔哩哔哩 · 作者动态", "百科老王、国外主机测评、小迪老师、杨博士说AI；按目录归属进入对应资讯页。"],
  ]) {
    const article = document.createElement("article"); article.className = "collection-card";
    const heading = document.createElement("h2"); heading.textContent = title;
    const description = document.createElement("p"); description.textContent = scope;
    const status = document.createElement("p"); status.setAttribute("role", "status");
    article.append(heading, description, status);
    const card = { status };
    for (const [action, text, id] of [["LOGIN", "打开平台 / 登录", "login"], ["START", "手动采集刷新", "start"], ["STOP", "停止采集", "stop"]]) {
      const button = document.createElement("button"); button.type = "button"; button.textContent = text;
      button.addEventListener("click", async () => {
        try { button.disabled = true; await call(action, { platform }); await refresh(); }
        catch (error) { status.textContent = error.message; }
        finally { if (action !== "START") button.disabled = false; }
      });
      card[id] = button; article.append(button);
    }
    cards.set(platform, card); host.append(article);
  }
  const state = document.querySelector("#shared-ai-state");
  const key = document.querySelector("#shared-ai-key");
  const model = document.querySelector("#shared-ai-model");
  const save = document.querySelector("#shared-ai-save");
  const reveal = document.querySelector("#shared-ai-reveal");
  const clear = document.querySelector("#shared-ai-clear");
  let keyDirty = false;
  let hideTimer;
  function hideKey() {
    clearTimeout(hideTimer); key.type = "password"; reveal.textContent = "显示";
    reveal.setAttribute("aria-label", "显示 Gemini Key");

  }
  function busy(value) { clear.disabled = save.disabled = reveal.disabled = key.disabled = model.disabled = value; }
  function display(config) {
    model.value = config.model;
    key.placeholder = "请输入 Gemini API Key";
    document.querySelector("#shared-ai-saved").textContent = config.hasKey ? "已保存" : "未配置";
    state.textContent = config.hasKey ? "已保存 · 与 BOSS 助手及资讯分析共用" : "尚未配置 Gemini Key。";
  }
  key.addEventListener("input", () => { keyDirty = true; state.textContent = "修改未保存"; });
  model.addEventListener("change", () => { state.textContent = "修改未保存"; });
  reveal.addEventListener("click", async () => {
    if (key.type === "text") { hideKey(); return; }
    busy(true);
    try {
      if (!key.value) {
        const result = await call("AI_REVEAL");
        if (!result.value) throw new Error("尚未保存密钥，请先输入并保存。");
        key.value = result.value;
      }
      key.type = "text"; reveal.textContent = "隐藏";
      reveal.setAttribute("aria-label", "隐藏 Gemini Key");
      hideTimer = setTimeout(hideKey, 30000);
    } catch (error) { state.textContent = error.message; }
    finally { busy(false); }
  });
  save.addEventListener("click", async () => {
    busy(true); state.textContent = "正在保存…";
    let saved = false;
    try {
      if (!key.value.trim()) throw new Error("请输入 Gemini Key；删除已保存密钥请使用清除 Key。");
      display(await call("AI_SAVE", { config: { model: model.value, geminiKey: key.value } }));
      keyDirty = false; hideKey(); saved = true;
      state.textContent = "已保存 · 正在测试 Gemini 连接…";
      await call("AI_TEST");
      state.textContent = "已保存 · Gemini 连接测试通过";
    } catch (error) { state.textContent = `${saved ? '已保存，但连接测试失败' : '保存失败'}：${error.message}`; }
    finally { busy(false); }
  });
  clear.addEventListener("click", async () => {
    busy(true);
    try {
      display(await call("AI_CLEAR")); key.value = ""; keyDirty = false; hideKey();
      state.textContent = "Key 已清除 · 全站与 BOSS 助手同步生效";
    } catch (error) { state.textContent = `清除失败：${error.message}`; }
    finally { busy(false); }
  });
  busy(true);
  call("AI_CONFIG").then(async config => {
    if (config.hasKey) key.value = (await call("AI_REVEAL")).value;
    display(config);
  }).catch(error => { state.textContent = error.message; }).finally(() => busy(false));
  refresh();
  window.addEventListener("unload", () => { clearTimeout(timer); clearTimeout(hideTimer); key.value = ""; });
})();
