<template>
  <section class="authorization-panel" aria-label="授权采集入口">
    <header>
      <div><h2>平台登录与授权采集</h2><p>在来源网站完成登录，再选择采集范围。登录态留在 Chrome，采集结果保存在本机。</p></div>
      <button type="button" @click="connect">{{ connected ? `扩展已连接 · ${version}` : '检查扩展连接' }}</button>
    </header>
    <div class="authorization-grid">
      <article v-for="platform in platforms" :key="platform.id">
        <h3>{{ platform.name }}</h3>
        <p>{{ platform.description }}</p>
        <p class="collection-state" role="status">{{ statusText(platform.id) }}</p>
        <div class="collection-actions">
          <button type="button" :disabled="!connected || Object.values(states).some(state => state.state === 'running')" @click="start(platform.id)">手动采集刷新</button>
          <button type="button" :disabled="!connected" @click="action('LOGIN', { platform: platform.id })">打开来源 / 登录</button>
          <button v-if="states[platform.id]?.state === 'running'" type="button" @click="action('STOP', { platform: platform.id })">停止采集</button>
          <button v-else type="button" :disabled="!connected || !states[platform.id]?.count" @click="loadResult(platform.id)">载入本机结果</button>
        </div>
      </article>
    </div>
    <p>抖音作品进入“娱乐专区”；百科老王与国外主机测评进入薅羊毛“固定来源”，小迪老师进入安全社区“观察源”。</p>
    <section aria-label="全站 Gemini 配置">
      <h3>本机 Gemini · 全站共用</h3>
      <p>{{ !aiLoaded ? '读取本机配置后，可查看和修改共享密钥。' : ai.hasKey ? '已配置密钥，可用于资讯分析与现有助手。' : '尚未配置密钥。保存一次后，资讯分析与现有助手共用。' }}</p>
      <p>资讯页点击“分析待标注内容”，仅将待分析的公开标题与链接发送给 Gemini，结果缓存在本机。</p>
      <label>模型 <select v-model="ai.model" :disabled="aiBusy || !aiLoaded" @change="aiStatus = '修改未保存'"><option>gemini-3.5-flash-lite</option><option>gemini-3.6-flash</option><option>gemini-3.7-flash</option></select></label>
      <label for="global-ai-key">Gemini API Key</label>
      <div class="key-field">
        <input id="global-ai-key" v-model="apiKey" :type="keyVisible ? 'text' : 'password'" :disabled="aiBusy || !aiLoaded" autocomplete="off" placeholder="请输入 Gemini API Key" @input="keyDirty = true; aiStatus = '修改未保存'" />
        <button type="button" :disabled="!connected || aiBusy || !aiLoaded" :aria-label="keyVisible ? '隐藏 Gemini Key' : '显示 Gemini Key'" @click="toggleKey">{{ keyVisible ? '隐藏' : '显示' }}</button>
        <span>{{ !aiLoaded ? '待确认' : ai.hasKey ? '已保存' : '未配置' }}</span>
      </div>
      <button v-if="!aiLoaded" type="button" :disabled="aiLoading" @click="loadAi">{{ aiLoading ? '正在读取…' : '重新读取本机配置' }}</button>
      <p class="ai-status" role="status">{{ aiStatus }}</p>
      <button type="button" :disabled="!connected || aiBusy || !aiLoaded" @click="saveAi">{{ aiBusy ? '请稍候…' : '保存并测试' }}</button>
      <button type="button" :disabled="aiBusy || !aiLoaded || !ai.hasKey" @click="clearKey">清除 Key</button>
    </section>
    <details>
      <summary>其他已有采集功能</summary>
      <p>在现有助手中选择具体范围并启动；这里只打开入口，不自动读取账户或发起操作。</p>
      <div class="collection-actions">
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'entertainment' })">快手 / 抖音兴趣视频 / 红果</button>
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'finance' })">基金 / 币安采集助手</button>
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'market' })">BOSS 助手入口</button>
      </div>
    </details>
    <p v-if="message" role="status">{{ message }}</p>
    <details v-if="!connected">
      <summary>安装或更新采集扩展</summary>
      <p>下载并解压，在 Chrome 扩展管理页加载已解压的扩展，或重载已有扩展，再刷新本页。需要 3.22.0 或更新版本。</p>
      <button type="button" @click="downloadPlugin">下载采集扩展</button>
      <p v-if="pluginHint">{{ pluginHint.title }}：{{ pluginHint.desc }}</p>
    </details>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { authorizedRequest, saveAuthorizedItems } from "../../../../utils/authorizedContent";
