<template>
  <section class="manual-collector" aria-label="抖音插件手动更新">
    <header class="collector-header">
      <div>
        <h3>抖音插件手动更新</h3>
        <p>服务器无法直接采集时，可使用当前 Chrome 登录态更新作者作品；完成后会立即合并到本机列表。</p>
      </div>
      <button class="connection-button" type="button" :disabled="connecting" @click="connect">
        {{ connectionLabel }}
      </button>
    </header>

    <div class="collector-actions">
      <button class="primary-action" type="button" :disabled="!connected || isRunning" @click="start">
        {{ isRunning ? "正在采集…" : "采集抖音作者" }}
      </button>
      <button v-if="isRunning" class="danger-action" type="button" @click="request('STOP')">停止</button>
      <button v-else-if="canResume" type="button" :disabled="!connected" @click="resume">继续未完成任务</button>
      <button type="button" :disabled="!connected || isRunning" @click="request('LOGIN', { platform: 'douyin' })">打开抖音登录</button>
      <button type="button" :disabled="!connected || !states.douyin?.count || isRunning" @click="loadResult">重新载入本机结果</button>
    </div>

    <div v-if="taskSnapshot || states.douyin" class="collection-summary" role="status" aria-live="polite">
      <strong>{{ collectionStateLabel }}</strong>
      <span v-if="taskSnapshot">作者 {{ completedAuthors }}/{{ totalAuthors }}</span>
      <span v-if="states.douyin?.count">本机 {{ states.douyin.count }} 条</span>
      <span v-if="taskSummary.validUniqueCount">本轮 {{ taskSummary.validUniqueCount }} 条有效</span>
      <span v-if="taskSnapshot?.elapsedMs">{{ (taskSnapshot.elapsedMs / 1000).toFixed(1) }} 秒</span>
      <span v-if="freshnessLabel">{{ freshnessLabel }}</span>
    </div>

    <p v-if="importMessage" class="success-message">{{ importMessage }}</p>
    <p v-if="message" class="error-message" role="alert">{{ message }}</p>

    <details v-if="authors.length" class="author-details">
      <summary>查看作者采集明细</summary>
      <div v-for="author in authors" :key="author.uid" class="author-row">
        <strong>{{ author.name }}</strong>
        <span>{{ formatAuthorProgress(author) }}</span>
      </div>
    </details>

    <details v-if="!connected" class="install-details">
      <summary>未检测到扩展？</summary>
      <p>请确认已加载 3.25.0 或更新版本并刷新本页。</p>
      <button type="button" @click="downloadPlugin">下载采集扩展</button>
      <p v-if="pluginHint">{{ pluginHint.title }}：{{ pluginHint.desc }}</p>
    </details>

    <p class="bridge-hint">家庭服务器自动同步和配对密钥请在扩展的“内容平台授权”设置中管理。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { authorizedRequest, getSavedResultVersion, saveAuthorizedItems } from "../../../../utils/authorizedContent";
import { collectionFreshness } from "../../../../utils/collectionFreshness";
import catalog from "../../../../../project-support/extension/lptff-investment-assistant/content-sources.json";
import { usePluginGuide } from "../../../../investment/composables/use-plugin-guide";
import { WEB_BUILD_TAG, EXPECTED_EXTENSION_BUILD_TAG } from "../../../../build-info";

const { downloadPlugin, pluginHint } = usePluginGuide();
const connected = ref(false);
const connecting = ref(false);
const version = ref("");
const message = ref("");
const importMessage = ref("");
const states = ref<Record<string, any>>({});
const taskSnapshot = ref<any>(null);
const lastImportedVersion = ref(getSavedResultVersion());
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let connectingPromise: Promise<void> | null = null;

const douyinCatalog = catalog.filter((source) => source.platform === "douyin");
const taskSummary = computed(() => taskSnapshot.value?.summary || {});
const isRunning = computed(() => taskSnapshot.value?.phase === "running" || states.value.douyin?.state === "running");
const canResume = computed(() => ["partial", "interrupted", "cancelled", "failed"].includes(taskSnapshot.value?.phase));
const totalAuthors = computed(() => taskSummary.value.totalAuthors || douyinCatalog.length);
const completedAuthors = computed(() => taskSummary.value.completedAuthors || 0);
const authors = computed(() => taskSnapshot.value?.authors?.filter((author: any) => author.platform === "douyin") || []);
const freshnessLabel = computed(() => states.value.douyin
  ? collectionFreshness(states.value.douyin, douyinCatalog.map((source) => source.uid)).label
  : "");
const connectionLabel = computed(() => connecting.value
  ? "正在检查…"
  : connected.value ? `扩展已连接 · ${version.value}` : "检查扩展连接");
const collectionStateLabel = computed(() => {
  if (isRunning.value) return "正在采集";
  const state = states.value.douyin?.state || taskSnapshot.value?.phase;
  if (["success", "completed"].includes(state)) return "采集完成";
  if (["partial", "interrupted", "cancelled"].includes(state)) return "采集未完成";
  if (state === "failed") return "采集失败，已保留旧结果";
  return "等待采集";
});

function formatAuthorProgress(author: any) {
  const labels: Record<string, string> = {
    waiting: "等待", running: "采集中", completed: "完成", partial: "部分完成",
    failed: "失败", cancelled: "已停止", "needs-login": "等待登录", interrupted: "已中断",
  };
  const parts = [labels[author.status] || author.status];
  if (author.itemsCount) parts.push(`${author.itemsCount} 条`);
  if (author.pageCount) parts.push(`${author.pageCount} 页`);
  if (author.durationMs) parts.push(`${(author.durationMs / 1000).toFixed(1)} 秒`);
  if (author.endReason) parts.push(author.endReason);
  return parts.join(" · ");
}

