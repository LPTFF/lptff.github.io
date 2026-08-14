<template>
  <div class="review-view">
    <el-card v-if="isSimulator" shadow="never" class="sim-bar">
      <div class="sim-head">
        <div class="sim-meta">
          <strong>A 股牛熊周期模拟器</strong>
          <el-tag :type="phaseTag" effect="dark" size="small">{{ simPhaseLabel }}</el-tag>
          <span class="sim-round">第 {{ sim.state.round }} / 23 期 · {{ sim.state.asOf }}</span>
        </div>
        <div class="sim-actions">
          <el-button size="small" :disabled="simIsLastRound || sim.state.running" :loading="sim.state.running" type="primary" @click="sim.advance">下一轮 →</el-button>
          <el-button size="small" @click="sim.reset">重置</el-button>
        </div>
        <div class="sim-toggles">
          <el-switch v-model="sim.state.toggles.regularInvest" inline-prompt active-text="规律定投" inactive-text="规律定投" />
          <el-switch v-model="sim.state.toggles.chaseTrend" inline-prompt active-text="追涨杀跌" inactive-text="追涨杀跌" />
          <el-switch v-model="sim.state.toggles.heavyPosition" inline-prompt active-text="重仓猛干" inactive-text="重仓猛干" />
          <el-switch v-model="sim.state.toggles.profitAdd" inline-prompt active-text="浮盈加仓" inactive-text="浮盈加仓" />
        </div>
      </div>
      <div v-if="sim.state.behaviorLog.length" class="sim-log">
        <span class="sim-log-title">本期发生了：</span>
        <el-tag v-for="(log, i) in sim.state.behaviorLog" :key="i" size="small" effect="plain" class="sim-log-tag">
          【{{ log.behavior }}】{{ log.text }}
        </el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="scope-banner">
      <div class="scope-head">
        <span class="scope-label">正在管理的投资范围</span>
        <strong>{{ scopeLabel }}</strong>
        <el-tag effect="plain" size="small">基准币种 CNY</el-tag>
      </div>
      <p class="scope-note">
        这里只检查你声明的规则、事前计划、来源事实和后续复核是否闭环；不评价基金好坏，不根据盈亏倒推过程，也不会执行任何交易。
      </p>
      <div v-if="managementSummary" class="boundary-line">
        <span v-if="managementSummary.managementStartedAt">事实管理起点：{{ managementSummary.managementStartedAt.slice(0, 10) }}</span>
        <span>计划核对：{{ managementSummary.operationReviewEnabled ? `从 ${managementSummary.operationReviewFrom} 开始` : "尚未启用" }}</span>
        <span>历史基线：{{ managementSummary.historicalBaselineTransactions }} 笔操作不做计划合规判定</span>
      </div>
    </el-card>

    <el-card v-if="state.snapshot" shadow="never" class="management-card" :class="`management-${management.state}`">
      <div class="management-content">
        <div>
          <div class="management-kicker">基金管理状态</div>
          <h2>{{ management.title }}</h2>
          <p>{{ management.description }}</p>
          <p class="management-limitation">{{ management.limitation }}</p>
        </div>
        <el-button
          v-if="management.primaryActionLabel"
          type="primary"
          @click="runManagementAction"
        >
          {{ management.primaryActionLabel }} →
        </el-button>
      </div>
    </el-card>

    <el-alert v-if="state.error" type="error" :title="state.error" show-icon :closable="false" />
    <el-empty v-if="!state.snapshot && !state.running" description="尚未运行复盘，请导入事实或推进模拟器" />

    <template v-if="state.snapshot">
      <div class="review-summary">
        <el-tag type="danger" effect="plain">需要处理 {{ summary.breached }}</el-tag>
        <el-tag type="warning" effect="plain">等待证据或执行 {{ summary.unknown }}</el-tag>
        <el-tag type="success" effect="plain">已按计划管理 {{ summary.conforming }}</el-tag>
        <span class="summary-note">共检查 {{ summary.checked }} 项；未检查和历史基线不会被一个“正常”结论覆盖。</span>
      </div>

      <div class="review-columns">
        <el-card id="needs-action" shadow="never" class="review-col review-col-needy">
          <template #header><span class="col-title">需要你处理</span></template>
          <el-empty v-if="!conclusions.needsActionGroups.length" description="本期没有已确认的管理流程缺口" :image-size="40" />
          <section v-for="group in conclusions.needsActionGroups" :key="group.key" class="conclusion-group">
            <div class="group-title">
              <strong>{{ group.title }}</strong>
              <el-tag size="small" type="danger" effect="plain">{{ group.items.length }} 项</el-tag>
            </div>
            <ConclusionCard
              v-for="item in group.items"
              :key="item.judgmentId"
              :conclusion="item"
              needy
              :on-resolve="onResolve"
              :on-primary-action="runConclusionAction"
              :on-rerun="rerun"
            />
          </section>
        </el-card>

        <el-card shadow="never" class="review-col review-col-unknown">
          <template #header><span class="col-title">等待证据或执行</span></template>
          <el-empty v-if="!conclusions.undeterminedGroups.length" description="当前没有等待中的判断" :image-size="40" />
          <section v-for="group in conclusions.undeterminedGroups" :key="group.key" class="conclusion-group">
            <div class="group-title">
              <strong>{{ group.title }}</strong>
              <el-tag size="small" type="warning" effect="plain">{{ group.items.length }} 项</el-tag>
            </div>
            <ConclusionCard
              v-for="item in group.items"
              :key="item.judgmentId"
              :conclusion="item"
              :on-resolve="onResolve"
              :on-primary-action="runConclusionAction"
              :on-rerun="rerun"
            />
          </section>
        </el-card>

        <el-card shadow="never" class="review-col review-col-ok">
          <template #header><span class="col-title">已按计划管理</span></template>
          <el-empty v-if="!conclusions.conformingGroups.length" description="尚无证据充分且完成核对的判断" :image-size="40" />
          <section v-for="group in conclusions.conformingGroups" :key="group.key" class="conclusion-group">
            <div class="group-title">
              <strong>{{ group.title }}</strong>
              <el-tag size="small" type="success" effect="plain">{{ group.items.length }} 项</el-tag>
            </div>
            <ConclusionCard v-for="item in group.items" :key="item.judgmentId" :conclusion="item" />
          </section>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useInvestmentReview } from "../../investment/composables/use-investment-review";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useInvestmentSimulator } from "../../investment/composables/use-investment-simulator";
