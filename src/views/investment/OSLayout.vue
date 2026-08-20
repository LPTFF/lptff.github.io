<template>
  <div class="os-layout">
    <div class="os-header">
      <div class="os-title">
        <span class="os-name">基金复盘助手</span>
        <el-tag :type="statusBar.type" effect="plain" size="small">{{ statusBar.text }}</el-tag>
      </div>
    </div>

    <div v-if="needReviewLink" class="review-entry-bar">
      <span>{{ statusBar.text }}。复盘可展开查看具体偏离、证据与下一步。</span>
      <el-button size="small" type="primary" @click="goToReview">去复盘 →</el-button>
    </div>

    <InvestmentSyncStatus />

    <el-alert v-if="state.lastFailures.length" type="warning" :title="`上次同步部分失败：${state.lastFailures.join('；')}`"
      show-icon :closable="false" class="os-alert" />

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
import { useInvestmentReview } from "../../investment/composables/use-investment-review";
import { useInvestmentSimulator } from "../../investment/composables/use-investment-simulator";
import { buildAllocationDrift } from "../../investment/composables/selectors";
import InvestmentSyncStatus from "./components/InvestmentSyncStatus.vue";

const route = useRoute();
const router = useRouter();
const { state, loadFromLedger, refreshExtensionStatus, clearImportedFacts, clearEverything, evaluateAndPersistActions } = useInvestmentOS();
const simulator = useInvestmentSimulator();
const review = useInvestmentReview();

type StatusBarType = "success" | "warning" | "danger" | "info";

// 克制系统状态条（Layer 3 Monitor 前置）：
// 优先消费复盘管理状态（今日无需操作 / N 项需复盘 / 等待证据 / 准备中）；
// 复盘未加载时退化为数据健康 + 目标配置偏离计数，不制造无依据的"系统正常"。
const statusBar = computed<{ text: string; type: StatusBarType }>(() => {
  if (review.state.loaded) {
    const m = review.conclusions.value.management;
    switch (m.state) {
      case "complete":
        return { text: "今日无需操作", type: "success" };
      case "needs_action":
        return { text: m.title, type: "warning" };
      case "waiting":
        return { text: m.title, type: "info" };
      default:
        return { text: m.title, type: "info" };
    }
  }
  if (!state.loaded) return { text: "尚未读取账本", type: "info" };
  const driftBreaches = state.portfolio
    ? buildAllocationDrift(state.activeVersions, state.strategyRuleVersions, state.portfolio, state.assets)
      .filter((d) => d.direction !== "within").length
    : 0;
  if (driftBreaches > 0) return { text: `${driftBreaches} 项目标配置偏离待复盘`, type: "warning" };
  switch (state.health?.level) {
    case "normal":
      return { text: "今日无需操作", type: "success" };
    case "needs_attention":
      return { text: state.health.summary, type: "warning" };
    case "blocked":
      return { text: state.health.summary, type: "danger" };
    default:
      return { text: state.health?.summary ?? "未知状态", type: "info" };
  }
});

const needReviewLink = computed(() => state.loaded && statusBar.value.type === "warning");

onMounted(async () => {
  await loadFromLedger();
  // 旧内置脱敏快照只采到交易 1/73 页。它不是用户真实采集；精确命中该批次时清除来源事实，
  // 保留用户规则，避免刷新后继续把审查样本误当作当前数据。
  const bundledPartialCapture = state.lastImport?.capturedAt === "2026-08-16T04:15:09.663Z"
    && state.coverage.some((coverage) =>
      coverage.dataset === "transactions"
      && coverage.completeness === "partial"
      && coverage.warningCodes.includes("eastmoney:transactions-partial"),
    );
  if (bundledPartialCapture) await clearImportedFacts();

  // source=sim：真实持仓演练续演；旧虚构残留（simulator 拒绝恢复 initialized=false）则清除。
  if (state.account?.source === "sim") {
    await simulator.init();
    if (!simulator.state.initialized) {
      await clearEverything();
    }
  }
  // 自动行动是可重新计算的派生数据。进入页面即与当前事实对账，清除旧版本留下的误报。
  if (state.portfolio) await evaluateAndPersistActions();
  await refreshExtensionStatus();
  // 触发复盘 Core，供克制状态条消费管理状态；无 scope 时静默退化为健康/偏离视角。
  if (!review.state.loaded && !review.state.running) {
    await review.loadReviewFromLedger(new Date().toISOString().slice(0, 10));
  }
});

const fromReview = computed(() => route.query.from === "review");
function goBackToReview(): void {
  router.push("/investment/review");
}
function goToReview(): void {
  router.push({ path: "/investment/review", query: { from: "portfolio" } });
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

.review-entry-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 8px 0;
  padding: 8px 12px;
  background: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.os-menu {
  border-bottom: 1px solid var(--el-border-color);
}

.os-body {
  padding-top: 16px;
  padding-right: 20px;
}
</style>
