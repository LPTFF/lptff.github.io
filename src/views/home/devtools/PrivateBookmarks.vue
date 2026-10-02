<template>
  <section class="private-bookmarks">
    <header class="page-heading">
      <div>
        <h1>私密书签</h1>
        <p>用 GitHub 登录，读取你的私人书签。备份时在 GitHub 确认保存。</p>
      </div>
      <div class="heading-actions">
        <el-button @click="openSettings">书签导入权限</el-button>
        <el-button :disabled="busy || waiting" @click="reloadData">{{ connected ? "重新读取" : "打开 GitHub 读取" }}</el-button>
        <el-button type="primary" :disabled="!connected || busy || waiting || !dirty" @click="syncData">{{ busy ? '准备中…' : '去 GitHub 保存' }}</el-button>
      </div>
    </header>

    <el-alert v-if="!connected" type="info" :closable="false" show-icon title="登录 GitHub 即可使用">
      <template #default>
        点击“打开 GitHub 读取”。登录并获得仓库访问权限后，插件会读取书签并返回这里，无需填写令牌。
      </template>
    </el-alert>
    <el-alert v-else-if="!initialized" type="warning" :closable="false" show-icon title="仓库还没有书签文件">
      可以导入 Chrome 书签文件夹。点击“去 GitHub 保存”，检查内容后在 GitHub 提交，才会写入仓库。
    </el-alert>

    <div v-if="waiting" class="waiting"><span>{{ phaseText }}</span><el-button @click="cancelPending">取消等待</el-button></div>

    <div v-if="connected" class="toolbar" :inert="busy || waiting || undefined">
      <el-input v-model="query" clearable placeholder="搜索名称、网址或分组" class="search" />
      <el-button @click="loadFolders">导入 Chrome 书签文件夹</el-button>
      <el-button type="danger" plain :disabled="!selectedTableIds.length" @click="removeSelectedBookmarks">删除已选（{{ selectedTableIds.length }}）</el-button>
      <el-button type="danger" plain @click="disconnect">断开连接</el-button>
    </div>

    <el-alert v-if="message" :type="messageType" :closable="true" show-icon @close="message = ''" :title="message" />

    <el-table ref="bookmarksTableRef" v-if="connected" :inert="busy || waiting || undefined" :data="pagedBookmarks" row-key="id" empty-text="没有匹配的书签" @selection-change="onTableSelectionChange">
      <el-table-column type="selection" width="55" reserve-selection />
      <el-table-column prop="title" label="名称" min-width="150" />
      <el-table-column label="网址" min-width="240">
        <template #default="scope"><a :href="scope.row.url" target="_blank" rel="noopener noreferrer">{{ scope.row.url }}</a></template>
      </el-table-column>
      <el-table-column prop="folder" label="分组" width="140" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="editBookmark(scope.row as Bookmark)">编辑</el-button>
          <el-button link type="danger" @click="removeBookmark(scope.row as Bookmark)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="connected" class="bookmark-pagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="filteredBookmarks.length" :pager-count="5" layout="total, sizes, prev, pager, next, jumper" background />
    </div>

    <el-dialog v-model="showAdd" title="编辑书签" width="min(560px, 94vw)" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="名称"><el-input v-model="draft.title" maxlength="200" /></el-form-item>
        <el-form-item label="网址"><el-input v-model="draft.url" placeholder="https://example.com" /></el-form-item>
        <el-form-item label="分组"><el-input v-model="draft.folder" maxlength="120" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="draft.note" type="textarea" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showAdd = false">取消</el-button><el-button type="primary" @click="saveBookmark">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="showFolders" title="导入 Chrome 书签" width="min(680px, 94vw)" :show-close="!importing" :close-on-click-modal="!importing" :close-on-press-escape="!importing">
      <p class="import-help">勾选文件夹会选中其中的网页书签，也可以只勾选单条。导入只复制选中的网页，不会更改 Chrome 原书签。</p>
      <div class="import-tools">
        <el-input v-model="folderQuery" clearable placeholder="搜索文件夹或书签名称" :disabled="importing" />
        <el-button :disabled="importing || !availableBookmarkCount" @click="selectAllBookmarks">全选</el-button>
        <el-button :disabled="importing || !selectedBookmarkIds.length" @click="clearBookmarkSelection">清空</el-button>
      </div>
      <el-tree
        ref="folderTreeRef"
        :data="folders"
        node-key="id"
        show-checkbox
        check-on-click-node
        :expand-on-click-node="false"
        :default-expanded-keys="folders.map((folder) => folder.id)"
        :filter-node-method="filterBookmarkNode"
        empty-text="没有可导入的网页书签"
        class="bookmark-tree"
        @check="updateBookmarkSelection"
      >
        <template #default="{ data: node }">
          <span class="bookmark-tree-label"><span class="bookmark-tree-title" :title="node.title">{{ node.title }}</span><span v-if="node.type === 'folder'" class="bookmark-tree-count">{{ node.count }} 条</span></span>
        </template>
      </el-tree>
      <p class="import-summary">已选 {{ selectedBookmarkIds.length }} / {{ availableBookmarkCount }} 条网页书签<span v-if="selectedBookmarkIds.length > 5000"> · 单次最多选择 5000 条</span></p>
      <template #footer><el-button :disabled="importing" @click="showFolders = false">取消</el-button><el-button type="primary" :loading="importing" :disabled="!selectedBookmarkIds.length || selectedBookmarkIds.length > 5000 || importing" @click="importBookmarks">导入选中的 {{ selectedBookmarkIds.length }} 条</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { onBeforeRouteLeave } from "vue-router";

