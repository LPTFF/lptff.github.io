<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  buildResearchBookmarksIssueDraft,
  MAX_BOOKMARK_FILE_SIZE,
  MAX_BOOKMARKS_PER_ISSUE,
  parseBrowserBookmarksHtml,
  RESEARCH_BOOKMARKS_MARKDOWN_PATH,
  type BrowserBookmark,
} from "./researchBookmarks";

const fileInput = ref<HTMLInputElement | null>(null);
const importedBookmarks = ref<BrowserBookmark[]>([]);
const selectedKeys = ref<string[]>([]);
const searchQuery = ref("");
const importedFileName = ref("");
const importNote = ref("");
const copyStatus = ref("");
const showIssueBody = ref(false);

const filteredBookmarks = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase();
  if (!keyword) return importedBookmarks.value;
  return importedBookmarks.value.filter((bookmark) => (
    bookmark.title.toLocaleLowerCase().includes(keyword)
    || bookmark.url.toLocaleLowerCase().includes(keyword)
  ));
});
const displayedBookmarks = computed(() => filteredBookmarks.value.slice(0, 200));
const selectedBookmarks = computed(() => {
  const selected = new Set(selectedKeys.value);
  return importedBookmarks.value.filter((bookmark) => selected.has(bookmark.key));
});
const issueDraft = computed(() => {
  try {
    return { ...buildResearchBookmarksIssueDraft(selectedBookmarks.value), error: "" };
  } catch (error) {
    return {
      body: "",
      url: "",
      bodyPrefilled: false,
      error: error instanceof Error ? error.message : "无法生成 Issue 内容",
    };
  }
});

watch(issueDraft, () => {
  copyStatus.value = "";
  showIssueBody.value = false;
});

function chooseBookmarkFile(): void {
  fileInput.value?.click();
}

async function importBookmarkFile(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    if (file.size > MAX_BOOKMARK_FILE_SIZE) {
      throw new Error("书签文件超过 10 MB，请拆分后再导入");
    }
    const result = parseBrowserBookmarksHtml(await file.text());
    if (!result.bookmarks.length) {
      throw new Error("没有找到可公开访问的网页书签");
    }

    importedBookmarks.value = result.bookmarks;
    importedFileName.value = file.name;
    selectedKeys.value = [];
    searchQuery.value = "";

    const details = [`导入 ${result.bookmarks.length} 条`];
    if (result.duplicates) details.push(`合并重复 ${result.duplicates} 条`);
    if (result.skipped) details.push(`跳过非公开或无效地址 ${result.skipped} 条`);
    if (result.truncated) details.push("仅保留前 5000 条");
    importNote.value = details.join(" · ");
    ElMessage.success(`已读取 ${result.bookmarks.length} 条浏览器书签`);
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : "书签文件读取失败");
  } finally {
    input.value = "";
  }
}

function toggleBookmark(bookmark: BrowserBookmark, event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  const selected = new Set(selectedKeys.value);
  if (input.checked) {
    if (selected.size >= MAX_BOOKMARKS_PER_ISSUE) {
      input.checked = false;
      ElMessage.warning(`每个 Issue 最多选择 ${MAX_BOOKMARKS_PER_ISSUE} 条资料`);
      return;
    }
    selected.add(bookmark.key);
  } else {
    selected.delete(bookmark.key);
  }
  selectedKeys.value = Array.from(selected);
}

function selectCurrentResults(): void {
  const chosen = filteredBookmarks.value.slice(0, MAX_BOOKMARKS_PER_ISSUE);
  selectedKeys.value = chosen.map((bookmark) => bookmark.key);
  if (filteredBookmarks.value.length > MAX_BOOKMARKS_PER_ISSUE) {
    ElMessage.info(`已选择当前结果中的前 ${MAX_BOOKMARKS_PER_ISSUE} 条`);
  }
}

function clearSelection(): void {
  selectedKeys.value = [];
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    const previousFocus = document.activeElement;
    try {
      textarea.select();
      if (!document.execCommand("copy")) throw new Error("copy failed");
    } finally {
      textarea.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }
  }
}

async function copyIssueDescription(): Promise<void> {
  const draft = issueDraft.value;
  if (draft.error) {
    ElMessage.warning(draft.error);
    return;
  }
  copyStatus.value = "正在复制描述…";
  try {
    await copyText(draft.body);
    if (issueDraft.value !== draft) return;
    copyStatus.value = "完整描述已复制，可在 GitHub 的 Add a description 中粘贴。";
  } catch {
    if (issueDraft.value !== draft) return;
    showIssueBody.value = true;
    copyStatus.value = draft.bodyPrefilled
      ? "备用复制失败；打开 Issue 的链接仍携带完整描述，也可在下方手动复制。"
      : "复制失败，请在下方描述框中全选并复制，再粘贴到 GitHub 的 Add a description。";
  }
}

