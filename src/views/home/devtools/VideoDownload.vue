<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { recordFeatureView } from "../../../utils/observation";

type MediaItem = { id: string; type: "hls" | "file"; label: string; detectedAt: number; sourceStatus?: string | null; job?: { phase: string; stage?: string; percent?: number; message: string } | null };
type RecordingState = { id: string; phase: string; bytes: number; chunks: number };
type CaptureResponse = { ok: boolean; error?: string; activeTabId?: number | null; pageLabel?: string | null; items?: MediaItem[]; opened?: boolean; recording?: RecordingState | null };

const connected = ref(false);
const activeTabId = ref<number | null>(null);
const pageLabel = ref("");
const pageUrl = ref("");
const items = ref<MediaItem[]>([]);
const recording = ref<RecordingState | null>(null);
const busy = ref(false);
const error = ref("");
const pending = new Map<string, { resolve: (result: CaptureResponse) => void; reject: (error: Error) => void; timer: number }>();
let pollTimer: number | undefined;
let polling = false;

function onMessage(event: MessageEvent): void {
  if (event.source !== window || event.origin !== location.origin || event.data?.source !== "lptff-investment-assistant" || event.data?.type !== "LPTFF_VIDEO_CAPTURE_RESPONSE") return;
  const waiter = pending.get(String(event.data.requestId || ""));
  if (!waiter) return;
  pending.delete(String(event.data.requestId));
  clearTimeout(waiter.timer);
  const result = event.data.response as CaptureResponse;
  if (!result?.ok) waiter.reject(new Error(result?.error || "扩展未响应"));
  else waiter.resolve(result);
}

function call(action: string, payload: Record<string, unknown> = {}): Promise<CaptureResponse> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(requestId);
      reject(new Error("未连接到本项目 Chrome 扩展；请启用或重新加载扩展后刷新页面"));
    }, 8000);
    pending.set(requestId, { resolve, reject, timer });
    window.postMessage({ source: "lptff-video-download-page", type: "LPTFF_VIDEO_CAPTURE_REQUEST", action, requestId, ...payload }, location.origin);
  });
}

function applyStatus(result: CaptureResponse): void {
  connected.value = true;
  error.value = "";
  items.value = result.items || [];
  activeTabId.value = result.activeTabId ?? null;
  pageLabel.value = result.pageLabel || "";
  recording.value = result.recording || null;
}

async function refresh(): Promise<void> {
  if (polling) return;
  polling = true;
  try { applyStatus(await call("STATUS")); }
  catch (cause) {
    connected.value = false;
    error.value = cause instanceof Error ? cause.message : "扩展不可用";
  } finally { polling = false; }
}

async function run(action: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await call(action, payload);
    if (result.items) applyStatus(result);
    if (action === "START_PAGE") {
      ElMessage.success(result.opened ? "已打开指定网页并开始捕获" : "已刷新指定网页并开始捕获");
      pageUrl.value = "";
    }
    if (action === "DOWNLOAD") ElMessage.success(result.opened ? "已打开 HLS 下载页" : "已开始下载");
    if (action === "PREVIEW") ElMessage.success("已打开媒体预览");
    if (action === "RECORD_START") ElMessage.success("已开始录制当前播放器");
    if (action === "RECORD_STOP") ElMessage.success("正在停止录制并合成");
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : "操作失败");
  } finally { busy.value = false; }
}

function startCapture(): void {
  if (!pageUrl.value.trim()) return;
  void run("START_PAGE", { pageUrl: pageUrl.value.trim() });
}

function recordingLabel(phase: string): string {
  return ({ recording: '录制中', stopping: '正在停止', complete: '已录制', error: '录制失败' } as Record<string, string>)[phase] || phase;
}

function jobText(job: NonNullable<MediaItem['job']>): string {
  return typeof job.percent === 'number' && !job.message.includes('%') ? `${job.stage || '处理进度'} ${job.percent}% · ${job.message}` : job.message;
}

onMounted(() => {
  window.addEventListener("message", onMessage);
  void recordFeatureView("devtools");
  void refresh();
  pollTimer = window.setInterval(() => { if (!busy.value) void refresh(); }, 1500);
});
onUnmounted(() => {
  window.removeEventListener("message", onMessage);
  if (pollTimer !== undefined) clearInterval(pollTimer);
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error("页面已关闭")); }
  pending.clear();
});
</script>