type Bookmark = { id: string; title: string; url: string; folder: string; note: string; updatedAt: string };
type BookmarkTableHandle = { clearSelection: () => void };
type ChromeBookmarkNode = { id: string; title: string; type: "folder" | "bookmark"; count?: number; children?: ChromeBookmarkNode[] };
type BookmarkTreeHandle = { filter: (value: string) => void; getCheckedNodes: (leafOnly?: boolean) => ChromeBookmarkNode[]; setCheckedKeys: (keys: string[]) => void };
type Snapshot = { id: string; title: string; createdAt: string; tabs: Array<{ title: string; url: string; index: number }> };
type VaultData = { schemaVersion: number; updatedAt: string; bookmarks: Bookmark[]; snapshots: Snapshot[] };
type ExtensionMessage = { ok: boolean; error?: string; requestId?: string; [key: string]: unknown };
const emptyData = (): VaultData => ({ schemaVersion: 1, updatedAt: new Date().toISOString(), bookmarks: [], snapshots: [] });
const data = reactive<VaultData>(emptyData());
const connected = ref(false);
const initialized = ref(false);
const dirty = ref(false);
const busy = ref(false);
const waiting = ref(false);
const phaseText = ref("");
let loadedOperation = "";
let pollTimer: number | undefined;
let polling = false;
const query = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const bookmarksTableRef = ref<BookmarkTableHandle | null>(null);
const selectedTableIds = ref<string[]>([]);
const message = ref("");
const messageType = ref<"success" | "warning" | "error" | "info">("info");
const baseSha = ref<string | null>(null);
const connectionId = ref("");
const showAdd = ref(false);
const showFolders = ref(false);
const folders = ref<ChromeBookmarkNode[]>([]);
const folderTreeRef = ref<BookmarkTreeHandle | null>(null);
const folderQuery = ref("");
const selectedBookmarkIds = ref<string[]>([]);
const availableBookmarkCount = computed(() => folders.value.reduce((sum, folder) => sum + (folder.count || 1), 0));
const importing = ref(false);
const editingId = ref("");
const draft = reactive({ title: "", url: "", folder: "未分类", note: "" });
const pending = new Map<string, { resolve: (value: ExtensionMessage) => void; reject: (error: Error) => void }>();
const filteredBookmarks = computed(() => {
  const term = query.value.trim().toLocaleLowerCase();
  if (!term) return data.bookmarks;
  return data.bookmarks.filter((entry) => `${entry.title} ${entry.url} ${entry.folder}`.toLocaleLowerCase().includes(term));
});
const pagedBookmarks = computed(() => filteredBookmarks.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value));
watch([query, pageSize], () => { currentPage.value = 1; });
watch(folderQuery, (value) => { folderTreeRef.value?.filter(value.trim().toLocaleLowerCase()); });
watch(() => filteredBookmarks.value.length, (total) => {
  currentPage.value = Math.min(currentPage.value, Math.max(1, Math.ceil(total / pageSize.value)));
});

function onExtensionMessage(event: MessageEvent): void {
  if (event.source !== window || event.origin !== location.origin || event.data?.source !== "lptff-investment-assistant" || event.data?.type !== "LPTFF_PRIVATE_BOOKMARKS_RESPONSE") return;
  const requestId = String(event.data.requestId || "");
  const waiter = pending.get(requestId);
  if (!waiter) return;
  pending.delete(requestId);
  const result = event.data.response as ExtensionMessage | undefined;
  if (!result?.ok && !result?.conflict) waiter.reject(new Error(result?.error || "Chrome 插件未响应"));
  else waiter.resolve(result);
}

