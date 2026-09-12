<template>
  <section class="collection-freshness" aria-label="插件采集新鲜度">
    <div v-for="platform in platforms" :key="platform" class="freshness-row" :data-state="status(platform).state">
      <span role="status"><strong>{{ platform === 'bilibili' ? 'B 站' : '抖音' }}</strong> · {{ status(platform).label }}<small v-if="status(platform).checkedAt"> · 上次成功 {{ formatTime(status(platform).checkedAt) }}</small></span>
      <button type="button" :disabled="busy" @click="refresh(platform)">{{ refreshing === platform ? '正在采集…' : '手动采集刷新' }}</button>
      <button v-if="newer(platform)" type="button" :disabled="busy" @click="load(platform)">载入已采集结果</button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import catalog from "../../project-support/extension/lptff-investment-assistant/content-sources.json";
import { authorizedRequest, authorizedCollectionMeta, saveAuthorizedItems } from "../utils/authorizedContent";
import { collectionFreshness } from "../utils/collectionFreshness";
const props = defineProps<{ tab: string }>();
const sources = catalog.filter(item => item.tab === props.tab);
const platforms = [...new Set(sources.map(item => item.platform))];
const remote = ref<Record<string, any>>({}), now = ref(Date.now()), message = ref(""), refreshing = ref("");
const busy = computed(() => !!refreshing.value || Object.values(remote.value).some(item => item.state === "running"));
let timer: ReturnType<typeof setTimeout> | undefined, disposed = false;
const formatTime = (time: number) => new Date(time).toLocaleString('zh-CN', { hour12: false });
const status = (platform: string) => {
  const local = authorizedCollectionMeta(platform);
  const latest = remote.value[platform];
  // Describe the displayed data's collection age; never use import time as freshness.
  const meta = latest ? { ...local,
    state: ["running", "failed", "cancelled"].includes(latest.state) ? latest.state : local.state,
    sources: sources.filter(source => source.platform === platform).map(source => local.sources.find((item: any) => item.uid === source.uid) || { uid: source.uid, state: "unknown", lastSuccessAt: 0 }).map((item: any) => {
      const attempt = latest.sources?.find((source: any) => source.uid === item.uid);
      return attempt && ["needs-login", "unavailable"].includes(attempt.state) ? { ...item, state: attempt.state } : item;
    }),
  } : local;
  return collectionFreshness(meta, sources.filter(item => item.platform === platform).map(item => item.uid), now.value);
};
const newer = (platform: string) => remote.value[platform]?.count > 0 && (remote.value[platform]?.updatedAt > authorizedCollectionMeta(platform).updatedAt || !authorizedCollectionMeta(platform).sources.length);
async function check() {
  clearTimeout(timer);
  now.value = Date.now();
  try { const result = await authorizedRequest("STATUS"); if (!disposed) remote.value = result.platforms; }
  catch { /* Keep local age visible if the extension is disconnected. */ }
  if (!disposed) timer = setTimeout(check, Object.values(remote.value).some(item => item.state === "running") ? 2000 : 60000);
}
async function load(platform: string) {
  try {
    const result = await authorizedRequest("RESULT", { platform });
    if (disposed) return;
    if (saveAuthorizedItems(platform, result.items, result)) window.location.reload();
    else message.value = "没有可载入的结果，已保留原内容";
  } catch (error) { message.value = (error as Error).message; }
}
async function refresh(platform: string) {
  if (busy.value) return;
  refreshing.value = platform;
  try {
    await authorizedRequest("START", { platform });
    message.value = "正在使用 Chrome 登录状态采集；失败时保留已有内容。";
    const deadline = Date.now() + 180000;
    while (!disposed && Date.now() < deadline) {
      const result = await authorizedRequest("STATUS");
      if (disposed) return;
      remote.value = result.platforms;
      if (result.platforms[platform].state !== "running") { await load(platform); return; }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    message.value = "采集仍在扩展运行，可从全站授权浮窗查看进度";
  } catch (error) {
    message.value = (error as Error).message;
    window.dispatchEvent(new Event("lptff-open-authorization"));
  } finally { refreshing.value = ""; }
}
const storageChanged = (event: StorageEvent) => { if (event.key === "lptff-authorized-content-v1") void check(); };
onMounted(() => { void check(); window.addEventListener("storage", storageChanged); window.addEventListener("focus", check); });
onUnmounted(() => { disposed = true; clearTimeout(timer); window.removeEventListener("storage", storageChanged); window.removeEventListener("focus", check); });
</script>
<style scoped>
.collection-freshness { margin: 12px 0; font-size: 12px; color: #626c68; }
.freshness-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
[data-state="stale"], [data-state="failed"], [data-state="soon"] { color: #ad681c; }
button { padding: 5px 10px; border: 1px solid #cbded3; border-radius: 8px; color: #17624f; background: #fff; cursor: pointer; }
button:disabled { opacity: .55; cursor: default; } small { font-size: inherit; }
</style>