<template>
  <div class="video-tool">
    <el-alert v-if="!connected" type="warning" :title="error || '正在连接 Chrome 扩展…'" :closable="false" show-icon />
    <section class="panel">
      <h2>指定网页下载</h2>
      <p>粘贴视频所在网页的地址。扩展会打开或刷新这一页，只捕获该页和内嵌播放器的媒体请求；有些视频仍需在来源页点击播放。</p>
      <div class="controls">
        <el-input v-model="pageUrl" placeholder="https://example.com/video-page" :disabled="!connected" @keyup.enter="startCapture" />
        <el-button type="primary" :disabled="!connected || !pageUrl.trim() || busy" @click="startCapture">打开并捕获</el-button>
        <el-button :disabled="!connected || activeTabId === null || busy" @click="run('STOP')">停止并清空</el-button>
      </div>
      <p v-if="activeTabId !== null" class="capture-status">正在捕获：{{ pageLabel }}</p>
      <div class="record-controls" v-if="activeTabId !== null">
        <el-button :disabled="busy || recording?.phase === 'recording' || recording?.phase === 'stopping'" @click="run('RECORD_START')">录制当前播放器（支持 blob）</el-button>
        <template v-if="recording">
          <span>录制状态：{{ recordingLabel(recording.phase) }} · {{ recording.chunks }} 个片段 · {{ (recording.bytes / 1024 / 1024).toFixed(1) }} MB</span>
          <el-button v-if="recording.phase === 'recording'" :disabled="busy" @click="run('RECORD_STOP', { id: recording.id })">停止并合成</el-button>
        </template>
      </div>
    </section>

    <section class="panel">
      <h2>发现的媒体 <span class="count">{{ items.length }}</span></h2>
      <el-empty v-if="items.length === 0" description="还没有发现媒体地址" :image-size="80" />
      <div v-for="item in items" :key="item.id" class="media-item">
        <div class="media-detail"><el-tag size="small" :type="item.type === 'hls' ? 'success' : 'info'">{{ item.type === 'hls' ? 'M3U8 / HLS' : '视频 / 音频文件' }}</el-tag><span :title="item.label">{{ item.label }}</span><small v-if="item.sourceStatus" class="source-status">{{ item.sourceStatus }}</small><small v-if="item.job" class="job-status">{{ jobText(item.job) }}</small><el-progress v-if="typeof item.job?.percent === 'number'" class="job-progress" :percentage="Math.max(0, Math.min(100, item.job.percent))" :stroke-width="6" :show-text="false" :status="item.job.phase === 'error' ? 'exception' : undefined" /></div>
        <div class="media-actions">
          <el-button :disabled="busy" @click="run('PREVIEW', { id: item.id })">预览</el-button>
          <el-button type="primary" plain :disabled="busy" @click="run('DOWNLOAD', { id: item.id })">{{ item.type === 'hls' ? '选择清晰度并下载' : '下载' }}</el-button>
        </div>
      </div>
    </section>
    <p class="note">支持未加密 HLS 点播与直播、普通媒体文件以及播放器录制。受保护媒体和源站禁止读取的内容可能无法保存；请只保存你有权下载的内容。</p>
  </div>
</template>

<style scoped>
.video-tool { margin: 0 auto; }
.panel { margin-bottom: 16px; padding: 20px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
h2 { margin: 0 0 8px; font-size: 17px; }
p { margin: 0 0 14px; color: #606266; line-height: 1.6; }
.controls { display: flex; gap: 10px; align-items: center; }
.controls .el-button + .el-button { margin-left: 0; }
.capture-status { margin-top: 12px; color: #409eff; }
.record-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.count { font-size: 13px; color: #909399; }
.media-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-top: 1px solid #ebeef5; }
.media-actions { display: flex; gap: 8px; flex-shrink: 0; }
.media-actions .el-button + .el-button { margin-left: 0; }
.media-detail { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-width: 0; }
.media-detail span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.job-status { color: #909399; }
.job-progress { width: 100%; }
.source-status { color: #e6a23c; white-space: nowrap; }
.note { font-size: 12px; }
@media (max-width: 640px) { .controls, .media-item { align-items: stretch; flex-direction: column; } .media-detail { width: 100%; } }
</style>