function copyAndOpenGitHubIssue(): void {
  const draft = issueDraft.value;
  if (draft.error) {
    ElMessage.warning(draft.error);
    return;
  }

  // Keep opening in the click handler so clipboard permission prompts cannot block the new tab.
  void copyIssueDescription();
  const anchor = document.createElement("a");
  anchor.href = draft.url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function bookmarkHost(bookmark: BrowserBookmark): string {
  try {
    return new URL(bookmark.url).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
}
</script>

<template>
  <section class="bookmark-sync-card">
    <header class="sync-header">
      <div>
        <h2>收藏研究资料</h2>
        <p>从浏览器书签中挑选地址，自动带入 GitHub Issue 描述，再补充研究目标和标签。</p>
      </div>
      <a class="published-link" :href="RESEARCH_BOOKMARKS_MARKDOWN_PATH" target="_blank" rel="noopener noreferrer">
        查看线上资料 ↗
      </a>
    </header>

    <div class="workflow-strip" aria-label="使用步骤">
      <span><b>1</b> 选择书签文件</span>
      <i>→</i>
      <span><b>2</b> 勾选研究地址</span>
      <i>→</i>
      <span><b>3</b> 打开 Issue 并补充信息</span>
    </div>

    <div class="import-row">
      <el-button type="primary" size="small" @click="chooseBookmarkFile">选择书签 HTML</el-button>
      <input
        ref="fileInput"
        class="file-input"
        hidden
        type="file"
        accept=".html,.htm,text/html"
        @change="importBookmarkFile"
      />
      <div class="import-copy">
        <strong v-if="importedFileName">{{ importedFileName }}</strong>
        <span v-if="importNote">{{ importNote }}</span>
        <span v-else>在浏览器书签管理器中先选择“导出书签”，再选择导出的 HTML 文件。</span>
      </div>
    </div>

    <template v-if="importedBookmarks.length">
      <div class="bookmark-toolbar">
        <el-input
          v-model="searchQuery"
          class="bookmark-search"
          size="small"
          clearable
          placeholder="搜索书签标题或地址"
        />
        <span class="result-count">{{ filteredBookmarks.length }} / {{ importedBookmarks.length }} 条</span>
        <el-button size="small" @click="selectCurrentResults">选择当前结果</el-button>
        <el-button size="small" :disabled="!selectedKeys.length" @click="clearSelection">取消选择</el-button>
      </div>

      <div class="bookmark-list" role="list" aria-label="浏览器书签">
        <label v-for="bookmark in displayedBookmarks" :key="bookmark.key" class="bookmark-row">
          <input
            type="checkbox"
            :checked="selectedKeys.includes(bookmark.key)"
            @change="toggleBookmark(bookmark, $event)"
          />
          <span class="bookmark-main">
            <strong>{{ bookmark.title }}</strong>
            <small>{{ bookmark.url }}</small>
          </span>
          <em>{{ bookmarkHost(bookmark) }}</em>
        </label>
        <div v-if="!filteredBookmarks.length" class="empty-state">没有匹配的书签</div>
      </div>
      <p v-if="filteredBookmarks.length > displayedBookmarks.length" class="list-limit">
        当前只展示前 {{ displayedBookmarks.length }} 条，请用搜索缩小范围。
      </p>

      <div class="issue-actions">
        <span>已选 {{ selectedBookmarks.length }} 条，每个 Issue 最多 {{ MAX_BOOKMARKS_PER_ISSUE }} 条。</span>
        <div>
          <el-button size="small" :disabled="!selectedBookmarks.length || !!issueDraft.error" @click="copyIssueDescription">
            仅复制描述
          </el-button>
          <el-button type="primary" size="small" :disabled="!selectedBookmarks.length || !!issueDraft.error" @click="copyAndOpenGitHubIssue">
            {{ selectedBookmarks.length && !issueDraft.bodyPrefilled ? "复制并打开 GitHub Issue" : "填写并打开 GitHub Issue" }}
          </el-button>
        </div>
      </div>

      <div v-if="selectedBookmarks.length" class="issue-description">
        <p v-if="issueDraft.error" role="alert">{{ issueDraft.error }}</p>
        <template v-else>
          <p v-if="issueDraft.bodyPrefilled">打开后，标题和 Add a description 会自动填入，同时复制描述备用。请在 GitHub 中检查、补充后再提交。</p>
          <p v-else class="paste-notice">所选内容较长，无法通过链接自动填入。请打开 GitHub 后，在 Add a description 中粘贴完整描述；也可减少勾选数量。</p>
          <p v-if="copyStatus" role="status">{{ copyStatus }}</p>
          <details :open="showIssueBody" @toggle="showIssueBody = ($event.currentTarget as HTMLDetailsElement).open">
            <summary>查看或手动复制完整描述</summary>
            <textarea :value="issueDraft.body" readonly rows="10" aria-label="Issue 完整描述" spellcheck="false" />
          </details>
        </template>
      </div>
    </template>

    <div v-else class="empty-state initial-empty">
      页面不会读取浏览历史或 GitHub 令牌；导入内容仅在当前页面中用于生成 Issue 格式。
    </div>

    <footer class="sync-footer">已填写的研究资料 Issue 会在网站 CI 构建时同步到公开清单。</footer>
  </section>
</template>

<style scoped>
.bookmark-sync-card {
  overflow: hidden;
  border: 1px solid #d8e2f0;
  border-radius: 9px;
  background: #fff;
  color: #2d3d55;
}

.sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 18px;
  border-bottom: 1px solid #dce6f4;
  background: #f3f7fe;
}

.sync-header h2 {
  margin: 0 0 4px;
  color: #173c72;
  font-size: 20px;
  line-height: 1.25;
}

.sync-header p {
  margin: 0;
  color: #68778e;
  font-size: 12px;
  line-height: 1.5;
}

.published-link {
  flex: none;
  color: #2872d0;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.published-link:hover {
  text-decoration: underline;
}

.workflow-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px;
  border-bottom: 1px solid #edf1f6;
  color: #63728a;
  font-size: 12px;
}

