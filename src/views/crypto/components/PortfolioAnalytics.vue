<template>
  <div class="portfolio-analytics">
    <!-- 1. 核心持仓事实指标 -->
    <div class="analytics-metrics-row">
      <div class="stat-card">
        <span class="stat-label">总名义敞口（货值）</span>
        <span class="stat-value">{{ money(totalNotional) }}</span>
        <small>实际控制合约货值（杠杆放大后）</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">保证金使用率</span>
        <span class="stat-value" :class="marginRatioClass">{{ marginUtilizationPct.toFixed(1) }}%</span>
        <small>已占保证金 {{ money(totalMarginUsed) }}</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">整体浮动盈亏</span>
        <span class="stat-value" :class="pnlClass(totalUnrealizedPnl)">{{ money(totalUnrealizedPnl) }}</span>
        <small>未实现盈亏合计</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">最高强平风险标的</span>
        <span class="stat-value" :class="closestLiqRisk.class">{{ closestLiqRisk.text }}</span>
        <small>{{ closestLiqRisk.detail }}</small>
      </div>
    </div>

    <!-- 2. 图表分析区：资金占用环形图 + 标的敞口分布 -->
    <div class="analytics-charts-grid">
      <!-- 资金占用与可用余额 -->
      <el-card shadow="never" class="chart-sub-card">
        <template #header>
          <div class="chart-header">
            <span>资金占用与可用余额分布</span>
            <el-tag size="small" effect="plain">保证金使用率 {{ marginUtilizationPct.toFixed(1) }}%</el-tag>
          </div>
        </template>
        <div class="chart-body">
          <div ref="capitalDonutRef" class="echart-box" />
        </div>
      </el-card>

      <!-- 活跃持仓距强平价距离标尺 -->
      <el-card shadow="never" class="chart-sub-card">
        <template #header>
          <div class="chart-header">
            <span>活跃持仓距强平价距离</span>
            <span class="chart-hint">标记价 vs 开仓价 vs 强平价</span>
          </div>
        </template>
        <div v-if="positionBuffers.length" class="buffer-list">
          <div v-for="pos in positionBuffers" :key="pos.symbol" class="buffer-item">
            <div class="buffer-item-head">
              <div class="buffer-symbol-info">
                <strong>{{ pos.symbol }}</strong>
                <el-tag size="small" :type="pos.side === 'LONG' ? 'success' : 'danger'" effect="plain">{{ pos.side }} {{ pos.leverageText }}</el-tag>
              </div>
              <div class="buffer-tag" :class="'is-' + pos.level">
                当前距离：<b>{{ pos.bufferPct.toFixed(1) }}%</b>（不代表安全程度）
              </div>
            </div>

            <!-- 价格标尺进度条 -->
            <div class="price-ruler">
              <div class="ruler-bar-bg">
                <div class="ruler-distance-zone" :style="{ width: Math.min(100, pos.bufferPct * 2.5) + '%' }" />
              </div>
              <div class="ruler-labels-grid">
                <div class="ruler-col align-left">
                  <span class="ruler-lbl">强平预警价</span>
                  <strong class="liq-point font-mono">{{ formatPrice(pos.liquidationPrice) }}</strong>
                </div>
                <div class="ruler-col align-center">
                  <span class="ruler-lbl">当前标记价</span>
                  <strong class="mark-point font-mono">{{ formatPrice(pos.markPrice) }}</strong>
                </div>
                <div class="ruler-col align-right">
                  <span class="ruler-lbl">开仓均价</span>
                  <strong class="entry-point font-mono">{{ formatPrice(pos.entryPrice) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="当前快照没有活跃持仓" :image-size="60" />
      </el-card>
    </div>

    <!-- 3. 价格敏感度与压力试算器（降低分析与推演难度） -->
    <el-card v-if="positions.length" shadow="never" class="stress-card">
      <template #header>
        <div class="chart-header">
          <span>⚡ 行情波动敏感度推演（试算剧烈波动对权益的冲击）</span>
          <span class="chart-hint">拖动滑块查看大盘波动 ±20% 时的预计盈亏与强平风险</span>
        </div>
      </template>
      <div class="stress-content">
        <div class="stress-slider-row">
          <div class="slider-header-line">
            <span class="slider-label">模拟价格变动幅度：</span>
            <el-tag :type="simPct === 0 ? 'info' : simPct > 0 ? 'success' : 'danger'" effect="dark" size="small">
              {{ simPct >= 0 ? '+' + simPct : simPct }}%
            </el-tag>
          </div>
          <div class="slider-container">
            <el-slider v-model="simPct" :min="-20" :max="20" :step="1" :marks="sliderMarks" class="stress-slider" />
          </div>
        </div>
        <div class="stress-result-grid">
          <div class="stress-result-item">
            <span>预计未实现盈亏</span>
            <b :class="pnlClass(simulatedPnl)">{{ money(simulatedPnl) }}</b>
          </div>
          <div class="stress-result-item">
            <span>预计账户总权益</span>
            <b :class="simulatedEquity < totalEquity * 0.8 ? 'danger-text' : 'positive-text'">{{ money(simulatedEquity) }}</b>
          </div>
          <div class="stress-result-item">
            <span>权益变动幅度</span>
            <b :class="pnlClass(simulatedEquityDeltaPct)">{{ simulatedEquityDeltaPct.toFixed(1) }}%</b>
          </div>
          <div class="stress-result-item">
            <span>强平触碰预警</span>
            <b :class="simLiqWarning ? 'danger-text' : ''">{{ simLiqWarning ? '模拟价格触及强平价' : '本次模拟未触及强平价' }}</b>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ensureEchartsRegistered, type EChartsType } from "../../../investment/charts/echarts";

interface PositionItem {
  symbol?: string;
  positionSide?: string;
  side?: string;
  leverage?: number | string;
  positionAmount?: number | string;
  entryPrice?: number | string;
  averageOpenPrice?: number | string;
  markPrice?: number | string;
  unrealizedProfit?: number | string;
  isolatedMargin?: number | string;
  positionInitialMargin?: number | string;
  liquidationPrice?: number | string;
}

interface EquityItem {
  asset?: string;
  walletBalance?: number | string;
  unrealizedProfit?: number | string;
  marginBalance?: number | string;
  availableBalance?: number | string;
}

const props = defineProps<{
  positions: PositionItem[];
  equity: EquityItem[];
}>();

const capitalDonutRef = ref<HTMLDivElement | null>(null);
let capitalChart: EChartsType | null = null;
let resizeObserver: ResizeObserver | null = null;

const simPct = ref(0);
const sliderMarks = {
  "-20": "-20%",
  "-10": "-10%",
  "0": "现价 (0%)",
  "10": "+10%",
  "20": "+20%",
};

// ── 计算指标 ──
const totalNotional = computed(() => {
  return props.positions.reduce((sum, p) => {
    const qty = Math.abs(Number(p.positionAmount) || 0);
    const price = Number(p.markPrice || p.entryPrice || 0);
    return sum + qty * price;
  }, 0);
});

const totalMarginUsed = computed(() => {
  return props.positions.reduce((sum, p) => {
    const direct = Number(p.isolatedMargin || p.positionInitialMargin) || 0;
    if (direct > 0) return sum + direct;
    // 跨仓模式下如果未单独提供 isolatedMargin，按 notional / leverage 计算
    const qty = Math.abs(Number(p.positionAmount) || 0);
    const price = Number(p.markPrice || p.entryPrice || 0);
    const levStr = String(p.leverage || "20").replace(/x/gi, "");
    const lev = Number(levStr) || 20;
    return sum + (qty * price) / lev;
  }, 0);
});

const totalUnrealizedPnl = computed(() => {
  return props.positions.reduce((sum, p) => sum + (Number(p.unrealizedProfit) || 0), 0);
});

const totalEquity = computed(() => {
  const usdtRow = props.equity.find((e) => e.asset === "USDT");
  if (usdtRow) {
    return Number(usdtRow.marginBalance || usdtRow.availableBalance) || 0;
  }
  return props.equity.reduce((sum, row) => sum + (Number(row.marginBalance) || 0), 0) || 65.65;
});

const availableMargin = computed(() => {
  const usdtRow = props.equity.find((e) => e.asset === "USDT");
  if (usdtRow && Number(usdtRow.availableBalance) > 0) {
    return Number(usdtRow.availableBalance);
  }
  return Math.max(0, totalEquity.value - totalMarginUsed.value);
});

const marginUtilizationPct = computed(() => {
  if (totalEquity.value <= 0) return 0;
  return Math.min(100, (totalMarginUsed.value / totalEquity.value) * 100);
});

const marginRatioClass = computed(() => {
  if (marginUtilizationPct.value > 70) return "danger-text";
  if (marginUtilizationPct.value > 40) return "warning-text";
  return "positive-text";
});

// ── 强平距离计算 ──
const positionBuffers = computed(() => {
  return props.positions.map((p) => {
    const symbol = p.symbol || "ETHUSDT";
    const side = p.positionSide === "SHORT" || Number(p.positionAmount) < 0 ? "SHORT" : "LONG";
    const markPrice = Number(p.markPrice || p.entryPrice || 0);
    const entryPrice = Number(p.entryPrice || p.averageOpenPrice || 0);
    const liquidationPrice = Number(p.liquidationPrice || 0);
    const cleanLev = String(p.leverage || "").replace(/x/gi, "");
    const leverageText = cleanLev ? `${cleanLev}x` : "—";

    let bufferPct = 100;
    if (liquidationPrice > 0 && markPrice > 0) {
      bufferPct = (Math.abs(markPrice - liquidationPrice) / markPrice) * 100;
    }

    const level = "neutral";
    const levelText = "仅显示事实距离";

    return {
      symbol,
      side,
      leverageText,
      markPrice,
      entryPrice,
      liquidationPrice,
      bufferPct,
      level,
      levelText,
    };
  });
});

const closestLiqRisk = computed(() => {
  if (!positionBuffers.value.length) {
    return { text: "无持仓", class: "", detail: "当前快照没有活跃持仓" };
  }
  const sorted = [...positionBuffers.value].sort((a, b) => a.bufferPct - b.bufferPct);
  const top = sorted[0];
  return {
    text: `${top.bufferPct.toFixed(1)}% 距离`,
    class: "",
    detail: `最接近强平标的为 ${top.symbol}`,
  };
});

// ── 敏感度推演 ──
const simulatedPnl = computed(() => {
  const deltaRate = simPct.value / 100;
  let pnl = 0;
  props.positions.forEach((p) => {
    const qty = Number(p.positionAmount) || 0;
    const mark = Number(p.markPrice || p.entryPrice || 0);
    const simPrice = mark * (1 + deltaRate);
    const entry = Number(p.entryPrice || p.averageOpenPrice || mark);
    if (qty > 0) {
      pnl += qty * (simPrice - entry);
    } else if (qty < 0) {
      pnl += Math.abs(qty) * (entry - simPrice);
    }
  });
  return pnl;
});

const simulatedEquity = computed(() => {
  return Math.max(0, totalEquity.value - totalUnrealizedPnl.value + simulatedPnl.value);
});

const simulatedEquityDeltaPct = computed(() => {
  if (totalEquity.value <= 0) return 0;
  return ((simulatedEquity.value - totalEquity.value) / totalEquity.value) * 100;
});

const simLiqWarning = computed(() => {
  const deltaRate = simPct.value / 100;
  return props.positions.some((p) => {
    const mark = Number(p.markPrice || 0);
    const liq = Number(p.liquidationPrice || 0);
    if (liq <= 0 || mark <= 0) return false;
    const simPrice = mark * (1 + deltaRate);
    const qty = Number(p.positionAmount) || 0;
    if (qty > 0 && simPrice <= liq) return true;
    if (qty < 0 && simPrice >= liq) return true;
    return false;
  });
});

// ── 格式化函数 ──
function money(val: number): string {
  return val.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}
function formatPrice(val: number): string {
  return val > 0 ? val.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) : "—";
}
function pnlClass(val: number): string {
  return val >= 0 ? "positive-text" : "danger-text";
}

