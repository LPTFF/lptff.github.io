<template>
  <div class="data-view">
    <!-- 第一性结论 -->
    <el-card shadow="never" class="section verdict-card" :class="`verdict-${verdictLevel}`">
      <div class="verdict-kicker">数据状态</div>
      <h2>{{ verdictTitle }}</h2>
      <p>{{ verdictDesc }}</p>
      <div class="verdict-actions">
        <el-button type="primary" size="small" :loading="state.collecting" :disabled="state.syncing" @click="collect">重新采集</el-button>
        <el-button size="small" :loading="state.syncing" :disabled="state.collecting" @click="sync">读取待导入</el-button>
        <el-button size="small" @click="downloadPlugin">下载插件</el-button>
        <el-button size="small" text type="primary" @click="installActive = ['install']">查看安装步骤</el-button>
      </div>
      <el-alert v-if="pluginHint" :type="pluginHint.type" :title="pluginHint.title" :description="pluginHint.desc" show-icon :closable="false" class="guide-hint" />
    </el-card>

    <!-- 需关注：数据缺口（只列 partial/unknown）-->
    <el-card v-if="gaps.length" shadow="never" class="section gap-card">
      <template #header><span>数据缺口（{{ gaps.length }} 个）</span></template>
      <div class="gap-list">
        <div v-for="g in gaps" :key="g.dataset" class="gap-item">
          <div class="gap-card-head">
            <span class="gap-name">{{ datasetLabel(g.dataset) }}</span>
            <el-tag size="small" :type="completenessTag(g.completeness)" effect="plain">{{ completenessLabel(g.completeness) }}</el-tag>
          </div>
          <div class="gap-grid">
            <div class="gap-cell">
              <div class="gap-cell-title">缺什么</div>
              <div class="gap-cell-body">{{ g.missingRanges.join("；") }}</div>
            </div>
            <div class="gap-cell gap-cell-danger">
              <div class="gap-cell-title">不能回答</div>
              <div class="gap-cell-body">{{ g.impact }}</div>
            </div>
            <div class="gap-cell gap-cell-safe">
              <div class="gap-cell-title">仍能回答</div>
              <div class="gap-cell-body">{{ g.notAffected }}</div>
            </div>
          </div>
          <div class="gap-recover-row">
            <span class="gap-recover-text"><strong>如何补救：</strong>{{ g.recover }}</span>
            <el-button size="small" type="primary" :loading="state.collecting" :disabled="state.syncing" @click="collect">去重新采集</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 折叠：数据健康详情 -->
    <el-collapse v-model="healthActive">
      <el-collapse-item :title="`数据健康详情（${state.coverage.length} 个数据集）`" name="health">
        <el-empty v-if="!state.coverage.length" description="尚无数据覆盖记录，请先同步" />
        <div v-else class="health-list">
          <div v-for="c in state.coverage" :key="c.dataset" class="health-row">
            <span class="dataset-label">{{ datasetLabel(c.dataset) }}</span>
            <el-progress :percentage="completenessPct(c.completeness)" :status="progressStatus(c.completeness)" :stroke-width="14" class="health-bar" />
            <el-tag :type="completenessTag(c.completeness)" size="small" effect="plain">{{ completenessLabel(c.completeness) }}</el-tag>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：数据覆盖范围 -->
    <el-collapse v-model="coverageActive">
      <el-collapse-item title="数据覆盖范围（时间区间）" name="coverage">
        <el-empty v-if="!state.coverage.length" description="无覆盖数据" />
        <div v-else class="range-list">
          <div v-for="c in state.coverage" :key="c.dataset" class="range-row">
            <span class="dataset-label">{{ datasetLabel(c.dataset) }}</span>
            <span v-if="c.knownRanges.length" class="range-text">{{ c.knownRanges.map((r) => `${r.start} ~ ${r.end}`).join("，") }}</span>
            <span v-else class="range-text empty">无已知范围</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：采集与安装步骤 -->
    <el-collapse v-model="installActive">
      <el-collapse-item title="采集与安装步骤" name="install">
        <p class="guide-copy">插件采集完成后会生成一次性待导入数据；导入成功后待导入数据自动清除，本地账本数据仍保留。</p>
        <ol class="install-steps">
          <li>解压下载的 zip，在 <code>chrome://extensions</code> 开启开发者模式并加载插件。</li>
          <li>登录天天基金，回到本页点击"重新采集"，等待持仓、基金详情和全部交易分页采集完成。</li>
          <li>进度显示"新批次等待导入"后，点击"读取待导入"。导入后插件待导入数据会清除，本地账本数据仍保留。</li>
        </ol>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：从采集快照导入（脱敏样本，不依赖插件） -->
    <el-collapse v-model="snapshotActive">
      <el-collapse-item title="从采集快照导入" name="snapshot">
        <p class="guide-copy">这是一份用于结构审查的脱敏采集快照，交易分页为 72/72 页、共 1427 笔。导入会覆盖当前模拟器或旧数据，并保留你定义的规则。</p>
        <div class="guide-actions">
          <el-button type="primary" plain :loading="state.syncing" @click="importSnapshot">导入脱敏采集快照（2026-08-20，交易完整）</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-divider content-position="left" class="danger-divider">危险操作（不可恢复，与上方数据源 / 采集入口分开）</el-divider>

    <!-- 折叠：重新录入与本地删除 -->
    <el-collapse v-model="clearActive">
      <el-collapse-item title="清空本地数据（危险）" name="clear">
        <p class="guide-copy">一键删除所有账户、持仓、交易、盈亏、覆盖范围、规则及分析结果，回到空态；清空后可重新采集或导入快照。不可恢复。</p>
        <div class="guide-actions">
          <el-button type="danger" plain :loading="state.syncing" @click="confirmClearEverything">清空所有本地数据</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useCollectionControl } from "../../investment/composables/use-collection-control";
