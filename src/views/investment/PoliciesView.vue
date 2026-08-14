<template>
  <div class="policies-view">
    <div class="policies-head">
      <div class="policies-head-left">
        <h3>投资规则</h3>
        <span class="policies-head-hint">规则阈值完全由你声明；系统只做确定性检查，不生成默认买卖建议</span>
      </div>
      <el-button type="primary" size="small" :disabled="!state.activeScope" @click="openCreate">{{ state.strategyRuleVersions.length ? "新建规则" : "建立首版规则" }}</el-button>
    </div>

    <el-card v-if="editableStrategyRules.length" shadow="never" class="section strategy-rules">
      <template #header>
        <div class="detail-head">
          <span>当前规则（保存后追加新版本）</span>
          <el-button size="small" type="primary" @click="saveStrategyRules">保存为新版本</el-button>
        </div>
      </template>
      <p class="strategy-hint">这些规则用于复盘检查仓位、止盈、移动止损和减仓恢复。历史版本不会被覆盖；修改阈值后请说明原因，再保存为新版本。</p>
      <el-input v-model="changeReason" class="change-reason" placeholder="必填：本次规则变更原因" maxlength="120" show-word-limit />
      <div v-for="ver in editableStrategyRules" :key="ver.id" class="rule-version">
        <div v-for="(rule, rIdx) in ver.rules" :key="rIdx" class="rule-row" :class="{ 'is-breached': !!strategyBreachNote(rule) }">
          <div class="rule-text">
            <span class="rule-name">{{ strategyRuleLabel(rule) }}</span>
            <el-tag v-if="strategyBreachNote(rule)" type="danger" size="small" effect="plain">被突破</el-tag>
            <span v-if="strategyBreachNote(rule)" class="rule-breach">{{ strategyBreachNote(rule) }}</span>
          </div>
          <div class="rule-edit">
            <template v-if="rule.kind === 'position_band'">
              下限 <el-input-number :model-value="Math.round(rule.minPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.minPct = Number(v ?? 0) / 100)" />%
              上限 <el-input-number :model-value="Math.round(rule.maxPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.maxPct = Number(v ?? 0) / 100)" />%
            </template>
            <template v-else-if="rule.kind === 'trailing_stop'">
              回撤阈值 <el-input-number :model-value="Math.round(rule.drawdownPct * 100)" :min="1" :max="50" :step="1" size="small" @update:model-value="(v: number | undefined) => (rule.drawdownPct = Number(v ?? 0) / 100)" />%
              <span class="rule-hint">是否触发请看复盘页（需结合最新净值与历史高水位）</span>
            </template>
            <template v-else-if="rule.kind === 'reduction_target'">
              目标下限 <el-input-number :model-value="Math.round(rule.targetMinPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetMinPct = Number(v ?? 0) / 100)" />%
              目标上限 <el-input-number :model-value="Math.round(rule.targetMaxPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetMaxPct = Number(v ?? 0) / 100)" />%
            </template>
            <template v-else-if="rule.kind === 'pause_window'">
              {{ rule.window.start }} ~ {{ rule.window.end }}
            </template>
            <template v-else-if="rule.kind === 'take_profit'">
              目标收益率 <el-input-number :model-value="Math.round(rule.targetReturnPct * 100)" :min="1" :max="200" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetReturnPct = Number(v ?? 0) / 100)" />%
              <span class="rule-hint">累计收益率达此值触发复核（非自动赎回）</span>
            </template>
          </div>
        </div>
      </div>
    </el-card>
    <el-card v-else shadow="never" class="section strategy-rules-empty">
      <p class="strategy-hint"><strong>尚未声明复盘规则。</strong>真实账户可以直接建立首版规则，不需要启动模拟器。</p>
      <p class="strategy-hint">请从一只基金和一个你愿意事前遵守的阈值开始。系统不会替你填写“合理仓位”、止盈或止损值。</p>
      <el-button size="small" type="primary" :disabled="!state.activeScope" @click="openCreate">建立首版规则</el-button>
    </el-card>

    <el-card v-if="historicalStrategyRules.length" shadow="never" class="section strategy-history">
      <template #header>历史规则版本（只读）</template>
      <div v-for="ver in historicalStrategyRules" :key="ver.id" class="history-version">
        <strong>v{{ ver.version }} · {{ ver.effectiveFrom }}</strong>
        <span>{{ ver.changeReason || "未记录变更原因" }}</span>
        <div v-for="(rule, index) in ver.rules" :key="index" class="history-rule">
          {{ strategyRuleLabel(rule) }}
        </div>
      </div>
    </el-card>

    <!-- 新建规则对话框：阈值都由用户事前声明，与模拟器/复盘同构 -->
    <el-dialog v-model="createVisible" :title="state.strategyRuleVersions.length ? '新建规则' : '建立首版规则'" width="460px">
      <el-alert
        type="info"
        title="下面的阈值必须由你事前声明；留空时不能创建，系统不会代填。"
        :closable="false"
        show-icon
        class="create-rule-alert"
      />
      <el-form label-width="96px" size="small">
        <el-form-item label="基金" required>
          <el-select v-model="form.assetId" placeholder="选择一只基金" style="width: 100%">
            <el-option v-for="a in scopeAssets" :key="a.assetId" :label="`${a.name}（${a.assetId}）`" :value="a.assetId" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则类型" required>
          <el-radio-group v-model="form.kind">
            <el-radio-button label="position_band">仓位上限</el-radio-button>
            <el-radio-button label="trailing_stop">移动止损</el-radio-button>
            <el-radio-button label="take_profit">目标收益率止盈</el-radio-button>
            <el-radio-button label="reduction_target">减仓目标</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.kind === 'position_band'" label="仓位不超过" required>
          <el-input-number v-model="form.maxPct" :min="1" :max="100" :step="5" /> %
          <span class="rule-hint">占总资产比例</span>
        </el-form-item>
        <el-form-item v-else-if="form.kind === 'trailing_stop'" label="回撤阈值" required>
          <el-input-number v-model="form.drawdownPct" :min="1" :max="50" :step="1" /> %
          <span class="rule-hint">从历史最高净值回撤至此触发复核</span>
        </el-form-item>
        <template v-else-if="form.kind === 'reduction_target'">
          <el-form-item label="目标下限" required>
            <el-input-number v-model="form.targetMinPct" :min="0" :max="100" :step="5" /> %
          </el-form-item>
          <el-form-item label="目标上限" required>
            <el-input-number v-model="form.targetMaxPct" :min="1" :max="100" :step="5" /> %
            <span class="rule-hint">系统只跟踪恢复到你声明的区间，不预测卖点</span>
          </el-form-item>
        </template>
        <el-form-item v-else label="目标收益率" required>
          <el-input-number v-model="form.targetReturnPct" :min="1" :max="200" :step="5" /> %
          <span class="rule-hint">累计收益率达此值提示复核，不自动赎回</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useInvestmentReview } from "../../investment/composables/use-investment-review";
