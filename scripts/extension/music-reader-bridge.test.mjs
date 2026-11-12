import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../extension/content/music-reader-bridge.js', import.meta.url), 'utf8');
const origin = 'https://music.lptffhome.site';

function fixture({ invalidated = false, connectFails = false, sendFails = false, frame = false } = {}) {
  const listeners = new Map(), replies = [], forwarded = [], pageMessages = [];
  let receive, disconnect, pageClosed = false, disconnected = false, errorObserved = false;
  const page = { postMessage: message => pageMessages.push(message), start() {}, close() { pageClosed = true; } };
  const runtimePort = {
    postMessage(message) { if (sendFails) throw Error('disconnected'); forwarded.push(message); },
    disconnect() { disconnected = true; },
    onDisconnect: { addListener(listener) { disconnect = listener; } },
    onMessage: { addListener(listener) { receive = listener; } },
  };
  const runtime = {
    get id() { if (invalidated) throw Error('invalidated'); return 'fixture-extension'; },
    get lastError() { errorObserved = true; return undefined; },
    connect() { if (connectFails) throw Error('invalidated'); return runtimePort; },
  };
  const window = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    postMessage(message) { replies.push(message); },
  };
  window.top = frame ? {} : window;
  vm.runInNewContext(source, { location: { origin }, window, chrome: { runtime }, Set, Uint8Array, atob });
  return {
    replies, forwarded, pageMessages,
    send(data, overrides = {}) { listeners.get('message')?.({ source: window, origin, data, ports: [], ...overrides }); },
    connect() { this.send({ type: 'homeops-reader-connect-v1', source: { url: 'fixture' } }, { ports: [page] }); },
    reply(message) { receive(message); },
    disconnect() { disconnect(); },
    pagehide() { listeners.get('pagehide')(); },
    get onmessage() { return page.onmessage; },
    get pageClosed() { return pageClosed; },
    get disconnected() { return disconnected; },
    get errorObserved() { return errorObserved; },
    failSends() { sendFails = true; },
  };
}

test('only the top-level first-party page receives the reader handshake', () => {
  const reader = fixture();
  reader.send({ type: 'homeops-reader-ping-v1', nonce: 'foreign' }, { origin: 'https://other.example' });
  reader.send({ type: 'homeops-reader-ping-v1', nonce: 'other-window' }, { source: {} });
  assert.equal(reader.replies.length, 0);
  reader.send({ type: 'homeops-reader-ping-v1', nonce: 'expected' });
  assert.equal(reader.replies[0].nonce, 'expected');
  const frame = fixture({ frame: true });
  frame.send({ type: 'homeops-reader-ping-v1', nonce: 'iframe' });
  assert.equal(frame.replies.length, 0);
});

test('Chrome JSON messages are decoded into exact transferable bytes', () => {
  const reader = fixture();
  reader.connect();
  assert.equal(reader.forwarded[0].action, 'open');
  reader.reply({ id: 7, ok: true, body: Buffer.from([0, 127, 128, 255]).toString('base64'), first: 10, last: 13, bytes: 100, etag: '"pinned"' });
  assert.deepEqual([...new Uint8Array(reader.pageMessages[0].body)], [0, 127, 128, 255]);
  assert.equal(reader.pageMessages[0].etag, '"pinned"');
  reader.onmessage({ data: { action: 'cancel', id: 7 } });
  assert.equal(reader.forwarded[1].action, 'cancel');
  reader.onmessage({ data: { action: 'close' } });
  assert.equal(reader.pageClosed, true);
  assert.equal(reader.disconnected, true);
});

test('an invalidated extension never advertises an available reader', () => {
  const reader = fixture({ invalidated: true });
  reader.send({ type: 'homeops-reader-ping-v1', nonce: 'stale' });
  assert.equal(reader.replies.length, 0);
});

test('a reload during connection rejects the handshake without throwing', () => {
  const reader = fixture({ connectFails: true });
  assert.doesNotThrow(() => reader.connect());
  assert.equal(reader.pageMessages[0].action, 'opened');
  assert.equal(reader.pageMessages[0].ok, false);
  assert.equal(reader.pageClosed, true);
});

test('a disconnected runtime cancels the page reader and observes the runtime error', () => {
  const reader = fixture();
  reader.connect();
  reader.disconnect();
  assert.equal(reader.pageMessages[0].action, 'disconnected');
  assert.equal(reader.pageClosed, true);
  assert.equal(reader.errorObserved, true);
});

test('a failure while opening a runtime port closes the page channel without throwing', () => {
  const reader = fixture({ sendFails: true });
  assert.doesNotThrow(() => reader.connect());
  assert.equal(reader.pageClosed, true);
});

test('a reload during an active read closes the page channel without throwing', () => {
  const reader = fixture();
  reader.connect();
  reader.failSends();
  assert.doesNotThrow(() => reader.onmessage({ data: { action: 'read', id: 8, first: 0, last: 3 } }));
  assert.equal(reader.pageMessages[0].action, 'disconnected');
  assert.equal(reader.pageClosed, true);
});

test('leaving the page disconnects every reader', () => {
  const reader = fixture();
  reader.connect();
  reader.pagehide();
  assert.equal(reader.disconnected, true);
});
