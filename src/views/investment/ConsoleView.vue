<template>
  <div class="console-view">
    <el-card v-if="!state.account" shadow="never" class="empty-card">
      <el-empty description="尚未导入真实投资数据" />
      <p class="empty-intro">Investment OS 不会自动生成账户数据。请通过本地浏览器插件从天天基金采集后，再导入本地账本。</p>
      <div class="guide-actions">
        <el-button type="primary" :loading="state.collecting" :disabled="state.syncing" @click="startCollection">开始采集投资数据</el-button>
        <el-button :loading="state.syncing" :disabled="state.collecting" @click="syncFromExtension">读取待导入数据</el-button>
        <el-button @click="downloadPlugin">下载 Investment 插件</el-button>
        <el-button text type="primary" @click="showInstallSteps = !showInstallSteps">{{ showInstallSteps ? "收起安装步骤" : "查看安装步骤" }}</el-button>
      </div>
      <el-alert v-if="pluginHint" :type="pluginHint.type" :title="pluginHint.title" :description="pluginHint.desc" show-icon :closable="false" class="guide-hint" />
      <ol v-if="showInstallSteps" class="install-steps">
        <li>下载 zip 并解压，在 <code>chrome://extensions</code> 开启开发者模式，选择“加载已解压的扩展程序”。</li>
        <li>在天天基金完成正常登录，回到本页点击“开始采集投资数据”。插件不需要复制 Cookie、密码或令牌。</li>
        <li>等待进度显示“新批次等待导入”，再点击“读取待导入数据”；导入后插件暂存会清除，Ledger 数据仍保留。</li>
      </ol>
    </el-card>

    <template v-else>
      <!-- 系统状态 -->
      <el-card shadow="never" class="section">
        <template #header>系统状态</template>
        <div class="system-status">
          <el-tag :type="healthTag" effect="dark">{{ healthLabel }}</el-tag>
          <span class="status-text">{{ state.health?.summary }}</span>
        </div>
        <p class="hint">{{ actionHint }}</p>
      </el-card>

      <!-- 账户核心指标 -->
      <el-card shadow="never" class="section">
        <template #header>账户核心指标</template>
        <el-alert
          v-if="metrics.holdingPnlUnknown"
          type="warning"
          :title="'当前持仓浮盈未知，请勿将历史累计盈亏当作当前持仓收益'"
          show-icon
          :closable="false"
          class="metric-alert"
        />
        <div class="metric-grid">
          <div class="metric">
            <span class="metric-label">总资产</span>
            <span class="metric-value">{{ formatMoney(metrics.totalAsset) }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">当前持仓浮盈</span>
            <span class="metric-value">{{ metrics.currentHoldingPnl === undefined ? "—" : `${formatMoney(metrics.currentHoldingPnl)}` }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">历史累计盈亏</span>
            <span class="metric-value">{{ metrics.cumulativePnl === undefined ? "—" : `${formatMoney(metrics.cumulativePnl)}` }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">最大回撤</span>
            <span class="metric-value">{{ metrics.maxDrawdown === undefined ? "—" : `${formatMoney(metrics.maxDrawdown)}` }}</span>
          </div>
        </div>
      </el-card>

      <!-- 风险摘要（PRD §17.3 取最大风险暴露 top） -->
      <el-card shadow="never" class="section">
        <template #header>风险摘要</template>
        <el-alert
          v-if="indexCoverage.unknownPct > 0"
          type="info"
          :title="`风险分类待补齐：已识别 ${(indexCoverage.knownPct * 100).toFixed(1)}%，未识别 ${(indexCoverage.unknownPct * 100).toFixed(1)}%`"
          description="未识别表示缺少底层指数元数据，不是一种资产类型，也不是风险结论。"
          show-icon
          :closable="false"
          class="metric-alert"
        />
        <el-empty v-if="!topExps.length" description="尚无可靠的底层指数元数据" />
        <div v-else class="exposure-list">
          <div v-for="e in topExps" :key="e.value" class="exposure-row">
            <span class="exposure-value">{{ e.value }}</span>
            <el-progress :percentage="Math.round(e.pct * 100)" :stroke-width="14" class="exposure-bar" />
            <span class="exposure-pct">{{ (e.pct * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </el-card>

      <!-- Action（PRD §17.4） -->
      <el-card shadow="never" class="section">
        <template #header>需要处理</template>
        <div class="action-row">
          <div class="action-count">
            <span class="big">{{ state.pendingActions }}</span>
            <span class="action-label">待处理</span>
          </div>
          <div class="action-desc">
            <p>{{ state.pendingActions ? "存在需要做出的投资判断。" : "当前没有需要做出的投资判断。" }}</p>
            <el-button v-if="state.pendingActions" size="small" type="primary" @click="goActions">查看</el-button>
          </div>
        </div>
      </el-card>

      <!-- 最近变化 -->
      <el-card shadow="never" class="section">
        <template #header>最近变化</template>
        <p>{{ recent.summary }}</p>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { usePluginGuide } from "../../investment/composables/use-plugin-guide";
import { buildAccountMetrics, buildRecentChanges } from "../../investment/composables/selectors";
import { exposureCoverage, topExposures } from "../../investment/engines/exposure";

const router = useRouter();
const { state, syncFromExtension, startCollection } = useInvestmentOS();
const { pluginHint, downloadPlugin } = usePluginGuide();
const showInstallSteps = ref(false);

function goActions() {
  router.push("/investment/actions");
}

const metrics = computed(() => buildAccountMetrics(state.account, state.portfolio, state.dailyPnl));
const recent = computed(() => buildRecentChanges([...state.transactions]));
const indexCoverage = computed(() =>
  state.portfolio
    ? exposureCoverage(state.portfolio.holdings, state.assets, "index")
    : { knownPct: 0, unknownPct: 0 },
);
const topExps = computed(() =>
  state.portfolio ? topExposures(state.portfolio.holdings, state.assets, "index", 4) : [],
);

const healthTag = computed<"success" | "warning" | "danger" | "info">(() => {
  switch (state.health?.level) {
    case "normal":
      return "success";
    case "needs_attention":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "info";
  }
});

const healthLabel = computed(() => {
  switch (state.health?.level) {
    case "normal":
      return "正常";
    case "needs_attention":
      return "需要关注";
    case "blocked":
      return "数据不足";
    default:
      return "未知";
  }
});

const actionHint = computed(() => {
  if (state.health?.level === "normal") return "当前投资系统正常，今天无需操作。";
  if (state.health?.level === "blocked") return "数据不足以支持判断，请先同步账户与持仓。";
  return "存在需要关注的事项，请查看数据或行动页。";
});

function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.console-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
.system-status {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-text {
  color: var(--el-text-color-regular);
}
.hint,
.action-text {
  margin: 8px 0 0;
  color: var(--el-text-color-regular);
}
.action-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.action-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.action-count .big {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.action-label {
  color: var(--el-text-color-regular);
}
.action-desc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-desc p {
  margin: 0;
  color: var(--el-text-color-regular);
}
.metric-alert {
  margin-bottom: 12px;
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
.exposure-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exposure-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.exposure-value {
  width: 120px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}
.exposure-bar {
  flex: 1;
}
.exposure-pct {
  width: 64px;
  text-align: right;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
</style>
