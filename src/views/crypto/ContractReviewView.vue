<template>
  <section class="contract-review">
    <header class="hero">
      <div>
        <p class="eyebrow">Investment OS · Binance Futures</p>
        <div class="title-row">
          <h2>合约复盘助手</h2>
          <el-tag :type="statusTag.type" effect="dark">{{ statusTag.text }}</el-tag>
        </div>
        <p>只打扰重大风险：先拦住下一次不可承受的错误，再把复盘结论变成下次开仓前的硬规则。</p>
      </div>
      <div class="actions">
        <el-button type="primary" @click="openDeepAnalysis">交给 ChatGPT 深度分析</el-button>
        <el-button :loading="busy" :disabled="pending" @click="collect">更新数据</el-button>
      </div>
    </header>

    <el-alert :title="message" :type="messageType" :closable="false" show-icon />

    <section v-if="!latest" class="empty-state">
      <div>
        <strong>先导入一份来源数据，系统才能机械复盘</strong>
        <p>真实账户建议通过插件只读采集；内置脱敏快照仅用于体验完整流程。</p>
      </div>
      <el-button type="primary" plain :loading="busy" @click="importBundledSnapshot">
        导入内置脱敏快照（2026-08-24）
      </el-button>
    </section>

    <template v-else>
      <section class="verdict-strip" :class="{ negative: (review?.analysis.expectancy ?? 0) < 0 }">
        <div>
          <p class="eyebrow">自动结论 · {{ review?.metrics.closedPositions ?? 0 }} 笔已平仓样本</p>
          <h3>{{ automaticVerdict.title }}</h3>
          <p>{{ automaticVerdict.detail }}</p>
        </div>
        <el-button type="primary" size="large" @click="openDeepAnalysis">让 ChatGPT 做归因与规则压缩</el-button>
      </section>

      <div class="quick-metrics">
        <el-card shadow="never"><span>净盈亏</span><strong :class="pnlClass(review?.metrics.netPnl)">{{ money(review?.metrics.netPnl ?? 0) }}</strong></el-card>
        <el-card shadow="never"><span>Profit Factor</span><strong>{{ ratio(review?.analysis.profitFactor) }}</strong><small>每亏 1 USDT 能赚多少</small></el-card>
        <el-card shadow="never"><span>单笔期望</span><strong :class="pnlClass(review?.analysis.expectancy)">{{ money(review?.analysis.expectancy ?? 0) }}</strong><small>比胜率更接近策略质量</small></el-card>
        <el-card shadow="never"><span>盈亏比</span><strong>{{ ratio(review?.analysis.payoffRatio) }}</strong><small>平均盈利 ÷ 平均亏损</small></el-card>
        <el-card shadow="never"><span>最大回撤</span><strong class="danger-text">{{ money(review?.analysis.maximumDrawdown ?? 0) }}</strong><small>{{ pct(review?.analysis.maximumDrawdownPct) }} 可识别权益</small></el-card>
        <el-card shadow="never"><span>最差5笔平均亏损</span><strong class="danger-text">{{ money(review?.analysis.worstFiveAverageLoss ?? 0) }}</strong><small>观察尾部而非平均值</small></el-card>
        <el-card shadow="never"><span>手续费侵蚀</span><strong>{{ pct(review?.analysis.feeDragPct) }}</strong><small>{{ money(review?.analysis.totalTradingFees ?? 0) }}</small></el-card>
        <el-card shadow="never"><span>历史止损保护率</span><strong>{{ pct(review?.analysis.stopProtectedClosedPct) }}</strong><small>时间窗内可识别保护单</small></el-card>
      </div>

      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane name="risk">
          <template #label><span>数据结论 <el-badge v-if="review?.findings.length" :value="review.findings.length" /></span></template>

          <section class="analysis-grid">
            <el-card shadow="never" class="curve-card">
              <template #header><div><strong>累计盈亏与回撤</strong><small>按平仓时间累计；用于定位损失集中阶段</small></div></template>
              <svg viewBox="0 0 600 170" role="img" aria-label="累计盈亏曲线">
                <line x1="20" y1="145" x2="580" y2="145" class="axis" />
                <polyline v-if="equityCurvePoints" :points="equityCurvePoints" class="equity-line" />
              </svg>
              <div class="curve-summary">
                <span>盈利交易合计 <b class="positive-text">{{ money(review?.analysis.grossProfit ?? 0) }}</b></span>
                <span>亏损交易合计 <b class="danger-text">{{ money(review?.analysis.grossLoss ?? 0) }}</b></span>
                <span>盈利日 <b>{{ pct(review?.analysis.profitableDaysPct) }}</b></span>
                <span>最差日 <b class="danger-text">{{ money(review?.analysis.worstDayPnl ?? 0) }}</b></span>
              </div>
            </el-card>

            <el-card shadow="never">
              <template #header><div><strong>持仓行为差异</strong><small>盈利与亏损交易是否使用了不同节奏</small></div></template>
              <div class="behavior-compare">
                <div><span>平均持仓</span><strong>{{ duration(review?.analysis.averageHoldingMinutes) }}</strong></div>
                <div><span>盈利交易</span><strong class="positive-text">{{ duration(review?.analysis.winningHoldingMinutes) }}</strong></div>
                <div><span>亏损交易</span><strong class="danger-text">{{ duration(review?.analysis.losingHoldingMinutes) }}</strong></div>
                <div><span>最长连亏</span><strong>{{ review?.metrics.maxLossStreak ?? 0 }} 笔</strong></div>
              </div>
            </el-card>
          </section>

          <el-card shadow="never" class="dimension-card">
            <template #header><div><strong>哪里赚钱，哪里亏钱</strong><small>标的、方向、持仓时长、时段和星期自动分组；小样本只作线索</small></div></template>
            <el-tabs v-model="dimensionTab">
              <el-tab-pane label="标的" name="symbol"><PerformanceTable :rows="review?.analysis.bySymbol ?? []" /></el-tab-pane>
              <el-tab-pane label="方向" name="direction"><PerformanceTable :rows="review?.analysis.byDirection ?? []" /></el-tab-pane>
              <el-tab-pane label="持仓时长" name="holding"><PerformanceTable :rows="review?.analysis.byHoldingPeriod ?? []" /></el-tab-pane>
              <el-tab-pane label="开仓时段" name="session"><PerformanceTable :rows="review?.analysis.byTradingSession ?? []" /></el-tab-pane>
              <el-tab-pane label="星期" name="weekday"><PerformanceTable :rows="review?.analysis.byWeekday ?? []" /></el-tab-pane>
            </el-tabs>
          </el-card>

          <div v-if="review?.findings.length" class="section-heading">
            <div><p class="eyebrow">确定性风险</p><h3>{{ review.findings.length }} 个高价值异常</h3></div>
            <span>无需逐项确认；系统直接带入 ChatGPT 分析事实包</span>
          </div>
          <el-card v-for="item in review?.findings ?? []" :key="item.id" shadow="never" class="finding-card" :class="'priority-' + item.priority">
            <div class="finding-head"><div><el-tag :type="priorityTag(item.priority)" size="small">{{ priorityLabel(item.priority) }}</el-tag><strong>{{ item.title }}</strong></div></div>
            <p>{{ item.summary }}</p>
            <div class="rule-line"><b>可拦截规则：</b>{{ item.nextRule }}</div>
          </el-card>

          <el-collapse class="advanced-rules">
            <el-collapse-item title="高级：调整交易风险边界（默认无需操作）">
              <el-form label-position="top" size="small">
                <div class="rule-grid">
                  <el-form-item label="最大杠杆"><el-input-number v-model="management.rules.maxLeverage" :min="1" :max="125" /></el-form-item>
                  <el-form-item label="单笔最大止损（权益%）"><el-input-number v-model="management.rules.maxRiskPerTradePct" :min="0.1" :max="20" :step="0.1" /></el-form-item>
                  <el-form-item label="账户损失保护线（权益%）"><el-input-number v-model="management.rules.maxDailyLossPct" :min="0.5" :max="30" :step="0.5" /></el-form-item>
                  <el-form-item label="单笔保证金上限（权益%）"><el-input-number v-model="management.rules.maxMarginPerTradePct" :min="1" :max="100" /></el-form-item>
                  <el-form-item label="单标的暴露上限（权益%）"><el-input-number v-model="management.rules.maxSymbolExposurePct" :min="1" :max="100" /></el-form-item>
                  <el-form-item label="连续亏损暂停阈值"><el-input-number v-model="management.rules.maxConsecutiveLosses" :min="1" :max="20" /></el-form-item>
                </div>
                <el-button type="primary" @click="saveRules">保存并重新计算</el-button>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>

        <el-tab-pane label="交易前检查" name="preflight">
          <section class="preflight-layout">
            <el-card shadow="never">
              <template #header><div><strong>开仓前 30 秒检查</strong><p>只输入这笔交易的关键参数；任何硬约束不满足都直接阻断。</p></div></template>
              <el-form label-position="top">
                <div class="form-grid">
                  <el-form-item label="合约"><el-input v-model="preflight.symbol" placeholder="ETHUSDT" /></el-form-item>
                  <el-form-item label="方向"><el-segmented v-model="preflight.direction" :options="['LONG', 'SHORT']" /></el-form-item>
                  <el-form-item label="账户权益（USDT）"><el-input-number v-model="preflight.accountEquity" :min="0" :precision="2" /></el-form-item>
                  <el-form-item label="杠杆"><el-input-number v-model="preflight.leverage" :min="1" :max="125" /></el-form-item>
                  <el-form-item label="入场价"><el-input-number v-model="preflight.entryPrice" :min="0" :precision="6" /></el-form-item>
                  <el-form-item label="数量"><el-input-number v-model="preflight.quantity" :min="0" :precision="6" /></el-form-item>
                  <el-form-item label="止损价"><el-input-number v-model="preflight.stopPrice" :min="0" :precision="6" /></el-form-item>
                  <el-form-item label="止盈价（可选）"><el-input-number v-model="preflight.takeProfitPrice" :min="0" :precision="6" /></el-form-item>
                  <el-form-item label="当前该标的暴露（权益%）"><el-input-number v-model="preflight.currentSymbolExposurePct" :min="0" :max="100" /></el-form-item>
                  <el-form-item label="当前持仓数"><el-input-number v-model="preflight.currentOpenPositions" :min="0" :max="100" /></el-form-item>
                  <el-form-item label="当前连续亏损"><el-input-number v-model="preflight.consecutiveLosses" :min="0" :max="100" /></el-form-item>
                </div>
                <el-form-item label="交易理由、失效条件、不交易条件"><el-input v-model="preflight.thesis" type="textarea" :rows="3" /></el-form-item>
                <el-button type="danger" size="large" class="full-button" @click="runPreflight">运行重大失误拦截</el-button>
              </el-form>
            </el-card>

            <el-card v-if="preflightResult" shadow="never" class="result-card" :class="'verdict-' + preflightResult.verdict">
              <template #header>
                <div class="verdict-head"><div><p class="eyebrow">检查结论</p><h3>{{ verdictTitle(preflightResult.verdict) }}</h3></div><el-tag :type="verdictType(preflightResult.verdict)" effect="dark">{{ preflightResult.verdict.toUpperCase() }}</el-tag></div>
              </template>
              <div class="result-metrics">
                <span>名义价值 <b>{{ money(preflightResult.notional) }}</b></span>
                <span>保证金 <b>{{ money(preflightResult.initialMargin) }}</b></span>
                <span>止损风险 <b>{{ preflightResult.riskPct?.toFixed(2) ?? '—' }}%</b></span>
                <span>盈亏比 <b>{{ preflightResult.rewardRiskRatio?.toFixed(2) ?? '—' }}</b></span>
              </div>
              <div v-for="item in preflightResult.checks" :key="item.id" class="check-row" :class="'check-' + item.severity">
                <span>{{ checkIcon(item.severity) }}</span><div><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></div>
              </div>
            </el-card>
          </section>
        </el-tab-pane>

        <el-tab-pane label="来源与采集" name="source">
          <section class="source-actions">
            <div><strong>只读来源台账</strong><p>采集不发起交易；核心判断只消费已导入的本地快照。</p></div>
            <div>
              <el-button v-if="pending" :disabled="busy" @click="discard">丢弃插件暂存</el-button>
              <el-button @click="exportLatest(false)">导出正式来源包</el-button>
              <el-button @click="exportLatest(true)">导出脱敏来源包</el-button>
            </div>
          </section>
          <div v-if="branchList.length" class="branches">
            <div v-for="branch in branchList" :key="branch.label" class="branch">
              <span>{{ branch.label }}</span><strong>{{ branchStatus(branch.status) }}{{ branch.total ? ' · ' + branch.total : '' }}</strong>
              <small v-if="branch.pageCount || branch.windowsTotal">{{ branch.pageCount ? branch.pageCount + ' 页' : '' }}{{ branch.windowsTotal ? ' · ' + (branch.windowsCompleted || 0) + '/' + branch.windowsTotal + ' 段' : '' }}</small>
            </div>
          </div>
          <div class="source-meta"><span>采集于 {{ formatTime(latest.capturedAt) }}</span><span>本地留存 {{ archiveCount }} 批</span><span>协议 {{ latest.protocol }}</span></div>
          <div class="coverage">
            <el-tag v-for="item in latest.coverage" :key="item.dataset" :type="item.completeness === 'complete' ? 'success' : 'warning'">{{ item.dataset }}：{{ item.completeness }} {{ item.completeRecordCount ?? 0 }}/{{ item.recordCount ?? 0 }}</el-tag>
          </div>
          <el-collapse>
            <el-collapse-item title="查看持仓历史（最多 100 条）">
              <el-table :data="latest.positionHistory.slice(0, 100)" stripe>
                <el-table-column prop="symbol" label="合约" /><el-table-column prop="positionSide" label="方向" /><el-table-column prop="leverage" label="杠杆" /><el-table-column prop="averageOpenPrice" label="开仓均价" /><el-table-column prop="averageClosePrice" label="平仓均价" /><el-table-column prop="closingPnl" label="平仓盈亏" />
              </el-table>
            </el-collapse-item>
            <el-collapse-item title="查看订单历史（最多 100 条）">
              <el-table :data="latest.orderHistory.slice(0, 100)" stripe>
                <el-table-column prop="symbol" label="合约" /><el-table-column prop="side" label="买卖" /><el-table-column prop="positionSide" label="方向" /><el-table-column prop="type" label="类型" /><el-table-column prop="status" label="状态" /><el-table-column prop="executedQuantity" label="成交数量" />
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>
      </el-tabs>

      <el-dialog v-model="deepAnalysis.visible" title="交给 ChatGPT 的深度分析事实包" width="760px">
        <el-alert type="info" :closable="false" show-icon title="统计由本地确定性引擎完成，复杂归因交给 ChatGPT" description="事实包已包含收益质量、尾部风险、行为维度、规则异常、数据边界和明确输出格式；不会自动上传，只有你主动复制或打开 ChatGPT。" />
        <el-input v-model="deepAnalysis.text" type="textarea" :rows="24" readonly class="context-text" />
        <template #footer>
          <el-button @click="copyDeepAnalysis">复制事实包</el-button>
          <el-button type="primary" @click="openChatGpt">复制并打开 ChatGPT</el-button>
        </template>
      </el-dialog>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { toContractReviewDataset } from "../../crypto/adapter";
