<template>
  <section class="authorization-panel" aria-label="授权采集入口">
    <header>
      <div>
        <h2>平台登录与授权采集</h2>
        <p>在来源网站完成登录，再选择采集范围。登录态留在 Chrome，采集结果自动上传家庭服务器统一校验、分析和发布。</p>
      </div>
      <div class="header-actions">
        <button type="button" :disabled="connecting" :title="connected ? `扩展版本: ${version}${extensionBuildTag ? ' (' + extensionBuildTag + ')' : ''}` : '检查扩展连接'" @click="connect">
          {{ connecting ? '正在检查连接…' : connected ? `扩展已连接 · ${version}` : '检查扩展连接' }}
        </button>
      </div>
    </header>

    <!-- 一键采集刷新与全局任务进度栏 -->
    <div class="global-collection-box">
      <div class="global-actions">
        <button
          type="button"
          class="btn-primary"
          :disabled="!connected || isRunning || isAiAnalyzing"
          @click="startAll"
        >
          一键采集刷新（抖音作者）
        </button>
        <button
          type="button"
          class="btn-ai-analyze"
          :disabled="!connected || isRunning || isAiAnalyzing"
          @click="startAiAnalyze"
        >
          {{ isAiAnalyzing ? `Gemini 分析中 (${aiDoneCount}/${aiTotalCandidates})` : `一键 AI 分析待标注内容${pendingCandidateCount > 0 ? ` (${pendingCandidateCount})` : ''}` }}
        </button>
        <button
          v-if="isRunning"
          type="button"
          class="btn-danger"
          @click="action('STOP', {})"
        >
          停止采集
        </button>
        <button
          v-else-if="isAiAnalyzing"
          type="button"
          class="btn-danger"
          @click="stopAiAnalyze"
        >
          停止 AI 分析
        </button>
        <button
          v-else-if="canResume"
          type="button"
          class="btn-resume"
          :disabled="!connected || isAiAnalyzing"
          @click="resumeTask"
        >
          继续未完成作者
        </button>
        <label class="auto-ai-toggle" title="抖音作者采集完成后，自动触发对待标注内容的 Gemini 分析">
          <input type="checkbox" v-model="autoAiAnalyze" @change="saveAutoAiOption" />
          <span>采集完成后自动执行 AI 分析</span>
        </label>
      </div>

      <!-- AI 分析进度与状态展示 -->
      <div v-if="aiAnalysisMessage" class="ai-summary-card" role="status">
        <div class="ai-summary-line">
          <span class="ai-badge">Gemini AI</span>
          <span class="ai-text">{{ aiAnalysisMessage }}</span>
        </div>
      </div>

      <!-- 总任务三级分支进度展示 -->
      <div v-if="taskSnapshot" class="task-summary-card" role="status">
        <div class="summary-line">
          <strong>全部来源</strong>：
          <span>已完成 {{ taskSummary.completedAuthors || 0 }}/{{ taskSummary.totalAuthors || 0 }} · 采集中 {{ taskSummary.runningAuthors || 0 }} · 等待 {{ taskSummary.waitingAuthors || 0 }}</span>
          <span v-if="taskSummary.failedAuthors" class="warn-text"> · 失败/中断 {{ taskSummary.failedAuthors }}</span>
          <span v-if="taskSummary.needsLoginAuthors" class="warn-text"> · 等待登录 {{ taskSummary.needsLoginAuthors }}</span>
        </div>
        <div class="metrics-line">
          <span>本轮数据：{{ taskSummary.validUniqueCount || 0 }} 条有效 · 跨页去重 {{ taskSummary.duplicateCount || 0 }} · 耗时 {{ ((taskSnapshot.elapsedMs || 0) / 1000).toFixed(1) }}s</span>
          <span v-if="importMessage" class="import-status"> · {{ importMessage }}</span>
          <span v-if="pendingCandidateCount > 0" class="pending-badge"> · 待 AI 标注: {{ pendingCandidateCount }} 条 (薅羊毛 {{ pendingWelfareCount }} · 安全社区 {{ pendingPojieCount }})</span>
        </div>
      </div>
    </div>

    <!-- 平台与作者卡片网格 -->
    <div class="authorization-grid">
      <article v-for="platform in platforms" :key="platform.id" class="platform-card">
        <div class="platform-header">
          <h3>{{ platform.name }}</h3>
          <span class="mode-badge">{{ platformMode(platform.id) }}</span>
        </div>
        <p class="scope-text">{{ platform.description }}</p>
        <p class="collection-state" role="status">{{ statusText(platform.id) }}</p>
        <div class="collection-actions">
          <button type="button" :disabled="!connected || isRunning" @click="start(platform.id)">手动采集刷新</button>
          <button type="button" :disabled="!connected" @click="action('LOGIN', { platform: platform.id })">打开来源 / 登录</button>
          <button type="button" :disabled="!connected || !states[platform.id]?.count" @click="loadResult(platform.id)">同步上传至服务器</button>
        </div>

        <!-- 作者具体分支（参考币安分支进度） -->
        <div v-if="platformAuthors(platform.id).length" class="author-branches">
          <div
            v-for="author in platformAuthors(platform.id)"
            :key="author.uid"
            class="author-branch"
            :class="`branch-${author.status}`"
          >
            <span class="author-name">{{ author.name }}</span>
            <strong class="author-progress">{{ formatAuthorProgress(author) }}</strong>
          </div>
        </div>
      </article>
    </div>

    <p class="catalog-hint">
      抖音作品进入“娱乐专区”；B 站由青龙统一采集，其中百科老王与国外主机测评进入薅羊毛“固定来源”，小迪老师进入安全社区“观察源”，杨博士说AI进入“娱乐专区”。
      点击上方“一键 AI 分析待标注内容”可触发服务器统一生成 Gemini 生态标签与价值评级。
    </p>

    <!-- 全站 Gemini 配置 -->
    <section aria-label="全站 Gemini 配置" class="gemini-config-section">
      <h3>本机 Gemini · 全站共用</h3>
      <p>{{ !aiLoaded ? '读取本机配置后，可查看和修改共享密钥。' : ai.hasKey ? '已配置密钥，可用于资讯分析与现有助手。' : '尚未配置密钥。保存一次后，资讯分析与现有助手共用。' }}</p>
      <p>资讯页点击“分析待标注内容”，仅将待分析的公开标题与链接发送给家庭服务器统一分析与发布。</p>
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
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'entertainment' })">内容平台授权助手</button>
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'finance' })">基金 / 币安采集助手</button>
        <button type="button" :disabled="!connected" @click="action('OPEN_ASSISTANT', { mode: 'market' })">BOSS 助手入口</button>
      </div>
    </details>
    <p v-if="message" role="status" class="message-status">{{ message }}</p>
    <details v-if="!connected">
      <summary>安装或更新采集扩展</summary>
      <p>下载并解压，在 Chrome 扩展管理页加载已解压的扩展，或重载已有扩展，再刷新本页。需要 3.25.0 或更新版本（支持全并行采集）。</p>
      <button type="button" @click="downloadPlugin">下载采集扩展</button>
      <p v-if="pluginHint">{{ pluginHint.title }}：{{ pluginHint.desc }}</p>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { authorizedRequest, authorizedCollectionMeta, getSavedResultVersion, saveAuthorizedItems } from "../../../../utils/authorizedContent";