import { classifyReviewJudgment } from "../../investment/engines/review/review-orchestrator";
import type { StrategyRule, StrategyRuleVersion } from "../../investment/domain";

const { state, saveStrategyRuleVersion, addStrategyRule } = useInvestmentOS();
const reviewState = useInvestmentReview().state;

const route = useRoute();

// ---- 仓位 / 止损 / 减仓规则（与复盘对齐）----
type AnyStrategyRule = { kind: string; assetId?: string; minPct?: number; maxPct?: number; targetPct?: number; drawdownPct?: number; targetReturnPct?: number; targetMinPct?: number; targetMaxPct?: number; window?: { start: string; end: string } };

const editableStrategyRules = ref<StrategyRuleVersion[]>([]);
const changeReason = ref("");
const historicalStrategyRules = computed(() => state.strategyRuleVersions.slice(0, -1).reverse());
watch(
  () => state.strategyRuleVersions,
  (list) => {
    const latest = list.at(-1);
    editableStrategyRules.value = latest
      ? [{ ...latest, rules: latest.rules.map((rule) => ({ ...rule } as StrategyRule)) }]
      : [];
    changeReason.value = "";
  },
  { immediate: true },
);

function strategyRuleLabel(rule: AnyStrategyRule): string {
  const scope = rule.assetId ? `基金 ${rule.assetId}` : "整个范围";
  switch (rule.kind) {
    case "position_band":
      return `${scope} 仓位区间`;
    case "trailing_stop":
      return `${scope} 移动止损`;
    case "take_profit":
      return `${scope} 目标收益率止盈`;
    case "reduction_target":
      return `${scope} 减仓目标`;
    case "pause_window":
      return `${rule.assetId ? "基金 " + rule.assetId : "全范围"} 暂停窗口`;
    default:
      return rule.kind;
  }
}

