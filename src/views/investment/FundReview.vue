<template>
  <div class="fund-review">
    <el-empty v-if="!data" description="尚未导入基金数据">
      <el-button type="primary" @click="goImport">去导入</el-button>
    </el-empty>
    <template v-else>
      <el-card shadow="never" class="title-card">
        <div class="title">{{ data.updateTime || "本期" }} 基金复盘</div>
        <div class="subtitle">自动生成于前端，仅供个人复盘参考</div>
      </el-card>

      <el-card shadow="never" class="summary-card">
        <template #header>文字总结</template>
        <pre class="summary">{{ report.summary }}</pre>
      </el-card>

      <el-row :gutter="16" class="row-gap">
        <el-col :xs="24" :sm="12">
          <el-card shadow="never">
            <template #header>关键指标</template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="总资产"> {{ fmt(report.totalAsset) }}</el-descriptions-item>
              <el-descriptions-item label="累计收益">
                <span :class="profitClass(report.totalProfit)"> {{ fmt(report.totalProfit) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="收益率">
                <span :class="profitClass(report.profitRate)">{{ report.profitRate.toFixed(2) }}%</span>
              </el-descriptions-item>
              <el-descriptions-item label="持基数量">{{ report.holdingCount }}</el-descriptions-item>
              <el-descriptions-item label="交易次数">{{ report.transactionCount }}（买{{ report.buyCount }}/卖{{ report.sellCount }}）</el-descriptions-item>
              <el-descriptions-item label="海外仓位">约 {{ report.overseasRatio.toFixed(1) }}%</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-card shadow="never">
            <template #header>表现</template>
            <div v-if="report.bestFund" class="highlight">
              <div class="hl-label">表现最佳</div>
              <div class="hl-name">{{ report.bestFund.name }}（{{ report.bestFund.code }}）</div>
              <div class="up">收益  {{ fmt(report.bestFund.profit) }}（{{ report.bestFund.profitRate.toFixed(2) }}%）</div>
            </div>
            <el-divider v-if="report.bestFund && report.worstFund" />
            <div v-if="report.worstFund" class="highlight">
              <div class="hl-label">表现较弱</div>
              <div class="hl-name">{{ report.worstFund.name }}（{{ report.worstFund.code }}）</div>
              <div :class="profitClass(report.worstFund.profit)">
                收益  {{ fmt(report.worstFund.profit) }}（{{ report.worstFund.profitRate.toFixed(2) }}%）
              </div>
            </div>
            <el-empty v-if="!report.bestFund && !report.worstFund" description="无足够数据" :image-size="60" />
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
import { buildReview } from "../../utils/fund/fund-analysis";

const router = useRouter();
const data = loadFundData();
const report = computed(() => (data ? buildReview(data) : null)!);

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
.title-card {
  text-align: center;
}
.title {
  font-size: 22px;
  font-weight: 600;
}
.subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.summary-card {
  margin-top: 16px;
}
.summary {
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.8;
  font-family: inherit;
}
.row-gap {
  margin-top: 16px;
}
.highlight {
  padding: 4px 0;
}
.hl-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.hl-name {
  margin: 4px 0;
  font-size: 16px;
  font-weight: 600;
}
.up {
  color: var(--el-color-success);
}
.down {
  color: var(--el-color-danger);
}
</style>