import { collectionFreshness } from "../../../../utils/collectionFreshness";
import catalog from "../../../../../project-support/extension/lptff-investment-assistant/content-sources.json";
import { usePluginGuide } from "../../../../investment/composables/use-plugin-guide";
import { WEB_BUILD_TAG, EXPECTED_EXTENSION_BUILD_TAG } from "../../../../build-info";
import { getPendingAnalysisCandidates } from "../../../../utils/pendingAnalysis";
import { saveAnalyses } from "../../../../utils/contentAnalysis";

const { downloadPlugin, pluginHint } = usePluginGuide();
const connected = ref(false);
const connecting = ref(false);
const version = ref("");
const extensionBuildTag = ref("");
const webBuildTag = WEB_BUILD_TAG;
const ai = ref({ hasKey: false, model: "gemini-3.5-flash-lite" });
const apiKey = ref("");
const keyVisible = ref(false);
const keyDirty = ref(false);
const aiBusy = ref(false);
const aiStatus = ref("正在读取本机配置…");
const aiLoaded = ref(false);
const aiLoading = ref(false);

const isAiAnalyzing = ref(false);
const stoppingAi = ref(false);
const aiDoneCount = ref(0);
const aiTotalCandidates = ref(0);
const aiAnalysisMessage = ref("");
const pendingCandidateCount = ref(0);
const pendingWelfareCount = ref(0);
const pendingPojieCount = ref(0);
const AUTO_AI_KEY = "lptff-auto-ai-after-collect";
const autoAiAnalyze = ref(typeof window !== "undefined" ? localStorage.getItem(AUTO_AI_KEY) === "1" : false);