import type { BinanceSourceCapture, ContractReviewDataset, ContractReviewManagementState, ContractRiskPriority, TradePreflightInput, TradePreflightResult } from "../../crypto/domain";
import { acknowledgeBinanceStaging, discardBinanceStaging, getBinanceStaging, getBinanceStatus, startBinanceCollection } from "../../crypto/extension-sync";
import { ContractReviewLedger } from "../../crypto/ledger";
import { computeContractReview, evaluateTradePreflight } from "../../crypto/review-engine";
import { buildContractReviewContext } from "../../crypto/review-context";
import { loadContractReviewManagementState, saveContractReviewManagementState } from "../../crypto/review-store";
import PerformanceTable from "./components/PerformanceTable.vue";
import bundledSnapshotUrl from "../../../project-support/data-snapshots/crypto/binance-source-desensitized.json?url";

interface Branch { label: string; status: string; total: number; pageCount?: number; windowsCompleted?: number; windowsTotal?: number }
interface ExtensionStatus { pending: boolean; collection?: { running: boolean; branches?: Record<string, Branch> } }

const ledger = new ContractReviewLedger();
const latest = ref<ContractReviewDataset>();
const archiveCount = ref(0);
const pending = ref(false);
const busy = ref(false);
const activeTab = ref("risk");
const dimensionTab = ref("symbol");
const message = ref("正在检查插件与本地台账…");
const messageType = ref<"info" | "success" | "warning" | "error">("info");
const branchList = ref<Branch[]>([]);
const management = reactive<ContractReviewManagementState>(loadContractReviewManagementState());
const preflight = reactive<TradePreflightInput>({
  symbol: "ETHUSDT", direction: "LONG", leverage: management.rules.maxLeverage, accountEquity: 0,
  entryPrice: 0, stopPrice: undefined, takeProfitPrice: undefined, quantity: 0,
  currentSymbolExposurePct: 0, currentOpenPositions: 0, consecutiveLosses: 0, thesis: "",
});
const preflightResult = ref<TradePreflightResult>();
const deepAnalysis = reactive({ visible: false, text: "" });

