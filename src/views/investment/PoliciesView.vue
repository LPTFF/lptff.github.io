<template>
  <div class="policies-view">
    <div class="policies-head">
      <h3>投资规则</h3>
      <el-button type="primary" size="small" :disabled="!hasRuleData" @click="openCreate">新建规则</el-button>
    </div>

    <el-alert
      v-if="!hasRuleData"
      title="风险元数据尚未识别，暂不能创建配比规则"
      description="规则只允许选择当前组合中已有可靠来源的风险标签，避免要求你理解或手填内部枚举。请先重新采集基金详情。"
      type="info"
      show-icon
      :closable="false"
    />

    <el-empty v-if="!state.policies.length" description="规则用于检查你自己设定的范围，不会提供投资建议或自动交易" />

    <div v-else class="policies-body">
      <el-card shadow="never" class="policy-list">
        <el-menu :default-active="selectedId" @select="onSelect">
          <el-menu-item v-for="p in state.policies" :key="p.id" :index="p.id">
            {{ p.name }}
            <el-tag size="small" :type="statusTag(p.status)" effect="plain">{{ statusLabel(p.status) }}</el-tag>
          </el-menu-item>
        </el-menu>
      </el-card>

      <div v-if="selected" class="policy-detail">
        <el-card shadow="never" class="section">
          <template #header>
            <div class="detail-head">
              <span>{{ selected.name }}</span>
              <el-button size="small" @click="openNewVersion">新增版本</el-button>
            </div>
          </template>
          <p class="objective"><strong>目标：</strong>{{ selected.objective }}</p>

          <h4>当前生效版本规则</h4>
          <el-table :data="currentRules" size="small" border>
            <el-table-column label="类型" width="160">
              <template #default="{ row }">{{ ruleKindLabel(row.kind) }}</template>
            </el-table-column>
            <el-table-column label="维度" width="120">
              <template #default="{ row }">{{ row.dimension ? dimensionLabel(row.dimension) : "—" }}</template>
            </el-table-column>
            <el-table-column label="值">
              <template #default="{ row }">{{ row.value || "—" }}</template>
            </el-table-column>
            <el-table-column label="目标/上限">
              <template #default="{ row }">{{ formatRuleLimits(row) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" class="section">
          <template #header>版本时间线（版本不可覆盖）</template>
          <el-timeline>
            <el-timeline-item v-for="v in versions" :key="v.id" :timestamp="formatVersionRange(v)" placement="top">
              <h4>v{{ v.version }}</h4>
              <p v-if="v.changeReason">{{ v.changeReason }}</p>
              <p class="rule-count">{{ v.rules.length }} 条规则</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </div>

    <!-- 新建规则对话框 -->
    <el-dialog v-model="createVisible" title="新建投资规则" width="560px">
      <el-form label-width="100px" size="small">
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="目标" required><el-input v-model="form.objective" type="textarea" :rows="2" /></el-form-item>
        <el-divider>目标配比规则</el-divider>
        <el-form-item label="维度"><el-select v-model="form.dimension" @change="form.value = ''"><el-option v-for="option in dimensionOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        <el-form-item label="取值" required><el-select v-model="form.value" placeholder="选择当前已识别风险标签"><el-option v-for="option in exposureOptions(form.dimension)" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        <el-form-item label="目标 %"><el-input-number v-model="form.targetPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="下限 %"><el-input-number v-model="form.minPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="上限 %"><el-input-number v-model="form.maxPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="变更原因" required><el-input v-model="form.changeReason" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 新增版本对话框 -->
    <el-dialog v-model="versionVisible" title="新增规则版本" width="560px">
      <el-form label-width="100px" size="small">
        <el-form-item label="生效日期" required><el-date-picker v-model="versionForm.effectiveFrom" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-divider>目标配比规则</el-divider>
        <el-form-item label="维度"><el-select v-model="versionForm.dimension" @change="versionForm.value = ''"><el-option v-for="option in dimensionOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        <el-form-item label="取值" required><el-select v-model="versionForm.value" placeholder="选择当前已识别风险标签"><el-option v-for="option in exposureOptions(versionForm.dimension)" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        <el-form-item label="目标 %"><el-input-number v-model="versionForm.targetPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="下限 %"><el-input-number v-model="versionForm.minPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="上限 %"><el-input-number v-model="versionForm.maxPct" :min="0" :max="100" />%</el-form-item>
        <el-form-item label="变更原因" required><el-input v-model="versionForm.changeReason" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="versionVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVersion">新增版本</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { aggregateExposure } from "../../investment/engines/exposure";
import type { ExposureDimension, Policy, PolicyStatus, PolicyVersion } from "../../investment/domain";

const { state, createPolicy, createPolicyVersion, getVersions } = useInvestmentOS();

const selectedId = ref<string>("");
const selected = computed<Policy | undefined>(() => state.policies.find((p) => p.id === selectedId.value));
const versions = ref<PolicyVersion[]>([]);
const dimensionOptions: Array<{ label: string; value: ExposureDimension }> = [
  { label: "底层指数", value: "index" },
  { label: "地区", value: "region" },
  { label: "资产类型", value: "assetClass" },
  { label: "币种", value: "currency" },
  { label: "主题/策略", value: "theme" },
];
const hasRuleData = computed(() => dimensionOptions.some((option) => exposureOptions(option.value).length > 0));