async function importLatestResult(resultVersion: number, force = false) {
  if (!force && resultVersion <= lastImportedVersion.value) return;
  const result = await authorizedRequest("RESULT", { platform: "douyin" });
  const count = saveAuthorizedItems("douyin", result.items, result);
  lastImportedVersion.value = resultVersion;
  importMessage.value = count ? `页面已更新：载入 ${count} 条去重后的抖音作品。` : "没有发现新的有效作品，继续保留现有内容。";
}

async function connect() {
  if (connectingPromise) return connectingPromise;
  clearTimeout(timer);
  connecting.value = true;
  connectingPromise = (async () => {
    try {
      const result = await authorizedRequest("STATUS");
      if (disposed) return;
      connected.value = true;
      version.value = result.version || "";
      states.value = result.platforms || {};
      taskSnapshot.value = result.task || null;
      message.value = "";
      if (result.resultVersion) await importLatestResult(result.resultVersion);
      if (!disposed) timer = setTimeout(connect, isRunning.value ? 2000 : 30000);
    } catch (error) {
      connected.value = false;
      message.value = (error as Error).message;
      if (!disposed) timer = setTimeout(connect, 5000);
    } finally {
      connecting.value = false;
      connectingPromise = null;
    }
  })();
  return connectingPromise;
}

async function start() {
  importMessage.value = "";
  await request("START", { platform: "douyin" });
}

async function resume() {
  await request("RESUME", { platform: "douyin" });
}

async function request(action: string, payload: Record<string, unknown> = {}) {
  try {
    await authorizedRequest(action, payload);
    message.value = "";
    await connect();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

async function loadResult() {
  try {
    const result = await authorizedRequest("RESULT", { platform: "douyin" });
    const count = saveAuthorizedItems("douyin", result.items, result);
    importMessage.value = count ? `页面已更新：载入 ${count} 条去重后的抖音作品。` : "没有可载入的新结果。";
  } catch (error) {
    message.value = (error as Error).message;
  }
}

function onWindowMessage(event: MessageEvent) {
  if (event.source !== window || event.origin !== location.origin || event.data?.source !== "lptff-investment-assistant") return;
  if (event.data.type === "LPTFF_EXTENSION_READY") {
    void connect();
    return;
  }
  if (event.data.type !== "LPTFF_AUTHORIZED_CONTENT_PROGRESS" || !event.data.snapshot) return;
  taskSnapshot.value = event.data.snapshot;
  if (event.data.snapshot.resultVersion) {
    void importLatestResult(event.data.snapshot.resultVersion, event.data.snapshot.phase === "completed");
  }
  if (event.data.snapshot.phase === "completed") void connect();
}

function onExtensionReadyCustomEvent() {
  void connect();
}

onMounted(() => {
  (window as any).__LPTFF_WEB_BUILD_TAG__ = WEB_BUILD_TAG;
  (window as any).__LPTFF_EXPECTED_EXT_BUILD_TAG__ = EXPECTED_EXTENSION_BUILD_TAG;
  window.addEventListener("message", onWindowMessage);
  window.addEventListener("LPTFF_EXTENSION_READY", onExtensionReadyCustomEvent);
  void connect();
});

onUnmounted(() => {
  disposed = true;
  clearTimeout(timer);
  window.removeEventListener("message", onWindowMessage);
  window.removeEventListener("LPTFF_EXTENSION_READY", onExtensionReadyCustomEvent);
  delete (window as any).__LPTFF_WEB_BUILD_TAG__;
  delete (window as any).__LPTFF_EXPECTED_EXT_BUILD_TAG__;
});
</script>

<style scoped>
.manual-collector { margin-top: 12px; padding: 12px; border: 1px solid #dce7f4; border-radius: 10px; background: #fff; color: #52657c; }
.collector-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.collector-header h3 { margin: 0; color: #30486f; font-size: 14px; }
.collector-header p { margin: 4px 0 0; padding: 0; border: 0; background: none; font-size: 12px; }
.collector-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
button { min-height: 30px; padding: 4px 10px; border: 1px solid #cdd9e8; border-radius: 7px; background: #fff; color: #47617e; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .55; }
.primary-action { border-color: #409eff; background: #409eff; color: #fff; }
.danger-action { border-color: #f2b8b5; color: #b42318; }
.connection-button { flex: 0 0 auto; }
.collection-summary { display: flex; flex-wrap: wrap; gap: 5px 12px; margin-top: 10px; padding: 8px 10px; border-radius: 8px; background: #f3f8ff; }
.collection-summary strong { color: #3471c9; }
.success-message, .error-message, .bridge-hint { margin: 8px 0 0; padding: 0; border: 0; background: none; }
.success-message { color: #067647; }
.error-message { color: #b42318; }
.bridge-hint { color: #7a8798; }
.author-details, .install-details { margin-top: 10px; }
.author-details summary, .install-details summary { cursor: pointer; color: #4a74ad; }
.author-row { display: flex; justify-content: space-between; gap: 12px; margin-top: 7px; padding-top: 7px; border-top: 1px solid #edf1f6; }
.author-row span { text-align: right; }
@media (max-width: 768px) {
  .collector-header, .author-row { display: block; }
  .connection-button { margin-top: 8px; }
  .author-row span { display: block; margin-top: 3px; text-align: left; }
}
</style>
