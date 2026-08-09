<template>
  <div class="fund-transaction">
    <el-empty v-if="!data || data.transactions.length === 0" description="暂无交易流水">
      <el-button type="primary" @click="goImport">去导入</el-button>
    </el-empty>
    <el-card v-else shadow="never">
      <template #header>交易流水</template>
      <el-table :data="data.transactions" stripe>
        <el-table-column prop="date" label="日期" width="140" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" effect="plain">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fundCode" label="基金代码" width="120" />
        <el-table-column prop="fundName" label="基金名称" min-width="180" />
        <el-table-column label="金额" align="right" width="160">
          <template #default="{ row }"> {{ fmt(row.amount) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { loadFundData } from "../../../utils/fund/fund-storage";

const router = useRouter();
const data = loadFundData();

function fmt(n: number) {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function typeText(t: string) {
  return { BUY: "买入", SELL: "卖出", DIVIDEND: "分红" }[t] || t;
}
function typeTag(t: string): "success" | "danger" | "warning" {
  return ({ BUY: "success", SELL: "danger", DIVIDEND: "warning" } as const)[t as "BUY"] || "warning";
}
function goImport() {
  router.push("/investment/legacy/import");
}
</script>

<style scoped></style>
