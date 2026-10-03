// 用户指定网页后，只记录该网页所在标签页及其播放器 iframe 的媒体请求。
(() => {
  const STORAGE_KEY = "lptffVideoCapture";
  const RECORD_KEY = "lptffVideoRecording";
  const MAX_ITEMS = 120;
  let state = { tabId: null, pageUrl: null, items: [] };
  let recording = null;
  const ready = chrome.storage.session.get([STORAGE_KEY, RECORD_KEY]).then((saved) => {
    const value = saved[STORAGE_KEY];
    if (value && Number.isInteger(value.tabId) && typeof value.pageUrl === "string" && Array.isArray(value.items)) state = value;
    recording = saved[RECORD_KEY] || null;
  }).catch(() => {});

  async function recordChunk(message, sender) {
    await ready;
    if (!recording || recording.id !== message.id || recording.tabId !== sender.tab?.id || recording.frameId !== sender.frameId || !['recording', 'stopping'].includes(recording.phase)) throw new Error('录制任务已结束');
    if (!Number.isSafeInteger(message.index) || message.index < 0 || !Array.isArray(message.bytes)) throw new Error('录制片段无效');
    const bytes = Uint8Array.from(message.bytes);
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('lptff-video-cache', 2);
      request.onupgradeneeded = () => {
        for (const [name, options] of [['chunks', { keyPath: ['jobId', 'index'] }], ['meta', { keyPath: 'jobId' }], ['source', { keyPath: ['jobId', 'index'] }]]) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, options);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction('source', 'readwrite');
        tx.objectStore('source').put({ jobId: message.id, index: message.index, bytes });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    recording.chunks = Math.max(recording.chunks, message.index + 1);
    recording.bytes += bytes.byteLength;
    await chrome.storage.session.set({ [RECORD_KEY]: recording });
    return { bytes: recording.bytes };
  }

  async function startRecording() {
    await ready;
    if (recording?.phase === 'recording' || recording?.phase === 'stopping') throw new Error('已有正在进行的录制，请先停止');
    if (state.tabId === null) throw new Error('请先指定并打开视频网页');
    const tab = await chrome.tabs.get(state.tabId);
    const frames = await chrome.scripting.executeScript({
      target: { tabId: state.tabId, allFrames: true },
      func: () => Array.from(document.querySelectorAll('video')).map((video, index) => ({
        index,
        area: (video.videoWidth || video.clientWidth || 0) * (video.videoHeight || video.clientHeight || 0),
        playing: !video.paused && !video.ended,
        blob: (video.currentSrc || video.src || '').startsWith('blob:'),
        ready: video.readyState >= 2,
      })),
    });
    const choices = frames.flatMap((frame) => (frame.result || []).filter((item) => item.ready).map((item) => ({ ...item, frameId: frame.frameId })));
    choices.sort((a, b) => (Number(b.playing) * 1e9 + Number(b.blob) * 1e8 + b.area) - (Number(a.playing) * 1e9 + Number(a.blob) * 1e8 + a.area));
    const selected = choices[0];
    if (!selected) throw new Error('页面中没有已开始播放的视频，请先播放再录制');
    await chrome.scripting.executeScript({ target: { tabId: state.tabId, frameIds: [selected.frameId] }, files: ['content/video-recorder.js'] });
    const id = crypto.randomUUID();
    recording = { id, tabId: state.tabId, frameId: selected.frameId, phase: 'recording', bytes: 0, chunks: 0, title: tab.title || '网页视频录制', startedAt: Date.now() };
    await chrome.storage.session.set({ [RECORD_KEY]: recording });
    const result = await chrome.tabs.sendMessage(state.tabId, { type: 'VIDEO_RECORD_START_FRAME', id, index: selected.index }, { frameId: selected.frameId });
    if (!result?.ok) {
      recording = null;
      await chrome.storage.session.remove(RECORD_KEY);
      throw new Error(result?.error || '无法开始录制');
    }
    recording.mimeType = result.mimeType;
    recording.tracks = result.tracks;
    await chrome.storage.session.set({ [RECORD_KEY]: recording, [`lptffVideoJob:${id}`]: { type: 'record', title: recording.title, createdAt: Date.now() } });
    await chrome.tabs.create({ url: chrome.runtime.getURL(`video/record.html#${id}`) });
    return { ...(await status()), opened: true };
  }

  async function stopRecording(id) {
    await ready;
    if (!recording || recording.id !== id) throw new Error('录制任务已失效');
    if (recording.phase !== 'recording') return { recording };
    recording.phase = 'stopping';
    await chrome.storage.session.set({ [RECORD_KEY]: recording });
    let result;
    try { result = await chrome.tabs.sendMessage(recording.tabId, { type: 'VIDEO_RECORD_STOP_FRAME', id }, { frameId: recording.frameId }); }
    catch (error) {
      recording.phase = 'error';
      recording.error = '来源页已关闭或播放器已失效';
      await chrome.storage.session.set({ [RECORD_KEY]: recording });
      throw error;
    }
    if (!result?.ok) {
      recording.phase = 'error';
      recording.error = result?.error || '无法停止录制';
      await chrome.storage.session.set({ [RECORD_KEY]: recording });
      throw new Error(recording.error);
    }
    return { recording };
  }

  function pageKey(url) {
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return "";
      parsed.hash = "";
      return parsed.href;
    } catch { return ""; }
  }

  function captureMatches(details) {
    return details.tabId === state.tabId && Boolean(state.pageUrl);
  }

  function senderAllowed(sender) {
    try {
      const url = new URL(sender?.url || "");
      return url.pathname === "/devtools/video-download"
        && (url.origin === "https://lptff.github.io"
          || (["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "8090"));
    } catch { return false; }
  }

  function mediaType(url, contentType = "") {
    const path = new URL(url).pathname.toLowerCase();
    const mime = contentType.toLowerCase().split(";")[0].trim();
    if (/\.m3u8?$/.test(path) || ["application/vnd.apple.mpegurl", "application/x-mpegurl", "audio/mpegurl"].includes(mime)) return "hls";
    if (/\.(mp4|m4v|webm|mov|mp3|m4a|ogg)$/.test(path) || /^(video|audio)\/(mp4|webm|quicktime|mpeg|x-m4a|ogg)$/.test(mime)) return "file";
    return "";
  }

  function visibleItem(item) {
    const url = new URL(item.url);
    const parts = url.pathname.split("/").filter(Boolean).slice(-3).map((part) => {
      if (part.length > 24) return "…";
      try { return decodeURI(part); } catch { return part; }
    });
    return { id: item.id, type: item.type, label: `${url.hostname}/…/${parts.join("/") || "媒体文件"}`, detectedAt: item.detectedAt, sourceStatus: item.sourceStatus || null };
  }

  function sourceOrigin(value) {
    try {
      const parsed = new URL(value);
      return /^https?:$/.test(parsed.protocol) ? `${parsed.origin}/` : null;
    } catch { return null; }
  }

  async function remember(url, type, initiator = null) {
    await ready;
    if (!type) return;
    let parsed;
    try { parsed = new URL(url); } catch { return; }
    if (!/^https?:$/.test(parsed.protocol)) return;
    const referrer = sourceOrigin(initiator);
    const existing = state.items.find((item) => item.url === url);
    if (existing) {
      if (referrer && existing.referrer !== referrer) {
        existing.referrer = referrer;
        await chrome.storage.session.set({ [STORAGE_KEY]: state });
      }
      return;
    }
    state.items.unshift({ id: crypto.randomUUID(), url, type, referrer, detectedAt: Date.now() });
    state.items.length = Math.min(state.items.length, MAX_ITEMS);
    await chrome.storage.session.set({ [STORAGE_KEY]: state });
  }

  chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (captureMatches(details)) void remember(details.url, mediaType(details.url), details.initiator);
  }, { urls: ["http://*/*", "https://*/*"] });

  chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (!captureMatches(details)) return;
    const contentType = details.responseHeaders?.find((header) => header.name.toLowerCase() === "content-type")?.value || "";
    void remember(details.url, mediaType(details.url, contentType), details.initiator);
  }, { urls: ["http://*/*", "https://*/*"] }, ["responseHeaders"]);

  chrome.webRequest.onCompleted.addListener((details) => {
    if (!captureMatches(details)) return;
    const item = state.items.find((entry) => entry.url === details.url);
    if (!item) return;
    item.sourceStatus = details.statusCode >= 400 ? `源站返回 HTTP ${details.statusCode}` : "源站已响应";
    void chrome.storage.session.set({ [STORAGE_KEY]: state });
  }, { urls: ["http://*/*", "https://*/*"] });

  chrome.webRequest.onErrorOccurred.addListener((details) => {
    if (!captureMatches(details)) return;
    const item = state.items.find((entry) => entry.url === details.url);
    if (!item || item.sourceStatus?.startsWith("源站返回 HTTP")) return;
    item.sourceStatus = "播放器请求失败";
    void chrome.storage.session.set({ [STORAGE_KEY]: state });
  }, { urls: ["http://*/*", "https://*/*"] });

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (state.tabId === tabId) {
      state = { tabId: null, pageUrl: null, items: [] };
      void chrome.storage.session.set({ [STORAGE_KEY]: state });
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void chrome.declarativeNetRequest.getSessionRules().then((rules) => {
      const removeRuleIds = rules.filter((rule) => rule.condition?.tabIds?.includes(tabId) && rule.id >= 10000 && rule.id < 100000).map((rule) => rule.id);
      if (removeRuleIds.length) return chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds });
    }).catch(() => {});
  });

  async function openMediaTab(path, item) {
    const extensionUrl = chrome.runtime.getURL(path);
    const referrer = sourceOrigin(item.referrer);
    if (!referrer) return chrome.tabs.create({ url: extensionUrl });
    const tab = await chrome.tabs.create({ url: 'about:blank' });
    try {
      const existing = await chrome.declarativeNetRequest.getSessionRules();
      const id = Math.max(9999, ...existing.filter((rule) => rule.id >= 10000 && rule.id < 100000).map((rule) => rule.id)) + 1;
      if (id >= 100000) throw new Error('媒体请求规则已满');
      await chrome.declarativeNetRequest.updateSessionRules({ addRules: [{
        id,
        priority: 1000,
        action: { type: 'modifyHeaders', requestHeaders: [
          { header: 'referer', operation: 'set', value: referrer },
          { header: 'origin', operation: 'remove' },
        ] },
        condition: { tabIds: [tab.id], requestDomains: [new URL(item.url).hostname], resourceTypes: ['xmlhttprequest', 'media', 'other'] },
      }] });
      await chrome.tabs.update(tab.id, { url: extensionUrl });
      return tab;
    } catch (error) {
      await chrome.tabs.remove(tab.id).catch(() => {});
      throw new Error(`无法按来源页读取媒体：${error?.message || error}`);
    }
  }

  async function scanCurrentMedia(tabId) {
    try {
      const frames = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: () => Array.from(document.querySelectorAll("video, audio, source"))
          .flatMap((node) => [node.currentSrc, node.src].filter(Boolean)).slice(0, 30),
      });
      for (const frame of frames) for (const url of frame.result || []) {
        if (/^https?:\/\//.test(url)) await remember(url, mediaType(url));
      }
    } catch { /* 有些受限 frame 无法注入；网络请求仍可被发现。 */ }
  }

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId !== state.tabId) return;
    if (changeInfo.url === "about:blank") return;
    if (changeInfo.url && pageKey(changeInfo.url) !== state.pageUrl) {
      state = { tabId: null, pageUrl: null, items: [] };
      void chrome.storage.session.set({ [STORAGE_KEY]: state });
      return;
    }
    if (changeInfo.status === "complete" && pageKey(tab.url) === state.pageUrl) void scanCurrentMedia(tabId);
  });

  async function startPage(rawUrl) {
    const pageUrl = pageKey(rawUrl);
    if (!pageUrl || pageUrl.length > 4096) throw new Error("请输入完整的 HTTP 或 HTTPS 网页地址");
    const parsed = new URL(pageUrl);
    if (["localhost", "127.0.0.1"].includes(parsed.hostname) && parsed.port === "8090") throw new Error("请输入视频所在网页地址，而非本工具地址");
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((tab) => pageKey(tab.url) === pageUrl);
    const tab = existing || await chrome.tabs.create({ url: "about:blank", active: false });
    state = { tabId: tab.id, pageUrl, items: [] };
    await chrome.storage.session.set({ [STORAGE_KEY]: state });
    if (existing) await chrome.tabs.reload(tab.id, { bypassCache: true });
    else await chrome.tabs.update(tab.id, { url: pageUrl });
    return { ...(await status()), opened: !existing };
  }

  async function status() {
    await ready;
    const keys = state.items.filter((item) => item.type === "hls").map((item) => `lptffVideoResult:${item.id}`);
    const jobStates = keys.length ? await chrome.storage.session.get(keys) : {};
    const fileJobs = new Map(await Promise.all(state.items.filter((item) => Number.isInteger(item.downloadId)).map(async (item) => {
      const [download] = await chrome.downloads.search({ id: item.downloadId }).catch(() => []);
      if (!download) return [item.id, { phase: 'error', stage: '保存普通媒体', percent: 0, message: '下载任务已失效' }];
      const percent = download.state === 'complete' ? 100 : download.totalBytes > 0 ? Math.min(99, Math.round(download.bytesReceived / download.totalBytes * 100)) : 0;
      const phase = download.state === 'interrupted' ? 'error' : download.state === 'complete' ? 'saved' : 'saving';
      const message = download.state === 'interrupted' ? '保存普通媒体已中断' : download.totalBytes > 0 || download.state === 'complete' ? `保存普通媒体 ${percent}%` : '等待选择保存位置 · 0%';
      return [item.id, { phase, stage: '保存普通媒体', percent, message }];
    })));
    const page = state.pageUrl ? new URL(state.pageUrl) : null;
    return { activeTabId: state.tabId, pageLabel: page ? `${page.hostname}${page.pathname.slice(0, 100)}` : null, items: state.items.map((item) => ({ ...visibleItem(item), job: fileJobs.get(item.id) || jobStates[`lptffVideoResult:${item.id}`] || null })), recording: recording ? { id: recording.id, phase: recording.phase, bytes: recording.bytes, chunks: recording.chunks } : null };
  }

  async function act(message, sender) {
    if (!senderAllowed(sender)) throw new Error("无权访问视频下载功能");
    await ready;
    switch (message.type) {
      case "VIDEO_CAPTURE_STATUS": return status();
      case "VIDEO_CAPTURE_START_PAGE": return startPage(String(message.pageUrl || "").trim());
      case "VIDEO_CAPTURE_STOP":
        state = { tabId: null, pageUrl: null, items: [] };
        await chrome.storage.session.set({ [STORAGE_KEY]: state });
        return status();
      case "VIDEO_CAPTURE_PREVIEW": {
        const item = state.items.find((entry) => entry.id === message.id);
        if (!item) throw new Error("媒体地址已失效，请重新捕获");
        await chrome.storage.session.set({ [`lptffVideoPreview:${item.id}`]: { url: item.url, type: item.type, title: (await chrome.tabs.get(state.tabId).catch(() => null))?.title || "媒体预览", createdAt: Date.now() } });
        await openMediaTab(`video/preview.html#${item.id}`, item);
        return { opened: true };
      }
      case "VIDEO_CAPTURE_RECORD_START": return startRecording();
      case "VIDEO_CAPTURE_RECORD_STOP": return stopRecording(String(message.id || ''));
      case "VIDEO_CAPTURE_DOWNLOAD": {
        const item = state.items.find((entry) => entry.id === message.id);
        if (!item) throw new Error("媒体地址已失效，请重新捕获");
        if (item.type === "file") {
          const path = new URL(item.url).pathname;
          const filename = decodeURIComponent(path.split("/").pop() || "video.mp4").replace(/[\\/:*?"<>|]/g, "_").slice(0, 180);
          const downloadId = await chrome.downloads.download({ url: item.url, filename, saveAs: true });
          item.downloadId = downloadId;
          await chrome.storage.session.set({ [STORAGE_KEY]: state });
          return { ...(await status()), downloadId };
        }
        const sourceTab = state.tabId === null ? null : await chrome.tabs.get(state.tabId).catch(() => null);
        await chrome.storage.session.set({ [`lptffVideoJob:${item.id}`]: { url: item.url, title: sourceTab?.title || "video", createdAt: Date.now() } });
        await chrome.storage.session.set({ [`lptffVideoResult:${item.id}`]: { phase: "opening", stage: "打开下载页", percent: 0, message: "打开下载页 0%" } });
        await openMediaTab(`video/downloader.html#${item.id}`, item);
        return { opened: true };
      }
      default: throw new Error("未知视频操作");
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (String(message?.type || '').startsWith('VIDEO_RECORD_')) {
      (async () => {
        await ready;
        if (message.type === 'VIDEO_RECORD_STOP' && sender.url?.startsWith(chrome.runtime.getURL('video/record.html'))) return stopRecording(String(message.id || ''));
        if (message.type === 'VIDEO_RECORD_CHUNK') return recordChunk(message, sender);
        if (recording?.id !== message.id || recording.tabId !== sender.tab?.id || recording.frameId !== sender.frameId) throw new Error('录制任务无效');
        if (message.type === 'VIDEO_RECORD_COMPLETE') {
          if (recording.phase === 'error') return { error: recording.error };
          recording.phase = 'complete';
          recording.chunks = Math.max(recording.chunks, Number(message.chunks) || 0);
          await chrome.storage.session.set({ [RECORD_KEY]: recording });
          return { complete: true };
        }
        if (message.type === 'VIDEO_RECORD_ERROR') {
          recording.phase = 'error';
          recording.error = String(message.error || '录制失败').slice(0, 300);
          await chrome.storage.session.set({ [RECORD_KEY]: recording });
          return { error: recording.error };
        }
        throw new Error('未知录制操作');
      })().then((result) => sendResponse({ ok: true, ...result })).catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }
    if (!String(message?.type || "").startsWith("VIDEO_CAPTURE_")) return false;
    act(message, sender).then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  });
})();
