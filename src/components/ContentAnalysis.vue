<template>
  <div class="content-analysis" aria-label="本机 Gemini 资讯分析">
    <button type="button" :disabled="running || !pending.length" @click="analyze">{{ running ? 'Gemini 正在分析…' : `分析待标注内容（${pending.length}）` }}</button>
    <button v-if="running" type="button" @click="stopping = true">完成当前批后停止</button>
    <button type="button" @click="settings">AI 配置</button>
    <span role="status">{{ message || '复用本机 Gemini，仅发送未标注的公开标题与链接，分析结果保存在本机。' }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { authorizedRequest } from "../utils/authorizedContent";
import { saveAnalyses, analysesForItems } from "../utils/contentAnalysis";
const props = defineProps<{ domain: 'welfare' | 'pojie'; items: any[] }>();
const emit = defineEmits<{ analyzed: [results: any[]] }>();
const pending = computed(() => props.items.filter(item => !item.ecosystem || (props.domain === "welfare" && ["其他福利", "待分类"].includes(item.ecosystem.category))));
const running = ref(false), stopping = ref(false), message = ref("");
let disposed = false;
const settings = () => window.dispatchEvent(new Event("lptff-open-authorization"));
function applyCached() {
  if (!disposed) emit("analyzed", analysesForItems(props.domain, props.items));
}
let syncing = false;
async function syncCached() {
  applyCached();
  if (syncing || disposed || running.value) return;
  syncing = true;
  try {
    const items = props.items.map(item => ({ url: item.link || item.url, title: item.title || item.desc })).filter(item => {
      try { const url = new URL(item.url); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && Boolean(item.title?.trim()); }
      catch { return false; }
    });
    for (let offset = 0; offset < items.length && !disposed; offset += 500) {
      const result = await authorizedRequest("AI_CACHED", { domain: props.domain, items: items.slice(offset, offset + 500) });
      if (disposed) return;
      if (result.results.length) saveAnalyses(props.domain, result.results);
    }
  } catch { /* Existing published and local labels remain usable without the extension. */ }
  finally { syncing = false; }
}
onMounted(() => {
  void syncCached();
  window.addEventListener("storage", applyCached);
  window.addEventListener("lptff-analysis-updated", applyCached);
  window.addEventListener("focus", syncCached);
});
onUnmounted(() => {
  disposed = true; stopping.value = true;
  window.removeEventListener("storage", applyCached);
  window.removeEventListener("lptff-analysis-updated", applyCached);
  window.removeEventListener("focus", syncCached);
});
async function analyze() {
  if (running.value) return;
  running.value = true; stopping.value = false;
  let done = 0;
  try {
    applyCached();
    const config = await authorizedRequest("AI_CONFIG");
    if (!config.hasKey) { settings(); throw new Error("请在全站授权浮窗保存 Gemini Key"); }
    const candidates = pending.value.map(item => ({ url: item.link || item.url, title: item.title || item.desc }));
    for (let offset = 0; offset < candidates.length && !stopping.value; offset += 6) {
      message.value = `Gemini 分析中：${done}/${candidates.length}，结果逐批保存`;
      const result = await authorizedRequest("AI_ANALYZE", { domain: props.domain, items: candidates.slice(offset, offset + 6) });
      saveAnalyses(props.domain, result.results);
      done += result.results.length;
      if (!disposed) emit("analyzed", result.results);
    }
    message.value = stopping.value ? `已停止，保留 ${done} 条分析` : `已完成 ${done} 条 Gemini 分析，结果已保存`;
  } catch (error) { message.value = `已保存 ${done} 条；${(error as Error).message}`; }
  finally { running.value = false; }
}
</script>
<style scoped>
.content-analysis { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 14px 0; font-size: 12px; color: #626c68; }
button { padding: 7px 12px; border: 1px solid #cbded3; border-radius: 8px; color: #17624f; background: #fff; cursor: pointer; }
button:disabled { opacity: .6; cursor: default; }
</style>