function call(action: string, payload: Record<string, unknown> = {}): Promise<ExtensionMessage> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(requestId);
      reject(new Error("Chrome 插件未响应；请确认插件已启用并刷新此页面"));
    }, 12000);
    pending.set(requestId, {
      resolve: (value) => { window.clearTimeout(timer); resolve(value); },
      reject: (error) => { window.clearTimeout(timer); reject(error); },
    });
    window.postMessage({ source: "lptff-private-bookmarks-page", type: "LPTFF_PRIVATE_BOOKMARKS_REQUEST", requestId, action, ...payload }, location.origin);
  });
}

function showMessage(text: string, type: typeof messageType.value = "info"): void {
  message.value = text;
  messageType.value = type;
}

function setData(value: VaultData, sha: string | null, remoteExists: boolean): void {
  clearTableSelection();
  currentPage.value = 1;
  data.schemaVersion = 1;
  data.updatedAt = value.updatedAt;
  data.bookmarks.splice(0, data.bookmarks.length, ...(remoteExists ? value.bookmarks : []));
  data.snapshots.splice(0, data.snapshots.length, ...value.snapshots);
  baseSha.value = sha;
  initialized.value = remoteExists;
  dirty.value = !remoteExists;
}

async function initialize(): Promise<void> {
  if (polling || busy.value) return;
  polling = true;
  try {
    const status = await call("STATUS");
    if (status.flow !== "github-page") throw new Error("请先加载 3.26.0 或更新版本的插件，再刷新页面。");
    const phase = String(status.phase || "idle");
    if (["reading", "checking", "preparing", "reviewing"].includes(phase)) {
      waiting.value = true;
      phaseText.value = phase === "reviewing" ? "内容已填入 GitHub，请检查后点击 Commit changes 保存。" : "正在等待 GitHub 页面。请在那里完成登录，插件会继续处理。";
    } else if (phase === "error") {
      waiting.value = false;
      showMessage(String(status.error || "GitHub 读取失败，本页修改仍保留。"), "warning");
    } else if (phase === "ready" && status.operationId !== loadedOperation && (!dirty.value || waiting.value)) {
      const result = await call("GET");
      setData(result.data as VaultData, (result.sha as string | null) || null, Boolean(result.initialized));
      connectionId.value = String(result.connectionId || "");
      loadedOperation = connectionId.value;
      connected.value = true;
      waiting.value = false;
      showMessage(status.completedWrite ? "已从 GitHub 重新读取，确认本次备份保存成功。" : `已读取 ${data.bookmarks.length} 条书签${result.initialized ? "" : "（首次使用，尚未保存到仓库）"}。`, "success");
    }
  } catch (error) {
    waiting.value = false;
    showMessage(error instanceof Error ? error.message : "无法连接 Chrome 插件", "warning");
  } finally { polling = false; }
}

async function cancelPending(): Promise<void> {
  try {
    const result = await call("CANCEL");
    waiting.value = false;
    connectionId.value = String(result.connectionId || connectionId.value);
    loadedOperation = connectionId.value;
    showMessage("已取消等待，本页修改仍保留。GitHub 编辑页中的草稿未自动提交。", "info");
  } catch (error) { showMessage(error instanceof Error ? error.message : "取消失败", "error"); }
}

async function openSettings(): Promise<void> {
  try { await call("OPEN_SETTINGS"); }
  catch (error) { showMessage(error instanceof Error ? error.message : "无法打开插件设置", "warning"); }
}

async function reloadData(): Promise<void> {
  if (busy.value || waiting.value) return;
  if (dirty.value) {
    try { await ElMessageBox.confirm("重新读取会替换当前尚未保存的修改。是否继续？", "未保存修改", { type: "warning" }); }
    catch { return; }
  }
  busy.value = true;
  try {
    const status = await call("STATUS");
    if (status.flow !== "github-page") throw new Error("请先加载 3.26.0 或更新版本的插件，再刷新页面。");
    const result = await call("READ");
    if (connected.value) connectionId.value = String(result.operationId || connectionId.value);
    waiting.value = true;
    phaseText.value = "请在 GitHub 完成登录，读取后会返回本页。";
    showMessage("已打开 GitHub，等待读取书签。", "info");
  } catch (error) { showMessage(error instanceof Error ? error.message : "无法打开 GitHub", "error"); }
  finally { busy.value = false; }
}

