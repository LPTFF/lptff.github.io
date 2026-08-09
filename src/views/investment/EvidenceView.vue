<template>
  <div class="evidence-view">
    <el-card shadow="never" class="section">
      <template #header>
        <div class="card-head">
          <span>证据摘要</span>
          <el-tag :type="strengthTag" effect="plain">{{ strength }}</el-tag>
        </div>
      </template>
      <el-alert
        v-if="strength === 'INSUFFICIENT'"
        type="warning"
        title="当前证据不足，不能判断规则或策略是否有效"
        description="请先通过 Investment 插件补齐账户、持仓、交易历史和每日盈亏；系统不会用 Mock 数据或缺失数据生成收益结论。"
        show-icon
        :closable="false"
      />
      <div v-else class="metric-grid">
        <div class="metric"><span class="metric-label">观察期</span><strong>{{ observationPeriod }}</strong></div>
        <div class="metric"><span class="metric-label">交易执行</span><strong>{{ transactions.length }} 笔</strong></div>
        <div class="metric"><span class="metric-label">买入金额</span><strong>{{ formatMoney(investedAmount) }}</strong></div>
        <div class="metric"><span class="metric-label">每日盈亏合计</span><strong>{{ formatMoney(pnl) }}</strong></div>
      </div>
    </el-card>

    <el-card shadow="never" class="section">
      <template #header>可验证事实</template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="交易记录">{{ transactions.length ? `已记录 ${transactions.length} 笔` : "暂无交易记录" }}</el-descriptions-item>
        <el-descriptions-item label="每日盈亏">{{ dailyPnl.length ? `已记录 ${dailyPnl.length} 个日点` : "暂无每日盈亏" }}</el-descriptions-item>
        <el-descriptions-item label="规则">{{ policies.length ? `已配置 ${policies.length} 条规则` : "暂无规则，无法比较规则执行情况" }}</el-descriptions-item>
        <el-descriptions-item label="规则偏离">{{ ruleDeviations ? `${ruleDeviations} 个待复核行为` : "暂未发现已记录的规则偏离" }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="section">
      <template #header>数据覆盖与下一步</template>
      <el-empty v-if="!coverage.length" description="尚无覆盖记录，请先下载并安装 Investment 插件" />
      <div v-else class="coverage-list">
        <div v-for="item in coverage" :key="item.dataset" class="coverage-row">
          <span>{{ datasetLabel(item.dataset) }}</span>
          <el-tag :type="coverageTag(item.completeness)" size="small" effect="plain">{{ completenessLabel(item.completeness) }}</el-tag>
          <span class="coverage-warning">{{ item.warningCodes.join("；") || "无警告" }}</span>
        </div>
      </div>
      <p class="next-step">Evidence 只基于已导入的本地事实。出现部分或未知覆盖时，请回到天天基金补采集后重新读取插件数据。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import type { CoverageDataset, DataCoverage, EvidenceStrength } from "../../investment/domain";

const { state } = useInvestmentOS();

const transactions = computed(() => [...state.transactions]);
const dailyPnl = computed(() => [...state.dailyPnl]);
const coverage = computed(() => [...state.coverage]);
const policies = computed(() => [...state.policies]);
const investedAmount = computed(() => transactions.value
  .filter((tx) => tx.type === "BUY" && tx.status !== "FAILED")
  .reduce((sum, tx) => sum + (tx.confirmedAmount ?? tx.amount), 0));
const pnl = computed(() => dailyPnl.value.reduce((sum, point) => sum + point.pnl, 0));
const ruleDeviations = computed(() => state.actions.filter((action) =>
  action.type === "ABNORMAL_TRANSACTION" || action.type === "UNCLASSIFIED_TRANSACTION",
).length);

const observationPeriod = computed(() => {
  const dates = [
    ...transactions.value.map((tx) => tx.occurredAt.slice(0, 10)),
    ...dailyPnl.value.map((point) => point.date),
  ].sort();
  return dates.length ? `${dates[0]} ~ ${dates[dates.length - 1]}` : "未知";
});

const strength = computed<EvidenceStrength>(() => {
  if (!transactions.value.length || !dailyPnl.value.length) return "INSUFFICIENT";
  if (coverage.value.some((item) => item.completeness !== "complete")) return "WEAK";
  if (transactions.value.length < 3) return "WEAK";
  return "MODERATE";
});

const strengthTag = computed<"success" | "warning" | "danger" | "info">(() => ({
  INSUFFICIENT: "danger",
  WEAK: "warning",
  MODERATE: "success",
  STRONG: "success",
} as const)[strength.value]);

function formatMoney(value: number): string {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function datasetLabel(dataset: CoverageDataset): string {
  return { account: "账户", holdings: "持仓", dailyPnl: "每日盈亏", transactions: "交易历史", fundDetail: "基金详情" }[dataset];
}

function completenessLabel(value: DataCoverage["completeness"]): string {
  return { complete: "完整", partial: "部分", unknown: "未知" }[value];
}

function coverageTag(value: DataCoverage["completeness"]): "success" | "warning" | "info" {
  return ({ complete: "success", partial: "warning", unknown: "info" } as const)[value];
}
</script>

<style scoped>
.evidence-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section {
  width: 100%;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.coverage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.coverage-row {
  display: grid;
  grid-template-columns: 100px 70px 1fr;
  align-items: center;
  gap: 10px;
}
.coverage-warning,
.next-step {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.next-step {
  margin: 16px 0 0;
  line-height: 1.7;
}
</style>
