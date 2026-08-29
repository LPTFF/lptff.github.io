<template>
  <el-table :data="rows" stripe size="small" :default-sort="{ prop: 'netPnl', order: 'descending' }">
    <el-table-column prop="label" label="维度" min-width="130" />
    <el-table-column prop="trades" label="样本" width="80" sortable />
    <el-table-column prop="winRatePct" label="胜率" width="100" sortable>
      <template #default="{ row }">{{ row.winRatePct.toFixed(1) }}%</template>
    </el-table-column>
    <el-table-column prop="netPnl" label="净盈亏" min-width="120" sortable>
      <template #default="{ row }">
        <span :class="row.netPnl >= 0 ? 'positive' : 'negative'">{{ row.netPnl.toFixed(2) }} USDT</span>
      </template>
    </el-table-column>
    <el-table-column prop="averagePnl" label="平均每笔" min-width="120" sortable>
      <template #default="{ row }">{{ row.averagePnl.toFixed(2) }} USDT</template>
    </el-table-column>
    <el-table-column prop="profitFactor" label="盈利因子" width="110" sortable>
      <template #default="{ row }">{{ factor(row.profitFactor) }}</template>
    </el-table-column>
    <el-table-column label="样本提示" min-width="130">
      <template #default="{ row }">
        <el-tag v-if="row.trades < 5" type="warning" size="small" effect="plain">小样本，仅作线索</el-tag>
        <el-tag v-else type="info" size="small" effect="plain">{{ row.trades }} 笔</el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import type { ContractPerformanceSlice } from "../../../crypto/domain";

defineProps<{ rows: ContractPerformanceSlice[] }>();

function factor(value: number | undefined): string {
  if (value === undefined) return "—";
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}
</script>

<style scoped>
.positive{color:var(--el-color-success);font-weight:600}.negative{color:var(--el-color-danger);font-weight:600}
</style>
