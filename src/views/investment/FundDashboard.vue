<template>
  <div class="fund-dashboard">
    <el-empty v-if="!data" description="尚未导入基金数据">
      <el-button type="primary" @click="goImport">去导入</el-button>
    </el-empty>

    <template v-else>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover">
            <div class="stat-label">总资产</div>
            <div class="stat-value"> {{ fmt(data.account.totalAsset) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover">
            <div class="stat-label">累计收益</div>
            <div class="stat-value" :class="profitClass(data.account.totalProfit)">
               {{ fmt(data.account.totalProfit) }}
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover">
            <div class="stat-label">收益率</div>
            <div class="stat-value" :class="profitClass(data.account.profitRate)">
              {{ data.account.profitRate.toFixed(2) }}%
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover">
            <div class="stat-label">持基数量</div>
            <div class="stat-value">{{ data.holdings.length }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="row-gap">
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>仓位分布</template>
            <div class="ratio-list">
              <div v-for="h in topHoldings" :key="h.code" class="ratio-item">
                <div class="ratio-name">
                  <span>{{ h.name }}</span>
                  <span class="ratio-pct">{{ h.ratio.toFixed(1) }}%</span>
                </div>
                <el-progress :percentage="Math.min(100, h.ratio)" :stroke-width="10" :show-text="false" />
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>累计收益贡献</template>
            <div class="ratio-list">
              <div v-for="h in ranked" :key="h.code" class="ratio-item">
                <div class="ratio-name">
                  <span>{{ h.name }}</span>
                  <span class="ratio-pct" :class="profitClass(h.profit)"> {{ fmt(h.profit) }}</span>
                </div>
                <el-progress
                  :percentage="Math.min(100, Math.abs(h.profitContribution))"
                  :stroke-width="10"
                  :show-text="false"
                  :color="h.profit >= 0 ? '#67c23a' : '#f56c6c'"
                />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { loadFundData } from "../../utils/fund/fund-storage";
import { rankHoldings } from "../../utils/fund/fund-analysis";

const router = useRouter();
const data = loadFundData();

const ranked = computed(() => (data ? rankHoldings(data).slice(0, 6) : []));
const topHoldings = computed(() =>
  data ? [...data.holdings].sort((a, b) => b.ratio - a.ratio).slice(0, 6) : []
);

function fmt(n: number) {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function profitClass(n: number) {
  return n > 0 ? "up" : n < 0 ? "down" : "";
}
function goImport() {
  router.push("/investment/import");
}
</script>

<style scoped>
.row-gap {
  margin-top: 16px;
}
.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.stat-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.stat-value.up {
  color: var(--el-color-success);
}
.stat-value.down {
  color: var(--el-color-danger);
}
.ratio-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ratio-name {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}
.ratio-pct.up {
  color: var(--el-color-success);
}
.ratio-pct.down {
  color: var(--el-color-danger);
}
</style>