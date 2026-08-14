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

    <div v-if="fromReview" class="review-back-bar">
      <span>你从复盘页跳来处理这条问题，处理完点右侧返回继续复盘。</span>
      <el-button size="small" type="primary" @click="goBackToReview">← 返回复盘</el-button>
    </div>

    <el-menu mode="horizontal" router :default-active="route.path" class="os-menu">
      <el-menu-item index="/investment">控制台</el-menu-item>
      <el-menu-item index="/investment/review">复盘</el-menu-item>
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
import { RouterView, useRoute, useRouter } from "vue-router";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useInvestmentSimulator } from "../../investment/composables/use-investment-simulator";
import InvestmentSyncStatus from "./components/InvestmentSyncStatus.vue";

const route = useRoute();
const router = useRouter();
const { state, syncFromExtension, loadFromLedger, refreshExtensionStatus } = useInvestmentOS();
const simulator = useInvestmentSimulator();

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
  // 只在 Ledger 真正为空时创建模拟数据；已有 sim 数据则恢复内存状态，绝不覆盖用户规则或事实。
  const ledgerIsEmpty = !state.account
    && !state.activeScope
    && !state.transactions.length
    && !state.assets.length;
  if (state.account?.source === "sim" || (ledgerIsEmpty && !state.demoMode)) {
    await simulator.init();
  }
  await refreshExtensionStatus();
});

const fromReview = computed(() => route.query.from === "review");
function goBackToReview(): void {
  router.push("/investment/review");
}
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
.review-back-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 8px 0;
  padding: 8px 12px;
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.os-menu {
  border-bottom: 1px solid var(--el-border-color);
}
.os-body {
  padding-top: 16px;
}
</style>
