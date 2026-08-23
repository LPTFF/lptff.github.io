<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  ALGOS,
  ENCODINGS,
  compress,
  decompress,
  formatBytes,
  type Algo,
  type Encoding,
} from "./compress";

const SAMPLE = `这是文本压缩工具的示例文本。
Text Compression Tool —— 在不损失信息的前提下最大化压缩内容。
支持三种算法（FFlate / 原生 CompressionStream / LZ-String）与三种编码（Base64 / URL安全 / UTF-16）。
重复内容越多，压缩率越高。Repeat content compresses better. 重复内容越多，压缩率越高。`;

/** 顶部共享：算法与编码（压缩/解压共用同一套配置） */
const algo = ref<Algo>("fflate");
const encoding = ref<Encoding>("base64");

/* ---------------- 压缩区 ---------------- */
const compressInput = ref("");
const compressOutput = ref("");
const compressing = ref(false);
const compressError = ref<string | null>(null);

const compressInputStats = computed(() => {
  const text = compressInput.value;
  if (!text) return null;
  const bytes = new TextEncoder().encode(text).length;
  return { lines: text.split("\n").length, chars: text.length, size: formatBytes(bytes) };
});

const compressStats = computed(() => {
  const text = compressInput.value;
  if (!text || !compressOutput.value) return null;
  const orig = new TextEncoder().encode(text).length;
  const outBytes = new TextEncoder().encode(compressOutput.value).length;
  const ratio = orig > 0 ? outBytes / orig : 0;
  return { origBytes: orig, outBytes, ratio, saved: orig - outBytes };
});

async function doCompress(): Promise<void> {
  const text = compressInput.value;
  if (!text) {
    ElMessage.warning("请先输入要压缩的内容");
    return;
  }
  compressing.value = true;
  compressError.value = null;
  compressOutput.value = "";
  try {
    const res = await compress(text, algo.value, encoding.value);
    compressOutput.value = res.output;
    if (!res.output) ElMessage.warning("压缩结果为空");
    else ElMessage.success("压缩完成");
  } catch (err) {
    compressError.value = err instanceof Error ? err.message : String(err);
    ElMessage.error("压缩失败");
  } finally {
    compressing.value = false;
  }
}

