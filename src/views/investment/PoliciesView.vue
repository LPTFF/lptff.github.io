<template>
  <div class="policies-view">
    <!-- 第一性结论 -->
    <el-card shadow="never" class="section verdict-card" :class="`verdict-${ruleVerdictLevel}`">
      <div class="verdict-kicker">规则状态</div>
      <h2>{{ ruleVerdictTitle }}</h2>
      <p>{{ ruleVerdictDesc }}</p>
      <div class="verdict-actions">
        <el-button v-if="!hasRules" type="primary" size="small" :disabled="!state.activeScope" @click="adoptDefaults">一键采纳默认规则集</el-button>
        <el-button v-else size="small" @click="adoptDefaults">重置为默认</el-button>
        <el-button v-if="hasRules" size="small" text type="primary" @click="expandCustom">自定义阈值</el-button>
      </div>
    </el-card>

    <!-- 需关注：被突破的规则（默认只列超界）-->
    <el-card v-if="hasRules && breachedRules.length" shadow="never" class="section breach-card">
      <template #header><span>被突破的规则</span></template>
      <div v-for="d in breachedRules" :key="`b-${d.assetId}`" class="breach-row">
        <span class="breach-name">{{ d.label }}</span>
        <span class="breach-actual">{{ pct(d.actualPct) }}</span>
        <span class="breach-band">区间 [{{ pct(d.minPct) }}, {{ pct(d.maxPct) }}]</span>
        <el-tag size="small" type="warning">⚠ {{ driftDirText(d.direction) }}</el-tag>
        <el-popover v-if="d.rationale" trigger="hover" width="320" placement="top">
          <template #reference><el-button text size="small" class="rationale-btn">依据</el-button></template>
          <div class="rationale-pop">
            <p><strong>意图：</strong>{{ d.rationale.intent }}</p>
            <p><strong>理论：</strong>{{ d.rationale.theoryRef }}<span class="rationale-doc">（{{ d.rationale.theoryDoc }}）</span></p>
            <p><strong>阈值依据：</strong>{{ d.rationale.thresholdBasis }}</p>
          </div>
        </el-popover>
        <el-button size="small" text type="primary" @click="deepAnalyzeDrift(d)">疑问→深度分析</el-button>
        <el-button size="small" text type="primary" @click="expandCustom">调整阈值</el-button>
      </div>
    </el-card>

    <!-- 折叠：全部规则集 -->
    <el-collapse v-model="allRulesActive">
      <el-collapse-item :title="`查看全部规则集（${totalRuleCount} 项）`" name="all">
        <p class="tool-disclaimer">默认值来自风控惯例示例（理论依据见下）；阈值非权威值，可外包分析后调整。当前显示{{ hasRules ? "当前生效规则" : "默认规则集（尚未采纳）" }}。</p>
        <el-empty v-if="!ruleGroups.length" description="尚无投资范围，请先导入数据或启动模拟" />
        <div v-for="g in ruleGroups" :key="g.assetId" class="rule-group">
          <div class="rule-group-title">{{ g.name }}（{{ g.assetId }}）</div>
          <div v-for="r in g.rules" :key="r.kind" class="rule-line">
            <el-tag size="small" effect="plain">{{ ruleKindLabel(r.kind) }}</el-tag>
            <span class="rule-value">{{ ruleValueText(r) }}</span>
            <el-tag v-if="!hasRules" size="small" type="info" effect="plain">默认</el-tag>
            <el-popover v-if="rationaleOf(r.kind)" trigger="hover" width="320" placement="top">
              <template #reference><el-button text size="small" class="rationale-btn">依据</el-button></template>
              <div class="rationale-pop">
                <p><strong>意图：</strong>{{ rationaleOf(r.kind)?.intent }}</p>
                <p><strong>理论：</strong>{{ rationaleOf(r.kind)?.theoryRef }}<span class="rationale-doc">（{{ rationaleOf(r.kind)?.theoryDoc }}）</span></p>
                <p><strong>阈值依据：</strong>{{ rationaleOf(r.kind)?.thresholdBasis }}</p>
              </div>
            </el-popover>
            <el-button v-if="r.kind === 'position_band'" size="small" text type="primary" @click="deepAnalyzeRule(r.kind, g.assetId)">疑问→深度分析</el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：自定义阈值 -->
    <el-collapse v-model="customActive">
      <el-collapse-item title="自定义阈值（可选：外包分析后在此调整并保存新版本）" name="custom">
        <p class="strategy-hint">修改阈值后请说明原因，再保存为新版本；历史版本不会被覆盖。</p>
        <el-input v-model="changeReason" class="change-reason" placeholder="必填：本次规则变更原因" maxlength="120" show-word-limit />
        <div v-for="ver in editableStrategyRules" :key="ver.id" class="rule-version">
          <div v-for="(rule, rIdx) in ver.rules" :key="rIdx" class="rule-row" :class="{ 'is-breached': !!strategyBreachNote(rule) }">
            <div class="rule-text">
              <span class="rule-name">{{ strategyRuleLabel(rule) }}</span>
              <el-tag v-if="strategyBreachNote(rule)" type="danger" size="small" effect="plain">被突破</el-tag>
            </div>
            <div class="rule-edit">
              <template v-if="rule.kind === 'position_band'">
                下限 <el-input-number :model-value="Math.round(rule.minPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.minPct = Number(v ?? 0) / 100)" />%
                上限 <el-input-number :model-value="Math.round(rule.maxPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.maxPct = Number(v ?? 0) / 100)" />%
              </template>
              <template v-else-if="rule.kind === 'trailing_stop'">
                回撤阈值 <el-input-number :model-value="Math.round(rule.drawdownPct * 100)" :min="1" :max="50" :step="1" size="small" @update:model-value="(v: number | undefined) => (rule.drawdownPct = Number(v ?? 0) / 100)" />%
              </template>
              <template v-else-if="rule.kind === 'reduction_target'">
                目标下限 <el-input-number :model-value="Math.round(rule.targetMinPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetMinPct = Number(v ?? 0) / 100)" />%
                目标上限 <el-input-number :model-value="Math.round(rule.targetMaxPct * 100)" :min="0" :max="100" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetMaxPct = Number(v ?? 0) / 100)" />%
              </template>
              <template v-else-if="rule.kind === 'take_profit'">
                目标收益率 <el-input-number :model-value="Math.round(rule.targetReturnPct * 100)" :min="1" :max="200" :step="5" size="small" @update:model-value="(v: number | undefined) => (rule.targetReturnPct = Number(v ?? 0) / 100)" />%
              </template>
            </div>
          </div>
        </div>
        <div class="custom-actions">
          <el-button size="small" type="primary" @click="saveStrategyRules">保存为新版本</el-button>
          <el-button size="small" :disabled="!state.activeScope" @click="openCreate">新建单标的规则</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：规则与理论依据 -->
    <el-collapse v-model="rationaleActive">
      <el-collapse-item title="规则与理论依据" name="rationale">
        <p class="tool-disclaimer">理论提供原则、不给具体阈值；默认阈值为风控惯例示例值，须你按自身风险承受确认。理论全文见 agent/theories/investment-performance-and-decision-review.md。</p>
        <div class="rationale-list">
          <div v-for="[kind, r] in rationaleEntries" :key="kind" class="rationale-item">
            <el-tag size="small" effect="plain" class="rationale-tag">{{ RULE_LABEL[kind] ?? kind }}</el-tag>
            <div class="rationale-body">
              <p><strong>意图：</strong>{{ r.intent }}</p>
              <p class="rationale-theory"><strong>理论：</strong>{{ r.theoryRef }}<span class="rationale-doc">（{{ r.theoryDoc }}）</span></p>
              <p class="rationale-basis"><strong>阈值依据：</strong>{{ r.thresholdBasis }}</p>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：历史版本 -->
    <el-collapse v-if="historicalStrategyRules.length" v-model="historyActive">
      <el-collapse-item title="历史规则版本（只读）" name="history">
        <div v-for="ver in historicalStrategyRules" :key="ver.id" class="history-version">
          <strong>v{{ ver.version }} · {{ ver.effectiveFrom }}</strong>
          <span>{{ ver.changeReason || "未记录变更原因" }}</span>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-dialog v-model="focusedCtx.visible" :title="focusedCtx.label" width="720px">
      <el-input v-model="focusedCtx.text" type="textarea" :rows="20" readonly class="focused-text" />
      <template #footer>
        <el-button @click="copyFocused">复制</el-button>
        <el-button type="primary" @click="openChatGptFocused">一键跳转 ChatGPT</el-button>
        <el-button @click="focusedCtx.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createVisible" title="新建单标的规则" width="460px">
      <el-alert type="info" title="阈值必须由你事前声明；留空时不能创建，系统不会代填。" :closable="false" show-icon class="create-rule-alert" />
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
        </el-form-item>
        <el-form-item v-else-if="form.kind === 'trailing_stop'" label="回撤阈值" required>
          <el-input-number v-model="form.drawdownPct" :min="1" :max="50" :step="1" /> %
        </el-form-item>
        <template v-else-if="form.kind === 'reduction_target'">
          <el-form-item label="目标下限" required><el-input-number v-model="form.targetMinPct" :min="0" :max="100" :step="5" /> %</el-form-item>
          <el-form-item label="目标上限" required><el-input-number v-model="form.targetMaxPct" :min="1" :max="100" :step="5" /> %</el-form-item>
        </template>
        <el-form-item v-else label="目标收益率" required>
          <el-input-number v-model="form.targetReturnPct" :min="1" :max="200" :step="5" /> %
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
import { buildAllocationDrift, type AllocationDrift } from "../../investment/composables/selectors";
import { useFocusedContext, buildContextInput, directionText as driftDirText } from "../../investment/composables/use-focused-context";
import { RULE_RATIONALE, describeRuleRationale, buildDefaultStrategyRules, type RuleRationale } from "../../investment/engines/policy/rule-rationale";
import type { StrategyRule, StrategyRuleVersion } from "../../investment/domain";

