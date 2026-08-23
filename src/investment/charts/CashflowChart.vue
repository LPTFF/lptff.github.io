<template>
  <div ref="container" class="cashflow-chart" :style="{ height }" />
</template>

<script setup lang="ts">
/**
 * 月度资金投入/流出柱状图（总览页）：红=投入（买入）、绿=流出（卖出）。
 * 金额口径与明细页「买入金额」一致（失败/撤销不计入，确认金额优先），
 * 色彩语义与明细页月度笔数柱一致（买红卖绿）。
 */
import { useChart, epColor } from "./useChart";
import type { MonthlyCashflowPoint } from "../composables/selectors";

const props = withDefaults(defineProps<{ series: MonthlyCashflowPoint[]; height?: string }>(), { height: "280px" });

const { container } = useChart(() => {
  const buyColor = epColor("--el-color-danger", "#f56c6c");
  const sellColor = epColor("--el-color-success", "#67c23a");
  const muted = epColor("--el-text-color-secondary", "#909399");
  const money = (n: number): string => n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    grid: { left: 8, right: 12, top: 32, bottom: 24, containLabel: true },
    legend: { top: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: muted, fontSize: 12 } },
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = props.series[params[0]?.dataIndex ?? 0];
        if (!p) return "";
        return `${p.month}<br/>投入（买入）：${money(p.buyAmount)} 元<br/>流出（卖出）：${money(p.sellAmount)} 元<br/>当月净投入：${money(p.buyAmount - p.sellAmount)} 元`;
      },
    },
    xAxis: {
      type: "category",
      data: props.series.map((p) => p.month),
      axisLabel: { formatter: (v: string) => v.slice(5), color: muted },
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: "#f0f2f5" } },
    },
    series: [
      {
        name: "投入（买入）",
        // 稳定 id：useChart 用 replaceMerge 替换 series，id 是差分依据。
        id: "cashflow-buy",
        type: "bar",
        data: props.series.map((p) => p.buyAmount),
        itemStyle: { color: buyColor },
        barMaxWidth: 28,
      },
      {
        name: "流出（卖出）",
        id: "cashflow-sell",
        type: "bar",
        data: props.series.map((p) => p.sellAmount),
        itemStyle: { color: sellColor },
        barMaxWidth: 28,
      },
    ],
  };
});
</script>

<style scoped>
.cashflow-chart {
  width: 100%;
}
</style>
