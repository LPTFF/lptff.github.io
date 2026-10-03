(() => {
  const variantSelect = document.querySelector("#variant");
  const filenameInput = document.querySelector("#filename");
  const threadsStatus = document.querySelector("#auto-threads");
  const downloadButton = document.querySelector("#download");
  const stopButton = document.querySelector("#stop");
  const saveButton = document.querySelector("#save");
  const clearButton = document.querySelector("#clear");
  const stageLabel = document.querySelector("#stage");
  const progress = document.querySelector("#progress");
  const status = document.querySelector("#status");
  const jobId = location.hash.slice(1);
  let variants = [];
  let job;
  let prepared = null;
  let prepareVersion = 0;
  let lastReport = 0;
  let currentStage = '分析播放列表';
  let currentPercent = 0;
  let cached = null;
  let busy = false;
  let stopRequested = false;
  let wakePoll = null;
  let restartVariant = false;
  let fetchController = null;

  const dbName = "lptff-video-cache";
  function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("chunks")) request.result.createObjectStore("chunks", { keyPath: ["jobId", "index"] });
        if (!request.result.objectStoreNames.contains("meta")) request.result.createObjectStore("meta", { keyPath: "jobId" });
        if (!request.result.objectStoreNames.contains("source")) request.result.createObjectStore("source", { keyPath: ["jobId", "index"] });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function cacheRead(store, key) {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function cachePut(store, value) {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }

  async function clearCache() {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(["chunks", "meta", "source"], "readwrite");
        tx.objectStore("meta").delete(jobId);
        const range = IDBKeyRange.bound([jobId, Number.MIN_SAFE_INTEGER], [jobId, Number.MAX_SAFE_INTEGER]);
        tx.objectStore("chunks").delete(range);
        tx.objectStore("source").delete(range);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    cached = null;
    saveButton.hidden = true;
    clearButton.hidden = true;
  }

  async function clearSource() {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction("source", "readwrite");
        tx.objectStore("source").delete(IDBKeyRange.bound([jobId, Number.MIN_SAFE_INTEGER], [jobId, Number.MAX_SAFE_INTEGER]));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }

  function showCache(meta) {
    cached = meta;
    saveButton.hidden = false;
    clearButton.hidden = false;
    downloadButton.disabled = false;
    show(`缓存完成：${(meta.bytes / 1024 / 1024).toFixed(1)} MB，点击“保存文件”选择保存位置`);
    updateStage('cached', '本地缓存完成', 100, '等待保存文件', true);
  }

  function report(phase, message, force = false) {
    const now = Date.now();
    if (!force && now - lastReport < 500) return;
    lastReport = now;
    void chrome.storage.session.set({ [`lptffVideoResult:${jobId}`]: { phase, stage: currentStage, percent: currentPercent, message, updatedAt: now } });
  }

  function updateStage(phase, label, percent, detail = '', force = false) {
    currentStage = label;
    currentPercent = Math.max(0, Math.min(100, Math.round(percent)));
    stageLabel.textContent = `${label} · ${currentPercent}%`;
    progress.max = 100;
    progress.value = currentPercent;
    progress.hidden = false;
    report(phase, `${label} ${currentPercent}%${detail ? ` · ${detail}` : ''}`, force || currentPercent === 0 || currentPercent === 100);
  }

  function show(message, error = false) {
    status.textContent = message;
    status.classList.toggle("error", error);
  }

  async function getText(url) {
    const response = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!response.ok) {
      if (response.status === 403) {
        const body = (await response.text()).slice(0, 12000);
        if (/Website Access Blocked|Cloudflare has restricted access/i.test(body)) {
          throw new Error("媒体源被 Cloudflare 封锁（HTTP 403）；原站播放器也无法读取，请等待源站恢复或更换播放线路");
        }
      }
      throw new Error(`播放列表请求失败（HTTP ${response.status}）；请确认原站能正常播放`);
    }
    return response.text();
  }

  function attrs(line) {
    const result = {};
    for (const match of line.matchAll(/([A-Z-]+)=("[^"]*"|[^,]*)/g)) result[match[1]] = match[2].replace(/^"|"$/g, "");
    return result;
  }

  function parseMaster(text, base) {
    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const found = [];
    const audioGroups = new Map();
    for (const line of lines) {
      if (!line.startsWith('#EXT-X-MEDIA:')) continue;
      const media = attrs(line.slice(13));
      if (media.TYPE === 'AUDIO' && media['GROUP-ID'] && media.URI) {
        const tracks = audioGroups.get(media['GROUP-ID']) || [];
        tracks.push({ url: new URL(media.URI, base).href, label: media.NAME || media.LANGUAGE || '音轨', default: media.DEFAULT === 'YES' });
        audioGroups.set(media['GROUP-ID'], tracks);
      }
    }
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].startsWith("#EXT-X-STREAM-INF:")) continue;
      const attributes = attrs(lines[index].slice(18));
      const uri = lines.slice(index + 1).find((line) => line && !line.startsWith("#"));
      if (!uri) continue;
      const tracks = audioGroups.get(attributes.AUDIO) || [];
      found.push({ url: new URL(uri, base).href, label: [attributes.RESOLUTION, attributes["FRAME-RATE"] && `${attributes["FRAME-RATE"]} fps`, attributes.BANDWIDTH && `${Math.round(Number(attributes.BANDWIDTH) / 1000)} kbps`].filter(Boolean).join(" · ") || `清晰度 ${found.length + 1}`, bandwidth: Number(attributes.BANDWIDTH) || 0, audio: tracks.find((track) => track.default) || tracks[0] || null });
    }
    return found.sort((a, b) => b.bandwidth - a.bandwidth);
  }

  function parseMedia(text, base) {
    if (!text.startsWith("#EXTM3U")) throw new Error("不是有效的 M3U8 播放列表");
    if (/#EXT-X-KEY:|#EXT-X-SESSION-KEY:/i.test(text)) throw new Error("该视频使用加密保护，当前不支持下载");
    if (/#EXT-X-I-FRAMES-ONLY/i.test(text)) throw new Error("该播放列表仅包含预览帧，不是完整视频");
    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const segments = [];
    const maps = [];
    let mapIndex = -1;
    let pendingRange = null;
    let previousRange = null;
    let discontinuity = false;
    let duration = 0;
    for (const line of lines) {
      if (line.startsWith("#EXT-X-MAP:")) {
        const info = attrs(line.slice(11));
        if (!info.URI) throw new Error("初始化片段缺少地址");
        const url = new URL(info.URI, base).href;
        const nextMap = { url, range: info.BYTERANGE ? byteRange(info.BYTERANGE, url, null) : null };
        mapIndex = maps.findIndex((value) => value.url === nextMap.url && JSON.stringify(value.range) === JSON.stringify(nextMap.range));
        if (mapIndex < 0) mapIndex = maps.push(nextMap) - 1;
      } else if (line === "#EXT-X-DISCONTINUITY") discontinuity = true;
      else if (line.startsWith("#EXT-X-BYTERANGE:")) pendingRange = line.slice(17);
      else if (line.startsWith("#EXTINF:")) duration = Number(line.slice(8).split(",")[0]) || 0;
      else if (line && !line.startsWith("#")) {
        const url = new URL(line, base).href;
        const range = pendingRange ? byteRange(pendingRange, url, previousRange) : null;
        segments.push({ url, range, discontinuity, duration, mapIndex });
        previousRange = range ? { ...range, url } : null;
        pendingRange = null;
        discontinuity = false;
        duration = 0;
      }
    }
    if (!segments.length) throw new Error("播放列表没有媒体片段");
    return {
      segments,
      maps,
      map: maps[0] || null,
      live: !lines.includes("#EXT-X-ENDLIST"),
      targetDuration: Math.max(1, Number(lines.find((line) => line.startsWith("#EXT-X-TARGETDURATION:"))?.slice(22)) || 4),
      sequence: Number(lines.find((line) => line.startsWith("#EXT-X-MEDIA-SEQUENCE:"))?.slice(22)) || 0,
    };
  }

  function byteRange(value, url, previous) {
    const match = /^(\d+)(?:@(\d+))?$/.exec(value);
    if (!match) throw new Error("媒体字节范围格式无效");
    const length = Number(match[1]);
    const start = match[2] === undefined ? (previous?.url === url ? previous.end + 1 : NaN) : Number(match[2]);
    if (!Number.isSafeInteger(length) || length < 1 || !Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(start + length - 1)) throw new Error("媒体字节范围缺少起点或数值无效");
    return { start, end: start + length - 1 };
  }

  async function getBytes(resource, signal) {
    const headers = resource.range ? { Range: `bytes=${resource.range.start}-${resource.range.end}` } : {};
    const response = await fetch(resource.url, { credentials: "include", cache: "no-store", headers, signal });
    if (!response.ok) {
      const error = new Error(`媒体片段请求失败（HTTP ${response.status}）`);
      error.status = response.status;
      throw error;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!resource.range) return bytes;
    const expected = resource.range.end - resource.range.start + 1;
    if (response.status === 206 && bytes.byteLength === expected) return bytes;
    if (response.status === 200 && bytes.byteLength > resource.range.end) return bytes.slice(resource.range.start, resource.range.end + 1);
    throw new Error("媒体服务器未正确返回指定字节范围");
  }

  function adaptiveConnections() {
    const memory = Number(navigator.deviceMemory) || 8;
    let maximum = memory <= 2 ? 6 : memory <= 4 ? 12 : memory <= 8 ? 20 : 24;
    let limit = Math.min(4, maximum);
    let peak = limit;
    let windowStart = performance.now();
    let windowBytes = 0;
    let windowCount = 0;
    let previousRate = 0;
    let speed = 0;
    let averageSize = 0;
    const render = () => { threadsStatus.textContent = `自动并发：${limit} / ${maximum} 路 · ${speed.toFixed(1)} MB/s`; };
    render();
    return {
      get limit() { return limit; },
      get peak() { return peak; },
      get speed() { return speed; },
      success(bytes) {
        averageSize = averageSize ? averageSize * 0.8 + bytes * 0.2 : bytes;
        const memoryCeiling = averageSize > 16 * 1024 * 1024 ? 4 : averageSize > 4 * 1024 * 1024 ? 8 : 24;
        maximum = Math.min(maximum, memoryCeiling);
        limit = Math.min(limit, maximum);
        windowBytes += bytes;
        windowCount += 1;
        const now = performance.now();
        const elapsed = Math.max((now - windowStart) / 1000, 0.001);
        if (windowCount >= Math.max(4, Math.ceil(limit * 1.5)) || elapsed >= 2 && windowCount >= 2) {
          const rate = windowBytes / elapsed / 1024 / 1024;
          speed = speed ? speed * 0.35 + rate * 0.65 : rate;
          if (!previousRate || rate >= previousRate * 1.08) limit = Math.min(maximum, limit + 2);
          else if (rate < previousRate * 0.78) limit = Math.max(1, limit - Math.max(1, Math.ceil(limit / 4)));
          else if (rate >= previousRate * 0.94) limit = Math.min(maximum, limit + 1);
          previousRate = rate;
          peak = Math.max(peak, limit);
          windowStart = now;
          windowBytes = 0;
          windowCount = 0;
          render();
        }
      },
      pressure() {
        limit = Math.max(1, Math.ceil(limit / 2));
        windowStart = performance.now();
        windowBytes = 0;
        windowCount = 0;
        previousRate = 0;
        render();
      },
      finish() { threadsStatus.textContent = `自动并发：已完成 · 峰值 ${peak} 路`; },
    };
  }

  async function saveCached() {
    if (!cached || busy) return;
    const filename = (filenameInput.value.trim() || cached.filename).replace(/[\\/:*?"<>|]/g, "_").replace(/\.mp4$/i, "") + ".mp4";
    // The picker must be opened directly from the click handler's user activation.
    let handle;
    try {
      if (typeof showSaveFilePicker === "function") handle = await showSaveFilePicker({ suggestedName: filename, types: [{ description: "MP4 视频", accept: { "video/mp4": [".mp4"] } }] });
    } catch (error) {
      if (error?.name !== "AbortError") show(error?.message || "无法选择保存位置", true);
      return;
    }
    busy = true;
    saveButton.disabled = true;
    updateStage('saving', '保存文件', 0, '正在写入所选位置', true);
    let stream;
    try {
      if (handle) stream = await handle.createWritable();
      const chunks = handle ? null : [];
      for (let index = 0; index < cached.count; index += 1) {
        const entry = await cacheRead("chunks", [jobId, index]);
        if (!entry) throw new Error(`缓存片段 ${index + 1} 已丢失，请重新缓存`);
        if (stream) await stream.write(entry.bytes);
        else chunks.push(entry.bytes);
        if (index % 10 === 0 || index + 1 === cached.count) {
          show(`正在保存文件：${index + 1} / ${cached.count}`);
          updateStage('saving', '保存文件', (index + 1) / cached.count * 99, `${index + 1} / ${cached.count}`);
        }
      }
      if (stream) await stream.close();
      else {
        const objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      }
      stream = null;
      show(`已保存 ${filename}；缓存仍保留，可再次保存或手动清除`);
      updateStage('saved', '保存文件', 100, `已保存 ${filename}`, true);
    } catch (error) {
      if (stream) await stream.abort().catch(() => {});
      show(error?.message || "保存失败", true);
      report("error", error?.message || "保存失败", true);
    } finally { busy = false; saveButton.disabled = false; }
  }

  function localPlaylist(playlist, prefix = '') {
    const extension = playlist.maps.length ? "m4s" : "ts";
    const maxDuration = playlist.segments.reduce((maximum, segment) => Math.max(maximum, segment.duration), 1);
    const lines = ["#EXTM3U", `#EXT-X-VERSION:${playlist.maps.length ? 7 : 3}`, `#EXT-X-TARGETDURATION:${Math.ceil(maxDuration)}`, "#EXT-X-PLAYLIST-TYPE:VOD", "#EXT-X-MEDIA-SEQUENCE:0"];
    let previousMap = -1;
    playlist.segments.forEach((segment, index) => {
      if (segment.discontinuity) lines.push("#EXT-X-DISCONTINUITY");
      if (segment.mapIndex >= 0 && segment.mapIndex !== previousMap) lines.push(`#EXT-X-MAP:URI="${prefix}init-${segment.mapIndex}.mp4"`);
      previousMap = segment.mapIndex;
      lines.push(`#EXTINF:${segment.duration.toFixed(6)},`, `${prefix}segment-${index}.${extension}`);
    });
    lines.push("#EXT-X-ENDLIST", "");
    return new TextEncoder().encode(lines.join("\n"));
  }

  async function transcode(playlist, audioPlaylist = null) {
    if (typeof globalThis.FFmpegWASM?.FFmpeg !== "function") throw new Error("MP4 合成组件未正确加载，请刷新扩展页面后重试");
    const ffmpeg = new FFmpegWASM.FFmpeg();
    const extension = playlist.maps.length ? "m4s" : "ts";
    const errors = [];
    ffmpeg.on("log", ({ message }) => {
      if (/error|invalid|failed|not found|unsupported/i.test(message)) {
        errors.push(message.slice(0, 180));
        if (errors.length > 4) errors.shift();
      }
    });
    let outputBytes = 0;
    let chunkCount = 0;
    try {
      show("正在加载本机 MP4 合成组件…");
      updateStage('processing', '加载合成组件', 0, '', true);
      await ffmpeg.load({
        coreURL: chrome.runtime.getURL("vendor/ffmpeg-core.js"),
        wasmURL: chrome.runtime.getURL("vendor/ffmpeg-core.wasm"),
      });
      updateStage('processing', '加载合成组件', 100, '', true);
      const totalAssets = playlist.maps.length + playlist.segments.length + (audioPlaylist?.maps.length || 0) + (audioPlaylist?.segments.length || 0);
      let processedAssets = 0;
      const assetReady = () => {
        processedAssets += 1;
        if (processedAssets % 10 === 0 || processedAssets === totalAssets) updateStage('processing', '整理本地媒体', processedAssets / totalAssets * 100, `${processedAssets} / ${totalAssets}`);
      };
      updateStage('processing', '整理本地媒体', 0, `0 / ${totalAssets}`, true);
      for (let index = 0; index < playlist.maps.length; index += 1) {
        const init = await cacheRead("source", [jobId, -index - 1]);
        if (!init) throw new Error(`初始化片段 ${index + 1} 缓存已丢失`);
        await ffmpeg.writeFile(`init-${index}.mp4`, init.bytes);
        assetReady();
      }
      for (let index = 0; index < playlist.segments.length; index += 1) {
        const entry = await cacheRead("source", [jobId, index]);
        if (!entry) throw new Error(`媒体片段 ${index + 1} 缓存已丢失`);
        await ffmpeg.writeFile(`segment-${index}.${extension}`, entry.bytes);
        assetReady();
        if (index % 20 === 0 || index + 1 === playlist.segments.length) show(`正在整理本地媒体：${index + 1} / ${playlist.segments.length}`);
      }
      await ffmpeg.writeFile("input.m3u8", localPlaylist(playlist));
      if (audioPlaylist) {
        const audioExtension = audioPlaylist.maps.length ? 'm4s' : 'ts';
        for (let index = 0; index < audioPlaylist.maps.length; index += 1) {
          const init = await cacheRead('source', [jobId, -10000000 - index]);
          if (!init) throw new Error(`音轨初始化片段 ${index + 1} 缓存已丢失`);
          await ffmpeg.writeFile(`audio-init-${index}.mp4`, init.bytes);
          assetReady();
        }
        for (let index = 0; index < audioPlaylist.segments.length; index += 1) {
          const entry = await cacheRead('source', [jobId, 10000000 + index]);
          if (!entry) throw new Error(`音轨片段 ${index + 1} 缓存已丢失`);
          await ffmpeg.writeFile(`audio-segment-${index}.${audioExtension}`, entry.bytes);
          assetReady();
        }
        await ffmpeg.writeFile('audio.m3u8', localPlaylist(audioPlaylist, 'audio-'));
      }
      let synthesisPercent = 0;
      ffmpeg.on("progress", ({ progress: ratio }) => {
        if (Number.isFinite(ratio) && ratio >= 0) {
          synthesisPercent = Math.max(synthesisPercent, Math.min(99, Math.round(ratio * 100)));
          show(`正在合成可播放 MP4：${synthesisPercent}%`);
          updateStage('processing', '合成 MP4', synthesisPercent);
        }
      });
      show("正在合成可播放 MP4…");
      updateStage('processing', '合成 MP4', 0, '', true);
      const args = ["-hide_banner", "-loglevel", "error", "-allowed_extensions", "ALL", "-i", "input.m3u8"];
      if (audioPlaylist) args.push('-i', 'audio.m3u8');
      args.push('-map', '0:v:0', '-map', audioPlaylist ? '1:a:0' : '0:a:0?', '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-movflags', '+faststart', 'output.mp4');
      const code = await ffmpeg.exec(args);
      if (code !== 0) throw new Error(`MP4 合成失败（代码 ${code}）${errors.length ? `：${errors.join("；")}` : ""}`);
      updateStage('processing', '合成 MP4', 100, '', true);
      updateStage('processing', '写入本地缓存', 0, '', true);
      const output = await ffmpeg.readFile("output.mp4");
      if (!(output instanceof Uint8Array) || output.byteLength < 1024 || new TextDecoder().decode(output.subarray(4, 8)) !== "ftyp") throw new Error("合成结果不是有效的 MP4 文件");
      for (let offset = 0; offset < output.byteLength; offset += 8 * 1024 * 1024) {
        const bytes = output.slice(offset, offset + 8 * 1024 * 1024);
        await cachePut("chunks", { jobId, index: chunkCount++, bytes });
        outputBytes += bytes.byteLength;
        updateStage('processing', '写入本地缓存', outputBytes / output.byteLength * 100, `${(outputBytes / 1024 / 1024).toFixed(1)} MB`);
      }
      return { count: chunkCount, bytes: outputBytes };
    } finally { ffmpeg.terminate(); }
  }

  async function download() {
    const filename = (filenameInput.value.trim() || "video.mp4").replace(/[\\/:*?"<>|]/g, "_").replace(/\.mp4$/i, "") + ".mp4";
    if (busy) return;
    busy = true;
    restartVariant = false;
    fetchController = new AbortController();
    downloadButton.disabled = true;
    try {
      const selected = variants[Number(variantSelect.value)];
      if (!prepared || prepared.url !== selected.url) throw new Error("播放列表尚未准备好，请稍后重试");
      const playlist = prepared.playlist;
      const audioPlaylist = prepared.audioPlaylist;
      variantSelect.disabled = false;
      await clearCache();
      stopRequested = false;
      stopButton.hidden = !playlist.live;
      stopButton.disabled = false;
      updateStage('caching', playlist.live ? '直播本轮缓存' : '缓存媒体片段', 0, '', true);
      const output = { ...playlist, maps: [], segments: [], live: false };
      const audioOutput = audioPlaylist ? { ...audioPlaylist, maps: [], segments: [], live: false } : null;
      const seen = new Set();
      const audioSeen = new Set();
      let totalBytes = 0;
      const startedAt = performance.now();
      const connections = adaptiveConnections();
      const plannedSegments = playlist.segments.length + (audioPlaylist?.segments.length || 0);
      const fetchSegment = async (segment) => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          if (fetchController.signal.aborted) throw new Error('下载已中断');
          try { return await getBytes(segment, fetchController.signal); }
          catch (error) {
            const retryable = error?.status === 429 || error?.status >= 500 || error instanceof TypeError;
            if (!retryable || attempt === 2 || fetchController.signal.aborted) throw error;
            connections.pressure();
            await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
          }
        }
      };
      const downloadBatch = async (batch, destination, sourceOffset) => {
        if (!batch.length) return;
        if (playlist.live) updateStage('caching', sourceOffset ? '直播音轨本轮缓存' : '直播视频本轮缓存', 0, `0 / ${batch.length}`, true);
        const baseIndex = destination.segments.length;
        let next = 0;
        let active = 0;
        let completed = 0;
        let failure = null;
        await new Promise((resolve, reject) => {
          const pump = () => {
            if (failure) { if (active === 0) reject(failure); return; }
            if (completed === batch.length) { resolve(); return; }
            while (active < connections.limit && next < batch.length) {
              const index = next++;
              active += 1;
              void (async () => {
                if (restartVariant) throw new Error('SWITCH_VARIANT');
                const bytes = await fetchSegment(batch[index]);
                await cachePut('source', { jobId, index: sourceOffset + baseIndex + index, bytes });
                totalBytes += bytes.byteLength;
                connections.success(bytes.byteLength);
                const count = output.segments.length + (audioOutput?.segments.length || 0) + completed + 1;
                const speed = connections.speed || totalBytes / Math.max((performance.now() - startedAt) / 1000, 0.001) / 1024 / 1024;
                show(playlist.live ? `直播已缓存 ${count} 个片段 · ${(totalBytes / 1024 / 1024).toFixed(1)} MB · ${speed.toFixed(1)} MB/s` : `已缓存 ${count} / ${plannedSegments} 个片段 · ${speed.toFixed(1)} MB/s`);
                updateStage('caching', playlist.live ? (sourceOffset ? '直播音轨本轮缓存' : '直播视频本轮缓存') : '缓存媒体片段', playlist.live ? (completed + 1) / batch.length * 100 : count / plannedSegments * 100, playlist.live ? `${completed + 1} / ${batch.length}` : `${count} / ${plannedSegments}`);
              })().then(() => { completed += 1; }).catch((error) => {
                if (!failure) { failure = error; fetchController.abort(); }
              }).finally(() => { active -= 1; pump(); });
            }
          };
          pump();
        });
        for (const segment of batch) destination.segments.push(segment);
      };
      const addSnapshot = async (snapshot) => {
        const mapIndexes = [];
        for (const map of snapshot.maps) {
          let index = output.maps.findIndex((candidate) => candidate.url === map.url && JSON.stringify(candidate.range) === JSON.stringify(map.range));
          if (index < 0) {
            index = output.maps.push(map) - 1;
            await cachePut("source", { jobId, index: -index - 1, bytes: await getBytes(map, fetchController.signal) });
          }
          mapIndexes.push(index);
        }
        const batch = [];
        snapshot.segments.forEach((segment, index) => {
          const key = `${snapshot.sequence + index}:${segment.url}:${segment.range?.start ?? ""}`;
          if (seen.has(key)) return;
          seen.add(key);
          batch.push({ ...segment, mapIndex: segment.mapIndex < 0 ? -1 : mapIndexes[segment.mapIndex] });
        });
        await downloadBatch(batch, output, 0);
      };
      const addAudioSnapshot = async (audioSnapshot) => {
        if (!audioOutput || !audioSnapshot) return;
        for (const map of audioSnapshot.maps) {
          let index = audioOutput.maps.findIndex((candidate) => candidate.url === map.url && JSON.stringify(candidate.range) === JSON.stringify(map.range));
          if (index < 0) {
            index = audioOutput.maps.push(map) - 1;
            await cachePut('source', { jobId, index: -10000000 - index, bytes: await getBytes(map, fetchController.signal) });
          }
        }
        const batch = [];
        for (let index = 0; index < audioSnapshot.segments.length; index += 1) {
          const segment = audioSnapshot.segments[index];
          const key = `${audioSnapshot.sequence + index}:${segment.url}:${segment.range?.start ?? ''}`;
          if (audioSeen.has(key)) continue;
          audioSeen.add(key);
          const map = segment.mapIndex < 0 ? null : audioSnapshot.maps[segment.mapIndex];
          const mapIndex = map ? audioOutput.maps.findIndex((candidate) => candidate.url === map.url && JSON.stringify(candidate.range) === JSON.stringify(map.range)) : -1;
          batch.push({ ...segment, mapIndex });
        }
        await downloadBatch(batch, audioOutput, 10000000);
      };
      let snapshot = playlist;
      let audioSnapshot = audioPlaylist;
      for (;;) {
        if (restartVariant) throw new Error('SWITCH_VARIANT');
        await addSnapshot(snapshot);
        await addAudioSnapshot(audioSnapshot);
        if (!snapshot.live || stopRequested) break;
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, Math.max(1000, Math.min(10000, snapshot.targetDuration * 500)));
          wakePoll = () => { clearTimeout(timer); resolve(); };
        });
        wakePoll = null;
        if (stopRequested) break;
        snapshot = parseMedia(await getText(selected.url), selected.url);
        if (audioSnapshot?.live) audioSnapshot = parseMedia(await getText(selected.audio.url), selected.audio.url);
      }
      if (audioOutput && !audioOutput.segments.length) throw new Error('独立音轨没有媒体片段');
      stopButton.hidden = true;
      if (!output.segments.length) throw new Error("没有缓存到媒体片段");
      updateStage('caching', playlist.live ? '直播片段缓存' : '缓存媒体片段', 100, `${output.segments.length + (audioOutput?.segments.length || 0)} 个片段`, true);
      connections.finish();
      variantSelect.disabled = true;
      const result = await transcode(output, audioOutput);
      const meta = { jobId, filename, url: selected.url, count: result.count, bytes: result.bytes, completedAt: Date.now(), format: "progressive-mp4" };
      await cachePut("meta", meta);
      await clearSource().catch(() => {});
      showCache(meta);
    } catch (error) {
      await clearCache().catch(() => {});
      if (restartVariant) {
        show('正在按新清晰度重新缓存…');
        updateStage('switching', '切换清晰度', 0, '正在重新分析', true);
        return;
      }
      const message = error?.message || "缓存失败";
      show(message, true);
      report("error", message, true);
    } finally {
      busy = false;
      fetchController = null;
      downloadButton.disabled = false;
      variantSelect.disabled = false;
      stopButton.hidden = true;
      wakePoll = null;
      if (restartVariant) {
        restartVariant = false;
        await prepareVariant();
        if (prepared) void download();
      }
    }
  }

  async function prepareVariant(knownText = null) {
    const version = ++prepareVersion;
    const selected = variants[Number(variantSelect.value)];
    prepared = null;
    downloadButton.disabled = true;
    saveButton.hidden = !cached || cached.url !== selected.url;
    clearButton.hidden = !cached;
    show("正在分析播放列表…");
    updateStage('analyzing', '分析播放列表', 0, '正在读取清晰度与片段', true);
    try {
      const playlist = parseMedia(knownText ?? await getText(selected.url), selected.url);
      const audioPlaylist = selected.audio ? parseMedia(await getText(selected.audio.url), selected.audio.url) : null;
      if (version !== prepareVersion) return;
      prepared = { url: selected.url, playlist, audioPlaylist };
      const breaks = playlist.segments.filter((segment) => segment.discontinuity).length;
      const message = playlist.live ? `直播已就绪：当前 ${playlist.segments.length} 个片段，点击开始持续缓存` : `已就绪：${playlist.segments.length} 个片段${breaks ? `，${breaks} 处时间轴切换` : ""}`;
      downloadButton.textContent = playlist.live ? "开始录制直播" : "开始缓存";
      show(message);
      updateStage('ready', '分析播放列表', 100, message, true);
      downloadButton.disabled = false;
      if (cached?.url === selected.url) showCache(cached);
    } catch (error) {
      if (version !== prepareVersion) return;
      const message = error?.message || "无法分析播放列表";
      show(message, true);
      report("error", message, true);
    }
  }

  async function init() {
    let existing = await cacheRead("meta", jobId);
    if (existing && existing.format !== "progressive-mp4") {
      await clearCache();
      existing = null;
    }
    if (existing?.count > 0) {
      filenameInput.value = existing.filename;
      showCache(existing);
    }
    const saved = await chrome.storage.session.get(`lptffVideoJob:${jobId}`);
    job = saved[`lptffVideoJob:${jobId}`];
    if (!job?.url || Date.now() - job.createdAt > 3600000) {
      if (existing?.count > 0) return;
      throw new Error("任务已过期，请从开发工具页重新打开");
    }
    if (!existing) filenameInput.value = `${String(job.title || "video").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 160) || "video"}.mp4`;
    let text;
    updateStage('analyzing', '分析播放列表', 0, '正在读取主播放列表', true);
    try { text = await getText(job.url); }
    catch (error) {
      if (existing?.count > 0) { showCache(existing); return; }
      throw error;
    }
    if (!text.startsWith("#EXTM3U")) throw new Error("不是有效的 M3U8 播放列表");
    updateStage('analyzing', '分析播放列表', 50, '正在识别清晰度');
    variants = parseMaster(text, job.url);
    if (!variants.length) variants = [{ url: job.url, label: "原始清晰度" }];
    variantSelect.replaceChildren(...variants.map((variant, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = variant.label;
      return option;
    }));
    variantSelect.disabled = false;
    variantSelect.addEventListener("change", () => {
      if (busy) {
        restartVariant = true;
        stopRequested = true;
        fetchController?.abort();
        wakePoll?.();
        show('正在切换清晰度，当前缓存将重新开始…');
      } else void prepareVariant();
    });
    await prepareVariant(variants[0].url === job.url ? text : null);
    if (existing?.count > 0) showCache(existing);
  }

  downloadButton.addEventListener("click", () => { void download(); });
  stopButton.addEventListener("click", () => { stopRequested = true; stopButton.disabled = true; wakePoll?.(); show("正在停止直播并合成 MP4…"); });
  saveButton.addEventListener("click", () => { void saveCached(); });
  clearButton.addEventListener("click", () => {
    if (busy) return;
    void clearCache().then(() => {
      show("本地缓存已清除，可重新开始缓存");
      updateStage('ready', '等待重新缓存', 0, '本地缓存已清除', true);
    }).catch((error) => show(error?.message || "清除缓存失败", true));
  });
  init().catch((error) => {
    const message = error?.message || "无法读取播放列表";
    show(message, true);
    report("error", message, true);
  });
})();
