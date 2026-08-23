<template>
  <div ref="container" class="pnl-chart" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 累计盈亏曲线（12.5 G2）：主曲线 + 历史峰值虚线 + 回撤区间浅红底。
 * 数据缺口如实断线，不插值不补零；序列口径与 computeMaxDrawdown 一致。
 */
import { computed } from "vue";
import { useChart, epColor } from "./useChart";
import type { CumulativePnlPoint } from "../composables/selectors";

const props = withDefaults(defineProps<{ series: CumulativePnlPoint[]; height?: string }>(), { height: "260px" });

/** 连续“累计 < 峰值”的区段（回撤中），起点取该段之前的最后峰值日。 */
const drawdownAreas = computed(() => {
  const areas: Array<[{ xAxis: string }, { xAxis: string }]> = [];
  let inDd = false;
  let start = "";
  let lastPeakDate = "";
  for (const p of props.series) {
    if (p.cumulative < p.runningPeak) {
      if (!inDd) {
        inDd = true;
        start = lastPeakDate || p.date;
      }
    } else if (inDd) {
      inDd = false;
      areas.push([{ xAxis: start }, { xAxis: p.date }]);
    }
    if (p.cumulative >= p.runningPeak) lastPeakDate = p.date;
  }
  if (inDd && props.series.length) areas.push([{ xAxis: start }, { xAxis: props.series[props.series.length - 1].date }]);
  return areas;
});

const { container } = useChart(() => {
  const primary = epColor("--el-color-primary", "#409eff");
  const muted = epColor("--el-text-color-secondary", "#909399");
  const money = (n: number): string => n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true },
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = props.series[params[0]?.dataIndex ?? 0];
        if (!p) return "";
        return `${p.date}<br/>当日盈亏：${money(p.pnl)} 元<br/>累计：${money(p.cumulative)} 元<br/>历史峰值：${money(p.runningPeak)} 元`;
      },
    },
    xAxis: {
      type: "category",
      data: props.series.map((p) => p.date),
      axisLabel: { formatter: (v: string) => v.slice(5), color: muted },
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: muted, formatter: (v: number) => (v >= 0 ? v : v).toString() },
      splitLine: { lineStyle: { color: "#f0f2f5" } },
    },
    dataZoom: props.series.length > 90 ? [{ type: "inside" }] : undefined,
    series: [
      {
        name: "累计盈亏",
        id: "cum-pnl",
        type: "line",
        symbol: "none",
        data: props.series.map((p) => p.cumulative),
        lineStyle: { width: 2, color: primary },
        areaStyle: { opacity: 0.12, color: primary },
        markArea: drawdownAreas.value.length
          ? { silent: true, itemStyle: { color: "rgba(245,108,108,0.08)" }, data: drawdownAreas.value }
          : undefined,
      },
      {
        name: "历史峰值",
        id: "cum-peak",
        type: "line",
        symbol: "none",
        data: props.series.map((p) => p.runningPeak),
        lineStyle: { width: 1, type: "dashed", color: "#c0c4cc" },
        tooltip: { show: false },
      },
    ],
  };
});
</script>

<style scoped>
.pnl-chart {
  width: 100%;
}
</style>
