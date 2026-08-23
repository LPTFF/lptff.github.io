<template>
  <div class="console-view">
    <el-card v-if="!state.account" shadow="never" class="empty-card">
      <el-empty description="尚未导入投资数据" />
      <p class="empty-intro">可通过本地浏览器插件从天天基金采集后导入本地账本，或去采集页加载本地采集快照。</p>
      <div class="guide-actions">
        <el-button type="primary" :loading="state.collecting" :disabled="state.syncing" @click="collect">开始采集投资数据</el-button>
        <el-button :loading="state.syncing" :disabled="state.collecting" @click="sync">读取待导入数据</el-button>
        <el-button @click="downloadPlugin">下载采集插件</el-button>
        <el-button text type="primary" @click="showInstallSteps = !showInstallSteps">{{ showInstallSteps ? "收起安装步骤" : "查看安装步骤" }}</el-button>
      </div>
      <el-alert v-if="pluginHint" :type="pluginHint.type" :title="pluginHint.title" :description="pluginHint.desc" show-icon :closable="false" class="guide-hint" />
      <ol v-if="showInstallSteps" class="install-steps">
        <li>下载 zip 并解压，在 <code>chrome://extensions</code> 开启开发者模式，选择“加载已解压的扩展程序”。</li>
        <li>在天天基金完成正常登录，回到本页点击“开始采集投资数据”。插件不需要复制 Cookie、密码或令牌。</li>
        <li>等待进度显示“新批次等待导入”，再点击“读取待导入数据”；导入后插件待导入数据会清除，本地账本数据仍保留。</li>
      </ol>
    </el-card>

    <template v-else>
      <!-- 演练接管全局数据：总览指标与曲线为演练模拟值，须标注防误导 -->
      <el-alert v-if="isSimulator" type="info" :closable="false" show-icon title="牛熊演练进行中：本页指标与曲线为演练模拟值"
        description="演练接管了系统全局数据（真实数据已退出，结束可一键恢复）；本页总资产/盈亏曲线/资金曲线均按演练持仓与演练交易计算，不代表真实账户。演练详情在复盘页「牛熊周期演练」卡。" class="section-alert" />
      <el-card shadow="never" class="section">
        <template #header>
          <div class="card-head-row">
            <span>账户核心指标</span>
            <span class="head-hint">系统替你持续计算仓位、配置偏离、回撤、交易频率——你只需看异常</span>
          </div>
        </template>
        <div class="metric-grid">
          <div class="metric"><span class="metric-label">总资产</span><span class="metric-value">{{ fmt(metrics.totalAsset) }}</span></div>
          <div class="metric"><span class="metric-label">持仓市值</span><span class="metric-value">{{ state.portfolio ? fmt(state.portfolio.holdingValue) : "—" }}</span></div>
          <div class="metric"><span class="metric-label">持仓收益金额槽位合计</span><span class="metric-value">{{ metrics.currentHoldingPnl === undefined ? "—" : `${fmt(metrics.currentHoldingPnl)}` }}</span></div>
          <div class="metric"><span class="metric-label">历史累计盈亏</span><span class="metric-value">{{ metrics.cumulativePnl === undefined ? "—" : `${fmt(metrics.cumulativePnl)}` }}</span></div>
          <div class="metric"><span class="metric-label">最大回撤</span><span class="metric-value">{{ metrics.maxDrawdown === undefined ? "—" : `${fmt(metrics.maxDrawdown)}` }}</span></div>
          <div class="metric"><span class="metric-label">交易频率</span><span class="metric-value">{{ recent.transactionCount === 0 ? "—" : `近 ${recent.transactionCount} 笔` }}</span></div>
        </div>
      </el-card>

      <!-- 累计盈亏曲线：控制台的“一眼”信息，缺口如实断线，不插值不补零 -->
      <el-card shadow="never" class="section">
        <template #header>
          <div class="card-head-row">
            <span>累计盈亏曲线</span>
            <span class="head-hint">红底区间为回撤中；虚线为历史峰值</span>
          </div>
        </template>
        <CumulativePnlChart v-if="pnlSeries.length" :series="pnlSeries" height="280px" />
        <el-empty v-else description="暂无每日盈亏数据，曲线待采集后绘制" :image-size="60" />
      </el-card>

      <!-- 资金投入与流出：月度买卖金额对照，口径与明细页买入金额一致 -->
      <el-card shadow="never" class="section">
        <template #header>
          <div class="card-head-row">
            <span>资金投入与流出</span>
            <span class="head-hint">红=投入（买入）、绿=流出（卖出）；失败/撤销不计入，悬停查看当月明细</span>
          </div>
        </template>
        <CashflowChart v-if="cashflowSeries.length" :series="cashflowSeries" height="280px" />
        <el-empty v-else description="暂无交易记录，资金曲线待采集后绘制" :image-size="60" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useCollectionControl } from "../../investment/composables/use-collection-control";
import { usePluginGuide } from "../../investment/composables/use-plugin-guide";
import { buildAccountMetrics, buildRecentChanges, buildCumulativePnlSeries, buildMonthlyCashflow } from "../../investment/composables/selectors";
import CumulativePnlChart from "../../investment/charts/CumulativePnlChart.vue";
import CashflowChart from "../../investment/charts/CashflowChart.vue";

const { state } = useInvestmentOS();
const isSimulator = computed(() => state.account?.source === "sim");
const { collect, sync } = useCollectionControl();
const { pluginHint, downloadPlugin } = usePluginGuide();
const showInstallSteps = ref(false);

const metrics = computed(() => buildAccountMetrics(state.account, state.portfolio, state.dailyPnl));
const recent = computed(() => buildRecentChanges([...state.transactions]));
const pnlSeries = computed(() => buildCumulativePnlSeries([...state.dailyPnl]));
const cashflowSeries = computed(() => buildMonthlyCashflow([...state.transactions]));

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.console-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-alert {
  margin-bottom: 4px;
}
.section {
  width: 100%;
}
.empty-card {
  min-height: 300px;
}
.empty-intro {
  max-width: 720px;
  margin: 0 auto 14px;
  color: var(--el-text-color-regular);
  text-align: center;
  line-height: 1.7;
}
.guide-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.guide-hint {
  max-width: 720px;
  margin: 16px auto 0;
}
.install-steps {
  max-width: 720px;
  margin: 16px auto 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
}
.install-steps code {
  color: var(--el-color-primary);
}
.card-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.head-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 18px;
  font-weight: 600;
}
</style>
