<template>
  <el-dialog
    v-model="visible"
    title="功能使用与需求验证观察（纯本机）"
    :width="dialogWidth"
    :append-to-body="true"
    class="observation-dialog"
  >
    <div class="observation-body">
      <!-- 隐私与安全说明 -->
      <el-alert
        title="本机隐私与独立运行说明"
        type="info"
        :closable="false"
        show-icon
        description="所有记录仅保存在当前浏览器的独立 IndexedDB 中。无任何远程请求、无第三方 SDK、不采集 URL/搜索词/简历/私人文本。关闭或清空即彻底销毁。"
      />

      <!-- 控制工具栏：状态切换、覆盖起点与操作 -->
      <div class="control-panel">
        <div class="status-row">
          <div class="status-badge-group">
            <span class="label font-medium">当前采集状态：</span>
            <el-tag :type="statusTagType" size="small" effect="dark">
              {{ statusLabel }}
            </el-tag>
          </div>

          <div class="action-buttons">
            <el-button
              v-if="settings.status !== 'active'"
              size="small"
              type="primary"
              @click="handleSetStatus('active')"
            >
              开启记录
            </el-button>
            <el-button
              v-if="settings.status === 'active'"
              size="small"
              type="warning"
              plain
              @click="handleSetStatus('paused')"
            >
              暂停记录
            </el-button>
            <el-button
              v-if="settings.status !== 'disabled'"
              size="small"
              type="info"
              plain
              @click="handleSetStatus('disabled')"
            >
              关闭记录
            </el-button>
            <el-button size="small" plain @click="handleExport">
              导出脱敏摘要
            </el-button>
            <el-button size="small" type="danger" plain @click="handleClear">
              清空记录
            </el-button>
            <el-button size="small" text @click="loadData">
              🔄 刷新
            </el-button>
          </div>
        </div>

        <div class="meta-row text-muted">
          <span>覆盖起点：<strong>{{ settings.coverageStartTime ? formatDate(settings.coverageStartTime) : '未开启' }}</strong></span>
          <span class="ml-3">观察窗口：<strong>最近 28 天</strong>（84 天趋势对比）</span>
          <span class="ml-3">原始事件总数：<strong>{{ allEvents.length }}</strong> 条（上限 20,000）</span>
          <span v-if="settings.truncated" class="ml-3 text-warning">⚠ 曾触发预算截断</span>
        </div>
      </div>

      <!-- 功能分类选项卡 -->
      <div class="feature-tabs-bar">
        <el-tabs v-model="selectedFeature" class="feature-tabs">
          <el-tab-pane label="求职机会 (career)" name="career" />
          <el-tab-pane label="福利雷达 (welfare)" name="welfare" />
          <el-tab-pane label="导航专区 (navigation)" name="navigation" />
          <el-tab-pane label="开发工具 (devtools)" name="devtools" />
          <el-tab-pane label="博客文章 (blog)" name="blog" />
          <el-tab-pane label="娱乐专区 (entertainment)" name="entertainment" />
        </el-tabs>
      </div>

      <!-- 当前选中功能指标卡片视图 -->
      <div v-if="currentMetrics" class="metrics-container">
        <!-- 充分度提示 -->
        <div v-if="settings.status === 'disabled'" class="notice-bar disabled-notice">
          ⚪ 当前记录已关闭。开启后将根据真实交互记录脱敏客观证据。
        </div>
        <div v-else-if="currentMetrics.data_sufficiency === 'unknown'" class="notice-bar unknown-notice">
          ℹ 暂无本功能的使用数据（Unknown）。未产生证据时不预设价值结论。
        </div>
        <div v-else-if="currentMetrics.data_sufficiency === 'insufficient'" class="notice-bar insufficient-notice">
          ⏳ 当前样本量较小（Insufficient，可见会话 &lt; 3 或尝试 &lt; 5），请等待更多相关周期沉淀，不以此推导刚需或淘汰。
        </div>

        <!-- 核心度量四宫格 -->
        <div class="metric-cards-grid">
          <!-- 卡片 1：尝试与外跳比例 -->
          <div class="metric-card">
            <div class="card-head">🎯 尝试比例</div>
            <div class="card-num">
              <template v-if="currentMetrics.attempt_ratio !== null">
                {{ (currentMetrics.attempt_ratio * 100).toFixed(1) }}%
              </template>
              <template v-else>
                <span class="text-muted">不适用</span>
              </template>
            </div>
            <div class="card-desc text-muted">
              有主动尝试的可见会话数 ({{ currentMetrics.attempt_sessions }}) / 可见会话数 ({{ currentMetrics.visible_sessions }})
            </div>
            <div v-if="currentMetrics.outbound_ratio !== null" class="card-sub-metric mt-1">
              外跳意图会话比例：<strong>{{ (currentMetrics.outbound_ratio * 100).toFixed(1) }}%</strong> ({{ currentMetrics.outbound_sessions }} 会话)
            </div>
          </div>

          <!-- 卡片 2：任务完成情况 -->
          <div class="metric-card">
            <div class="card-head">🏁 任务完成情况</div>
            <div class="card-num">
              <template v-if="currentMetrics.success_rate !== null">
                {{ (currentMetrics.success_rate * 100).toFixed(1) }}%
              </template>
              <template v-else>
                <span class="text-muted">无尝试</span>
              </template>
            </div>
            <div class="card-desc text-muted">
              成功数 ({{ currentMetrics.task_success }}) / 尝试数 ({{ currentMetrics.task_attempts }})
            </div>
            <div class="card-tags-breakdown mt-2">
              <el-tag size="small" type="success">成功: {{ currentMetrics.task_success }}</el-tag>
              <el-tag size="small" type="info" class="ml-1">空结果: {{ currentMetrics.task_empty }}</el-tag>
              <el-tag size="small" type="danger" class="ml-1">失败: {{ currentMetrics.task_failure }}</el-tag>
              <el-tag size="small" type="warning" class="ml-1">取消: {{ currentMetrics.task_cancelled }}</el-tag>
              <el-tag size="small" type="info" effect="plain" class="ml-1">未闭环: {{ currentMetrics.task_unobserved }}</el-tag>
            </div>
            <div class="card-sub-metric mt-1 text-muted" style="font-size: 11px;">
              终态覆盖率：{{ currentMetrics.final_state_coverage !== null ? (currentMetrics.final_state_coverage * 100).toFixed(1) + '%' : 'N/A' }}
            </div>
          </div>

          <!-- 卡片 3：持续使用（跨周期） -->
          <div class="metric-card">
            <div class="card-head">📅 持续使用（跨周期）</div>
            <div class="cycle-stats">
              <div class="stat-item">
                <span class="val">{{ currentMetrics.distinct_days }}</span>
                <span class="lbl text-muted">自然活跃天数</span>
              </div>
              <div class="stat-item">
                <span class="val">{{ currentMetrics.distinct_weeks }}</span>
                <span class="lbl text-muted">跨越自然周数</span>
              </div>
              <div class="stat-item">
                <span class="val">{{ currentMetrics.weeks_with_completion }}</span>
                <span class="lbl text-muted">成功完成周数</span>
              </div>
            </div>
            <div class="card-desc text-muted mt-2" style="font-size: 11px;">
              均活跃日间隔：{{ currentMetrics.adjacent_day_interval !== null ? currentMetrics.adjacent_day_interval + ' 天' : '仅单日活跃' }}
              <br />（仅代表此浏览器本机，不属于留存率指标）
            </div>
          </div>

          <!-- 卡片 4：定性价值反馈 -->
          <div class="metric-card">
            <div class="card-head">💬 自愿价值反馈</div>
            <div class="feedback-stats-row">
              <div class="fb-item">👍 有帮助: <strong>{{ currentMetrics.feedback_counts.helpful }}</strong></div>
              <div class="fb-item">👎 无帮助: <strong>{{ currentMetrics.feedback_counts.unhelpful }}</strong></div>
              <div class="fb-item">⚪ 当前不需要: <strong>{{ currentMetrics.feedback_counts.not_needed_now }}</strong></div>
            </div>
            <div class="card-desc text-muted mt-2" style="font-size: 11px;">
              反馈覆盖率：{{ currentMetrics.feedback_coverage !== null ? (currentMetrics.feedback_coverage * 100).toFixed(1) + '%' : '无反馈' }}
              <br />（无反馈代表未知，不自动视为无价值）
            </div>
          </div>
        </div>

        <!-- 运行阻碍与健康分布分析 -->
        <div class="obstacles-section mt-3">
          <div class="section-title font-medium">🛠 运行阻碍与健康能力诊断（辅助区分需求不足与运行障碍）</div>
          <div class="obstacles-grid">
            <div class="obs-card">
              <div class="obs-title">失败错误分类</div>
              <div class="obs-tags">
                <span v-for="(cnt, errKey) in currentMetrics.error_category_counts" :key="errKey" class="obs-pill">
                  {{ errKey }}: <strong>{{ cnt }}</strong>
                </span>
              </div>
            </div>
            <div class="obs-card">
              <div class="obs-title">功能健康状态</div>
              <div class="obs-tags">
                <span v-for="(cnt, hKey) in currentMetrics.health_counts" :key="hKey" class="obs-pill">
                  {{ hKey }}: <strong>{{ cnt }}</strong>
                </span>
              </div>
            </div>
            <div class="obs-card">
              <div class="obs-title">任务阻碍等级反馈</div>
              <div class="obs-tags">
                <span v-for="(cnt, obsKey) in currentMetrics.obstruction_counts" :key="obsKey" class="obs-pill">
                  {{ obsKey }}: <strong>{{ cnt }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  getSettings,
  updateSettings,
  getAllRawEvents,
  clearAllObservationData,
  exportObservationSummary,
  computeFeatureMetrics,
} from "../utils/observation";
import type {
  FeatureId,
  ObservationSettings,
  ObservationEvent,
  FeatureMetricsSummary,
} from "../utils/observation";
import { ElMessageBox, ElMessage } from "element-plus";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const dialogWidth = computed(() => {
  if (typeof window !== "undefined" && window.innerWidth < 768) return "95%";
  return "840px";
});