.workflow-strip span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.workflow-strip b {
  display: inline-grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  background: #e8f1ff;
  color: #2872d0;
  font-size: 10px;
}

.workflow-strip i {
  color: #a7b2c2;
  font-style: normal;
}

.import-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid #edf1f6;
}

.file-input {
  display: none;
}

.import-copy {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: #7d899a;
  font-size: 11px;
}

.import-copy strong {
  overflow: hidden;
  max-width: 260px;
  color: #3f536f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
}

.bookmark-search {
  width: min(420px, 45vw);
}

.result-count {
  margin-right: auto;
  color: #8490a1;
  font-size: 11px;
  white-space: nowrap;
}

.bookmark-list {
  max-height: 420px;
  margin: 0 18px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.bookmark-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 150px;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
}

.bookmark-row:last-child {
  border-bottom: 0;
}

.bookmark-row:hover {
  background: #f7faff;
}

.bookmark-row input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #377ed8;
}

.bookmark-main {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.bookmark-main strong,
.bookmark-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-main strong {
  color: #344865;
  font-size: 12px;
  font-weight: 600;
}

.bookmark-main small,
.bookmark-row em {
  color: #909bad;
  font-size: 10px;
  font-style: normal;
}

.bookmark-row em {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 28px 18px;
  color: #8b96a7;
  font-size: 11px;
  text-align: center;
}

.initial-empty {
  border-bottom: 1px solid #edf1f6;
}

.list-limit {
  margin: 6px 18px 0;
  color: #8b96a7;
  font-size: 10px;
  text-align: right;
}

.issue-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 18px;
  color: #6f7e92;
  font-size: 11px;
}

.issue-actions > div {
  display: flex;
  gap: 8px;
}

.issue-description {
  margin: 0 18px 12px;
  padding: 10px 12px;
  border: 1px solid #dce6f4;
  border-radius: 6px;
  background: #f7faff;
  color: #526680;
  font-size: 12px;
  line-height: 1.6;
}

.issue-description p {
  margin: 0 0 6px;
}

.paste-notice {
  color: #8a570b;
}

.issue-description summary {
  width: fit-content;
  color: #2872d0;
  cursor: pointer;
}

.issue-description textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #cbd8e8;
  border-radius: 4px;
  background: #fff;
  color: #344865;
  font: 12px/1.5 ui-monospace, monospace;
  resize: vertical;
}

.sync-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 18px;
  border-top: 1px solid #dfe7f2;
  background: #fafbfd;
  color: #77859a;
  font-size: 11px;
}

@media (max-width: 768px) {
  .bookmark-sync-card {
    margin-bottom: 100px;
  }

  .sync-header,
  .issue-actions,
  .sync-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .workflow-strip {
    flex-wrap: wrap;
    gap: 7px 9px;
  }

  .import-row,
  .bookmark-toolbar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .import-copy,
  .bookmark-search,
  .result-count {
    width: 100%;
  }

  .bookmark-list {
    max-height: 480px;
  }

  .bookmark-row {
    grid-template-columns: 18px minmax(0, 1fr);
  }

  .bookmark-row em {
    display: none;
  }

  .issue-actions > div {
    width: 100%;
  }

  .issue-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
