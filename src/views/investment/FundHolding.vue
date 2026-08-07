<template>
  <div class="fund-holding">
    <el-empty v-if="!data || data.holdings.length === 0" description="暂无持仓数据">
      <el-button type="primary" @click="goImport">去导入</el-button>
    </el-empty>
    <el-card v-else shadow="never">
      <template #header>
        <div class="head">
          <span>持仓明细</span>
          <el-button :icon="Download" size="small" @click="exportExcel">导出 Excel</el-button>
        </div>
      </template>
      <el-table :data="data.holdings" stripe>
        <el-table-column prop="code" label="基金代码" width="120" />
        <el-table-column prop="name" label="基金名称" min-width="180" />
        <el-table-column label="当前金额" width="140" align="right">
          <template #default="{ row }"> {{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="累计收益" width="140" align="right">
          <template #default="{ row }">
            <span :class="profitClass(row.profit)"> {{ fmt(row.profit) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收益率" width="120" align="right">
          <template #default="{ row }">
            <span :class="profitClass(row.profitRate)">{{ row.profitRate.toFixed(2) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="仓位比例" width="200">
          <template #default="{ row }">
            <div class="ratio-cell">
              <el-progress :percentage="Math.min(100, row.ratio)" :stroke-width="8" />
              <span class="ratio-text">{{ row.ratio.toFixed(1) }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Download } from "@element-plus/icons-vue";
import { loadFundData } from "../../utils/fund/fund-storage";

const router = useRouter();
const data = loadFundData();

function fmt(n: number) {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function profitClass(n: number) {
  return n > 0 ? "up" : n < 0 ? "down" : "";
}
function goImport() {
  router.push("/investment/import");
}
async function exportExcel() {
  if (!data) return;
  try {
    const { exportObjectsToXlsx } = await import("../../utils/exportExcel");
    await exportObjectsToXlsx({
      data: data.holdings.map((h) => ({
        code: h.code,
        name: h.name,
        amount: h.amount,
        profit: h.profit,
        profitRate: h.profitRate,
        ratio: h.ratio,
      })),
      columns: [
        { header: "基金代码", key: "code", width: 14 },
        { header: "基金名称", key: "name", width: 24 },
        { header: "当前金额", key: "amount", width: 14 },
        { header: "累计收益", key: "profit", width: 14 },
        { header: "收益率(%)", key: "profitRate", width: 12 },
        { header: "仓位比例(%)", key: "ratio", width: 12 },
      ],
      sheetName: "持仓明细",
      fileName: `fund-holding-${data.updateTime || "export"}.xlsx`,
    });
    ElMessage.success("已导出");
  } catch (e) {
    ElMessage.error(`导出失败：${(e as Error).message}`);
  }
}
</script>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.up {
  color: var(--el-color-success);
}
.down {
  color: var(--el-color-danger);
}
.ratio-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ratio-text {
  width: 48px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>