const { state, saveStrategyRuleVersion, addStrategyRule } = useInvestmentOS();
const reviewState = useInvestmentReview().state;
const route = useRoute();

const rationaleEntries = Object.entries(RULE_RATIONALE);
const RULE_LABEL: Record<string, string> = {
  position_band: "仓位区间",
  trailing_stop: "移动止损",
  reduction_target: "减仓目标",
  target_allocation: "目标配比",
  pause: "暂停新增",
  take_profit: "目标止盈",
  regular_investment: "定期投资",
  additional_investment: "额外追加",
  review: "触发复核",
  pause_window: "暂停窗口",
};

type AnyStrategyRule = { kind: string; assetId?: string; minPct?: number; maxPct?: number; targetPct?: number; drawdownPct?: number; targetReturnPct?: number; targetMinPct?: number; targetMaxPct?: number };

const hasRules = computed(() => state.strategyRuleVersions.length > 0);
const scopeAssetIds = computed(() => state.activeScope?.includedAssetIds ?? []);
const scopeAssets = computed(() => state.assets.filter((a) => scopeAssetIds.value.includes(a.assetId)));
function assetName(aid: string): string {
  return scopeAssets.value.find((a) => a.assetId === aid)?.name ?? aid;
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function pct(v: number | undefined): string {
  return v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;
}
function ruleKindLabel(kind: string): string {
  return RULE_LABEL[kind] ?? kind;
}
function ruleValueText(rule: AnyStrategyRule): string {
  switch (rule.kind) {
    case "position_band": return `区间 [${pct(rule.minPct)}, ${pct(rule.maxPct)}]${rule.targetPct !== undefined ? `，目标 ${pct(rule.targetPct)}` : ""}`;
    case "trailing_stop": return `回撤阈值 ${pct(rule.drawdownPct)}`;
    case "take_profit": return `目标收益率 ${pct(rule.targetReturnPct)}`;
    case "reduction_target": return `目标 [${pct(rule.targetMinPct)}, ${pct(rule.targetMaxPct)}]`;
    default: return "";
  }
}
function rationaleOf(kind: string): RuleRationale | undefined {
  return describeRuleRationale(kind);
}

const activeRules = computed<AnyStrategyRule[]>(() => state.strategyRuleVersions.at(-1)?.rules ?? []);
const defaultRules = computed(() => buildDefaultStrategyRules(scopeAssetIds.value, todayStr()));
const displayRules = computed<AnyStrategyRule[]>(() => (hasRules.value ? activeRules.value : defaultRules.value));
const ruleGroups = computed(() =>
  scopeAssetIds.value.map((aid) => ({
    assetId: aid,
    name: assetName(aid),
    rules: displayRules.value.filter((r) => r.assetId === aid),
  })),
);
const totalRuleCount = computed(() => ruleGroups.value.reduce((n, g) => n + g.rules.length, 0));

// 第一性结论：规则状态 + 被突破项。
const allocationDrift = computed(() => buildAllocationDrift(state.activeVersions, state.strategyRuleVersions, state.portfolio, state.assets));
const breachedRules = computed(() => allocationDrift.value.filter((d) => d.scope === "asset" && d.direction !== "within"));
const ruleVerdictTitle = computed(() => {
  if (!hasRules.value) return "尚未采纳规则集";
  if (breachedRules.value.length) return `${breachedRules.value.length} 项规则被突破`;
  return "规则集已生效，均在区间内";
});
const ruleVerdictDesc = computed(() => {
  if (!hasRules.value) return "机械检查无法进行。一键采纳基于理论惯例的默认规则集，可随时调整或外包分析。";
  if (breachedRules.value.length) return "下方列出超界项，可调整阈值或外包深度分析。";
  return "当前持仓均在你声明的区间内。可展开下方查看全部规则、自定义或演练历史周期。";
});
const ruleVerdictLevel = computed<"todo" | "warn" | "ok">(() => !hasRules.value ? "todo" : breachedRules.value.length ? "warn" : "ok");

async function adoptDefaults(): Promise<void> {
  if (!state.activeScope) {
    ElMessage.warning("尚无投资范围，请先导入数据或启动模拟");
    return;
  }
  const latest = state.strategyRuleVersions.at(-1);
  const version = latest ? latest.version + 1 : 1;
  try {
    await saveStrategyRuleVersion({
      id: `srv:${state.activeScope.scopeId}:v${version}`,
      scopeId: state.activeScope.scopeId,
      version,
      effectiveFrom: todayStr(),
      rules: buildDefaultStrategyRules(scopeAssetIds.value, todayStr()),
      changeReason: hasRules.value ? "重置为基于理论惯例的默认规则集" : "采纳基于理论惯例的默认规则集",
    });
    ElMessage.success(hasRules.value ? "已重置为默认规则集" : "默认规则集已采纳，复盘与配置对比将按默认阈值检查");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
function deepAnalyzeRule(kind: string, assetId: string): void {
  // 被突破项的"疑问→深度分析"：就地生成聚焦上下文，只带该基金相关数据。
  void kind;
  const d = allocationDrift.value.find((x) => x.scope === "asset" && x.assetId === assetId);
  if (!d) {
    ElMessage.warning("该基金无 position_band 偏离数据，无法生成聚焦上下文");
    return;
  }
  deepAnalyzeDrift(d);
}

// 单偏离聚焦 Context：共享 useFocusedContext 弹窗（同复盘）。
const { fc: focusedCtx, openFocused, copy: copyFocused, openChatGpt: openChatGptFocused } = useFocusedContext();
function deepAnalyzeDrift(d: AllocationDrift): void {
  openFocused(d, buildContextInput(state, allocationDrift.value));
}

// 折叠工具默认收起。
const allRulesActive = ref<string[]>([]);
const customActive = ref<string[]>([]);
const rationaleActive = ref<string[]>([]);
const historyActive = ref<string[]>([]);
function expandCustom(): void {
  customActive.value = ["custom"];
}

// 自定义阈值编辑
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
    case "position_band": return `${scope} 仓位区间`;
    case "trailing_stop": return `${scope} 移动止损`;
    case "take_profit": return `${scope} 目标收益率止盈`;
    case "reduction_target": return `${scope} 减仓目标`;
    default: return rule.kind;
  }
}
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
      effectiveFrom: todayStr(),
      rules: edited.rules,
      changeReason: changeReason.value.trim(),
    });
    ElMessage.success(`规则 v${version} 已追加，历史版本保持只读`);
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error).message}`);
  }
}

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
  const exists = latest?.rules.some((r) => r.kind === form.kind && (r as { assetId?: string }).assetId === form.assetId);
  if (exists) {
    ElMessage.warning("该基金已有此类型规则，请在自定义阈值区编辑后保存");
    createVisible.value = false;
    return;
  }
  if (form.kind === "reduction_target") {
    if (form.targetMinPct === undefined || form.targetMaxPct === undefined || form.targetMinPct >= form.targetMaxPct) {
      ElMessage.warning("请填写有效的减仓目标区间，且下限必须小于上限");
      return;
    }
  } else {
    const declaredValue = form.kind === "position_band" ? form.maxPct : form.kind === "trailing_stop" ? form.drawdownPct : form.targetReturnPct;
    if (!declaredValue || declaredValue <= 0) {
      ElMessage.warning("请填写你事前声明的规则阈值");
      return;
    }
  }
  const effectiveFrom = todayStr();
  let rule: StrategyRule;
  if (form.kind === "position_band") {
    rule = { kind: "position_band", assetId: form.assetId, minPct: 0, maxPct: form.maxPct! / 100 };
  } else if (form.kind === "trailing_stop") {
    rule = { kind: "trailing_stop", assetId: form.assetId, basis: "nav_adjusted", drawdownPct: form.drawdownPct! / 100, effectiveFrom };
  } else if (form.kind === "reduction_target") {
    rule = { kind: "reduction_target", assetId: form.assetId, targetMinPct: form.targetMinPct! / 100, targetMaxPct: form.targetMaxPct! / 100 };
  } else {
    rule = { kind: "take_profit", assetId: form.assetId, targetReturnPct: form.targetReturnPct! / 100, effectiveFrom };
  }
  try {
    await addStrategyRule(rule, `为 ${form.assetId} 新增规则`);
    createVisible.value = false;
    ElMessage.success("规则已创建，复盘会自动更新");
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
.section {
  width: 100%;
}
.verdict-card {
  border-left: 4px solid var(--el-color-info);
}
.verdict-todo {
  border-left-color: var(--el-color-primary);
}
.verdict-warn {
  border-left-color: var(--el-color-warning);
}
.verdict-ok {
  border-left-color: var(--el-color-success);
}
.verdict-kicker {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.verdict-card h2 {
  margin: 4px 0 6px;
  font-size: 20px;
}
.verdict-card p {
  margin: 0 0 10px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.verdict-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.breach-card {
  border-left: 3px solid var(--el-color-warning);
}
.breach-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  margin-bottom: 6px;
  font-size: 13px;
}
.breach-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.breach-actual {
  color: var(--el-color-danger);
  font-weight: 600;
}
.breach-band {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.tool-disclaimer {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rule-group {
  margin-bottom: 14px;
}
.rule-group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.rule-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  margin-bottom: 6px;
  font-size: 13px;
}
.rule-value {
  color: var(--el-text-color-regular);
}
.rationale-btn {
  font-size: 12px;
  color: var(--el-color-primary);
  padding: 0 4px;
}
.rationale-pop p {
  margin: 4px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.rationale-doc {
  color: var(--el-text-color-secondary);
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
.rule-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
}
.custom-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.history-version {
  display: grid;
  grid-template-columns: minmax(110px, auto) minmax(180px, 1fr);
  gap: 4px 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.rationale-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rationale-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.rationale-tag {
  flex-shrink: 0;
  margin-top: 2px;
}
.rationale-body {
  flex: 1;
}
.rationale-body p {
  margin: 2px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.rationale-theory,
.rationale-basis {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.create-rule-alert {
  margin-bottom: 12px;
}
.focused-text :deep(textarea) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
}
</style>