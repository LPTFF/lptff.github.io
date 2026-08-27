(() => {
  if (globalThis.__LPTFF_BOSS_HELPER_READY__ && !globalThis.__LPTFF_TEST_RELOAD__) return;
  globalThis.__LPTFF_BOSS_HELPER_READY__ = true;

  const STORAGE_SETTINGS_KEY = "bossAssistantSettings";
  const STORAGE_PRESETS_KEY = "bossAssistantPresets";
  const STORAGE_LOGS_KEY = "bossAssistantLogs";
  const STORAGE_ARCHIVE_KEY = "bossAssistantJobArchiveV2";
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

  // Helper State
  const state = {
    settings: { ...DEFAULT_SETTINGS },
    presets: [...BUILTIN_PRESETS],
    activeTab: "stats",
    dockOpen: true,
    helpOpen: false,
    running: false,
    stopRequested: false,
    progress: { current: 0, total: 0 },
    daily: { date: dayKey(), delivered: 0, scanned: 0 },
    jobsOnPage: [],
    logs: [],
    aiResult: "",
  };

  // Test & Diagnostics Interface
  const diagnostics = {
    cardsDetected: 0,
    parsedJobs: [],
    matchedJobs: [],
    excludedJobs: [],
    selectorHits: { jobName: 0, companyName: 0, salary: 0, bossName: 0, location: 0, activeTime: 0 },
    parseFailures: [],
    mutationObserverActive: false,
    runtimeErrors: [],
    scanCount: 0,
    dockMounted: false,
    floatToggleMounted: false,
    activeTab: "stats",
  };

  function recordRuntimeError(context, err) {
    const errorMsg = `${context}: ${err?.message || String(err)}`;
    diagnostics.runtimeErrors.push({ time: new Date().toISOString(), message: errorMsg });
    console.error(`[Boss-Helper Error] ${errorMsg}`);
  }

  function dayKey(value = Date.now()) {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clipText(value, limit = 2000) {
    return normalizeText(value).slice(0, limit);
  }

  function canonicalJobUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value || "", globalThis.location?.origin || "https://www.zhipin.com");
      const match = url.pathname.match(/\/job_detail\/([^/?#]+?)(?:\.html)?$/i);
      return match ? `${url.origin}/job_detail/${match[1]}.html` : `${url.origin}${url.pathname}`;
    } catch {
      return normalizeText(value);
    }
  }

  function parseKeywords(value) {
    return String(value || "")
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseSalaryRange(text) {
    const value = normalizeText(text)
      .replace(/,/g, "")
      // BOSS currently renders salary ranges with different Unicode dash
      // characters depending on the card/list variant.
      .replace(/[‐‑‒–—―﹘﹣－]/g, "-");
    if (!value) return null;
    const wan = value.match(/(\d+(?:\.\d+)?)\s*万?\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*万/);
    if (wan) return { min: Number(wan[1]) * 10, max: Number(wan[2]) * 10 };
    const wanSingle = value.match(/(\d+(?:\.\d+)?)\s*万/);
    if (wanSingle) {
      const n = Number(wanSingle[1]) * 10;
      return { min: n, max: n };
    }
    const range = value.match(/(\d+(?:\.\d+)?)\s*[kK千]?\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*[kK千]/);
    if (range) return { min: Number(range[1]), max: Number(range[2]) };
    const single = value.match(/(\d+(?:\.\d+)?)\s*[kK千]/);
    if (single) {
      const n = Number(single[1]);
      return { min: n, max: n };
    }
    return null;
  }

  function parseFreshDays(text) {
    const value = normalizeText(text);
    if (!value) return null;
    if (/昨天|昨日/.test(value)) return 1;
    if (/刚刚|今天|今日|在线|活跃/.test(value)) return 0;
    if (/3\s*日内|三日内/.test(value)) return 3;
    if (/本周|7\s*日内|一周内/.test(value)) return 7;
    if (/本月|30\s*日内|一个月内/.test(value)) return 30;
    const days = value.match(/(\d+)\s*天前/);
    if (days) return Number(days[1]);
    const hours = value.match(/(\d+)\s*小时/);
    if (hours) return 0;
    const minutes = value.match(/(\d+)\s*分钟/);
    if (minutes) return 0;
    return null;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Storage wrappers
  function storageGet(keys) {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.get(keys, (res) => resolve(res || {}));
        } else {
          const res = {};
          const ks = Array.isArray(keys) ? keys : [keys];
          ks.forEach((k) => {
            const v = globalThis.localStorage?.getItem(`__lptff_${k}`);
            if (v) res[k] = JSON.parse(v);
          });
          resolve(res);
        }
      } catch (err) {
        recordRuntimeError("storageGet", err);
        resolve({});
      }
    });
  }

  function storageSet(items) {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set(items, () => resolve());
        } else {
          Object.entries(items).forEach(([k, v]) => {
            globalThis.localStorage?.setItem(`__lptff_${k}`, JSON.stringify(v));
          });
          resolve();
        }
      } catch (err) {
        recordRuntimeError("storageSet", err);
        resolve();
      }
    });
  }

  async function appendLog(level, message, detail = "") {
    try {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: new Date().toISOString(),
        level,
        message,
        detail,
      };
      state.logs = [entry, ...(state.logs || [])].slice(0, 300);
      await storageSet({ [STORAGE_LOGS_KEY]: state.logs });
      renderDockLogs();
    } catch (err) {
      recordRuntimeError("appendLog", err);
    }
  }

  // -------------------------------------------------------------
  // DOM Extraction & Rule Evaluation
  // -------------------------------------------------------------
  const SELECTOR_CANDIDATES = [
    'a[href*="/job_detail/"]',
    'a[href*="/web/geek/job"]',
    'a[href*="/web/geek/jobs"]',
    '.job-card-box',
    '.job-card-wrapper',
    '.job-card-left',
    '.job-name',
    '.job-title',
    'li.job-card-box',
    '.job-list-box li',
    '.search-job-result li',
    '.card-list li',
    '[class*="job-card"]',
    '[class*="job-item"]',
  ];

  function findCard(anchor) {
    if (!anchor) return null;
    if (anchor.classList?.contains('job-card-box') || anchor.classList?.contains('job-card-wrapper')) return anchor;
    return (
      anchor.closest?.('.job-card-box') ||
      anchor.closest?.('.job-card-wrapper') ||
      anchor.closest?.('[data-index]') ||
      anchor.closest?.('li') ||
      anchor.closest?.('article') ||
      anchor.closest?.('.job-card') ||
      anchor.closest?.('.job-item') ||
      anchor.parentElement
    );
  }

  function extractJobFromCard(card, anchor) {
    try {
      const jobUrl = canonicalJobUrl(anchor?.href || anchor?.getAttribute?.('href') || card?.querySelector?.('a[href*="/job_detail/"]')?.href || '');
      const rawText = clipText(card?.innerText || anchor?.innerText || '');

      const titleEl =
        card?.querySelector?.('[class*="job-name"]') ||
        card?.querySelector?.('.job-name') ||
        card?.querySelector?.('.job-title') ||
        card?.querySelector?.('.info-primary .name') ||
        card?.querySelector?.('h3') ||
        card?.querySelector?.('h2') ||
        anchor;
      const title = normalizeText(titleEl?.textContent);
      if (title) diagnostics.selectorHits.jobName++;

      const companyEl =
        card?.querySelector?.('[class*="company-name"]') ||
        card?.querySelector?.('.company-name') ||
        card?.querySelector?.('.company-info .name') ||
        card?.querySelector?.('.company-text .name') ||
        card?.querySelector?.('[class*="company"]') ||
        card?.querySelector?.('a[href*="/gongsi/"]');
      const companyName = normalizeText(
        companyEl?.textContent ||
        rawText.match(/[\u4e00-\u9fa5A-Za-z0-9]+(?:科技|网络|信息|传媒|教育|医药|集团|有限公司|公司)/)?.[0] ||
        '',
      );
      if (companyName) diagnostics.selectorHits.companyName++;

      const salaryEl =
        card?.querySelector?.('[class*="salary"]') ||
        card?.querySelector?.('.salary') ||
        card?.querySelector?.('.job-salary');
      const salary = normalizeText(
        salaryEl?.textContent ||
        rawText.match(/\d+(?:\.\d+)?\s*[-‐‑‒–—―﹘﹣－~至到]?\s*\d*(?:\.\d+)?\s*[kK千万]/)?.[0] ||
        '',
      );
      if (salary) diagnostics.selectorHits.salary++;

      const experience = normalizeText(
        card?.querySelector?.('[class*="experience"]')?.textContent ||
        rawText.match(/经验[^·\n ]*/)?.[0] ||
        rawText.match(/\d+-\d+年|\d+年以上|应届|在校/)?.[0] ||
        '',
      );
      const degree = normalizeText(
        card?.querySelector?.('[class*="degree"]')?.textContent ||
        rawText.match(/学历[^·\n ]*/)?.[0] ||
        rawText.match(/大专|本科|硕士|博士|初中|高中|中专/)?.[0] ||
        '',
      );
      const location = normalizeText(
        card?.querySelector?.('[class*="city"]')?.textContent ||
        card?.querySelector?.('[class*="district"]')?.textContent ||
        card?.querySelector?.('.job-area')?.textContent ||
        card?.querySelector?.('[class*="job-area"]')?.textContent ||
        '',
      );
      if (location) diagnostics.selectorHits.location++;

      const activeTime = normalizeText(
        card?.querySelector?.('[class*="refresh-time"]')?.textContent ||
        card?.querySelector?.('[class*="active-time"]')?.textContent ||
        card?.querySelector?.('[class*="time"]')?.textContent ||
        card?.querySelector?.('.time')?.textContent ||
        card?.querySelector?.('.refresh-time')?.textContent ||
        rawText.match(/(刚刚|今天|昨日|\d+\s*天前|\d+\s*小时|\d+\s*分钟前)/)?.[0] ||
        '',
      );
      if (activeTime) diagnostics.selectorHits.activeTime++;

      const bossEl =
        card?.querySelector?.('[class*="boss-name"]') ||
        card?.querySelector?.('.boss-name') ||
        card?.querySelector?.('.boss-info .name') ||
        card?.querySelector?.('.boss-info') ||
        card?.querySelector?.('[class*="boss"]');
      const bossName = normalizeText(bossEl?.textContent || '');
      if (bossName) diagnostics.selectorHits.bossName++;

      // Status checks from DOM
      const isChatted = Boolean(
        card?.querySelector?.('.start-chat-btn')?.textContent?.includes('继续沟通') ||
        card?.querySelector?.('.btn-startchat')?.textContent?.includes('继续沟通') ||
        card?.querySelector?.('[class*="chat-btn"]')?.textContent?.includes('继续沟通') ||
        card?.querySelector?.('[class*="chatted"]') ||
        /已沟通|继续沟通|聊过|已打招呼|已投递/.test(rawText)
      );

      const isHeadhunter = Boolean(
        card?.querySelector?.('[class*="hunter"]') ||
        /猎头|人力资源|劳务派遣|外包服务/.test(companyName) ||
        /猎头|顾问/.test(bossName)
      );

      const isGoldInterviewer = Boolean(
        card?.querySelector?.('[class*="gold"]') ||
        /金牌面试官|优选/.test(rawText)
      );

      if (!title || !companyName) {
        diagnostics.parseFailures.push({ cardText: rawText.slice(0, 100), missingTitle: !title, missingCompany: !companyName });
      }

      return {
        id: jobUrl || `${title}::${companyName}`,
        title,
        companyName,
        salary,
        experience,
        degree,
        location,
        activeTime,
        bossName,
        jobUrl,
        rawText,
        salaryRange: parseSalaryRange(salary),
        freshDays: parseFreshDays(activeTime || rawText),
        isChatted,
        isHeadhunter,
        isGoldInterviewer,
        cardEl: card,
        anchorEl: anchor,
      };
    } catch (err) {
      recordRuntimeError("extractJobFromCard", err);
      return { id: Math.random().toString(), title: "", companyName: "", cardEl: card };
    }
  }

  function evaluateJobRules(job, settings) {
    const reasons = [];

    // Helper: test include / exclude rule
    const testRule = (rule, text, label) => {
      if (!rule || !rule.enabled) return true;
      const keywords = parseKeywords(rule.text);
      if (!keywords.length) return true;
      const target = normalizeText(text).toLowerCase();
      const matched = keywords.some((k) => target.includes(k.toLowerCase()));
      if (rule.mode === "exclude" && matched) {
        reasons.push(`${label}命中排除词`);
        return false;
      }
      if (rule.mode === "include" && !matched) {
        reasons.push(`${label}未满足包含词`);
        return false;
      }
      return true;
    };

    if (!testRule(settings.companyRule, job.companyName, "公司名")) return { passed: false, reasons };
    if (!testRule(settings.titleRule, job.title, "岗位名")) return { passed: false, reasons };
    if (!testRule(settings.descRule, job.rawText, "工作描述")) return { passed: false, reasons };
    if (!testRule(settings.bossRule, job.bossName, "HR职位")) return { passed: false, reasons };

    if (settings.filterChatted && job.isChatted) {
      reasons.push("已沟通过(好友过滤)");
      return { passed: false, reasons };
    }

    if (settings.filterHeadhunter && job.isHeadhunter) {
      reasons.push("猎头职位过滤");
      return { passed: false, reasons };
    }

    if (settings.filterGoldInterviewer && job.isGoldInterviewer) {
      reasons.push("金牌面试官过滤");
      return { passed: false, reasons };
    }

    const minSalary = Number(settings.salaryMin) || 0;
    const maxSalary = Number(settings.salaryMax) || 0;
    if (minSalary || maxSalary) {
      // Some BOSS card variants keep the visible salary outside the element
      // matched by the primary selector. Re-parse both extracted salary text
      // and the complete card text before treating the value as unknown.
      const sr = job.salaryRange || parseSalaryRange(job.salary) || parseSalaryRange(job.rawText);
      if (sr) {
        if (minSalary && sr.min < minSalary) {
          reasons.push(`薪资下限(${sr.min}k)低于最低要求(${minSalary}k)`);
          return { passed: false, reasons };
        }
        if (maxSalary && sr.max > maxSalary) {
          reasons.push(`薪资上限(${sr.max}k)高于最高要求(${maxSalary}k)`);
          return { passed: false, reasons };
        }
      } else {
        reasons.push("薪资格式未知");
        return { passed: false, reasons };
      }
    }

    const freshDaysLimit = Number(settings.freshDays) || 0;
    if (freshDaysLimit > 0 && typeof job.freshDays === "number" && job.freshDays > freshDaysLimit) {
      reasons.push(`发布/活跃时间(${job.freshDays}天前)超过限制(${freshDaysLimit}天)`);
      return { passed: false, reasons };
    }

    return { passed: true, reasons: ["符合全部筛选规则"] };
  }

  function decorateCard(job, evalResult) {
    if (!job.cardEl) return;
    try {
      let badge = job.cardEl.querySelector(".lptff-card-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "lptff-card-badge";
        job.cardEl.style.position = "relative";
        job.cardEl.prepend(badge);
      }

      const targetClass = evalResult.passed ? "lptff-card-badge lptff-badge-pass" : "lptff-card-badge lptff-badge-fail";
      const targetText = evalResult.passed ? "✓ 规则命中" : `✕ ${evalResult.reasons[0] || "已排除"}`;

      if (badge.className !== targetClass) badge.className = targetClass;
      if (badge.textContent !== targetText) badge.textContent = targetText;

      if (evalResult.passed) {
        if (job.cardEl.classList.contains("lptff-card-dimmed")) job.cardEl.classList.remove("lptff-card-dimmed");
        if (state.settings.highlightCards) job.cardEl.classList.add("lptff-card-highlighted");
        else job.cardEl.classList.remove("lptff-card-highlighted");
      } else {
        if (job.cardEl.classList.contains("lptff-card-highlighted")) job.cardEl.classList.remove("lptff-card-highlighted");
        if (state.settings.dimExcludedCards) job.cardEl.classList.add("lptff-card-dimmed");
        else job.cardEl.classList.remove("lptff-card-dimmed");
      }
    } catch (err) {
      recordRuntimeError("decorateCard", err);
    }
  }

  function clearBadgesAndHighlights() {
    try {
      document.querySelectorAll(".lptff-card-badge").forEach((el) => el.remove());
      document.querySelectorAll(".lptff-card-highlighted").forEach((el) => el.classList.remove("lptff-card-highlighted"));
      document.querySelectorAll(".lptff-card-dimmed").forEach((el) => el.classList.remove("lptff-card-dimmed"));
    } catch (err) {
      recordRuntimeError("clearBadgesAndHighlights", err);
    }
  }

  function scanJobsOnPage() {
    try {
      diagnostics.scanCount++;
      const rawElements = Array.from(
        document.querySelectorAll(
          '.job-card-box, .job-card-wrapper, .job-list-box li, .search-job-result li, .card-list li, [class*="job-card"], [class*="job-item"], a[href*="/job_detail/"]'
        )
      );

      const uniqueCards = Array.from(
        new Set(rawElements.map((el) => (el.tagName === 'A' ? findCard(el) : findCard(el) || el)).filter(Boolean))
      );
      diagnostics.cardsDetected = uniqueCards.length;

      // If master helper is disabled by user, clear badges & stop highlighting
      if (state.settings.enabled === false) {
        clearBadgesAndHighlights();
        state.jobsOnPage = [];
        diagnostics.parsedJobs = [];
        diagnostics.matchedJobs = [];
        diagnostics.excludedJobs = [];
        renderDockStats();
        return [];
      }

      const jobs = [];
      const seen = new Set();

      for (const card of uniqueCards) {
        const anchor = card.querySelector?.('a[href*="/job_detail/"]') || card.querySelector?.('a[href*="/web/geek/"]') || card.querySelector?.('a') || null;
        const job = extractJobFromCard(card, anchor);
        if (!job.title || seen.has(job.id)) continue;
        seen.add(job.id);
        const evalRes = evaluateJobRules(job, state.settings);
        job.evalResult = evalRes;
        decorateCard(job, evalRes);
        jobs.push(job);
      }

      state.jobsOnPage = jobs;
      diagnostics.parsedJobs = jobs;
      diagnostics.matchedJobs = jobs.filter((j) => j.evalResult?.passed);
      diagnostics.excludedJobs = jobs.filter((j) => !j.evalResult?.passed);
      diagnostics.dockMounted = !!document.querySelector("#lptff-boss-dock");
      diagnostics.floatToggleMounted = !!document.querySelector("#lptff-boss-float-toggle");
      diagnostics.activeTab = state.activeTab;

      renderDockStats();
      return jobs;
    } catch (err) {
      recordRuntimeError("scanJobsOnPage", err);
      return [];
    }
  }

  function renderGreeting(job, template) {
    const tpl = template || state.settings.greetingTemplate || DEFAULT_SETTINGS.greetingTemplate;
    const data = {
      jobName: job?.title || "",
      companyName: job?.companyName || "",
      salary: job?.salary || "",
      location: job?.location || "",
      experience: job?.experience || "",
      degree: job?.degree || "",
      bossName: job?.bossName || "",
      jobUrl: job?.jobUrl || "",
    };
    return String(tpl).replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? "");
  }

  // -------------------------------------------------------------
  // AI Calling & DeepSeek Integration
  // -------------------------------------------------------------
  async function requestAiCompletion(prompt, systemPrompt = "你是一个严谨的求职助手。") {
    const baseUrl = String(state.settings.apiBaseUrl || "").replace(/\/$/, "");
    const apiKey = String(state.settings.apiKey || "").trim();
    const model = String(state.settings.aiModel || "").trim();

    if (!baseUrl || !apiKey || !model) {
      throw new Error("请先在「AI」标签页完善 API Base URL、API Key 和模型名称。");
    }

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "BOSS_HELPER_AI_COMPLETION", prompt, systemPrompt }, (result) => {
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError) reject(new Error(runtimeError.message));
          else resolve(result);
        });
      });
      if (!response?.ok) throw new Error(response?.error || "AI 请求失败");
      return response.content || "";
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const txt = (await res.text()).slice(0, 300);
      throw new Error(`AI 请求失败 (HTTP ${res.status}): ${txt}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  async function aiEvaluateJob(job) {
    const prompt = `${state.settings.aiPromptFilter}\n\n【职位信息】\n职位：${job.title}\n公司：${job.companyName}\n薪资：${job.salary}\n地点：${job.location}\n经验学历：${job.experience} · ${job.degree}\nHR信息：${job.bossName}\n原始摘要：${job.rawText}`;
    return requestAiCompletion(prompt, "你是一个专业的招聘审查与求职风险评估助手。");
  }

  function parseAiScore(value) {
    const text = normalizeText(value);
    const match = text.match(/(?:匹配分数|匹配度|评分|score)\s*[:：]?\s*(\d{1,3})(?:\s*\/\s*100|\s*分)?/i)
      || text.match(/\b(\d{1,3})\s*\/\s*100\b/);
    if (!match) return null;
    const score = Number(match[1]);
    return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
  }

  async function aiGenerateGreeting(job) {
    const prompt = `${state.settings.aiPromptGreeting}\n\n【投递职位】\n职位：${job.title}\n公司：${job.companyName}\n薪资：${job.salary}\n地点：${job.location}\nHR：${job.bossName}\n职位详情摘要：${job.rawText}`;
    return requestAiCompletion(prompt, "你是一个精通简历匹配和求职打招呼的高效助手。");
  }

  // -------------------------------------------------------------
  // In-Page Chat Input Filler
  // -------------------------------------------------------------
  function getVisibleChatInput() {
    const candidates = [
      document.querySelector(".chat-input textarea"),
      document.querySelector(".chat-input [contenteditable='true']"),
      document.querySelector(".chat-input-box textarea"),
      document.querySelector(".chat-input-box [contenteditable='true']"),
      document.querySelector("[class*='chat'] [contenteditable='true']"),
      document.querySelector("[class*='chat'] textarea"),
      document.querySelector(".dialog-chat textarea"),
    ];
    return candidates.find((el) => el && typeof el.focus === "function" && el.offsetParent !== null) || null;
  }

  function fillChatInput(text) {
    const el = getVisibleChatInput();
    if (!el) return false;
    if (el.matches?.("[contenteditable='true']")) {
      el.focus();
      el.textContent = text;
      el.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertText", data: text }));
      return true;
    }
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // -------------------------------------------------------------
  // Auto-Runner Engine
  // -------------------------------------------------------------
  async function runBatchDelivery() {
    if (state.running) return;
    state.running = true;
    state.stopRequested = false;
    updateDockRunButton();

    await appendLog("info", "🚀 启动自动处理流水线", `今日已投递: ${state.daily.delivered}/${state.settings.dailyLimit}`);

    const jobs = scanJobsOnPage();
    const passedJobs = jobs.filter((j) => j.evalResult?.passed);
    state.progress = { current: 0, total: passedJobs.length };
    renderDockStats();

    if (!passedJobs.length) {
      await appendLog("warn", "当前页面未匹配到符合规则的职位", "请检查筛选配置或调整排除/包含词。");
      state.running = false;
      updateDockRunButton();
      return;
    }

    let processedCount = 0;
    const maxBatch = Math.min(passedJobs.length, Number(state.settings.maxBatchCount) || 15);

    for (let i = 0; i < maxBatch; i++) {
      if (state.stopRequested) {
        await appendLog("warn", "⚠️ 自动流水线已由用户手动停止");
        break;
      }

      if (state.daily.delivered >= Number(state.settings.dailyLimit || 120)) {
        await appendLog("warn", "⚠️ 今日投递量已达安全上限", `已达到上限 ${state.settings.dailyLimit} 条，停止自动投递。`);
        break;
      }

      const job = passedJobs[i];
      state.progress.current = i + 1;
      state.daily.scanned += 1;
      await storageSet({ [STORAGE_DAILY_KEY]: state.daily });
      renderDockStats();

      await appendLog("info", `[${i + 1}/${maxBatch}] 正在处理职位: ${job.title} / ${job.companyName}`);

      // Optional AI Filter Check
      if (state.settings.aiFilterEnabled && state.settings.apiKey) {
        try {
          const aiAnalysis = await aiEvaluateJob(job);
          await appendLog("info", `AI 评估完成 (${job.title})`, aiAnalysis.slice(0, 150));
          const aiScore = parseAiScore(aiAnalysis);
          const minimumScore = Number(state.settings.aiMinScore) || DEFAULT_SETTINGS.aiMinScore;
          if (aiScore === null) {
            await appendLog("warn", `AI 评估未返回可识别分数，已跳过: ${job.title}`);
            continue;
          }
          if (aiScore < minimumScore) {
            await appendLog("warn", `AI 评分 ${aiScore} 低于阈值 ${minimumScore}，已跳过: ${job.title}`);
            continue;
          }
        } catch (err) {
          await appendLog("warn", `AI 评估失败，已跳过 (${job.title})`, err.message);
          continue;
        }
      }

      // Generate Greeting Text
      let greetingText = renderGreeting(job);
      if (state.settings.aiGreetingEnabled && state.settings.apiKey) {
        try {
          const aiGreeting = await aiGenerateGreeting(job);
          if (aiGreeting) greetingText = aiGreeting.trim();
          await appendLog("info", `AI 招呼语生成成功`, greetingText);
        } catch (err) {
          await appendLog("warn", `AI 招呼语生成失败，降级为模板`, err.message);
        }
      }

      // Click chat button if present
      const chatBtn =
        job.cardEl?.querySelector(".start-chat-btn") ||
        job.cardEl?.querySelector(".chat-btn") ||
        job.cardEl?.querySelector(".btn-startchat") ||
        job.cardEl?.querySelector(".btn-sure-action") ||
        job.cardEl?.querySelector("[class*='chat-btn']");

      let communicationStarted = false;
      if (chatBtn && chatBtn.tagName !== "A") {
        chatBtn.click();
        communicationStarted = true;
        await sleep(1000);
      }

      // Try filling greeting into input
      const filled = fillChatInput(greetingText);
      if (filled) {
        await appendLog("info", `✓ 已填入招呼语: ${job.title}`, greetingText);
      }

      if (!communicationStarted) {
        await appendLog("warn", `未找到可用的沟通按钮，未计为投递: ${job.title}`);
        continue;
      }

      // 只有实际触发沟通动作后才更新投递数；仅扫描或填充文本不算投递。
      state.daily.delivered += 1;
      await storageSet({ [STORAGE_DAILY_KEY]: state.daily });

      processedCount++;
      renderDockStats();

      // 控制批处理节奏，避免连续操作超过用户配置的速率。
      if (i < maxBatch - 1 && !state.stopRequested) {
        const delaySec = Math.floor(Math.random() * (state.settings.delayMax - state.settings.delayMin + 1) + state.settings.delayMin);
        await appendLog("info", `⏳ 等待安全间隔 ${delaySec} 秒...`);
        await sleep(delaySec * 1000);
      }
    }

    state.running = false;
    updateDockRunButton();
    await appendLog("info", `🎉 本批次处理结束，共完成 ${processedCount} 个职位。`);
  }

  function stopBatchDelivery() {
    if (!state.running) return;
    state.stopRequested = true;
    updateDockRunButton();
  }

  // -------------------------------------------------------------
  // In-Page Dock UI Builder & Styles
  // -------------------------------------------------------------
  function injectDockStyles() {
    if (document.querySelector("#lptff-boss-dock-styles")) return;
    const style = document.createElement("style");
    style.id = "lptff-boss-dock-styles";
    style.textContent = `
      #lptff-boss-dock {
        position: fixed;
        top: 12px;
        right: 16px;
        width: 480px;
        max-height: 90vh;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
        font-size: 13px;
        color: #303133;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.25s ease, opacity 0.25s ease;
      }
      #lptff-boss-dock.minimized {
        transform: translateY(-110%);
        opacity: 0;
        pointer-events: none;
      }
      .lptff-dock-header {
        padding: 12px 14px;
        background: #fafbfc;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .lptff-dock-title-group {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .lptff-dock-title {
        font-size: 15px;
        font-weight: 700;
        color: #00b38a;
      }
      .lptff-dock-meta {
        font-size: 12px;
        color: #909399;
      }
      .lptff-dock-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .lptff-btn {
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        border: 1px solid transparent;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .lptff-btn-primary { background: #00b38a; color: #fff; border-color: #00b38a; }
      .lptff-btn-primary:hover { background: #009875; }
      .lptff-btn-danger { background: #f56c6c; color: #fff; }
      .lptff-btn-default { background: #fff; color: #606266; border-color: #dcdfe6; }
      .lptff-btn-default:hover { border-color: #00b38a; color: #00b38a; }
      .lptff-btn-icon { padding: 4px; background: transparent; color: #909399; border: 0; cursor: pointer; }
      .lptff-btn-icon:hover { color: #303133; }
      
      .lptff-btn-toggle {
        font-size: 11.5px;
        padding: 4px 10px;
        border-radius: 14px;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
      }
      .lptff-btn-toggle.enabled {
        background: #f0f9eb;
        color: #529b2e;
        border: 1px solid #c2e7b0;
      }
      .lptff-btn-toggle.enabled:hover {
        background: #e1f3d8;
      }
      .lptff-btn-toggle.disabled {
        background: #f4f4f5;
        color: #909399;
        border: 1px solid #d3d4d6;
      }
      .lptff-btn-toggle.disabled:hover {
        background: #e9e9eb;
      }
      #lptff-boss-float-toggle.disabled {
        background: #909399 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      }

      .lptff-dock-nav {
        display: flex;
        background: #fff;
        border-bottom: 1px solid #ebeef5;
        padding: 0 10px;
      }
      .lptff-nav-tab {
        padding: 9px 12px;
        font-size: 13px;
        color: #606266;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      .lptff-nav-tab.active {
        color: #00b38a;
        border-bottom-color: #00b38a;
        font-weight: 600;
      }

      .lptff-alert-banner {
        padding: 8px 12px;
        background: #fdf6ec;
        color: #e6a23c;
        font-size: 11.5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #faecd8;
      }
      .lptff-progress-bar-container {
        height: 4px;
        background: #ebeef5;
        width: 100%;
        overflow: hidden;
      }
      .lptff-progress-bar-fill {
        height: 100%;
        background: #00b38a;
        width: 0%;
        transition: width 0.3s ease;
      }

      .lptff-dock-body {
        padding: 14px;
        overflow-y: auto;
        max-height: calc(90vh - 150px);
      }
      .lptff-tab-panel { display: none; }
      .lptff-tab-panel.active { display: block; }

      /* Stats Grid */
      .lptff-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
      .lptff-stat-box {
        background: #f8fafc;
        border: 1px solid #eef2f7;
        border-radius: 8px;
        padding: 8px;
        text-align: center;
      }
      .lptff-stat-box span { font-size: 11px; color: #909399; display: block; }
      .lptff-stat-box strong { font-size: 15px; color: #303133; margin-top: 2px; display: block; }

      /* Forms and Rules */
      .lptff-rule-group {
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
      }
      .lptff-rule-group-title {
        font-weight: 600;
        font-size: 12.5px;
        color: #303133;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
      }
      .lptff-rule-row {
        display: grid;
        grid-template-columns: 24px 76px 1fr;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }
      .lptff-mode-tag {
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        user-select: none;
      }
      .lptff-mode-tag.exclude { background: #fef0f0; color: #f56c6c; border: 1px solid #fbc4c4; }
      .lptff-mode-tag.include { background: #f0f9eb; color: #67c23a; border: 1px solid #c2e7b0; }
      .lptff-input {
        padding: 6px 8px;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        font-size: 12px;
        width: 100%;
        box-sizing: border-box;
      }
      .lptff-input:focus { border-color: #00b38a; outline: none; }
      .lptff-checkbox-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 12px;
        color: #606266;
      }
      .lptff-checkbox-row label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }

      /* Pill tags */
      .lptff-pill-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
      .lptff-pill { padding: 4px 8px; border-radius: 12px; background: #f0f2f5; font-size: 11px; cursor: pointer; }
      .lptff-pill:hover { background: #e6f7f3; color: #00b38a; }

      /* Floating Button */
      #lptff-boss-float-toggle {
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #00b38a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 179, 138, 0.4);
        cursor: pointer;
        z-index: 999998;
        font-weight: bold;
        font-size: 18px;
        transition: transform 0.2s ease;
      }
      #lptff-boss-float-toggle:hover { transform: scale(1.08); }

      /* In-Card Highlighting & Badging */
      .lptff-card-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 500;
        z-index: 10;
        pointer-events: none;
      }
      .lptff-badge-pass { background: #f0f9eb; color: #67c23a; border: 1px solid #c2e7b0; }
      .lptff-badge-fail { background: #fef0f0; color: #f56c6c; border: 1px solid #fbc4c4; }
      .lptff-card-highlighted { outline: 2px solid #00b38a !important; background: rgba(0, 179, 138, 0.02) !important; }
      .lptff-card-dimmed { opacity: 0.45 !important; filter: grayscale(40%); }

      /* Logs list */
      .lptff-logs-container {
        max-height: 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .lptff-log-item {
        padding: 6px 8px;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #ebeef5;
        font-size: 11.5px;
      }
      .lptff-log-info { border-left: 3px solid #00b38a; }
      .lptff-log-warn { border-left: 3px solid #e6a23c; }
      .lptff-log-error { border-left: 3px solid #f56c6c; }
    `;
    document.head.appendChild(style);
  }

  function createDockHtml() {
    if (document.querySelector("#lptff-boss-dock")) return;
    const el = document.createElement("div");
    el.id = "lptff-boss-dock";
    el.innerHTML = `
      <div class="lptff-dock-header">
        <div class="lptff-dock-title-group">
          <span class="lptff-dock-title">Boss-Helper</span>
          <span class="lptff-dock-meta">v3.15.0 · 今日投递: <strong id="lptff-today-count">0</strong>/<span id="lptff-limit-count">120</span></span>
        </div>
        <div class="lptff-dock-actions">
          <button id="lptff-master-toggle" class="lptff-btn lptff-btn-toggle enabled" title="点击开启或关闭 BOSS 直聘助手全部功能">🟢 助手已开启</button>
          <button id="lptff-run-btn" class="lptff-btn lptff-btn-primary">开始</button>
          <button id="lptff-close-btn" class="lptff-btn-icon" title="收起面板">✕</button>
        </div>
      </div>

      <div class="lptff-progress-bar-container">
        <div id="lptff-progress-fill" class="lptff-progress-bar-fill"></div>
      </div>

      <div class="lptff-dock-nav">
        <div class="lptff-nav-tab active" data-tab="stats">统计</div>
        <div class="lptff-nav-tab" data-tab="filter">筛选</div>
        <div class="lptff-nav-tab" data-tab="config">配置</div>
        <div class="lptff-nav-tab" data-tab="ai">AI</div>
        <div class="lptff-nav-tab" data-tab="logs">日志</div>
        <div class="lptff-nav-tab" data-tab="help">帮助</div>
      </div>

      <div id="lptff-alert-box" class="lptff-alert-banner">
        <span>数据由本地实时分析，建议每日投递 120-140，安全间隔 3-8 秒</span>
        <button id="lptff-alert-close" class="lptff-btn-icon" style="font-size:11px;">✕</button>
      </div>

      <div class="lptff-dock-body">
        <!-- Tab 1: 统计 -->
        <div class="lptff-tab-panel active" id="lptff-tab-stats">
          <div class="lptff-stats-grid">
            <div class="lptff-stat-box"><span>今日投递</span><strong id="stat-delivered">0</strong></div>
            <div class="lptff-stat-box"><span>页面总数</span><strong id="stat-page-total">0</strong></div>
            <div class="lptff-stat-box"><span>规则命中</span><strong id="stat-matched" style="color:#00b38a;">0</strong></div>
            <div class="lptff-stat-box"><span>规则排除</span><strong id="stat-excluded" style="color:#f56c6c;">0</strong></div>
          </div>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <button id="lptff-btn-rescan" class="lptff-btn lptff-btn-default">重新扫描页面</button>
            <button id="lptff-btn-clear-daily" class="lptff-btn lptff-btn-default">清空今日统计</button>
          </div>
        </div>

        <!-- Tab 2: 筛选 -->
        <div class="lptff-tab-panel" id="lptff-tab-filter">
          <div style="font-size:12px; color:#606266; margin-bottom:8px;">推荐快捷岗位标签（点击填入搜索）：</div>
          <div class="lptff-pill-tags">
            <span class="lptff-pill" data-kw="前端开发工程师">前端开发工程师</span>
            <span class="lptff-pill" data-kw="Vue / React 专家">Vue / React 专家</span>
            <span class="lptff-pill" data-kw="后端架构师 (Go/Java)">后端架构师 (Go/Java)</span>
            <span class="lptff-pill" data-kw="大模型算法工程师">大模型算法工程师</span>
            <span class="lptff-pill" data-kw="高级产品经理">高级产品经理</span>
          </div>
          <div class="lptff-checkbox-row" style="margin-top:12px;">
            <label><input type="checkbox" id="lptff-chk-highlight" checked> 高亮符合条件的卡片</label>
            <label><input type="checkbox" id="lptff-chk-dim" checked> 虚化不符合条件的卡片</label>
          </div>
        </div>

        <!-- Tab 3: 配置 -->
        <div class="lptff-tab-panel" id="lptff-tab-config">
          <div class="lptff-rule-group">
            <div class="lptff-rule-group-title">
              <span>筛选规则（打勾启用，标签点击切换 排除 / 包含）</span>
            </div>

            <!-- 公司名 -->
            <div class="lptff-rule-row">
              <input type="checkbox" id="chk-company">
              <span class="lptff-mode-tag exclude" id="tag-company" data-target="companyRule">排除</span>
              <input class="lptff-input" id="inp-company" placeholder="公司名 (逗号或换行分隔)">
            </div>

            <!-- 岗位名 -->
            <div class="lptff-rule-row">
              <input type="checkbox" id="chk-title">
              <span class="lptff-mode-tag include" id="tag-title" data-target="titleRule">包含</span>
              <input class="lptff-input" id="inp-title" placeholder="岗位名 (如 前端, Vue, React)">
            </div>

            <!-- 描述/内容 -->
            <div class="lptff-rule-row">
              <input type="checkbox" id="chk-desc">
              <span class="lptff-mode-tag exclude" id="tag-desc" data-target="descRule">排除</span>
              <input class="lptff-input" id="inp-desc" placeholder="工作内容 / 技能排除词">
            </div>

            <!-- HR职位 -->
            <div class="lptff-rule-row">
              <input type="checkbox" id="chk-boss">
              <span class="lptff-mode-tag include" id="tag-boss" data-target="bossRule">包含</span>
              <input class="lptff-input" id="inp-boss" placeholder="HR职位 (如 技术总监, 负责人)">
            </div>

            <div class="lptff-checkbox-row">
              <label><input type="checkbox" id="chk-headhunter"> 猎头过滤</label>
              <label><input type="checkbox" id="chk-chatted" checked> 好友过滤(已聊/已沟通)</label>
              <label><input type="checkbox" id="chk-gold"> 过滤金牌面试官</label>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:10px;">
              <label style="font-size:11.5px; color:#606266;">最低薪资(K)
                <input class="lptff-input" id="inp-salary-min" placeholder="如 15">
              </label>
              <label style="font-size:11.5px; color:#606266;">最高薪资(K)
                <input class="lptff-input" id="inp-salary-max" placeholder="如 40">
              </label>
              <label style="font-size:11.5px; color:#606266;">新鲜天数(天)
                <input class="lptff-input" id="inp-fresh-days" placeholder="如 7">
              </label>
            </div>
          </div>

          <div class="lptff-rule-group">
            <div class="lptff-rule-group-title">
              <span>运行与预设</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
              <select class="lptff-input" id="sel-preset" style="flex:1;"></select>
              <button id="btn-apply-preset" class="lptff-btn lptff-btn-default">应用预设</button>
            </div>
            <div style="display:flex; gap:8px;">
              <button id="btn-save-config" class="lptff-btn lptff-btn-primary">保存配置</button>
              <button id="btn-reset-config" class="lptff-btn lptff-btn-default">恢复默认</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: AI -->
        <div class="lptff-tab-panel" id="lptff-tab-ai">
          <div class="lptff-rule-group">
            <div class="lptff-rule-group-title"><span>AI 功能开关 (支持 DeepSeek-R1 / V3)</span></div>
            <div class="lptff-checkbox-row">
              <label><input type="checkbox" id="chk-ai-greeting"> AI 智能招呼语生成</label>
              <label><input type="checkbox" id="chk-ai-filter"> AI 岗位质量与风险分析</label>
            </div>
          </div>

          <div class="lptff-rule-group">
            <div class="lptff-rule-group-title"><span>API 与模型配置</span></div>
            <div style="display:grid; gap:8px;">
              <label style="font-size:11.5px; color:#606266;">API Base URL
                <input class="lptff-input" id="inp-ai-url" placeholder="https://api.deepseek.com/v1">
              </label>
              <label style="font-size:11.5px; color:#606266;">模型名称 (如 deepseek-reasoner, deepseek-chat)
                <input class="lptff-input" id="inp-ai-model" placeholder="deepseek-reasoner">
              </label>
              <label style="font-size:11.5px; color:#606266;">AI 最低匹配分数 (0-100)
                <input class="lptff-input" id="inp-ai-min-score" type="number" min="0" max="100" placeholder="70">
              </label>
              <label style="font-size:11.5px; color:#606266;">API Key
                <input class="lptff-input" id="inp-ai-key" type="password" placeholder="请在扩展弹窗中配置" disabled>
              </label>
              <label style="font-size:11.5px; color:#606266;">打招呼 Prompt 模板
                <textarea class="lptff-input" id="inp-ai-greeting-prompt" rows="3"></textarea>
              </label>
            </div>
            <div style="margin-top:10px;">
              <button id="btn-save-ai" class="lptff-btn lptff-btn-primary">保存 AI 配置</button>
            </div>
          </div>
        </div>

        <!-- Tab 5: 日志 -->
        <div class="lptff-tab-panel" id="lptff-tab-logs">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <select id="sel-log-level" class="lptff-input" style="width:100px;">
              <option value="all">全部级别</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
            <button id="btn-clear-logs" class="lptff-btn lptff-btn-default">清空日志</button>
          </div>
          <div id="lptff-dock-logs" class="lptff-logs-container"></div>
        </div>

        <!-- Tab 6: 帮助 -->
        <div class="lptff-tab-panel" id="lptff-tab-help">
          <div style="font-size:12.5px; line-height:1.6; color:#606266;">
            <strong>使用说明与最佳实践：</strong>
            <p>1. <strong>打钩生效</strong>：所有规则项必须勾选左侧复选框后才会生效；</p>
            <p>2. <strong>排除与包含</strong>：点击「排除」/「包含」彩色标签可快速切换规则匹配模式；</p>
            <p>3. <strong>安全间隔</strong>：流水线自动内置 3-6 秒随机延时，严格遵守求职平台规范；</p>
            <p>4. <strong>数据安全</strong>：所有配置、岗位统计与 API Key 均只保存在本地 Chrome 存储中。</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    diagnostics.dockMounted = true;

    // Floating toggle button
    if (!document.querySelector("#lptff-boss-float-toggle")) {
      const toggleBtn = document.createElement("div");
      toggleBtn.id = "lptff-boss-float-toggle";
      toggleBtn.title = "打开 / 收起 Boss-Helper 工作台";
      toggleBtn.textContent = "💼";
      document.body.appendChild(toggleBtn);
      diagnostics.floatToggleMounted = true;
    }
  }

  function renderDockStats() {
    try {
      const todayDeliveredEl = document.querySelector("#lptff-today-count");
      const statDeliveredEl = document.querySelector("#stat-delivered");
      const statTotalEl = document.querySelector("#stat-page-total");
      const statMatchedEl = document.querySelector("#stat-matched");
      const statExcludedEl = document.querySelector("#stat-excluded");
      const progressFillEl = document.querySelector("#lptff-progress-fill");

      const matched = state.jobsOnPage.filter((j) => j.evalResult?.passed).length;
      const excluded = state.jobsOnPage.length - matched;

      if (todayDeliveredEl) todayDeliveredEl.textContent = String(state.daily.delivered);
      if (statDeliveredEl) statDeliveredEl.textContent = String(state.daily.delivered);
      if (statTotalEl) statTotalEl.textContent = String(state.jobsOnPage.length);
      if (statMatchedEl) statMatchedEl.textContent = String(matched);
      if (statExcludedEl) statExcludedEl.textContent = String(excluded);

      if (progressFillEl && state.progress.total > 0) {
        const pct = Math.round((state.progress.current / state.progress.total) * 100);
        progressFillEl.style.width = `${pct}%`;
      }
    } catch (err) {
      recordRuntimeError("renderDockStats", err);
    }
  }

  function renderDockLogs() {
    try {
      const container = document.querySelector("#lptff-dock-logs");
      if (!container) return;
      const level = document.querySelector("#sel-log-level")?.value || "all";
      const filtered = (state.logs || []).filter((l) => level === "all" || l.level === level);

      if (!filtered.length) {
        container.innerHTML = '<div class="lptff-log-item">暂无日志</div>';
        return;
      }

      container.innerHTML = filtered
        .slice(0, 50)
        .map(
          (l) => `
          <div class="lptff-log-item lptff-log-${l.level}">
            <strong>[${escapeHtml(l.level)}]</strong> <span style="color:#909399;">${escapeHtml(new Date(l.time).toLocaleTimeString())}</span>
            <div>${escapeHtml(l.message)}</div>
            ${l.detail ? `<div style="color:#909399; margin-top:2px;">${escapeHtml(l.detail)}</div>` : ""}
          </div>
        `,
        )
        .join("");
    } catch (err) {
      recordRuntimeError("renderDockLogs", err);
    }
  }

  function updateDockRunButton() {
    try {
      const btn = document.querySelector("#lptff-run-btn");
      if (!btn) return;
      if (state.running) {
        btn.textContent = "停止";
        btn.className = "lptff-btn lptff-btn-danger";
      } else {
        btn.textContent = "开始";
        btn.className = "lptff-btn lptff-btn-primary";
      }
    } catch (err) {
      recordRuntimeError("updateDockRunButton", err);
    }
  }

  function updateMasterToggleUI() {
    try {
      const isEnabled = state.settings.enabled !== false;
      const toggleBtn = document.querySelector("#lptff-master-toggle");
      const floatToggle = document.querySelector("#lptff-boss-float-toggle");
      const runBtn = document.querySelector("#lptff-run-btn");

      if (toggleBtn) {
        toggleBtn.textContent = isEnabled ? "🟢 助手已开启" : "⚪ 助手已关闭";
        toggleBtn.className = `lptff-btn lptff-btn-toggle ${isEnabled ? "enabled" : "disabled"}`;
        toggleBtn.title = isEnabled ? "点击关闭 BOSS 助手功能" : "点击开启 BOSS 助手功能";
      }

      if (floatToggle) {
        floatToggle.textContent = isEnabled ? "💼" : "⏻";
        floatToggle.className = isEnabled ? "enabled" : "disabled";
        floatToggle.title = isEnabled ? "打开 / 收起 Boss-Helper 工作台 (已开启)" : "打开 / 收起 Boss-Helper 工作台 (已关闭)";
      }

      if (runBtn) {
        runBtn.disabled = !isEnabled;
        if (!isEnabled && state.running) {
          stopBatchDelivery();
        }
      }
    } catch (err) {
      recordRuntimeError("updateMasterToggleUI", err);
    }
  }

  function populateInputsFromSettings() {
    try {
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
        el.className = `lptff-mode-tag ${mode}`;
      };

      setChk("#chk-company", s.companyRule?.enabled);
      setTag("#tag-company", s.companyRule?.mode || "exclude");
      setVal("#inp-company", s.companyRule?.text);

      setChk("#chk-title", s.titleRule?.enabled);
      setTag("#tag-title", s.titleRule?.mode || "include");
      setVal("#inp-title", s.titleRule?.text);

      setChk("#chk-desc", s.descRule?.enabled);
      setTag("#tag-desc", s.descRule?.mode || "exclude");
      setVal("#inp-desc", s.descRule?.text);

      setChk("#chk-boss", s.bossRule?.enabled);
      setTag("#tag-boss", s.bossRule?.mode || "include");
      setVal("#inp-boss", s.bossRule?.text);

      setChk("#chk-headhunter", s.filterHeadhunter);
      setChk("#chk-chatted", s.filterChatted);
      setChk("#chk-gold", s.filterGoldInterviewer);
      setChk("#lptff-chk-highlight", s.highlightCards);
      setChk("#lptff-chk-dim", s.dimExcludedCards);
      setVal("#inp-salary-min", s.salaryMin);
      setVal("#inp-salary-max", s.salaryMax);
      setVal("#inp-fresh-days", s.freshDays);

      setChk("#chk-ai-greeting", s.aiGreetingEnabled);
      setChk("#chk-ai-filter", s.aiFilterEnabled);
      setVal("#inp-ai-url", s.apiBaseUrl);
      setVal("#inp-ai-model", s.aiModel);
      setVal("#inp-ai-min-score", s.aiMinScore);
      setVal("#inp-ai-greeting-prompt", s.aiPromptGreeting);

      // Preset select
      const selPreset = document.querySelector("#sel-preset");
      if (selPreset) {
        selPreset.innerHTML = state.presets.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
      }
    } catch (err) {
      recordRuntimeError("populateInputsFromSettings", err);
    }
  }

  function readSettingsFromInputs() {
    try {
      const s = state.settings;
      const getVal = (id) => document.querySelector(id)?.value ?? "";
      const getChk = (id) => Boolean(document.querySelector(id)?.checked);
      const getTagMode = (id) => (document.querySelector(id)?.textContent === "包含" ? "include" : "exclude");

      s.companyRule = { enabled: getChk("#chk-company"), mode: getTagMode("#tag-company"), text: getVal("#inp-company") };
      s.titleRule = { enabled: getChk("#chk-title"), mode: getTagMode("#tag-title"), text: getVal("#inp-title") };
      s.descRule = { enabled: getChk("#chk-desc"), mode: getTagMode("#tag-desc"), text: getVal("#inp-desc") };
      s.bossRule = { enabled: getChk("#chk-boss"), mode: getTagMode("#tag-boss"), text: getVal("#inp-boss") };

      s.filterHeadhunter = getChk("#chk-headhunter");
      s.filterChatted = getChk("#chk-chatted");
      s.filterGoldInterviewer = getChk("#chk-gold");
      s.highlightCards = getChk("#lptff-chk-highlight");
      s.dimExcludedCards = getChk("#lptff-chk-dim");
      s.salaryMin = getVal("#inp-salary-min");
      s.salaryMax = getVal("#inp-salary-max");
      s.freshDays = getVal("#inp-fresh-days");

      s.aiGreetingEnabled = getChk("#chk-ai-greeting");
      s.aiFilterEnabled = getChk("#chk-ai-filter");
      s.apiBaseUrl = getVal("#inp-ai-url");
      s.aiModel = getVal("#inp-ai-model");
      const aiMinScoreRaw = getVal("#inp-ai-min-score").trim();
      const aiMinScore = Number(aiMinScoreRaw);
      s.aiMinScore = aiMinScoreRaw && Number.isFinite(aiMinScore) ? Math.min(100, Math.max(0, aiMinScore)) : DEFAULT_SETTINGS.aiMinScore;
      s.aiPromptGreeting = getVal("#inp-ai-greeting-prompt");
    } catch (err) {
      recordRuntimeError("readSettingsFromInputs", err);
    }
  }

  function bindDockEvents() {
    try {
      // Nav tabs
      document.querySelectorAll(".lptff-nav-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".lptff-nav-tab").forEach((t) => t.classList.remove("active"));
          document.querySelectorAll(".lptff-tab-panel").forEach((p) => p.classList.remove("active"));
          tab.classList.add("active");
          const tabName = tab.dataset.tab;
          state.activeTab = tabName;
          diagnostics.activeTab = tabName;
          const panel = document.querySelector(`#lptff-tab-${tabName}`);
          if (panel) panel.classList.add("active");
        });
      });

      // Tag mode toggles
      document.querySelectorAll(".lptff-mode-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          const isInclude = tag.classList.contains("include");
          tag.classList.toggle("include", !isInclude);
          tag.classList.toggle("exclude", isInclude);
          tag.textContent = isInclude ? "排除" : "包含";
          scanJobsOnPage();
        });
      });

      // Quick pills
      document.querySelectorAll(".lptff-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
          const kw = pill.dataset.kw;
          const inp = document.querySelector(".search-input-box input") || document.querySelector("input[placeholder*='搜索']");
          if (inp) {
            inp.value = kw;
            inp.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      });

      // Toggle / close
      const dockEl = document.querySelector("#lptff-boss-dock");
      document.querySelector("#lptff-close-btn")?.addEventListener("click", () => {
        dockEl?.classList.add("minimized");
      });
      document.querySelector("#lptff-boss-float-toggle")?.addEventListener("click", () => {
        dockEl?.classList.toggle("minimized");
      });
      document.querySelector("#lptff-alert-close")?.addEventListener("click", () => {
        const banner = document.querySelector("#lptff-alert-box");
        if (banner) banner.style.display = "none";
      });

      // Master switch toggle button
      document.querySelector("#lptff-master-toggle")?.addEventListener("click", async () => {
        state.settings.enabled = !(state.settings.enabled !== false);
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        updateMasterToggleUI();
        if (state.settings.enabled) {
          await appendLog("info", "🟢 BOSS 助手功能已手动开启", "已恢复卡片实时识别与规则标记。");
          scanJobsOnPage();
        } else {
          await appendLog("warn", "⚪ BOSS 助手功能已手动关闭", "已清除页面所有规则徽章和高亮。");
          clearBadgesAndHighlights();
          scanJobsOnPage();
        }
      });

      // Action buttons
      document.querySelector("#lptff-run-btn")?.addEventListener("click", () => {
        if (state.running) stopBatchDelivery();
        else runBatchDelivery();
      });
      document.querySelector("#lptff-btn-rescan")?.addEventListener("click", () => {
        scanJobsOnPage();
      });
      document.querySelector("#lptff-btn-clear-daily")?.addEventListener("click", async () => {
        state.daily = { date: dayKey(), delivered: 0, scanned: 0 };
        await storageSet({ [STORAGE_DAILY_KEY]: state.daily });
        renderDockStats();
        await appendLog("info", "已清空今日投递统计");
      });
      document.querySelector("#btn-save-config")?.addEventListener("click", async () => {
        readSettingsFromInputs();
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        scanJobsOnPage();
        await appendLog("info", "筛选与运行配置已保存");
      });
      document.querySelector("#btn-reset-config")?.addEventListener("click", async () => {
        state.settings = {
          ...DEFAULT_SETTINGS,
          companyRule: { ...DEFAULT_SETTINGS.companyRule },
          titleRule: { ...DEFAULT_SETTINGS.titleRule },
          descRule: { ...DEFAULT_SETTINGS.descRule },
          bossRule: { ...DEFAULT_SETTINGS.bossRule },
        };
        populateInputsFromSettings();
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        scanJobsOnPage();
        await appendLog("info", "已恢复默认配置");
      });
      document.querySelector("#btn-save-ai")?.addEventListener("click", async () => {
        readSettingsFromInputs();
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        await appendLog("info", "AI 配置已保存");
      });
      document.querySelector("#btn-apply-preset")?.addEventListener("click", () => {
        const presetId = document.querySelector("#sel-preset")?.value;
        const p = state.presets.find((x) => x.id === presetId);
        if (p) {
          state.settings = { ...state.settings, ...p.settings };
          populateInputsFromSettings();
          scanJobsOnPage();
          appendLog("info", `已应用预设: ${p.name}`);
        }
      });
      document.querySelector("#btn-clear-logs")?.addEventListener("click", async () => {
        state.logs = [];
        await storageSet({ [STORAGE_LOGS_KEY]: [] });
        renderDockLogs();
      });
      document.querySelector("#sel-log-level")?.addEventListener("change", renderDockLogs);

      // Live inputs trigger rescan
      const triggerRescan = () => {
        readSettingsFromInputs();
        scanJobsOnPage();
      };
      ["#inp-company", "#inp-title", "#inp-desc", "#inp-boss", "#inp-salary-min", "#inp-salary-max", "#inp-fresh-days"].forEach((id) => {
        document.querySelector(id)?.addEventListener("input", triggerRescan);
      });
      ["#chk-company", "#chk-title", "#chk-desc", "#chk-boss", "#chk-headhunter", "#chk-chatted", "#chk-gold", "#lptff-chk-highlight", "#lptff-chk-dim"].forEach((id) => {
        document.querySelector(id)?.addEventListener("change", triggerRescan);
      });
    } catch (err) {
      recordRuntimeError("bindDockEvents", err);
    }
  }

  // -------------------------------------------------------------
  // Content Script Initialization
  // -------------------------------------------------------------
  async function initContentScript() {
    try {
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

      injectDockStyles();
      createDockHtml();
      populateInputsFromSettings();
      bindDockEvents();
      updateMasterToggleUI();
      renderDockStats();
      renderDockLogs();

      // Multi-stage scans for SPA async rendering
      setTimeout(() => scanJobsOnPage(), 500);
      setTimeout(() => scanJobsOnPage(), 1500);
      setTimeout(() => scanJobsOnPage(), 3000);

      // MutationObserver to rescan on DOM changes (e.g. infinite scroll or page change)
      let debounceTimer = null;
      const observer = new MutationObserver((mutations) => {
        if (state.running) return;
        const isExternal = mutations.some((m) => {
          const target = m.target;
          if (target instanceof HTMLElement && (target.closest("#lptff-boss-dock") || target.classList?.contains("lptff-card-badge"))) {
            return false;
          }
          return true;
        });
        if (!isExternal) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          scanJobsOnPage();
        }, 400);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      diagnostics.mutationObserverActive = true;
    } catch (err) {
      recordRuntimeError("initContentScript", err);
    }
  }

  // Message listener for popup/extension communication
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message !== "object") return undefined;

      if (message.type === "BOSS_HELPER_TOGGLE_ENABLED") {
        (async () => {
          state.settings.enabled = message.enabled !== undefined ? Boolean(message.enabled) : !(state.settings.enabled !== false);
          await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
          updateMasterToggleUI();
          if (state.settings.enabled) {
            await appendLog("info", "🟢 BOSS 助手功能已由 Popup 开启");
            scanJobsOnPage();
          } else {
            await appendLog("warn", "⚪ BOSS 助手功能已由 Popup 关闭");
            clearBadgesAndHighlights();
            scanJobsOnPage();
          }
          sendResponse({ ok: true, enabled: state.settings.enabled });
        })();
        return true;
      }

      if (message.type === "BOSS_HELPER_GET_STATE") {
        const jobs = scanJobsOnPage();
        sendResponse({
          ok: true,
          url: globalThis.location?.href || "",
          allJobs: jobs,
          jobs: jobs.filter((j) => j.evalResult?.passed),
          daily: state.daily,
          settings: state.settings,
        });
        return true;
      }

      if (message.type === "BOSS_HELPER_FILL_GREETING") {
        const job = state.jobsOnPage.find((j) => j.id === message.jobId) || state.jobsOnPage[0];
        const text = renderGreeting(job, message.template);
        const filled = fillChatInput(text);
        sendResponse({ ok: filled, text });
        return true;
      }

      if (message.type === "BOSS_HELPER_START_RUN") {
        runBatchDelivery();
        sendResponse({ ok: true });
        return true;
      }

      if (message.type === "BOSS_HELPER_STOP_RUN") {
        stopBatchDelivery();
        sendResponse({ ok: true });
        return true;
      }

      return undefined;
    });
  }

  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes[STORAGE_SETTINGS_KEY]?.newValue) {
        state.settings = { ...DEFAULT_SETTINGS, ...changes[STORAGE_SETTINGS_KEY].newValue };
        populateInputsFromSettings();
        updateMasterToggleUI();
        scanJobsOnPage();
      }
      if (changes[STORAGE_PRESETS_KEY]) {
        const userPresets = Array.isArray(changes[STORAGE_PRESETS_KEY].newValue) ? changes[STORAGE_PRESETS_KEY].newValue : [];
        state.presets = [...BUILTIN_PRESETS, ...userPresets];
        populateInputsFromSettings();
      }
      if (changes[STORAGE_LOGS_KEY]) {
        state.logs = Array.isArray(changes[STORAGE_LOGS_KEY].newValue) ? changes[STORAGE_LOGS_KEY].newValue : [];
        renderDockLogs();
      }
      if (changes[STORAGE_DAILY_KEY]?.newValue) {
        state.daily = changes[STORAGE_DAILY_KEY].newValue;
        renderDockStats();
      }
    });
  }

  // Expose Core and Diagnostics for Test Harness & Diagnostic Tooling
  globalThis.__LPTFF_BOSS_DIAGNOSTICS__ = diagnostics;
  globalThis.__LPTFF_BOSS_HELPER_CORE__ = {
    state,
    diagnostics,
    DEFAULT_SETTINGS,
    BUILTIN_PRESETS,
    parseSalaryRange,
    parseFreshDays,
    parseKeywords,
    parseAiScore,
    evaluateJobRules,
    renderGreeting,
    extractJobFromCard,
    scanJobsOnPage,
    decorateCard,
    runBatchDelivery,
    stopBatchDelivery,
    initContentScript,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContentScript);
  } else {
    initContentScript();
  }
})();
