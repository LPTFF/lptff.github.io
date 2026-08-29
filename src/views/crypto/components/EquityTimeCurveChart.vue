<template>
  <div class="equity-time-chart-wrapper">
    <div class="chart-top-toolbar">
      <div class="chart-title-tag">
        <span class="legend-badge pnl-badge"><span class="legend-dot pnl-dot" /> 累计净盈亏 (USDT)</span>
        <span class="legend-badge dd-badge"><span class="legend-dot dd-dot" /> 水下回撤深度</span>
      </div>
      <div class="chart-range-btns">
        <el-radio-group v-model="rangeFilter" size="small" @change="onRangeChange">
          <el-radio-button value="all">全部历史</el-radio-button>
          <el-radio-button value="30d">近 30 天</el-radio-button>
          <el-radio-button value="7d">近 7 天</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height }" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ensureEchartsRegistered, type EChartsType } from "../../../investment/charts/echarts";

export interface EquityCurvePoint {
  time: number;
  cumulativePnl: number;
  drawdown: number;
  pnl?: number;
  symbol?: string;
}

const props = withDefaults(
  defineProps<{
    points: EquityCurvePoint[];
    height?: string;
  }>(),
  {
    height: "330px",
  },
);

const chartContainer = ref<HTMLDivElement | null>(null);
let chartInstance: EChartsType | null = null;
let resizeObserver: ResizeObserver | null = null;

const rangeFilter = ref<"all" | "30d" | "7d">("all");

const sortedPoints = computed(() => {
  if (!props.points || !props.points.length) return [];
  const list = [...props.points].filter((p) => p.time && Number.isFinite(p.time));
  return list.sort((a, b) => a.time - b.time);
});

const filteredPoints = computed(() => {
  const all = sortedPoints.value;
  if (!all.length) return [];
  if (rangeFilter.value === "all") return all;

  const lastTime = all[all.length - 1].time;
  const days = rangeFilter.value === "7d" ? 7 : 30;
  const cutoff = lastTime - days * 24 * 3600 * 1000;
  return all.filter((p) => p.time >= cutoff);
});

function onRangeChange(): void {
  nextTick(() => renderChart());
}