import { collectionFreshness } from "../../../../utils/collectionFreshness";
import catalog from "../../../../../project-support/extension/lptff-investment-assistant/content-sources.json";
import { usePluginGuide } from "../../../../investment/composables/use-plugin-guide";
const { downloadPlugin, pluginHint } = usePluginGuide();
const connected = ref(false);
const version = ref("");
const ai = ref({ hasKey: false, model: "gemini-3.5-flash-lite" });
const apiKey = ref("");
const keyVisible = ref(false);
const keyDirty = ref(false);
const aiBusy = ref(false);
const aiStatus = ref("正在读取本机配置…");
const aiLoaded = ref(false);
const aiLoading = ref(false);
async function loadAi() {
  if (aiLoading.value || disposed) return;
  aiLoading.value = true;
  aiStatus.value = "正在读取本机配置…";
  try {
    const result = await authorizedRequest("AI_CONFIG");
    if (disposed) return;
    const secret = result.hasKey ? await authorizedRequest("AI_REVEAL") : { value: "" };
    if (disposed) return;
    apiKey.value = secret.value;
    keyDirty.value = false;
    hideKey();
    ai.value = result;
    aiLoaded.value = true;
    if (!connected.value) void connect();
    aiStatus.value = result.hasKey ? "已保存 · 与 BOSS 助手及资讯分析共用" : "尚未配置密钥";
  } catch (error) {
    if (!disposed) aiStatus.value = `读取失败：${(error as Error).message}。连接恢复后可点击重新读取。`;
  } finally { aiLoading.value = false; }
}
function hideKey() {
  keyVisible.value = false;

}
async function toggleKey() {
  if (keyVisible.value) { hideKey(); return; }
  aiBusy.value = true;
  try {
    if (!apiKey.value) {
      const result = await authorizedRequest("AI_REVEAL");
      if (disposed) return;
      if (!result.value) throw new Error("尚未保存密钥，请先输入并保存。");
      apiKey.value = result.value;
    }
    keyVisible.value = true;
  } catch (error) { aiStatus.value = (error as Error).message; }
  finally { aiBusy.value = false; }
}
async function saveAi() {
  aiBusy.value = true;
  aiStatus.value = "正在保存…";
  let saved = false;
  try {
    if (!apiKey.value.trim()) throw new Error("请输入 Gemini Key；删除已保存密钥请使用清除 Key。");
    const result = await authorizedRequest("AI_SAVE", { config: { model: ai.value.model, geminiKey: apiKey.value } });
    if (disposed) return;
    ai.value = result;
    keyDirty.value = false;
    hideKey();
    saved = true;
    aiStatus.value = "已保存 · 正在测试 Gemini 连接…";
    await authorizedRequest("AI_TEST");
    if (!disposed) aiStatus.value = "已保存 · Gemini 连接测试通过";
  } catch (error) { if (!disposed) aiStatus.value = `${saved ? '已保存，但连接测试失败' : '保存失败'}：${(error as Error).message}`; }
  finally { aiBusy.value = false; }
}
async function clearKey() {
  aiBusy.value = true;
  try {
    const result = await authorizedRequest("AI_CLEAR");
    if (disposed) return;
    ai.value = result;
    apiKey.value = "";
    keyDirty.value = false;
    hideKey();
    aiStatus.value = "Key 已清除 · 全站与 BOSS 助手同步生效";
  } catch (error) { if (!disposed) aiStatus.value = `清除失败：${(error as Error).message}`; }
  finally { aiBusy.value = false; }
}
const message = ref("");
const states = ref<Record<string, any>>({});
const pending = new Set<string>();
const platforms = [
  { id: "douyin", name: "抖音作者更新", description: "李子栗、独孤十一。只读取作者作品，不读取收藏、私信或其他个人内容。" },
  { id: "bilibili", name: "B 站作者动态", description: "百科老王、国外主机测评、AI逆向安全小迪老师、杨博士说AI。" },
];
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
const labels: Record<string, string> = { idle: "尚未采集", running: "正在采集", success: "采集完成", partial: "部分来源未完成，请登录后重试", failed: "采集失败，已保留原结果", cancelled: "采集已停止" };
function statusText(id: string) {
  const state = states.value[id];
  const fresh = collectionFreshness(state, catalog.filter(source => source.platform === id).map(source => source.uid));
  return state ? `${labels[state.state] || '待重试'} · 本机 ${state.count || 0} 条 · ${fresh.label}` : "等待扩展连接";
}
async function connect() {
  clearTimeout(timer);
  try {
    const result = await authorizedRequest("STATUS");
    if (disposed) return;
    if (!connected.value) message.value = "";
    connected.value = true;
    if (!aiLoaded.value && !aiLoading.value) void loadAi();
    version.value = result.version;
    states.value = result.platforms;
    for (const platform of [...pending]) {
      if (states.value[platform]?.state !== "running") {
        pending.delete(platform);
        if (states.value[platform]?.count) await loadResult(platform);
      }
    }
    timer = setTimeout(connect, Object.values(states.value).some((state) => state.state === "running") ? 2000 : 60000);
  } catch (error) { connected.value = false; message.value = String((error as Error).message); }
}
async function action(type: string, payload: Record<string, unknown>) {
  try { await authorizedRequest(type, payload); message.value = ""; }
  catch (error) { message.value = (error as Error).message; }
}
async function start(platform: string) {
  try {
    await authorizedRequest("START", { platform });
    pending.add(platform);
    message.value = "正在使用当前 Chrome 登录状态采集；来源未登录时，可打开来源登录后重试。";
    await connect();
  } catch (error) { message.value = (error as Error).message; }
}
async function loadResult(platform: string) {
  try {
    const result = await authorizedRequest("RESULT", { platform });
    const count = saveAuthorizedItems(platform, result.items, result);
    message.value = count ? `已保存 ${count} 条到本机，正在刷新内容。` : "没有可载入的新结果，保留已有内容。";
    if (count) window.location.reload();
  } catch (error) { message.value = (error as Error).message; }
}
onMounted(() => { void loadAi(); void connect(); });
onUnmounted(() => { disposed = true; clearTimeout(timer); apiKey.value = ""; });
</script>

