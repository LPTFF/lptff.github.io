<template>
  <div class="actions-view">
    <div class="actions-head">
      <div>
        <h3>计划与处理</h3>
        <p>先记录本地事前计划，再由你显式关联来源执行。这里不会提交、撤销或修改任何真实交易。</p>
      </div>
      <div class="head-actions">
        <el-button size="small" :disabled="!state.activeScope" @click="openReductionDialog">制定减仓计划</el-button>
        <el-button type="primary" size="small" :disabled="!state.activeScope" @click="openPlanDialog">记录事前计划</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="事前计划" name="plans">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="事前计划必须在操作发生前保存；来源只有日期时，同日操作无法证明先后，因此不会允许关联。"
          class="section-alert"
        />

        <el-card v-if="unlinkedTransactions.length" shadow="never" class="section-card">
          <template #header>
            <div class="section-head">
              <strong>等待你声明关联的执行</strong>
              <el-tag type="warning" effect="plain" size="small">{{ unlinkedTransactions.length }} 笔</el-tag>
            </div>
          </template>
          <div v-for="transaction in unlinkedTransactions" :key="transaction.id" class="link-row">
            <div class="link-fact">
              <strong>{{ assetName(transaction.assetId) }}</strong>
              <span>{{ transaction.occurredAt.slice(0, 10) }} · {{ directionLabel(transaction.type) }} · {{ executionLabel(transaction.status) }}</span>
            </div>
            <template v-if="candidatePlans(transaction).length">
              <el-select v-model="linkSelections[transaction.id]" size="small" placeholder="选择真实对应的事前计划" class="plan-select">
                <el-option
                  v-for="decision in candidatePlans(transaction)"
                  :key="decision.id"
                  :label="planOptionLabel(decision)"
                  :value="decision.id"
                />
              </el-select>
              <el-button size="small" type="primary" plain :disabled="!linkSelections[transaction.id]" @click="linkPlan(transaction.id)">确认关联</el-button>
            </template>
            <span v-else class="no-candidate">没有交易前已保存的合法候选计划；不能事后补写。</span>
          </div>
        </el-card>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-head">
              <strong>不可变事前计划</strong>
              <el-tag effect="plain" size="small">{{ state.decisionRecords.length }} 条</el-tag>
            </div>
          </template>
          <el-empty v-if="!state.decisionRecords.length" description="尚无事前计划。记录第一条后，计划核对会从次日开始。" :image-size="56" />
          <div v-else class="plan-list">
            <div v-for="decision in sortedDecisions" :key="decision.id" class="plan-row">
              <div class="plan-main">
                <strong>{{ assetName(decision.assetId) }} · {{ directionLabel(decision.direction) }}</strong>
                <span>{{ planValueLabel(decision) }}</span>
              </div>
              <div class="plan-meta">
                <span>记录于 {{ formatDateTime(decision.decidedAt) }}</span>
                <span v-if="decision.allowedWindow">执行窗口 {{ decision.allowedWindow.start }} ~ {{ decision.allowedWindow.end }}</span>
                <span v-if="decision.rationale">依据：{{ decision.rationale }}</span>
                <span v-if="decision.failsIf">失效条件：{{ decision.failsIf }}</span>
              </div>
              <el-tag size="small" type="success" effect="plain">事前记录 · 不可回填</el-tag>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="减仓计划" name="reductions">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="计划量只按当前合格分母和你事前声明的减仓目标计算；保存到本地，不会提交赎回。"
          class="section-alert"
        />
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-head">
              <strong>减仓与恢复跟踪</strong>
              <el-tag effect="plain" size="small">{{ state.reductionPlans.length }} 条</el-tag>
            </div>
          </template>
          <el-empty v-if="!state.reductionPlans.length" description="尚无减仓计划。请先在规则页声明目标区间，再从复盘偏离创建计划。" :image-size="56" />
          <div v-else class="plan-list">
            <div v-for="plan in sortedReductionPlans" :key="plan.id" class="plan-row">
              <div class="plan-main">
                <strong>{{ assetName(plan.assetId) }}</strong>
                <span>计划减仓 {{ reductionValueLabel(plan.planned, plan.unit) }}</span>
              </div>
              <div class="plan-meta">
                <span>目标区间 {{ pctLabel(plan.targetBand.minPct) }} ~ {{ pctLabel(plan.targetBand.maxPct) }}</span>
                <span>创建于 {{ formatDateTime(plan.createdAt) }}</span>
                <span>触发依据 {{ plan.triggerJudgmentId }}</span>
              </div>
              <el-tag size="small" type="warning" effect="plain">等待来源执行与复核</el-tag>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="`其他待处理 ${state.pendingActions}`" name="legacy">
        <el-empty v-if="!state.actions.length" description="当前没有其他需要处理的事项。" />
        <div v-else class="action-list">
          <el-card v-for="action in state.actions" :key="action.id" shadow="never" class="action-card">
            <template #header>
              <div class="action-item-head">
                <el-tag :type="actionTag(action.type)" size="small" effect="plain">{{ actionLabel(action.type) }}</el-tag>
                <span class="action-title">{{ action.title || actionLabel(action.type) }}</span>
                <el-tag :type="statusTag(action.status)" size="small">{{ statusLabel(action.status) }}</el-tag>
              </div>
            </template>
            <p class="action-detail">{{ action.detail || "—" }}</p>
            <p class="action-meta">创建于 {{ action.createdAt }}</p>
            <div v-if="action.status === 'open'" class="action-actions">
              <template v-if="action.type === 'POLICY_TRIGGER'">
                <el-button size="small" @click="resolve(action.id, 'pause-new')">暂停新增</el-button>
                <el-button size="small" type="primary" plain @click="goAdjustRules">去调整规则</el-button>
                <el-button size="small" @click="resolve(action.id, 'ignore')">暂时忽略</el-button>
              </template>
              <template v-else-if="action.type === 'ABNORMAL_TRANSACTION' || action.type === 'UNCLASSIFIED_TRANSACTION'">
                <span class="action-hint">记录本次复盘归因：</span>
                <el-button size="small" @click="resolveWithReason(action.id, '临时机会')">临时机会</el-button>
                <el-button size="small" @click="resolveWithReason(action.id, '操作错误')">操作错误</el-button>
                <el-button size="small" @click="resolveWithReason(action.id, '其他')">其他</el-button>
              </template>
              <el-button v-else size="small" @click="resolve(action.id, 'ignore')">标记已处理</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="planVisible" title="记录事前计划（仅本地）" width="520px">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="保存后核心字段不可改写；这不是下单，也不会连接任何交易接口。"
        class="section-alert"
      />
      <el-form label-width="96px" size="small">
        <el-form-item label="基金" required>
          <el-select v-model="planForm.assetId" placeholder="选择计划基金" style="width: 100%">
            <el-option v-for="asset in scopeAssets" :key="asset.assetId" :label="`${asset.name || asset.assetId}（${asset.assetId}）`" :value="asset.assetId" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向" required>
          <el-radio-group v-model="planForm.direction">
            <el-radio-button label="BUY">买入</el-radio-button>
            <el-radio-button label="SELL">卖出</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计划口径" required>
          <el-select v-model="planForm.unit" style="width: 140px">
            <el-option label="金额（CNY）" value="CNY" />
            <el-option label="份额" value="shares" />
            <el-option label="仓位（%）" value="pct" />
          </el-select>
          <el-input-number v-model="planForm.value" :min="0" :precision="2" placeholder="由你填写" />
        </el-form-item>
        <el-form-item label="执行窗口" required>
          <el-date-picker
            v-model="planForm.window"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="判断依据">
          <el-input v-model="planForm.rationale" type="textarea" :rows="2" placeholder="为什么准备这样做（可选）" />
        </el-form-item>
        <el-form-item label="失效条件">
          <el-input v-model="planForm.failsIf" type="textarea" :rows="2" placeholder="出现什么事实时不再执行（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPlan" @click="savePlan">保存不可变计划</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reductionVisible" title="制定减仓计划（仅本地）" width="520px">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="系统只计算恢复到你目标上限所需的当前计划量；不会预测卖点或提交交易。"
        class="section-alert"
      />
      <el-form label-width="96px" size="small">
        <el-form-item label="基金" required>
          <el-select v-model="reductionForm.assetId" placeholder="选择有减仓目标的基金" style="width: 100%">
            <el-option v-for="asset in reductionAssets" :key="asset.assetId" :label="`${asset.name || asset.assetId}（${asset.assetId}）`" :value="asset.assetId" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划口径" required>
          <el-radio-group v-model="reductionForm.unit">
            <el-radio-button label="CNY">金额（CNY）</el-radio-button>
            <el-radio-button label="shares">份额</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计算说明">
          <span class="calculation-note">保存时使用最新组合市值、总资产分母与当前生效的减仓目标；若证据不足会拒绝创建。</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reductionVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingReduction" @click="saveReduction">计算并保存计划</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import type {
  ActionStatus,
  ActionType,
  DecisionRecord,
  PlanDirection,
  PlanValueUnit,
  Transaction,
} from "../../investment/domain";