function renderChart(): void {
  if (!chartContainer.value) return;
  const echarts = ensureEchartsRegistered();
  const el = chartContainer.value as unknown as HTMLElement;
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }

  const rawData = filteredPoints.value;
  if (!rawData.length) {
    chartInstance.clear();
    return;
  }

  const pnlData = rawData.map((p) => [p.time, Number(p.cumulativePnl.toFixed(2))]);
  const ddData = rawData.map((p) => [p.time, Number(p.drawdown.toFixed(2))]);

  const pnlValues = rawData.map((p) => p.cumulativePnl);
  const minPnl = Math.min(...pnlValues, 0);
  const maxPnl = Math.max(...pnlValues, 0);
  const isOverallPositive = rawData[rawData.length - 1].cumulativePnl >= 0;

  const lineColor = isOverallPositive ? "#67c23a" : "#409eff";
  const areaGradientTop = isOverallPositive ? "rgba(103, 194, 58, 0.28)" : "rgba(64, 158, 255, 0.28)";
  const areaGradientBottom = "rgba(255, 255, 255, 0.01)";

  chartInstance.setOption({
    animationDuration: 500,
    tooltip: {
      trigger: "axis",
      appendTo: "body",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "#dcdfe6",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#303133", fontSize: 12 },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 6px;",
      formatter: (params: any[]) => {
        if (!params || !params.length) return "";
        const param = params[0];
        const timeVal = param.value[0];
        const point = rawData.find((p) => p.time === timeVal);
        const dateStr = new Date(timeVal).toLocaleString("zh-CN");
        const cumPnl = point ? point.cumulativePnl.toFixed(2) : param.value[1];
        const dd = point ? point.drawdown.toFixed(2) : "0.00";
        const sign = Number(cumPnl) >= 0 ? "+" : "";

        return `
          <div style="font-weight:600;margin-bottom:6px;border-bottom:1px solid #ebeef5;padding-bottom:4px;color:#606266">
            📅 平仓时间: ${dateStr}
          </div>
          <div style="color:${Number(cumPnl) >= 0 ? '#67c23a' : '#f56c6c'};font-weight:600;margin:3px 0">
            📈 累计净盈亏: ${sign}${cumPnl} USDT
          </div>
          <div style="color:#f56c6c;margin:3px 0;font-size:12px">
            🔻 距峰值回撤: -${dd} USDT
          </div>
        `;
      },
    },
    axisPointer: {
      link: [{ xAxisIndex: "all" }],
      lineStyle: { color: "#909399", type: "dashed" },
    },
    grid: [
      {
        left: 70,
        right: 25,
        top: 20,
        height: "54%",
      },
      {
        left: 70,
        right: 25,
        top: "73%",
        height: "20%",
      },
    ],
    xAxis: [
      {
        type: "time",
        gridIndex: 0,
        boundaryGap: false,
        splitNumber: 5,
        axisLine: { lineStyle: { color: "#dcdfe6" } },
        axisLabel: {
          show: true,
          color: "#909399",
          fontSize: 11,
          hideOverlap: true,
          formatter: "{MM}-{dd} {HH}:{mm}",
        },
        splitLine: {
          show: true,
          lineStyle: { color: "#f2f6fc", type: "dashed" },
        },
      },
      {
        type: "time",
        gridIndex: 1,
        boundaryGap: false,
        splitNumber: 5,
        axisLine: { lineStyle: { color: "#dcdfe6" } },
        axisLabel: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: "#f2f6fc", type: "dashed" },
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        gridIndex: 0,
        splitLine: {
          lineStyle: { color: "#f2f6fc", type: "dashed" },
        },
        axisLabel: {
          color: "#909399",
          fontSize: 11,
          formatter: (val: number) => val.toFixed(1) + " U",
        },
      },
      {
        type: "value",
        gridIndex: 1,
        inverse: true,
        splitNumber: 2,
        splitLine: {
          lineStyle: { color: "#f2f6fc", type: "dashed" },
        },
        axisLabel: {
          color: "#909399",
          fontSize: 10,
          formatter: (val: number) => "-" + val.toFixed(0),
        },
      },
    ],
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: [0, 1],
      },
    ],
    series: [
      {
        name: "累计净盈亏",
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: pnlData,
        smooth: 0.15,
        symbol: "circle",
        symbolSize: rawData.length > 50 ? 3 : 5,
        itemStyle: { color: lineColor },
        lineStyle: { width: 2.5, color: lineColor },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: areaGradientTop },
              { offset: 1, color: areaGradientBottom },
            ],
          },
        },
        markLine: {
          symbol: "none",
          data: [
            {
              yAxis: 0,
              lineStyle: { color: "#909399", type: "dashed", width: 1 },
              label: { position: "insideEndTop", formatter: "盈亏基准 0", fontSize: 10, color: "#909399" },
            },
          ],
        },
      },
      {
        name: "水下回撤",
        type: "line",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: ddData,
        smooth: 0.15,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#f56c6c" },
        itemStyle: { color: "#f56c6c" },
        areaStyle: {
          color: "rgba(245, 108, 108, 0.28)",
        },
      },
    ],
  });
}

watch(
  () => props.points,
  () => {
    nextTick(() => renderChart());
  },
  { deep: true },
);

onMounted(() => {
  nextTick(() => {
    renderChart();
    if (chartContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        chartInstance?.resize();
      });
      resizeObserver.observe(chartContainer.value as unknown as Element);
    }
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped>
.equity-time-chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.chart-top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 2px 6px;
  margin-bottom: 2px;
}

.chart-title-tag {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.legend-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pnl-dot {
  background-color: var(--el-color-primary);
}

.dd-dot {
  background-color: var(--el-color-danger);
}

.chart-container {
  width: 100%;
  position: relative;
}
</style>
