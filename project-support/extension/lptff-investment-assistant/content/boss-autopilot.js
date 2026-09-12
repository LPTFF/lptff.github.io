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
    profile: "6年前端开发经验，硕士学历，最熟悉 React 和 Vue。下一份工作优先以前端为主，不限行业和公司规模，不以职位名称作为硬门槛。求职优先级依次是收入、业务前景、稳定性；税前年收入至少 25 万，理想 30 万以上，可接受月薪 18K 且 13–14 薪有可靠兑现依据。",
    mustAsk: "实际工作是否以前端为主、月薪与固定薪数、业务持续性、公司经营与团队裁员情况、是否长期正式岗位、是否与招聘公司直签、社保公积金、双休与加班情况、是否有值班或夜间响应；信息缺失时先继续沟通，不直接否定机会",
    valuableCriteria: "税前年收入至少 25 万，理想 30 万以上，不用不确定奖金凑年包；业务有真实持续需求；公司经营正常、团队不频繁裁员、长期正式岗位、正常社保公积金、与招聘公司直签；排除外包、派遣、驻场和创业早期公司。必须双休，不接受加班、大小周、值班或夜间响应。",
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
  let progressTickTimer;
  let transientRetryTimer;
  let transientFailureCount = 0;
  let processing = false;
  let queueOpening = false;
  let lastQueueDiagnosticAt = 0;
  const queueOpenFailures = new Map();
  const secretHideTimers = new Map();
  const completedQueueItems = new Set();
  const queueProgress = {
    startedAt: 0,
    total: 0,
    completed: 0,
    phase: "等待启动",
    detail: "启动后会实时显示每一步",
    updatedAt: Date.now(),
    nextActionAt: 0,
    stoppedAt: 0,
  };
  let activeTab = "status";
  let contextInvalidated = false;
  let playbook = { handoffs: {}, scripts: [], candidates: [], revision: 0 };
  let baseScripts = [];
  let runRevision = 0;
  let lastLearned = "";
  const heldQueueRows = new Set();
  const EDITOR_SELECTOR = ".chat-editor .chat-input[contenteditable='true'],.chat-editor [contenteditable='true'],textarea[placeholder*='消息'],textarea[placeholder*='回复'],[contenteditable='true'][data-placeholder],.chat-input textarea";

  function currentKey() { return conversationKey(conversationId()); }
  function editorText() {
    const editor = document.querySelector(EDITOR_SELECTOR);
    return String(editor?.value ?? editor?.textContent ?? "").trim();
  }
  function outgoingFingerprint() {
    const node = visibleMessageNodes().filter(x => /item-myself/.test(`${x.className} ${x.parentElement?.className}`)).at(-1);
    return node ? conversationKey(node.textContent || "") : "";
  }
  function latestIncomingText() {
    return (visibleMessageNodes().filter(inboundMessage).at(-1)?.textContent || "").trim();
  }
  async function loadPlaybook() {
    const response = await call({ type: "BOSS_AUTOPILOT_GET_PLAYBOOK" });
    playbook = response.book; baseScripts = response.baseScripts;
    renderPlaybook();
  }
  async function holdConversation(reason, trigger = latestIncomingText()) {
    const key = currentKey();
    if (playbook.handoffs[key]) return;
    runRevision++;
    // Block synchronously before persisting or showing notifications.
    playbook.handoffs[key] = { reason, at: Date.now() };
    const row = document.querySelector(".user-list .friend-content.selected")?.closest("li");
    if (row) heldQueueRows.add(queueRowKey(row));
    const response = await call({ type: "BOSS_AUTOPILOT_HANDOFF", key, reason, trigger, baseline: outgoingFingerprint(), rowKey: row ? queueRowKey(row) : "" });
    playbook = response.book;
    renderPlaybook();
    setStatus("当前会话需要人工接管，所有自动动作已停止", "error");
    setQueuePhase("等待人工接管", "请查看接管原因；处理后需明确恢复托管");
  }
  async function observeHumanReply() {
    const key = currentKey();
    const handoff = playbook.handoffs[key];
    if (!handoff) return;
    const fingerprint = outgoingFingerprint();
    if (!fingerprint || fingerprint === handoff.baseline || lastLearned === `${key}|${fingerprint}`) return;
    const node = visibleMessageNodes().filter(x => /item-myself/.test(`${x.className} ${x.parentElement?.className}`)).at(-1);
    if (!node) return;
    // Only learn a new outgoing turn following a captured manual editing session.
    const intent = (await storageGet("lptffBossManualIntent")).lptffBossManualIntent || {};
    if (intent.key !== key || Date.now() - intent.at > 30 * 60000) return;
    lastLearned = `${key}|${fingerprint}`;
    try {
      const response = await call({ type: "BOSS_AUTOPILOT_LEARN", key, fingerprint, response: node.textContent || "", trigger: latestIncomingText() });
      playbook = response.book; renderPlaybook();
    } catch (error) { lastLearned = ""; setStatus(error.message, "error"); }
  }
  function renderPlaybook() {
    const node = qs("[data-role='handoff']");
    if (!node) return;
    const handoff = playbook.handoffs[currentKey()];
    const count = Object.keys(playbook.handoffs).length;
    const links = Object.entries(playbook.handoffs).map(([key, item], index) => `<button type="button" data-action="open-handoff" data-key="${escapeHtml(key)}">待接管会话 ${index + 1}</button>`).join("");
    const html = `<strong>待人工接管 ${count} 个会话</strong>${handoff ? `<p>${escapeHtml(handoff.reason || "已由人工接管")}</p><button type="button" data-action="resume-conversation">我已处理，恢复当前会话托管</button>` : '<p>当前会话按已确认剧本处理；开始输入时自动让出控制。</p>'}`;
    const handoffHtml = html + `<div class="lptff-actions">${links}</div>`;
    if (node.innerHTML !== handoffHtml) node.innerHTML = handoffHtml;
    node.dataset.held = String(Boolean(handoff));
    const scripts = qs("[data-role='scripts']");
    const scriptHtml = [...baseScripts, ...playbook.scripts].map(x => `<details class="lptff-sample"><summary>${escapeHtml(x.title)} · ${x.scope === "all" || !x.scope ? "通用" : "仅原会话"}</summary><p>${escapeHtml(x.when)}</p><p>${escapeHtml(x.response)}</p>${x.scope ? `<button type="button" data-action="disable-script" data-id="${escapeHtml(x.id)}">停用此剧本</button>` : ""}</details>`).join("");
    if (scripts && scripts.innerHTML !== scriptHtml) scripts.innerHTML = scriptHtml;
    const candidates = qs("[data-role='learning']");
    // Preserve unfinished edits when unrelated handoff state changes.
    const signature = JSON.stringify(playbook.candidates.map(x => x.id));
    if (candidates && candidates.dataset.signature !== signature) {
      candidates.dataset.signature = signature;
      candidates.innerHTML = playbook.candidates.length ? playbook.candidates.map(x => `<details class="lptff-sample" data-candidate="${escapeHtml(x.id)}"><summary>待确认人工经验 · ${escapeHtml(new Date(x.at).toLocaleDateString())}</summary><label>适用条件（请保留例外和前提）</label><textarea data-learning="when">${escapeHtml(x.when)}</textarea><label>回复规则 / 已确认事实</label><textarea data-learning="response">${escapeHtml(x.response)}</textarea><label><input type="checkbox" data-learning="global">适用于其他会话（默认仅原会话）</label><div class="lptff-actions"><button type="button" data-action="approve-script" data-id="${escapeHtml(x.id)}">确认纳入剧本</button><button type="button" data-action="reject-script" data-id="${escapeHtml(x.id)}">忽略此经验</button></div></details>`).join("") : '<p class="lptff-help">暂无待确认经验。人工接管后实际发出的新回复会成为候选；未确认不会用于自动回复。候选保留最多 100 条或 30 天。</p>';
    }
  }
  function bindManualControl() {
    document.addEventListener("input", event => {
      if (!event.isTrusted || !event.target?.matches?.(EDITOR_SELECTOR)) return;
      const key = currentKey();
      runRevision++;
      void storageSet({ lptffBossManualIntent: { key, at: Date.now() } });
      void holdConversation("你已开始编辑消息，助手已让出控制。实际发送后会记录待确认经验。").catch(error => setStatus(error.message, "error"));
    }, true);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || contextInvalidated) return;
      if (changes.lptffBossPlaybook) { runRevision++; playbook = changes.lptffBossPlaybook.newValue || { handoffs: {}, scripts: [], candidates: [], revision: 0 }; renderPlaybook(); }
      if (changes.lptffBossAutopilot) {
        runRevision++;
        const next = changes.lptffBossAutopilot.newValue || {};
        config.autoReply = next.autoReply === true;
        config.sendMode = next.sendMode === "live" ? "live" : "preview";
      }
    });
  }

  function isContextInvalidatedError(error) {
    return /Extension context invalidated|Receiving end does not exist|Could not establish connection/i.test(String(error?.message || error || ""));
  }

  function stopInvalidatedContext(error) {
    if (!isContextInvalidatedError(error)) return false;
    contextInvalidated = true;
    if (arrivalPollTimer) window.clearInterval(arrivalPollTimer);
    arrivalPollTimer = null;
    if (progressTickTimer) window.clearInterval(progressTickTimer);
    progressTickTimer = null;
    if (transientRetryTimer) window.clearTimeout(transientRetryTimer);
    transientRetryTimer = null;
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

  function isTemporaryGeminiError(error) {
    return /Gemini.*(?:连接超时|网络连接中断|临时服务异常|临时不可用|繁忙|已自动重试|已自动尝试)/i.test(String(error?.message || error || ""));
  }

  function clearTemporaryRetry() {
    if (transientRetryTimer) window.clearTimeout(transientRetryTimer);
    transientRetryTimer = null;
    transientFailureCount = 0;
  }

  function scheduleTemporaryRetry(error) {
    if (transientRetryTimer || contextInvalidated || !config.autoReply) return 0;
    transientFailureCount += 1;
    const delaySeconds = Math.min(300, 15 * (2 ** Math.min(5, transientFailureCount - 1)));
    transientRetryTimer = window.setTimeout(() => {
      transientRetryTimer = null;
      if (!contextInvalidated && config.autoReply) void processLatestMessage();
    }, delaySeconds * 1000);
    setQueuePhase("等待 Gemini 重试", "当前消息会保留，不会跳过", Date.now() + delaySeconds * 1000);
    setStatus(`Gemini 临时连接异常，${delaySeconds} 秒后自动重试；当前消息不会跳过`, "error");
    void appendLog("模型连接重试", `${String(error?.message || error || "Gemini 临时不可用")}；${delaySeconds} 秒后自动重试`, "error", conversationLabel());
    return delaySeconds;
  }

  function setStatus(message, tone = "") {
    const node = qs("[data-role='status']");
    if (!node) return;
    if (node.textContent !== message) node.textContent = message;
    node.dataset.tone = tone;
    const headStatus = qs("[data-role='head-status']");
    if (headStatus && headStatus.textContent !== message) headStatus.textContent = message;
  }

  function formatElapsed(milliseconds) {
    const seconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function startQueueProgress() {
    queueProgress.singlePreview = false;
    completedQueueItems.clear();
    queueProgress.startedAt = Date.now();
    queueProgress.total = unreadCount();
    queueProgress.completed = 0;
    queueProgress.phase = "准备处理";
    queueProgress.detail = queueProgress.total ? `已发现 ${queueProgress.total} 条未读` : "正在检查未读消息";
    queueProgress.updatedAt = Date.now();
    queueProgress.nextActionAt = 0;
    queueProgress.stoppedAt = 0;
    renderQueueProgress();
  }

  function setQueuePhase(phase, detail = "", nextActionAt = 0) {
    queueProgress.phase = phase;
    queueProgress.detail = detail;
    queueProgress.updatedAt = Date.now();
    queueProgress.nextActionAt = Number(nextActionAt || 0);
    queueProgress.stoppedAt = phase === "已暂停" ? Date.now() : 0;
    renderQueueProgress();
  }

  function markQueueItemCompleted(fingerprint) {
    if (!fingerprint || completedQueueItems.has(fingerprint)) return;
    completedQueueItems.add(fingerprint);
    queueProgress.completed += 1;
    queueProgress.total = Math.max(queueProgress.total, queueProgress.completed);
    queueProgress.updatedAt = Date.now();
  }

  function renderQueueProgress() {
    if (panel) { const body = qs(".lptff-body"); if (body) body.style.maxHeight = `${Math.max(120, innerHeight - panel.getBoundingClientRect().top - qs(".lptff-head").offsetHeight - 16)}px`; }
    const node = qs("[data-role='queue-progress']");
    if (!node) return;
    const onChatPage = location.pathname.includes("/web/geek/chat");
    const unread = onChatPage ? unreadCount() : 0;
    const processable = onChatPage ? unreadConversationRows().length : 0;
    const total = queueProgress.singlePreview ? 1 : Math.max(queueProgress.total, queueProgress.completed + unread, unread);
    const percentage = total ? Math.min(100, Math.round(queueProgress.completed / total * 100)) : (config.autoReply ? 100 : 0);
    const elapsed = queueProgress.startedAt ? formatElapsed((queueProgress.stoppedAt || Date.now()) - queueProgress.startedAt) : "00:00";
    const countdown = queueProgress.nextActionAt > Date.now()
      ? `${Math.max(1, Math.ceil((queueProgress.nextActionAt - Date.now()) / 1000))} 秒后`
      : (queueProgress.singlePreview ? (processing ? "等待分析结果" : "已结束") : (config.autoReply ? "马上" : "已暂停"));
    const lastActivity = new Date(queueProgress.updatedAt).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    node.dataset.running = String(config.autoReply);
    node.innerHTML = `
      <div class="lptff-progress-head"><strong>${escapeHtml(queueProgress.phase)}</strong><span>本轮 ${queueProgress.completed} / ${total}</span></div>
      <div class="lptff-progress-track" role="progressbar" aria-label="本轮处理进度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${queueProgress.completed}"><i style="width:${percentage}%"></i></div>
      <div class="lptff-progress-detail">${escapeHtml(queueProgress.detail || "等待下一步")}</div>
      <div class="lptff-progress-metrics">
        <span>剩余未读<strong>${unread}</strong></span><span>当前可处理<strong>${processable}</strong></span><span>已运行<strong>${elapsed}</strong></span><span>下一动作<strong>${countdown}</strong></span>
      </div>
      <div class="lptff-progress-updated">最近活动 ${lastActivity}</div>`;
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
      mode: sample.mode === "preview" ? "安全预览" : (config.sendMode === "live" ? "实际发送" : "安全预览"),
      recruiterMessage: redactCommunicationText(sample.recruiterMessage, 1500),
      context: redactCommunicationText(sample.context, 5000),
      suggestedReply: redactCommunicationText(sample.suggestedReply, 1200),
      action: String(sample.action || "未处理").slice(0, 80),
      reason: redactCommunicationText(sample.reason, 1200),
      humanAction: redactCommunicationText(sample.humanAction, 500),
      valuable: sample.valuable === true,
      interviewInvite: sample.interviewInvite === true,
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
            <div class="lptff-queue-progress" data-role="queue-progress" aria-live="polite"></div>
            <div class="lptff-actions"><button type="button" class="lptff-primary" data-action="start">一键启动</button><button type="button" data-action="pause">立即暂停</button><button type="button" data-action="open-chat">打开沟通页</button></div>
            <div class="lptff-status" role="status" aria-live="polite" data-role="status">正在读取本地配置…</div>
            <div class="lptff-handoff" data-role="handoff" role="status" aria-live="polite"></div><div class="lptff-actions"><button type="button" data-action="preview-current">预览当前会话（不发送）</button><button type="button" data-action="take-over">接管当前会话</button></div>
            <pre class="lptff-plan" data-role="plan"></pre>
          </article>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="config" hidden>
            <h3>Gemini 与企业微信</h3>
            <p class="lptff-help">密钥只保存在浏览器本地存储，默认遮罩；可像登录密码一样点击显示或隐藏。沟通优化样本会自动遮盖常见联系方式和凭据，密钥不会进入日志。</p>
            <label>Gemini 模型</label>
            <select data-field="model"><option value="gemini-3.7-flash">Gemini 3.7 Flash</option><option value="gemini-3.6-flash">Gemini 3.6 Flash</option><option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option></select>
            <label>Gemini Key</label>
            <div class="lptff-row"><input type="text" autocomplete="off" class="lptff-secret-input" data-masked="true" data-field="geminiKey" placeholder="请输入 Gemini Key"><button type="button" class="lptff-reveal" data-action="show-gemini" aria-label="显示 Gemini Key">显示</button><span class="lptff-secret-state" data-role="gemini-state"></span></div>
            <div class="lptff-actions"><button type="button" data-action="test-gemini">保存并测试</button><button type="button" class="lptff-danger" data-action="clear-gemini">清除 Key</button><span class="lptff-secret-state" data-role="gemini-test-state"></span></div>
            <label>企业微信机器人 Webhook</label>
            <div class="lptff-row"><input type="text" autocomplete="off" class="lptff-secret-input" data-masked="true" data-field="wecomWebhook" placeholder="请输入企业微信 Webhook"><button type="button" class="lptff-reveal" data-action="show-wecom" aria-label="显示企业微信 Webhook">显示</button><span class="lptff-secret-state" data-role="wecom-state"></span></div>
            <div class="lptff-actions"><button type="button" data-action="test-wecom">保存并发送测试通知</button><button type="button" class="lptff-danger" data-action="clear-wecom">清除 Webhook</button></div>
          </article>
          <article class="lptff-card lptff-tab-panel" data-tab-panel="rules" hidden>
            <h3>剧本与沟通边界</h3>
            <p class="lptff-help">AI 按剧本问答；招聘方明确请求时，可代发 BOSS 已保存的简历、通过原生入口交换联系方式。缺少事实、条件冲突、额外越界要求或确认具体面试安排时，停止该会话并通知你。安全预览只显示待执行动作。</p>
            <details><summary>查看当前正式剧本</summary><div data-role="scripts"></div></details><details><summary>人工经验 · 待确认后才生效</summary><div data-role="learning"></div></details>
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
    await loadPlaybook();
    if (config.autoReply && !queueProgress.startedAt) startQueueProgress();
    else if (!config.autoReply && !queueProgress.startedAt) setQueuePhase("已暂停", "点击“一键启动”后开始显示本轮进度");
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
    renderQueueProgress();
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
      if (action === "pause") { config.autoReply = false; runRevision++; }
      if (action === "collapse") { togglePanel(); return; }
      if (action === "tab") { switchTab(button.dataset.tab); void persistUiState(); return; }
      if (action === "open-chat") { location.assign(CHAT_URL); return; }
      if (action === "clear-logs") {
        if (!window.confirm("确定清空 AI 沟通小助手的运行日志并重置今日处理缓存吗？沟通优化样本不会受影响。")) return;
        void (async () => {
          const state = await stateForToday();
          state.seen = [];
          await storageSet({ [LOCAL_STATE_KEY]: state });
          await storageRemove(LOCAL_LOG_KEY);
          renderLogs();
          setStatus("运行日志与今日已处理记录已重置", "success");
        })();
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
        if (action === "open-handoff") {
          const handoff = playbook.handoffs[button.dataset.key];
          const row = [...document.querySelectorAll(".user-list li")].find(item => queueRowKey(item) === handoff?.rowKey);
          if (!row) throw new Error("该会话不在当前列表，请切换到全部会话或滚动加载后再打开。");
          activateConversationRow(row); return;
        }
        if (action === "preview-current") { await processLatestMessage({ manualPreview: true }); return; }
        if (action === "take-over") { await holdConversation("你已主动接管当前会话。"); return; }
        if (action === "resume-conversation") {
          if (processing || editorText()) throw new Error("请等待当前分析结束，并先完成或清空输入框内容，再恢复托管。");
          const response = await call({ type: "BOSS_AUTOPILOT_RESUME", key: currentKey() });
          playbook = response.book; runRevision++; lastLearned = ""; heldQueueRows.clear(); renderPlaybook();
          setStatus("当前会话已恢复托管；全局暂停状态保持不变", "success"); return;
        }
        if (["approve-script", "reject-script", "disable-script"].includes(action)) {
          const scope = button.closest("[data-candidate]");
          const response = await call({ type: `BOSS_AUTOPILOT_${action === "approve-script" ? "APPROVE_SCRIPT" : action === "reject-script" ? "REJECT_SCRIPT" : "DISABLE_SCRIPT"}`, id: button.dataset.id, when: scope?.querySelector("[data-learning=when]")?.value, response: scope?.querySelector("[data-learning=response]")?.value, global: scope?.querySelector("[data-learning=global]")?.checked === true });
          playbook = response.book; renderPlaybook(); setStatus("剧本记录已更新；会话接管状态保持不变", "success"); return;
        }
        if (action === "start") {
          clearTemporaryRetry();
          if (!config.hasGeminiKey) { switchTab("config"); throw new Error("请先在“配置”中保存 Gemini Key"); }
          await saveConfig({ autoReply: true });
          startQueueProgress();
          await appendLog("运行控制", config.sendMode === "live" ? "已启动实际自动发送" : "已启动安全预览", "success");
          refreshRuntimeStatus();
          if (location.origin !== "https://www.zhipin.com" || location.pathname !== "/web/geek/chat") location.assign(CHAT_URL);
          else void processLatestMessage();
        }
        if (action === "save") { await saveConfig(); refreshRuntimeStatus("配置已保存 · " + (config.autoReply ? `${config.sendMode === "live" ? "实际发送" : "安全预览"}已开启 · 当前未读 ${unreadCount()} · 可处理 ${unreadConversationRows().length}` : "自动分析未开启")); }
        if (action === "test-gemini") {
          const testState = qs("[data-role='gemini-test-state']");
          if (testState) { testState.textContent = "测试中…"; testState.dataset.ready = "false"; }
          try {
            await saveConfig();
            const response = await call({ type: "BOSS_AUTOPILOT_TEST_GEMINI" });
            const actualModel = String(response.result?.model || "").replace(/^gemini-/i, "Gemini ");
            if (testState) { testState.textContent = `连接通过${actualModel ? ` · ${actualModel}` : ""}`; testState.dataset.ready = "true"; }
            setStatus("Gemini 连接测试通过", "success");
          } catch (error) {
            if (testState) { testState.textContent = "连接失败"; testState.dataset.ready = "false"; }
            throw error;
          }
        }
        if (action === "test-wecom") { await saveConfig(); await call({ type: "BOSS_AUTOPILOT_TEST_WECOM" }); setStatus("企业微信测试通知已发送", "success"); }
        if (action === "clear-gemini" || action === "clear-wecom") {
          const secret = action.endsWith("gemini") ? "gemini" : "wecom";
          const response = await call({ type: "BOSS_AUTOPILOT_CLEAR_SECRET", secret }); config = { ...config, ...response.config }; fillForm();
          resetSecretField(secret);
          setStatus(`${secret === "gemini" ? "Gemini Key" : "企业微信 Webhook"} 已清除`, "success");
        }
        if (action === "pause") { clearTemporaryRetry(); await saveConfig({ autoReply: false }); setQueuePhase("已暂停", "已停止读取、分析和发送"); await appendLog("运行控制", "自动沟通已暂停", "info"); setStatus("自动沟通已暂停", "success"); refreshRuntimeStatus("自动沟通已暂停"); }
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

  function activeChatHeaderInfo() {
    const header = document.querySelector(".chat-conversation .top-info, .chat-conversation .chat-header, .chat-header, .chat-title, .user-name, [class*='top-info'], [class*='chat-header']");
    const name = header?.querySelector(".name, .name-text, [class*='name']")?.textContent || "";
    const job = header?.querySelector(".job-name, .job-title, [class*='job']")?.textContent || "";
    return `${name} ${job}`.replace(/\s+/g, " ").trim();
  }

  function conversationId() {
    const active = document.querySelector(".user-list .friend-content.selected, .user-list li.selected, .friend-item.active, .chat-item.active, [class*='friend'][class*='active'], [class*='chat'][class*='active'], [class*='friend-content'][class*='selected']");
    const row = active?.closest("li") || active;
    const stableAttribute = ["data-id", "data-uid", "data-mid", "data-encrypt-id", "data-boss-id"].map((name) => row?.getAttribute(name) || active?.getAttribute(name)).find(Boolean);
    const avatar = row?.querySelector(".figure img,img")?.getAttribute("src") || "";
    const identity = (row?.querySelector(".title-box,.name-box,.name-text")?.textContent || "").trim();
    const chatHeader = activeChatHeaderInfo();

    if (stableAttribute) return String(stableAttribute).trim().slice(0, 500);
    if (identity) return `${avatar}|${identity}`.trim().slice(0, 500);
    if (chatHeader) return `chat|${chatHeader}`.slice(0, 500);
    return location.pathname;
  }

  function conversationLabel() {
    const active = document.querySelector(".user-list .friend-content.selected, .user-list li.selected, .friend-item.active, .chat-item.active, [class*='friend'][class*='active'], [class*='chat'][class*='active'], [class*='friend-content'][class*='selected']");
    const row = active?.closest("li") || active;
    const title = row?.querySelector(".name-text,.name-box,.title-box")?.textContent || "";
    const subtitle = row?.querySelector(".last-msg,.gray,.source-job,.job-name")?.textContent || "";
    const listLabel = `${title} ${subtitle}`.replace(/\s+/g, " ").trim().slice(0, 300);
    const chatHeader = activeChatHeaderInfo();
    return listLabel || chatHeader || "当前 BOSS 会话";
  }

  function isSameConversation(cidBefore) {
    return conversationId() === cidBefore;
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
    if (analysis?.interviewInvite === true || analysis?.action === "accept_interview") {
      return analysis?.stop !== true;
    }
    return analysis?.valuable === true
      && analysis?.requirementsComplete === true
      && analysis?.allCriteriaMet === true
      && analysis?.stop !== true
      && Array.isArray(analysis?.missingQuestions)
      && analysis.missingQuestions.length === 0;
  }

  function notificationFromAnalysis(analysis, label) {
    const isInterview = Boolean(analysis?.interviewInvite || analysis?.action === "accept_interview");
    return {
      job: analysis.job || {},
      conversationLabel: label,
      interviewInvite: isInterview,
      reason: String(analysis.reason || analysis.summary || (isInterview ? "🎉 招聘方发起面试邀约/提供面试安排" : "全部已配置条件均满足")).slice(0, 1000),
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
      await appendLog("企业微信通知", pending.notification?.interviewInvite ? "🎉 面试邀约已推送企业微信" : "岗位线索通知已发送", "success", pending.notification?.conversationLabel || "");
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

  async function processLatestMessage({ manualPreview = false } = {}) {
    if (contextInvalidated || processing || queueOpening || (!manualPreview && (transientRetryTimer || !config.autoReply))) return;
    if (!location.pathname.includes('/web/geek/chat')) { setStatus('请先打开一个 BOSS 会话', 'error'); return; }
    const messages = visibleMessageNodes().filter(item => /item-friend|item-myself/.test(item.className + ' ' + item.parentElement?.className));
    const node = messages.at(-1);
    if (!node || !inboundMessage(node)) { setStatus('当前没有待回复的招聘方消息', 'info'); return; }
    const cid = conversationId(), key = currentKey(), label = conversationLabel();
    if (cid === location.pathname) { setStatus('无法确认会话身份，已停止处理', 'error'); return; }
    if (playbook.handoffs[key]) {
      const row = document.querySelector('.user-list .friend-content.selected')?.closest('li');
      if (row) heldQueueRows.add(queueRowKey(row));
      renderPlaybook(); setStatus('当前会话等待人工处理；恢复托管前不再分析或发送', 'error'); setQueuePhase('等待人工接管', '恢复托管前不会执行当前会话'); queueProgress.stoppedAt = Date.now(); return;
    }
    if (editorText()) { await holdConversation('输入框已有内容，已保留草稿并交给你处理。'); return; }
    const latestMessage = (node.textContent || '').trim().slice(0, 1500);
    const fingerprint = cid + '|' + latestMessage;
    const state = await stateForToday();
    if (!manualPreview && state.seen.includes(fingerprint)) return;
    if (!manualPreview && (state.total >= config.dailyReplyLimit || Number(state.conversations[cid] || 0) >= config.perConversationLimit)) { setQueuePhase('已暂停', '已达到配置的处理上限'); return; }
    processing = true;
    if (manualPreview) { startQueueProgress(); queueProgress.singlePreview = true; queueProgress.total = 1; }
    else queueProgress.singlePreview = false;
    const revision = runRevision;
    const mode = manualPreview ? 'preview' : config.sendMode;
    const messageStamp = () => visibleMessageNodes().filter(item => /item-friend|item-myself/.test(item.className + ' ' + item.parentElement?.className)).map(x => x.textContent || '').join('|');
    const stamp = messageStamp();
    const guard = () => {
      if (contextInvalidated || revision !== runRevision || playbook.handoffs[key] || (!manualPreview && !config.autoReply) || !isSameConversation(cid, label) || messageStamp() !== stamp || editorText()) throw new Error('会话、消息或控制状态已变化，本次结果已取消');
    };
    let conversation = '';
    setQueuePhase('匹配沟通剧本', '正在核对问题、事实依据和授权范围');
    setStatus('正在分析当前会话；范围外将转人工');
    try {
      conversation = messages.slice(-12).map(item => (inboundMessage(item) ? '招聘方：' : '求职者：') + (item.textContent || '').trim()).join('\n');
      const response = await call({ type: 'BOSS_AUTOPILOT_ANALYZE_CONVERSATION', input: { latestMessage, conversation, conversationLabel: label, conversationKey: key } });
      guard(); clearTemporaryRetry();
      const analysis = response.analysis;
      const reply = String(analysis.reply || '').trim();
      // All external actions pass the same gate; cards never bypass handoff.
      const allowed = analysis.needsHuman === false && analysis.inScope === true && analysis.stop === false && (['reply','none'].includes(analysis.action) || analysis.action === 'send_resume' && analysis.scriptId === 'resume_request' || analysis.action === 'agree_contact' && analysis.scriptId === 'contact_request') && analysis.scriptRevision === playbook.revision;
      let outcome;
      if (!allowed) {
        await holdConversation(analysis.humanAction || analysis.reason || '当前问题超出已确认剧本。', latestMessage);
        outcome = '已转人工：所有自动动作已停止';
        const plan = qs('[data-role=plan]'); plan.dataset.show = 'true'; plan.textContent = '越界转人工 · 未发送\n' + (analysis.humanAction || analysis.reason || '需要本人处理');
      } else if (['send_resume', 'agree_contact'].includes(analysis.action)) {
        const actionLabel = analysis.action === 'send_resume' ? '按请求发送已保存简历' : '按请求交换联系方式';
        if (mode === 'preview') { showPreview('待执行：' + actionLabel, analysis); outcome = '已授权动作安全预览：未执行'; }
        else {
          setQueuePhase('等待执行授权动作', actionLabel + '；暂停或输入消息会取消', Date.now() + config.replyDelaySeconds * 1000);
          await new Promise(resolve => setTimeout(resolve, config.replyDelaySeconds * 1000));
          guard();
          const fresh = await call({ type: 'BOSS_AUTOPILOT_GET_PLAYBOOK' });
          if (fresh.book.handoffs[key] || fresh.book.revision !== analysis.scriptRevision) throw new Error('剧本或接管状态已更新，本次取消');
          guard();
          const requestNode = visibleMessageNodes().filter(inboundMessage).at(-1);
          const verifyControl = () => { if (contextInvalidated || revision !== runRevision || playbook.handoffs[key] || !config.autoReply || config.sendMode !== 'live' || !isSameConversation(cid) || editorText() || visibleMessageNodes().filter(inboundMessage).at(-1) !== requestNode) throw new Error('控制状态已变化，授权动作已停止'); };
          try {
            await executeAuthorizedRequest(analysis.action, fingerprint, verifyControl);
            state.total++; state.conversations[cid] = Number(state.conversations[cid] || 0) + 1;
            outcome = '已完成：' + actionLabel;
          } catch (error) {
            if (isSameConversation(cid)) await holdConversation('授权动作未能确认完成，请检查页面后再恢复：' + error.message, latestMessage);
            throw error;
          }
        }
      } else if (!reply || analysis.action === 'none') {
        outcome = '剧本内：无需回复';
        showPreview('无需回复', analysis);
      } else if (mode === 'preview') {
        showPreview(reply, analysis); outcome = '剧本内安全预览：未发送';
      } else {
        const sendAt = Date.now() + config.replyDelaySeconds * 1000;
        setQueuePhase('等待发送', '剧本已匹配；输入消息或暂停会立即取消', sendAt);
        await new Promise(resolve => setTimeout(resolve, config.replyDelaySeconds * 1000));
        guard();
        const fresh = await call({ type: 'BOSS_AUTOPILOT_GET_PLAYBOOK' });
        if (fresh.book.handoffs[key] || fresh.book.revision !== analysis.scriptRevision) throw new Error('剧本或接管状态已更新，本条未发送');
        guard();
        await sendChatReply(reply);
        state.total++; state.conversations[cid] = Number(state.conversations[cid] || 0) + 1;
        outcome = '已按确认剧本发送回复';
      }
      if (!manualPreview) { state.seen.push(fingerprint); await storageSet({ [LOCAL_STATE_KEY]: state }); }
      markQueueItemCompleted(fingerprint);
      await appendCommunicationSample({ conversationId: cid, label, recruiterMessage: latestMessage, context: conversation, suggestedReply: reply, mode, action: outcome, reason: analysis.reason, humanAction: analysis.humanAction });
      await appendLog('剧本沟通', outcome, allowed ? 'success' : 'error', label);
      setStatus(outcome, allowed ? 'success' : 'error');
      setQueuePhase(allowed ? '本条处理完成' : '等待人工接管', outcome);
      // Preview never triggers external notifications. Handoffs have their own local notice.
      if (mode === 'live' && allowed && notificationEligible(analysis) && config.hasWecomWebhook) {
        state.pendingNotifications.push({ id: key + '|' + fingerprint, notification: notificationFromAnalysis(analysis, label), attempts: 0, nextAttemptAt: 0 });
        await storageSet({ [LOCAL_STATE_KEY]: state });
        await flushPendingNotifications(state);
      }
    } catch (error) {
      if (contextInvalidated || stopInvalidatedContext(error)) return;
      if (/已变化|已更新/.test(error.message)) { setStatus('状态已变化，本次结果已取消', 'info'); setQueuePhase('已取消', '未执行本次自动回复'); }
      else {
        setStatus('分析未完成：' + error.message, 'error'); setQueuePhase('处理未完成', '请检查会话状态；授权动作结果不明确时不会重试');
        await appendLog('剧本分析失败', error.message, 'error');
        if (!manualPreview) { config.autoReply = false; await saveConfig({ autoReply: false }); }
      }
    } finally {
      processing = false;
      if (manualPreview || !config.autoReply) { queueProgress.stoppedAt = Date.now(); renderQueueProgress(); }
      if (!manualPreview && !contextInvalidated && config.autoReply && config.sendMode === 'live') window.setTimeout(() => void openNextUnreadConversation(), 1400);
    }
  }

  function showPreview(reply, analysis, cardAction = "") {
    const plan = qs("[data-role='plan']");
    plan.dataset.show = "true";
    const notificationStatus = notificationEligible(analysis) ? "全部通知条件已满足（预览模式不推送）" : "尚未满足全部通知条件";
    const actionNotice = cardAction ? `\n待执行动作：${cardAction}` : (analysis.action && analysis.action !== "none" ? `\n建议动作：${analysis.action}` : "");
    const interviewNotice = (analysis.interviewInvite || analysis.action === "accept_interview") ? "\n🎉 判定为面试邀约推进" : "";
    plan.textContent = `安全预览（未发送）\n剧本：${analysis.scriptId || "无"}\n${reply}\n\n判断：${analysis.valuable ? "值得关注" : "继续了解"}${interviewNotice}${actionNotice}\n通知：${notificationStatus}\n${analysis.reason || ""}`;
  }

  async function executeAuthorizedRequest(action, fingerprint, verifyControl) {
    const isResume = action === "send_resume";
    const matches = text => isResume ? /简历|附件/.test(text) : /微信|电话|联系方式/.test(text);
    const visible = el => el?.isConnected && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 && getComputedStyle(el).visibility !== "hidden";
    const enabled = el => visible(el) && !el.disabled && el.getAttribute("aria-disabled") !== "true" && !/disabled/i.test(el.className || "");
    const buttons = scope => [...scope.querySelectorAll("button,a,.card-btn,.btn,[role=button],[class*='btn']")].filter(enabled);
    const latest = visibleMessageNodes().filter(inboundMessage).at(-1);
    const card = latest?.closest(".message-item") || latest;
    const requestButtons = card && matches(card.textContent || "") ? buttons(card).filter(x => /^(同意|接受|确认)$/.test(x.textContent.trim())) : [];
    let target = requestButtons.length === 1 ? requestButtons[0] : null;
    if (!target && !requestButtons.length) {
      const scope = document.querySelector(".chat-conversation");
      const toolbar = scope ? [...scope.querySelectorAll("button,a,span,[class*='toolbar']")].filter(enabled).filter(x => isResume ? x.textContent.trim() === "发简历" : /^(交换微信|交换电话|交换联系方式|换微信|换电话)$/.test(x.textContent.trim())) : [];
      const leaves = toolbar.filter(x => !toolbar.some(y => y !== x && x.contains(y)));
      if (leaves.length === 1) target = leaves[0];
    }
    if (!target) throw new Error("未找到唯一匹配的 BOSS 原生操作入口");
    const operationKey = `lptffBossRequest-${conversationKey(fingerprint + action)}`;
    if ((await storageGet(operationKey))[operationKey]) throw new Error("该请求已有执行记录，避免重复发送，请人工核实");
    verifyControl();
    // Persist before the first click: an uncertain result must never auto-retry.
    await storageSet({ [operationKey]: { at: Date.now(), status: "attempted", action } });
    const ownMessages = () => [...document.querySelectorAll(".chat-record .im-list > li.item-myself")];
    const baseline = new Set(ownMessages().map(x => x.textContent));
    const originalCardText = card?.textContent || "";
    const confirmed = () => ownMessages().some(x => !baseline.has(x.textContent) && matches(x.textContent || "")) || (card?.textContent !== originalCardText && matches(card?.textContent || "") && /已发送|已同意|交换成功|已交换/.test(card?.textContent || ""));
    const click = el => { verifyControl(); if (!enabled(el)) throw new Error("操作入口已变化"); el.click(); };
    click(target);
    const handled = new Set();
    const started = Date.now();
    while (Date.now() - started < 12000) {
      await new Promise(resolve => setTimeout(resolve, 350));
      verifyControl();
      if (confirmed()) { await storageSet({ [operationKey]: { at: Date.now(), status: "confirmed", action } }); return; }
      const dialogs = [...document.querySelectorAll(".boss-layer__wrapper,.boss-popup,.dialog-wrap,.dialog-container,[role=dialog]")].filter(visible).filter(x => matches(x.textContent || ""));
      const inner = dialogs.filter(x => !dialogs.some(y => y !== x && x.contains(y)));
      if (inner.length > 1) throw new Error("出现多个操作弹窗，需要本人选择");
      const dialog = inner[0];
      if (!dialog) continue;
      if (isResume) {
        const options = [...dialog.querySelectorAll("input[type=radio],[role=radio]")].filter(visible);
        const selected = options.some(x => x.checked || x.getAttribute("aria-checked") === "true");
        if (!selected && options.length === 1 && !handled.has(options[0])) { click(options[0]); handled.add(options[0]); continue; }
        if (!selected && options.length > 1) throw new Error("存在多份简历且没有已选版本，需要本人选择");
      }
      const confirms = buttons(dialog).filter(x => /^(发送|确认发送|确定|确认|同意|交换)$/.test(x.textContent.trim()));
      const leaves = confirms.filter(x => !confirms.some(y => y !== x && x.contains(y)));
      if (leaves.length !== 1) continue;
      if (!handled.has(leaves[0])) { click(leaves[0]); handled.add(leaves[0]); }
    }
    throw new Error("页面未显示明确成功状态；不重复点击，请本人核实");
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

  function unreadTabControl() {
    return [...document.querySelectorAll("button,a,[role='tab'],span,div")].find((node) => {
      if (!node.offsetParent || node.closest(`#${HOST_ID}`) || node.children.length > 2) return false;
      return /^未读\s*[（(]?\s*\d+\s*[）)]?$/.test((node.textContent || "").trim());
    }) || null;
  }

  async function revealUnreadQueue() {
    let rows = unreadConversationRows();
    if (rows.length || unreadCount() < 1) return rows;
    const tab = unreadTabControl();
    if (!tab) return rows;
    setQueuePhase("切换未读列表", `当前有 ${unreadCount()} 条未读，正在让消息队列显示出来`);
    setStatus(`当前有 ${unreadCount()} 条未读，正在切换到未读列表…`);
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup"]) {
      tab.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, buttons: type.endsWith("down") ? 1 : 0 }));
    }
    if (typeof tab.click === "function") tab.click();
    const started = Date.now();
    while (Date.now() - started < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      rows = unreadConversationRows();
      if (rows.length) return rows;
    }
    return rows;
  }

  function queueRowKey(row) {
    return String(row.querySelector(".name-text,.name-box")?.textContent || row.textContent || "").trim().slice(0, 160);
  }

  function queueRowFailureCount(row) {
    const key = queueRowKey(row);
    const failure = queueOpenFailures.get(key);
    if (!failure) return 0;
    if (Date.now() - Number(failure.at || 0) >= 60000) {
      queueOpenFailures.delete(key);
      return 0;
    }
    return Number(failure.count || 0);
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
    queueOpening = true;
    const unread = unreadCount();
    setQueuePhase("扫描未读队列", `正在查找 ${unread} 条未读中的下一条`);
    let rows = unreadConversationRows();
    if (!rows.length) rows = await revealUnreadQueue();
    const row = rows.find((item) => queueRowFailureCount(item) < 2 && !heldQueueRows.has(queueRowKey(item)));
    if (!row) {
      queueOpening = false;
      if (unread > 0 && Date.now() - lastQueueDiagnosticAt > 60000) {
        lastQueueDiagnosticAt = Date.now();
        const outcome = rows.length
          ? `检测到 ${unread} 条未读，但当前 ${rows.length} 条可见会话均已连续打开失败；稍后自动重试`
          : `检测到 ${unread} 条未读，但未找到可打开的会话行；请保持“未读”列表可见后重试`;
        setQueuePhase("等待队列恢复", outcome, Date.now() + 60000);
        setStatus(outcome, "error");
        await appendLog("未读队列", outcome, "error");
      } else {
        if (unread < 1) setQueuePhase("等待新消息", "当前未读队列已处理完，后台会继续检查", Date.now() + 5000);
        refreshRuntimeStatus();
      }
      return;
    }
    const key = queueRowKey(row);
    setQueuePhase("打开下一条会话", `本轮已完成 ${queueProgress.completed} 条，当前可处理 ${rows.length} 条`);
    setStatus(`发现 ${unread} 个未读会话，当前可处理 ${rows.length}，正在打开下一条…`);
    const target = activateConversationRow(row);
    const opened = await waitForConversationOpen(target);
    queueOpening = false;
    if (!opened) {
      const failures = queueRowFailureCount(row) + 1;
      queueOpenFailures.set(key, { count: failures, at: Date.now() });
      setQueuePhase("会话打开超时", failures < 2 ? "马上重试当前队列" : "该条 60 秒后再试", Date.now() + (failures < 2 ? 900 : 60000));
      setStatus(`未读会话打开超时（${failures}/2），${failures < 2 ? "正在重试" : "60 秒后再试该条"}`, "error");
      window.setTimeout(() => void openNextUnreadConversation(), 900);
      return;
    }
    queueOpenFailures.delete(key);
    setQueuePhase("读取会话内容", "会话已打开，正在等待消息内容加载", Date.now() + 700);
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
        renderPlaybook();
        void observeHumanReply();
        if (config.autoReply) void processLatestMessage();

      }, 900);
    });
    chatObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    if (config.autoReply) void processLatestMessage();
  }

  function ensureArrivalPolling() {
    if (arrivalPollTimer || contextInvalidated) return;
    arrivalPollTimer = window.setInterval(() => {
      if (contextInvalidated || !config.autoReply || processing || queueOpening || transientRetryTimer) return;
      void flushPendingNotifications();
      if (config.sendMode === "live" && unreadConversationRows().length) void openNextUnreadConversation();
      else void processLatestMessage();
    }, 5000);
    progressTickTimer = window.setInterval(renderQueueProgress, 1000);
  }

  function mountWhenReady() {
    if (contextInvalidated) return;
    render();
    if (!panel?.isConnected) window.setTimeout(mountWhenReady, 800);
    else {
      bindManualControl();
      ensureArrivalPolling();
      loadConfig().catch((error) => setStatus(error.message, "error"));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountWhenReady, { once: true });
  else mountWhenReady();
})();