const settings = ref<ObservationSettings>({
  status: "disabled",
  coverageStartTime: null,
  retentionDaysRaw: 28,
  retentionDaysAgg: 180,
  isTestMode: false,
  truncated: false,
});

const allEvents = ref<ObservationEvent[]>([]);
const selectedFeature = ref<FeatureId>("career");

const currentMetrics = computed<FeatureMetricsSummary | null>(() => {
  return computeFeatureMetrics(selectedFeature.value, allEvents.value, settings.value.isTestMode);
});

const statusLabel = computed(() => {
  if (settings.value.status === "active") return "🟢 记录中";
  if (settings.value.status === "paused") return "🟡 已暂停";
  return "⚪ 未开启 (已关闭)";
});

const statusTagType = computed(() => {
  if (settings.value.status === "active") return "success";
  if (settings.value.status === "paused") return "warning";
  return "info";
});

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return isoStr;
  }
}

async function loadData() {
  settings.value = await getSettings();
  allEvents.value = await getAllRawEvents(28);
}

async function handleSetStatus(newStatus: "active" | "paused" | "disabled") {
  settings.value = await updateSettings({ status: newStatus });
  await loadData();
  ElMessage.success(`观察记录状态已切换为：${newStatus}`);
}

async function handleClear() {
  try {
    await ElMessageBox.confirm(
      "确定要清空本机所有观察事件、聚合数据与会话记录吗？覆盖起点将重置，此操作不可逆。",
      "清空本地观察记录",
      {
        confirmButtonText: "确定清空",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await clearAllObservationData();
    await loadData();
    ElMessage.success("本地观察数据已全部清空，覆盖起点已重置");
  } catch {
    // cancelled
  }
}

async function handleExport() {
  const data = await exportObservationSummary();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lptff-feature-observation-summary-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("脱敏聚合摘要已导出");
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      void loadData();
    }
  }
);

onMounted(() => {
  void loadData();
});
</script>

<style scoped>
.observation-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.observation-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-panel {
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.status-badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-row {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.notice-bar {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 12px;
}

.disabled-notice {
  background: #f1f5f9;
  color: #475569;
}

.unknown-notice {
  background: #eff6ff;
  color: #1d4ed8;
}

.insufficient-notice {
  background: #fffbeb;
  color: #b45309;
}

.metric-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.metric-card {
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.card-head {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.card-num {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 6px 0 4px 0;
}

.card-desc {
  font-size: 12px;
}

.card-sub-metric {
  font-size: 12px;
  color: #475569;
}

.card-tags-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cycle-stats {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .val {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.stat-item .lbl {
  font-size: 11px;
}

.feedback-stats-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  margin-top: 6px;
}

.obstacles-section {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.section-title {
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 8px;
}

.obstacles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.obs-card {
  background: #fff;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.obs-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.obs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.obs-pill {
  font-size: 11px;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  color: #334155;
}
</style>
