<template>
  <div ref="container" class="cycle-nav" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 单周期总资产净值曲线（12.5 G3b）：消费 stress-test 引擎的 periodSeries，
 * 展示平移后的逐期总资产与相对基准涨跌；未匹配资产不参与曲线（引擎语义）。
 */
import { useChart, epColor } from "./useChart";

const props = withDefaults(
  defineProps<{ periodSeries: Array<{ date: string; totalAsset: number }>; height?: string }>(),
  { height: "240px" },
);

const { container } = useChart(() => {
  const primary = epColor("--el-color-primary", "#409eff");
  const muted = epColor("--el-text-color-secondary", "#909399");
  const base = props.periodSeries[0]?.totalAsset ?? 0;
  const money = (n: number): string => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return {
    grid: { left: 8, right: 12, top: 12, bottom: 24, containLabel: true },
    tooltip: {
      trigger: "axis",
      appendTo: "body",
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = props.periodSeries[params[0]?.dataIndex ?? 0];
        if (!p) return "";
        const rel = base > 0 ? ((p.totalAsset - base) / base) * 100 : 0;
        return `${p.date}<br/>总资产：${money(p.totalAsset)} 元<br/>相对基准：${rel >= 0 ? "+" : ""}${rel.toFixed(1)}%`;
      },
    },
    xAxis: {
      type: "category",
      data: props.periodSeries.map((p) => p.date),
      axisLabel: { formatter: (v: string) => v.slice(2, 7), color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { color: muted, formatter: (v: number) => money(v) },
      splitLine: { lineStyle: { color: "#f0f2f5" } },
    },
    series: [
      {
        id: "nav-line",
        type: "line",
        symbol: "circle",
        symbolSize: 4,
        data: props.periodSeries.map((p) => p.totalAsset),
        lineStyle: { width: 2, color: primary },
        areaStyle: { opacity: 0.1, color: primary },
      },
    ],
  };
});
</script>

<style scoped>
.cycle-nav {
  width: 100%;
}
</style>
