<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import QRCode from "qrcode";

/** 每张二维码的目标字节数（用户期望容量）。数值越小码点越稀疏，手机越易扫准；代价是分片更多。
 *  实际每张装多少由内容动态决定：纯 ASCII 可装满目标字节，含中文/多字节字符则按字符边界
 *  自动调整，纠错级别还会按需降级（H→Q→M→L）兜底，所以不限制中英文、不会静默失败。 */
const CHUNK_OPTIONS = [
  { label: "200 字节/张（最易扫，码点最稀疏）", value: 200 },
  { label: "400 字节/张（易扫，推荐）", value: 400 },
  { label: "800 字节/张（张数更少）", value: 800 },
  { label: "1200 字节/张（码点密集，难扫）", value: 1200 },
  { label: "1600 字节/张（更密集）", value: 1600 },
  { label: "2000 字节/张（高密度）", value: 2000 },
  { label: "2400 字节/张（更高密度）", value: 2400 },
  { label: "2900 字节/张（极限密度）", value: 2900 },
];

const SAMPLE_DIFF = `diff --git a/src/App.vue b/src/App.vue
index 1234567..abcdefg 100644
--- a/src/App.vue
+++ b/src/App.vue
@@ -1,5 +1,6 @@
 <template>
-  <h1>Hello</h1>
+  <h1>Hello QR</h1>
+  <p>手机扫码即可查看这段 diff</p>
 </template>`;

const input = ref("");
const chunkSize = ref(800);
const chunks = ref<string[]>([]);
/** 每张二维码的扫码状态：pending 待扫 / scanned 已扫 */
const scanStatus = ref<("pending" | "scanned")[]>([]);
const currentIndex = ref(0);
const generating = ref(false);
/** 生成进度 0-100，用于大文件分片/渲染时显示进度条 */
const genProgress = ref(0);
const genStatusText = ref("");
const qrCanvas = ref<HTMLCanvasElement | null>(null);
const fileName = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const encoder = new TextEncoder();

/** 按 UTF-8 字节数切分，保证不劈开多字节字符。
 *  优化：一次性编码全文为字节，用字节索引在字节序列上找切分点，
 *  再用 TextDecoder 把每段字节解码回字符串，避免逐字符 encode（大文件下快几十倍）。 */
function splitByBytes(text: string, maxBytes: number): string[] {
  const parts: string[] = [];
  const allBytes = encoder.encode(text);
  const n = allBytes.length;
  if (n === 0) return parts;

  const decoder = new TextDecoder("utf-8", { fatal: false });
  let byteStart = 0;

  while (byteStart < n) {
    let byteEnd = Math.min(byteStart + maxBytes, n);
    // 若切在多字节字符中间，回退到字符边界。
    // UTF-8 后续字节以 10xxxxxx (0x80~0xBF) 开头，向前回退直到落在首字节。
    while (byteEnd < n && (allBytes[byteEnd] & 0xc0) === 0x80) byteEnd--;
    // 直接解码这段字节为字符串
    parts.push(decoder.decode(allBytes.subarray(byteStart, byteEnd)));
    byteStart = byteEnd;
  }
  return parts;
}

async function generate(): Promise<void> {
  const text = input.value;
  if (!text.trim()) {
    ElMessage.warning("请先粘贴文本或上传 txt / md 文件");
    return;
  }
  generating.value = true;
  genProgress.value = 5;
  genStatusText.value = "正在拆分文本…";

  // 让 UI 先渲染进度条，再开始重活
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));

  // 1. 拆分（已优化为一次性编码，大文件也很快）
  const parts = splitByBytes(text, chunkSize.value);
  chunks.value = parts;
  scanStatus.value = parts.map(() => "pending" as const);
  currentIndex.value = 0;
  genProgress.value = 30;
  genStatusText.value = `已拆分为 ${parts.length} 张，正在生成二维码…`;
  await nextTick();

  // 2. 渲染当前张（分页模式下只渲染当前一张，瞬间完成）
  await renderCurrent();
  genProgress.value = 100;
  genStatusText.value = "";

  generating.value = false;
  ElMessage.success(
    parts.length === 1
      ? "已生成 1 张二维码"
      : `内容较长，已分页为 ${parts.length} 张，从第 1 张开始扫码`,
  );
  // 稍后归零，避免进度条闪退
  setTimeout(() => {
    if (!generating.value) genProgress.value = 0;
  }, 600);
}

