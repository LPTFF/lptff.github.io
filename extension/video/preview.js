(() => {
  const id = location.hash.slice(1);
  const player = document.querySelector('#player');
  const title = document.querySelector('#title');
  const status = document.querySelector('#status');
  let hls;

  function show(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }

  async function init() {
    const stored = await chrome.storage.session.get(`lptffVideoPreview:${id}`);
    const item = stored[`lptffVideoPreview:${id}`];
    if (!item?.url || !/^https?:\/\//.test(item.url) || Date.now() - item.createdAt > 3600000) throw new Error('预览任务已过期，请从媒体列表重新打开');
    title.textContent = item.title || '媒体预览';
    player.onerror = () => show('媒体无法预览，请检查来源页能否正常播放', true);
    if (item.type === 'hls' && globalThis.Hls?.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.MANIFEST_PARSED, () => show('已就绪，点击播放确认媒体'));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) show(`预览失败：${data.details || '媒体源不可用'}`, true);
      });
      hls.loadSource(item.url);
      hls.attachMedia(player);
    } else {
      player.src = item.url;
      show('已就绪，点击播放确认媒体');
    }
  }

  addEventListener('beforeunload', () => hls?.destroy());
  init().catch((error) => show(error?.message || '预览失败', true));
})();