import { usePluginGuide } from "../../investment/composables/use-plugin-guide";
import { buildCoverageGaps } from "../../investment/composables/selectors";
import type { CoverageDataset, DataCoverage } from "../../investment/domain";

const { state, clearEverything, loadRealFixtureSnapshot } = useInvestmentOS();
const { collect, sync } = useCollectionControl();
const { pluginHint, downloadPlugin } = usePluginGuide();

const gaps = computed(() => buildCoverageGaps([...state.coverage]));

const hasNoData = computed(() => !state.account || !state.coverage.length);
const verdictLevel = computed<"ok" | "warn" | "blocked">(() => {
  if (hasNoData.value) return "blocked";
  if (state.health?.level === "blocked") return "blocked";
  if (gaps.value.length) return "warn";
  return "ok";
});
const verdictTitle = computed(() => {
  if (verdictLevel.value === "blocked") return hasNoData.value ? "尚无数据" : "账户或持仓数据缺失，无法判断";
  if (verdictLevel.value === "warn") return `${gaps.value.length} 个数据集有缺口`;
  return "数据完整，无需操作";
});
const verdictDesc = computed(() => {
  if (verdictLevel.value === "blocked") return hasNoData.value ? "账本为空，请重新采集或在下方加载本地采集快照。" : "请点重新采集，补齐账户与持仓。";
  if (verdictLevel.value === "warn") return "下方列出缺口、影响与补救；点重新采集可补齐。";
  return "所有数据集完整；可展开查看健康详情、覆盖范围或采集设置。";
});

const healthActive = ref<string[]>([]);
const coverageActive = ref<string[]>([]);
const installActive = ref<string[]>([]);
const clearActive = ref<string[]>([]);
const snapshotActive = ref<string[]>(["snapshot"]);

async function importSnapshot(): Promise<void> {
  const ok = await loadRealFixtureSnapshot();
  if (ok) ElMessage.success("已加载脱敏采集快照（交易 72/72 页）");
  else ElMessage.error(state.error || "加载真实快照失败");
}

async function confirmClearEverything(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      "将永久删除本地账本的所有投资数据（账户、持仓、交易、盈亏、覆盖范围、分析结果）和规则，回到空态。清空后可重新采集或导入快照。不可恢复。",
      "清空所有本地数据",
      { type: "warning", confirmButtonText: "确认清空", cancelButtonText: "取消" },
    );
    await clearEverything();
    ElMessage.success("已清空所有本地数据");
  } catch (error) {
    if (error !== "cancel" && error !== "close") ElMessage.error(error instanceof Error ? error.message : "清空失败");
  }
}

function datasetLabel(dataset: CoverageDataset): string {
  return { account: "账户", holdings: "持仓", dailyPnl: "每日盈亏", transactions: "交易历史", fundDetail: "基金详情" }[dataset];
}

const PCT: Record<DataCoverage["completeness"], number> = { complete: 100, partial: 55, unknown: 20 };
const STATUS: Record<DataCoverage["completeness"], "success" | "warning" | "exception"> = { complete: "success", partial: "warning", unknown: "exception" };
const TAG: Record<DataCoverage["completeness"], "success" | "warning" | "info"> = { complete: "success", partial: "warning", unknown: "info" };
const LABEL: Record<DataCoverage["completeness"], string> = { complete: "完整", partial: "部分", unknown: "未知" };

function completenessLabel(c: DataCoverage["completeness"]): string { return LABEL[c]; }
function completenessPct(c: DataCoverage["completeness"]): number { return PCT[c]; }
function progressStatus(c: DataCoverage["completeness"]): "success" | "warning" | "exception" { return STATUS[c]; }
function completenessTag(c: DataCoverage["completeness"]): "success" | "warning" | "info" { return TAG[c]; }
</script>

<style scoped>
.data-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section {
  width: 100%;
}
.verdict-card {
  border-left: 4px solid var(--el-color-success);
}
.verdict-warn {
  border-left-color: var(--el-color-warning);
}
.verdict-blocked {
  border-left-color: var(--el-color-danger);
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
.guide-hint {
  margin-top: 12px;
}
.gap-card {
  border-left: 3px solid var(--el-color-warning);
}
.gap-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gap-item {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px 14px;
  background: var(--el-fill-color-blank);
}
.gap-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.gap-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.gap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}
.gap-cell {
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}
.gap-cell-danger {
  background: var(--el-color-danger-light-9);
}
.gap-cell-safe {
  background: var(--el-color-success-light-9);
}
.gap-cell-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.gap-cell-body {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.gap-recover-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.gap-recover-text {
  font-size: 13px;
  color: var(--el-color-success);
}
.health-list,
.range-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.health-row,
.range-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dataset-label {
  width: 96px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}
.health-bar {
  flex: 1;
}
.range-text {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.range-text.empty {
  color: var(--el-text-color-secondary);
}
.guide-copy {
  margin: 0 0 14px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
  font-size: 13px;
}
.guide-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.install-steps {
  margin: 8px 0 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  font-size: 13px;
}
.install-steps code {
  color: var(--el-color-primary);
}
</style>