import { resolveActiveStrategyRuleVersion } from "../../investment/engines/review/review-orchestrator";
import type { ReviewConclusionView } from "../../investment/composables/selectors";
import ConclusionCard from "./components/review/ConclusionCard.vue";

const router = useRouter();
const { state, conclusions, loadReviewFromLedger, resolveReviewAction } = useInvestmentReview();
const osState = useInvestmentOS().state;
const sim = useInvestmentSimulator();

async function rerun(): Promise<void> {
  await loadReviewFromLedger(reviewAsOf.value);
}

async function onResolve(actionId: string, kind: "acknowledged" | "waiting_execution" | "waiting_confirmation" | "waiting_recheck" | "resolved" | "dismissed_with_reason", note?: string): Promise<void> {
  await resolveReviewAction(actionId, kind, note);
}

function runManagementAction(): void {
  switch (management.value.primaryAction) {
    case "create_rule":
      router.push({ path: "/investment/policies", query: { from: "review", create: "rule" } });
      break;
    case "create_plan":
      router.push({ path: "/investment/actions", query: { from: "review", tab: "plans", create: "plan" } });
      break;
    case "handle_review":
      document.getElementById("needs-action")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "sync_data":
      router.push({ path: "/investment/data", query: { from: "review" } });
      break;
  }
}

function runConclusionAction(conclusion: ReviewConclusionView): void {
  switch (conclusion.primaryAction) {
    case "link_plan":
      router.push({
        path: "/investment/actions",
        query: { from: "review", tab: "plans", transactionId: conclusion.transactionId },
      });
      break;
    case "sync_data":
      router.push({ path: "/investment/data", query: { from: "review" } });
      break;
    case "manage_rule":
      router.push({ path: "/investment/policies", query: { from: "review" } });
      break;
    case "create_reduction_plan": {
      const activeRuleVersion = osState.activeScope
        ? resolveActiveStrategyRuleVersion(
            osState.strategyRuleVersions,
            osState.activeScope.scopeId,
            reviewAsOf.value,
          )
        : undefined;
      const hasReductionTarget = activeRuleVersion?.rules.some(
        (rule) => rule.kind === "reduction_target" && rule.assetId === conclusion.assetId,
      );
      router.push(hasReductionTarget
        ? {
            path: "/investment/actions",
            query: {
              from: "review",
              tab: "reductions",
              create: "reduction",
              assetId: conclusion.assetId,
              judgmentId: conclusion.judgmentId,
            },
          }
        : {
            path: "/investment/policies",
            query: {
              from: "review",
              create: "rule",
              kind: "reduction_target",
              assetId: conclusion.assetId,
            },
          });
      break;
    }
    case "track_portfolio":
      router.push({ path: "/investment/portfolio", query: { from: "review" } });
      break;
  }
}