async function copyCompressed(): Promise<void> {
  if (!compressOutput.value) {
    ElMessage.warning("没有压缩结果可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(compressOutput.value);
    ElMessage.success("已复制压缩结果");
  } catch {
    ElMessage.error("复制失败，请手动选择复制");
  }
}

/** 把压缩结果一键送入解压输入框，方便立即验证还原 */
function sendToDecompress(): void {
  if (!compressOutput.value) {
    ElMessage.warning("没有压缩结果可发送");
    return;
  }
  decompressInput.value = compressOutput.value;
  ElMessage.success("已填入解压输入框，点击「解压」即可验证还原");
}

function clearCompress(): void {
  compressInput.value = "";
  compressOutput.value = "";
  compressError.value = null;
}

/* ---------------- 解压区 ---------------- */
const decompressInput = ref("");
const decompressOutput = ref("");
const decompressing = ref(false);
const decompressError = ref<string | null>(null);

const decompressInputStats = computed(() => {
  const text = decompressInput.value;
  if (!text) return null;
  const bytes = new TextEncoder().encode(text).length;
  return { lines: text.split("\n").length, chars: text.length, size: formatBytes(bytes) };
});

const decompressStats = computed(() => {
  const text = decompressInput.value;
  if (!text || !decompressOutput.value) return null;
  const orig = new TextEncoder().encode(text).length;
  const outBytes = new TextEncoder().encode(decompressOutput.value).length;
  const ratio = orig > 0 ? outBytes / orig : 0;
  return { origBytes: orig, outBytes, ratio };
});

async function doDecompress(): Promise<void> {
  const text = decompressInput.value;
  if (!text) {
    ElMessage.warning("请先输入要解压的压缩串");
    return;
  }
  decompressing.value = true;
  decompressError.value = null;
  decompressOutput.value = "";
  try {
    const res = await decompress(text, algo.value, encoding.value);
    decompressOutput.value = res;
    ElMessage.success("解压完成");
  } catch (err) {
    decompressError.value = err instanceof Error ? err.message : String(err);
    ElMessage.error("解压失败，请检查算法/编码是否与压缩时一致");
  } finally {
    decompressing.value = false;
  }
}

async function copyDecompressed(): Promise<void> {
  if (!decompressOutput.value) {
    ElMessage.warning("没有还原结果可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(decompressOutput.value);
    ElMessage.success("已复制还原原文");
  } catch {
    ElMessage.error("复制失败，请手动选择复制");
  }
}

function clearDecompress(): void {
  decompressInput.value = "";
  decompressOutput.value = "";
  decompressError.value = null;
}

function insertSample(): void {
  compressInput.value = SAMPLE;
}

// 切换算法/编码时清空两侧结果，避免用错算法解压旧结果
function resetOutputs(): void {
  compressOutput.value = "";
  decompressOutput.value = "";
  compressError.value = null;
  decompressError.value = null;
}
</script>

<template>
  <div class="compress-tool">
    <!-- 顶部：共享的算法与编码选择 -->
    <div class="toolbar">
      <span class="field-label">算法</span>
      <el-select v-model="algo" size="default" class="algo-select" @change="resetOutputs">
        <el-option v-for="a in ALGOS" :key="a.id" :value="a.id" :label="a.name">
          <span style="float: left">{{ a.name }}</span>
          <span class="opt-desc">{{ a.desc }}</span>
        </el-option>
      </el-select>

      <span class="field-label">编码</span>
      <el-select v-model="encoding" size="default" class="encoding-select" @change="resetOutputs">
        <el-option v-for="e in ENCODINGS" :key="e.id" :value="e.id" :label="e.name">
          <span style="float: left">{{ e.name }}</span>
          <span class="opt-desc">{{ e.desc }}</span>
        </el-option>
      </el-select>

      <el-button @click="insertSample">填入示例</el-button>
    </div>

    <!-- 压缩区 + 解压区 并排 -->
    <div class="two-pane">
      <!-- ========== 压缩 ========== -->
      <section class="card">
        <div class="card-title">压缩</div>

        <div class="pane-header">
          <span>输入（待压缩文本）</span>
          <span v-if="compressInputStats" class="pane-stats">
            {{ compressInputStats.lines }} 行 · {{ compressInputStats.chars }} 字符 · {{ compressInputStats.size }}
          </span>
        </div>
        <el-input
          v-model="compressInput"
          type="textarea"
          :rows="8"
          resize="vertical"
          placeholder="粘贴要压缩的文本 / 代码 / JSON / diff…"
          spellcheck="false"
        />

        <div class="ops">
          <el-button type="primary" :loading="compressing" @click="doCompress">压缩</el-button>
          <el-button @click="clearCompress">清空</el-button>
        </div>

        <el-alert
          v-if="compressError"
          class="status"
          type="error"
          title="压缩失败"
          :description="compressError"
          :closable="false"
          show-icon
        />

        <div v-if="compressStats" class="stats-bar">
          <span>原始：<b>{{ formatBytes(compressStats.origBytes) }}</b></span>
          <span>压缩后：<b>{{ formatBytes(compressStats.outBytes) }}</b></span>
          <span>压缩率：<b :class="compressStats.ratio < 1 ? 'good' : 'bad'">{{ (compressStats.ratio * 100).toFixed(1) }}%</b></span>
          <span>节省：<b class="good">{{ formatBytes(Math.max(0, compressStats.saved)) }}</b></span>
        </div>

        <div class="pane-header">
          <span>压缩结果</span>
          <span v-if="compressOutput" class="pane-actions">
            <el-button link size="small" @click="copyCompressed">复制</el-button>
            <el-button link size="small" @click="sendToDecompress">送入解压 ↓</el-button>
          </span>
        </div>
        <el-input
          v-model="compressOutput"
          type="textarea"
          :rows="6"
          resize="vertical"
          readonly
          placeholder="压缩后的字符串会显示在这里"
          spellcheck="false"
        />
      </section>

      <!-- ========== 解压 ========== -->
      <section class="card">
        <div class="card-title">解压</div>

        <div class="pane-header">
          <span>输入（压缩串）</span>
          <span v-if="decompressInputStats" class="pane-stats">
            {{ decompressInputStats.lines }} 行 · {{ decompressInputStats.chars }} 字符 · {{ decompressInputStats.size }}
          </span>
        </div>
        <el-input
          v-model="decompressInput"
          type="textarea"
          :rows="8"
          resize="vertical"
          placeholder="粘贴压缩结果（Base64 / URL安全 / UTF-16）…"
          spellcheck="false"
        />

        <div class="ops">
          <el-button type="primary" :loading="decompressing" @click="doDecompress">解压</el-button>
          <el-button @click="clearDecompress">清空</el-button>
        </div>

        <el-alert
          v-if="decompressError"
          class="status"
          type="error"
          title="解压失败"
          :description="decompressError"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else-if="!decompressOutput"
          class="status"
          type="info"
          title="解压时算法与编码需与压缩时一致，否则无法还原"
          :closable="false"
          show-icon
        />

        <div v-if="decompressStats" class="stats-bar">
          <span>压缩串：<b>{{ formatBytes(decompressStats.origBytes) }}</b></span>
          <span>还原后：<b>{{ formatBytes(decompressStats.outBytes) }}</b></span>
        </div>

        <div class="pane-header">
          <span>解压结果（还原原文）</span>
          <el-button v-if="decompressOutput" link size="small" @click="copyDecompressed">复制</el-button>
        </div>
        <el-input
          v-model="decompressOutput"
          type="textarea"
          :rows="6"
          resize="vertical"
          readonly
          placeholder="解压还原的原文会显示在这里"
          spellcheck="false"
        />
      </section>
    </div>

    <p class="tip">
      💡 左侧压缩、右侧解压，各自独立。压缩后可点「送入解压 ↓」把结果一键填入右侧验证还原。
      FFlate（deflate）压缩率最优；URL安全Base64 适合二维码/URL；UTF-16 体积最小但含不可见字符，仅适合存储。
    </p>
  </div>
</template>

<style scoped>
.compress-tool {
  max-width: 1280px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.algo-select {
  width: 240px;
}

.encoding-select {
  width: 160px;
}

.opt-desc {
  float: right;
  font-size: 12px;
  color: #909399;
  margin-left: 12px;
}

.two-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.card {
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
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

.pane-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ops {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.ops .el-button + .el-button {
  margin-left: 0;
}

.status {
  margin-bottom: 12px;
}

.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
}

.stats-bar b {
  color: #303133;
}

.stats-bar b.good {
  color: #67c23a;
}

.stats-bar b.bad {
  color: #f56c6c;
}

.card :deep(.el-textarea__inner) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.tip {
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .two-pane {
    grid-template-columns: 1fr;
  }

  .algo-select,
  .encoding-select {
    width: 100%;
  }
}
</style>
