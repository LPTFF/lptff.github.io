// Runs only in the explicitly opened GitHub tab; no cookies, tokens or login fields are read.
(() => {
  const REPO = '/LPTFF/homeops';
  const FILE = 'private-bookmarks/v1.json';
  const BRANCH = 'master';
  const blobPath = `${REPO}/blob/${BRANCH}/${FILE}`;
  function allowedPage() {
    return location.origin === 'https://github.com' && (location.pathname === REPO || location.pathname.startsWith(`${REPO}/`));
  }
  async function page(path) {
    const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const url = new URL(response.url);
    if (url.origin !== location.origin || /\/(login|session|sessions|two-factor)(\/|$)/.test(url.pathname)) throw new Error('请在 GitHub 完成登录，再回本站点击“打开 GitHub 读取”。');
    const html = await response.text();
    if (html.length > 12000000) throw new Error('GitHub 页面过大，已停止读取。');
    return { response, doc: new DOMParser().parseFromString(html, 'text/html') };
  }
  function payload(doc) {
    const script = doc.querySelector('script[data-target="react-app.embeddedData"]');
    if (!script) throw new Error('GitHub 页面结构未识别，请稍后重试。');
    return JSON.parse(script.textContent).payload;
  }
  async function read() {
    if (!allowedPage()) throw new Error('请打开指定的 GitHub 私人仓库。');
    const tree = await page(`${REPO}/tree/${BRANCH}`);
    if (tree.response.status !== 200) throw new Error('无法访问私人仓库或书签分支，请在 GitHub 确认登录与访问权限。');
    if (!tree.doc.querySelector('meta[name="user-login"]')?.content) throw new Error('请先在 GitHub 登录。');
    if (tree.doc.querySelector('meta[name="octolytics-dimension-repository_public"]')?.content !== 'false') throw new Error('目标仓库未被确认是私人仓库，已停止读取和备份。');
    const file = await page(blobPath);
    if (file.response.status === 404) return { initialized: false, raw: null };
    if (file.response.status !== 200) throw new Error(`GitHub 读取失败（${file.response.status}）。`);
    const p = payload(file.doc);
    const layout = p.codeViewBlobLayoutRoute || p;
    if (layout.path !== FILE || layout.refInfo?.name !== BRANCH) throw new Error('GitHub 返回了其他文件或分支，已拒绝读取。');
    const lines = p['codeViewBlobLayoutRoute.StyledBlob']?.rawLines || layout.blob?.rawLines;
    if (!Array.isArray(lines) || !lines.every(line => typeof line === 'string') || layout.blob?.truncated || layout.blob?.large) throw new Error('GitHub 未提供完整书签文件，已停止读取。');
    const raw = lines.join('\n');
    if (new TextEncoder().encode(raw).length > 1000000) throw new Error('书签文件超过 1 MB。');
    return { initialized: true, raw };
  }
  function selectAll(editor) {
    editor.focus();
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: !/Mac/.test(navigator.platform), metaKey: /Mac/.test(navigator.platform), bubbles: true, cancelable: true }));
  }
  async function prepare(json, initialized) {
    if (!allowedPage()) throw new Error('编辑器不在目标仓库内。');
    const expected = initialized ? `${REPO}/edit/${BRANCH}/${FILE}` : `${REPO}/new/${BRANCH}`;
    if (location.pathname !== expected) throw new Error('未打开指定的书签编辑页。');
    if (!initialized && new URL(location.href).searchParams.get('filename') !== FILE) throw new Error('新文件路径不匹配。');
    if (!document.querySelector('meta[name="user-login"]')?.content) throw new Error('请先在 GitHub 完成登录。');
    const fileName = document.querySelector('input[aria-label="File name"]');
    if (fileName && fileName.value !== 'v1.json') throw new Error('书签文件名已改变，已停止填入内容。');
    let editor;
    for (let attempt = 0; attempt < 30; attempt++) {
      editor = document.querySelector('.cm-content[contenteditable="true"]');
      if (editor) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!editor) throw new Error('GitHub 编辑器尚未就绪，请返回本站重试；内容仍保留在本站。');
    selectAll(editor);
    const paste = new DataTransfer();
    paste.setData('text/plain', json);
    editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: paste, bubbles: true, cancelable: true }));
    selectAll(editor);
    const copied = new DataTransfer();
    editor.dispatchEvent(new ClipboardEvent('copy', { clipboardData: copied, bubbles: true, cancelable: true }));
    if (copied.getData('text/plain') !== json) throw new Error('无法确认编辑器已完整填入备份，请勿提交；返回本站重新读取后再试。');
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }));
    let notice = document.querySelector('#lptff-bookmark-notice');
    if (!notice) { notice = document.createElement('p'); notice.id = 'lptff-bookmark-notice'; document.querySelector('main')?.prepend(notice); }
    notice.textContent = '私密书签已填入。请检查内容，再点击 GitHub 的 Commit changes 保存。尚未提交到仓库。';
    notice.style.cssText = 'padding:16px;background:#ddf4ff;color:#0969da;border:1px solid #54aeff;border-radius:8px;margin:16px;';
    return { prepared: true };
  }
  globalThis.LPTFFGitHubBookmarks = { read, prepare };
})();