const review = computed(() => latest.value ? computeContractReview(latest.value, management.rules) : undefined);
const urgentFindings = computed(() => review.value?.findings.filter((item) => item.priority === "critical" || item.priority === "high") ?? []);
const statusTag = computed<{ text: string; type: "success" | "danger" | "warning" | "info" }>(() => {
  if (!latest.value) return { text: "等待数据", type: "info" };
  if (review.value?.findings.some((item) => item.priority === "critical")) return { text: "存在开仓阻断项", type: "danger" };
  if (review.value?.findings.length) return { text: review.value.findings.length + " 项异常", type: "warning" };
  return { text: "本轮无需处理", type: "success" };
});
const automaticVerdict = computed(() => {
  if (!review.value || review.value.metrics.closedPositions < 10) {
    return { title: "样本不足，先不要评价策略", detail: "当前已平仓样本不足 10 笔，只展示事实，不做稳定性判断。" };
  }
  const { analysis, metrics } = review.value;
  if (analysis.expectancy < 0 || (analysis.profitFactor ?? 0) < 1) {
    return {
      title: "这套交易方式当前是负期望，继续放大仓位只会放大亏损",
      detail: "胜率 " + metrics.winRatePct.toFixed(1) + "%，Profit Factor " + ratio(analysis.profitFactor)
        + "，每笔期望 " + money(analysis.expectancy) + "，最大回撤 " + money(analysis.maximumDrawdown) + "。",
    };
  }
  if ((analysis.profitFactor ?? 0) < 1.2 || (analysis.payoffRatio ?? 0) < 1) {
    return {
      title: "统计优势很薄，少数尾部亏损足以抹掉大量小盈利",
      detail: "Profit Factor " + ratio(analysis.profitFactor) + "，盈亏比 " + ratio(analysis.payoffRatio)
        + "，每笔期望 " + money(analysis.expectancy) + "；当前不适合通过提高杠杆扩大收益。",
    };
  }
  return {
    title: "历史样本为正期望，但仍需控制尾部损失",
    detail: "Profit Factor " + ratio(analysis.profitFactor) + "，每笔期望 " + money(analysis.expectancy)
      + "；最差 5 笔平均亏损 " + money(analysis.worstFiveAverageLoss) + "。",
  };
});
const equityCurvePoints = computed(() => {
  const points = review.value?.analysis.equityCurve ?? [];
  if (points.length < 2) return "";
  const values = points.map((item) => item.cumulativePnl);
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 0);
  const range = Math.max(1, maximum - minimum);
  return points.map((item, index) => {
    const x = 20 + index / (points.length - 1) * 560;
    const y = 145 - (item.cumulativePnl - minimum) / range * 120;
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
});

function priorityLabel(priority: ContractRiskPriority): string { return { critical: "阻断", high: "高风险", medium: "需复盘", info: "提示" }[priority]; }
function priorityTag(priority: ContractRiskPriority): "danger" | "warning" | "info" {
  if (priority === "critical") return "danger";
  if (priority === "high" || priority === "medium") return "warning";
  return "info";
}
function verdictTitle(verdict: TradePreflightResult["verdict"]): string { return { blocked: "不要执行：先修改交易计划", review: "可继续复核，但仍有警告", pass: "通过硬约束检查" }[verdict]; }
function verdictType(verdict: TradePreflightResult["verdict"]): "danger" | "warning" | "success" { return ({ blocked: "danger", review: "warning", pass: "success" } as const)[verdict]; }
function checkIcon(severity: "block" | "warn" | "pass"): string { return { block: "✕", warn: "!", pass: "✓" }[severity]; }
function formatTime(value: string | number): string { return value ? new Date(value).toLocaleString("zh-CN") : "—"; }
function money(value: number): string { return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) + " USDT"; }
function ratio(value: number | undefined): string {
  if (value === undefined) return "—";
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}
function pct(value: number | undefined): string { return value === undefined ? "—" : value.toFixed(1) + "%"; }
function duration(value: number | undefined): string {
  if (value === undefined) return "—";
  if (value < 60) return value.toFixed(0) + " 分钟";
  return (value / 60).toFixed(1) + " 小时";
}
function pnlClass(value: number | undefined): string { return (value ?? 0) >= 0 ? "positive-text" : "danger-text"; }
function branchStatus(value: string): string { return ({ pending: "等待", running: "进行中", completed: "完成", partial: "部分完成" } as Record<string, string>)[value] || value; }
function persistManagement(): void { saveContractReviewManagementState(management); }
function saveRules(): void {
  persistManagement();
  preflight.leverage = Math.min(preflight.leverage, management.rules.maxLeverage);
  message.value = "风险规则已保存，并已用新规则重新复盘。";
  messageType.value = "success";
}
function runPreflight(): void {
  preflight.symbol = preflight.symbol.trim().toUpperCase();
  preflightResult.value = evaluateTradePreflight({ ...preflight }, management.rules);
  management.preflightHistory.unshift({ id: "preflight:" + preflightResult.value.checkedAt, input: { ...preflight }, result: preflightResult.value });
  management.preflightHistory = management.preflightHistory.slice(0, 30);
  persistManagement();
}
function openDeepAnalysis(): void {
  if (!latest.value || !review.value) {
    ElMessage.warning("请先导入合约数据");
    return;
  }
  deepAnalysis.text = buildContractReviewContext(latest.value, review.value);
  deepAnalysis.visible = true;
}
async function copyDeepAnalysis(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(deepAnalysis.text);
    ElMessage.success("完整事实包已复制");
    return true;
  } catch {
    ElMessage.warning("复制失败，请在弹窗内手动复制");
    return false;
  }
}
async function openChatGpt(): Promise<void> {
  window.open("https://chatgpt.com/", "_blank", "noopener");
  const copied = await copyDeepAnalysis();
  if (copied) ElMessage.success("已打开 ChatGPT，请直接粘贴发送");
}

