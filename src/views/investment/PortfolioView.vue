<template>
  <div class="portfolio-view">
    <el-empty v-if="!state.portfolio" description="尚无持仓快照，请先同步数据或在采集页启动模拟" />
    <el-alert v-else-if="isSimulator" type="warning" :closable="false" show-icon title="牛熊演练进行中，本页已暂停"
      description="演练会接管系统全局数据（真实数据已退出，结束可一键恢复），本页只展示真实持仓，模拟持仓冒充真实会误导。当前演练持仓与偏离可在复盘页的「牛熊周期演练」卡查看；历史周期压力测试也已切换为按演练持仓计算。" />

    <template v-else>
      <!-- Fund Holdings -->
      <el-card shadow="never" class="section">
        <template #header>基金持仓</template>
        <el-table class="holdings-table" :data="sortedHoldings" size="small" border table-layout="fixed"
          :default-sort="{ prop: 'marketValue', order: 'descending' }" @sort-change="onSortChange">
          <el-table-column prop="assetId" label="基金" width="64" />
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="marketValue" label="市值" width="88" sortable="custom">
            <template #default="{ row }">{{ fmt(row.marketValue) }}</template>
          </el-table-column>
          <el-table-column prop="pnl" label="持仓盈亏" width="92" sortable="custom">
            <template #default="{ row }"><span :class="profitClass(row.pnl)">{{ row.pnl === undefined ? "—" :
              fmt(row.pnl) }}</span></template>
          </el-table-column>
          <el-table-column prop="pnlRate" label="持仓收益率" width="100" sortable="custom">
            <template #default="{ row }"><span :class="profitClass(row.pnlRate)" :title="returnBasisText(row)">{{
              fmtPct(row.pnlRate)
                }}</span></template>
          </el-table-column>
          <el-table-column prop="weight" label="仓位" width="72" sortable="custom">
            <template #default="{ row }">{{ fmtPct(row.weight) }}</template>
          </el-table-column>
          <el-table-column label="跟踪指数" width="150">
            <template #default="{ row }">{{ row.trackingIndexes.join(" / ") || "无明确跟踪标的" }}</template>
          </el-table-column>
          <el-table-column label="业绩基准指数" width="150">
            <template #default="{ row }">{{ row.benchmarkIndexes.join(" / ") || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="地区" width="84">
            <template #default="{ row }">{{ row.regions.join(" / ") || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="策略" width="78">
            <template #default="{ row }">{{ row.strategy || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="字段依据" width="150">
            <template #default="{ row }">
              <div class="metadata-details">
                <div v-for="detail in row.metadataDetails" :key="detail.label" class="metadata-detail">
                  <span>{{ detail.label }}：</span>
                  <a v-if="detail.sourceUrl" class="metadata-source-link" :href="detail.sourceUrl" target="_blank"
                    rel="noopener noreferrer" :title="detail.asOf
                      ? `打开来源页面（披露日期 ${detail.asOf}）`
                      : detail.sourceSection
                        ? `打开来源页面（栏目：${detail.sourceSection}）`
                        : '打开来源页面'">{{ detail.source }}</a>
                  <span v-else>{{ detail.source }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Exposure -->
      <el-card shadow="never" class="section">
        <template #header>
          <div class="exposure-head">
            <span>风险暴露</span>
            <el-radio-group v-model="dimension" size="small">
              <el-radio-button v-for="m in meaningfulDims" :key="m.dim" :value="m.dim">{{ dimensionLabel(m.dim)
              }}</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <el-empty v-if="!meaningfulDims.length" description="当前组合风险暴露单一，无显著维度差异" />
        <el-alert v-if="currentExposure.unknownPct > 0" type="info"
          :title="`已识别 ${(currentExposure.knownPct * 100).toFixed(1)}%，元数据未识别 ${(currentExposure.unknownPct * 100).toFixed(1)}%`"
          description="元数据未识别不是风险类别或风险结论；需通过基金详情来源补齐后才能参与规则评估。" show-icon :closable="false" class="coverage-alert" />
        <el-empty v-if="!exposureSlices.length" description="当前维度尚无可靠资产元数据" />
        <ExposureDonut v-else :slices="displaySlices" height="280px" />
      </el-card>

      <!-- 共同暴露：按当前采集元数据动态生成，只报告标签关联，不推断底层权重 -->
      <el-card v-if="focusSharedExposures.length" shadow="never" class="section">
        <template #header>共同暴露与集中度</template>
        <el-alert type="info" :closable="false"
          description="以下结果由当前持仓和已识别元数据动态生成。同一持仓可关联多个标签，因此跨标签百分比不可相加；关联仓位占比不等于来源未提供的精确底层权重。" class="shared-note" />
        <el-alert v-for="exposure in focusSharedExposures" :key="`${exposure.dimension}-${exposure.value}`" type="info"
          show-icon :closable="false" class="dup-alert">
          <template #title>
            {{ dimensionLabel(exposure.dimension) }}：{{ sliceValueLabel(exposure.dimension, exposure.value) }} 关联仓位占比 {{
              (exposure.associatedPct * 100).toFixed(1) }}%
          </template>
          <div class="dup-funds">涉及基金：{{ exposure.assetIds.join("、") }}</div>
        </el-alert>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { buildPortfolioHoldings, sortPortfolioHoldings, DIMENSION_LABEL, CONTEXT_ASSET_CLASS_LABEL, CONTEXT_CURRENCY_LABEL, type PortfolioNumericSortKey, type SortOrder } from "../../investment/composables/selectors";
import { aggregateExposure, detectSharedExposures, exposureCoverage } from "../../investment/engines/exposure";
import ExposureDonut from "../../investment/charts/ExposureDonut.vue";
import type { ExposureDimension } from "../../investment/domain";

const { state } = useInvestmentOS();
const isSimulator = computed(() => state.account?.source === "sim");

const holdings = computed(() => buildPortfolioHoldings(state.portfolio, state.assets));
const sortState = ref<{ key: PortfolioNumericSortKey; order: SortOrder }>({ key: "marketValue", order: "descending" });
const sortedHoldings = computed(() => sortPortfolioHoldings(holdings.value, sortState.value.key, sortState.value.order));

function onSortChange({ prop, order }: { prop: string | null; order: SortOrder | null }): void {
  if (!prop || !order || !["marketValue", "pnl", "pnlRate", "weight"].includes(prop)) {
    sortState.value = { key: "marketValue", order: "descending" };
    return;
  }
  sortState.value = { key: prop as PortfolioNumericSortKey, order };
}

const ALL_DIMS: ExposureDimension[] = ["index", "region", "assetClass", "currency", "theme"];

const allCoverages = computed(() =>
  state.portfolio
    ? ALL_DIMS.map((d) => {
      const cov = exposureCoverage(state.portfolio!.holdings, state.assets, d);
      const knownSlices = cov.slices.filter((s) => s.value !== "（未标注）");
      return { dim: d, cov, knownSlices };
    })
    : [],
);

const meaningfulDims = computed(() => allCoverages.value.filter((c) => c.knownSlices.length >= 2));
const singleValueDims = computed(() => allCoverages.value.filter((c) => c.knownSlices.length === 1));

const dimension = ref<ExposureDimension>("index");
watch(
  () => meaningfulDims.value,
  (list) => {
    if (!list.some((c) => c.dim === dimension.value) && list.length) dimension.value = list[0].dim;
  },
  { immediate: true },
);

const currentExposure = computed(() =>
  state.portfolio
    ? exposureCoverage(state.portfolio.holdings, state.assets, dimension.value)
    : { knownPct: 0, unknownPct: 0 },
);
const exposureSlices = computed(() =>
  state.portfolio ? aggregateExposure(state.portfolio.holdings, state.assets, dimension.value) : [],
);
// 暴露切片精简：仅展示 ≥3% 的主要切片，其余聚合为「其他」，避免长尾脏标签堆砌、降低管理成本。
const displaySlices = computed(() => {
  const slices = exposureSlices.value;
  const main = slices.filter((s) => s.pct >= 0.10 || s.value === "（未标注）");
  const rest = slices.filter((s) => s.pct < 0.10 && s.value !== "（未标注）");
  if (rest.length) {
    const restPct = rest.reduce((a, b) => a + b.pct, 0);
    main.push({ dimension: dimension.value, value: `其他（${rest.length} 项，合计 ${(restPct * 100).toFixed(1)}%）`, marketValue: rest.reduce((a, b) => a + b.marketValue, 0), pct: restPct, assetIds: [] });
  }
  return main;
});
const sharedExposures = computed(() =>
  state.portfolio ? detectSharedExposures(state.portfolio.holdings, state.assets) : [],
);
// 共同暴露只展示关联仓位 ≥20% 的高集中度风险，其余剔除——降低管理成本，只看需要关注的。
const focusSharedExposures = computed(() =>
  sharedExposures.value.filter((e) => e.associatedPct >= 0.20),
);

function dimensionLabel(d: ExposureDimension): string {
  return DIMENSION_LABEL[d];
}

function sliceValueLabel(dimension: ExposureDimension, value: string): string {
  if (dimension === "assetClass") return CONTEXT_ASSET_CLASS_LABEL[value] ?? value;
  if (dimension === "currency") return CONTEXT_CURRENCY_LABEL[value] ?? value;
  return value;
}

function fmtPct(value: number | undefined): string {
  return value === undefined ? "—" : `${(value * 100).toFixed(2)}%`;
}

function profitClass(value: number | undefined): string {
  if (value === undefined || value === 0) return "";
  return value > 0 ? "profit-positive" : "profit-negative";
}

function returnBasisText(row: { pnlRateBasis?: string; pnlRateSourceField?: string }): string {
  if (row.pnlRateBasis === "source_reported") return `来源展示字段：${row.pnlRateSourceField ?? "未记录"}；来源未披露计算公式`;
  if (row.pnlRateBasis === "derived_from_cost") return "本地按（当前市值－持仓成本）÷持仓成本计算";
  return "收益率计算口径未知";
}

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.portfolio-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.section {
  width: 100%;
  min-width: 0;
}

.holdings-table {
  width: 100%;
  font-size: 12px;
}

:deep(.holdings-table .cell) {
  padding: 0 6px;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

.profit-positive {
  color: var(--el-color-danger);
}

.profit-negative {
  color: var(--el-color-success);
}

.metadata-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.metadata-detail {
  white-space: normal;
}

.metadata-source-link {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.exposure-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.coverage-alert {
  margin-bottom: 12px;
}

.single-alert {
  margin-bottom: 12px;
}

.single-row {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 2px 0;
}

.exposure-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exposure-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exposure-value {
  width: 120px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}

.exposure-bar {
  flex: 1;
}

.exposure-pct {
  width: 64px;
  text-align: right;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.shared-note {
  margin-bottom: 12px;
}

.dup-alert {
  margin-bottom: 8px;
}

.dup-funds {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
