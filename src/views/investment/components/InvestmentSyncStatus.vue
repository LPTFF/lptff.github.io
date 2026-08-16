<template>
  <el-alert
    v-if="visible"
    :type="alertType"
    :title="title"
    :description="description"
    show-icon
    :closable="false"
    class="sync-status"
  >
    <div v-if="busy" class="progress-row">
      <el-progress :percentage="progressPct" :indeterminate="indeterminate" :duration="2" />
    </div>
    <div v-if="branchRows.length" class="branch-list" aria-live="polite">
      <div v-for="branch in branchRows" :key="branch.label" class="branch" :class="`branch-${branch.status}`">
        <span class="branch-label">{{ branch.label }}</span>
        <span class="branch-value">{{ branch.text }}</span>
      </div>
    </div>
    <div class="status-meta">
      <span>插件待导入：{{ stagingLabel }}</span>
      <span>最近导入：{{ lastImportLabel }}</span>
      <span v-if="collectionMetricLabel">{{ collectionMetricLabel }}</span>
      <span v-if="state.lastImport">交易新增 {{ state.lastImport.addedTransactions }}，重复 {{ state.lastImport.duplicateTransactions }}</span>
    </div>
  </el-alert>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useInvestmentOS } from "../../../investment/composables/use-investment-os";

const { state } = useInvestmentOS();

const busy = computed(() => state.syncing || state.collecting);
// 只在有可展示/可操作状态时渲染：进行中 / 有待导入数据 / 失败或有错误。
// idle（无待导入、无操作）、up-to-date 与 completed（导入后已同步的常态）都不显示，
// 避免常驻的"成功"横幅噪音；瞬时反馈由按钮 toast 承担。
const visible = computed(() =>
  state.syncing
  || state.collecting
  || state.syncPhase === "failed"
  || Boolean(state.extensionStatus?.pending)
  || Boolean(state.error)
);
const alertType = computed<"success" | "warning" | "error" | "info">(() => {
  if (state.syncPhase === "failed") return "error";
  if (state.lastFailures.length) return "warning";
  return "info";
});
const STAGE_LABEL: Record<string, string> = {
  idle: "待命",
  preparing: "准备采集环境",
  hold: "读取账户与持仓",
  collecting: "并行采集基金详情、公开档案和交易分页",
  processing: "构建全面来源采集包",
  completed: "采集完成",
  error: "采集出错",
};

const BRANCH_STATUS: Record<string, string> = {
  pending: "等待",
  running: "进行中",
  completed: "完成",
  partial: "部分完成",
};

const branchRows = computed(() => {
  const branches = state.collectionProgress?.branches;
  if (!branches) return [];
  const active = Object.values(branches).some(
    (branch) => branch.status !== "pending" || branch.completed > 0 || branch.total > 0,
  );
  if (!active) return [];
  return Object.values(branches).map((branch) => {
    const count = branch.total > 0 ? ` ${branch.completed}/${branch.total}` : "";
    const duration = branch.durationMs > 0 ? ` · ${formatDuration(branch.durationMs)}` : "";
    return {
      label: branch.label,
      status: branch.status,
      text: `${BRANCH_STATUS[branch.status] ?? branch.status}${count}${duration}`,
    };
  });
});

const activeBranchLabel = computed(() => {
  const branches = state.collectionProgress?.branches;
  if (!branches) return "";
  return Object.values(branches)
    .filter((branch) => branch.status === "running")
    .map((branch) => branch.total ? `${branch.label} ${branch.completed}/${branch.total}` : branch.label)
    .join("、");
});

const title = computed(() => {
  if (state.collecting) {
    const progress = state.collectionProgress;
    const stageLabel = STAGE_LABEL[progress?.stage ?? "idle"] ?? "采集中";
    const detail = activeBranchLabel.value ? `（${activeBranchLabel.value}）` : "";
    return `插件正在采集完整来源数据：${stageLabel}${detail}`;
  }
  if (state.syncing) return "正在导入插件数据";
  if (state.syncPhase === "failed") return "本次操作失败";
  if (state.extensionStatus?.pending) return "有一批采集数据等待导入";
  return "插件数据传输状态";
});
const description = computed(() => state.error || state.syncMessage);
const stagingLabel = computed(() => {
  if (state.extensionStatus?.pending) return "有一批数据等待导入";
  if (state.extensionStatus?.receipt?.status === "imported") return "已在导入后清除";
  if (state.extensionStatus?.receipt?.status === "discarded") return "已丢弃";
  return "无待导入数据";
});
const lastImportLabel = computed(() => state.lastImport?.capturedAt ? formatDateTime(state.lastImport.capturedAt) : "尚无导入记录");
const collectionMetricLabel = computed(() => {
  const metrics = state.collectionProgress?.metrics;
  if (!metrics || (!state.collecting && !metrics.totalMs)) return "";
  const elapsed = metrics.elapsedMs ?? metrics.totalMs;
  const stagingSize = metrics.stagingBytes > 0 ? ` · 暂存 ${formatSize(metrics.stagingBytes)}` : "";
  const tabPeak = metrics.temporaryTabPeak > 0 ? ` · 临时页峰值 ${metrics.temporaryTabPeak}` : "";
  return `采集 ${formatDuration(elapsed)} · 请求 ${metrics.requestCount} · 交易页 ${metrics.transactionPages}${tabPeak}${stagingSize}`;
});
const progressPct = computed(() => {
  const progress = state.collectionProgress;
  if (!progress) return 0;
  if (progress.stage === "completed") return 100;
  if (progress.stage === "processing") return 95;
  if (progress.stage === "hold") return 8;
  const branches = progress.branches ? Object.values(progress.branches) : [];
  const total = branches.reduce((sum, branch) => sum + branch.total, 0);
  const completed = branches.reduce((sum, branch) => sum + Math.min(branch.completed, branch.total), 0);
  return total > 0 ? Math.min(92, 10 + Math.round((completed / total) * 82)) : 0;
});
const indeterminate = computed(() => !progressPct.value);

function formatDuration(value: number): string {
  const seconds = Math.max(0, value || 0) / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)} 秒` : `${Math.round(seconds)} 秒`;
}

function formatSize(value: number): string {
  const bytes = Math.max(0, value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}
</script>

<style scoped>
.sync-status {
  margin: 8px 0;
}
.progress-row {
  margin: 10px 0 4px;
}
.branch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 2px;
}
.branch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 4px;
  background: #f5f7fa;
  font-size: 12px;
}
.branch-running {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.branch-completed {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.branch-partial {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.status-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