/** 根据单张字节数预估纠错级别（按含中文的最坏情况留余量）。
 *  实测上限（按字节，含中文内容更小）：
 *    H: ASCII 1850 / 中文 1274  → 阈值 1200
 *    Q: ASCII 2420 / 中文 1664  → 阈值 1600
 *    M: ASCII 3000 / 中文 2333  → 阈值 2300
 *    L: ASCII 3000 / 中文 2954  → 阈值 2900
 *  注：这只是初值，renderCurrent 会逐级降级重试，确保最终一定能生成。 */
function pickErrorLevel(bytes: number): "H" | "Q" | "M" | "L" {
  if (bytes <= 1200) return "H";
  if (bytes <= 1600) return "Q";
  if (bytes <= 2300) return "M";
  return "L";
}

/** 当前张实际使用的纠错级别（用于 UI 提示） */
const currentECL = ref<"H" | "Q" | "M" | "L">("H");

/** 只渲染当前张二维码到 canvas。
 *  纠错级别自动降级重试：预估级别失败则依次 H→Q→M→L，直到成功。
 *  这样无论内容是纯 ASCII 还是含中文，都能保证生成，不会静默失败。 */
async function renderCurrent(): Promise<void> {
  const canvas = qrCanvas.value;
  if (!canvas) return;
  const data = chunks.value[currentIndex.value];
  const bytes = encoder.encode(data).length;
  const levels: ("H" | "Q" | "M" | "L")[] = ["H", "Q", "M", "L"];
  const startIdx = levels.indexOf(pickErrorLevel(bytes));
  let lastErr: unknown = null;
  for (let i = Math.max(0, startIdx); i < levels.length; i++) {
    const ecl = levels[i];
    try {
      await QRCode.toCanvas(canvas, data, {
        errorCorrectionLevel: ecl,
        width: 480,
        margin: 2,
      });
      currentECL.value = ecl;
      return; // 成功
    } catch (err) {
      lastErr = err;
      // 容量超限则继续降级，其他错误也继续试下一级
    }
  }
  // 全部级别都失败：保留分片，提示用户调小容量（不清空 chunks，便于用户看到上下文）
  currentECL.value = "L";
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  ElMessage.error(
    /too big|data is too/i.test(msg)
      ? `当前张 ${bytes} 字节超出 QR 码上限，请调小「单张容量」后重新生成`
      : `生成失败：${msg}`,
  );
}

/** 标记当前张已扫，并自动跳到下一张待扫的 */
function markScannedAndNext(): void {
  if (chunks.value.length === 0) return;
  scanStatus.value[currentIndex.value] = "scanned";
  // 找下一张待扫的
  const next = scanStatus.value.findIndex((s, i) => i !== currentIndex.value && s === "pending");
  if (next >= 0) {
    goTo(next);
    ElMessage.success(`第 ${currentIndex.value + 1} 张已扫，已跳到下一张待扫`);
  } else {
    // 全部扫完
    const remain = scanStatus.value.filter((s) => s === "pending").length;
    if (remain === 0) {
      ElMessage.success(`全部 ${chunks.value.length} 张已扫完 🎉`);
    } else {
      ElMessage.success("当前张已扫");
    }
  }
}

function goTo(i: number): void {
  if (i < 0 || i >= chunks.value.length) return;
  currentIndex.value = i;
  nextTick(() => renderCurrent());
}

function prev(): void {
  if (currentIndex.value > 0) goTo(currentIndex.value - 1);
}

function next(): void {
  if (currentIndex.value < chunks.value.length - 1) goTo(currentIndex.value + 1);
}

/** 一键把所有张标记为已扫 */
function markAllScanned(): void {
  if (chunks.value.length === 0) return;
  scanStatus.value = chunks.value.map(() => "scanned" as const);
  ElMessage.success(`已将 ${chunks.value.length} 张全部标记为已扫`);
}

