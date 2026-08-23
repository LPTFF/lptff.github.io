<template>
  <div ref="container" class="bullet-chart" />
</template>

<script setup lang="ts">
/**
 * 配置偏离子弹图（12.5 G1）：浅色区间带 + 深色实际窄条 + 目标虚线，
 * 一眼看出越界方向与幅度；只呈现 AllocationDrift 既有事实，不计算规则。
 */
import { computed } from "vue";
import { useChart, epColor } from "./useChart";
import type { AllocationDrift } from "../composables/selectors";

const props = defineProps<{ drift: AllocationDrift }>();

/** 坐标上限：区间上限 1.3 倍并覆盖实际值，给越界留视觉余量。 */
const scaleMax = computed(() =>
  Math.ceil(Math.max(props.drift.maxPct * 1.3, props.drift.actualPct * 1.05, 0.05) * 100) / 100);

const { container } = useChart(() => {
  const d = props.drift;
  const within = d.direction === "within";
  const accent = epColor("--el-color-primary", "#409eff");
  const barColor = within ? epColor("--el-color-success", "#67c23a") : epColor("--el-color-danger", "#f56c6c");
  const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;
  const gap = d.direction === "over" ? d.actualPct - d.maxPct : d.direction === "under" ? d.minPct - d.actualPct : 0;
  return {
    grid: { left: 2, right: 46, top: 4, bottom: 4 },
    xAxis: { type: "value", min: 0, max: scaleMax.value, show: false },
    yAxis: { type: "category", data: [""], show: false },
    tooltip: {
      trigger: "item",
      formatter: () =>
        `实际 ${pct(d.actualPct)} · 目标 ${d.targetPct === undefined ? "未声明" : pct(d.targetPct)} · 区间 [${pct(d.minPct)}, ${pct(d.maxPct)}]` +
        (within ? "" : `<br/>${d.direction === "over" ? "超上限" : "低于下限"} ${(gap * 100).toFixed(1)} 个百分点`),
    },
    series: [
      { id: "band-base", type: "bar", stack: "band", data: [d.minPct], barWidth: 12, itemStyle: { color: "transparent" }, silent: true, tooltip: { show: false } },
      { id: "band-range", type: "bar", stack: "band", data: [Math.max(0, d.maxPct - d.minPct)], barWidth: 12, itemStyle: { color: `${accent}2e`, borderRadius: 3 }, silent: true, tooltip: { show: false } },
      {
        id: "band-actual",
        type: "bar",
        data: [d.actualPct],
        barWidth: 5,
        itemStyle: { color: barColor, borderRadius: 2 },
        markLine: d.targetPct === undefined ? undefined : {
          symbol: "none",
          silent: true,
          lineStyle: { type: "dashed", color: accent, width: 1 },
          label: { show: false },
          data: [{ xAxis: d.targetPct }],
        },
      },
    ],
  };
});
</script>

<style scoped>
.bullet-chart {
  width: 100%;
  height: 32px;
}
</style>