const message = ref("");
const importMessage = ref("");
const states = ref<Record<string, any>>({});
const taskSnapshot = ref<any>(null);
const lastImportedVersion = ref(getSavedResultVersion());

const platforms = [
  { id: "douyin", name: "抖音 · 作者作品", description: "李子栗、独孤十一。默认目标最近 50 条有效作品。" },
];

let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;

const isRunning = computed(() => {
  if (taskSnapshot.value?.phase && taskSnapshot.value.phase !== "running") {
    return false;
  }
  return taskSnapshot.value?.phase === "running" || Object.values(states.value).some((s) => s.state === "running");
});

const canResume = computed(() => {
  const phase = taskSnapshot.value?.phase;
  return phase === "partial" || phase === "interrupted" || phase === "cancelled" || phase === "failed";
});

const taskSummary = computed(() => taskSnapshot.value?.summary || {});

function platformMode(id: string) {
  if (taskSnapshot.value?.platforms?.[id]?.mode) {
    return taskSnapshot.value.platforms[id].mode;
  }
  return "真实接口";
}

function platformAuthors(platformId: string) {
  if (!taskSnapshot.value?.authors) {
    return catalog.filter((s) => s.platform === platformId).map((s) => ({
      uid: s.uid,
      name: s.name,
      platform: s.platform,
      status: "waiting",
      itemsCount: 0,
      pageCount: 0,
      duplicateCount: 0,
      endReason: "",
      durationMs: 0,
    }));
  }
  return taskSnapshot.value.authors.filter((a: any) => a.platform === platformId);
}

function formatAuthorProgress(author: any) {
  const statusLabels: Record<string, string> = {
    waiting: "等待",
    running: "采集中",
    completed: "完成",
    partial: "部分完成",
    failed: "失败",
    cancelled: "已取消",
    "needs-login": "等待登录/验证",
    interrupted: "已中断",
  };
  const label = statusLabels[author.status] || author.status;
  const countText = author.itemsCount > 0 ? ` · 已获取 ${author.itemsCount} 条` : "";
  const pageText = author.pageCount > 1 ? ` · 第 ${author.pageCount} 页` : "";
  const dupText = author.duplicateCount > 0 ? ` · 跨页去重 ${author.duplicateCount}` : "";
  const endReason = author.endReason ? ` (${author.endReason})` : "";
  const durationText = author.durationMs > 0 ? ` · ${(author.durationMs / 1000).toFixed(1)}s` : "";

  return `${label}${countText}${pageText}${dupText}${durationText}${endReason}`;
}