const route = useRoute();
const router = useRouter();
const {
  state,
  processAction,
  recordDecisionPlan,
  createReductionPlan,
  linkDecisionToTransaction,
} = useInvestmentOS();

const activeTab = ref("plans");
const planVisible = ref(false);
const savingPlan = ref(false);
const reductionVisible = ref(false);
const savingReduction = ref(false);
const linkSelections = reactive<Record<string, string>>({});
const planForm = reactive({
  assetId: "",
  direction: "BUY" as PlanDirection,
  unit: "CNY" as PlanValueUnit,
  value: undefined as number | undefined,
  window: [] as string[],
  rationale: "",
  failsIf: "",
});
const reductionForm = reactive({
  assetId: "",
  unit: "CNY" as "CNY" | "shares",
  triggerJudgmentId: "",
});

const scopeAssets = computed(() => {
  const ids = state.activeScope?.includedAssetIds ?? [];
  return state.assets.filter((asset) => ids.includes(asset.assetId));
});
const reductionAssets = computed(() => {
  const latest = [...state.strategyRuleVersions].sort((a, b) => a.version - b.version).at(-1);
  const ids = new Set(
    latest?.rules
      .filter((rule) => rule.kind === "reduction_target")
      .map((rule) => rule.assetId) ?? [],
  );
  return scopeAssets.value.filter((asset) => ids.has(asset.assetId));
});
const sortedReductionPlans = computed(() => [...state.reductionPlans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
const sortedDecisions = computed(() => [...state.decisionRecords].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)));
const unlinkedTransactions = computed(() => {
  const from = state.activeScope?.operationReviewFrom;
  if (!from) return [];
  const linked = new Set(
    state.executionLinks
      .filter((link) => link.linkMethod !== "unlinked" && link.transactionId)
      .map((link) => link.transactionId),
  );
  const requestedId = typeof route.query.transactionId === "string" ? route.query.transactionId : undefined;
  return state.transactions
    .filter((transaction) => transaction.occurredAt.slice(0, 10) >= from && !linked.has(transaction.id))
    .filter((transaction) => !requestedId || transaction.id === requestedId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
});

function openPlanDialog(): void {
  planForm.assetId = scopeAssets.value[0]?.assetId ?? "";
  planForm.direction = "BUY";
  planForm.unit = "CNY";
  planForm.value = undefined;
  planForm.window = [];
  planForm.rationale = "";
  planForm.failsIf = "";
  planVisible.value = true;
}

function openReductionDialog(): void {
  const requestedAsset = typeof route.query.assetId === "string" ? route.query.assetId : undefined;
  reductionForm.assetId = requestedAsset && reductionAssets.value.some((asset) => asset.assetId === requestedAsset)
    ? requestedAsset
    : reductionAssets.value[0]?.assetId ?? "";
  reductionForm.unit = "CNY";
  reductionForm.triggerJudgmentId = typeof route.query.judgmentId === "string"
    ? route.query.judgmentId
    : `position:${reductionForm.assetId}`;
  reductionVisible.value = true;
}

watch(
  () => [
    route.query.tab,
    route.query.create,
    route.query.assetId,
    route.query.judgmentId,
    reductionAssets.value.map((asset) => asset.assetId).join("|"),
  ],
  ([tab, create]) => {
    if (tab === "plans" || tab === "reductions" || tab === "legacy") activeTab.value = tab;
    if (create === "plan") openPlanDialog();
    if (create === "reduction") openReductionDialog();
  },
  { immediate: true },
);

async function savePlan(): Promise<void> {
  if (!planForm.assetId || !planForm.value || planForm.value <= 0 || planForm.window.length !== 2) {
    ElMessage.warning("请完整填写基金、计划量和执行窗口");
    return;
  }
  savingPlan.value = true;
  try {
    await recordDecisionPlan({
      assetId: planForm.assetId,
      direction: planForm.direction,
      value: planForm.unit === "pct" ? planForm.value / 100 : planForm.value,
      unit: planForm.unit,
      window: { start: planForm.window[0], end: planForm.window[1] },
      rationale: planForm.rationale,
      failsIf: planForm.failsIf,
    });
    planVisible.value = false;
    ElMessage.success("事前计划已保存；计划核对从来源日期精度允许的下一日开始");
  } catch (error) {
    ElMessage.error(`保存失败：${(error as Error).message}`);
  } finally {
    savingPlan.value = false;
  }
}

async function saveReduction(): Promise<void> {
  if (!reductionForm.assetId) {
    ElMessage.warning("请先在规则页为基金声明减仓目标区间");
    return;
  }
  savingReduction.value = true;
  try {
    const plan = await createReductionPlan({
      assetId: reductionForm.assetId,
      triggerJudgmentId: reductionForm.triggerJudgmentId || `position:${reductionForm.assetId}`,
      unit: reductionForm.unit,
    });
    reductionVisible.value = false;
    activeTab.value = "reductions";
    ElMessage.success(`已保存减仓计划：${reductionValueLabel(plan.planned, plan.unit)}；未提交任何交易`);
  } catch (error) {
    ElMessage.error(`创建失败：${(error as Error).message}`);
  } finally {
    savingReduction.value = false;
  }
}

function candidatePlans(transaction: Transaction): DecisionRecord[] {
  const direction = transaction.type === "BUY" || transaction.type === "SELL" ? transaction.type : undefined;
  return state.decisionRecords.filter((decision) =>
    decision.status === "recorded"
    && decision.decidedAt.slice(0, 10) < transaction.occurredAt.slice(0, 10)
    && (!decision.assetId || decision.assetId === transaction.assetId)
    && (!direction || decision.direction === direction),
  );
}

async function linkPlan(transactionId: string): Promise<void> {
  const decisionId = linkSelections[transactionId];
  if (!decisionId) return;
  try {
    await linkDecisionToTransaction(transactionId, decisionId);
    delete linkSelections[transactionId];
    ElMessage.success("已记录显式关联；返回复盘后会按计划与执行重新判断");
  } catch (error) {
    ElMessage.error(`关联失败：${(error as Error).message}`);
  }
}

function assetName(assetId?: string): string {
  if (!assetId) return "整个投资范围";
  const asset = state.assets.find((item) => item.assetId === assetId);
  return asset?.name ? `${asset.name}（${assetId}）` : `基金 ${assetId}`;
}

function directionLabel(direction: string): string {
  return direction === "BUY" ? "买入" : direction === "SELL" ? "卖出" : direction;
}

function executionLabel(status: string): string {
  return {
    requested: "已申请未确认",
    partially_confirmed: "部分确认",
    confirmed: "已确认",
    failed: "失败",
    cancelled: "已撤销",
    unknown: "状态待确认",
  }[status] ?? status;
}

function planOptionLabel(decision: DecisionRecord): string {
  return `${decision.allowedWindow?.start ?? decision.decidedAt.slice(0, 10)} · ${directionLabel(decision.direction)} · ${planValueLabel(decision)}`;
}

function planValueLabel(decision: DecisionRecord): string {
  if (decision.plannedAmount !== undefined) return `计划金额 ${decision.plannedAmount}`;
  if (decision.plannedShares !== undefined) return `计划份额 ${decision.plannedShares}`;
  if (decision.plannedPct !== undefined) return `计划仓位 ${(decision.plannedPct * 100).toFixed(2)}%`;
  return "未声明计划量";
}

function reductionValueLabel(value: number, unit: PlanValueUnit): string {
  if (unit === "CNY") return `${value.toFixed(2)} 元`;
  if (unit === "shares") return `${value.toFixed(4)} 份`;
  return `${(value * 100).toFixed(2)}%`;
}

function pctLabel(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

async function resolve(id: string, resolution: "pause-new" | "adjust-policy" | "ignore"): Promise<void> {
  await processAction(id, resolution);
  ElMessage.success(resolution === "ignore" ? "已关闭该条" : resolution === "pause-new" ? "已标记暂停新增" : "已处理");
}

async function resolveWithReason(id: string, reason: string): Promise<void> {
  await processAction(id, "adjust-policy");
  ElMessage.success(`已记录为「${reason}」`);
}

function goAdjustRules(): void {
  router.push({ path: "/investment/policies", query: { from: "review" } });
}

const ACTION_TAG: Record<ActionType, "warning" | "danger" | "info"> = {
  POLICY_TRIGGER: "warning",
  RISK_REVIEW: "warning",
  UNCLASSIFIED_TRANSACTION: "info",
  ABNORMAL_TRANSACTION: "danger",
  DATA_REQUIRED: "info",
};
const STATUS_TAG: Record<ActionStatus, "warning" | "success" | "info"> = { open: "warning", resolved: "success", ignored: "info" };

function actionLabel(type: ActionType): string {
  return {
    POLICY_TRIGGER: "风险规则被突破",
    RISK_REVIEW: "需要风险复核",
    UNCLASSIFIED_TRANSACTION: "暂时无法归类这笔交易",
    ABNORMAL_TRANSACTION: "金额明显高于历史",
    DATA_REQUIRED: "数据不足，无法判断",
  }[type];
}
function actionTag(type: ActionType): "warning" | "danger" | "info" {
  return ACTION_TAG[type];
}
function statusLabel(status: ActionStatus): string {
  return { open: "待处理", resolved: "已处理", ignored: "已关闭" }[status];
}
function statusTag(status: ActionStatus): "warning" | "success" | "info" {
  return STATUS_TAG[status];
}
</script>

<style scoped>
.actions-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.actions-head,
.head-actions,
.section-head,
.action-item-head,
.plan-main,
.action-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.actions-head {
  justify-content: space-between;
}
.actions-head h3,
.actions-head p {
  margin: 0;
}
.actions-head p,
.action-meta,
.no-candidate,
.calculation-note,
.plan-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.section-alert {
  margin-bottom: 12px;
}
.section-card + .section-card {
  margin-top: 12px;
}
.section-head {
  justify-content: space-between;
}
.link-row,
.plan-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.link-row:last-child,
.plan-row:last-child {
  border-bottom: 0;
}
.link-fact,
.plan-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.link-fact {
  min-width: 220px;
}
.link-fact span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.plan-select {
  min-width: 260px;
  flex: 1;
}
.no-candidate {
  flex: 1;
}
.plan-list,
.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.plan-row {
  align-items: flex-start;
}
.plan-main {
  min-width: 220px;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}
.plan-meta {
  flex: 1;
}
.action-title {
  font-weight: 500;
  flex: 1;
}
.action-detail,
.action-meta {
  margin: 4px 0;
}
.action-actions {
  margin-top: 12px;
}
.action-hint {
  font-size: 13px;
}
@media (max-width: 760px) {
  .link-row,
  .plan-row {
    align-items: stretch;
    flex-direction: column;
  }
  .plan-select {
    width: 100%;
  }
}
</style>
