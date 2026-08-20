<template>
  <div class="evidence-view">
    <!-- 第一性结论 -->
    <el-card shadow="never" class="section verdict-card" :class="`verdict-${verdictLevel}`">
      <div class="verdict-kicker">证据状态</div>
      <h2>{{ verdictTitle }}</h2>
      <p>{{ verdictDesc }}</p>
      <div class="verdict-meta">
        <span class="meta-item">观察期：<strong>{{ observationPeriod }}</strong></span>
        <span class="meta-item">交易执行：<strong>{{ transactions.length }} 笔</strong></span>
      </div>
    </el-card>

    <!-- 需关注：覆盖缺口 -->
    <el-card v-if="coverageGaps.length" shadow="never" class="section gap-card">
      <template #header><span>数据覆盖缺口（{{ coverageGaps.length }} 个）</span></template>
      <div class="gap-list">
        <div v-for="item in coverageGaps" :key="item.dataset" class="gap-row">
          <span class="gap-name">{{ datasetLabel(item.dataset) }}</span>
          <el-tag :type="coverageTag(item.completeness)" size="small" effect="plain">{{ completenessLabel(item.completeness) }}</el-tag>
          <span class="gap-warning">{{ item.warningCodes.join("；") || "无警告" }}</span>
        </div>
      </div>
      <p class="gap-next">出现部分或未知覆盖时，请回到天天基金补采集后重新读取插件数据。</p>
    </el-card>

    <!-- 折叠：证据摘要指标 -->
    <el-collapse v-model="summaryActive">
      <el-collapse-item title="证据摘要指标" name="summary">
        <el-alert
          v-if="strength === 'INSUFFICIENT'"
          type="warning"
          title="当前证据不足，不能判断规则或策略是否有效"
          description="请先补齐账户、持仓、交易历史和每日盈亏；系统不会用缺失数据生成收益结论。"
          show-icon
          :closable="false"
        />
        <div v-else class="metric-grid">
          <div class="metric"><span class="metric-label">买入金额</span><strong>{{ formatMoney(investedAmount) }}</strong></div>
          <div class="metric"><span class="metric-label">每日盈亏合计</span><strong>{{ formatMoney(pnl) }}</strong></div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 折叠：可验证事实 -->
    <el-collapse v-model="factsActive">
      <el-collapse-item title="可验证事实明细" name="facts">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="交易记录">{{ transactions.length ? `已记录 ${transactions.length} 笔` : "暂无交易记录" }}</el-descriptions-item>
          <el-descriptions-item label="每日盈亏">{{ dailyPnl.length ? `已记录 ${dailyPnl.length} 个日点` : "暂无每日盈亏" }}</el-descriptions-item>
          <el-descriptions-item label="规则">{{ policies.length ? `已配置 ${policies.length} 条规则` : "暂无规则，无法比较规则执行情况" }}</el-descriptions-item>
          <el-descriptions-item label="规则偏离">{{ ruleDeviations ? `${ruleDeviations} 个待复核行为` : "暂未发现已记录的规则偏离" }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>

    <!-- 结论风险点事实解释：把复盘结论里有风险的点用事实逐条解释（不是揣测） -->
    <el-card v-if="riskFindingEntries.length" shadow="never" class="section risk-card">
      <template #header><span>结论风险点解释（按事实）</span></template>
      <el-alert type="info" :closable="false" show-icon class="risk-note"
        title="每条风险点只列支撑它的事实与可核实锚点，不下买卖结论。"
      />
      <div v-for="(r, i) in riskFindingEntries" :key="i" class="risk-entry">
        <div class="risk-title">{{ r.title }}</div>
        <div class="risk-detail">{{ r.detail }}</div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { buildAllocationDrift } from "../../investment/composables/selectors";
import type { CoverageDataset, DataCoverage, EvidenceStrength } from "../../investment/domain";

const { state } = useInvestmentOS();

const transactions = computed(() => [...state.transactions]);
const dailyPnl = computed(() => [...state.dailyPnl]);
const coverage = computed(() => [...state.coverage]);
const policies = computed(() => [...state.policies]);
const investedAmount = computed(() => transactions.value
  .filter((tx) => tx.type === "BUY" && tx.status !== "failed" && tx.status !== "cancelled")
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

const verdictLevel = computed<"insufficient" | "weak" | "moderate">(() =>
  strength.value === "INSUFFICIENT" ? "insufficient" : strength.value === "WEAK" ? "weak" : "moderate");
const verdictTitle = computed(() => ({
  INSUFFICIENT: "证据不足，不能判断",
  WEAK: "证据偏弱，结论需谨慎",
  MODERATE: "证据中等，可支撑机械检查",
  STRONG: "证据充分",
} as const)[strength.value]);
const verdictDesc = computed(() => {
  if (strength.value === "INSUFFICIENT") return "请先补齐账户、持仓、交易历史和每日盈亏；系统不会用缺失数据生成收益结论。";
  if (strength.value === "WEAK") return "部分覆盖或样本不足；可展开查看缺口与可验证事实。";
  return "证据足以支撑机械检查；可展开查看摘要指标与可验证事实。";
});

const coverageGaps = computed(() => coverage.value.filter((c) => c.completeness !== "complete"));

const summaryActive = ref<string[]>([]);
const factsActive = ref<string[]>([]);

// 结论风险点事实解释：把复盘结论里有风险的点（配置偏离 + 待处理事项）逐条用事实解释，
// 含支撑事实、规则依据、可核实去向——不揣测、不下买卖结论。
const allocationDrift = computed(() =>
  state.portfolio ? buildAllocationDrift(state.activeVersions, state.strategyRuleVersions, state.portfolio, state.assets) : [],
);
const transactionById = computed(() => new Map(transactions.value.map((tx) => [tx.id, tx])));
const assetNameById = computed(() => new Map(state.assets.map((asset) => [asset.assetId, asset.name || asset.assetId])));
const riskFindingEntries = computed(() => {
  const out: { title: string; detail: string }[] = [];
  for (const d of allocationDrift.value.filter((x) => x.direction !== "within")) {
    const dir = d.direction === "over" ? "超上限" : "低下限";
    const basis = d.rationale ? `${d.rationale.intent}（理论：${d.rationale.theoryRef}）` : "未关联理论依据";
    out.push({
      title: `配置偏离：${d.label}`,
      detail: `事实：实际 ${(d.actualPct * 100).toFixed(1)}%，声明区间 [${(d.minPct * 100).toFixed(1)}%, ${(d.maxPct * 100).toFixed(1)}%]，${dir}。规则依据：${basis}；可去复盘页核对偏离项。`,
    });
  }
  for (const a of state.actions.filter((x) => x.status === "open")) {
    const tx = a.transactionId ? transactionById.value.get(a.transactionId) : undefined;
    const anchor = tx
      ? `锚点：${tx.occurredAt.slice(0, 10)}，${assetNameById.value.get(tx.assetId) || tx.assetId}，${tx.type} ${formatMoney(tx.amount)} ${tx.amountUnit}，流水 ${tx.sourceTransactionId || tx.id}`
      : "";
    out.push({
      title: `待处理事项：${a.title || a.type}`,
      detail: [`事实：类型 ${a.type}，状态 ${a.status}`, a.detail, anchor, "可去行动页处理。"].filter(Boolean).join("；"),
    });
  }
  return out;
});

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
  gap: 12px;
}
.section {
  width: 100%;
}
.verdict-card {
  border-left: 4px solid var(--el-color-success);
}
.verdict-moderate {
  border-left-color: var(--el-color-success);
}
.verdict-weak {
  border-left-color: var(--el-color-warning);
}
.verdict-insufficient {
  border-left-color: var(--el-color-danger);
}
.verdict-kicker {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.verdict-card h2 {
  margin: 4px 0 6px;
  font-size: 20px;
}
.verdict-card p {
  margin: 0 0 10px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.verdict-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.gap-card {
  border-left: 3px solid var(--el-color-warning);
}
.gap-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gap-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  font-size: 13px;
}
.gap-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 80px;
}
.gap-warning {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.gap-next {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.risk-card {
  border-left: 3px solid var(--el-color-warning);
}
.risk-note {
  margin-bottom: 10px;
}
.risk-entry {
  padding: 8px 10px;
  margin-top: 8px;
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
  font-size: 13px;
  line-height: 1.6;
}
.risk-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}
.risk-detail {
  color: var(--el-text-color-regular);
}
</style>