function exposureOptions(dimension: ExposureDimension): Array<{ label: string; value: string }> {
  if (!state.portfolio) return [];
  return aggregateExposure(state.portfolio.holdings, state.assets, dimension).map((slice) => ({
    value: slice.value,
    label: `${slice.value}（当前 ${(slice.pct * 100).toFixed(1)}%）`,
  }));
}

function dimensionLabel(dimension: ExposureDimension): string {
  return dimensionOptions.find((option) => option.value === dimension)?.label ?? dimension;
}

function ruleKindLabel(kind: string): string {
  return {
    target_allocation: "目标配比",
    regular_investment: "定期投入",
    additional_investment: "额外投入条件",
    pause: "暂停新增",
    review: "重新评估",
  }[kind] ?? kind;
}

const currentRules = computed(() => {
  const v = versions.value.find((x) => x.id === selected.value?.currentVersionId);
  return v?.rules ?? [];
});

watch(
  () => state.policies,
  (list) => {
    if (!selectedId.value && list.length) selectedId.value = list[0].id;
  },
  { immediate: true },
);

watch(selectedId, async (id) => {
  if (id) versions.value = await getVersions(id);
});

function onSelect(id: string) {
  selectedId.value = id;
}

const STATUS_TAG: Record<PolicyStatus, "success" | "info" | "warning"> = { draft: "info", active: "success", paused: "warning", retired: "info" };

function statusLabel(s: PolicyStatus): string {
  return { draft: "草稿", active: "生效", paused: "暂停", retired: "归档" }[s];
}
function statusTag(s: PolicyStatus): "success" | "info" | "warning" {
  return STATUS_TAG[s];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRuleLimits(row: any): string {
  if (row?.kind === "target_allocation") return `目标 ${row.targetPct ?? 0}% / [${row.minPct ?? 0}% ~ ${row.maxPct ?? 0}%]`;
  if (row?.kind === "pause") return `上限 ${row.maxPct ?? 0}%`;
  return "—";
}
function formatVersionRange(v: PolicyVersion): string {
  return `${v.effectiveFrom} → ${v.effectiveTo ?? "至今"}`;
}

// 新建规则
const createVisible = ref(false);
const form = reactive({ name: "", objective: "", dimension: "index" as ExposureDimension, value: "", targetPct: 35, minPct: 25, maxPct: 45, changeReason: "" });

function openCreate() {
  Object.assign(form, { name: "", objective: "", dimension: "index", value: "", targetPct: 35, minPct: 25, maxPct: 45, changeReason: "" });
  createVisible.value = true;
}

async function submitCreate() {
  if (!form.name || !form.value || !form.changeReason) {
    ElMessage.warning("名称、取值、变更原因必填");
    return;
  }
  if (form.minPct > form.targetPct || form.targetPct > form.maxPct) {
    ElMessage.warning("比例必须满足：下限 ≤ 目标 ≤ 上限");
    return;
  }
  await createPolicy({
    name: form.name,
    objective: form.objective,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    rules: [{ kind: "target_allocation", dimension: form.dimension, value: form.value, targetPct: form.targetPct / 100, minPct: form.minPct / 100, maxPct: form.maxPct / 100 }],
    changeReason: form.changeReason,
  });
  createVisible.value = false;
  ElMessage.success("规则已创建");
}

// 新增版本
const versionVisible = ref(false);
const versionForm = reactive({ effectiveFrom: "", dimension: "index" as ExposureDimension, value: "", targetPct: 35, minPct: 25, maxPct: 45, changeReason: "" });

function openNewVersion() {
  if (!selected.value) return;
  Object.assign(versionForm, { effectiveFrom: new Date().toISOString().slice(0, 10), dimension: "index", value: "", targetPct: 35, minPct: 25, maxPct: 45, changeReason: "" });
  versionVisible.value = true;
}

async function submitVersion() {
  if (!selected.value || !versionForm.value || !versionForm.changeReason) {
    ElMessage.warning("取值、变更原因必填");
    return;
  }
  if (versionForm.minPct > versionForm.targetPct || versionForm.targetPct > versionForm.maxPct) {
    ElMessage.warning("比例必须满足：下限 ≤ 目标 ≤ 上限");
    return;
  }
  await createPolicyVersion(selected.value.id, {
    effectiveFrom: versionForm.effectiveFrom,
    rules: [{ kind: "target_allocation", dimension: versionForm.dimension, value: versionForm.value, targetPct: versionForm.targetPct / 100, minPct: versionForm.minPct / 100, maxPct: versionForm.maxPct / 100 }],
    changeReason: versionForm.changeReason,
  });
  versionVisible.value = false;
  versions.value = await getVersions(selected.value.id);
  ElMessage.success("已新增版本，旧版本保留");
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
}
.policies-head h3 {
  margin: 0;
}
.policies-body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
}
.policy-list .el-menu {
  border-right: none;
}
.policy-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section {
  width: 100%;
}
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.objective {
  color: var(--el-text-color-regular);
}
.rule-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
@media screen and (max-width: 768px) {
  .policies-body {
    grid-template-columns: 1fr;
  }
}
</style>