async function syncData(): Promise<void> {
  if (busy.value || waiting.value) return;
  busy.value = true;
  try {
    const result = await call("SYNC", { data: JSON.parse(JSON.stringify(data)), baseSha: baseSha.value, connectionId: connectionId.value });
    connectionId.value = String(result.operationId || connectionId.value);
    waiting.value = true;
    phaseText.value = "正在准备 GitHub 编辑页面，请检查内容后确认保存。";
    showMessage("尚未写入仓库，请在 GitHub 页面确认保存。", "info");
  } catch (error) { showMessage(error instanceof Error ? error.message : "准备备份失败；本页修改仍保留", "error"); }
  finally { busy.value = false; }
}

function markDirty(): void { dirty.value = true; }
function onTableSelectionChange(rows: Bookmark[]): void {
  selectedTableIds.value = [...new Set(rows.map((row) => row.id))];
}
function clearTableSelection(): void {
  bookmarksTableRef.value?.clearSelection();
  selectedTableIds.value = [];
}
function editBookmark(entry: Bookmark): void {
  editingId.value = entry.id;
  Object.assign(draft, { title: entry.title, url: entry.url, folder: entry.folder, note: entry.note });
  showAdd.value = true;
}
function resetDraft(): void { editingId.value = ""; Object.assign(draft, { title: "", url: "", folder: "未分类", note: "" }); }

function saveBookmark(): void {
  const index = data.bookmarks.findIndex((item) => item.id === editingId.value);
  if (index < 0) { showAdd.value = false; resetDraft(); return; }
  const url = draft.url.trim();
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { ElMessage.warning("请输入有效的 HTTP 或 HTTPS 网址"); return; }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    ElMessage.warning("仅支持不包含嵌入式账号密码的 HTTP 或 HTTPS 网址"); return;
  }
  const entry: Bookmark = {
    id: editingId.value, title: draft.title.trim() || url, url,
    folder: draft.folder.trim() || "未分类", note: draft.note.trim(), updatedAt: new Date().toISOString(),
  };
  data.bookmarks.splice(index, 1, entry);
  markDirty(); showAdd.value = false; resetDraft();
}

