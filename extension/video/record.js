(() => {
  const id = location.hash.slice(1);
  const filenameInput = document.querySelector('#filename');
  const stopButton = document.querySelector('#stop');
  const retryButton = document.querySelector('#retry');
  const saveButton = document.querySelector('#save');
  const clearButton = document.querySelector('#clear');
  const progress = document.querySelector('#progress');
  const status = document.querySelector('#status');
  let busy = false;
  let cached = null;
  let lastPhase = '';

  function show(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lptff-video-cache', 2);
      request.onupgradeneeded = () => {
        for (const [name, options] of [['chunks', { keyPath: ['jobId', 'index'] }], ['meta', { keyPath: 'jobId' }], ['source', { keyPath: ['jobId', 'index'] }]]) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, options);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function read(store, key) {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(store).objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function put(store, value) {
    const db = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }

  async function clearSource() {
    const db = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction('source', 'readwrite');
        tx.objectStore('source').delete(IDBKeyRange.bound([id, Number.MIN_SAFE_INTEGER], [id, Number.MAX_SAFE_INTEGER]));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }

  async function clear() {
    if (busy) return;
    const db = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['source', 'chunks', 'meta'], 'readwrite');
        const range = IDBKeyRange.bound([id, Number.MIN_SAFE_INTEGER], [id, Number.MAX_SAFE_INTEGER]);
        tx.objectStore('source').delete(range);
        tx.objectStore('chunks').delete(range);
        tx.objectStore('meta').delete(id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    cached = null;
    saveButton.hidden = true;
    clearButton.hidden = true;
    retryButton.hidden = true;
    show('缓存已清除');
  }

  async function processRecording() {
    if (busy || cached) return;
    busy = true;
    retryButton.hidden = true;
    progress.hidden = false;
    const ffmpeg = new FFmpegWASM.FFmpeg();
    try {
      const data = await chrome.storage.session.get('lptffVideoRecording');
      const recording = data.lptffVideoRecording;
      if (recording?.id !== id || recording.phase !== 'complete' || !recording.chunks) throw new Error('录制尚未完成');
      show('正在读取本地录制片段…');
      const source = [];
      progress.max = recording.chunks;
      for (let index = 0; index < recording.chunks; index += 1) {
        const entry = await read('source', [id, index]);
        if (!entry) throw new Error(`录制片段 ${index + 1} 已丢失`);
        source.push(entry.bytes);
        progress.value = index + 1;
      }
      const mp4Input = recording.mimeType?.startsWith('video/mp4');
      const input = mp4Input ? 'recording.mp4' : 'recording.webm';
      show('正在合成 MP4…');
      await ffmpeg.load({ coreURL: chrome.runtime.getURL('vendor/ffmpeg-core.js'), wasmURL: chrome.runtime.getURL('vendor/ffmpeg-core.wasm') });
      await ffmpeg.writeFile(input, new Uint8Array(await new Blob(source).arrayBuffer()));
      const codecArgs = mp4Input ? ['-c', 'copy'] : ['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k'];
      const code = await ffmpeg.exec(['-hide_banner', '-loglevel', 'error', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', ...codecArgs, '-movflags', '+faststart', 'output.mp4']);
      if (code !== 0) throw new Error(`录制文件合成失败（代码 ${code}）`);
      const output = await ffmpeg.readFile('output.mp4');
      if (!(output instanceof Uint8Array) || output.byteLength < 1024 || new TextDecoder().decode(output.subarray(4, 8)) !== 'ftyp') throw new Error('合成结果不是有效的 MP4');
      let count = 0;
      for (let offset = 0; offset < output.byteLength; offset += 8 * 1024 * 1024) await put('chunks', { jobId: id, index: count++, bytes: output.slice(offset, offset + 8 * 1024 * 1024) });
      cached = { jobId: id, count, bytes: output.byteLength, format: 'progressive-mp4', completedAt: Date.now() };
      await put('meta', cached);
      await clearSource().catch(() => {});
      saveButton.hidden = false;
      clearButton.hidden = false;
      show(`录制已合成：${(cached.bytes / 1024 / 1024).toFixed(1)} MB，点击“保存文件”`);
    } catch (error) {
      show(error?.message || '合成失败', true);
      retryButton.hidden = false;
    } finally { ffmpeg.terminate(); busy = false; }
  }

  async function save() {
    if (!cached || busy) return;
    const filename = (filenameInput.value.trim() || '网页视频录制.mp4').replace(/[\\/:*?"<>|]/g, '_').replace(/\.mp4$/i, '') + '.mp4';
    let handle;
    try {
      if (typeof showSaveFilePicker === 'function') handle = await showSaveFilePicker({ suggestedName: filename, types: [{ description: 'MP4 视频', accept: { 'video/mp4': ['.mp4'] } }] });
    } catch (error) {
      if (error?.name !== 'AbortError') show(error?.message || '无法选择保存位置', true);
      return;
    }
    busy = true;
    saveButton.disabled = true;
    let stream;
    try {
      stream = handle ? await handle.createWritable() : null;
      const fallback = [];
      for (let index = 0; index < cached.count; index += 1) {
        const entry = await read('chunks', [id, index]);
        if (!entry) throw new Error('缓存已丢失，请重新合成');
        if (stream) await stream.write(entry.bytes);
        else fallback.push(entry.bytes);
      }
      if (stream) await stream.close();
      else {
        const url = URL.createObjectURL(new Blob(fallback, { type: 'video/mp4' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      stream = null;
      show(`已保存 ${filename}`);
    } catch (error) {
      if (stream) await stream.abort().catch(() => {});
      show(error?.message || '保存失败', true);
    } finally { busy = false; saveButton.disabled = false; }
  }

  async function refresh() {
    if (busy || cached) return;
    const stored = await chrome.storage.session.get(['lptffVideoRecording', `lptffVideoJob:${id}`]);
    const recording = stored.lptffVideoRecording;
    if (recording?.id !== id) throw new Error('录制任务已失效');
    if (recording.phase === 'recording' || recording.phase === 'stopping') {
      stopButton.hidden = false;
      stopButton.disabled = recording.phase === 'stopping';
      show(`${recording.phase === 'stopping' ? '正在停止' : '正在录制'}：${recording.chunks} 个片段 · ${(recording.bytes / 1024 / 1024).toFixed(1)} MB`);
    } else if (recording.phase === 'error') show(recording.error || '录制失败', true);
    else if (recording.phase === 'complete' && lastPhase !== 'complete') {
      stopButton.hidden = true;
      void processRecording();
    }
    lastPhase = recording.phase;
  }

  async function init() {
    const stored = await chrome.storage.session.get(`lptffVideoJob:${id}`);
    const job = stored[`lptffVideoJob:${id}`];
    if (job?.type !== 'record') throw new Error('录制任务已失效');
    filenameInput.value = `${String(job.title || '网页视频录制').replace(/[\\/:*?"<>|]/g, '_').slice(0, 160)}.mp4`;
    cached = await read('meta', id);
    if (cached?.format === 'progressive-mp4') {
      stopButton.hidden = true;
      saveButton.hidden = false;
      clearButton.hidden = false;
      show(`录制已合成：${(cached.bytes / 1024 / 1024).toFixed(1)} MB，点击“保存文件”`);
      return;
    }
    await refresh();
    setInterval(() => { void refresh().catch((error) => show(error.message, true)); }, 1000);
  }

  stopButton.addEventListener('click', () => {
    stopButton.disabled = true;
    void chrome.runtime.sendMessage({ type: 'VIDEO_RECORD_STOP', id }).then((result) => {
      if (!result?.ok) throw new Error(result?.error || '无法停止录制');
      show('正在结束录制…');
    }).catch((error) => { stopButton.disabled = false; show(error.message, true); });
  });
  retryButton.addEventListener('click', () => { void processRecording(); });
  saveButton.addEventListener('click', () => { void save(); });
  clearButton.addEventListener('click', () => { void clear(); });
  init().catch((error) => show(error?.message || '录制页初始化失败', true));
})();
