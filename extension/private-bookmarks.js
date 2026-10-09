(() => {
  const VALID_URL = /^https?:\/\//i;

  function safeUrl(value) {
    try {
      const parsed = new URL(value);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password;
    } catch { return false; }
  }

  function cleanEntry(entry) {
    if (!entry || typeof entry !== "object") throw new Error("书签记录格式无效");
    const url = String(entry?.url || "").trim();
    if (url.length > 4000 || !VALID_URL.test(url) || !safeUrl(url)) throw new Error("仅支持长度不超过 4000 且不包含嵌入式账号密码的 HTTP 或 HTTPS 网址");
    return {
      id: String(entry.id || crypto.randomUUID()).slice(0, 80),
      title: String(entry.title || url).trim().slice(0, 200),
      url: url.slice(0, 4000),
      folder: String(entry.folder || "未分类").trim().slice(0, 120),
      note: String(entry.note || "").slice(0, 1000),
      updatedAt: String(entry.updatedAt || new Date().toISOString()),
    };
  }

  function cleanSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.tabs) || snapshot.tabs.length > 200) throw new Error("标签页快照格式无效或超过 200 个网页");
    if (snapshot.tabs.some((tab) => !tab || typeof tab.url !== "string" || tab.url.length > 4000 || !safeUrl(tab.url))) throw new Error("快照包含无效网址；已拒绝丢弃原始数据");
    return {
      id: String(snapshot.id || crypto.randomUUID()).slice(0, 80),
      title: String(snapshot.title || "标签页快照").trim().slice(0, 200),
      createdAt: String(snapshot.createdAt || new Date().toISOString()),
      tabs: (Array.isArray(snapshot.tabs) ? snapshot.tabs : []).slice(0, 200).map((tab, index) => ({
        title: String(tab.title || tab.url || "网页").slice(0, 200),
        url: String(tab.url || "").slice(0, 4000),
        index,
      })).filter((tab) => VALID_URL.test(tab.url) && safeUrl(tab.url)),
    };
  }

  function normalizeData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.bookmarks) || !Array.isArray(data.snapshots)) {
      throw new Error("私人仓库中的书签文件格式无法识别；本地内容未被覆盖");
    }
    if (data.bookmarks.length > 5000 || data.snapshots.length > 200) throw new Error("书签或快照超过容量限制；已拒绝截断数据");
    return {
      schemaVersion: 1,
      updatedAt: String(data.updatedAt || new Date().toISOString()),
      bookmarks: (Array.isArray(data.bookmarks) ? data.bookmarks : []).slice(0, 5000).map(cleanEntry),
      snapshots: (Array.isArray(data.snapshots) ? data.snapshots : []).slice(0, 200).map(cleanSnapshot),
    };
  }


  const REPO_URL = "https://github.com/LPTFF/homeops";
  const FILE_PATH = "private-bookmarks/v1.json";
  const BRANCH = "master";
  const KEY = "lptffPrivateBookmarksGitHub:";
  const running = new Set();
  // Retire the old PAT flow. Session data is never exposed to webpage scripts directly.
  chrome.storage.session.remove("lptffPrivateBookmarksConfig").catch(() => {});
  const key = id => `${KEY}${id}`;
  async function taskFor(id) { return (await chrome.storage.session.get(key(id)))[key(id)]; }
  async function save(task) {
    const current = await taskFor(task.sourceTabId);
    if (current?.operationId !== task.operationId) return false;
    await chrome.storage.session.set({ [key(task.sourceTabId)]: task });
    return true;
  }
  async function digest(raw) {
    if (raw === null) return null;
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw.trim()));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function adapter(tabId, method, args = []) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/private-bookmarks-github.js'] });
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (action, values) => {
        try { return { ok: true, value: await globalThis.LPTFFGitHubBookmarks[action](...values) }; }
        catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'GitHub 页面操作失败' }; }
      },
      args: [method, args],
    });
    const result = results[0]?.result;
    if (!result?.ok) throw new Error(result?.error || '无法读取 GitHub 页面，请确认扩展已获准访问 github.com。');
    return result.value;
  }
  async function readRemote(tabId) {
    const result = await adapter(tabId, 'read');
    let data;
    if (!result.initialized) data = { schemaVersion: 1, bookmarks: [], snapshots: [] };
    else {
      try { data = JSON.parse(result.raw); } catch { throw new Error('仓库书签 JSON 无法解析，本页修改未被覆盖。'); }
    }
    return { data: normalizeData(data), sha: await digest(result.raw), initialized: result.initialized, raw: result.raw };
  }
  async function returnToSource(task) {
    try {
      const tab = await chrome.tabs.get(task.sourceTabId);
      if (tab.url === task.sourceUrl) {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch {}
  }
  async function advance(sourceId) {
    if (running.has(sourceId)) return;
    running.add(sourceId);
    let operationId;
    try {
      const task = await taskFor(sourceId);
      operationId = task?.operationId;
      if (!task || !['reading', 'checking', 'preparing', 'reviewing'].includes(task.phase)) return;
      let tab;
      try { tab = await chrome.tabs.get(task.githubTabId); }
      catch { throw new Error('GitHub 页面已关闭，本页修改仍保留。'); }
      const u = new URL(tab.url || 'about:blank');
      if (u.origin !== 'https://github.com' || !(u.pathname === '/LPTFF/homeops' || u.pathname.startsWith('/LPTFF/homeops/')) || tab.status !== 'complete') return;
      if (task.phase === 'reviewing' && u.pathname !== `/LPTFF/homeops/blob/${BRANCH}/${FILE_PATH}`) return;
      if (task.phase === 'preparing') {
        const target = task.initialized ? `/LPTFF/homeops/edit/${BRANCH}/${FILE_PATH}` : `/LPTFF/homeops/new/${BRANCH}`;
        if (u.pathname !== target) return;
        const remote = await readRemote(task.githubTabId);
        if ((await taskFor(sourceId))?.operationId !== operationId) return;
        if (remote.sha !== task.baseSha) throw new Error('仓库内容已变化，未填入备份。请返回本站重新读取并合并修改。');
        await adapter(task.githubTabId, 'prepare', [task.draft, task.initialized]);
        task.phase = 'reviewing';
        await save(task);
        return;
      }
      const remote = await readRemote(task.githubTabId);
      if (task.phase === 'checking') {
        if (remote.sha !== task.baseSha) throw new Error('仓库内容已变化，当前修改仍保留；请重新读取并合并。');
        task.initialized = remote.initialized;
        task.phase = 'preparing';
        if (!await save(task)) return;
        const target = remote.initialized ? `${REPO_URL}/edit/${BRANCH}/${FILE_PATH}` : `${REPO_URL}/new/${BRANCH}?filename=${encodeURIComponent(FILE_PATH)}`;
        await chrome.tabs.update(task.githubTabId, { url: target, active: true });
        return;
      }
      if (task.phase === 'reviewing' && await digest(remote.raw) !== await digest(task.draft)) {
        throw new Error('GitHub 文件与本次备份不同，尚未确认保存。本页修改仍保留，请重新读取核对。');
      }
      task.data = remote.data;
      task.sha = remote.sha;
      task.initialized = remote.initialized;
      task.completedWrite = task.phase === 'reviewing';
      task.phase = 'ready';
      delete task.draft;
      if (await save(task)) await returnToSource(task);
    } catch (error) {
      const task = await taskFor(sourceId);
      if (task && task.operationId === operationId) {
        task.resumePhase = task.phase;
        task.phase = 'error';
        task.error = error instanceof Error ? error.message : 'GitHub 页面处理失败';
        await save(task);
      }
    } finally { running.delete(sourceId); }
  }
  async function start(source, input) {
    if (!Number.isInteger(source?.id)) throw new Error('请从本站私密书签页面开始。');
    const previous = await taskFor(source.id);
    if (previous && ['reading', 'checking', 'preparing', 'reviewing'].includes(previous.phase)) throw new Error('已有 GitHub 操作进行中，请完成保存或取消当前操作。');
    let draft;
    if (input) {
      if (!previous?.data || input.connectionId !== previous.operationId) throw new Error('请重新读取仓库后再准备备份。');
      const data = normalizeData(input.data);
      data.updatedAt = new Date().toISOString();
      draft = JSON.stringify(data, null, 2);
      if (new TextEncoder().encode(draft).length > 1000000) throw new Error('备份超过 1 MB，请减少内容后重试。');
    }
    // A fresh tab avoids replacing an unrelated page or an existing GitHub editor draft.
    const tab = await chrome.tabs.create({ url: REPO_URL, active: true });
    const task = { ...(previous?.data ? { data: previous.data, sha: previous.sha, initialized: previous.initialized } : {}), sourceTabId: source.id, sourceUrl: source.url, githubTabId: tab.id, operationId: crypto.randomUUID(), phase: input ? 'checking' : 'reading', baseSha: input?.baseSha ?? null, ...(draft ? { draft } : {}) };
    await chrome.storage.session.set({ [key(source.id)]: task });
    void advance(source.id);
    return { pending: true, operationId: task.operationId };
  }
  async function status(sourceId) {
    const task = await taskFor(sourceId);
    if (task && ['reading', 'checking', 'preparing', 'reviewing'].includes(task.phase)) {
      try { await chrome.tabs.get(task.githubTabId); void advance(sourceId); }
      catch { task.phase = 'error'; task.error = 'GitHub 页面已关闭，本页修改仍保留。'; await save(task); }
    }
    return { flow: 'github-page', connected: task?.phase === 'ready', phase: task?.phase || 'idle', operationId: task?.operationId, error: task?.error, completedWrite: !!task?.completedWrite };
  }
  chrome.tabs.onUpdated.addListener((tabId, change) => {
    if (change.status !== 'complete' && !change.url) return;
    chrome.storage.session.get(null).then(async all => {
      for (const [name, task] of Object.entries(all)) if (name.startsWith(KEY) && task.githubTabId === tabId) {
        if (task.phase === 'error' && task.resumePhase && change.status === 'complete') {
          task.phase = task.resumePhase; delete task.error; delete task.resumePhase;
          if (!await save(task)) continue;
        }
        void advance(task.sourceTabId);
      }
    }).catch(() => {});
  });
  chrome.tabs.onRemoved.addListener(tabId => { chrome.storage.session.remove(key(tabId)).catch(() => {}); });
  async function folders() {
    if (!chrome.permissions?.contains || !await chrome.permissions.contains({ permissions: ["bookmarks"] })) {
      throw new Error("请点击导入按钮并授予 Chrome 书签读取权限");
    }
    const [root] = await chrome.bookmarks.getTree();
    const walk = (nodes) => (nodes || []).map((node) => {
      if (node.url) {
        if (!VALID_URL.test(node.url) || !safeUrl(node.url) || node.url.length > 4000) return null;
        return { id: node.id, title: String(node.title || node.url).slice(0, 200), type: "bookmark" };
      }
      const children = walk(node.children).filter(Boolean);
      if (!children.length) return null;
      return { id: node.id, title: String(node.title || "未命名文件夹").slice(0, 200), type: "folder", count: children.reduce((sum, child) => sum + (child.count || 1), 0), children };
    }).filter(Boolean);
    // The webpage only sees titles and IDs. URLs leave the extension after the user checks specific bookmarks.
    return { treeVersion: 2, items: walk(root?.children) };
  }

  async function readSelected(bookmarkIds) {
    if (!chrome.permissions?.contains || !await chrome.permissions.contains({ permissions: ["bookmarks"] })) throw new Error("缺少 Chrome 书签权限");
    if (!Array.isArray(bookmarkIds) || !bookmarkIds.length || bookmarkIds.length > 1000 || bookmarkIds.some((id) => typeof id !== "string" || !id || id.length > 80)) {
      throw new Error("请选择 1 至 1000 条书签后导入");
    }
    const selected = new Set(bookmarkIds);
    if (selected.size !== bookmarkIds.length) throw new Error("选中的书签包含重复记录");
    const [root] = await chrome.bookmarks.getTree();
    const bookmarks = [];
    const walk = (nodes, parents = []) => {
      for (const node of nodes || []) {
        if (node.url) {
          if (selected.has(node.id) && VALID_URL.test(node.url) && safeUrl(node.url) && node.url.length <= 4000) {
            bookmarks.push(cleanEntry({ title: node.title, url: node.url, folder: parents.join(" / ") || "未分类" }));
          }
        } else walk(node.children, [...parents, node.title].filter(Boolean));
      }
    };
    walk(root?.children);
    if (bookmarks.length !== selected.size) throw new Error("Chrome 书签已变化，请重新打开导入列表后再试；此次未导入任何内容");
    return bookmarks;
  }

  globalThis.LPTFFPrivateBookmarks = {
    status,
    cancel: async sourceId => {
      const task = await taskFor(sourceId);
      if (!task) return {};
      task.operationId = crypto.randomUUID();
      task.phase = task.data ? 'ready' : 'idle';
      delete task.draft; delete task.error; delete task.resumePhase;
      await chrome.storage.session.set({ [key(sourceId)]: task });
      return { connectionId: task.operationId };
    },
    startRead: source => start(source),
    syncFile: (input, source) => start(source, input),
    getFile: async sourceId => {
      const task = await taskFor(sourceId);
      if (task?.phase !== 'ready') throw new Error('请先打开 GitHub 读取书签。');
      return { data: task.data, sha: task.sha, initialized: task.initialized, connectionId: task.operationId };
    },
    clearConfig: async sourceId => chrome.storage.session.remove(key(sourceId)),
    folders, readSelected,
  };
})();
