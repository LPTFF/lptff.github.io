(() => {
  if (globalThis.__LPTFF_BOSS_AUTOPILOT_READY__) return;
  globalThis.__LPTFF_BOSS_AUTOPILOT_READY__ = true;

  const HOST_ID = "lptff-boss-autopilot";
  const LEGACY_LOCAL_MODEL_KEY = "conf-model";
  const LOCAL_STATE_KEY = "lptffBossAutopilotState";
  const LOCAL_LOG_KEY = "lptffBossAutopilotLogs";
  const LOCAL_SAMPLE_KEY = "lptffBossCommunicationSamples";
  const LOCAL_UI_KEY = "lptffBossAutopilotUi";
  const CHAT_URL = "https://www.zhipin.com/web/geek/chat";
  const DEFAULTS = {
    profile: "6年前端开发经验，硕士学历，核心技术栈覆盖 React、Vue、TypeScript、Next.js、Nuxt.js、状态管理、工程化与性能优化；具备金融复杂业务、低代码迁移、微前端、组件平台、可视化、Node.js 协作、AI 与自动化实践。目标为高级/资深前端、前端技术专家或负责人、前端架构、AI 应用前端、低代码/可视化前端及以前端为主的全栈岗位。",
    mustAsk: "核心工作内容与技术栈、团队规模及岗位级别、薪资结构与年终奖、工作时间和双休情况、社保公积金、办公地点与远程安排、是否外包驻场或长期出差、面试流程",
    valuableCriteria: "优先高级/资深前端、前端技术专家或负责人、前端架构、AI 应用前端、低代码/可视化前端、金融科技或复杂中后台；排除兼职实习、纯销售客服、培训收费、劳务派遣、长期驻场外包、长期高频出差和虚假招聘。",
    model: "gemini-3.5-flash-lite",
    autoReply: false,
    sendMode: "preview",
    dailyReplyLimit: 300,
    perConversationLimit: 30,
    replyDelaySeconds: 20,
    hasGeminiKey: false,
    hasWecomWebhook: false,
  };
  let config = { ...DEFAULTS };
  let panel;
  let chatObserver;
  let arrivalPollTimer;
  let processing = false;
  let queueOpening = false;
  const queueOpenFailures = new Map();
  const secretHideTimers = new Map();
  let activeTab = "status";
  let contextInvalidated = false;

  function isContextInvalidatedError(error) {
    return /Extension context invalidated|Receiving end does not exist|Could not establish connection/i.test(String(error?.message || error || ""));
  }

  function stopInvalidatedContext(error) {
    if (!isContextInvalidatedError(error)) return false;
    contextInvalidated = true;
    if (arrivalPollTimer) window.clearInterval(arrivalPollTimer);
    arrivalPollTimer = null;
    window.clearTimeout(ensureChatObserver.timer);
    chatObserver?.disconnect();
    chatObserver = null;
    for (const timer of secretHideTimers.values()) window.clearTimeout(timer);
    secretHideTimers.clear();
    panel?.remove();
    return true;
  }

  async function storageGet(keys) {
    if (contextInvalidated) return {};
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      if (stopInvalidatedContext(error)) return {};
      throw error;
    }
  }

  async function storageSet(value) {
    if (contextInvalidated) return false;
    try {
      await chrome.storage.local.set(value);
      return true;
    } catch (error) {
      if (stopInvalidatedContext(error)) return false;
      throw error;
    }
  }

  async function storageRemove(keys) {
    if (contextInvalidated) return false;
    try {
      await chrome.storage.local.remove(keys);
      return true;
    } catch (error) {
      if (stopInvalidatedContext(error)) return false;
      throw error;
    }
  }

  function call(message) {
    return new Promise((resolve, reject) => {
      if (contextInvalidated) return reject(new Error("扩展已更新，请刷新当前页面"));
      try {
        chrome.runtime.sendMessage(message, (response) => {
          let runtimeError;
          try {
            runtimeError = chrome.runtime.lastError;
          } catch (error) {
            stopInvalidatedContext(error);
            reject(new Error("扩展已更新，请刷新当前页面"));
            return;
          }
          if (runtimeError) {
            const error = new Error(runtimeError.message);
            stopInvalidatedContext(error);
            reject(error);
            return;
          }
          if (!response?.ok) return reject(new Error(response?.error || "操作失败"));
          resolve(response);
        });
      } catch (error) {
        stopInvalidatedContext(error);
        reject(error);
      }
    });
  }

  const qs = (selector) => panel?.querySelector(selector);
  function setStatus(message, tone = "") {
    const node = qs("[data-role='status']");
    if (!node) return;
    if (node.textContent !== message) node.textContent = message;
    node.dataset.tone = tone;
    const headStatus = qs("[data-role='head-status']");
    if (headStatus && headStatus.textContent !== message) headStatus.textContent = message;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function redactCommunicationText(value, limit = 2000) {
    let text = String(value || "").replace(/\s+/g, " ").trim();
    text = text
      .replace(/https?:\/\/[^\s<>'"]+/gi, (raw) => {
        try {
          const url = new URL(raw);
          return `${url.origin}${url.pathname}${url.search || url.hash ? "[链接参数已隐藏]" : ""}`;
        } catch {
          return "[链接已隐藏]";
        }
      })
      .replace(/\b1[3-9]\d{9}\b/g, "[手机号已隐藏]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[邮箱已隐藏]")
      .replace(/\b\d{17}[\dXx]\b/g, "[身份证号已隐藏]")
      .replace(/((?:微信|微 信|WeChat|vx|v信|QQ)\s*(?:号|账号)?\s*[：:]?\s*)[a-zA-Z][-_a-zA-Z0-9]{5,19}/gi, "$1[账号已隐藏]")
      .replace(/((?:api[-_ ]?key|token|cookie|authorization|webhook)\s*[：:=]\s*)[^\s,;，；]+/gi, "$1[凭据已隐藏]");
    return text.slice(0, limit);
  }

  function conversationKey(value) {
    let hash = 2166136261;
    for (const char of String(value || "")) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `conversation-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function setNativeInput(input, value) {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function switchTab(tab) {
    activeTab = ["status", "config", "rules", "logs"].includes(tab) ? tab : "status";
    panel?.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === activeTab)));
    panel?.querySelectorAll("[data-tab-panel]").forEach((section) => { section.hidden = section.dataset.tabPanel !== activeTab; });
    if (activeTab === "logs") void renderLogs();
  }

  async function restoreUiState() {
    const stored = await storageGet(LOCAL_UI_KEY);
    const ui = stored[LOCAL_UI_KEY] || {};
    switchTab(ui.activeTab || "status");
    if (Number.isFinite(ui.left) && Number.isFinite(ui.top)) {
      const maxLeft = Math.max(8, innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(8, innerHeight - panel.querySelector(".lptff-head").offsetHeight - 8);
      panel.style.left = `${Math.min(Math.max(8, ui.left), maxLeft)}px`;
      panel.style.top = `${Math.min(Math.max(8, ui.top), maxTop)}px`;
      panel.style.right = "auto";
    }
  }

  async function persistUiState() {
    const rect = panel.getBoundingClientRect();
    await storageSet({ [LOCAL_UI_KEY]: { left: Math.round(rect.left), top: Math.round(rect.top), activeTab } });
  }

  function clampPanelPosition() {
    if (panel.dataset.pinRight === "true") {
      panel.style.left = "auto";
      panel.style.right = "8px";
      const rect = panel.getBoundingClientRect();
      panel.style.top = `${Math.min(Math.max(8, rect.top), Math.max(8, innerHeight - panel.querySelector(".lptff-head").offsetHeight - 8))}px`;
      return;
    }
    const rect = panel.getBoundingClientRect();
    panel.style.right = "auto";
    panel.style.left = `${Math.min(Math.max(8, rect.left), Math.max(8, innerWidth - rect.width - 8))}px`;
    panel.style.top = `${Math.min(Math.max(8, rect.top), Math.max(8, innerHeight - panel.querySelector(".lptff-head").offsetHeight - 8))}px`;
  }

  async function appendLog(action, outcome, tone = "info", label = "") {
    const stored = await storageGet(LOCAL_LOG_KEY);
    const logs = Array.isArray(stored[LOCAL_LOG_KEY]) ? stored[LOCAL_LOG_KEY] : [];
    logs.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), action: String(action).slice(0, 80), outcome: String(outcome).slice(0, 240), tone, label: String(label).replace(/\s+/g, " ").trim().slice(0, 160) });
    await storageSet({ [LOCAL_LOG_KEY]: logs.slice(-200) });
    if (activeTab === "logs") await renderLogs();
  }

  async function appendCommunicationSample(sample) {
    const stored = await storageGet(LOCAL_SAMPLE_KEY);
    const samples = Array.isArray(stored[LOCAL_SAMPLE_KEY]) ? stored[LOCAL_SAMPLE_KEY] : [];
    const now = Date.now();
    samples.push({
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      at: now,
      conversationKey: conversationKey(sample.conversationId),
      label: redactCommunicationText(sample.label, 160),
      model: String(config.model || "").slice(0, 80),
      mode: config.sendMode === "live" ? "实际发送" : "安全预览",
      recruiterMessage: redactCommunicationText(sample.recruiterMessage, 1500),
      context: redactCommunicationText(sample.context, 5000),
      suggestedReply: redactCommunicationText(sample.suggestedReply, 1200),
      action: String(sample.action || "未处理").slice(0, 80),
      reason: redactCommunicationText(sample.reason, 1200),
      humanAction: redactCommunicationText(sample.humanAction, 500),
      valuable: sample.valuable === true,
      requirementsComplete: sample.requirementsComplete === true,
      allCriteriaMet: sample.allCriteriaMet === true,
      missingQuestions: Array.isArray(sample.missingQuestions) ? sample.missingQuestions.map((item) => redactCommunicationText(item, 200)).filter(Boolean).slice(0, 20) : [],
    });
    const retained = samples.filter((item) => Number(item.at) >= now - 30 * 864e5).slice(-200);
    await storageSet({ [LOCAL_SAMPLE_KEY]: retained });
    if (activeTab === "logs") await renderLogs();
  }

  async function renderLogs() {
    const node = qs("[data-role='logs']");
    const samplesNode = qs("[data-role='communication-samples']");
    if (!node || !samplesNode) return;
    const stored = await storageGet([LOCAL_LOG_KEY, LOCAL_SAMPLE_KEY]);
    const logs = (Array.isArray(stored[LOCAL_LOG_KEY]) ? stored[LOCAL_LOG_KEY] : []).slice(-100).reverse();
    const samples = (Array.isArray(stored[LOCAL_SAMPLE_KEY]) ? stored[LOCAL_SAMPLE_KEY] : []).slice(-50).reverse();
    samplesNode.innerHTML = samples.length ? samples.map((item) => `
      <details class="lptff-sample" data-action="${escapeHtml(item.action)}">
        <summary><span>${escapeHtml(item.action)}</span><time>${escapeHtml(new Date(item.at).toLocaleString("zh-CN", { hour12: false }))}</time></summary>
        <div class="lptff-sample-meta">${escapeHtml(item.mode)} · ${escapeHtml(item.model)} · ${escapeHtml(item.conversationKey)}</div>
        ${item.label ? `<div class="lptff-sample-label">会话：${escapeHtml(item.label)}</div>` : ""}
        <div class="lptff-sample-turn"><strong>招聘方</strong><span>${escapeHtml(item.recruiterMessage || "未记录")}</span></div>
        <div class="lptff-sample-turn"><strong>助手建议</strong><span>${escapeHtml(item.suggestedReply || item.humanAction || "未生成回复")}</span></div>
        ${item.context ? `<div class="lptff-sample-turn"><strong>近期上下文</strong><span>${escapeHtml(item.context)}</span></div>` : ""}
        ${item.reason ? `<div class="lptff-sample-turn"><strong>判断理由</strong><span>${escapeHtml(item.reason)}</span></div>` : ""}
        ${item.missingQuestions?.length ? `<div class="lptff-sample-turn"><strong>后续事项</strong><span>${escapeHtml(item.missingQuestions.join("；"))}</span></div>` : ""}
      </details>`).join("") : '<div class="lptff-empty">暂无沟通优化样本</div>';
    node.innerHTML = logs.length ? logs.map((item) => `
      <div class="lptff-log" data-tone="${escapeHtml(item.tone)}">
        <div class="lptff-log-meta"><time>${escapeHtml(new Date(item.at).toLocaleString("zh-CN", { hour12: false }))}</time><span>${escapeHtml(item.action)}</span></div>
        ${item.label ? `<div class="lptff-log-label">${escapeHtml(item.label)}</div>` : ""}
        <div class="lptff-log-outcome">${escapeHtml(item.outcome)}</div>
      </div>`).join("") : '<div class="lptff-empty">暂无沟通日志</div>';
  }

  function render() {
    if (document.getElementById(HOST_ID)) return;
    panel = document.createElement("section");
    panel.id = HOST_ID;
    panel.classList.add("lptff-floating", "lptff-collapsed");
    panel.setAttribute("aria-label", "AI 沟通小助手");
    panel.innerHTML = `
      <div class="lptff-shell">
        <div class="lptff-head" data-role="drag-handle" title="拖动可移动位置">
          <div>
            <div class="lptff-title">AI 沟通小助手 <span class="lptff-badge">可拖动</span></div>
            <div class="lptff-summary" data-role="head-status">基本条件自动沟通 · 有价值线索通知</div>
          </div>
          <button type="button" class="lptff-toggle" data-action="collapse" title="展开/收起（Alt+Shift+B）">展开</button>
        </div>
        <div class="lptff-body">
          <nav class="lptff-tabs" role="tablist" aria-label="AI 沟通小助手功能">
            <button type="button" role="tab" data-action="tab" data-tab="status" aria-selected="true">运行状态</button>
            <button type="button" role="tab" data-action="tab" data-tab="config" aria-selected="false">配置</button>
            <button type="button" role="tab" data-action="tab" data-tab="rules" aria-selected="false">沟通规则</button>
            <button type="button" role="tab" data-action="tab" data-tab="logs" aria-selected="false">日志</button>
          </nav>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="status">
            <div class="lptff-section-head"><div><h3>运行状态</h3><p class="lptff-help">一键启动会在当前标签页进入 BOSS 沟通页，并按已保存的安全预览或实际发送模式运行。</p></div><span class="lptff-run-dot" data-role="run-dot"></span></div>
            <div class="lptff-readiness" data-role="readiness">正在读取运行状态…</div>
            <div class="lptff-actions"><button type="button" class="lptff-primary" data-action="start">一键启动</button><button type="button" data-action="pause">立即暂停</button><button type="button" data-action="open-chat">打开沟通页</button></div>
            <div class="lptff-status" role="status" aria-live="polite" data-role="status">正在读取本地配置…</div>
            <pre class="lptff-plan" data-role="plan"></pre>
          </article>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="config" hidden>
            <h3>Gemini 与企业微信</h3>
            <p class="lptff-help">密钥只保存在浏览器本地存储，默认遮罩；可像登录密码一样点击显示或隐藏。沟通优化样本会自动遮盖常见联系方式和凭据，密钥不会进入日志。</p>
            <label>Gemini 模型</label>
            <select data-field="model"><option value="gemini-3.7-flash">Gemini 3.7 Flash</option><option value="gemini-3.6-flash">Gemini 3.6 Flash</option><option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option></select>
            <label>Gemini Key</label>
            <div class="lptff-row"><input type="text" autocomplete="off" class="lptff-secret-input" data-masked="true" data-field="geminiKey" placeholder="请输入 Gemini Key"><button type="button" class="lptff-reveal" data-action="show-gemini" aria-label="显示 Gemini Key">显示</button><span class="lptff-secret-state" data-role="gemini-state"></span></div>
            <div class="lptff-actions"><button type="button" data-action="test-gemini">保存并测试</button><button type="button" class="lptff-danger" data-action="clear-gemini">清除 Key</button></div>
            <label>企业微信机器人 Webhook</label>
            <div class="lptff-row"><input type="text" autocomplete="off" class="lptff-secret-input" data-masked="true" data-field="wecomWebhook" placeholder="请输入企业微信 Webhook"><button type="button" class="lptff-reveal" data-action="show-wecom" aria-label="显示企业微信 Webhook">显示</button><span class="lptff-secret-state" data-role="wecom-state"></span></div>
            <div class="lptff-actions"><button type="button" data-action="test-wecom">保存并发送测试通知</button><button type="button" class="lptff-danger" data-action="clear-wecom">清除 Webhook</button></div>
          </article>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="rules" hidden>
            <h3>无人值守沟通规则</h3>
            <p class="lptff-help">只补齐岗位事实，不承诺入职、不约面试、不发简历。安全预览不会向招聘方发送；实际发送需显式切换。</p>
            <label for="lptff-profile">沟通参考画像</label>
            <textarea id="lptff-profile" data-field="profile" placeholder="填写目标岗位、技能、城市、薪资、工作方式和明确排除项，仅用于 Gemini 判断与沟通，不会改变职位筛选。"></textarea>
            <label>必须确认的问题</label><textarea class="lptff-small-area" data-field="mustAsk"></textarea>
            <label>有价值线索标准</label><textarea class="lptff-small-area" data-field="valuableCriteria"></textarea>
            <div class="lptff-grid">
              <div><label>运行方式</label><select data-field="sendMode"><option value="preview">安全预览（不发送）</option><option value="live">实际自动发送</option></select></div>
              <div><label>回复前等待（5–900 秒）</label><input type="number" min="5" max="900" data-field="replyDelaySeconds"></div>
              <div><label>每日回复上限（1–1000）</label><input type="number" min="1" max="1000" data-field="dailyReplyLimit"></div>
              <div><label>单会话上限（1–100）</label><input type="number" min="1" max="100" data-field="perConversationLimit"></div>
            </div>
            <p class="lptff-help">输入框标题已展示允许范围；超过范围保存时会自动收敛到最大值。</p>
            <div class="lptff-live-warning" data-role="live-warning">实际发送会代表你向招聘方发消息。建议先在“安全预览”观察输出，再切换为实际发送。</div>
            <div class="lptff-actions"><button type="button" class="lptff-primary" data-action="save">保存沟通规则</button></div>
          </article>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="logs" hidden>
            <div class="lptff-section-head"><div><h3>沟通技巧优化样本</h3><p class="lptff-help">仅保存在当前浏览器，自动遮盖常见手机号、邮箱、证件号、账号和凭据；最多保留 200 条或 30 天。点击样本可查看详情。</p></div><button type="button" class="lptff-danger" data-action="clear-samples">清空样本</button></div>
            <div class="lptff-sample-list" data-role="communication-samples"><div class="lptff-empty">暂无沟通优化样本</div></div>
            <div class="lptff-section-head lptff-log-section"><div><h3>运行日志</h3><p class="lptff-help">记录时间、会话定位、动作和结果。</p></div><button type="button" class="lptff-danger" data-action="clear-logs">清空运行日志</button></div>
            <div class="lptff-log-list" data-role="logs"><div class="lptff-empty">暂无沟通日志</div></div>
          </article>
        </div>
      </div>`;
    const anchor = document.querySelector("boss-helper-job") || document.querySelector(".job-recommend-main,.page-jobs-main,.page-job-wrapper,.chat-container,#main");
    if (anchor?.parentNode) anchor.parentNode.insertBefore(panel, anchor);
    else document.body.prepend(panel);
    bindEvents();
  }

  function valuesFromForm() {
    const value = (name) => qs(`[data-field='${name}']`)?.value ?? "";
    return {
      profile: value("profile"), mustAsk: value("mustAsk"), valuableCriteria: value("valuableCriteria"), model: value("model"),
      geminiKey: value("geminiKey"), wecomWebhook: value("wecomWebhook"), sendMode: value("sendMode"),
      autoReply: Boolean(config.autoReply), dailyReplyLimit: Number(value("dailyReplyLimit")),
      perConversationLimit: Number(value("perConversationLimit")), replyDelaySeconds: Number(value("replyDelaySeconds")),
    };
  }

  function fillForm() {
    for (const field of ["profile", "mustAsk", "valuableCriteria", "model", "sendMode", "dailyReplyLimit", "perConversationLimit", "replyDelaySeconds"]) {
      const node = qs(`[data-field='${field}']`);
      if (node) node.value = config[field] ?? "";
    }
    for (const secret of ["gemini", "wecom"]) {
      const ready = secret === "gemini" ? config.hasGeminiKey : config.hasWecomWebhook;
      const node = qs(`[data-role='${secret}-state']`);
      node.textContent = ready ? "已保存" : "未配置";
      node.dataset.ready = String(ready);
    }
    qs("[data-role='live-warning']").dataset.show = String(config.sendMode === "live");
  }

  async function loadConfig() {
    const legacy = await storageGet(LEGACY_LOCAL_MODEL_KEY);
    if (Array.isArray(legacy[LEGACY_LOCAL_MODEL_KEY]) && legacy[LEGACY_LOCAL_MODEL_KEY].some((item) => item?.key === "lptff-gemini")) {
      await storageSet({ [LEGACY_LOCAL_MODEL_KEY]: legacy[LEGACY_LOCAL_MODEL_KEY].filter((item) => item?.key !== "lptff-gemini") });
    }
    const response = await call({ type: "BOSS_AUTOPILOT_GET_CONFIG" });
    config = { ...DEFAULTS, ...response.config };
    fillForm();
    await populateSavedSecrets();
    await removeLegacyProfileSearchState();
    refreshRuntimeStatus();
    await restoreUiState();
    await renderLogs();
    ensureChatObserver();
  }

  async function removeLegacyProfileSearchState() {
    const searchStateKey = "lptffBossLastSearchPlan";
    const stored = await storageGet([searchStateKey, "FormDataPrese", "web-geek-job-FormData"]);
    const preset = String(stored[searchStateKey]?.preset || stored.FormDataPrese || "default");
    const formKey = preset === "default" ? "web-geek-job-FormData" : `web-geek-job-FormData-${preset}`;
    const formStored = formKey === "web-geek-job-FormData" ? stored : await storageGet(formKey);
    const form = formStored[formKey];
    if (form && typeof form === "object") {
      const next = { ...form };
      let changed = false;
      for (const field of ["profileSearchIncludeKeywords", "profileSearchTargetTitles", "profileSearchExcludeTitleKeywords", "profileSearchFullTime"]) {
        if (field in next) { delete next[field]; changed = true; }
      }
      if (changed) await storageSet({ [formKey]: next });
    }
    await storageRemove("lptffBossLastSearchPlan");
  }

  async function saveConfig(overrides = {}) {
    const response = await call({ type: "BOSS_AUTOPILOT_SAVE_CONFIG", config: { ...valuesFromForm(), ...overrides } });
    config = { ...DEFAULTS, ...response.config };
    fillForm();
    await populateSavedSecrets();
    ensureChatObserver();
    return config;
  }

  function unreadCount() {
    const textNodes = [...document.querySelectorAll("button,a,span,div")].filter((node) => !node.closest(`#${HOST_ID}`) && node.children.length <= 2 && node.offsetParent);
    for (const node of textNodes) {
      const match = (node.textContent || "").trim().match(/^未读\s*[（(]?\s*(\d+)\s*[）)]?$/);
      if (match) return Number(match[1]);
    }
    return unreadConversationRows().length;
  }

  function refreshRuntimeStatus(message = "") {
    if (message) setStatus(message, "success");
    const unread = location.pathname.includes("/web/geek/chat") ? ` · 当前未读 ${unreadCount()} · 可处理 ${unreadConversationRows().length}` : "";
    const running = config.autoReply ? `自动分析已开启 · ${config.sendMode === "live" ? "实际发送" : "安全预览"}${unread}` : `自动分析未开启${unread}`;
    if (!message) setStatus(running, config.autoReply ? "success" : "");
    void renderDashboard();
  }

  async function renderDashboard() {
    const node = qs("[data-role='readiness']");
    if (!node) return;
    const state = await stateForToday();
    const onChatPage = location.origin === "https://www.zhipin.com" && location.pathname === "/web/geek/chat";
    const items = [
      ["页面", onChatPage ? "已在 BOSS 沟通页" : "启动时将切换到 BOSS 沟通页", onChatPage],
      ["Gemini", config.hasGeminiKey ? "已配置" : "未配置", config.hasGeminiKey],
      ["企业微信", config.hasWecomWebhook ? "已配置" : "未配置（不影响基本沟通）", config.hasWecomWebhook],
      ["运行方式", config.sendMode === "live" ? "实际自动发送" : "安全预览（不发送）", config.sendMode !== "live"],
      ["今日处理", `${Number(state.total || 0)} / ${config.dailyReplyLimit}`, true],
    ];
    node.innerHTML = items.map(([label, value, ready]) => `<div class="lptff-ready-item"><span>${escapeHtml(label)}</span><strong data-ready="${ready}">${escapeHtml(value)}</strong></div>`).join("");
    const dot = qs("[data-role='run-dot']");
    if (dot) dot.dataset.running = String(config.autoReply);
  }

  async function populateSavedSecrets() {
    for (const secret of ["gemini", "wecom"]) {
      resetSecretField(secret);
      const ready = secret === "gemini" ? config.hasGeminiKey : config.hasWecomWebhook;
      if (!ready) continue;
      const field = secret === "gemini" ? "geminiKey" : "wecomWebhook";
      const input = qs(`[data-field='${field}']`);
      const response = await call({ type: "BOSS_AUTOPILOT_REVEAL_SECRET", secret });
      if (input) { input.value = response.value || ""; input.dataset.masked = "true"; }
    }
  }

  function resetSecretField(secret) {
    const field = secret === "gemini" ? "geminiKey" : "wecomWebhook";
    const input = qs(`[data-field='${field}']`);
    const button = qs(`[data-action='show-${secret}']`);
    if (input) { input.dataset.masked = "true"; input.value = ""; }
    if (button) { button.textContent = "显示"; button.setAttribute("aria-label", `显示${secret === "gemini" ? " Gemini Key" : "企业微信 Webhook"}`); }
    clearTimeout(secretHideTimers.get(secret));
    secretHideTimers.delete(secret);
  }

  async function toggleSecret(secret, button) {
    const field = secret === "gemini" ? "geminiKey" : "wecomWebhook";
    const input = qs(`[data-field='${field}']`);
    if (!input) return;
    if (input.dataset.masked === "false") {
      input.dataset.masked = "true";
      button.textContent = "显示";
      button.setAttribute("aria-label", `显示${secret === "gemini" ? " Gemini Key" : "企业微信 Webhook"}`);
      clearTimeout(secretHideTimers.get(secret));
      secretHideTimers.delete(secret);
      return;
    }
    if (!input.value) {
      const response = await call({ type: "BOSS_AUTOPILOT_REVEAL_SECRET", secret });
      if (!response.value) throw new Error(`尚未保存${secret === "gemini" ? " Gemini Key" : "企业微信 Webhook"}`);
      input.value = response.value;
    }
    input.dataset.masked = "false";
    button.textContent = "隐藏";
    button.setAttribute("aria-label", `隐藏${secret === "gemini" ? " Gemini Key" : "企业微信 Webhook"}`);
    clearTimeout(secretHideTimers.get(secret));
    secretHideTimers.set(secret, setTimeout(() => {
      if (input.dataset.masked === "false") {
        input.dataset.masked = "true";
        button.textContent = "显示";
        button.setAttribute("aria-label", `显示${secret === "gemini" ? " Gemini Key" : "企业微信 Webhook"}`);
      }
      secretHideTimers.delete(secret);
    }, 30000));
  }

  async function withBusy(button, work) {
    button.disabled = true;
    try { await work(); } catch (error) { setStatus(error.message || "操作失败", "error"); } finally { button.disabled = false; }
  }

  function bindEvents() {
    const togglePanel = () => {
      const wasCollapsed = panel.classList.contains("lptff-collapsed");
      const before = panel.getBoundingClientRect();
      panel.dataset.pinRight = String(before.left > innerWidth * 0.55);
      panel.classList.toggle("lptff-collapsed");
      const toggle = qs("[data-action='collapse']");
      if (toggle) toggle.textContent = panel.classList.contains("lptff-collapsed") ? "展开" : "收起";
      requestAnimationFrame(() => {
        clampPanelPosition();
        setTimeout(() => { clampPanelPosition(); void persistUiState(); }, 60);
      });
    };
    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === "b") { event.preventDefault(); togglePanel(); }
    });
    const handle = qs("[data-role='drag-handle']");
    handle?.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button,input,select,textarea,a")) return;
      panel.dataset.pinRight = "false";
      const rect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      panel.classList.add("lptff-dragging");
      handle.setPointerCapture?.(event.pointerId);
      const move = (moveEvent) => {
        const left = Math.min(Math.max(8, startLeft + moveEvent.clientX - startX), Math.max(8, innerWidth - panel.offsetWidth - 8));
        const top = Math.min(Math.max(8, startTop + moveEvent.clientY - startY), Math.max(8, innerHeight - handle.offsetHeight - 8));
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = "auto";
      };
      const end = () => {
        panel.classList.remove("lptff-dragging");
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", end);
        void persistUiState();
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end, { once: true });
    });
    panel.addEventListener("change", (event) => {
      if (event.target?.matches("[data-field='sendMode']")) qs("[data-role='live-warning']").dataset.show = String(event.target.value === "live");
    });
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "collapse") { togglePanel(); return; }
      if (action === "tab") { switchTab(button.dataset.tab); void persistUiState(); return; }
      if (action === "open-chat") { location.assign(CHAT_URL); return; }
      if (action === "clear-logs") {
        if (!window.confirm("确定清空 AI 沟通小助手的运行日志吗？沟通优化样本不会受影响。")) return;
        void storageRemove(LOCAL_LOG_KEY).then(() => renderLogs());
        return;
      }
      if (action === "clear-samples") {
        if (!window.confirm("确定清空全部沟通优化样本吗？该操作不会影响运行配置。")) return;
        void storageRemove(LOCAL_SAMPLE_KEY).then(() => renderLogs());
        return;
      }
      if (action === "show-gemini" || action === "show-wecom") {
        const secret = action.endsWith("gemini") ? "gemini" : "wecom";
        void withBusy(button, () => toggleSecret(secret, button));
        return;
      }
      void withBusy(button, async () => {
        if (action === "start") {
          if (!config.hasGeminiKey) { switchTab("config"); throw new Error("请先在“配置”中保存 Gemini Key"); }
          await saveConfig({ autoReply: true });
          await appendLog("运行控制", config.sendMode === "live" ? "已启动实际自动发送" : "已启动安全预览", "success");
          refreshRuntimeStatus();
          if (location.origin !== "https://www.zhipin.com" || location.pathname !== "/web/geek/chat") location.assign(CHAT_URL);
          else void processLatestMessage();
        }
        if (action === "save") { await saveConfig(); refreshRuntimeStatus("配置已保存 · " + (config.autoReply ? `${config.sendMode === "live" ? "实际发送" : "安全预览"}已开启 · 当前未读 ${unreadCount()} · 可处理 ${unreadConversationRows().length}` : "自动分析未开启")); }
        if (action === "test-gemini") { await saveConfig(); await call({ type: "BOSS_AUTOPILOT_TEST_GEMINI" }); setStatus("Gemini 连接测试通过", "success"); }
        if (action === "test-wecom") { await saveConfig(); await call({ type: "BOSS_AUTOPILOT_TEST_WECOM" }); setStatus("企业微信测试通知已发送", "success"); }
        if (action === "clear-gemini" || action === "clear-wecom") {
          const secret = action.endsWith("gemini") ? "gemini" : "wecom";
          const response = await call({ type: "BOSS_AUTOPILOT_CLEAR_SECRET", secret }); config = { ...config, ...response.config }; fillForm();
          resetSecretField(secret);
          setStatus(`${secret === "gemini" ? "Gemini Key" : "企业微信 Webhook"} 已清除`, "success");
        }
        if (action === "pause") { await saveConfig({ autoReply: false }); await appendLog("运行控制", "自动沟通已暂停", "info"); setStatus("自动沟通已暂停", "success"); refreshRuntimeStatus("自动沟通已暂停"); }
      });
    });
  }

  function visibleMessageNodes() {
    const selectors = [".chat-record .im-list > li", ".chat-record .item-friend", ".chat-record .item-myself", ".message-item", "[class*='message-item']", "[class*='message-bubble']"];
    return [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))].filter((node) => {
      if (!node.offsetParent || node.closest(`#${HOST_ID},header,nav`)) return false;
      const text = (node.textContent || "").trim();
      const rect = node.getBoundingClientRect();
      return text.length > 0 && text.length <= 4000 && rect.width > 20 && rect.height > 10;
    });
  }

  function inboundMessage(node) {
    const chain = `${node.className || ""} ${node.parentElement?.className || ""}`.toLowerCase();
    if (/item-myself|item-system|item-center|item-question|self|right|mine|my-message|message-me/.test(chain)) return false;
    return /item-friend|left|other|friend|boss|receive|incoming/.test(chain) || !/right|self|mine/.test(chain);
  }

  function conversationId() {
    const active = document.querySelector(".user-list .friend-content.selected,.friend-item.active,.chat-item.active,[class*='friend'][class*='active'],[class*='chat'][class*='active']");
    const row = active?.closest("li") || active;
    const stableAttribute = ["data-id", "data-uid", "data-mid", "data-encrypt-id", "data-boss-id"].map((name) => row?.getAttribute(name) || active?.getAttribute(name)).find(Boolean);
    const avatar = row?.querySelector(".figure img,img")?.getAttribute("src") || "";
    const identity = row?.querySelector(".title-box,.name-box,.name-text")?.textContent || "";
    return String(stableAttribute || `${avatar}|${identity}` || location.pathname).trim().slice(0, 500);
  }

  function conversationLabel() {
    const active = document.querySelector(".user-list .friend-content.selected,.friend-item.active,.chat-item.active,[class*='friend'][class*='active'],[class*='chat'][class*='active']");
    const row = active?.closest("li") || active;
    const title = row?.querySelector(".name-text,.name-box,.title-box")?.textContent || "";
    const subtitle = row?.querySelector(".last-msg,.gray,.source-job,.job-name")?.textContent || "";
    return `${title} ${subtitle}`.replace(/\s+/g, " ").trim().slice(0, 300) || "当前 BOSS 会话";
  }

  async function stateForToday() {
    const date = new Date().toISOString().slice(0, 10);
    const stored = await storageGet(LOCAL_STATE_KEY);
    const state = stored[LOCAL_STATE_KEY]?.date === date ? stored[LOCAL_STATE_KEY] : { date, total: 0, conversations: {}, seen: [], notified: [], pendingNotifications: [] };
    state.seen = Array.isArray(state.seen) ? state.seen.slice(-300) : [];
    state.notified = Array.isArray(state.notified) ? state.notified.slice(-300) : [];
    state.pendingNotifications = Array.isArray(state.pendingNotifications) ? state.pendingNotifications.slice(-30) : [];
    state.conversations ||= {};
    return state;
  }

  function notificationEligible(analysis) {
    return analysis?.valuable === true
      && analysis?.requirementsComplete === true
      && analysis?.allCriteriaMet === true
      && analysis?.stop !== true
      && Array.isArray(analysis?.missingQuestions)
      && analysis.missingQuestions.length === 0;
  }

  function notificationFromAnalysis(analysis, label) {
    return {
      job: analysis.job || {},
      conversationLabel: label,
      reason: String(analysis.reason || analysis.summary || "全部已配置条件均满足").slice(0, 1000),
      matchedCriteria: Array.isArray(analysis.matchedCriteria) ? analysis.matchedCriteria.slice(0, 20) : [],
    };
  }

  async function flushPendingNotifications(state) {
    state ||= await stateForToday();
    if (!config.hasWecomWebhook || !state.pendingNotifications.length) return false;
    const now = Date.now();
    const pending = state.pendingNotifications.find((item) => Number(item?.nextAttemptAt || 0) <= now && Number(item?.attempts || 0) < 3);
    if (!pending) return false;
    try {
      await call({ type: "BOSS_AUTOPILOT_NOTIFY_WECOM", notification: pending.notification });
      state.pendingNotifications = state.pendingNotifications.filter((item) => item.id !== pending.id);
      if (!state.notified.includes(pending.id)) state.notified.push(pending.id);
      await storageSet({ [LOCAL_STATE_KEY]: state });
      await appendLog("企业微信通知", "岗位线索通知已发送", "success", pending.notification?.conversationLabel || "");
      return true;
    } catch (error) {
      pending.attempts = Number(pending.attempts || 0) + 1;
      pending.nextAttemptAt = Date.now() + Math.min(60000, 5000 * (2 ** pending.attempts));
      pending.error = String(error?.message || "企业微信通知失败").slice(0, 200);
      await storageSet({ [LOCAL_STATE_KEY]: state });
      await appendLog("企业微信通知", `发送失败（${pending.attempts}/3）：${pending.error}`, "error", pending.notification?.conversationLabel || "");
      setStatus(`岗位已处理，但企业微信通知失败（${pending.attempts}/3）：${pending.error}`, "error");
      return false;
    }
  }

  async function processLatestMessage() {
    if (contextInvalidated || processing || queueOpening || !config.autoReply) return;
    const messages = visibleMessageNodes().filter((item) => /item-friend|item-myself/.test(`${item.className || ""} ${item.parentElement?.className || ""}`.toLowerCase()));
    const node = messages.at(-1);
    if (!node || !inboundMessage(node)) {
      if (config.sendMode === "live") await openNextUnreadConversation();
      else refreshRuntimeStatus();
      return;
    }
    const latestMessage = (node.textContent || "").trim().slice(0, 1500);
    const cid = conversationId();
    const fingerprint = `${cid}|${latestMessage}`;
    const state = await stateForToday();
    if (state.seen.includes(fingerprint)) {
      refreshRuntimeStatus();
      if (config.sendMode === "live") window.setTimeout(() => void openNextUnreadConversation(), 500);
      return;
    }
    if (state.total >= config.dailyReplyLimit || Number(state.conversations[cid] || 0) >= config.perConversationLimit) { setStatus("自动沟通已达到配置上限，已安全暂停", "error"); return; }
    processing = true;
    setStatus("检测到招聘方新消息，Gemini 正在分析…");
    const label = conversationLabel();
    let conversation = "";
    try {
      conversation = visibleMessageNodes().slice(-12).map((item) => {
        const text = (item.textContent || "").trim();
        return text ? `${inboundMessage(item) ? "招聘方" : "求职者"}：${text}` : "";
      }).filter(Boolean).join("\n");
      const response = await call({ type: "BOSS_AUTOPILOT_ANALYZE_CONVERSATION", input: { latestMessage, conversation, conversationLabel: label } });
      const analysis = response.analysis;
      const reply = String(analysis.reply || "").trim();
      const needsHuman = analysis.needsHuman === true;
      let outcome = needsHuman
        ? `需要本人处理：${String(analysis.humanAction || analysis.reason || "请查看当前会话").replace(/\s+/g, " ").trim().slice(0, 120)}`
        : (analysis.stop ? "已停止本会话" : "无需回复");
      if (!analysis.stop && !needsHuman && reply) {
        if (config.sendMode === "live") {
          setStatus(`Gemini 分析完成，${config.replyDelaySeconds} 秒后发送…`);
          await new Promise((resolve) => setTimeout(resolve, config.replyDelaySeconds * 1000));
          if (!config.autoReply || config.sendMode !== "live") throw new Error("发送前已被暂停");
          if (conversationId() !== cid) throw new Error("等待期间会话已切换，本条未发送");
          await sendChatReply(reply);
          state.total += 1; state.conversations[cid] = Number(state.conversations[cid] || 0) + 1;
          outcome = "已发送并确认输入框清空";
        } else {
          showPreview(reply, analysis);
          outcome = "已生成安全预览";
        }
      }
      state.seen.push(fingerprint);
      const eligible = notificationEligible(analysis);
      const notificationId = `${cid}|${String(analysis?.job?.title || label).trim()}`.slice(0, 700);
      if (eligible && config.hasWecomWebhook && config.sendMode === "live" && !state.notified.includes(notificationId) && !state.pendingNotifications.some((item) => item.id === notificationId)) {
        state.pendingNotifications.push({ id: notificationId, notification: notificationFromAnalysis(analysis, label), attempts: 0, nextAttemptAt: 0 });
      }
      await storageSet({ [LOCAL_STATE_KEY]: state });
      const notified = eligible ? await flushPendingNotifications(state) : false;
      const valueStatus = eligible ? (notified ? " · 全部条件满足，已推送企业微信" : " · 全部条件满足，通知待重试") : (analysis.valuable ? " · 尚未满足全部通知条件" : "");
      const outcomeTone = needsHuman || (eligible && !notified) ? "error" : "success";
      await appendCommunicationSample({
        conversationId: cid,
        label,
        recruiterMessage: latestMessage,
        context: conversation,
        suggestedReply: reply,
        action: outcome,
        reason: analysis.reason || analysis.summary,
        humanAction: analysis.humanAction,
        valuable: analysis.valuable,
        requirementsComplete: analysis.requirementsComplete,
        allCriteriaMet: analysis.allCriteriaMet,
        missingQuestions: analysis.missingQuestions,
      });
      setStatus(`${outcome}${valueStatus}`, outcomeTone);
      await appendLog("会话处理", `${outcome}${valueStatus}`, outcomeTone, label);
    } catch (error) {
      if (contextInvalidated || stopInvalidatedContext(error)) return;
      if (config.sendMode === "live" && config.autoReply) {
        try {
          await saveConfig({ autoReply: false });
        } catch (saveError) {
          if (contextInvalidated || stopInvalidatedContext(saveError)) return;
        }
      }
      await appendCommunicationSample({ conversationId: cid, label, recruiterMessage: latestMessage, context: conversation, action: "模型分析失败", reason: error.message });
      setStatus(`自动沟通暂停：${error.message}`, "error");
      await appendLog("会话处理", `自动沟通暂停：${error.message}`, "error", label);
    } finally {
      processing = false;
      if (!contextInvalidated && config.autoReply && config.sendMode === "live") window.setTimeout(() => void openNextUnreadConversation(), 1400);
    }
  }

  function showPreview(reply, analysis) {
    const plan = qs("[data-role='plan']");
    plan.dataset.show = "true";
    const notificationStatus = notificationEligible(analysis) ? "全部通知条件已满足（预览模式不推送）" : "尚未满足全部通知条件";
    plan.textContent = `安全预览（未发送）\n${reply}\n\n判断：${analysis.valuable ? "值得关注" : "继续了解"}\n通知：${notificationStatus}\n${analysis.reason || ""}`;
  }

  async function sendChatReply(reply) {
    const editor = document.querySelector(".chat-editor .chat-input[contenteditable='true'],.chat-editor [contenteditable='true'],textarea[placeholder*='消息'],textarea[placeholder*='回复'],[contenteditable='true'][data-placeholder],.chat-input textarea");
    if (!editor) throw new Error("未找到 BOSS 消息输入框，已停止发送");
    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) setNativeInput(editor, reply);
    else {
      editor.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertText", false, reply);
      selection.removeAllRanges();
    }
    const scope = editor.closest(".chat-editor,.chat-operate,form") || editor.parentElement || document;
    const button = [...scope.querySelectorAll(".btn-send,button")].find((item) => item.offsetParent && (/发送/.test(item.textContent || "") || item.matches(".btn-send")));
    if (!button || button.disabled) throw new Error("未找到可用的发送按钮，内容已保留在输入框");
    button.scrollIntoView({ block: "nearest" });
    button.focus();
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      button.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, buttons: type.endsWith("down") ? 1 : 0 }));
    }
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const editorValue = () => editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement ? editor.value : editor.textContent;
    if (String(editorValue() || "").trim() === reply) {
      for (const type of ["keydown", "keypress", "keyup"]) {
        editor.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      }
      await new Promise((resolve) => setTimeout(resolve, 1800));
    }
    if (String(editorValue() || "").trim() === reply) throw new Error("BOSS 页面未确认发送成功，内容仍保留在输入框");
  }

  function unreadConversationRows() {
    const badges = [...document.querySelectorAll(".user-list .notice-badge,[class*='unread'],[class*='badge'],.badge,.unread")];
    const rows = [];
    for (const badge of badges) {
      if (!badge.offsetParent || badge.closest(`#${HOST_ID},header,nav`)) continue;
      if (!/^\d+$/.test((badge.textContent || "").trim()) || Number(badge.textContent) < 1) continue;
      const row = badge.closest(".user-list li,li,[class*='friend-item'],[class*='chat-item'],[class*='conversation-item'],[class*='user-item'],[class*='item']");
      if (!row || rows.includes(row)) continue;
      const rect = row.getBoundingClientRect();
      if (rect.width < 180 || rect.height < 42 || rect.height > 180 || rect.left > innerWidth * .6) continue;
      rows.push(row);
    }
    return rows;
  }

  function queueRowKey(row) {
    return String(row.querySelector(".name-text,.name-box")?.textContent || row.textContent || "").trim().slice(0, 160);
  }

  function activateConversationRow(row) {
    const target = row.querySelector(".friend-content,[role='button'],a,button") || row;
    target.scrollIntoView({ block: "nearest" });
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, buttons: type.endsWith("down") ? 1 : 0 }));
    }
    if (typeof target.click === "function") target.click();
    return target;
  }

  async function waitForConversationOpen(target, timeoutMs = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const selected = target.classList.contains("selected") || target.closest("li")?.querySelector(".friend-content.selected");
      const ready = document.querySelector(".chat-record .chat-message,.chat-record .im-list,.chat-editor .chat-input");
      if (selected && ready) return true;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return false;
  }

  async function openNextUnreadConversation() {
    if (contextInvalidated || queueOpening || processing || !config.autoReply || config.sendMode !== "live") return;
    const rows = unreadConversationRows();
    const row = rows.find((item) => Number(queueOpenFailures.get(queueRowKey(item)) || 0) < 2);
    if (!row) { refreshRuntimeStatus(); return; }
    queueOpening = true;
    const key = queueRowKey(row);
    setStatus(`发现 ${unreadCount()} 个未读会话，正在打开下一条…`);
    const target = activateConversationRow(row);
    const opened = await waitForConversationOpen(target);
    queueOpening = false;
    if (!opened) {
      const failures = Number(queueOpenFailures.get(key) || 0) + 1;
      queueOpenFailures.set(key, failures);
      setStatus(`未读会话打开超时（${failures}/2），${failures < 2 ? "正在重试" : "已跳过该条"}`, "error");
      window.setTimeout(() => void openNextUnreadConversation(), 900);
      return;
    }
    queueOpenFailures.delete(key);
    setStatus("会话已打开，正在等待消息内容…");
    await new Promise((resolve) => setTimeout(resolve, 700));
    await processLatestMessage();
  }

  function ensureChatObserver() {
    if (contextInvalidated) return;
    if (chatObserver) chatObserver.disconnect();
    chatObserver = new MutationObserver(() => {
      window.clearTimeout(ensureChatObserver.timer);
      ensureChatObserver.timer = window.setTimeout(() => {
        if (config.autoReply) void processLatestMessage();
        else if (qs("[data-role='status']")?.dataset.tone !== "error") refreshRuntimeStatus();
      }, 900);
    });
    chatObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    if (config.autoReply) void processLatestMessage();
  }

  function ensureArrivalPolling() {
    if (arrivalPollTimer || contextInvalidated) return;
    arrivalPollTimer = window.setInterval(() => {
      if (contextInvalidated || !config.autoReply || processing || queueOpening) return;
      void flushPendingNotifications();
      if (config.sendMode === "live" && unreadConversationRows().length) void openNextUnreadConversation();
      else void processLatestMessage();
    }, 5000);
  }

  function mountWhenReady() {
    if (contextInvalidated) return;
    render();
    if (!panel?.isConnected) window.setTimeout(mountWhenReady, 800);
    else {
      ensureArrivalPolling();
      loadConfig().catch((error) => setStatus(error.message, "error"));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountWhenReady, { once: true });
  else mountWhenReady();
})();