const summary = computed(() => conclusions.value.summary);
const management = computed(() => conclusions.value.management);
const managementSummary = computed(() => state.snapshot?.managementSummary);
const isSimulator = computed(() => osState.account?.source === "sim");
const hasRealAccount = computed(() => Boolean(
  osState.account
  && osState.account.source !== "sim"
  && !osState.account.source.startsWith("mock"),
));
const reviewAsOf = computed(() => isSimulator.value
  ? sim.state.asOf
  : osState.account?.capturedAt.slice(0, 10) ?? state.snapshot?.asOf ?? new Date().toISOString().slice(0, 10));
const scopeLabel = computed(() => {
  if (isSimulator.value) return "牛熊周期模拟组合";
  if (hasRealAccount.value && osState.activeScope?.scopeType === "ACCOUNT") return "真实账户范围";
  return state.snapshot ? "声明组合" : "（未运行）";
});
const simPhaseLabel = computed(() => sim.phaseLabel.value);
const simIsLastRound = computed(() => sim.isLastRound.value);

const phaseTag = computed<"success" | "warning" | "danger" | "info">(() => {
  switch (sim.state.phase) {
    case "bull": return "success";
    case "top": return "warning";
    case "bear": return "danger";
    case "bottom": return "info";
    case "rebound": return "success";
    default: return "info";
  }
});

watch(
  () => osState.account,
  async (account) => {
    if (!account) return;
    await loadReviewFromLedger(reviewAsOf.value);
  },
  { immediate: true },
);

watch(
  () => [
    osState.strategyRuleVersions.length,
    osState.decisionRecords.length,
    osState.executionLinks.length,
    osState.reductionPlans.length,
  ],
  async () => {
    if (!osState.account) return;
    await loadReviewFromLedger(reviewAsOf.value);
  },
);
</script>

<style scoped>
.review-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sim-bar {
  border-left: 3px solid var(--el-color-primary);
}
.sim-head,
.sim-meta,
.sim-actions,
.sim-toggles,
.sim-log,
.scope-head,
.boundary-line,
.review-summary,
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sim-head {
  gap: 16px;
}
.sim-round,
.sim-log-title,
.scope-note,
.summary-note,
.management-kicker,
.management-limitation {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.sim-log {
  margin-top: 10px;
}
.scope-label {
  margin-right: 6px;
  color: var(--el-text-color-secondary);
}
.scope-note {
  margin: 8px 0 0;
}
.boundary-line {
  margin-top: 8px;
  font-size: 12px;
}
.boundary-line span {
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}
.management-card {
  border-left: 4px solid var(--el-color-primary);
}
.management-needs_action {
  border-left-color: var(--el-color-danger);
}
.management-waiting {
  border-left-color: var(--el-color-warning);
}
.management-complete {
  border-left-color: var(--el-color-success);
}
.management-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.management-content h2 {
  margin: 3px 0 6px;
  font-size: 20px;
}
.management-content p {
  margin: 3px 0;
}
.review-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}
.review-col :deep(.el-card__body) {
  padding: 10px;
}
.col-title,
.group-title strong {
  font-weight: 600;
}
.group-title {
  justify-content: space-between;
  margin: 4px 2px 8px;
  font-size: 13px;
}
.conclusion-group + .conclusion-group {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.review-col-needy {
  border-top: 3px solid var(--el-color-danger);
}
.review-col-unknown {
  border-top: 3px solid var(--el-color-warning);
}
.review-col-ok {
  border-top: 3px solid var(--el-color-success);
}
@media (max-width: 960px) {
  .review-columns {
    grid-template-columns: 1fr;
  }
  .management-content {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
