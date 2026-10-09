// Runs production task code against synthetic browser events. Never contacts GitHub.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const source = fs.readFileSync(new URL('../extension/private-bookmarks.js', import.meta.url), 'utf8');
const sourceTab = { id: 1, windowId: 1, url: 'http://127.0.0.1:8091/devtools/private-bookmarks', status: 'complete' };
const empty = () => ({ schemaVersion: 1, bookmarks: [], snapshots: [] });
function harness() {
  const storage = {};
  const tabs = new Map([[1, { ...sourceTab }]]);
  const state = { raw: null, prepared: [], error: null, bookmarkPermission: true, bookmarkTree: [{ id: '0', children: [] }] };
  let nextId = 2, updated, removed;
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const chrome = {
    permissions: { contains: async () => state.bookmarkPermission },
    bookmarks: { getTree: async () => clone(state.bookmarkTree) },
    storage: { session: {
      get: async name => name === null ? clone(storage) : { [name]: clone(storage[name]) },
      set: async values => Object.assign(storage, clone(values)), remove: async name => { delete storage[name]; },
    } },
    tabs: {
      create: async values => { const tab = { id: nextId++, windowId: 1, status: 'complete', ...values }; tabs.set(tab.id, tab); return clone(tab); },
      get: async id => { if (!tabs.has(id)) throw new Error('Tab closed'); return clone(tabs.get(id)); },
      update: async (id, values) => { Object.assign(tabs.get(id), values); if (values.url) updated(id, { status: 'complete' }); return clone(tabs.get(id)); },
      query: async () => [...tabs.values()],
      onUpdated: { addListener: fn => { updated = fn; } }, onRemoved: { addListener: fn => { removed = fn; } },
    },
    windows: { update: async () => {} },
    scripting: { executeScript: async opts => {
      if (opts.files) return [];
      if (state.error) return [{ result: { ok: false, error: state.error } }];
      if (opts.args[0] === 'read') return [{ result: { ok: true, value: { initialized: state.raw !== null, raw: state.raw } } }];
      state.prepared.push(opts.args[1][0]);
      return [{ result: { ok: true, value: { prepared: true } } }];
    } },
  };
  const context = vm.createContext({ chrome, URL, TextEncoder, Uint8Array, crypto: webcrypto, setTimeout, console });
  vm.runInContext(source, context);
  const api = context.LPTFFPrivateBookmarks;
  async function phase(expected) {
    for (let i = 0; i < 200; i++) {
      const result = await api.status(1);
      if (result.phase === expected) return result;
      await new Promise(r => setTimeout(r, 2));
    }
    throw new Error(`Expected ${expected}; got ${JSON.stringify(await api.status(1))}`);
  }
  async function read() { await api.startRead(sourceTab); await phase('ready'); return api.getFile(1); }
  return { api, state, storage, tabs, chrome, phase, read, removed };
}
let count = 0;
async function check(name, run) { await run(); console.log(`PASS ${name}`); count++; }
await check('Authenticated missing file starts with an empty bookmark list', async () => {
  const h = harness(); const result = await h.read(); assert.equal(result.initialized, false); assert.equal(result.data.bookmarks.length, 0);
});
await check('Read is scoped to requesting tool tab', async () => {
  const h = harness(); await h.read(); await assert.rejects(h.api.getFile(99)); assert.equal((await h.api.status(99)).connected, false);
});
await check('Save prepares an editor without reporting a committed backup', async () => {
  const h = harness(); const r = await h.read();
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab);
  const s = await h.phase('reviewing'); assert.equal(s.completedWrite, false); assert.equal(h.state.prepared.length, 1); assert.equal(h.state.raw, null);
  assert.match([...h.tabs.values()].at(-1).url, /new\/master\?filename=private-bookmarks%2Fv1.json$/);
});
await check('Save success requires reading back the actual submitted content', async () => {
  const h = harness(); const r = await h.read();
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab); await h.phase('reviewing');
  h.state.raw = h.state.prepared[0] + '\n';
  await h.chrome.tabs.update([...h.tabs.keys()].at(-1), { url: 'https://github.com/LPTFF/homeops/blob/master/private-bookmarks/v1.json' });
  assert.equal((await h.phase('ready')).completedWrite, true);
});
await check('Existing file uses edit route and detects remote changes before filling', async () => {
  const h = harness(); h.state.raw = JSON.stringify(empty()); const r = await h.read();
  h.state.raw = JSON.stringify({ ...empty(), updatedAt: 'remote-change' });
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab);
  assert.match((await h.phase('error')).error, /内容已变化/); assert.equal(h.state.prepared.length, 0);
});
await check('Unchanged existing file opens the fixed edit path', async () => {
  const h = harness(); h.state.raw = JSON.stringify(empty()); const r = await h.read();
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab); await h.phase('reviewing');
  assert.match([...h.tabs.values()].at(-1).url, /edit\/master\/private-bookmarks\/v1.json$/);
});
await check('Read/authentication failures do not unlock empty data', async () => {
  const h = harness(); h.state.error = '请先登录'; await h.api.startRead(sourceTab); await h.phase('error'); await assert.rejects(h.api.getFile(1));
});
await check('Malformed files never become an empty vault', async () => {
  const h = harness(); h.state.raw = '{}'; await h.api.startRead(sourceTab); assert.match((await h.phase('error')).error, /格式无法识别/);
});
await check('Cancel invalidates the pending task and retains the read baseline', async () => {
  const h = harness(); const r = await h.read();
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab); await h.phase('reviewing');
  const canceled = await h.api.cancel(1); assert.notEqual(canceled.connectionId, r.connectionId);
  assert.equal((await h.api.status(1)).phase, 'ready'); assert.equal((await h.api.getFile(1)).data.bookmarks.length, 0);
  assert.equal(Object.values(h.storage)[0].draft, undefined);
});
await check('Closing GitHub while awaiting confirmation is not success', async () => {
  const h = harness(); const r = await h.read();
  await h.api.syncFile({ data: r.data, baseSha: r.sha, connectionId: r.connectionId }, sourceTab); await h.phase('reviewing');
  h.tabs.delete([...h.tabs.keys()].at(-1)); await h.api.status(1); assert.match((await h.api.status(1)).error, /已关闭/);
});
await check('Capacity and embedded credentials are rejected before opening an editor', async () => {
  const h = harness(); const r = await h.read();
  for (const bookmarks of [Array(5001).fill({ url: 'https://example.com' }), [{ url: 'https://user:secret@example.com' }]]) {
    await assert.rejects(h.api.syncFile({ data: { ...empty(), bookmarks }, baseSha: r.sha, connectionId: r.connectionId }, sourceTab));
  }
  assert.equal(h.state.prepared.length, 0);
});
await check('Wrong-session saves and concurrent operations are rejected', async () => {
  const h = harness(); const r = await h.read();
  await assert.rejects(h.api.syncFile({ data: r.data, connectionId: 'wrong' }, sourceTab));
  await h.api.syncFile({ data: r.data, connectionId: r.connectionId }, sourceTab); await h.phase('reviewing');
  await assert.rejects(h.api.startRead(sourceTab), /进行中/);
});
await check('Login completion resumes the original read task', async () => {
  const h = harness(); h.state.error = '请先登录'; await h.api.startRead(sourceTab); await h.phase('error');
  h.state.error = null;
  await h.chrome.tabs.update([...h.tabs.keys()].at(-1), { url: 'https://github.com/LPTFF/homeops' });
  await h.phase('ready'); assert.equal((await h.api.getFile(1)).data.bookmarks.length, 0);
});
await check('Canceling a failed refresh retains the previous baseline', async () => {
  const h = harness(); await h.read(); h.state.error = '网络不可用';
  await h.api.startRead(sourceTab); await h.phase('error');
  await h.api.cancel(1); assert.equal((await h.api.getFile(1)).data.bookmarks.length, 0);
});
await check('Import tree exposes titles and IDs, and selection returns only checked webpages', async () => {
  const h = harness();
  h.state.bookmarkTree = [{ id: '0', children: [{ id: '1', title: '书签栏', children: [
    { id: '10', title: '网页 A', url: 'https://example.com/a' },
    { id: '2', title: '子文件夹', children: [{ id: '11', title: '网页 B', url: 'https://example.com/b' }] },
    { id: '12', title: '内部页面', url: 'chrome://settings' },
  ] }] }];
  const tree = await h.api.folders();
  assert.equal(tree.treeVersion, 2);
  assert.equal(tree.items[0].count, 2);
  assert.equal(tree.items[0].children[1].children[0].type, 'bookmark');
  assert.equal(JSON.stringify(tree).includes('https://'), false);
  const selected = await h.api.readSelected(['11']);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].url, 'https://example.com/b');
  assert.equal(selected[0].folder, '书签栏 / 子文件夹');
  await assert.rejects(h.api.readSelected(['10', 'missing']), /已变化/);
  await assert.rejects(h.api.readSelected(['2']), /已变化/);
  await assert.rejects(h.api.readSelected(['10', '10']), /重复/);
  h.state.bookmarkPermission = false;
  await assert.rejects(h.api.folders(), /权限/);
});
console.log(`${count} private bookmark checks passed (synthetic browser events, no remote commits).`);