/** 重置所有扫码标记为待扫，回到第 1 张 */
function resetProgress(): void {
  if (chunks.value.length === 0) return;
  scanStatus.value = chunks.value.map(() => "pending" as const);
  goTo(0);
  ElMessage.info("已重置扫码进度");
}

const scannedCount = computed(() => scanStatus.value.filter((s) => s === "scanned").length);
const progressRate = computed(() =>
  chunks.value.length === 0 ? 0 : Math.round((scannedCount.value / chunks.value.length) * 100),
);
const allDone = computed(() => chunks.value.length > 0 && scannedCount.value === chunks.value.length);

/** 键盘快捷键：连续扫码时按空格/回车 = 已扫此张并跳下一张，左右方向键翻页 */
function onKeydown(e: KeyboardEvent): void {
  if (chunks.value.length === 0) return;
  // 避免在文本框/输入框里触发
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "TEXTAREA" || tag === "INPUT" || (e.target as HTMLElement)?.isContentEditable) return;
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    markScannedAndNext();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    prev();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    next();
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

function clearAll(): void {
  input.value = "";
  chunks.value = [];
  scanStatus.value = [];
  currentIndex.value = 0;
  fileName.value = "";
}

function insertSample(): void {
  input.value = SAMPLE_DIFF;
  fileName.value = "";
}

function triggerUpload(): void {
  fileInput.value?.click();
}

function onFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  // 校验文件类型：仅允许 txt / md
  const lowerName = file.name.toLowerCase();
  const okExt = lowerName.endsWith(".txt") || lowerName.endsWith(".md");
  const okType = file.type === "text/plain" || file.type === "text/markdown" || file.type === "";
  if (!okExt && !okType) {
    ElMessage.warning("仅支持 .txt 或 .md 文件");
    // 重置 input，便于再次选择同一文件
    target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const text = typeof reader.result === "string" ? reader.result : "";
    input.value = text;
    fileName.value = file.name;
    ElMessage.success(`已载入 ${file.name}（${chunkBytes(text)}）`);
    // 重置 input，便于再次选择同一文件
    target.value = "";
  };
  reader.onerror = () => {
    ElMessage.error("文件读取失败");
    target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

const stats = computed(() => {
  if (!input.value) return null;
  const bytes = encoder.encode(input.value).length;
  return {
    lines: input.value.split("\n").length,
    chars: input.value.length,
    size: bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`,
  };
});

function chunkBytes(text: string): string {
  const bytes = encoder.encode(text).length;
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
}
</script>

<template>
  <div class="qr-tool">
    <div class="toolbar">
      <el-button type="primary" :loading="generating" @click="generate">生成二维码</el-button>
      <el-select v-model="chunkSize" style="width: 200px" placeholder="单张容量">
        <el-option v-for="opt in CHUNK_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-divider direction="vertical" />
      <el-button @click="triggerUpload">上传 txt / md</el-button>
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        style="display: none"
        @change="onFileSelected"
      />
      <el-button @click="insertSample">插入示例 diff</el-button>
      <el-button @click="clearAll">清空</el-button>
    </div>

    <div v-if="generating || genProgress > 0" class="gen-progress">
      <span class="gen-progress-text">{{ genStatusText || "处理中…" }}</span>
      <el-progress :percentage="genProgress" :stroke-width="10" :show-text="true" :indeterminate="genProgress < 30" />
    </div>

    <div class="pane">
      <div class="pane-header">
        <span>粘贴文本 / git diff{{ fileName ? ` · 已载入 ${fileName}` : "" }}</span>
        <span v-if="stats" class="pane-stats">{{ stats.lines }} 行 · {{ stats.chars }} 字符 · {{ stats.size }}</span>
      </div>
      <el-input
        v-model="input"
        type="textarea"
        :rows="10"
        resize="vertical"
        placeholder="粘贴 git diff 或代码片段，点击「生成二维码」后手机扫码查看"
        spellcheck="false"
      />
    </div>

    <div class="qr-area">
      <el-empty v-if="chunks.length === 0" description="二维码会显示在这里" />

      <div v-else class="qr-stage">
        <!-- 进度汇总 -->
        <div class="qr-progress">
          <div class="qr-progress-text">
            <span>共 {{ chunks.length }} 张 · 已扫 {{ scannedCount }} / {{ chunks.length }}（{{ progressRate }}%）</span>
            <span v-if="allDone" class="qr-done-tag">全部扫完 🎉</span>
          </div>
          <el-progress :percentage="progressRate" :stroke-width="8" :show-text="false" />
        </div>

        <!-- 状态点：每个点代表一张，点击可跳转 -->
        <div class="qr-dots">
          <button
            v-for="(s, i) in scanStatus"
            :key="i"
            type="button"
            class="qr-dot"
            :class="{ scanned: s === 'scanned', active: i === currentIndex }"
            :title="`第 ${i + 1} 张 · ${s === 'scanned' ? '已扫' : '待扫'}`"
            @click="goTo(i)"
          >
            {{ i + 1 }}
          </button>
        </div>

        <!-- 当前二维码（一次只展示一张） -->
        <el-card class="qr-card" shadow="hover">
          <div class="qr-card-title">
            第 {{ currentIndex + 1 }} / {{ chunks.length }} 张
            <el-tag v-if="scanStatus[currentIndex] === 'scanned'" type="success" size="small" effect="plain">已扫</el-tag>
            <el-tag v-else type="warning" size="small" effect="plain">待扫</el-tag>
          </div>
          <canvas ref="qrCanvas" class="qr-canvas" />
          <div class="qr-meta">
            {{ chunkBytes(chunks[currentIndex]) }} · 纠错 {{ currentECL }} 级
            <span class="qr-ecl-hint">{{
              currentECL === "H" ? "（容错高，最易扫）" : currentECL === "Q" ? "（容错中）" : currentECL === "M" ? "（容错低，密度高）" : "（容错最低，密度最高）"
            }}</span>
          </div>
        </el-card>

        <!-- 分页导航 -->
        <div class="qr-nav">
          <el-button :disabled="currentIndex === 0" @click="prev">← 上一张</el-button>
          <el-button
            type="success"
            :disabled="scanStatus[currentIndex] === 'scanned'"
            @click="markScannedAndNext"
          >
            {{ scanStatus[currentIndex] === "scanned" ? "已扫此张" : "已扫此张，下一张 ✓" }}
          </el-button>
          <el-button :disabled="currentIndex === chunks.length - 1" @click="next">下一张 →</el-button>
        </div>

        <!-- 批量操作：大文件分页时一键归类 -->
        <div class="qr-batch">
          <el-button text @click="markAllScanned">全部标记已扫</el-button>
          <el-button text @click="resetProgress">重置进度</el-button>
        </div>
        <div class="qr-tip">快捷键：空格/回车 = 已扫此张并跳下一张 · ← → 翻页</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-tool {
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar .el-button + .el-button {
  margin-left: 0;
}

.pane {
  margin-bottom: 16px;
}

.gen-progress {
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  background: #ecf5ff;
}

.gen-progress-text {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #409eff;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.pane-stats {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.pane :deep(.el-textarea__inner) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.qr-area {
  margin-top: 8px;
}

.qr-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbfc;
}

.qr-progress {
  width: 100%;
  max-width: 360px;
}

.qr-progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.qr-done-tag {
  color: #67c23a;
  font-weight: 600;
}

.qr-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.qr-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #dcdfe6;
  background: #fff;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.qr-dot:hover {
  border-color: #409eff;
  color: #409eff;
}

.qr-dot.scanned {
  background: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

.qr-dot.active {
  border-color: #409eff;
  color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.18);
  transform: scale(1.08);
}

.qr-dot.active.scanned {
  border-color: #67c23a;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.22);
}

.qr-card {
  width: 100%;
  max-width: 540px;
  text-align: center;
}

/* 收紧卡片内边距，让二维码占满更大区域 */
.qr-card :deep(.el-card__body) {
  padding: 12px;
}

.qr-card-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qr-canvas {
  width: 100%;
  max-width: 480px;
  height: auto;
}

.qr-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.qr-ecl-hint {
  color: #c0c4cc;
}

.qr-nav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.qr-batch {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.qr-tip {
  font-size: 12px;
  color: #909399;
}
</style>