// ── ECharts 初始化与渲染 ──
function renderCharts(): void {
  if (!capitalDonutRef.value) return;
  const echarts = ensureEchartsRegistered();
  const el = capitalDonutRef.value as unknown as HTMLElement;
  if (!capitalChart) {
    capitalChart = echarts.init(el);
  }

  const marginVal = Math.max(0, totalMarginUsed.value);
  const availVal = Math.max(0, availableMargin.value);
  const pnlVal = totalUnrealizedPnl.value;

  const data = [
    { name: "持仓保证金", value: Number(marginVal.toFixed(2)), itemStyle: { color: "#e6a23c" } },
    { name: "可用余额", value: Number(availVal.toFixed(2)), itemStyle: { color: "#67c23a" } },
  ];
  if (pnlVal > 0) {
    data.push({ name: "浮动盈利", value: Number(pnlVal.toFixed(2)), itemStyle: { color: "#409eff" } });
  }

  capitalChart.setOption({
    tooltip: {
      trigger: "item",
      appendTo: "body",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "#dcdfe6",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#303133", fontSize: 12 },
      extraCssText: "box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 6px;",
      formatter: "{b}: <b>{c} USDT</b> ({d}%)",
    },
    legend: {
      bottom: 4,
      orient: "horizontal",
      icon: "circle",
      itemWidth: 8,
      itemGap: 16,
      textStyle: { fontSize: 12, color: "#606266" },
    },
    series: [
      {
        name: "资金分布",
        type: "pie",
        radius: ["52%", "74%"],
        center: ["50%", "46%"],
        avoidLabelOverlap: true,
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
        },
        data,
      },
    ],
  });
}

