(() => {
  const call = async (action, payload = {}) => {
    const response = await chrome.runtime.sendMessage({ type: `AUTHORIZED_CONTENT_${action}`, ...payload });
    if (!response?.ok) throw new Error(response?.error || "扩展未响应");
    return response;
  };

  const cards = new Map();
  const branchElements = new Map();
  let timer;
  const policy = fetch(chrome.runtime.getURL("content-freshness.json")).then((response) => response.json());

  async function freshness(state) {
    const rule = await policy;
    const times = (state.sources || []).map((source) => source.lastSuccessAt || (source.state === "success" ? state.updatedAt : 0));
    if (!times.length || times.some((time) => !time || time > Date.now() + 60000)) return "尚未确认采集时间";
    if (state.state !== "success" && state.state !== "completed") return "上次采集未完成";
    const age = Date.now() - Math.min(...times);
    return age >= rule.refreshAfterMs ? "信息已过期，建议刷新" : age >= rule.warnAfterMs ? "信息即将过期" : "信息在有效期内";
  }

  function authorProgressText(author) {
    if (!author) return "等待";
    const statusMap = {
      waiting: "等待",
      running: "采集中",
      completed: "完成",
      partial: "部分完成",
      failed: "失败",
      cancelled: "已取消",
      "needs-login": "等待登录/验证",
      interrupted: "已中断",
    };
    const stateLabel = statusMap[author.status] || author.status;
    const pageText = author.pageCount > 1 ? ` · 第 ${author.pageCount} 页` : "";
    const countText = author.itemsCount > 0 ? ` · 已获取 ${author.itemsCount} 条` : "";
    const dupText = author.duplicateCount > 0 ? ` · 跨页去重 ${author.duplicateCount}` : "";
    const endReason = author.endReason ? ` (${author.endReason})` : "";
    const durationText = author.durationMs > 0 ? ` · ${(author.durationMs / 1000).toFixed(1)}s` : "";

    return `${stateLabel}${countText}${pageText}${dupText}${durationText}${endReason}`;
  }

  const host = document.querySelector("#authorized-platforms");

  // 1. 全局一键控制栏与总进度
  const globalHeader = document.createElement("div");
  globalHeader.className = "authorized-global-toolbar";
  globalHeader.innerHTML = `
    <div class="global-actions">
      <button id="auth-start-all" type="button" class="btn-primary">一键采集刷新（全平台）</button>
      <button id="auth-resume" type="button" style="display: none;">继续未完成作者</button>
      <button id="auth-stop" type="button" class="btn-danger" style="display: none;">停止采集</button>
    </div>
    <div id="auth-overall-summary" class="auth-summary-card" role="status">
      <strong>全部来源</strong>：<span id="auth-overall-text">正在检查状态…</span>
      <div id="auth-metrics-text" class="auth-metrics-line"></div>
    </div>
  `;
  host.append(globalHeader);

  const startAllBtn = globalHeader.querySelector("#auth-start-all");
  const resumeBtn = globalHeader.querySelector("#auth-resume");
  const stopBtn = globalHeader.querySelector("#auth-stop");
  const overallText = globalHeader.querySelector("#auth-overall-text");
  const metricsText = globalHeader.querySelector("#auth-metrics-text");

  startAllBtn.addEventListener("click", async () => {
    try {
      startAllBtn.disabled = true;
      await call("START_ALL");
      await refresh();
    } catch (e) {
      overallText.textContent = e.message;
    }
  });

  resumeBtn.addEventListener("click", async () => {
    try {
      resumeBtn.disabled = true;
      await call("RESUME");
      await refresh();
    } catch (e) {
      overallText.textContent = e.message;
    }
  });

  stopBtn.addEventListener("click", async () => {
    try {
      stopBtn.disabled = true;
      await call("STOP");
      await refresh();
    } catch (e) {
      overallText.textContent = e.message;
    }
  });

  // 2. 平台卡片与作者分支
  for (const [platform, title, scope] of [
    ["douyin", "抖音 · 作者作品", "李子栗、独孤十一；默认目标最近 50 条作品。"],
    ["bilibili", "哔哩哔哩 · 作者动态", "百科老王、国外主机测评、小迪老师、杨博士说AI；默认目标最近 50 条动态。"],
  ]) {
    const article = document.createElement("article");
    article.className = "collection-card";
    article.innerHTML = `
      <header class="card-header">
        <h2>${title}</h2>
        <span class="platform-mode-badge" id="${platform}-mode-badge"></span>
      </header>
      <p class="scope-desc">${scope}</p>
      <div class="collection-actions">
        <button id="${platform}-start" type="button">手动采集刷新</button>
        <button id="${platform}-login" type="button">打开来源 / 登录</button>
      </div>
      <p id="${platform}-status" class="platform-status" role="status"></p>
      <div id="${platform}-branches" class="platform-branches"></div>
    `;

    const startBtn = article.querySelector(`#${platform}-start`);
    const loginBtn = article.querySelector(`#${platform}-login`);
    const statusEl = article.querySelector(`#${platform}-status`);
    const badgeEl = article.querySelector(`#${platform}-mode-badge`);
    const branchesEl = article.querySelector(`#${platform}-branches`);

    startBtn.addEventListener("click", async () => {
      try {
        startBtn.disabled = true;
        await call("START", { platform });
        await refresh();
      } catch (e) {
        statusEl.textContent = e.message;
      }
    });

    loginBtn.addEventListener("click", async () => {
      try {
        await call("LOGIN", { platform });
      } catch (e) {
        statusEl.textContent = e.message;
      }
    });

    cards.set(platform, { article, startBtn, loginBtn, statusEl, badgeEl, branchesEl });
    host.append(article);
  }

  function renderSnapshot(taskSnapshot, platformSummaries = {}) {
    if (!taskSnapshot) {
      overallText.textContent = "尚未启动采集";
      metricsText.textContent = "";
      startAllBtn.disabled = false;
      stopBtn.style.display = "none";
      resumeBtn.style.display = "none";
      return;
    }

    const isRunning = taskSnapshot.phase === "running";
    const isInterrupted = taskSnapshot.phase === "interrupted" || taskSnapshot.phase === "cancelled" || taskSnapshot.phase === "partial";
    const sum = taskSnapshot.summary || {};

    startAllBtn.disabled = isRunning;
    stopBtn.style.display = isRunning ? "inline-block" : "none";
    stopBtn.disabled = false;
    resumeBtn.style.display = (!isRunning && isInterrupted) ? "inline-block" : "none";
    resumeBtn.disabled = false;

    // 总任务三类计数
    overallText.textContent = `已完成 ${sum.completedAuthors || 0}/${sum.totalAuthors || 0} · 采集中 ${sum.runningAuthors || 0} · 等待 ${sum.waitingAuthors || 0}${sum.failedAuthors ? ` · 失败/中断 ${sum.failedAuthors}` : ""}${sum.needsLoginAuthors ? ` · 等待登录 ${sum.needsLoginAuthors}` : ""}`;
    metricsText.textContent = `本轮获取：${sum.validUniqueCount || 0} 条有效 · 跨页去重 ${sum.duplicateCount || 0} · 耗时 ${((taskSnapshot.elapsedMs || 0) / 1000).toFixed(1)}s`;

    // 平台与作者渲染
    for (const [platform, card] of cards.entries()) {
      const pInfo = taskSnapshot.platforms?.[platform] || {};
      const authors = (taskSnapshot.authors || []).filter((a) => a.platform === platform);
      const storedCount = pInfo.storedCount ?? platformSummaries[platform]?.count ?? 0;

      card.startBtn.disabled = isRunning;
      card.badgeEl.textContent = pInfo.mode || "真实接口";

      const completedCount = authors.filter((a) => a.status === "completed").length;
      const stateText = isRunning && authors.some((a) => a.status === "running") ? "正在采集" : completedCount === authors.length ? "本次范围完成" : "部分完成";
      card.statusEl.textContent = `${stateText} · 作者 ${completedCount}/${authors.length} 完成 · 本机保留 ${storedCount} 条`;

      // 渲染具体作者分支（类似于币安分支）
      const fragment = document.createDocumentFragment();
      for (const author of authors) {
        let row = branchElements.get(author.uid);
        if (!row) {
          row = document.createElement("div");
          row.className = "branch";
          const label = document.createElement("span");
          label.className = "branch-name";
          const val = document.createElement("strong");
          val.className = "branch-val";
          row.append(label, val);
          branchElements.set(author.uid, row);
        }
        row.className = `branch branch-${author.status}`;
        row.querySelector(".branch-name").textContent = author.name;
        row.querySelector(".branch-val").textContent = authorProgressText(author);
        fragment.append(row);
      }
      card.branchesEl.replaceChildren(fragment);
    }
  }

  async function refresh() {
    clearTimeout(timer);
    try {
      const status = await call("STATUS");
      renderSnapshot(status.task, status.platforms);
      const isRunning = status.task?.phase === "running";
      timer = setTimeout(refresh, isRunning ? 2000 : 30000);
    } catch (error) {
      overallText.textContent = error.message;
    }
  }

  // 侦听后台推送的进度更新
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "AUTHORIZED_CONTENT_PROGRESS" && msg.snapshot) {
      renderSnapshot(msg.snapshot);
    }
  });

  // ---------------- Gemini AI 共享配置 ----------------
  const state = document.querySelector("#shared-ai-state");
  const key = document.querySelector("#shared-ai-key");
  const model = document.querySelector("#shared-ai-model");
  const save = document.querySelector("#shared-ai-save");
  const reveal = document.querySelector("#shared-ai-reveal");
  const clear = document.querySelector("#shared-ai-clear");
  let keyDirty = false;
  let hideTimer;

  function hideKey() {
    clearTimeout(hideTimer);
    key.type = "password";
    reveal.textContent = "显示";
    reveal.setAttribute("aria-label", "显示 Gemini Key");
  }

  function busy(value) {
    clear.disabled = save.disabled = reveal.disabled = key.disabled = model.disabled = value;
  }

  function display(config) {
    model.value = config.model;
    key.placeholder = "请输入 Gemini API Key";
    document.querySelector("#shared-ai-saved").textContent = config.hasKey ? "已保存" : "未配置";
    state.textContent = config.hasKey ? "已保存在本机 · 与 BOSS 助手及资讯分析共用" : "尚未配置 Gemini Key。";
  }

  key.addEventListener("input", () => {
    keyDirty = true;
    state.textContent = "修改未保存";
  });

  model.addEventListener("change", () => {
    state.textContent = "修改未保存";
  });

  reveal.addEventListener("click", async () => {
    if (key.type === "text") {
      hideKey();
      return;
    }
    busy(true);
    try {
      if (!key.value) {
        const result = await call("AI_REVEAL");
        if (!result.value) throw new Error("尚未保存密钥，请先输入并保存。");
        key.value = result.value;
      }
      key.type = "text";
      reveal.textContent = "隐藏";
      reveal.setAttribute("aria-label", "隐藏 Gemini Key");
      hideTimer = setTimeout(hideKey, 30000);
    } catch (error) {
      state.textContent = error.message;
    } finally {
      busy(false);
    }
  });

  save.addEventListener("click", async () => {
    busy(true);
    state.textContent = "正在保存…";
    let saved = false;
    try {
      if (!key.value.trim()) throw new Error("请输入 Gemini Key；删除已保存密钥请使用清除 Key。");
      display(await call("AI_SAVE", { config: { model: model.value, geminiKey: key.value } }));
      keyDirty = false;
      hideKey();
      saved = true;
      state.textContent = "已保存 · 正在测试 Gemini 连接…";
      await call("AI_TEST");
      state.textContent = "已保存 · Gemini 连接测试通过";
    } catch (error) {
      state.textContent = `${saved ? "已保存，但连接测试失败" : "保存失败"}：${error.message}`;
    } finally {
      busy(false);
    }
  });

  clear.addEventListener("click", async () => {
    busy(true);
    try {
      display(await call("AI_CLEAR"));
      key.value = "";
      keyDirty = false;
      hideKey();
      state.textContent = "Key 已清除 · 与 BOSS 助手及资讯分析同步生效";
    } catch (error) {
      state.textContent = `清除失败：${error.message}`;
    } finally {
      busy(false);
    }
  });

  busy(true);
  call("AI_CONFIG")
    .then(async (config) => {
      if (config.hasKey) key.value = (await call("AI_REVEAL")).value;
      display(config);
    })
    .catch((error) => {
      state.textContent = error.message;
    })
    .finally(() => busy(false));

  refresh();
  window.addEventListener("unload", () => {
    clearTimeout(timer);
    clearTimeout(hideTimer);
    key.value = "";
  });
})();
