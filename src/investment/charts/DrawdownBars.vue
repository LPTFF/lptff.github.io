<template>
  <div ref="container" class="dd-bars" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 历史周期回撤对比条形图（12.5 G3a）：一次跑完全部周期后横向比较最大回撤，
 * 最脆弱置顶；≥20% 用 danger、其余 warning，只呈现引擎既有计算结果。
 */
import { computed } from "vue";
import { useChart, epColor } from "./useChart";
import type { CycleStressSummary } from "../engines/scenario/stress-test";

const props = withDefaults(
  defineProps<{ summaries: CycleStressSummary[]; height?: string }>(),
  { height: "300px" },
);

const sorted = computed(() =>
  [...props.summaries].sort((a, b) => b.maxDrawdownPct - a.maxDrawdownPct));

const { container } = useChart(() => {
  const danger = epColor("--el-color-danger", "#f56c6c");
  const warning = epColor("--el-color-warning", "#e6a23c");
  const muted = epColor("--el-text-color-secondary", "#909399");
  return {
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "item",
      appendTo: "body",
      formatter: (p: { dataIndex: number }) => {
        const s = sorted.value[p.dataIndex];
        if (!s) return "";
        return `${s.cycleLabel}<br/>最大回撤 ${(s.maxDrawdownPct * 100).toFixed(1)}%<br/>末态资产 ${s.endTotalAsset.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} 元<br/>末态偏离 ${s.breachedCount} 项`;
      },
    },
    xAxis: {
      type: "value",
      max: (v: { max: number }) => Math.ceil(v.max * 110) / 100,
      axisLabel: { color: muted, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
      splitLine: { lineStyle: { color: "#f0f2f5" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: sorted.value.map((s) => s.cycleLabel),
      axisLabel: { color: epColor("--el-text-color-regular", "#606266"), fontSize: 11 },
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { show: false },
    },
    series: [
      {
        id: "dd-bars",
        type: "bar",
        barWidth: 13,
        data: sorted.value.map((s) => ({
          value: s.maxDrawdownPct,
          itemStyle: { color: s.maxDrawdownPct >= 0.2 ? danger : warning, borderRadius: [0, 2, 2, 0] },
        })),
        label: {
          show: true,
          position: "right",
          color: muted,
          fontSize: 11,
          formatter: (p: { value: number }) => `${(p.value * 100).toFixed(1)}%`,
        },
      },
    ],
  };
});
</script>

<style scoped>
.dd-bars {
  width: 100%;
}
</style>