const labels: Record<string, string> = {
  idle: "尚未采集",
  running: "正在采集",
  success: "采集完成",
  completed: "采集完成",
  partial: "部分来源未完成，可登录或重试",
  failed: "采集失败，已保留原结果",
  cancelled: "采集已停止",
};

function statusText(id: string) {
  const state = states.value[id];
  const fresh = collectionFreshness(state, catalog.filter((s) => s.platform === id).map((s) => s.uid));
  const count = state?.count ?? 0;
  return state ? `${labels[state.state] || '待重试'} · 本机保留 ${count} 条 · ${fresh.label}` : "等待扩展连接";
}

// 自动幂等导入结果并响应式刷新（无整页重载，保留滚动位置）
async function checkAndAutoImport(newVersion: number, force = false) {
  if (newVersion > lastImportedVersion.value && (!isRunning.value || force)) {
    try {
      let importedCount = 0;
      for (const p of ["douyin"]) {
        const res = await authorizedRequest("RESULT", { platform: p });
        if (res.items) {
          const count = saveAuthorizedItems(p, res.items, res);
          importedCount += count;
        }
      }
      lastImportedVersion.value = newVersion;
      importMessage.value = `结果更新：已写入本机 · 当前页面已更新（共保留 ${importedCount} 条）`;
      updatePendingCounts();
    } catch (err) {
      console.warn("自动导入结果失败", err);
    }
  }
}

let connectingPromise: Promise<void> | null = null;

async function connect() {
  if (connectingPromise) return connectingPromise;
  clearTimeout(timer);
  connecting.value = true;
  connectingPromise = (async () => {
    try {
      const result = await authorizedRequest("STATUS");
      if (disposed) return;
      connected.value = true;
      version.value = result.version;
      extensionBuildTag.value = result.buildTag || "";
      states.value = result.platforms || {};
      taskSnapshot.value = result.task || null;
      message.value = ""; // 连接成功清空错误提示

      if (!aiLoaded.value && !aiLoading.value) void loadAi();

      if (result.resultVersion) {
        await checkAndAutoImport(result.resultVersion);
      }

      const running = isRunning.value;
      if (!disposed) {
        timer = setTimeout(connect, running ? 2000 : 30000);
      }
    } catch (error) {
      connected.value = false;
      message.value = String((error as Error).message);
      // 未连接时使用指数退避或平稳重试，扩展就绪时通过事件立即唤醒，避免过度轮询掩盖错误
      if (!disposed) {
        timer = setTimeout(connect, 5000);
      }
    } finally {
      connecting.value = false;
      connectingPromise = null;
    }
  })();
  return connectingPromise;
}

