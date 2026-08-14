<template>
  <div class="portfolio-view">
    <el-empty v-if="!state.portfolio" description="尚无持仓快照，请先同步数据" />

    <template v-else>
      <!-- Account -->
      <el-card shadow="never" class="section">
        <template #header>账户</template>
        <div class="metric-grid">
          <div class="metric"><span class="metric-label">总资产</span><span class="metric-value">{{ fmt(state.portfolio.totalAsset) }}</span></div>
          <div class="metric"><span class="metric-label">持仓市值</span><span class="metric-value">{{ fmt(state.portfolio.holdingValue) }}</span></div>
          <div class="metric"><span class="metric-label">现金</span><span class="metric-value">{{ state.portfolio.cash === undefined ? "—" : `${fmt(state.portfolio.cash)}` }}</span></div>
          <div class="metric"><span class="metric-label">当前持仓浮盈</span><span class="metric-value">{{ state.portfolio.currentHoldingPnl === undefined ? "—" : `${fmt(state.portfolio.currentHoldingPnl)}` }}</span></div>
          <div class="metric"><span class="metric-label">历史累计盈亏</span><span class="metric-value">{{ state.account?.cumulativePnl === undefined ? "—" : `${fmt(state.account.cumulativePnl)}` }}</span></div>
        </div>
      </el-card>

      <!-- Fund Holdings -->
      <el-card shadow="never" class="section">
        <template #header>基金持仓</template>
        <el-table :data="sortedHoldings" size="small" border :default-sort="{ prop: 'marketValue', order: 'descending' }" @sort-change="onSortChange">
          <el-table-column prop="assetId" label="基金" width="120" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column prop="marketValue" label="市值" width="120" sortable="custom">
            <template #default="{ row }">{{ fmt(row.marketValue) }}</template>
          </el-table-column>
          <el-table-column prop="pnl" label="持仓盈亏" width="120" sortable="custom">
            <template #default="{ row }"><span :class="profitClass(row.pnl)">{{ row.pnl === undefined ? "—" : fmt(row.pnl) }}</span></template>
          </el-table-column>
          <el-table-column prop="pnlRate" label="持仓收益率" width="120" sortable="custom">
            <template #default="{ row }"><span :class="profitClass(row.pnlRate)">{{ fmtPct(row.pnlRate) }}</span></template>
          </el-table-column>
          <el-table-column prop="weight" label="仓位" width="90" sortable="custom">
            <template #default="{ row }">{{ fmtPct(row.weight) }}</template>
          </el-table-column>
          <el-table-column label="底层指数" min-width="120">
            <template #default="{ row }">{{ row.indexes.join(" / ") || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="地区" min-width="100">
            <template #default="{ row }">{{ row.regions.join(" / ") || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="策略" min-width="100">
            <template #default="{ row }">{{ row.strategy || "待识别" }}</template>
          </el-table-column>
          <el-table-column label="元数据来源" width="110">
            <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.metadataSource }}</el-tag></template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Exposure -->
      <el-card shadow="never" class="section">
        <template #header>
          <div class="exposure-head">
            <span>风险暴露</span>
            <el-radio-group v-model="dimension" size="small">
              <el-radio-button v-for="m in meaningfulDims" :key="m.dim" :label="m.dim">{{ dimensionLabel(m.dim) }}</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <el-alert
          v-if="singleValueDims.length"
          type="info"
          :closable="false"
          show-icon
          class="single-alert"
        >
          <template #title>以下维度当前无暴露差异</template>
          <div v-for="s in singleValueDims" :key="s.dim" class="single-row">
            {{ dimensionLabel(s.dim) }}：全部 {{ s.knownSlices[0].value }}（{{ (s.knownSlices[0].pct * 100).toFixed(0) }}%）
          </div>
        </el-alert>
        <el-empty v-if="!meaningfulDims.length" description="当前组合风险暴露单一，无显著维度差异" />
        <el-alert
          v-if="currentExposure.unknownPct > 0"
          type="info"
          :title="`已识别 ${(currentExposure.knownPct * 100).toFixed(1)}%，元数据未识别 ${(currentExposure.unknownPct * 100).toFixed(1)}%`"
          description="元数据未识别不是风险类别或风险结论；需通过基金详情来源补齐后才能参与规则评估。"
          show-icon
          :closable="false"
          class="coverage-alert"
        />
        <el-empty v-if="!exposureSlices.length" description="当前维度尚无可靠资产元数据" />
        <div v-else class="exposure-list">
          <div v-for="s in exposureSlices" :key="s.value" class="exposure-row">
            <span class="exposure-value">{{ s.value }}</span>
            <el-progress :percentage="Math.round(s.pct * 100)" :stroke-width="14" class="exposure-bar" />
            <span class="exposure-pct">{{ (s.pct * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </el-card>

      <!-- 共同暴露：按当前采集元数据动态生成，只报告标签关联，不推断底层权重 -->
      <el-card v-if="sharedExposures.length" shadow="never" class="section">
        <template #header>共同暴露与集中度</template>
        <el-alert
          type="info"
          :closable="false"
          description="以下结果由当前持仓和已识别元数据动态生成。同一持仓可关联多个标签，因此跨标签百分比不可相加；关联仓位占比不等于来源未提供的精确底层权重。"
          class="shared-note"
        />
        <el-alert
          v-for="exposure in sharedExposures"
          :key="`${exposure.dimension}-${exposure.value}`"
          type="info"
          show-icon
          :closable="false"
          class="dup-alert"
        >
          <template #title>
            {{ dimensionLabel(exposure.dimension) }}：{{ exposure.value }} 关联仓位占比 {{ (exposure.associatedPct * 100).toFixed(1) }}%
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
import { buildPortfolioHoldings, sortPortfolioHoldings, type PortfolioNumericSortKey, type SortOrder } from "../../investment/composables/selectors";
import { aggregateExposure, detectSharedExposures, exposureCoverage } from "../../investment/engines/exposure";
import type { ExposureDimension } from "../../investment/domain";

const { state } = useInvestmentOS();

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

// 每个维度的 coverage + 已知切片数（排除"（未标注）"桶）。
// 产品原则：币种/FX 等维度仅在跨币种时才有意义；初始人民币 A 股基金范围不作 P0 前置。
// 故按"已知切片数"判断区分度，≥2 才作为可切换 tab，单一值折叠到"无暴露差异"汇总。
const allCoverages = computed(() =>
  state.portfolio
    ? ALL_DIMS.map((d) => {
        const cov = exposureCoverage(state.portfolio!.holdings, state.assets, d);
        const knownSlices = cov.slices.filter((s) => s.value !== "（未标注）");
        return { dim: d, cov, knownSlices };
      })
    : [],
);

// 有区分度：≥2 个已知切片 → 作为可切换 tab
const meaningfulDims = computed(() => allCoverages.value.filter((c) => c.knownSlices.length >= 2));

// 单一值：恰好 1 个已知切片（如纯 A 股组合的计价币种全 CNY）→ 折叠到"无暴露差异"汇总
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
const sharedExposures = computed(() =>
  state.portfolio ? detectSharedExposures(state.portfolio.holdings, state.assets) : [],
);

function dimensionLabel(d: ExposureDimension): string {
  return { index: "底层指数", region: "投资市场", assetClass: "底层资产类型", currency: "计价币种", theme: "行业主题" }[d];
}

function fmtPct(value: number | undefined): string {
  return value === undefined ? "—" : `${(value * 100).toFixed(2)}%`;
}

function profitClass(value: number | undefined): string {
  if (value === undefined || value === 0) return "";
  return value > 0 ? "profit-positive" : "profit-negative";
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
}
.section {
  width: 100%;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 18px;
  font-weight: 600;
}
.shared-note {
  margin-bottom: 12px;
}
.profit-positive {
  color: var(--el-color-danger);
}
.profit-negative {
  color: var(--el-color-success);
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
.dup-alert {
  margin-bottom: 8px;
}
.dup-funds {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
