(() => {
  const origin = 'https://music.lptffhome.site';
  if (location.origin !== origin || window !== window.top) return;
  const connections = new Set();
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== origin) return;
    if (event.data?.type === 'homeops-reader-ping-v1') {
      window.postMessage({ type:'homeops-reader-ready-v1', nonce:event.data.nonce }, origin); return;
    }
    if (event.data?.type !== 'homeops-reader-connect-v1' || event.ports.length !== 1 || connections.size >= 2) return;
    const page = event.ports[0], runtime = chrome.runtime.connect({ name:'homeops-original-v1' }); connections.add(runtime);
    let closed = false;
    const close = () => { if (closed) return; closed = true; connections.delete(runtime); page.close(); try { runtime.disconnect(); } catch {} };
    runtime.onDisconnect.addListener(() => { try { page.postMessage({ action:'disconnected' }); } catch {} close(); });
    runtime.onMessage.addListener(message => {
      if (closed) return;
      if (message.body && message.ok) {
        const binary = atob(message.body), body = new Uint8Array(binary.length);
        for (let i = 0; i < body.length; i++) body[i] = binary.charCodeAt(i);
        const { body:unused, ...metadata } = message; page.postMessage({ ...metadata, body:body.buffer }, [body.buffer]);
      } else page.postMessage(message);
    });
    page.onmessage = e => {
      if (e.data?.action === 'close') { close(); return; }
      if (['read','cancel'].includes(e.data?.action)) runtime.postMessage(e.data);
    };
    page.start(); runtime.postMessage({ action:'open', source:event.data.source });
  });
  window.addEventListener('pagehide', () => { for (const runtime of connections) try { runtime.disconnect(); } catch {} connections.clear(); });
})();
