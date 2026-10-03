// Runs only in the explicitly selected source tab/frame.
(() => {
  if (globalThis.__lptffVideoRecorderInstalled) return;
  globalThis.__lptffVideoRecorderInstalled = true;
  let active = null;

  function candidates() {
    return Array.from(document.querySelectorAll('video')).map((video, index) => ({
      index,
      area: (video.videoWidth || video.clientWidth || 0) * (video.videoHeight || video.clientHeight || 0),
      playing: !video.paused && !video.ended,
      blob: (video.currentSrc || video.src || '').startsWith('blob:'),
      ready: video.readyState >= 2,
    }));
  }

  async function start(id, index) {
    if (active) throw new Error('当前页面已经在录制');
    const video = document.querySelectorAll('video')[index];
    if (!video || video.readyState < 2) throw new Error('请先在来源页播放目标视频');
    const stream = video.captureStream?.();
    if (!stream?.getTracks().length) throw new Error('播放器未提供可录制的音视频流');
    const types = [
      'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
      'video/mp4',
      'video/webm;codecs="vp9,opus"',
      'video/webm;codecs="vp8,opus"',
      'video/webm',
    ];
    const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('当前浏览器不支持录制该媒体流');
    const recorder = new MediaRecorder(stream, { mimeType });
    let chunkIndex = 0;
    let queue = Promise.resolve();
    active = { id, recorder, stream };
    recorder.ondataavailable = (event) => {
      if (!event.data.size) return;
      queue = queue.then(async () => {
        const bytes = Array.from(new Uint8Array(await event.data.arrayBuffer()));
        const result = await chrome.runtime.sendMessage({ type: 'VIDEO_RECORD_CHUNK', id, index: chunkIndex++, bytes });
        if (!result?.ok) throw new Error(result?.error || '录制数据未能写入缓存');
      }).catch(async (error) => {
        try { await chrome.runtime.sendMessage({ type: 'VIDEO_RECORD_ERROR', id, error: error.message }); } catch {}
        if (recorder.state !== 'inactive') recorder.stop();
      });
    };
    recorder.onstop = () => {
      void queue.then(() => chrome.runtime.sendMessage({ type: 'VIDEO_RECORD_COMPLETE', id, chunks: chunkIndex })).catch(() => {});
      stream.getTracks().forEach((track) => track.stop());
      active = null;
    };
    recorder.onerror = (event) => {
      void chrome.runtime.sendMessage({ type: 'VIDEO_RECORD_ERROR', id, error: event.error?.message || '录制器发生错误' });
    };
    recorder.start(2000);
    return { mimeType: recorder.mimeType, tracks: stream.getTracks().map((track) => track.kind) };
  }

  function stop(id) {
    if (!active || active.id !== id) throw new Error('当前页面没有对应的录制任务');
    if (active.recorder.state !== 'inactive') active.recorder.stop();
    return { stopping: true };
  }

  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type === 'VIDEO_RECORD_SCAN') { respond({ candidates: candidates() }); return false; }
    if (message?.type === 'VIDEO_RECORD_START_FRAME') {
      start(message.id, message.index).then((result) => respond({ ok: true, ...result })).catch((error) => respond({ ok: false, error: error.message }));
      return true;
    }
    if (message?.type === 'VIDEO_RECORD_STOP_FRAME') {
      try { respond({ ok: true, ...stop(message.id) }); } catch (error) { respond({ ok: false, error: error.message }); }
      return false;
    }
    return false;
  });
})();
