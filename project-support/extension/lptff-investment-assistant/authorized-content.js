/* Fixed-author collection: source-page session only, no Cookie export or cloud write. */
(() => {
  const KEY = "lptffAuthorizedContentV1";
  const tasks = new Map();
  const sourceUrl = (s) => s.platform === "douyin"
    ? `https://www.douyin.com/user/${s.uid}` : `https://space.bilibili.com/${s.uid}/dynamic`;
  const catalog = () => fetch(chrome.runtime.getURL("content-sources.json")).then((r) => r.json());

  function allowed(sender) {
    try {
      const url = new URL(sender.url || sender.tab?.url || "");
      return (url.protocol === "chrome-extension:" && url.host === new URL(chrome.runtime.getURL("/")).host)
        || url.origin === "https://lptff.github.io"
        || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
    } catch { return false; }
  }

  // Runs inside the exact configured author page. Return only publishable item fields.
  async function extract(source) {
    const expected = source.platform === "douyin"
      ? `https://www.douyin.com/user/${source.uid}` : `https://space.bilibili.com/${source.uid}/dynamic`;
    if (location.origin + location.pathname !== expected) return { items: [], reason: "source-page-changed" };
    const cleanUrl = (value) => {
      if (!value) return "";
      try {
        const url = new URL(value, location.href);
        if (source.platform === "bilibili" && url.protocol === "http:" && (url.hostname === "hdslb.com" || url.hostname.endsWith(".hdslb.com"))) url.protocol = "https:";
        return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
      }
      catch { return ""; }
    };
    const output = (id, title, timestamp, cover, name, likes = 0) => ({
      detailUrl: id, videoUrl: id, desc: String(title || "").slice(0, 4000),
      captionUrl: cleanUrl(cover || ""), authorName: String(name || source.name).slice(0, 100),
      authorPage: expected, timestamp, time: new Date(timestamp).toISOString(),
      likeCount: Number(likes) || 0, website: source.platform,
    });
    if (source.platform === "douyin") {
      for (let attempt = 0; attempt < 40; attempt++) {
        const items = new Map();
        for (const el of document.querySelectorAll('a[href*="/video/"]')) {
          const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
          let fiber = key && el[key];
          for (let depth = 0; fiber && depth < 12; depth++, fiber = fiber.return) {
            const item = fiber.memoizedProps?.awemeInfo;
            if (!item || item.authorInfo?.secUid !== source.uid) continue;
            const timestamp = Number(item.createTime) * 1000;
            if (!/^\d+$/.test(String(item.awemeId)) || !(timestamp > 0) || !item.desc) break;
            const url = `https://www.douyin.com/video/${item.awemeId}`;
            items.set(url, output(url, item.desc, timestamp, item.video?.coverUrlList?.[0], item.authorInfo.nickname, item.stats?.diggCount));
            break;
          }
        }
        if (items.size) return { items: [...items.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50) };
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      return { items: [], reason: "login-or-page-unavailable" };
    }
    // Reuse the page's own public feed URL and browser-managed session.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const observed = performance.getEntriesByType("resource").map((entry) => entry.name).find((value) => {
      try { const url = new URL(value); return url.hostname === "api.bilibili.com"
        && url.pathname === "/x/polymer/web-dynamic/v1/feed/space" && url.searchParams.get("host_mid") === source.uid; }
      catch { return false; }
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(observed || `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=${source.uid}`, {
        credentials: "include", signal: controller.signal,
      });
      const payload = await response.json();
      if (payload.code !== 0 || !Array.isArray(payload.data?.items)) return { items: [], reason: "login-or-feed-rejected" };
      const items = [];
      for (const entry of payload.data.items) {
        const author = entry.modules?.module_author || {};
        if (String(author.mid) !== source.uid) continue;
        const dynamic = entry.modules?.module_dynamic || {};
        const archive = dynamic.major?.archive;
        const opus = dynamic.major?.opus;
        const title = archive?.title || dynamic.desc?.text || opus?.summary?.text || opus?.title;
        const timestamp = Number(author.pub_ts) * 1000;
        const url = archive?.bvid && /^BV[\da-z]+$/i.test(archive.bvid)
          ? `https://www.bilibili.com/video/${archive.bvid}`
          : /^\d+$/.test(String(entry.id_str)) ? `https://t.bilibili.com/${entry.id_str}` : "";
        if (!title || !url || !(timestamp > 0)) continue;
        items.push(output(url, title, timestamp, archive?.cover || opus?.pics?.[0]?.url, author.name, entry.modules?.module_stat?.like?.count));
      }
      return { items: items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50), reason: items.length ? "" : "no-visible-items" };
    } catch { return { items: [], reason: "login-or-feed-unavailable" }; }
    finally { clearTimeout(timeout); }
  }

  async function run(platform, task) {
    const sources = (await catalog()).filter((source) => source.platform === platform);
    const previous = (await chrome.storage.local.get(KEY))[KEY] || {};
    const merged = new Map((previous[platform]?.items || []).map((item) => [item.detailUrl, item]));
    task.sources = [];
    for (const source of sources) {
      if (task.cancelled) break;
      const oldSource = previous[platform]?.sources?.find(item => item.uid === source.uid);
      const lastSuccessAt = oldSource?.lastSuccessAt || (oldSource?.state === "success" ? previous[platform]?.updatedAt : 0) || 0;
      let tab;
      try {
        tab = await chrome.tabs.create({ url: sourceUrl(source), active: false });
        task.sourceTabId = tab.id;
        for (let i = 0; i < 60; i++) {
          if (task.cancelled) break;
          const state = await chrome.tabs.get(tab.id);
          if (state.status === "complete") break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (task.cancelled) break;
        const result = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: "MAIN", func: extract, args: [source] });
        const batch = result[0]?.result?.items || [];
        const valid = batch.filter((item) => item.website === platform && item.authorPage === sourceUrl(source)
          && Number.isFinite(item.timestamp) && item.timestamp > 0 && typeof item.desc === "string"
          && (platform === "douyin" ? /^https:\/\/www\.douyin\.com\/video\/\d+$/ : /^https:\/\/(?:www\.bilibili\.com\/video\/BV[\da-z]+|t\.bilibili\.com\/\d+)$/i).test(item.detailUrl));
        for (const item of valid) merged.set(item.detailUrl, item);
        task.sources.push({ uid: source.uid, count: valid.length, state: valid.length ? "success" : "needs-login", lastSuccessAt: valid.length ? Date.now() : lastSuccessAt });
        if (!valid.length) {
          task.loginTabId = tab.id;
          tab = null; // Keep the exact source page available for login and review.
        }
      } catch {
        task.sources.push({ uid: source.uid, count: 0, state: "unavailable", lastSuccessAt });
      } finally {
        if (tab?.id) await chrome.tabs.remove(tab.id).catch(() => {});
      }
    }
    const items = [...merged.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);
    const state = task.cancelled ? "cancelled" : task.sources.every((source) => source.state === "success") ? "success" : "partial";
    // Preserve the other platform's previously completed collection.
    const stored = (await chrome.storage.local.get(KEY))[KEY] || {};
    const sourceStates = sources.map(source => {
      const finished = task.sources.find(item => item.uid === source.uid);
      if (finished) return finished;
      const old = previous[platform]?.sources?.find(item => item.uid === source.uid);
      return old ? { ...old, lastSuccessAt: old.lastSuccessAt || (old.state === "success" ? previous[platform]?.updatedAt : 0) || 0 }
        : { uid: source.uid, state: "unknown", lastSuccessAt: 0 };
    });
    stored[platform] = { items, updatedAt: Date.now(), state, sources: sourceStates };
    await chrome.storage.local.set({ [KEY]: stored });
    task.running = false;
    task.state = state;
  }

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!message?.type?.startsWith("AUTHORIZED_CONTENT_")) return;
    if (!allowed(sender)) { respond({ ok: false, error: "不允许的采集入口" }); return; }
    (async () => {
      const platform = message.platform;
      if (message.type === "AUTHORIZED_CONTENT_AI_CONFIG") return localAiConfig();
      if (message.type === "AUTHORIZED_CONTENT_AI_REVEAL") return { ok: true, value: (await loadLocalGeminiConfig()).geminiKey };
      if (message.type === "AUTHORIZED_CONTENT_AI_SAVE") return localAiConfig(message.config || {});
      if (message.type === "AUTHORIZED_CONTENT_AI_CLEAR") {
        const stored = (await chrome.storage.local.get("lptffBossAutopilot")).lptffBossAutopilot || {};
        stored.geminiKey = "";
        await chrome.storage.local.set({ lptffBossAutopilot: stored });
        return localAiConfig();
      }
      if (message.type === "AUTHORIZED_CONTENT_AI_TEST") {
        await callLocalGemini({ system: "你是连接测试助手。", prompt: "返回连接状态。", schema: { type: "OBJECT", properties: { status: { type: "STRING" } }, required: ["status"] }, maxOutputTokens: 100, maxAttempts: 1 });
        return { ok: true };
      }
      if (message.type === "AUTHORIZED_CONTENT_AI_CACHED") return analyzeLocalContent(message.domain, message.items, true);
      if (message.type === "AUTHORIZED_CONTENT_AI_ANALYZE") return analyzeLocalContent(message.domain, message.items);
      if (message.type === "AUTHORIZED_CONTENT_OPEN_ASSISTANT") {
        const mode = ["finance", "market", "entertainment"].includes(message.mode) ? message.mode : "entertainment";
        await chrome.tabs.create({ url: chrome.runtime.getURL(`popup/popup.html?mode=${mode}`) });
        return { ok: true };
      }
      if (message.type === "AUTHORIZED_CONTENT_STATUS") {
        const stored = (await chrome.storage.local.get(KEY))[KEY] || {};
        return { ok: true, version: chrome.runtime.getManifest().version,
          platforms: Object.fromEntries(["douyin", "bilibili"].map((id) => [id, {
            state: tasks.get(id)?.running ? "running" : tasks.get(id)?.state || stored[id]?.state || "idle",
            count: stored[id]?.items?.length || 0, updatedAt: stored[id]?.updatedAt || 0,
            sources: stored[id]?.sources || [],
          }])) };
      }
      if (!["douyin", "bilibili"].includes(platform)) throw new Error("未知采集平台");
      if (message.type === "AUTHORIZED_CONTENT_START") {
        if ([...tasks.values()].some((task) => task.running)) return { ok: false, error: "请等待当前采集完成，或停止后再启动" };
        const task = { running: true, state: "running", cancelled: false };
        tasks.set(platform, task);
        run(platform, task).catch(async () => {
          task.running = false; task.state = "failed";
          const stored = (await chrome.storage.local.get(KEY))[KEY] || {};
          stored[platform] = { ...stored[platform], state: "failed" };
          await chrome.storage.local.set({ [KEY]: stored });
        }).catch(() => {});
        return { ok: true };
      }
      if (message.type === "AUTHORIZED_CONTENT_STOP") {
        const task = tasks.get(platform);
        if (task) task.cancelled = true;
        return { ok: true };
      }
      if (message.type === "AUTHORIZED_CONTENT_LOGIN") {
        const tabId = tasks.get(platform)?.loginTabId;
        if (tabId) await chrome.tabs.update(tabId, { active: true });
        else {
          const source = (await catalog()).find((item) => item.platform === platform);
          await chrome.tabs.create({ url: sourceUrl(source) });
        }
        return { ok: true };
      }
      if (message.type === "AUTHORIZED_CONTENT_RESULT") {
        const stored = (await chrome.storage.local.get(KEY))[KEY] || {};
        return { ok: true, items: stored[platform]?.items || [], updatedAt: stored[platform]?.updatedAt || 0, state: stored[platform]?.state || "idle", sources: stored[platform]?.sources || [] };
      }
      throw new Error("未知采集操作");
    })().then(respond, (error) => respond({ ok: false, error: message.type.startsWith("AUTHORIZED_CONTENT_AI_") ? String(error.message || "分析失败").slice(0, 400) : "采集未完成，请检查来源登录状态后重试" }));
    return true;
  });
})();