/** 与复盘一致的突破判断：直接读复盘 snapshot 是否把该规则对应判断判为"需处理"。 */
function strategyBreachNote(rule: AnyStrategyRule): string | undefined {
  const expectedId =
    rule.kind === "position_band" ? `position:${rule.assetId ?? "scope"}`
    : rule.kind === "trailing_stop" ? `trailing_stop:${rule.assetId}`
    : rule.kind === "take_profit" ? `take_profit:${rule.assetId}`
    : rule.kind === "reduction_target" ? `reduction:${rule.assetId}`
    : undefined;
  if (!expectedId) return undefined;
  const j = reviewState.snapshot?.judgments.find((x) => x.judgmentId === expectedId);
  if (j && classifyReviewJudgment(j) === "needs_action") return j.reason;
  return undefined;
}

async function saveStrategyRules(): Promise<void> {
  const latest = state.strategyRuleVersions.at(-1);
  const edited = editableStrategyRules.value[0];
  if (!latest || !edited) return;
  if (!changeReason.value.trim()) {
    ElMessage.warning("请填写本次规则变更原因");
    return;
  }
  if (JSON.stringify(latest.rules) === JSON.stringify(edited.rules)) {
    ElMessage.info("规则内容没有变化，无需创建新版本");
    return;
  }
  const version = latest.version + 1;
  try {
    await saveStrategyRuleVersion({
      id: `srv:${latest.scopeId}:v${version}`,
      scopeId: latest.scopeId,
      version,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      rules: edited.rules,
      changeReason: changeReason.value.trim(),
    });
    ElMessage.success(`规则 v${version} 已追加，历史版本保持只读`);
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error).message}`);
  }
}

// ---- 新建单标的规则（仓位上限 / 移动止损 / 目标收益率止盈）----
const scopeAssets = computed(() => {
  const ids = state.activeScope?.includedAssetIds ?? [];
  return state.assets.filter((a) => ids.includes(a.assetId));
});

const createVisible = ref(false);
const form = reactive({
  assetId: "",
  kind: "position_band" as "position_band" | "trailing_stop" | "take_profit" | "reduction_target",
  maxPct: undefined as number | undefined,
  drawdownPct: undefined as number | undefined,
  targetReturnPct: undefined as number | undefined,
  targetMinPct: undefined as number | undefined,
  targetMaxPct: undefined as number | undefined,
});

function openCreate(): void {
  const requestedAsset = typeof route.query.assetId === "string" ? route.query.assetId : undefined;
  const requestedKind = typeof route.query.kind === "string" ? route.query.kind : undefined;
  form.assetId = requestedAsset && scopeAssets.value.some((asset) => asset.assetId === requestedAsset)
    ? requestedAsset
    : scopeAssets.value[0]?.assetId ?? "";
  form.kind = ["position_band", "trailing_stop", "take_profit", "reduction_target"].includes(requestedKind ?? "")
    ? requestedKind as typeof form.kind
    : "position_band";
  form.maxPct = undefined;
  form.drawdownPct = undefined;
  form.targetReturnPct = undefined;
  form.targetMinPct = undefined;
  form.targetMaxPct = undefined;
  createVisible.value = true;
}

watch(
  () => route.query.create,
  (value) => {
    if (value === "rule") openCreate();
  },
  { immediate: true },
);

async function submitCreate(): Promise<void> {
  if (!form.assetId) {
    ElMessage.warning("请选择基金");
    return;
  }
  const latest = state.strategyRuleVersions[state.strategyRuleVersions.length - 1];
  const exists = latest?.rules.some(
    (r) => r.kind === form.kind && (r as { assetId?: string }).assetId === form.assetId,
  );
  if (exists) {
    ElMessage.warning("该基金已有此类型规则，请直接在上方编辑阈值后保存");
    createVisible.value = false;
    return;
  }
  if (form.kind === "reduction_target") {
    if (form.targetMinPct === undefined || form.targetMaxPct === undefined || form.targetMinPct >= form.targetMaxPct) {
      ElMessage.warning("请填写有效的减仓目标区间，且下限必须小于上限");
      return;
    }
  } else {
    const declaredValue = form.kind === "position_band"
      ? form.maxPct
      : form.kind === "trailing_stop"
        ? form.drawdownPct
        : form.targetReturnPct;
    if (!declaredValue || declaredValue <= 0) {
      ElMessage.warning("请填写你事前声明的规则阈值");
      return;
    }
  }
  const effectiveFrom = new Date().toISOString().slice(0, 10);
  let rule: StrategyRule;
  if (form.kind === "position_band") {
    rule = { kind: "position_band", assetId: form.assetId, minPct: 0, maxPct: form.maxPct! / 100 };
  } else if (form.kind === "trailing_stop") {
    rule = { kind: "trailing_stop", assetId: form.assetId, basis: "nav_adjusted", drawdownPct: form.drawdownPct! / 100, effectiveFrom };
  } else if (form.kind === "reduction_target") {
    rule = {
      kind: "reduction_target",
      assetId: form.assetId,
      targetMinPct: form.targetMinPct! / 100,
      targetMaxPct: form.targetMaxPct! / 100,
    };
  } else {
    rule = { kind: "take_profit", assetId: form.assetId, targetReturnPct: form.targetReturnPct! / 100, effectiveFrom };
  }
  const kindLabel = form.kind === "position_band"
    ? "仓位上限"
    : form.kind === "trailing_stop"
      ? "移动止损"
      : form.kind === "reduction_target"
        ? "减仓目标"
        : "目标收益率止盈";
  const creatingFirstVersion = state.strategyRuleVersions.length === 0;
  try {
    await addStrategyRule(rule, `为 ${form.assetId} 新增${kindLabel}规则`);
    createVisible.value = false;
    ElMessage.success(creatingFirstVersion ? "首版规则已建立，复盘会自动更新" : "规则已创建，复盘会自动更新");
  } catch (e) {
    ElMessage.error(`创建失败：${(e as Error).message}`);
  }
}
</script>

<style scoped>
.policies-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.policies-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.policies-head-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.policies-head h3 {
  margin: 0;
}
.policies-head-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.create-rule-alert {
  margin-bottom: 12px;
}
.strategy-rules {
  min-width: 0;
}
.strategy-rules-empty {
  border-left: 3px solid var(--el-color-primary);
}
.strategy-hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.change-reason {
  margin-bottom: 12px;
  max-width: 560px;
}
.strategy-history {
  color: var(--el-text-color-regular);
}
.history-version {
  display: grid;
  grid-template-columns: minmax(110px, auto) minmax(180px, 1fr);
  gap: 4px 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.history-rule {
  grid-column: 2;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rule-version {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}
.rule-row.is-breached {
  background: var(--el-color-danger-light-9);
  border-left: 3px solid var(--el-color-danger);
}
.rule-text {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.rule-name {
  font-weight: 600;
}
.rule-breach {
  font-size: 12px;
  color: var(--el-color-danger);
}
.rule-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
}
.rule-hint {
  color: var(--el-text-color-secondary);
}
.section {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>