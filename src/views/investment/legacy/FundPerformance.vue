<template>
  <div class="fund-performance">
    <el-empty v-if="!data" description="尚未导入基金数据">
      <el-button type="primary" @click="goImport">去导入</el-button>
    </el-empty>

    <template v-else>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-card shadow="hover">
            <div class="stat-label">累计收益</div>
            <div class="stat-value" :class="profitClass(perf.totalProfit)"> {{ fmt(perf.totalProfit) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card shadow="hover">
            <div class="stat-label">单日最大盈利</div>
            <div class="stat-value up"> {{ fmt(perf.maxDailyGain) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card shadow="hover">
            <div class="stat-label">单日最大亏损</div>
            <div class="stat-value down"> {{ fmt(perf.maxDailyLoss) }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="chart-card">
        <template #header>累计收益曲线</template>
        <svg viewBox="0 0 800 320" class="chart" preserveAspectRatio="none" v-if="points.length">
          <!-- 0 轴 -->
          <line :x1="0" :x2="800" :y1="zeroY" :y2="zeroY" class="axis-zero" />
          <!-- 区域填充 -->
          <polygon :points="areaPoints" class="area" />
          <!-- 折线 -->
          <polyline :points="linePoints" class="line" fill="none" />
          <!-- 数据点 -->
          <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="3" class="dot" />
        </svg>
        <div v-else class="chart-empty">暂无曲线数据</div>
        <div class="legend">
          <span v-for="(p, i) in perf.series" :key="i" class="legend-item">
            {{ p.date }}：累计 {{ fmt(p.cumulativeProfit) }} / 单日 {{ fmt(p.dailyProfit) }}
          </span>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { loadFundData } from "../../../utils/fund/fund-storage";
import { buildPerformance } from "../../../utils/fund/fund-analysis";

const router = useRouter();
const data = loadFundData();
const perf = computed(() => (data ? buildPerformance(data) : {
  totalProfit: 0,
  maxDailyGain: 0,
  maxDailyLoss: 0,
  profitRate: 0,
  series: [],
}));

const W = 800;
const H = 320;
const PAD = 20;

const points = computed(() => {
  const s = perf.value.series;
  if (!s.length) return [];
  const values = s.map((p) => p.cumulativeProfit);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const stepX = s.length === 1 ? W - PAD * 2 : (W - PAD * 2) / (s.length - 1);
  return s.map((p, i) => {
    const x = PAD + i * stepX;
    const y = PAD + ((max - p.cumulativeProfit) / range) * (H - PAD * 2);
    return { x, y };
  });
});

const zeroY = computed(() => {
  const s = perf.value.series;
  if (!s.length) return H - PAD;
  const max = Math.max(0, ...s.map((p) => p.cumulativeProfit));
  const min = Math.min(0, ...s.map((p) => p.cumulativeProfit));
  const range = max - min || 1;
  return PAD + (max / range) * (H - PAD * 2);
});

const linePoints = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(" "));
const areaPoints = computed(() => {
  if (!points.value.length) return "";
  const first = points.value[0];
  const last = points.value[points.value.length - 1];
  return `${first.x},${H - PAD} ${linePoints.value} ${last.x},${H - PAD}`;
});

function fmt(n: number) {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function profitClass(n: number) {
  return n > 0 ? "up" : n < 0 ? "down" : "";
}
function goImport() {
  router.push("/investment/legacy/import");
}
</script>

<style scoped>
.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.stat-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}
.stat-value.up {
  color: var(--el-color-success);
}
.stat-value.down {
  color: var(--el-color-danger);
}
.chart-card {
  margin-top: 16px;
}
.chart {
  width: 100%;
  height: 320px;
  display: block;
}
.axis-zero {
  stroke: var(--el-border-color);
  stroke-dasharray: 4 4;
}
.area {
  fill: var(--el-color-primary);
  fill-opacity: 0.12;
}
.line {
  stroke: var(--el-color-primary);
  stroke-width: 2;
}
.dot {
  fill: var(--el-color-primary);
}
.chart-empty {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}
.legend {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