<style scoped>
.authorization-panel { margin: 18px 0; padding: 22px; border: 1px solid #e2e8e5; border-radius: 16px; background: #fff; }
header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
h2 { font-size: 18px; margin: 0 0 8px; } h3 { font-size: 16px; margin: 0 0 10px; }
p { font-size: 13px; color: #626c68; line-height: 1.8; margin: 8px 0; }
.authorization-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }
article { padding: 18px; background: #f5f8f6; border-radius: 12px; }
.collection-actions { display: flex; flex-wrap: wrap; gap: 8px; }
button { border: 1px solid #cbded3; border-radius: 8px; padding: 8px 12px; background: #edf7f3; color: #17624f; cursor: pointer; }
button:disabled { opacity: .55; cursor: not-allowed; }
button:focus-visible { outline: 2px solid #17624f; outline-offset: 2px; }
.collection-state { color: #17624f; } summary { cursor: pointer; font-size: 13px; }
label { display: block; font-size: 13px; margin: 12px 0; } input, select { max-width: 100%; padding: 8px; border: 1px solid #cbded3; border-radius: 8px; } section[aria-label="全站 Gemini 配置"] { border-top: 1px solid #e2e8e5; margin-top: 18px; padding-top: 18px; }
.key-field { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } .key-field input { flex: 1; min-width: 180px; } .key-field span, .ai-status { font-size: 13px; color: #17624f; }
@media (max-width: 700px) { header { flex-direction: column; } .authorization-grid { grid-template-columns: 1fr; } .authorization-panel { padding: 16px; } }
</style>