async function removeBookmark(entry: Bookmark): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除“${entry.title}”？修改在同步前只保存在本页。`, "删除书签", { type: "warning" });
    const index = data.bookmarks.findIndex((item) => item.id === entry.id);
    if (index < 0) return;
    data.bookmarks.splice(index, 1);
    clearTableSelection();
    markDirty();
  } catch {}
}

async function removeSelectedBookmarks(): Promise<void> {
  const selected = new Set(selectedTableIds.value);
  const count = data.bookmarks.filter((item) => selected.has(item.id)).length;
  if (!count) { clearTableSelection(); return; }
  try {
    await ElMessageBox.confirm(`确定删除已选的 ${count} 条书签？包含其他分页或筛选下的已选项。修改在同步前只保存在本页。`, "批量删除书签", { type: "warning" });
    data.bookmarks.splice(0, data.bookmarks.length, ...data.bookmarks.filter((item) => !selected.has(item.id)));
    clearTableSelection();
    markDirty();
    showMessage(`已删除 ${count} 条书签；去 GitHub 保存后才会写入仓库。`, "success");
  } catch {}
}

async function loadFolders(): Promise<void> {
  try {
    const result = await call("FOLDERS");
    if (result.treeVersion !== 2 || !Array.isArray(result.items)) throw new Error("请重新加载 3.26.3 或更新版本的 Chrome 插件后重试");
    folders.value = result.items as ChromeBookmarkNode[];
    folderQuery.value = "";
    selectedBookmarkIds.value = [];
    showFolders.value = true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "读取书签文件夹失败";
    showMessage(detail.includes("重新加载 3.26.3") ? detail : `${detail}。如尚未授权，请点击“书签导入权限”启用。`, "warning");
  }
}

function filterBookmarkNode(value: string, node: Record<string, unknown>): boolean {
  return !value || String(node.title || "").toLocaleLowerCase().includes(value);
}

function updateBookmarkSelection(): void {
  selectedBookmarkIds.value = (folderTreeRef.value?.getCheckedNodes(true) || []).filter((node) => node.type === "bookmark").map((node) => node.id);
}

function selectAllBookmarks(): void {
  folderTreeRef.value?.setCheckedKeys(folders.value.map((folder) => folder.id));
  updateBookmarkSelection();
}

function clearBookmarkSelection(): void {
  folderTreeRef.value?.setCheckedKeys([]);
  updateBookmarkSelection();
}

async function importBookmarks(): Promise<void> {
  if (importing.value || !selectedBookmarkIds.value.length || selectedBookmarkIds.value.length > 5000) return;
  const bookmarkIds = [...selectedBookmarkIds.value];
  importing.value = true;
  busy.value = true;
  try {
    const imported: Bookmark[] = [];
    for (let offset = 0; offset < bookmarkIds.length; offset += 1000) {
      const chunk = bookmarkIds.slice(offset, offset + 1000);
      const result = await call("IMPORT_SELECTED", { bookmarkIds: chunk });
      if (!Array.isArray(result.items) || result.items.length !== chunk.length) throw new Error("Chrome 返回的书签数量不完整；此次未导入任何内容");
      imported.push(...(result.items as Bookmark[]));
    }
    const known = new Set(data.bookmarks.map((item) => item.url));
    const additions = imported.filter((item) => {
      if (known.has(item.url)) return false;
      known.add(item.url);
      return true;
    });
    if (data.bookmarks.length + additions.length > 5000) throw new Error("导入后将超过 5000 条书签，请减少勾选数量。此次未导入任何内容。");
    data.bookmarks.unshift(...additions);
    clearTableSelection();
    currentPage.value = 1;
    if (additions.length) markDirty();
    showFolders.value = false;
    showMessage(`已导入 ${additions.length} 条新书签，跳过 ${imported.length - additions.length} 条重复链接。Chrome 原书签未更改。`, "success");
  } catch (error) { showMessage(error instanceof Error ? error.message : "导入失败，此次未导入任何内容", "error"); }
  finally { importing.value = false; busy.value = false; }
}

async function disconnect(): Promise<void> {
  try {
    await ElMessageBox.confirm("断开后会清空本页书签与本次读取缓存，GitHub 登录和仓库文件不受影响。", "断开私人仓库", { type: "warning" });
    await call("DISCONNECT");
    clearTableSelection();
    connected.value = false; initialized.value = false; dirty.value = false; baseSha.value = null; waiting.value = false; loadedOperation = ""; connectionId.value = "";
    Object.assign(data, emptyData());
    showMessage("已断开连接；GitHub 仓库内容保持不变。", "success");
  } catch (error) { if (error instanceof Error) showMessage(error.message, "error"); }
}

function warnBeforeUnload(event: BeforeUnloadEvent): void {
  if (dirty.value) { event.preventDefault(); event.returnValue = ""; }
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true;
  try {
    await ElMessageBox.confirm("还有未同步的修改，离开后将丢失。是否继续？", "未同步修改", { type: "warning" });
    return true;
  } catch { return false; }
});

onMounted(() => {
  window.addEventListener("message", onExtensionMessage);
  window.addEventListener("beforeunload", warnBeforeUnload);
  window.addEventListener("focus", initialize);
  pollTimer = window.setInterval(() => { if (waiting.value) void initialize(); }, 2000);
  void initialize();
});
onBeforeUnmount(() => {
  window.removeEventListener("focus", initialize);
  window.clearInterval(pollTimer);
  window.removeEventListener("beforeunload", warnBeforeUnload);
  window.removeEventListener("message", onExtensionMessage);
  for (const item of pending.values()) item.reject(new Error("页面已关闭"));
  pending.clear();
});
</script>

<style scoped>
.private-bookmarks { max-width: 1280px; margin: 0 auto; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-heading h1 { margin: 0 0 8px; }
.page-heading p { max-width: 820px; margin: 0; color: var(--el-text-color-secondary); }
.heading-actions, .toolbar { display: flex; flex-wrap: wrap; gap: 8px; }
.waiting { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; }
.toolbar { align-items: center; margin: 16px 0; }
.search { width: min(340px, 100%); }
.bookmark-pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.bookmark-pagination :deep(.el-pagination) { flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.el-table a { overflow-wrap: anywhere; }
.import-help { margin: 0 0 12px; color: var(--el-text-color-secondary); line-height: 1.5; }
.import-tools { display: flex; gap: 8px; margin-bottom: 10px; }
.import-tools .el-input { flex: 1; min-width: 0; }
.bookmark-tree { height: min(420px, 48vh); overflow: auto; border: 1px solid var(--el-border-color); border-radius: 6px; padding: 6px; }
.bookmark-tree-label { display: inline-flex; min-width: 0; max-width: 100%; gap: 8px; align-items: center; }
.bookmark-tree-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bookmark-tree-count { flex: none; color: var(--el-text-color-placeholder); font-size: 12px; }
.import-summary { margin: 10px 0 0; color: var(--el-text-color-secondary); font-size: 13px; }
@media (max-width: 760px) {
  .page-heading { flex-direction: column; }
  .heading-actions { width: 100%; }
  .import-tools { flex-wrap: wrap; }
  .import-tools .el-input { flex-basis: 100%; }
}
</style>