function desensitizeCapture(value: unknown): unknown {
  const identifierKey = /^(?:historyId|algoId|orderId|clientOrderId|tradeId|positionId|transactionId|recordId)$/;
  const identifiers = new Map<string, string>();
  let sequence = 0;
  const collect = (item: unknown, key = "") => {
    if (Array.isArray(item)) return item.forEach((entry) => collect(entry, key));
    if (item && typeof item === "object") return Object.entries(item).forEach(([name, entry]) => collect(entry, name));
    const text = item === undefined || item === null ? "" : String(item);
    if (identifierKey.test(key) && text.length >= 6 && !identifiers.has(text)) {
      sequence += 1;
      identifiers.set(text, "ID-" + String(sequence).padStart(4, "0"));
    }
  };
  collect(value);
  const mask = (item: unknown, key = ""): unknown => {
    if (Array.isArray(item)) return item.map((entry) => mask(entry, key));
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([name, entry]) => [name, mask(entry, name)]));
    if (item === undefined || item === null) return item;
    return identifierKey.test(key) && identifiers.has(String(item)) ? identifiers.get(String(item)) : item;
  };
  return mask(value);
}
function exportLatest(desensitized: boolean): void {
  if (!latest.value) return;
  const payload = desensitized ? desensitizeCapture(latest.value.rawCapture) : latest.value.rawCapture;
  const stamp = latest.value.capturedAt.replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "binance-source-capture-" + stamp + (desensitized ? "-desensitized" : "") + ".json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
function syncPreflightFacts(): void {
  if (!latest.value || !review.value) return;
  preflight.currentOpenPositions = latest.value.positions.filter((position) => Math.abs(Number(position.positionAmount)) > 0).length;
  preflight.consecutiveLosses = review.value.metrics.currentLossStreak;
  if (!preflight.accountEquity) {
    preflight.accountEquity = latest.value.equity.reduce((sum, row) => sum + Math.max(Number(row.marginBalance) || 0, Number(row.availableBalance) || 0), 0);
  }
}
async function loadLocal(): Promise<void> {
  const all = await ledger.list();
  latest.value = all[0];
  archiveCount.value = all.length;
  syncPreflightFacts();
}
async function importBundledSnapshot(): Promise<void> {
  busy.value = true;
  message.value = "正在读取并校验内置币安脱敏快照…";
  messageType.value = "info";
  try {
    const response = await fetch(bundledSnapshotUrl);
    if (!response.ok) throw new Error("读取内置脱敏快照失败：HTTP " + response.status);
    const dataset = toContractReviewDataset(await response.json() as BinanceSourceCapture);
    await ledger.put(dataset);
    await loadLocal();
    message.value = "脱敏快照已导入，风险规则已完成机械复盘。";
    messageType.value = "success";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "导入内置脱敏快照失败";
    messageType.value = "error";
  } finally { busy.value = false; }
}
async function refreshStatus(): Promise<void> {
  const response = await getBinanceStatus<ExtensionStatus>();
  if (!response.ok || !response.status) throw new Error(response.error || "无法读取插件状态");
  pending.value = response.status.pending;
  branchList.value = Object.values(response.status.collection?.branches || {});
  if (response.status.collection?.running) message.value = "正在并行采集合约历史与账户快照。";
  else if (pending.value) { message.value = "插件已有一批正式来源包等待导入。"; messageType.value = "warning"; }
  else if (latest.value) message.value = urgentFindings.value.length ? "数据已就绪：优先处理重大风险，其他信息保持安静。" : "数据已就绪，本轮未发现未处理重大风险。";
  else message.value = "插件已连接，尚无待导入来源包。";
}
async function importPending(): Promise<void> {
  busy.value = true;
  try {
    const response = await getBinanceStaging();
    if (!response.ok) throw new Error(response.error || "读取暂存失败");
    if (!response.staging?.capture) throw new Error("插件没有待导入的币安来源包");
    const dataset = toContractReviewDataset(response.staging.capture);
    await ledger.put(dataset);
    const acknowledgement = await acknowledgeBinanceStaging();
    if (!acknowledgement.ok) throw new Error(acknowledgement.error || "本地已写入，但插件暂存确认失败");
    await loadLocal();
    pending.value = false;
    message.value = "来源包已写入本地台账，并完成新一轮风险复盘。";
    messageType.value = urgentFindings.value.length ? "warning" : "success";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "导入失败";
    messageType.value = "error";
  } finally { busy.value = false; }
}
async function collect(): Promise<void> {
  busy.value = true;
  activeTab.value = "source";
  message.value = "正在准备后台采集页，历史与账户快照将并行采集。";
  messageType.value = "info";
  try {
    const response = await startBinanceCollection();
    if (!response.ok) throw new Error(response.error || "启动失败");
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      const status = await getBinanceStatus<ExtensionStatus>();
      if (!status.ok || !status.status) continue;
      pending.value = status.status.pending;
      branchList.value = Object.values(status.status.collection?.branches || {});
      if (pending.value) {
        busy.value = false;
        await importPending();
        activeTab.value = "risk";
        return;
      }
      if (!status.status.collection?.running && attempt > 5) throw new Error("后台采集未生成来源包，请确认币安合约页仍保持登录状态");
    }
    throw new Error("等待采集完成超时，请检查插件状态");
  } catch (error) {
    message.value = error instanceof Error ? error.message : "启动失败";
    messageType.value = "error";
  } finally { busy.value = false; }
}
async function discard(): Promise<void> {
  busy.value = true;
  try {
    await discardBinanceStaging();
    pending.value = false;
    message.value = "插件暂存已丢弃，本地历史台账不受影响。";
    messageType.value = "info";
  } finally { busy.value = false; }
}
onMounted(async () => {
  try { await loadLocal(); await refreshStatus(); }
  catch (error) {
    const detail = error instanceof Error ? error.message : "采集插件暂不可用";
    message.value = latest.value
      ? "本地复盘可正常使用；仅采集插件暂不可用（" + detail + "）。"
      : detail;
    messageType.value = latest.value ? "info" : "warning";
  }
});
</script>

