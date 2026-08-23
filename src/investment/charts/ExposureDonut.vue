<template>
  <div ref="container" class="exposure-donut" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 风险暴露环形图（12.5 G5）：替代进度条列表呈现构成占比；“（未标注）”固定灰色，
 * 与持仓页 unknownPct 提示联动；多标签跨维度不可相加的语义由父页说明。
 */
import { useChart, epColor } from "./useChart";

interface DonutSlice {
  value: string;
  pct: number;
  marketValue?: number;
}

const props = withDefaults(defineProps<{ slices: DonutSlice[]; height?: string }>(), { height: "260px" });

const PALETTE = ["#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399", "#9a67ea", "#48b8d0", "#b3d8ff"];

const { container } = useChart(() => {
  const muted = epColor("--el-text-color-secondary", "#909399");
  const money = (n: number | undefined): string =>
    n === undefined ? "—" : n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return {
    tooltip: {
      trigger: "item",
      formatter: (p: { dataIndex: number }) => {
        const s = props.slices[p.dataIndex];
        if (!s) return "";
        return `${s.value}<br/>占比 ${(s.pct * 100).toFixed(1)}%<br/>市值 ${money(s.marketValue)} 元`;
      },
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "center",
      icon: "circle",
      itemWidth: 8,
      textStyle: { color: epColor("--el-text-color-regular", "#606266"), fontSize: 12 },
    },
    series: [
      {
        id: "exposure-donut",
        type: "pie",
        radius: ["48%", "72%"],
        center: ["38%", "50%"],
        label: { show: false },
        data: props.slices.map((s, i) => ({
          name: s.value,
          value: Math.round(s.pct * 10000) / 100,
          itemStyle: s.value.includes("未标注")
            ? { color: "#c0c4cc" }
            : { color: PALETTE[i % PALETTE.length] },
        })),
      },
    ],
  };
});
</script>

<style scoped>
.exposure-donut {
  width: 100%;
}
</style>
