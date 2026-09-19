/* Fixed-author collection: source-page session with an optional signed LAN bridge. */
(() => {
  const CONTENT_KEY = "lptffAuthorizedContentV1";
  const TASK_KEY = "lptffAuthorizedContentTaskSnapshot";
  const PER_AUTHOR_LIMIT = 60;
  const DEFAULT_TARGET_COUNT = 50;

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

  // Active in-memory execution handle
  let activeExecution = null;

  // Initialize and recover from possible background restarts
  (async function init() {
    try {
      const stored = (await chrome.storage.local.get(TASK_KEY))[TASK_KEY];
      if (stored && stored.phase === "running") {
        stored.phase = "interrupted";
        stored.updatedAt = Date.now();
        stored.endReason = "扩展后台已重启，采集被中断，支持继续采集";
        for (const author of stored.authors || []) {
          if (author.status === "running") {
            author.status = "interrupted";
            author.endReason = "后台重启中断";
          }
        }
        await chrome.storage.local.set({ [TASK_KEY]: stored });
      }
    } catch {}
  })();

  // Runs inside the exact configured author page (MAIN world). Return publishable item fields and execution metadata.
  async function extract(source, targetCount = 50) {
    const expected = source.platform === "douyin"
      ? `https://www.douyin.com/user/${source.uid}` : `https://space.bilibili.com/${source.uid}/dynamic`;
    if (location.origin + location.pathname !== expected) {
      return { items: [], reason: "source-page-changed", mode: "unknown", rawCount: 0, duplicateCount: 0, pageCount: 0 };
    }

    const cleanUrl = (value) => {
      if (!value) return "";
      try {
        const url = new URL(value, location.href);
        if (source.platform === "bilibili" && url.protocol === "http:" && (url.hostname === "hdslb.com" || url.hostname.endsWith(".hdslb.com"))) {
          url.protocol = "https:";
        }
        return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
      } catch { return ""; }
    };

    const output = (id, title, timestamp, cover, name, likes = 0) => ({
      detailUrl: id, videoUrl: id, desc: String(title || "").slice(0, 4000),
      captionUrl: cleanUrl(cover || ""), authorName: String(name || source.name).slice(0, 100),
      authorPage: expected, timestamp, time: new Date(timestamp).toISOString(),
      likeCount: Number(likes) || 0, website: source.platform,
    });

    // ----------------- 抖音适配器：真实接口探测，平滑降级页面提取 -----------------
    // ----------------- 抖音适配器：真实接口（动态逆向 a_bogus 浏览器签名），支持游标分页 -----------------
    if (source.platform === "douyin") {
      let mode = "真实接口";
      const itemsMap = new Map();
      let rawCount = 0;
      let duplicateCount = 0;
      let pageCount = 0;
      let endReason = "";

      // 检查页面是否需要登录或验证码阻断
      const hasLoginMask = () => {
        const modal = document.querySelector(".login-mask, #login-core-sdk, .captcha_verify_container, [class*='login-mask'], [class*='captcha']");
        return modal && modal.offsetParent !== null;
      };

      if (hasLoginMask()) {
        return { items: [], reason: "needs-login", mode, rawCount: 0, duplicateCount: 0, pageCount: 0 };
      }

      // 1. 优先调用宿主环境真实接口（window.fetch 自动触发宿主脚本动态签名计算 a_bogus 与 msToken）
      try {
        let cursor = "0";
        let hasMore = true;

        while (itemsMap.size < targetCount && pageCount < 10 && hasMore) {
          pageCount++;
          const baseParams = new URLSearchParams({
            device_platform: "webapp",
            aid: "6383",
            channel: "channel_pc_web",
            sec_user_id: source.uid,
            max_cursor: String(cursor || 0),
            locate_query: "false",
            show_live_replay_strategy: "1",
            need_time_list: "1",
            time_list_query: "0",
            whale_cut_token: "",
            cut_version: "1",
            count: "18",
            publish_video_strategy_type: "2",
            from_user_page: "1",
            update_version_code: "170400",
            pc_client_type: "1",
            pc_libra_divert: "Windows",
            support_h265: "1",
            support_dash: "1",
            cpu_core_num: String(navigator.hardwareConcurrency || 8),
            version_code: "290100",
            version_name: "29.1.0",
            cookie_enabled: "true",
            screen_width: String(window.screen?.width || 1920),
            screen_height: String(window.screen?.height || 1080),
            browser_language: navigator.language || "zh-CN",
            browser_platform: navigator.platform || "Win32",
            browser_name: "Chrome",
            browser_version: "152.0.0.0",
            browser_online: "true",
            engine_name: "Blink",
            engine_version: "152.0.0.0",
            os_name: "Windows",
            os_version: "10",
            device_memory: String(navigator.deviceMemory || 16),
            platform: "PC",
            downlink: "10",
            effective_type: "4g",
            round_trip_time: "150",
          });

          const apiUrl = `https://www.douyin.com/aweme/v1/web/aweme/post/?${baseParams.toString()}`;
          const res = await window.fetch(apiUrl, {
            headers: { "accept": "application/json, text/plain, */*" },
            credentials: "include",
          });

          const data = await res.json();
          if (data.status_code !== 0) {
            endReason = `接口状态异常(${data.status_code})`;
            break;
          }

          const entries = data.aweme_list;
          if (!Array.isArray(entries) || entries.length === 0) {
            endReason = itemsMap.size ? `本次范围完成 · ${itemsMap.size} 条 · 已到末页` : "完成 · 暂无公开内容";
            break;
          }

          rawCount += entries.length;
          for (const item of entries) {
            const awemeId = String(item.aweme_id || "");
            if (!/^\d+$/.test(awemeId)) continue;
            const url = `https://www.douyin.com/video/${awemeId}`;
            const title = item.desc || "";
            const timestamp = Number(item.create_time) * 1000;
            const cover = item.video?.cover?.url_list?.[0] || item.video?.coverUrlList?.[0] || "";
            const authorName = item.author?.nickname || source.name;
            const likes = item.statistics?.digg_count || item.stats?.diggCount || 0;

            if (itemsMap.has(url)) {
              duplicateCount++;
            } else {
              itemsMap.set(url, output(url, title, timestamp, cover, authorName, likes));
            }

            if (itemsMap.size >= targetCount) break;
          }

          cursor = String(data.max_cursor || "");
          hasMore = Boolean(data.has_more) && entries.length > 0 && cursor !== "0";
          await new Promise((r) => setTimeout(r, 200));
        }

        if (itemsMap.size > 0) {
          if (!endReason) {
            endReason = itemsMap.size >= targetCount ? `最近 ${targetCount} 条已完成` : `本次范围完成 · ${itemsMap.size} 条`;
          }
          const items = [...itemsMap.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, targetCount);
          return {
            items,
            reason: endReason,
            mode: "真实接口",
            rawCount,
            duplicateCount,
            pageCount,
          };
        }
      } catch (apiErr) {
        console.warn("抖音真实接口获取失败，尝试降级至页面提取", apiErr);
      }

      // 2. 降级方案：若真实接口被阻断，平滑降级至页面滚动与 React Fiber 提取
      mode = "页面采集 · 降级";
      const scanCards = () => {
        const cards = document.querySelectorAll('a[href*="/video/"]');
        let newFound = 0;
        for (const el of cards) {
          const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
          let fiber = key && el[key];
          for (let depth = 0; fiber && depth < 12; depth++, fiber = fiber.return) {
            const item = fiber.memoizedProps?.awemeInfo;
            if (!item || item.authorInfo?.secUid !== source.uid) continue;
            const timestamp = Number(item.createTime) * 1000;
            if (!/^\d+$/.test(String(item.awemeId)) || !(timestamp > 0) || !item.desc) break;
            const url = `https://www.douyin.com/video/${item.awemeId}`;
            rawCount++;
            if (itemsMap.has(url)) {
              duplicateCount++;
            } else {
              itemsMap.set(url, output(url, item.desc, timestamp, item.video?.coverUrlList?.[0], item.authorInfo.nickname, item.stats?.diggCount));
              newFound++;
            }
            break;
          }
        }
        return newFound;
      };

      // 首次加载等待渲染
      for (let i = 0; i < 20; i++) {
        scanCards();
        if (itemsMap.size > 0 || hasLoginMask()) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (itemsMap.size === 0 && hasLoginMask()) {
        return { items: [], reason: "needs-login", mode, rawCount: 0, duplicateCount: 0, pageCount: 0 };
      }

      // 滚动加载以获取目标数量
      let consecutiveStalls = 0;
      pageCount = 1;
      while (itemsMap.size < targetCount && pageCount < 25 && consecutiveStalls < 3) {
        const container = document.querySelector(".route-scroll-container") || document.scrollingElement || document.documentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        await new Promise((r) => setTimeout(r, 650));
        pageCount++;
        const added = scanCards();
        if (added === 0) consecutiveStalls++;
        else consecutiveStalls = 0;
      }

      const items = [...itemsMap.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, targetCount);
      let reason = "";
      if (items.length >= targetCount) {
        reason = `最近 ${targetCount} 条已完成`;
      } else if (items.length > 0) {
        reason = `本次范围完成 · ${items.length} 条 · 已到末页`;
      } else if (hasLoginMask()) {
        reason = "needs-login";
      } else {
        reason = "完成 · 暂无公开内容";
      }

      return {
        items,
        reason,
        mode,
        rawCount,
        duplicateCount,
        pageCount,
      };
    }

    // ----------------- 哔哩哔哩适配器：作者空间动态真实接口，支持游标分页 -----------------
    if (source.platform === "bilibili") {
      const mode = "真实接口";
      const itemsMap = new Map();
      const seenOffsets = new Set();
      let offset = "";
      let pageCount = 0;
      let rawCount = 0;
      let duplicateCount = 0;
      let endReason = "";

      // 优先从性能记录中寻找页面已发起的真实 feed 地址，保证携带一致的参数
      await new Promise((r) => setTimeout(r, 800));
      const observed = performance.getEntriesByType("resource").map((e) => e.name).find((v) => {
        try {
          const u = new URL(v);
          return u.hostname === "api.bilibili.com"
            && u.pathname === "/x/polymer/web-dynamic/v1/feed/space"
            && u.searchParams.get("host_mid") === source.uid;
        } catch { return false; }
      });

      const buildApiUrl = (cursor) => {
        if (observed) {
          try {
            const u = new URL(observed);
            if (cursor) u.searchParams.set("offset", cursor);
            else u.searchParams.delete("offset");
            return u.href;
          } catch {}
        }
        const cursorParam = cursor ? `&offset=${encodeURIComponent(cursor)}` : "";
        return `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=${source.uid}${cursorParam}`;
      };

      while (itemsMap.size < targetCount && pageCount < 10) {
        pageCount++;
        seenOffsets.add(offset);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        let payload;
        try {
          const res = await fetch(buildApiUrl(offset), { credentials: "include", signal: controller.signal });
          payload = await res.json();
        } catch {
          if (itemsMap.size > 0) {
            endReason = "请求超时 · 部分完成";
          } else {
            return { items: [], reason: "login-or-feed-unavailable", mode, rawCount: 0, duplicateCount: 0, pageCount };
          }
          break;
        } finally {
          clearTimeout(timer);
        }

        if (payload.code !== 0) {
          if (itemsMap.size > 0) {
            endReason = `接口限制(${payload.code}) · 部分完成`;
          } else {
            return { items: [], reason: payload.code === -101 ? "needs-login" : "login-or-feed-rejected", mode, rawCount: 0, duplicateCount: 0, pageCount };
          }
          break;
        }

        const entries = payload.data?.items;
        if (!Array.isArray(entries) || entries.length === 0) {
          if (itemsMap.size === 0) {
            endReason = "完成 · 暂无公开内容";
          } else {
            endReason = `本次范围完成 · ${itemsMap.size} 条 · 已到末页`;
          }
          break;
        }

        rawCount += entries.length;
        for (const entry of entries) {
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

          if (itemsMap.has(url)) {
            duplicateCount++;
          } else {
            itemsMap.set(url, output(url, title, timestamp, archive?.cover || opus?.pics?.[0]?.url, author.name, entry.modules?.module_stat?.like?.count));
          }
          if (itemsMap.size >= targetCount) break;
        }

        if (itemsMap.size >= targetCount) {
          endReason = `最近 ${targetCount} 条已完成`;
          break;
        }

        if (!payload.data?.has_more) {
          endReason = `本次范围完成 · ${itemsMap.size} 条 · 已到末页`;
          break;
        }

        const nextOffset = String(payload.data?.offset || "");
        if (!nextOffset || seenOffsets.has(nextOffset)) {
          endReason = `本次范围完成 · ${itemsMap.size} 条 · 游标循环终止`;
          break;
        }
        offset = nextOffset;
        await new Promise((r) => setTimeout(r, 250));
      }

      const items = [...itemsMap.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, targetCount);
      if (!endReason) {
        endReason = items.length ? `本次范围完成 · ${items.length} 条` : "完成 · 暂无公开内容";
      }

      return {
        items,
        reason: endReason,
        mode,
        rawCount,
        duplicateCount,
        pageCount,
      };
    }

    return { items: [], reason: "unsupported-platform", mode: "unknown", rawCount: 0, duplicateCount: 0, pageCount: 0 };
  }

  // ----------------- 按作者截断策略（每作者上限 60 条） -----------------
  function enforcePerAuthorRetention(existingItems = [], incomingItems = [], authorPage = "") {
    const merged = new Map(existingItems.map((item) => [item.detailUrl, item]));
    for (const item of incomingItems) {
      const prev = merged.get(item.detailUrl);
      if (prev) {
        merged.set(item.detailUrl, { ...prev, ...item });
      } else {
        merged.set(item.detailUrl, item);
      }
    }

    // 按作者归类并截断
    const byAuthor = new Map();
    for (const item of merged.values()) {
      const key = item.authorPage || "default";
      if (!byAuthor.has(key)) byAuthor.set(key, []);
      byAuthor.get(key).push(item);
    }

    const retained = [];
    for (const [key, items] of byAuthor.entries()) {
      const sorted = items.sort((a, b) => b.timestamp - a.timestamp).slice(0, PER_AUTHOR_LIMIT);
      retained.push(...sorted);
    }

    return retained.sort((a, b) => b.timestamp - a.timestamp);
  }

  // 广播任务进度给所有关注方（扩展弹窗与网站）
  async function broadcastSnapshot(snapshot) {
    try {
      chrome.runtime.sendMessage({ type: "AUTHORIZED_CONTENT_PROGRESS", snapshot }).catch(() => {});
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (!tab.id) continue;
        const u = tab.url || "";
        if (u.includes("localhost") || u.includes("127.0.0.1") || u.includes("lptff.github.io")) {
          chrome.tabs.sendMessage(tab.id, { type: "AUTHORIZED_CONTENT_PROGRESS", snapshot }).catch(() => {});
        }
      }
    } catch {}
  }

  function getExtensionBuildTag() {
    return (typeof self !== "undefined" && self.__LPTFF_EXTENSION_BUILD_INFO__?.buildTag)
      || (typeof window !== "undefined" && window.__LPTFF_EXTENSION_BUILD_INFO__?.buildTag)
      || "cand-3.25.0-unknown";
  }
  let snapshotSequence = 0;
  let persistQueue = Promise.resolve();

  function persistSnapshot(snapshot) {
    // 明确固定当前快照内容并递增序号，消除并发快照入队时引用突变
    const frozenSnapshot = JSON.parse(JSON.stringify(snapshot));
    frozenSnapshot.seq = ++snapshotSequence;

    persistQueue = persistQueue.then(async () => {
      try {
        await chrome.storage.local.set({ [TASK_KEY]: frozenSnapshot });
        await broadcastSnapshot(frozenSnapshot);
      } catch (err) {
        console.error("[lptff-authorized] persistSnapshot storage failure:", err);
        // 存储异常显式记录，杜绝静默假成功
        frozenSnapshot.persistError = String(err?.message || err);
      }
    });
    return persistQueue;
  }

  function summarizeSnapshot(snapshot) {
    const authors = snapshot.authors || [];
    const completed = authors.filter((a) => a.status === "completed").length;
    const running = authors.filter((a) => a.status === "running").length;
    const waiting = authors.filter((a) => a.status === "waiting").length;
    const failed = authors.filter((a) => ["failed", "interrupted"].includes(a.status)).length;
    const needsLogin = authors.filter((a) => a.status === "needs-login").length;
    const validCount = authors.reduce((sum, a) => sum + (a.itemsCount || 0), 0);
    const rawCount = authors.reduce((sum, a) => sum + (a.rawCount || 0), 0);
    const duplicateCount = authors.reduce((sum, a) => sum + (a.duplicateCount || 0), 0);

    return {
      totalAuthors: authors.length,
      completedAuthors: completed,
      runningAuthors: running,
      waitingAuthors: waiting,
      failedAuthors: failed,
      needsLoginAuthors: needsLogin,
      validUniqueCount: validCount,
      rawCount,
      duplicateCount,
    };
  }

  // ----------------- 调度器核心 -----------------
  async function runCollection(scope = "all", resume = false) {
    const allSources = await catalog();
    const targetSources = scope === "all" ? allSources : allSources.filter((s) => s.platform === scope);
    const storedContent = (await chrome.storage.local.get(CONTENT_KEY))[CONTENT_KEY] || {};
    const oldSnapshot = (await chrome.storage.local.get(TASK_KEY))[TASK_KEY];

    const taskId = resume && oldSnapshot?.taskId ? oldSnapshot.taskId : `act_${Date.now()}`;
    const startTime = resume && oldSnapshot?.startTime ? oldSnapshot.startTime : Date.now();

    // 构建作者初始状态
    const authors = targetSources.map((source) => {
      const prevAuthor = oldSnapshot?.authors?.find((a) => a.uid === source.uid);
      const isAlreadyComplete = resume && prevAuthor?.status === "completed";
      return isAlreadyComplete ? prevAuthor : {
        uid: source.uid,
        name: source.name,
        platform: source.platform,
        tab: source.tab,
        status: "waiting",
        mode: "真实接口",
        itemsCount: 0,
        targetCount: DEFAULT_TARGET_COUNT,
        pageCount: 0,
        rawCount: 0,
        validCount: 0,
        duplicateCount: 0,
        endReason: "",
        durationMs: 0,
        lastSuccessAt: prevAuthor?.lastSuccessAt || (storedContent[source.platform]?.sources?.find((s) => s.uid === source.uid)?.lastSuccessAt || 0),
      };
    });

    const execution = {
      taskId,
      scope,
      running: true,
      cancelled: false,
      loginTabId: null,
      loginTabIds: new Map(),
      openTabIds: new Set(),
    };
    activeExecution = execution;

    let snapshot = {
      taskId,
      scope,
      phase: "running",
      startTime,
      updatedAt: Date.now(),
      elapsedMs: 0,
      resultVersion: storedContent.resultVersion || 0,
      summary: summarizeSnapshot({ authors }),
      authors,
      platforms: {
        bilibili: {
          status: "running",
          mode: "真实接口",
          completed: authors.filter((a) => a.platform === "bilibili" && a.status === "completed").length,
          total: authors.filter((a) => a.platform === "bilibili").length,
          storedCount: storedContent.bilibili?.items?.length || 0,
        },
        douyin: {
          status: "running",
          mode: "真实接口",
          completed: authors.filter((a) => a.platform === "douyin" && a.status === "completed").length,
          total: authors.filter((a) => a.platform === "douyin").length,
          storedCount: storedContent.douyin?.items?.length || 0,
        },
      },
    };

    await persistSnapshot(snapshot);

    const platformItems = {
      douyin: [...(storedContent.douyin?.items || [])],
      bilibili: [...(storedContent.bilibili?.items || [])],
    };

    const platformsToRun = scope === "all" ? ["bilibili", "douyin"] : [scope];

    async function processAuthor(author) {
      if (execution.cancelled) {
        if (author.status !== "completed") {
          author.status = "cancelled";
          author.endReason = "已停止采集";
        }
        return;
      }
      if (author.status === "completed") return; // 断点续采：跳过已完成作者

      author.status = "running";
      author.endReason = "采集中…";
      snapshot.updatedAt = Date.now();
      snapshot.elapsedMs = Date.now() - startTime;
      snapshot.summary = summarizeSnapshot(snapshot);
      await persistSnapshot(snapshot);

      const sourceDef = targetSources.find((s) => s.uid === author.uid);
      const startAuthorTime = Date.now();
      let tab = null;

      try {
        tab = await chrome.tabs.create({ url: sourceUrl(sourceDef), active: false });
        execution.openTabIds.add(tab.id);

        // 等待标签页加载
        for (let i = 0; i < 60; i++) {
          if (execution.cancelled) break;
          try {
            const state = await chrome.tabs.get(tab.id);
            if (state.status === "complete") break;
          } catch {
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }

        if (execution.cancelled) {
          author.status = "cancelled";
          author.endReason = "已停止采集";
          return;
        }

        const resultList = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: extract,
          args: [sourceDef, DEFAULT_TARGET_COUNT],
        });
        const res = resultList[0]?.result || { items: [], reason: "execute-script-failed" };

        author.durationMs = Date.now() - startAuthorTime;
        author.pageCount = res.pageCount || 1;
        author.rawCount = res.rawCount || 0;
        author.duplicateCount = res.duplicateCount || 0;
        author.mode = res.mode || author.mode;

        if (res.reason === "needs-login") {
          author.status = "needs-login";
          author.endReason = "等待登录/验证";
          // 仅保留该平台首个登录标签页供用户操作，并发时不重复打开多余标签页
          if (!execution.loginTabIds.has(author.platform)) {
            execution.loginTabIds.set(author.platform, tab.id);
            execution.loginTabId = tab.id;
            tab = null;
          }
        } else if (res.reason === "source-page-changed" || res.reason === "login-or-feed-unavailable") {
          author.status = "failed";
          author.endReason = res.reason === "source-page-changed" ? "页面跳转异常" : "来源不可用";
        } else {
          // 过滤并校验有效条目
          const valid = (res.items || []).filter((item) =>
            item.website === author.platform
            && item.authorPage === sourceUrl(sourceDef)
            && Number.isFinite(item.timestamp) && item.timestamp > 0
            && typeof item.desc === "string"
            && (author.platform === "douyin" ? /^https:\/\/www\.douyin\.com\/video\/\d+$/ : /^https:\/\/(?:www\.bilibili\.com\/video\/BV[\da-z]+|t\.bilibili\.com\/\d+)$/i).test(item.detailUrl)
          );

          author.itemsCount = valid.length;
          author.validCount = valid.length;
          author.endReason = res.reason || (valid.length ? `最近 ${valid.length} 条已完成` : "完成 · 暂无公开内容");

          if (res.reason?.includes("部分") || res.reason?.includes("受限") || res.reason?.includes("超时")) {
            author.status = "partial";
          } else {
            author.status = "completed";
            author.lastSuccessAt = Date.now();
          }

          // 合并到平台数据池，执行按作者截断（每作者 60 条）
          platformItems[author.platform] = enforcePerAuthorRetention(platformItems[author.platform], valid, sourceUrl(sourceDef));
        }
      } catch (err) {
        author.status = "failed";
        author.endReason = String(err.message || "采集异常").slice(0, 100);
        author.durationMs = Date.now() - startAuthorTime;
      } finally {
        if (tab?.id) {
          execution.openTabIds.delete(tab.id);
          await chrome.tabs.remove(tab.id).catch(() => {});
        }
      }

      snapshot.updatedAt = Date.now();
      snapshot.elapsedMs = Date.now() - startTime;
      snapshot.summary = summarizeSnapshot(snapshot);
      snapshot.platforms[author.platform].completed = authors.filter((a) => a.platform === author.platform && a.status === "completed").length;
      snapshot.platforms[author.platform].storedCount = platformItems[author.platform].length;
      await persistSnapshot(snapshot);
    }

    async function runPlatformLane(platform) {
      const platformAuthors = authors.filter((a) => a.platform === platform);

      // 并行并发调度该平台下所有作者采集（80ms 微错峰开启新标签页，兼顾极致并发与浏览器平稳性）
      await Promise.all(
        platformAuthors.map((author, index) =>
          new Promise((resolve) => setTimeout(resolve, index * 80)).then(() => processAuthor(author))
        )
      );

      // 泳道结束，记录平台最终状态
      const pAuthors = authors.filter((a) => a.platform === platform);
      const isPlatAllComplete = pAuthors.every((a) => a.status === "completed");
      snapshot.platforms[platform].status = isPlatAllComplete ? "completed" : execution.cancelled ? "cancelled" : "partial";
      await persistSnapshot(snapshot);
    }

    try {
      // 抖音与哔哩哔哩平台并行调度，大幅缩短采集时间
      await Promise.all(platformsToRun.map((p) => runPlatformLane(p)));
    } finally {
      const isCancelled = execution.cancelled;
      const allCompleted = authors.every((a) => a.status === "completed");
      const anyCompleted = authors.some((a) => a.status === "completed");
      const phase = isCancelled ? "cancelled" : allCompleted ? "completed" : anyCompleted ? "partial" : "failed";

      // 先持久化合并数据，再更新最终快照和递增版本
      if (!isCancelled || anyCompleted) {
        const nextVersion = (storedContent.resultVersion || 0) + 1;
        const now = Date.now();
        const nextStored = {
          ...storedContent,
          resultVersion: nextVersion,
          douyin: {
            items: platformItems.douyin,
            updatedAt: now,
            state: authors.filter((a) => a.platform === "douyin").every((a) => a.status === "completed") ? "success" : "partial",
            sources: allSources.filter((s) => s.platform === "douyin").map((s) => {
              const matched = authors.find((a) => a.uid === s.uid);
              return matched ? { uid: s.uid, state: matched.status, count: matched.itemsCount, lastSuccessAt: matched.lastSuccessAt }
                : (storedContent.douyin?.sources?.find((it) => it.uid === s.uid) || { uid: s.uid, state: "unknown", count: 0, lastSuccessAt: 0 });
            }),
          },
          bilibili: {
            items: platformItems.bilibili,
            updatedAt: now,
            state: authors.filter((a) => a.platform === "bilibili").every((a) => a.status === "completed") ? "success" : "partial",
            sources: allSources.filter((s) => s.platform === "bilibili").map((s) => {
              const matched = authors.find((a) => a.uid === s.uid);
              return matched ? { uid: s.uid, state: matched.status, count: matched.itemsCount, lastSuccessAt: matched.lastSuccessAt }
                : (storedContent.bilibili?.sources?.find((it) => it.uid === s.uid) || { uid: s.uid, state: "unknown", count: 0, lastSuccessAt: 0 });
            }),
          },
        };
        await chrome.storage.local.set({ [CONTENT_KEY]: nextStored });
        const freshPages = new Set(authors.filter((a) => a.platform === "douyin" && a.status === "completed" && a.lastSuccessAt >= startTime).map((a) => sourceUrl(a)));
        const bridgeItems = platformItems.douyin.filter((item) => freshPages.has(item.authorPage));
        if (platformsToRun.includes("douyin") && bridgeItems.length && globalThis.LPTFFDouyinBridge) {
          await globalThis.LPTFFDouyinBridge.syncAfterCollection(
            bridgeItems,
            nextStored.douyin.sources,
          );
        }
        snapshot.resultVersion = nextVersion;
      }

      snapshot.phase = phase;
      snapshot.updatedAt = Date.now();
      snapshot.elapsedMs = Date.now() - startTime;
      snapshot.summary = summarizeSnapshot(snapshot);
      snapshot.platforms.douyin.storedCount = platformItems.douyin.length;
      snapshot.platforms.bilibili.storedCount = platformItems.bilibili.length;
      await persistSnapshot(snapshot);

      execution.running = false;
      if (activeExecution === execution) activeExecution = null;
    }
  }

  // ----------------- Chrome Runtime 消息侦听器 -----------------
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!message?.type?.startsWith("AUTHORIZED_CONTENT_")) return;
    if (!allowed(sender)) { respond({ ok: false, error: "不允许的采集入口" }); return; }

    (async () => {
      // 1. Gemini AI 共享助手配置
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
      if (message.type === "AUTHORIZED_CONTENT_BRIDGE_STATUS") {
        if (!sender.url?.startsWith(chrome.runtime.getURL("popup/")) || sender.id !== chrome.runtime.id) throw new Error("仅扩展设置可操作桥接");
        return { ok: true, ...(await globalThis.LPTFFDouyinBridge.status()) };
      }
      if (message.type === "AUTHORIZED_CONTENT_BRIDGE_SAVE") {
        if (!sender.url?.startsWith(chrome.runtime.getURL("popup/")) || sender.id !== chrome.runtime.id) throw new Error("仅扩展设置可操作桥接");
        return { ok: true, ...(await globalThis.LPTFFDouyinBridge.saveConfig(message.config || {})) };
      }

      // 2. 状态查询（包含持久化任务快照与各平台摘要）
      if (message.type === "AUTHORIZED_CONTENT_STATUS") {
        const stored = (await chrome.storage.local.get(CONTENT_KEY))[CONTENT_KEY] || {};
        const taskSnapshot = (await chrome.storage.local.get(TASK_KEY))[TASK_KEY] || null;
        const manifestVersion = chrome.runtime.getManifest().version;

        return {
          ok: true,
          version: manifestVersion,
          buildTag: getExtensionBuildTag(),
          extensionId: chrome.runtime?.id || "mobngggdpoodbnippllglhekfoneapao",
          task: taskSnapshot,
          resultVersion: stored.resultVersion || 0,
          platforms: Object.fromEntries(["douyin", "bilibili"].map((id) => [id, {
            state: activeExecution?.running ? "running" : stored[id]?.state || "idle",
            count: stored[id]?.items?.length || 0,
            updatedAt: stored[id]?.updatedAt || 0,
            sources: stored[id]?.sources || [],
          }])),
        };
      }

      // 3. 启动采集（支持一键启动全部、单平台、或断点续采）
      if (message.type === "AUTHORIZED_CONTENT_START" || message.type === "AUTHORIZED_CONTENT_START_ALL" || message.type === "AUTHORIZED_CONTENT_RESUME") {
        if (activeExecution?.running) {
          return { ok: false, error: "已有采集任务正在运行中，请等待完成或点击停止" };
        }
        const scope = message.type === "AUTHORIZED_CONTENT_START_ALL" ? "all" : (message.platform || "all");
        const resume = message.type === "AUTHORIZED_CONTENT_RESUME" || Boolean(message.resume);

        // 异步运行后台采集任务
        runCollection(scope, resume).catch(console.error);
        return { ok: true, message: "采集任务已启动" };
      }

      // 4. 停止采集
      if (message.type === "AUTHORIZED_CONTENT_STOP") {
        if (activeExecution) {
          activeExecution.cancelled = true;
          if (activeExecution.openTabIds) {
            for (const tid of activeExecution.openTabIds) {
              chrome.tabs.remove(tid).catch(() => {});
            }
          }
        }
        const taskSnapshot = (await chrome.storage.local.get(TASK_KEY))[TASK_KEY];
        if (taskSnapshot && taskSnapshot.phase === "running") {
          taskSnapshot.phase = "cancelled";
          taskSnapshot.updatedAt = Date.now();
          await persistSnapshot(taskSnapshot);
        }
        return { ok: true, message: "正在停止采集…" };
      }

      // 5. 打开来源平台 / 登录
      if (message.type === "AUTHORIZED_CONTENT_LOGIN") {
        const platform = message.platform || "bilibili";
        const cat = await catalog();
        const source = cat.find((item) => item.platform === platform) || cat[0];
        const existingLoginTab = activeExecution?.loginTabIds?.get(platform) || activeExecution?.loginTabId;
        if (existingLoginTab) {
          try {
            await chrome.tabs.update(existingLoginTab, { active: true });
            return { ok: true };
          } catch {}
        }
        await chrome.tabs.create({ url: sourceUrl(source) });
        return { ok: true };
      }

      // 6. 读取采集结果
      if (message.type === "AUTHORIZED_CONTENT_RESULT") {
        const stored = (await chrome.storage.local.get(CONTENT_KEY))[CONTENT_KEY] || {};
        const platform = message.platform;
        if (platform && !["douyin", "bilibili"].includes(platform)) throw new Error("未知平台");

        if (platform) {
          return {
            ok: true,
            resultVersion: stored.resultVersion || 0,
            items: stored[platform]?.items || [],
            updatedAt: stored[platform]?.updatedAt || 0,
            state: stored[platform]?.state || "idle",
            sources: stored[platform]?.sources || [],
          };
        }

        return {
          ok: true,
          resultVersion: stored.resultVersion || 0,
          douyin: stored.douyin || { items: [], updatedAt: 0, state: "idle", sources: [] },
          bilibili: stored.bilibili || { items: [], updatedAt: 0, state: "idle", sources: [] },
        };
      }

      throw new Error("未知采集操作: " + message.type);
    })().then(respond, (error) => respond({
      ok: false,
      error: message.type.startsWith("AUTHORIZED_CONTENT_AI_")
        ? String(error.message || "分析失败").slice(0, 400)
        : String(error.message || "采集操作失败"),
    }));

    return true;
  });
})();
