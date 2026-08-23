<template>
  <div class="evidence-view">
    <!-- 演练接管全局数据：交易为演练模拟记录，不用于与来源 App 对账，须标注防误导 -->
    <el-alert v-if="isSimulator" type="info" :closable="false" show-icon title="牛熊演练进行中：本页交易为演练模拟记录"
      description="演练接管了系统全局数据（真实数据已退出，结束可一键恢复）；本页交易/摘要均按演练日历生成，不用于与天天基金逐笔对账。演练详情在复盘页「牛熊周期演练」卡。" class="section-alert" />
    <!-- 第一性结论 -->
    <el-card shadow="never" class="section verdict-card" :class="`verdict-${verdictLevel}`">
      <div class="verdict-kicker">数据状态</div>
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

    <!-- 摘要指标：核心数字直接可见，不做折叠（多一次点击才看到指标是多余交互） -->
    <el-card shadow="never" class="section summary-card">
      <template #header><span>摘要指标</span></template>
      <el-alert
        v-if="strength === 'INSUFFICIENT'"
        type="warning"
        title="当前证据不足，不能判断规则或策略是否有效"
        description="请先补齐账户、持仓、交易历史和每日盈亏；系统不会用缺失数据生成收益结论。"
        show-icon
        :closable="false"
      />
      <div v-else class="metric-grid">
        <div class="metric">
          <span class="metric-label">买入金额</span>
          <strong>{{ formatMoney(investedAmount) }}</strong>
          <el-button text size="small" class="metric-link" @click="toggleAuditDetails">{{ allAuditDetailsExpanded ? "收起全部" : "展开全部" }}</el-button>
        </div>
        <div class="metric"><span class="metric-label">每日盈亏合计</span><strong>{{ formatMoney(pnl) }}</strong></div>
      </div>
    </el-card>

    <!-- 折叠：可验证事实明细（计数 + 对账锚点 + 逐笔核对） -->
    <el-collapse v-model="factsActive">
      <el-collapse-item name="facts">
        <template #title>可验证事实明细（逐笔可核对）</template>
        <el-descriptions :column="1" border class="fact-counts">
          <el-descriptions-item label="交易记录">{{ transactions.length ? `已记录 ${transactions.length} 笔` : "暂无交易记录" }}</el-descriptions-item>
          <el-descriptions-item label="每日盈亏">{{ dailyPnl.length ? `已记录 ${dailyPnl.length} 个日点` : "暂无每日盈亏" }}</el-descriptions-item>
          <el-descriptions-item label="规则">{{ policies.length ? `已配置 ${policies.length} 条规则` : "暂无规则，无法比较规则执行情况" }}</el-descriptions-item>
          <el-descriptions-item label="规则偏离">{{ ruleDeviations ? `${ruleDeviations} 个待复核行为` : "暂未发现已记录的规则偏离" }}</el-descriptions-item>
        </el-descriptions>

        <!-- 对账锚点条：拿着来源 App 按月核对，不必逐页翻 -->
        <div v-if="ledger.total" class="audit-anchor">
          <div class="anchor-line">
            <span class="anchor-range">{{ ledger.firstDate }} → {{ ledger.lastDate }}</span>
            <span class="anchor-funds">共 {{ ledger.total }} 笔 · 涉及 {{ ledger.assetIds.length }} 只基金</span>
          </div>
          <div class="month-bars">
            <el-tooltip
              v-for="m in ledger.months" :key="m.month"
              :content="`${m.month}：共 ${m.count} 笔（买 ${m.buyCount} / 卖 ${m.sellCount}）`"
              placement="top" :show-after="80"
            >
              <div class="month-bar-col">
                <div class="month-bar">
                  <div v-if="m.count > 0 && m.buyCount + m.sellCount === 0" class="month-seg other" style="height: 3px"></div>
                  <div class="month-seg sell" :style="{ height: `${segHeight(m.sellCount)}px` }"></div>
                  <div class="month-seg buy" :style="{ height: `${segHeight(m.buyCount)}px` }"></div>
                </div>
                <span class="month-bar-label">{{ m.month.slice(5) }}</span>
              </div>
            </el-tooltip>
          </div>
          <p class="anchor-hint">
            <span class="legend"><span class="legend-swatch buy"></span>买入</span>
            <span class="legend"><span class="legend-swatch sell"></span>卖出</span>柱高为当月交易笔数；悬停查看当月明细。
          </p>
        </div>

        <!-- 二级折叠：逐笔核对 -->
        <el-collapse v-model="txDetailActive" class="inner-collapse">
          <el-collapse-item :title="`逐笔核对（${filteredRows.length} 笔）`" name="tx">
            <el-alert type="info" :closable="false" show-icon class="tx-note"
              title="只列来源采集记录的字段，供与来源 App 逐笔核对。"
            />
            <div class="tx-filters">
              <el-select v-model="filterAsset" clearable placeholder="全部基金" size="small" filterable style="width: 300px">
                <el-option v-for="a in ledger.assetIds" :key="a" :label="assetOptionLabel(a)" :value="a" />
              </el-select>
              <el-select v-model="filterType" clearable placeholder="全部方向" size="small" style="width: 140px">
                <el-option v-for="(label, value) in TYPE_LABEL" :key="value" :label="label" :value="value" />
              </el-select>
            </div>
            <el-table :data="pagedRows" size="small" border>
              <el-table-column prop="date" label="日期" width="106" sortable
                :sort-method="(a: TransactionLedgerRow, b: TransactionLedgerRow) => a.date.localeCompare(b.date)" />
              <el-table-column label="基金" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">{{ fundLabel(row.assetId, row.assetName) }}</template>
              </el-table-column>
              <el-table-column label="业务类型" width="130">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.type === 'BUY' ? 'danger' : row.type === 'SELL' ? 'success' : 'info'" effect="plain">{{ row.businessTypeText ?? TYPE_LABEL[row.type as TransactionTypeKey] ?? row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="金额" width="110" align="right">
                <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="确认金额" width="110" align="right">
                <template #default="{ row }">{{ row.confirmedAmount === undefined ? "—" : formatMoney(row.confirmedAmount) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="150">
                <template #default="{ row }">
                  <el-tag size="small" :type="STATUS_TAG[row.status as StatusKey]" effect="plain">{{ row.statusText ?? STATUS_LABEL[row.status as StatusKey] ?? row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="来源单号" min-width="120">
                <template #default="{ row }">
                  <span class="tx-source" :title="row.sourceTransactionId">{{ row.sourceTransactionId ? shorten(row.sourceTransactionId) : "—" }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-if="filteredRows.length > pageSize"
              v-model:current-page="page"
              :page-size="pageSize"
              :total="filteredRows.length"
              layout="total, prev, pager, next"
              size="small"
              class="tx-pagination"
            />
          </el-collapse-item>

          <!-- 二级折叠：买入金额构成（聚合黑盒变白盒；筛选与分页同逐笔核对） -->
          <el-collapse-item title="买入金额构成（聚合口径可追溯）" name="buy">
            <p class="buy-formula">买入金额 = 全部「买入」交易中状态非「失败 / 已撤销」的金额合计；有确认金额时优先取确认金额。下表列出每笔的参与情况。</p>
            <div class="tx-filters">
              <el-select v-model="buyFilterAsset" clearable placeholder="全部基金" size="small" filterable style="width: 300px">
                <el-option v-for="a in buyAssetIds" :key="a" :label="assetOptionLabel(a)" :value="a" />
              </el-select>
            </div>
            <el-table :data="pagedBuyRows" size="small" border>
              <el-table-column prop="date" label="日期" width="106" sortable
                :sort-method="(a: BuyCompositionRow, b: BuyCompositionRow) => a.date.localeCompare(b.date)" />
              <el-table-column label="基金" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">{{ fundLabel(row.assetId, row.assetName) }}</template>
              </el-table-column>
              <el-table-column label="取值" width="110" align="right">
                <template #default="{ row }">{{ formatMoney(row.usedValue) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="150">
                <template #default="{ row }">
                  <el-tag size="small" :type="STATUS_TAG[row.status as StatusKey]" effect="plain">{{ row.statusText ?? STATUS_LABEL[row.status as StatusKey] ?? row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="参与合计" width="96">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.included ? 'success' : 'info'" effect="plain">{{ row.included ? "参与" : "排除" }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-if="filteredBuyRows.length > buyPageSize"
              v-model:current-page="buyPage"
              :page-size="buyPageSize"
              :total="filteredBuyRows.length"
              layout="total, prev, pager, next"
              size="small"
              class="tx-pagination"
            />
            <p class="buy-total">合计（与上方指标一致）：{{ formatMoney(investedAmount) }} 元</p>
          </el-collapse-item>

          <!-- 二级折叠：每日盈亏核对 -->
          <el-collapse-item title="每日盈亏核对" name="pnlAudit">
            <template v-if="pnlAudit.pointCount">
              <el-descriptions :column="3" border size="small" class="pnl-audit-desc">
                <el-descriptions-item label="日期范围">{{ pnlAudit.firstDate }} ~ {{ pnlAudit.lastDate }}</el-descriptions-item>
                <el-descriptions-item label="日点数">{{ pnlAudit.pointCount }}</el-descriptions-item>
                <el-descriptions-item label="涉及基金">{{ pnlAudit.assetCount }} 只</el-descriptions-item>
              </el-descriptions>
              <el-alert
                v-if="pnlAudit.gaps.length"
                type="warning" :closable="false" show-icon class="pnl-gap-alert"
                :title="`检测到 ${pnlAudit.gaps.length} 段连续无记录区间`"
              >
                <div v-for="g in pnlAudit.gaps" :key="g.from" class="pnl-gap-row">{{ g.from }} ~ {{ g.to }}（{{ g.days }} 天）无记录</div>
                <div class="pnl-gap-note">仅陈述日期序列事实，不判断原因——周末、节假日与漏采在记录上无法区分。</div>
              </el-alert>
              <div class="pnl-recent-title">最近 5 个日点</div>
              <el-table :data="recentPnlPoints" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column label="净值" width="100" align="right">
                  <template #default="{ row }">{{ row.nav === undefined ? "—" : row.nav.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column label="当日盈亏（元）" align="right">
                  <template #default="{ row }"><span :class="row.pnl > 0 ? 'profit-positive' : row.pnl < 0 ? 'profit-negative' : ''">{{ formatMoney(row.pnl) }}</span></template>
                </el-table-column>
              </el-table>
            </template>
            <el-empty v-else description="暂无每日盈亏记录" :image-size="60" />
          </el-collapse-item>
        </el-collapse>
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
import { computed, ref, watch } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { buildAllocationDrift, buildTransactionLedger, buildDailyPnlAudit, type TransactionLedgerRow } from "../../investment/composables/selectors";
import type { CoverageDataset, DataCoverage, EvidenceStrength } from "../../investment/domain";

const { state } = useInvestmentOS();
const isSimulator = computed(() => state.account?.source === "sim");

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

const factsActive = ref<string[]>([]);
// ---- 明细核对（12.5）：计数 → 锚点 → 逐笔，证据下钻不断在计数层 ----
const ledger = computed(() => buildTransactionLedger(transactions.value, [...state.assets]));
const TYPE_LABEL: Record<string, string> = { BUY: "买入", SELL: "卖出", TRANSFER: "转入/转出", DIVIDEND: "分红", FEE: "费用", OTHER: "其他" };
type TransactionTypeKey = keyof typeof TYPE_LABEL;
const STATUS_LABEL: Record<string, string> = {
  requested: "已申请", partially_confirmed: "部分确认", confirmed: "已确认",
  failed: "失败", cancelled: "已撤销", unknown: "状态未知",
};
type StatusKey = keyof typeof STATUS_LABEL;
const STATUS_TAG: Record<string, "success" | "warning" | "danger" | "info"> = {
  requested: "warning", partially_confirmed: "warning", confirmed: "success",
  failed: "danger", cancelled: "info", unknown: "info",
};

const txDetailActive = ref<string[]>([]);
const filterAsset = ref<string>("");
const filterType = ref<string>("");
const page = ref(1);
const pageSize = 20;

const maxMonthCount = computed(() => Math.max(1, ...ledger.value.months.map((m) => m.count)));
/** 买/卖分段高度：各自按当月最大笔数归一，双色堆叠直接呈现买卖构成，不依赖悬停。 */
function segHeight(count: number): number {
  return count > 0 ? Math.max(3, Math.round((count / maxMonthCount.value) * 28)) : 0;
}
const filteredRows = computed(() => {
  const rows = filterAsset.value || filterType.value
    ? ledger.value.rows.filter((r) =>
        (!filterAsset.value || r.assetId === filterAsset.value) &&
        (!filterType.value || r.type === filterType.value))
    : ledger.value.rows;
  // 对账视角最近在前；页内再按日期升序逐笔核对也可以翻页查看历史。
  return [...rows].reverse();
});
const pagedRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize));

/** 基金下拉选项：六位数代码 + 名称（assetId 即代码；代码是跨 App 核对的稳定锚点）。 */
function assetOptionLabel(assetId: string): string {
  const name = ledger.value.rows.find((r) => r.assetId === assetId)?.assetName;
  return name && name !== assetId ? `${assetId} ${name}` : assetId;
}
/** 表格基金列：代码 + 名称（名称缺失时只显示代码，避免代码重复拼接）。 */
function fundLabel(assetId: string, assetName: string): string {
  return assetName && assetName !== assetId ? `${assetId} ${assetName}` : assetId;
}
function shorten(id: string): string {
  return id.length > 14 ? `${id.slice(0, 12)}…` : id;
}

/** 买入金额构成：参与/排除逐笔可见，聚合口径白盒化；状态为来源原文，排除与否可自解释。 */
interface BuyCompositionRow {
  assetId: string;
  date: string;
  assetName: string;
  usedValue: number;
  included: boolean;
  status: TransactionLedgerRow["status"];
  statusText?: string;
}
const buyComposition = computed<BuyCompositionRow[]>(() => ledger.value.rows
  .filter((r) => r.type === "BUY")
  .reverse()
  .map((r) => {
    const excluded = r.status === "failed" || r.status === "cancelled";
    return {
      assetId: r.assetId,
      date: r.date,
      assetName: r.assetName,
      usedValue: excluded ? 0 : (r.confirmedAmount ?? r.amount),
      included: !excluded,
      status: r.status,
      statusText: r.statusText,
    };
  }));

// 买入构成筛选与分页（与逐笔核对同款交互）；筛选变化时回到第一页，避免页码越界空表。
const buyFilterAsset = ref<string>("");
const buyPage = ref(1);
const buyPageSize = 20;
const buyAssetIds = computed(() =>
  [...new Set(buyComposition.value.map((r) => r.assetId))].sort());
const filteredBuyRows = computed(() =>
  buyComposition.value.filter((r) => !buyFilterAsset.value || r.assetId === buyFilterAsset.value));
const pagedBuyRows = computed(() =>
  filteredBuyRows.value.slice((buyPage.value - 1) * buyPageSize, buyPage.value * buyPageSize));
watch([filterAsset, filterType], () => { page.value = 1; });
watch(buyFilterAsset, () => { buyPage.value = 1; });

const AUDIT_DETAIL_NAMES = ["tx", "buy", "pnlAudit"] as const;
const allAuditDetailsExpanded = computed(() =>
  factsActive.value.includes("facts")
  && AUDIT_DETAIL_NAMES.every((name) => txDetailActive.value.includes(name))
);
/** 摘要指标入口统一控制完整核对链路：逐笔、买入金额构成、每日盈亏三块同时展开或收起。
 * 遇到用户手动形成的部分展开状态时，按钮执行“补齐全部”；仅在三块已全部展开时执行全部收起。
 * 不做滚动定位，页面位置由用户自己掌控。 */
function toggleAuditDetails(): void {
  if (allAuditDetailsExpanded.value) {
    txDetailActive.value = [];
    factsActive.value = [];
    return;
  }
  factsActive.value = ["facts"];
  txDetailActive.value = [...AUDIT_DETAIL_NAMES];
}

/** 每日盈亏核对：范围 / 点数 / 连续缺口（只陈述事实，不归因）。 */
const pnlAudit = computed(() => buildDailyPnlAudit(dailyPnl.value));
const recentPnlPoints = computed(() => [...dailyPnl.value]
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  .slice(0, 5));

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
      detail: [`事实：类型 ${a.type}，状态 ${a.status}`, a.detail, anchor, "可去待办页处理。"].filter(Boolean).join("；"),
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
.section-alert {
  margin-bottom: 4px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
.metric-link {
  justify-content: flex-start;
  padding: 0;
  font-size: 12px;
}
.fact-counts {
  margin-bottom: 12px;
}
.audit-anchor {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  margin-bottom: 8px;
}
.anchor-line {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}
.anchor-range {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.month-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  /* 柱体最大高度 28px + 标签行，给足垂直空间避免与上下文字叠压。 */
  min-height: 56px;
  padding: 0 2px 4px;
  box-sizing: border-box;
}
.month-bar-col {
  flex: 1;
  /* 不窄于两个月份标签宽度，避免相邻标签互相叠压。 */
  min-width: 14px;
  max-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}
.month-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 2px 2px 0 0;
  overflow: hidden;
}
.month-seg {
  width: 100%;
}
.month-seg.buy {
  background: var(--el-color-danger-light-5);
}
.month-seg.sell {
  background: var(--el-color-success-light-5);
}
.month-seg.other {
  background: var(--el-border-color);
}
.month-bar-col:hover .month-seg.buy {
  background: var(--el-color-danger-light-3);
}
.month-bar-col:hover .month-seg.sell {
  background: var(--el-color-success-light-3);
}
.legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
}
.legend-swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.legend-swatch.buy {
  background: var(--el-color-danger-light-5);
}
.legend-swatch.sell {
  background: var(--el-color-success-light-5);
}
.month-bar-label {
  font-size: 10px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  white-space: nowrap;
}
.anchor-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.inner-collapse {
  margin-top: 4px;
}
.inner-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 12px;
}
.tx-note {
  margin-bottom: 10px;
}
.tx-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.tx-source {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.buy-total {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.tx-pagination {
  margin-top: 10px;
  justify-content: flex-end;
}
.buy-formula {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.pnl-audit-desc {
  margin-bottom: 10px;
}
.pnl-gap-alert {
  margin-bottom: 10px;
}
.pnl-gap-row {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}
.pnl-gap-note {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pnl-recent-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 10px 0 8px;
}
.profit-positive {
  color: var(--el-color-danger);
}
.profit-negative {
  color: var(--el-color-success);
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