<style scoped>
.verdict-strip{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 20px;border:1px solid var(--el-color-success-light-5);border-left:5px solid var(--el-color-success);border-radius:10px;background:var(--el-color-success-light-9)}.verdict-strip.negative{border-color:var(--el-color-danger-light-5);border-left-color:var(--el-color-danger);background:var(--el-color-danger-light-9)}.verdict-strip h3{margin:4px 0;font-size:20px}.verdict-strip p:last-child{margin:0;color:var(--el-text-color-regular)}.positive-text{color:var(--el-color-success)}.quick-metrics small{color:var(--el-text-color-secondary);font-size:12px}.analysis-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:12px;margin-bottom:12px}.curve-card :deep(.el-card__header)>div,.dimension-card :deep(.el-card__header)>div{display:flex;align-items:center;justify-content:space-between;gap:12px}.curve-card small,.dimension-card small{color:var(--el-text-color-secondary)}.curve-card svg{display:block;width:100%;height:190px;background:linear-gradient(180deg,#f8fafc,#fff);border-radius:8px}.axis{stroke:#dcdfe6;stroke-width:1}.equity-line{fill:none;stroke:var(--el-color-primary);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.curve-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.curve-summary span{display:flex;flex-direction:column;padding:8px;border-radius:6px;background:var(--el-fill-color-light);font-size:12px;color:var(--el-text-color-secondary)}.curve-summary b{margin-top:3px;font-size:14px}.behavior-compare{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.behavior-compare div{display:flex;flex-direction:column;padding:14px;border-radius:8px;background:var(--el-fill-color-light)}.behavior-compare span{font-size:12px;color:var(--el-text-color-secondary)}.behavior-compare strong{margin-top:5px;font-size:18px}.dimension-card{margin-bottom:18px}.advanced-rules{margin-top:12px}.advanced-rules :deep(.el-collapse-item__content){padding:16px}.context-text{margin-top:12px}.context-text :deep(textarea){font-family:var(--el-font-family-mono,monospace);font-size:12px;line-height:1.6}
.contract-review{display:grid;gap:18px}.hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:22px;border:1px solid #e4e7ed;border-radius:12px;background:linear-gradient(135deg,#f8fafc,#fff7f6)}.hero h2{margin:2px 0}.hero p{margin:6px 0 0;color:#606266}.title-row,.finding-head,.section-heading,.verdict-head,.source-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.title-row{justify-content:flex-start}.eyebrow{margin:0!important;color:#409eff!important;font-size:12px;font-weight:700;letter-spacing:.05em}.actions{display:flex;flex-wrap:wrap;justify-content:flex-end}.empty-state,.source-actions{padding:18px;border:1px solid #d9ecff;border-radius:10px;background:#f4f9ff}.empty-state{display:flex;align-items:center;justify-content:space-between;gap:20px}.empty-state p,.source-actions p,.section-heading span,.el-card__header p{margin:5px 0 0;color:#909399;font-size:13px}.quick-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.quick-metrics :deep(.el-card__body){display:flex;flex-direction:column;gap:8px}.quick-metrics span{font-size:13px;color:#606266}.quick-metrics strong{font-size:24px}.danger-text{color:#f56c6c}.main-tabs{min-width:0}.risk-layout,.preflight-layout,.conclusion-layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(300px,1fr);gap:18px}.risk-main{min-width:0}.section-heading{margin-bottom:12px;align-items:flex-end}.section-heading h3,.verdict-head h3{margin:3px 0 0}.section-heading.compact{align-items:flex-start}.finding-card{margin-bottom:10px;border-left:4px solid #e6a23c}.finding-card.priority-critical{border-left-color:#f56c6c}.finding-card.priority-high{border-left-color:#e6a23c}.finding-card.priority-medium{border-left-color:#409eff}.finding-head>div{display:flex;align-items:center;gap:8px}.finding-card p{margin:10px 0;color:#303133}.rule-line{padding:10px;border-radius:6px;background:#f5f7fa;font-size:13px}.finding-card ul{margin:0;padding-left:20px}.rules-panel{height:max-content;padding:16px;border:1px solid #ebeef5;border-radius:10px;background:#fafafa;position:sticky;top:12px}.rule-grid,.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}.rules-panel :deep(.el-input-number),.form-grid :deep(.el-input-number){width:100%}.full-button{width:100%}.acknowledged{margin-top:14px}.acknowledged-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0}.preflight-layout{align-items:start}.result-card{border-top:4px solid #e6a23c;position:sticky;top:12px}.result-card.verdict-blocked{border-top-color:#f56c6c}.result-card.verdict-pass{border-top-color:#67c23a}.result-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}.result-metrics span{display:flex;flex-direction:column;padding:10px;border-radius:6px;background:#f5f7fa;color:#606266;font-size:12px}.result-metrics b{margin-top:3px;color:#303133;font-size:15px}.check-row{display:flex;gap:10px;padding:10px 0;border-top:1px solid #ebeef5}.check-row>span{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-weight:700}.check-row div{display:flex;flex-direction:column;gap:3px}.check-row small{color:#909399}.check-block>span{background:#fef0f0;color:#f56c6c}.check-warn>span{background:#fdf6ec;color:#e6a23c}.check-pass>span{background:#f0f9eb;color:#67c23a}.conclusion-layout{align-items:start}.conclusion-layout :deep(.el-timeline){padding-left:10px}.conclusion-layout p{margin:8px 0 0}.branches{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.branch{display:grid;grid-template-columns:1fr auto;gap:4px 8px;padding:12px;border:1px solid #ebeef5;border-radius:8px;background:#f8fafc}.branch small{grid-column:1/-1;color:#909399}.source-meta,.coverage{display:flex;flex-wrap:wrap;gap:8px}.source-meta span{padding:8px 10px;border-radius:6px;background:#f5f7fa;color:#606266;font-size:13px}@media(max-width:1100px){.quick-metrics{grid-template-columns:repeat(2,1fr)}.analysis-grid,.risk-layout,.preflight-layout,.conclusion-layout{grid-template-columns:1fr}.rules-panel,.result-card{position:static}.branches{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.hero,.empty-state,.source-actions,.verdict-strip{flex-direction:column;align-items:flex-start}.actions{justify-content:flex-start}.quick-metrics,.rule-grid,.form-grid,.branches{grid-template-columns:1fr}.curve-summary{grid-template-columns:repeat(2,1fr)}.finding-head,.section-heading{align-items:flex-start;flex-direction:column}}
</style>
