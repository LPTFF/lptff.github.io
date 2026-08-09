<template>
  <div class="os-layout">
    <div class="os-header">
      <div class="os-title">
        <span class="os-name">LPTFF Investment OS</span>
        <el-tag :type="healthTag" effect="plain" size="small">{{ healthText }}</el-tag>
      </div>
      <div class="os-actions">
        <el-button type="primary" size="small" :loading="state.syncing" :disabled="state.collecting" @click="syncFromExtension">读取待导入数据</el-button>
      </div>
    </div>

    <InvestmentSyncStatus />

    <el-alert v-if="state.lastFailures.length"
      type="warning"
      :title="`上次同步部分失败：${state.lastFailures.join('；')}`"
      show-icon
      :closable="false"
      class="os-alert"
    />

    <el-menu mode="horizontal" router :default-active="route.path" class="os-menu">
      <el-menu-item index="/investment">控制台</el-menu-item>
      <el-menu-item index="/investment/portfolio">组合</el-menu-item>
      <el-menu-item index="/investment/policies">规则</el-menu-item>
      <el-menu-item index="/investment/actions">行动</el-menu-item>
      <el-menu-item index="/investment/data">数据</el-menu-item>
      <el-menu-item index="/investment/evidence">证据</el-menu-item>
      <el-menu-item index="/investment/legacy">旧版复盘</el-menu-item>
    </el-menu>

    <div class="os-body">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import InvestmentSyncStatus from "./components/InvestmentSyncStatus.vue";

const route = useRoute();
const { state, syncFromExtension, loadFromLedger, refreshExtensionStatus } = useInvestmentOS();

const healthTag = computed<"success" | "warning" | "danger" | "info">(() => {
  switch (state.health?.level) {
    case "normal":
      return "success";
    case "needs_attention":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "info";
  }
});

const healthText = computed(() => {
  if (!state.loaded) return "尚未读取账本";
  return state.health?.summary ?? "未知状态";
});

onMounted(async () => {
  await loadFromLedger();
  await refreshExtensionStatus();
});
</script>

<style scoped>
.os-layout {
  padding: 8px 0 32px;
}
.os-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.os-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.os-name {
  font-weight: 600;
}
.os-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.os-alert {
  margin: 8px 0;
}
.os-menu {
  border-bottom: 1px solid var(--el-border-color);
}
.os-body {
  padding-top: 16px;
}
</style>
