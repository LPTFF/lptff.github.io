<template>
  <div class="actions-view">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="深度分析外包给通用大模型"
      description="把账户状态、历史、投资逻辑、当前异常和规则整理成完整上下文，复制或一键跳转 ChatGPT 交由通用模型深度分析。本系统不调 AI、不计算指标、不替你判断，也不自动外传。"
      class="section-alert"
    />

    <el-empty v-if="!state.portfolio" description="尚无组合数据，请先同步或在采集页启动模拟" />

    <el-card v-else-if="todoCount" shadow="never" class="section todo-card">
      <template #header><span>待办汇总（来自复盘 / 纪律 / 采集 / 明细）· {{ todoCount }} 项</span></template>
      <el-alert type="info" :closable="false" show-icon class="todo-note"
        description="以下为各页需要你处理的事项，每条附去向按钮；处理完一条可回对应页复核。系统只汇总事实，不替你判断怎么处理。"
      />
      <div v-if="hasNoRules" class="todo-group">
        <span class="todo-source">纪律</span>
        <div class="todo-item">尚未声明投资纪律，机械检查无法运行。<el-button size="small" type="primary" @click="goPolicies">去纪律页声明</el-button></div>
      </div>
      <div v-if="coverageGaps.length" class="todo-group">
        <span class="todo-source">采集</span>
        <div v-for="g in coverageGaps" :key="g.dataset" class="todo-item">
          {{ DATASET_LABEL[g.dataset] ?? g.dataset }} 覆盖{{ COMPLETENESS_LABEL[g.completeness] ?? g.completeness }}，需补采集。
          <el-button size="small" @click="goData">去采集页补采集</el-button>
        </div>
      </div>
      <div v-if="breachedDrift.length" class="todo-group">
        <span class="todo-source">复盘 · 配置偏离</span>
        <div v-for="d in breachedDrift" :key="d.label" class="todo-item">
          {{ d.label }} 实际 {{ (d.actualPct * 100).toFixed(1) }}% {{ driftDirText(d) }}。
          <el-button size="small" @click="goReview">去复盘页认可 / 深度分析</el-button>
          <el-button size="small" @click="goPolicies">调整规则</el-button>
        </div>
      </div>
      <div v-if="openActions.length" class="todo-group">
        <span class="todo-source">明细 · 待处理事项</span>
        <div v-for="a in openActions" :key="a.id ?? a.type + (a.title ?? '')" class="todo-item">
          {{ a.title || a.type }}
          <el-button size="small" @click="goEvidence">去明细页看事实</el-button>
        </div>
      </div>
    </el-card>
    <el-alert v-else type="success" :closable="false" show-icon class="section-alert"
      title="暂无需要处理的事项" description="当前组合在声明的纪律范围内、无数据缺口与待处理事项。需要深度思考时，可在下方装配上下文交通用大模型。"
    />

    <el-card v-if="state.portfolio" shadow="never" class="section">
      <template #header>深度分析上下文</template>
      <p class="hint">点击生成一段可复制的上下文文本，包含八段：用户目标 / 当前投资组合 / 资产配置规则 / 本次异常 / 历史操作 / 原始投资逻辑 / 相关投资纪律 / 需要判断的问题，并附分析提示语。产品卖的是高质量上下文，不是自己的模型能力。</p>
      <el-button type="primary" @click="openContextDialog">生成深度分析上下文</el-button>
      <el-dialog v-model="contextCtx.visible" :title="contextCtx.label" width="720px">
        <el-input v-model="contextCtx.text" type="textarea" :rows="22" readonly class="focused-text" />
        <template #footer>
          <el-button @click="copyContext">复制</el-button>
          <el-button type="primary" @click="openChatGptContext">一键跳转 ChatGPT</el-button>
          <el-button @click="contextCtx.visible = false">关闭</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { buildAllocationDrift, type AllocationDrift } from "../../investment/composables/selectors";
import { useFocusedContext, buildContextInput } from "../../investment/composables/use-focused-context";

const router = useRouter();
const { state } = useInvestmentOS();
const allocationDrift = computed(() => buildAllocationDrift(state.activeVersions, state.strategyRuleVersions, state.portfolio, state.assets));
const { fc: contextCtx, openFull, copy: copyContext, openChatGpt: openChatGptContext } = useFocusedContext();

// 待办汇总：把复盘 / 纪律 / 采集 / 明细里需要处理的事项集中到待办页，统一处理、降低横跳成本。
const breachedDrift = computed(() => allocationDrift.value.filter((d) => d.direction !== "within"));
const openActions = computed(() => state.actions.filter((a) => a.status === "open"));
const coverageGaps = computed(() => state.coverage.filter((c) => c.completeness !== "complete"));
const hasNoRules = computed(() =>
  !state.strategyRuleVersions.some((v) => v.rules.length > 0) && !state.activeVersions.some((v) => v.rules.length > 0),
);
const todoCount = computed(() => (hasNoRules.value ? 1 : 0) + coverageGaps.value.length + breachedDrift.value.length + openActions.value.length);

const DATASET_LABEL: Record<string, string> = { account: "账户", holdings: "持仓", dailyPnl: "每日盈亏", transactions: "交易历史", fundDetail: "基金详情" };
const COMPLETENESS_LABEL: Record<string, string> = { complete: "完整", partial: "部分", unknown: "未知" };

function driftDirText(d: AllocationDrift): string { return d.direction === "over" ? "超上限" : "低下限"; }
function goReview(): void { router.push("/investment/review"); }
function goPolicies(): void { router.push("/investment/policies"); }
function goData(): void { router.push("/investment/data"); }
function goEvidence(): void { router.push("/investment/evidence"); }

function openContextDialog(): void {
  openFull(buildContextInput(state, allocationDrift.value));
}
</script>

<style scoped>
.actions-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-alert {
  margin-bottom: 4px;
}
.section {
  width: 100%;
}
.hint {
  margin: 0 0 14px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}
.focused-text :deep(textarea) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
}
.todo-card {
  border-left: 3px solid var(--el-color-warning);
}
.todo-note {
  margin-bottom: 10px;
}
.todo-group {
  margin-bottom: 10px;
}
.todo-source {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 8px;
  margin-top: 4px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>