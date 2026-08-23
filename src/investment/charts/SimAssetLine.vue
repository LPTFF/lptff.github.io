<template>
  <div ref="container" class="sim-line" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 牛熊演练总资产曲线（12.5 G4）：逐期推进的可视轨迹，按市场阶段分段着色；
 * 只消费模拟器内存态 assetHistory（刷新续演从恢复点起画，不补造历史）。
 */
import { computed } from "vue";
import { useChart, epColor } from "./useChart";
import type { SimAssetPoint } from "../composables/use-investment-simulator";

const props = withDefaults(defineProps<{ history: SimAssetPoint[]; height?: string }>(), { height: "240px" });

const PHASE_LABEL: Record<string, string> = {
  bull: "牛市", top: "见顶", bear: "熊市", bottom: "触底", rebound: "反弹", range: "震荡",
};
const PHASE_COLOR: Record<string, string> = {
  bull: "rgba(103,194,58,0.07)",
  top: "rgba(230,162,60,0.09)",
  bear: "rgba(245,108,108,0.08)",
  bottom: "rgba(245,108,108,0.12)",
  rebound: "rgba(103,194,58,0.05)",
  range: "rgba(144,147,153,0.06)",
};

/** 连续相同阶段的区段，用于 markArea 分段底色。 */
const phaseAreas = computed(() => {
  const areas: Array<[{ xAxis: string }, { xAxis: string }, { phase: string }]> = [];
  let current = "";
  let start = "";
  for (const p of props.history) {
    const phase = p.phase as string;
    if (phase !== current) {
      if (current && start) {
        areas.push([{ xAxis: start }, { xAxis: p.asOf }, { phase: current }]);
      }
      current = phase;
      start = p.asOf;
    }
  }
  const last = props.history[props.history.length - 1];
  if (current && start && last) areas.push([{ xAxis: start }, { xAxis: last.asOf }, { phase: current }]);
  return areas;
});

const { container } = useChart(() => {
  const primary = epColor("--el-color-primary", "#409eff");
  const muted = epColor("--el-text-color-secondary", "#909399");
  const money = (n: number): string => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  const areaData = phaseAreas.value.map((a) => [
    {
      xAxis: a[0].xAxis,
      name: PHASE_LABEL[a[2].phase] ?? a[2].phase,
      itemStyle: { color: PHASE_COLOR[a[2].phase] ?? "rgba(144,147,153,0.06)" },
    },
    { xAxis: a[1].xAxis },
  ]);
  return {
    // 逐期回放时数据更新动画让曲线“生长”到新点，而非整图闪现。
    animation: true,
    animationDuration: 280,
    animationDurationUpdate: 280,
    animationEasingUpdate: "linear",
    grid: { left: 8, right: 12, top: 14, bottom: 24, containLabel: true },
    tooltip: {
      trigger: "axis",
      appendTo: "body",
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = props.history[params[0]?.dataIndex ?? 0];
        if (!p) return "";
        return `第 ${p.round} 期 · ${p.asOf}<br/>阶段：${PHASE_LABEL[p.phase as string] ?? p.phase}<br/>总资产：${money(p.totalAsset)} 元`;
      },
    },
    xAxis: {
      type: "category",
      data: props.history.map((p) => p.asOf),
      axisLabel: { color: muted, fontSize: 11 },
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
        id: "sim-asset-line",
        type: "line",
        symbol: "circle",
        symbolSize: 4,
        data: props.history.map((p) => p.totalAsset),
        lineStyle: { width: 2, color: primary },
        areaStyle: { opacity: 0.1, color: primary },
        markArea: areaData.length ? { silent: true, data: areaData } : undefined,
      },
    ],
  };
});
</script>

<style scoped>
.sim-line {
  width: 100%;
}
</style>
