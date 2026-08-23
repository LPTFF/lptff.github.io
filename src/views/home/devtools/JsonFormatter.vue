<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";

const SAMPLE_JSON = `{
  "name": "dev-tools",
  "version": "0.1.0",
  "tools": ["json-formatter"],
  "config": { "indent": 2, "strict": true }
}`;

type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string; line: number | null; column: number | null };

const input = ref("");
const output = ref("");
const indent = ref<2 | 4>(2);
const parseError = ref<{ message: string; location: string } | null>(null);
const validated = ref(false);

/** 从 V8 报错中提取位置：新版为 "at line X column Y"，旧版为 "at position N" */
function locateError(text: string, message: string): { line: number | null; column: number | null } {
  const lineCol = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineCol) {
    return { line: Number(lineCol[1]), column: Number(lineCol[2]) };
  }
  const pos = message.match(/position\s+(\d+)/i);
  if (pos) {
    const offset = Number(pos[1]);
    const before = text.slice(0, offset);
    const line = before.split("\n").length;
    const lastBreak = before.lastIndexOf("\n");
    return { line, column: offset - lastBreak };
  }
  return { line: null, column: null };
}

function tryParse(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const { line, column } = locateError(text, message);
    return { ok: false, message, line, column };
  }
}

function run(action: "format" | "compress"): void {
  const text = input.value.trim();
  if (!text) {
    ElMessage.warning("请先输入 JSON 内容");
    return;
  }
  const result = tryParse(text);
  if (!result.ok) {
    ElMessage.error("JSON 语法错误，请根据下方提示修正");
    return;
  }
  output.value = action === "format" ? JSON.stringify(result.value, null, indent.value) : JSON.stringify(result.value);
  ElMessage.success(action === "format" ? "格式化完成" : "压缩完成");
}

async function copyOutput(): Promise<void> {
  if (!output.value) {
    ElMessage.warning("没有可复制的结果");
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败，请手动选择复制");
  }
}

function clearAll(): void {
  input.value = "";
  output.value = "";
}

function insertSample(): void {
  input.value = SAMPLE_JSON;
}

// 输入变化时实时校验，给出即时反馈
watch(input, (text) => {
  validated.value = false;
  parseError.value = null;
  if (!text.trim()) return;
  const result = tryParse(text);
  validated.value = true;
  if (!result.ok) {
    parseError.value = {
      message: result.message,
      location:
        result.line !== null && result.column !== null
          ? `第 ${result.line} 行，第 ${result.column} 列`
          : "无法定位",
    };
  }
});

const stats = computed(() => {
  const text = input.value;
  if (!text) return null;
  const bytes = new TextEncoder().encode(text).length;
  return {
    lines: text.split("\n").length,
    chars: text.length,
    size: bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`,
  };
});
</script>

<template>
  <div class="json-tool">
    <div class="toolbar">
      <el-button type="primary" @click="run('format')">格式化</el-button>
      <el-button @click="run('compress')">压缩</el-button>
      <el-radio-group v-model="indent" size="default">
        <el-radio-button :value="2">2 空格</el-radio-button>
        <el-radio-button :value="4">4 空格</el-radio-button>
      </el-radio-group>
      <el-divider direction="vertical" />
      <el-button @click="insertSample">插入示例</el-button>
      <el-button @click="clearAll">清空</el-button>
      <el-button :disabled="!output" type="success" plain @click="copyOutput">复制结果</el-button>
    </div>

    <el-alert
      v-if="parseError"
      class="status"
      type="error"
      :title="`语法错误（${parseError.location}）`"
      :description="parseError.message"
      :closable="false"
      show-icon
    />
    <el-alert
      v-else-if="validated"
      class="status"
      type="success"
      title="JSON 合法"
      :closable="false"
      show-icon
    />

    <div class="pane-grid">
      <div class="pane">
        <div class="pane-header">
          <span>输入</span>
          <span v-if="stats" class="pane-stats">
            {{ stats.lines }} 行 · {{ stats.chars }} 字符 · {{ stats.size }}
          </span>
        </div>
        <el-input
          v-model="input"
          type="textarea"
          :rows="18"
          resize="vertical"
          placeholder='粘贴 JSON，例如 {"a": 1}'
          spellcheck="false"
        />
      </div>
      <div class="pane">
        <div class="pane-header">
          <span>结果</span>
        </div>
        <el-input
          v-model="output"
          type="textarea"
          :rows="18"
          resize="vertical"
          readonly
          placeholder="格式化 / 压缩结果会显示在这里"
          spellcheck="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-tool {
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

.status {
  margin-bottom: 12px;
}

.pane-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

@media (max-width: 768px) {
  .pane-grid {
    grid-template-columns: 1fr;
  }
}
</style>