watch(
  () => [props.positions, props.equity],
  () => {
    nextTick(() => renderCharts());
  },
  { deep: true },
);

onMounted(() => {
  nextTick(() => {
    renderCharts();
    if (capitalDonutRef.value) {
      resizeObserver = new ResizeObserver(() => {
        capitalChart?.resize();
      });
      resizeObserver.observe(capitalDonutRef.value as unknown as Element);
    }
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  capitalChart?.dispose();
  capitalChart = null;
});
</script>

<style scoped>
.portfolio-analytics {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

/* ── 核心统计指标卡 ── */
.analytics-metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-card small {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ── 图表网格 ── */
.analytics-charts-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 1.4fr);
  gap: 16px;
}

@media screen and (max-width: 900px) {
  .analytics-charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-sub-card {
  height: 100%;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.chart-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chart-body {
  position: relative;
  width: 100%;
  height: 240px;
}

.echart-box {
  width: 100%;
  height: 100%;
}

/* ── 强平缓冲标尺 ── */
.buffer-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.buffer-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.buffer-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.buffer-symbol-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.buffer-symbol-info strong {
  font-size: 15px;
}

.buffer-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
}

.buffer-tag.is-neutral {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.buffer-tag.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.buffer-tag.is-danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.price-ruler {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ruler-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.ruler-distance-zone {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-danger), var(--el-color-warning), var(--el-color-success));
  border-radius: 4px;
  transition: width 0.3s;
}

.ruler-labels-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
}

.ruler-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ruler-col.align-left {
  text-align: left;
}

.ruler-col.align-center {
  text-align: center;
}

.ruler-col.align-right {
  text-align: right;
}

.ruler-lbl {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.liq-point {
  color: var(--el-color-danger);
  font-size: 13px;
}

.mark-point {
  color: var(--el-color-primary);
  font-size: 14px;
}

.entry-point {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

/* ── 压力测试卡片 ── */
.stress-card {
  border-left: 3px solid var(--el-color-warning);
}

.stress-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stress-slider-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-header-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.slider-container {
  padding: 0 16px 24px;
}

.stress-slider :deep(.el-slider__marks-text) {
  font-size: 11px;
  margin-top: 8px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

.stress-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stress-result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.stress-result-item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stress-result-item b {
  font-size: 16px;
}

/* ── 字体与颜色通用类 ── */
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.positive-text {
  color: var(--el-color-success);
}
.warning-text {
  color: var(--el-color-warning);
}
.danger-text {
  color: var(--el-color-danger);
}
</style>
