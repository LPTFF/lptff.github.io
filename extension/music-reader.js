/* Optional private player transport. No downloads, cookies, storage or URL UI. */
(() => {
  const ORIGIN = 'https://music.lptffhome.site', LIMIT = 4 * 1024 * 1024;
  const approved = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.hash &&
      (u.hostname.endsWith('.pds.quark.cn') || u.hostname.endsWith('.drive.quark.cn')); } catch { return false; }
  };
  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'homeops-original-v1') return;
    if (port.sender?.frameId !== 0 || new URL(port.sender?.url || 'about:blank').origin !== ORIGIN) { port.disconnect(); return; }
    let source, closed = false; const reads = new Map();
    const send = message => { if (!closed) { try { port.postMessage(message); } catch {} } };
    const close = () => { closed = true; for (const controller of reads.values()) controller.abort(); reads.clear(); source = undefined; };
    port.onDisconnect.addListener(close);
    port.onMessage.addListener(message => {
      if (message?.action === 'close') { close(); port.disconnect(); return; }
      if (message?.action === 'cancel') { reads.get(message.id)?.abort(); return; }
      if (message?.action === 'open' && !source) {
        const s = message.source;
        if (!approved(s?.url) || !Number.isSafeInteger(s?.bytes) || s.bytes < 1 || s.bytes > 128 * 1024 ** 3 ||
          typeof s.etag !== 'string' || !/^"[^"\r\n]{1,510}"$/.test(s.etag)) { send({ action:'opened', ok:false }); return; }
        source = { url:s.url, bytes:s.bytes, etag:s.etag }; send({ action:'opened', ok:true }); return;
      }
      if (message?.action !== 'read' || !source || closed) return;
      const { id, first, last } = message;
      if (!Number.isSafeInteger(id) || reads.has(id) || reads.size >= 8 || !Number.isSafeInteger(first) || !Number.isSafeInteger(last) ||
        first < 0 || first > last || last >= source.bytes || last - first + 1 > LIMIT) { send({ id, ok:false }); return; }
      const controller = new AbortController(); reads.set(id, controller);
      const timeout = setTimeout(() => controller.abort(), 20000), pinned = source;
      void (async () => {
        const r = await fetch(pinned.url, { headers:{ Range:`bytes=${first}-${last}`, 'If-Range':pinned.etag, 'Accept-Encoding':'identity' }, credentials:'omit',
          cache:'no-store', redirect:'error', referrerPolicy:'no-referrer', signal:controller.signal });
        const expected = last - first + 1;
        if (r.status !== 206 || r.headers.get('Content-Range') !== `bytes ${first}-${last}/${pinned.bytes}` ||
          r.headers.get('ETag') !== pinned.etag || ![null,'identity'].includes(r.headers.get('Content-Encoding')) ||
          Number(r.headers.get('Content-Length')) !== expected || !r.body) {
          await r.body?.cancel(); throw Error('range_rejected');
        }
        const body = new Uint8Array(expected), reader = r.body.getReader(); let at = 0;
        try { while (true) { const value = await reader.read(); if (value.done) break;
          if (at + value.value.length > expected) throw Error('range_overflow'); body.set(value.value, at); at += value.value.length;
        } } finally { reader.releaseLock(); }
        if (at !== expected || controller.signal.aborted || closed) throw Error('range_incomplete');
        let binary = ''; for (let p = 0; p < body.length; p += 32768) binary += String.fromCharCode(...body.subarray(p, p + 32768));
        send({ id, ok:true, body:btoa(binary), first, last, bytes:pinned.bytes, etag:pinned.etag });
      })().catch(() => { controller.abort(); send({ id, ok:false }); }).finally(() => { clearTimeout(timeout); reads.delete(id); });
    });
  });
})();