async function startAll() {
  try {
    message.value = "正在一键调度抖音作者采集…";
    await authorizedRequest("START", { platform: "douyin" });
    await connect();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

async function resumeTask() {
  try {
    message.value = "正在继续采集未完成的抖音作者…";
    await authorizedRequest("RESUME", { platform: "douyin" });
    await connect();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

async function start(platform: string) {
  try {
    message.value = "正在采集抖音作者作品…";
    await authorizedRequest("START", { platform });
    await connect();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

async function action(type: string, payload: Record<string, unknown> = {}) {
  try {
    await authorizedRequest(type, payload);
    message.value = "";
    await connect();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

async function loadResult(platform: string) {
  try {
    const result = await authorizedRequest("RESULT", { platform });
    const count = saveAuthorizedItems(platform, result.items, result);
    message.value = count ? `已上传 ${count} 条到家庭服务器，等待统一校验与发布。` : "没有可上传的新结果，保留已有内容。";
    updatePendingCounts();
  } catch (error) {
    message.value = (error as Error).message;
  }
}

function saveAutoAiOption() {
  try {
    localStorage.setItem(AUTO_AI_KEY, autoAiAnalyze.value ? "1" : "0");
  } catch {}
}

function updatePendingCounts() {
  try {
    const res = getPendingAnalysisCandidates();
    pendingWelfareCount.value = res.welfare.length;
    pendingPojieCount.value = res.pojie.length;
    pendingCandidateCount.value = res.total;
  } catch {}
}

async function startAiAnalyze() {
  if (isAiAnalyzing.value || isRunning.value) return;
  if (!connected.value) {
    message.value = "请先连接采集扩展";
    return;
  }
  if (!aiLoaded.value) {
    await loadAi();
  }
  if (!ai.value.hasKey) {
    aiStatus.value = "请在下方输入并保存 Gemini API Key 后再发起一键 AI 分析";
    message.value = "尚未配置 Gemini API Key，请在下方全站 Gemini 配置区域保存 Key";
    return;
  }

  updatePendingCounts();
  const pending = getPendingAnalysisCandidates();
  const allTotal = pending.total;
  if (allTotal === 0) {
    aiAnalysisMessage.value = "当前全站所有来源（包含全平台作者动态与各专区资讯）均已完成 AI 标注与分析，无需重复分析。";
    return;
  }

  isAiAnalyzing.value = true;
  stoppingAi.value = false;
  aiDoneCount.value = 0;
  aiTotalCandidates.value = allTotal;
  aiAnalysisMessage.value = `开始一键分析待标注内容（共 ${allTotal} 条：薅羊毛 ${pending.welfare.length} 条 · 安全社区 ${pending.pojie.length} 条）…`;

  let done = 0;
  try {
    // 1. 先分析薅羊毛专区（包含百科老王、国外主机测评动态等）
    for (let offset = 0; offset < pending.welfare.length && !stoppingAi.value && !disposed; offset += 6) {
      const chunk = pending.welfare.slice(offset, offset + 6);
      aiAnalysisMessage.value = `Gemini 分析中 [薅羊毛]：已完成 ${done}/${allTotal} 条，结果逐批写入本机…`;
      const result = await authorizedRequest("AI_ANALYZE", {
        domain: "welfare",
        items: chunk.map((c) => ({ url: c.url, title: c.title })),
      });
      if (result?.results?.length) {
        saveAnalyses("welfare", result.results);
        done += result.results.length;
        aiDoneCount.value = done;
      }
    }

    // 2. 再分析安全社区专区（包含小迪老师动态等）
    for (let offset = 0; offset < pending.pojie.length && !stoppingAi.value && !disposed; offset += 6) {
      const chunk = pending.pojie.slice(offset, offset + 6);
      aiAnalysisMessage.value = `Gemini 分析中 [安全社区]：已完成 ${done}/${allTotal} 条，结果逐批写入本机…`;
      const result = await authorizedRequest("AI_ANALYZE", {
        domain: "pojie",
        items: chunk.map((c) => ({ url: c.url, title: c.title })),
      });
      if (result?.results?.length) {
        saveAnalyses("pojie", result.results);
        done += result.results.length;
        aiDoneCount.value = done;
      }
    }

    if (stoppingAi.value) {
      aiAnalysisMessage.value = `AI 分析已手动停止，本次已成功保存 ${done} 条分析结果至本机。`;
    } else {
      aiAnalysisMessage.value = `一键 AI 分析完成！共为 ${done} 条待标注内容生成 Gemini 生态标签与价值评分，已保存至本机并在各专区实时生效。`;
    }
  } catch (error) {
    aiAnalysisMessage.value = `AI 分析中断：${(error as Error).message}（已成功保存 ${done} 条）`;
  } finally {
    isAiAnalyzing.value = false;
    stoppingAi.value = false;
    updatePendingCounts();
  }
}

function stopAiAnalyze() {
  stoppingAi.value = true;
  aiAnalysisMessage.value = "正在完成当前批次后停止 AI 分析…";
}

// 侦听从 web-bridge 转发的实时推送与扩展就绪通知
function onWindowMessage(event: MessageEvent) {
  if (event.source !== window || event.origin !== location.origin) return;
  if (event.data?.source === "lptff-investment-assistant") {
    if (event.data?.type === "LPTFF_EXTENSION_READY") {
      void connect();
      return;
    }
    if (event.data?.type === "LPTFF_AUTHORIZED_CONTENT_PROGRESS") {
      if (event.data.snapshot) {
        taskSnapshot.value = event.data.snapshot;
        if (event.data.snapshot.phase === "completed") {
          void connect();
          updatePendingCounts();
          if (autoAiAnalyze.value && !isAiAnalyzing.value && ai.value.hasKey) {
            void startAiAnalyze();
          }
        }
        if (event.data.snapshot.resultVersion) {
          void checkAndAutoImport(event.data.snapshot.resultVersion, event.data.snapshot.phase === "completed");
        }
      }
    }
  }
}

// ---------------- Gemini AI 共享配置 ----------------
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
  } finally {
    aiLoading.value = false;
  }
}

function hideKey() {
  keyVisible.value = false;
}

async function toggleKey() {
  if (keyVisible.value) {
    hideKey();
    return;
  }
  aiBusy.value = true;
  try {
    if (!apiKey.value) {
      const result = await authorizedRequest("AI_REVEAL");
      if (disposed) return;
      if (!result.value) throw new Error("尚未保存密钥，请先输入并保存。");
      apiKey.value = result.value;
    }
    keyVisible.value = true;
  } catch (error) {
    aiStatus.value = (error as Error).message;
  } finally {
    aiBusy.value = false;
  }
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
  } catch (error) {
    if (!disposed) aiStatus.value = `${saved ? '已保存，但连接测试失败' : '保存失败'}：${(error as Error).message}`;
  } finally {
    aiBusy.value = false;
  }
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
  } catch (error) {
    if (!disposed) aiStatus.value = `清除失败：${(error as Error).message}`;
  } finally {
    aiBusy.value = false;
  }
}

function onExtensionReadyCustomEvent(e: Event) {
  const customEvent = e as CustomEvent;
  if (customEvent.detail?.buildTag) {
    extensionBuildTag.value = customEvent.detail.buildTag;
  }
  void connect();
}

onMounted(() => {
  if (typeof window !== "undefined") {
    (window as any).__LPTFF_WEB_BUILD_TAG__ = WEB_BUILD_TAG;
    (window as any).__LPTFF_EXPECTED_EXT_BUILD_TAG__ = EXPECTED_EXTENSION_BUILD_TAG;
  }
  void loadAi();
  void connect();
  updatePendingCounts();
  window.addEventListener("message", onWindowMessage);
  window.addEventListener("LPTFF_EXTENSION_READY", onExtensionReadyCustomEvent);
  window.addEventListener("lptff-analysis-updated", updatePendingCounts);
  window.addEventListener("lptff-authorized-content-updated", updatePendingCounts);
});

onUnmounted(() => {
  disposed = true;
  clearTimeout(timer);
  apiKey.value = "";
  window.removeEventListener("message", onWindowMessage);
  window.removeEventListener("LPTFF_EXTENSION_READY", onExtensionReadyCustomEvent);
  window.removeEventListener("lptff-analysis-updated", updatePendingCounts);
  window.removeEventListener("lptff-authorized-content-updated", updatePendingCounts);
  if (typeof window !== "undefined") {
    delete (window as any).__LPTFF_WEB_BUILD_TAG__;
    delete (window as any).__LPTFF_EXPECTED_EXT_BUILD_TAG__;
  }
});
</script>

<style scoped>
.authorization-panel { margin: 18px 0; padding: 22px; border: 1px solid #e2e8e5; border-radius: 16px; background: #fff; }
header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
h2 { font-size: 18px; margin: 0 0 8px; }
h3 { font-size: 16px; margin: 0 0 10px; }
p { font-size: 13px; color: #626c68; line-height: 1.8; margin: 8px 0; }

.global-collection-box {
  margin: 16px 0;
  padding: 14px;
  background: #f8fcfa;
  border: 1px solid #d9e8e3;
  border-radius: 12px;
}
.global-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.btn-primary {
  background: #17624f;
  color: #fff;
  font-weight: 600;
  border-color: #17624f;
}
.btn-danger {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}
.btn-resume {
  background: #e6a23c;
  color: #fff;
  border-color: #e6a23c;
}
.btn-ai-analyze {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  font-weight: 600;
  border: 1px solid #6366f1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}
.btn-ai-analyze:hover:not(:disabled) {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.btn-ai-analyze:active:not(:disabled) {
  transform: translateY(1px);
}
.auto-ai-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  user-select: none;
  margin-left: 6px;
}
.auto-ai-toggle input {
  margin: 0;
  cursor: pointer;
}
.ai-summary-card {
  margin-top: 10px;
  margin-bottom: 8px;
  padding: 10px 14px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  font-size: 13px;
  color: #4c1d95;
  line-height: 1.5;
}
.ai-summary-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ai-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: #7c3aed;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.pending-badge {
  color: #7c3aed;
  font-weight: 600;
}
.task-summary-card {
  font-size: 13px;
  color: #2c3e50;
  line-height: 1.6;
}
.summary-line {
  margin-bottom: 4px;
}
.metrics-line {
  color: #606266;
  font-size: 12px;
}
.warn-text {
  color: #e6a23c;
  font-weight: 600;
}
.import-status {
  color: #529b2e;
  font-weight: 600;
}

.authorization-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }
.platform-card { padding: 18px; background: #f5f8f6; border-radius: 12px; display: flex; flex-direction: column; }
.platform-header { display: flex; align-items: center; justify-content: space-between; }
.platform-header h3 { margin: 0; }
.mode-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #edf7f3;
  color: #17624f;
  border: 1px solid #cbded3;
}
.scope-text { font-size: 12px; color: #626c68; margin: 8px 0; }

.collection-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
button { border: 1px solid #cbded3; border-radius: 8px; padding: 8px 12px; background: #edf7f3; color: #17624f; cursor: pointer; font-size: 13px; }
button:disabled { opacity: .55; cursor: not-allowed; }
button:focus-visible { outline: 2px solid #17624f; outline-offset: 2px; }
.collection-state { color: #17624f; font-size: 12px; margin: 8px 0; }

.author-branches {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #cbded3;
}
.author-branch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
}
.author-name {
  font-weight: 600;
  color: #333;
}
.author-progress {
  font-size: 11.5px;
  font-weight: 500;
}
.branch-running { background: #ecf5ff; color: #337ecc; }
.branch-completed { background: #f0f9eb; color: #529b2e; }
.branch-partial { background: #fdf6ec; color: #b88230; }
.branch-failed, .branch-interrupted { background: #fef0f0; color: #f56c6c; }
.branch-needs-login { background: #fdf6ec; color: #e6a23c; }
.branch-waiting { background: #fafafa; color: #909399; }

.catalog-hint { font-size: 12px; color: #8c9b94; }
summary { cursor: pointer; font-size: 13px; }
label { display: block; font-size: 13px; margin: 12px 0; }
input, select { max-width: 100%; padding: 8px; border: 1px solid #cbded3; border-radius: 8px; }
.gemini-config-section { border-top: 1px solid #e2e8e5; margin-top: 18px; padding-top: 18px; }
.key-field { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.key-field input { flex: 1; min-width: 180px; }
.key-field span, .ai-status { font-size: 13px; color: #17624f; }
.message-status { font-size: 13px; color: #17624f; margin-top: 8px; }

@media (max-width: 700px) {
  header { flex-direction: column; }
  .authorization-grid { grid-template-columns: 1fr; }
  .authorization-panel { padding: 16px; }
}
</style>
