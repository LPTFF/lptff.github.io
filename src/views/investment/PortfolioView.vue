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
        <el-table :data="holdings" size="small" border>
          <el-table-column prop="assetId" label="基金" width="120" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column label="市值" width="120">
            <template #default="{ row }">{{ fmt(row.marketValue) }}</template>
          </el-table-column>
          <el-table-column label="持仓盈亏" width="120">
            <template #default="{ row }">{{ row.pnl === undefined ? "—" : `${fmt(row.pnl)}` }}</template>
          </el-table-column>
          <el-table-column label="仓位" width="90">
            <template #default="{ row }">{{ (row.weight * 100).toFixed(1) }}%</template>
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
              <el-radio-button label="index">指数</el-radio-button>
              <el-radio-button label="region">地区</el-radio-button>
              <el-radio-button label="assetClass">资产类型</el-radio-button>
              <el-radio-button label="currency">币种</el-radio-button>
              <el-radio-button label="theme">主题</el-radio-button>
            </el-radio-group>
          </div>
        </template>
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

      <!-- 重复暴露（只报告事实，PRD §18.5） -->
      <el-card v-if="duplicateExposures.length" shadow="never" class="section">
        <template #header>重复暴露</template>
        <el-alert
          v-for="d in duplicateExposures"
          :key="`${d.dimension}-${d.value}`"
          type="info"
          show-icon
          :closable="false"
          class="dup-alert"
        >
          <template #title>
            {{ dimensionLabel(d.dimension) }}：{{ d.value }} 实际总暴露 {{ (d.pct * 100).toFixed(1) }}%
          </template>
          <div class="dup-funds">涉及基金：{{ d.assetIds.join("、") }}</div>
        </el-alert>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { buildPortfolioHoldings } from "../../investment/composables/selectors";
import { aggregateExposure, detectDuplicateExposures, exposureCoverage } from "../../investment/engines/exposure";
import type { ExposureDimension } from "../../investment/domain";

const { state } = useInvestmentOS();

const holdings = computed(() => buildPortfolioHoldings(state.portfolio, state.assets));
const dimension = ref<ExposureDimension>("index");
const currentExposure = computed(() =>
  state.portfolio
    ? exposureCoverage(state.portfolio.holdings, state.assets, dimension.value)
    : { knownPct: 0, unknownPct: 0 },
);
const exposureSlices = computed(() =>
  state.portfolio ? aggregateExposure(state.portfolio.holdings, state.assets, dimension.value) : [],
);
const duplicateExposures = computed(() =>
  state.portfolio ? detectDuplicateExposures(state.portfolio.holdings, state.assets) : [],
);

function dimensionLabel(d: ExposureDimension): string {
  return { index: "指数", region: "地区", assetClass: "资产类型", currency: "币种", theme: "主题" }[d];
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
