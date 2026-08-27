(() => {
  const STORAGE_SETTINGS_KEY = "bossAssistantSettings";
  const STORAGE_PRESETS_KEY = "bossAssistantPresets";
  const STORAGE_LOGS_KEY = "bossAssistantLogs";
  const STORAGE_DAILY_KEY = "bossAssistantDailyV2";

  const DEFAULT_SETTINGS = {
    enabled: true,
    companyRule: { enabled: false, mode: "exclude", text: "外包, 劳务派遣, 驻场" },
    titleRule: { enabled: false, mode: "include", text: "前端, Vue, React, Web" },
    descRule: { enabled: false, mode: "exclude", text: "" },
    bossRule: { enabled: false, mode: "include", text: "" },
    filterHeadhunter: false,
    filterChatted: true,
    filterGoldInterviewer: false,
    salaryMin: "",
    salaryMax: "",
    freshDays: "7",
    highlightCards: true,
    dimExcludedCards: true,
    delayMin: 3,
    delayMax: 6,
    maxBatchCount: 15,
    dailyLimit: 120,
    sendNotification: true,
    greetingTemplate: "你好，{{companyName}} 的 {{jobName}} 我很感兴趣。看了岗位要求和薪资后，感觉比较匹配，想进一步了解一下方便吗？",
    aiGreetingEnabled: false,
    aiFilterEnabled: false,
    aiReplyEnabled: false,
    aiMinScore: 70,
    apiBaseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    aiModel: "deepseek-reasoner",
    aiPromptGreeting: "你是一个求职助手。请根据岗位信息和要求，写一段精炼、真诚、体现高匹配度的打招呼内容（80字以内），不要官腔套话。",
    aiPromptFilter: "你是一个严格的招聘顾问。请分析以下岗位是否存在外包、虚假招聘等风险，评估岗位质量，并给出匹配分数(0-100)和简要理由。",
  };

  const BUILTIN_PRESETS = [
    {
      id: "builtin-frontend",
      name: "前端优先",
      description: "偏向前端岗位，突出 Vue / React / Web / 小程序。",
      settings: {
        titleRule: { enabled: true, mode: "include", text: "前端, Vue, React, Web, 小程序" },
        salaryMin: "15",
        salaryMax: "",
        freshDays: "7",
        filterChatted: true,
      },
    },
    {
      id: "builtin-backend",
      name: "后端优先",
      description: "偏向后端 / Java / Go / Python / 架构类岗位。",
      settings: {
        titleRule: { enabled: true, mode: "include", text: "后端, Java, Go, Python, 架构" },
        salaryMin: "18",
        salaryMax: "",
        freshDays: "7",
        filterChatted: true,
      },
    },
    {
      id: "builtin-product",
      name: "产品运营",
      description: "关注产品、运营、增长、策略类岗位。",
      settings: {
        titleRule: { enabled: true, mode: "include", text: "产品, 运营, 增长, 策略" },
        salaryMin: "12",
        salaryMax: "",
        freshDays: "10",
        filterChatted: true,
      },
    },
    {
      id: "builtin-hot",
      name: "高薪冲刺",
      description: "优先筛选高薪岗位，配合更严格的薪资下限。",
      settings: {
        titleRule: { enabled: false, mode: "include", text: "" },
        salaryMin: "25",
        salaryMax: "",
        freshDays: "5",
        filterChatted: true,
      },
    },
  ];

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    presets: [...BUILTIN_PRESETS],
    logs: [],
    page: null,
    daily: { date: dayKey(), delivered: 0, scanned: 0 },
    jobs: [],
    allJobs: [],
  };

  function dayKey(value = Date.now()) {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (res) => resolve(res || {}));
    });
  }

  function storageSet(items) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, () => resolve());
    });
  }

  function callChrome(target, method, ...args) {
    return new Promise((resolve, reject) => {
      method.call(target, ...args, (result) => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }

  async function findBossTab() {
    const [active] = await callChrome(chrome.tabs, chrome.tabs.query, { active: true, currentWindow: true });
    if (active && /zhipin\.com/i.test(active.url || "")) return active;
    const bossUrlPatterns = ["https://*.zhipin.com/*", "https://zhipin.com/*"];
    let candidates = await callChrome(chrome.tabs, chrome.tabs.query, { currentWindow: true, url: bossUrlPatterns });
    if (!candidates?.length) {
      candidates = await callChrome(chrome.tabs, chrome.tabs.query, { url: bossUrlPatterns });
    }
    return [...(candidates || [])].sort((a, b) => Number(b.lastAccessed || 0) - Number(a.lastAccessed || 0))[0] || null;
  }

  async function appendLog(level, message, detail = "") {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      time: new Date().toISOString(),
      level,
      message,
      detail,
    };
    state.logs = [entry, ...(state.logs || [])].slice(0, 300);
    await storageSet({ [STORAGE_LOGS_KEY]: state.logs });
    renderLogs();
  }

  function renderPopupStats() {
    const deliveredEl = document.querySelector("#boss-stat-delivered");
    const scannedEl = document.querySelector("#boss-stat-scanned");
    const matchedEl = document.querySelector("#boss-stat-matched");
    const totalEl = document.querySelector("#boss-stat-total");

    if (deliveredEl) deliveredEl.textContent = String(state.daily.delivered);
    if (scannedEl) scannedEl.textContent = String(state.daily.scanned);
    if (matchedEl) matchedEl.textContent = String(state.jobs.length);
    if (totalEl) totalEl.textContent = String(state.allJobs.length);
  }

  function renderLogs() {
    const container = document.querySelector("#boss-popup-logs");
    if (!container) return;
    const level = document.querySelector("#boss-log-level")?.value || "all";
    const filtered = (state.logs || []).filter((l) => level === "all" || l.level === level);

    if (!filtered.length) {
      container.innerHTML = '<div class="boss-log">暂无日志</div>';
      return;
    }

    container.innerHTML = filtered
      .slice(0, 30)
      .map((l) => {
        const safeLevel = ["info", "warn", "error"].includes(l.level) ? l.level : "info";
        return `
        <div class="boss-log boss-log-${safeLevel}">
          <strong>[${escapeHtml(l.level)}]</strong> <span style="color:#909399;">${escapeHtml(new Date(l.time).toLocaleTimeString())}</span>
          <div>${escapeHtml(l.message)}</div>
          ${l.detail ? `<div class="boss-log-detail">${escapeHtml(l.detail)}</div>` : ""}
        </div>
      `;
      })
      .join("");
  }

  function populateInputs() {
    const s = state.settings;
    const setVal = (id, val) => {
      const el = document.querySelector(id);
      if (el) el.value = val ?? "";
    };
    const setChk = (id, val) => {
      const el = document.querySelector(id);
      if (el) el.checked = Boolean(val);
    };
    const setTag = (id, mode) => {
      const el = document.querySelector(id);
      if (!el) return;
      el.textContent = mode === "include" ? "包含" : "排除";
      el.className = `boss-mode-tag ${mode}`;
    };

    setChk("#boss-chk-company", s.companyRule?.enabled);
    setTag("#boss-tag-company", s.companyRule?.mode || "exclude");
    setVal("#boss-inp-company", s.companyRule?.text);

    setChk("#boss-chk-title", s.titleRule?.enabled);
    setTag("#boss-tag-title", s.titleRule?.mode || "include");
    setVal("#boss-inp-title", s.titleRule?.text);

    setChk("#boss-chk-desc", s.descRule?.enabled);
    setTag("#boss-tag-desc", s.descRule?.mode || "exclude");
    setVal("#boss-inp-desc", s.descRule?.text);

    setChk("#boss-chk-boss", s.bossRule?.enabled);
    setTag("#boss-tag-boss", s.bossRule?.mode || "include");
    setVal("#boss-inp-boss", s.bossRule?.text);

    setChk("#boss-chk-headhunter", s.filterHeadhunter);
    setChk("#boss-chk-chatted", s.filterChatted);
    setChk("#boss-chk-gold", s.filterGoldInterviewer);
    setVal("#boss-inp-salary-min", s.salaryMin);
    setVal("#boss-inp-salary-max", s.salaryMax);
    setVal("#boss-inp-fresh-days", s.freshDays);

    setChk("#boss-chk-ai-greeting", s.aiGreetingEnabled);
    setChk("#boss-chk-ai-filter", s.aiFilterEnabled);
    setVal("#boss-inp-ai-url", s.apiBaseUrl);
    setVal("#boss-inp-ai-model", s.aiModel);
    setVal("#boss-inp-ai-min-score", s.aiMinScore);
    setVal("#boss-inp-ai-key", s.apiKey);
    setVal("#boss-inp-ai-greeting-prompt", s.aiPromptGreeting);

    const isEnabled = s.enabled !== false;
    const masterBtn = document.querySelector("#boss-master-toggle-btn");
    const statusText = document.querySelector("#boss-switch-status-text");
    if (masterBtn) {
      masterBtn.textContent = isEnabled ? "已开启" : "已关闭";
      masterBtn.className = `boss-toggle-btn ${isEnabled ? "active" : "disabled"}`;
      masterBtn.title = isEnabled ? "点击关闭 BOSS 直聘助手全部功能" : "点击开启 BOSS 直聘助手全部功能";
    }
    if (statusText) {
      statusText.textContent = isEnabled ? "卡片实时解析、多维规则过滤与高亮已开启" : "助手已处于关闭停用状态";
    }

    const sel = document.querySelector("#boss-sel-preset");
    if (sel) {
      sel.innerHTML = state.presets.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
    }
  }

  function readInputs() {
    const s = state.settings;
    const getVal = (id) => document.querySelector(id)?.value ?? "";
    const getChk = (id) => Boolean(document.querySelector(id)?.checked);
    const getTagMode = (id) => (document.querySelector(id)?.textContent === "包含" ? "include" : "exclude");

    s.companyRule = { enabled: getChk("#boss-chk-company"), mode: getTagMode("#boss-tag-company"), text: getVal("#boss-inp-company") };
    s.titleRule = { enabled: getChk("#boss-chk-title"), mode: getTagMode("#boss-tag-title"), text: getVal("#boss-inp-title") };
    s.descRule = { enabled: getChk("#boss-chk-desc"), mode: getTagMode("#boss-tag-desc"), text: getVal("#boss-inp-desc") };
    s.bossRule = { enabled: getChk("#boss-chk-boss"), mode: getTagMode("#boss-tag-boss"), text: getVal("#boss-inp-boss") };

    s.filterHeadhunter = getChk("#boss-chk-headhunter");
    s.filterChatted = getChk("#boss-chk-chatted");
    s.filterGoldInterviewer = getChk("#boss-chk-gold");
    s.salaryMin = getVal("#boss-inp-salary-min");
    s.salaryMax = getVal("#boss-inp-salary-max");
    s.freshDays = getVal("#boss-inp-fresh-days");

    s.aiGreetingEnabled = getChk("#boss-chk-ai-greeting");
    s.aiFilterEnabled = getChk("#boss-chk-ai-filter");
    s.apiBaseUrl = getVal("#boss-inp-ai-url");
    s.aiModel = getVal("#boss-inp-ai-model");
    const aiMinScoreRaw = getVal("#boss-inp-ai-min-score").trim();
    const aiMinScore = Number(aiMinScoreRaw);
    s.aiMinScore = aiMinScoreRaw && Number.isFinite(aiMinScore) ? Math.min(100, Math.max(0, aiMinScore)) : DEFAULT_SETTINGS.aiMinScore;
    s.apiKey = getVal("#boss-inp-ai-key");
    s.aiPromptGreeting = getVal("#boss-inp-ai-greeting-prompt");
  }

  function renderPopupStructure() {
    const container = document.querySelector("#boss-group-market");
    if (!container) return;

    container.innerHTML = `
      <div class="boss-master-switch-card">
        <div class="boss-switch-info">
          <strong class="boss-switch-title">BOSS 直聘助手主开关</strong>
          <span id="boss-switch-status-text" class="boss-switch-desc">卡片实时解析、多维规则过滤与高亮已开启</span>
        </div>
        <button id="boss-master-toggle-btn" class="boss-toggle-btn active" type="button">已开启</button>
      </div>

      <article class="boss-card">
        <div class="boss-header">
          <div>
            <h2 class="boss-title" style="color:#00b38a;">Boss-Helper · 求职效能工作台</h2>
            <p class="boss-subtitle">已支持页面浮动工作台、包含/排除多维规则引擎、DeepSeek-R1 深度评估与自动批处理投递流水线。</p>
          </div>
          <div class="boss-actions">
            <button type="button" class="secondary" id="boss-btn-open-page">进入 BOSS 直聘</button>
          </div>
        </div>

        <div class="boss-stats" style="grid-template-columns: repeat(4, 1fr);">
          <div class="boss-stat"><span>今日已投</span><strong id="boss-stat-delivered">0</strong></div>
          <div class="boss-stat"><span>页面总数</span><strong id="boss-stat-total">0</strong></div>
          <div class="boss-stat"><span>规则命中</span><strong id="boss-stat-matched" style="color:#00b38a;">0</strong></div>
          <div class="boss-stat"><span>今日扫描</span><strong id="boss-stat-scanned">0</strong></div>
        </div>

        <div class="boss-form">
          <div class="boss-section-title">筛选规则配置（打勾启用，点击标签切换 排除 / 包含）</div>
          
          <div class="boss-rule-row">
            <input type="checkbox" id="boss-chk-company">
            <span class="boss-mode-tag exclude" id="boss-tag-company">排除</span>
            <input class="boss-form-input" id="boss-inp-company" placeholder="公司名 (如 外包, 某某公司)">
          </div>

          <div class="boss-rule-row">
            <input type="checkbox" id="boss-chk-title">
            <span class="boss-mode-tag include" id="boss-tag-title">包含</span>
            <input class="boss-form-input" id="boss-inp-title" placeholder="岗位名 (如 前端, Vue, React)">
          </div>

          <div class="boss-rule-row">
            <input type="checkbox" id="boss-chk-desc">
            <span class="boss-mode-tag exclude" id="boss-tag-desc">排除</span>
            <input class="boss-form-input" id="boss-inp-desc" placeholder="工作内容 / 技能排除词">
          </div>

          <div class="boss-rule-row">
            <input type="checkbox" id="boss-chk-boss">
            <span class="boss-mode-tag include" id="boss-tag-boss">包含</span>
            <input class="boss-form-input" id="boss-inp-boss" placeholder="HR职位 (如 技术总监, 负责人)">
          </div>

          <div class="boss-checkbox-row">
            <label><input type="checkbox" id="boss-chk-headhunter"> 猎头过滤</label>
            <label><input type="checkbox" id="boss-chk-chatted"> 好友过滤(已聊)</label>
            <label><input type="checkbox" id="boss-chk-gold"> 过滤金牌面试官</label>
          </div>

          <div class="row2" style="grid-template-columns: repeat(3, 1fr); margin-top:8px;">
            <label>最低薪资(K)<input id="boss-inp-salary-min" placeholder="如 15"></label>
            <label>最高薪资(K)<input id="boss-inp-salary-max" placeholder="如 40"></label>
            <label>新鲜天数(天)<input id="boss-inp-fresh-days" placeholder="如 7"></label>
          </div>

          <div class="boss-actions" style="margin-top:10px;">
            <select id="boss-sel-preset" style="flex:1; padding:6px;"></select>
            <button type="button" class="secondary" id="boss-btn-apply-preset">应用预设</button>
            <button type="button" class="secondary" id="boss-btn-save">保存配置</button>
          </div>
        </div>

        <div class="boss-form">
          <div class="boss-section-title">DeepSeek AI 配置</div>
          <div class="boss-checkbox-row" style="margin-bottom:8px;">
            <label><input type="checkbox" id="boss-chk-ai-greeting"> AI 智能打招呼</label>
            <label><input type="checkbox" id="boss-chk-ai-filter"> AI 岗位质量评估</label>
          </div>
          <div class="row2">
            <label>API Base URL<input id="boss-inp-ai-url" placeholder="https://api.deepseek.com/v1"></label>
            <label>模型名称<input id="boss-inp-ai-model" placeholder="deepseek-reasoner"></label>
          </div>
          <label>AI 最低匹配分数 (0-100)<input id="boss-inp-ai-min-score" type="number" min="0" max="100" placeholder="70"></label>
          <label>API Key<input id="boss-inp-ai-key" type="password" placeholder="sk-..."></label>
          <label>打招呼 Prompt 模板<textarea id="boss-inp-ai-greeting-prompt" rows="2"></textarea></label>
          <div class="boss-actions">
            <button type="button" class="secondary" id="boss-btn-save-ai">保存 AI 配置</button>
          </div>
        </div>

        <div class="boss-form">
          <div class="boss-section-title">日志中心</div>
          <div class="boss-log-toolbar">
            <label>级别
              <select id="boss-log-level">
                <option value="all">全部</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </label>
            <div style="text-align:right;">
              <button type="button" class="secondary" id="boss-btn-clear-logs">清空日志</button>
            </div>
          </div>
          <div id="boss-popup-logs" class="boss-logs" style="max-height:160px;"></div>
        </div>
      </article>
    `;
  }

  function bindEvents() {
    document.querySelector("#boss-master-toggle-btn")?.addEventListener("click", async () => {
      state.settings.enabled = !(state.settings.enabled !== false);
      await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
      populateInputs();
      await appendLog("info", state.settings.enabled ? "🟢 Popup 助手主开关已开启" : "⚪ Popup 助手主开关已关闭");
      if (typeof chrome !== "undefined" && chrome.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "BOSS_HELPER_TOGGLE_ENABLED", enabled: state.settings.enabled }, () => {
              if (chrome.runtime?.lastError) {
                // Tab might not be a boss page or content script not ready
              }
            });
          }
        });
      }
    });

    document.querySelectorAll(".boss-mode-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        const isInclude = tag.classList.contains("include");
        tag.classList.toggle("include", !isInclude);
        tag.classList.toggle("exclude", isInclude);
        tag.textContent = isInclude ? "排除" : "包含";
      });
    });

    document.querySelector("#boss-btn-open-page")?.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://www.zhipin.com/web/geek/job" });
    });

    document.querySelector("#boss-btn-save")?.addEventListener("click", async () => {
      readInputs();
      await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
      await appendLog("info", "Popup 配置已保存并同步");
    });

    document.querySelector("#boss-btn-save-ai")?.addEventListener("click", async () => {
      readInputs();
      let permissionGranted = true;
      if (state.settings.apiBaseUrl && state.settings.apiKey) {
        try {
          const parsedUrl = new URL(state.settings.apiBaseUrl);
          if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("unsupported protocol");
          const origin = parsedUrl.origin;
          permissionGranted = await callChrome(chrome.permissions, chrome.permissions.request, { origins: [`${origin}/*`] });
        } catch {
          permissionGranted = false;
        }
      }
      await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
      await appendLog(permissionGranted ? "info" : "warn", permissionGranted
        ? "Popup AI 配置已保存"
        : "Popup AI 配置已保存，但 API 域名权限未获授权；AI 功能暂不可用");
    });

    document.querySelector("#boss-btn-apply-preset")?.addEventListener("click", async () => {
      const id = document.querySelector("#boss-sel-preset")?.value;
      const p = state.presets.find((x) => x.id === id);
      if (p) {
        state.settings = { ...state.settings, ...p.settings };
        populateInputs();
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        await appendLog("info", `Popup 已应用预设: ${p.name}`);
      }
    });

    document.querySelector("#boss-btn-clear-logs")?.addEventListener("click", async () => {
      state.logs = [];
      await storageSet({ [STORAGE_LOGS_KEY]: [] });
      renderLogs();
    });

    document.querySelector("#boss-log-level")?.addEventListener("change", renderLogs);
  }

  async function syncFromPage() {
    const tab = await findBossTab();
    state.page = tab;
    if (!tab?.id) return;
    try {
      chrome.tabs.sendMessage(tab.id, { type: "BOSS_HELPER_GET_STATE" }, (res) => {
        if (res?.ok) {
          state.jobs = res.jobs || [];
          state.allJobs = res.allJobs || [];
          if (res.daily) state.daily = res.daily;
          renderPopupStats();
        }
      });
    } catch { }
  }

  async function initPopup() {
    const saved = await storageGet([STORAGE_SETTINGS_KEY, STORAGE_PRESETS_KEY, STORAGE_LOGS_KEY, STORAGE_DAILY_KEY]);
    state.settings = { ...DEFAULT_SETTINGS, ...(saved[STORAGE_SETTINGS_KEY] || {}) };
    const userPresets = Array.isArray(saved[STORAGE_PRESETS_KEY]) ? saved[STORAGE_PRESETS_KEY] : [];
    state.presets = [...BUILTIN_PRESETS, ...userPresets];
    state.logs = Array.isArray(saved[STORAGE_LOGS_KEY]) ? saved[STORAGE_LOGS_KEY] : [];

    const today = dayKey();
    const dailyData = saved[STORAGE_DAILY_KEY];
    if (dailyData && dailyData.date === today) {
      state.daily = dailyData;
    } else {
      state.daily = { date: today, delivered: 0, scanned: 0 };
    }

    renderPopupStructure();
    populateInputs();
    bindEvents();
    renderPopupStats();
    renderLogs();
    syncFromPage();
  }

  initPopup();
})();
