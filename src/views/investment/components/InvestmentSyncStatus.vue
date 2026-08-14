<template>
  <el-alert
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
    <div class="status-meta">
      <span>插件暂存：{{ stagingLabel }}</span>
      <span>最近导入：{{ lastImportLabel }}</span>
      <span v-if="state.lastImport">交易新增 {{ state.lastImport.addedTransactions }}，重复 {{ state.lastImport.duplicateTransactions }}</span>
    </div>
  </el-alert>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useInvestmentOS } from "../../../investment/composables/use-investment-os";

const { state } = useInvestmentOS();

const busy = computed(() => state.syncing || state.collecting);
const alertType = computed<"success" | "warning" | "error" | "info">(() => {
  if (state.syncPhase === "failed") return "error";
  if (state.lastFailures.length) return "warning";
  if (state.syncPhase === "completed" || state.syncPhase === "up-to-date") return "success";
  return "info";
});
const STAGE_LABEL: Record<string, string> = {
  idle: "待命",
  hold: "采集持仓",
  single: "采集单基金详情",
  transactions: "采集交易记录",
  downloading: "合并转换数据",
  completed: "采集完成",
  error: "采集出错",
};

const title = computed(() => {
  if (state.collecting) {
    const progress = state.collectionProgress;
    const stageLabel = STAGE_LABEL[progress?.stage ?? "idle"] ?? "采集中";
    const detail = progress?.stage === "single" && progress.fundTotal ? `（${progress.completedFunds}/${progress.fundTotal} 只基金）` : "";
    return `插件正在采集投资事实：${stageLabel}${detail}`;
  }
  if (state.syncing) return "正在导入插件数据";
  if (state.syncPhase === "up-to-date") return "插件与本地 Ledger 已同步";
  if (state.syncPhase === "completed") return "本次操作已完成";
  if (state.syncPhase === "failed") return "本次操作失败";
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
const progressPct = computed(() => {
  const progress = state.collectionProgress;
  if (!progress) return 0;
  if (progress.stage === "completed") return 100;
  if (progress.stage === "single" && progress.fundTotal) return Math.round((progress.completedFunds / progress.fundTotal) * 100);
  return 0;
});
const indeterminate = computed(() => !progressPct.value);

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
.status-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
