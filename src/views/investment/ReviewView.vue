<template>
  <div class="review-view">
    <!-- 第一性结论 -->
    <el-card shadow="never" class="section verdict-card" :class="`verdict-${verdictLevel}`">
      <div class="verdict-kicker">复盘结论</div>
      <h2>{{ verdictTitle }}</h2>
      <p>{{ verdictDesc }}</p>
    </el-card>

    <!-- 需处理项：配置偏离（默认只列超界，区间内折叠）-->
    <el-card shadow="never" class="section drift-card">
      <template #header>
        <div class="exposure-head">
          <span>{{ driftCardTitle }}</span>
          <span class="drift-hint">{{ driftCardHint }}</span>
        </div>
      </template>
      <div v-if="!allDriftsCount" class="drift-empty">
            <p class="drift-empty-desc">{{ driftEmptyDesc }}</p>
            <div class="drift-empty-actions">
              <el-button size="small" type="primary" :loading="osState.syncing" @click="adoptDefaultsFromReview">一键采纳默认规则集</el-button>
              <el-button size="small" @click="goPolicies">去纪律页自定义</el-button>
            </div>
          </div>
      <div v-else-if="!visibleDrifts.length" class="all-within">
        <el-tag type="success" effect="plain">当前 {{ allDriftsCount }} 项均在区间内</el-tag>
        <el-button size="small" text type="primary" @click="showAllDrifts = true">查看全部</el-button>
      </div>
      <template v-else>
        <div v-for="d in visibleDrifts" :key="`${d.scope}-${d.label}`" class="drift-item">
          <div :class="driftRowClass(d.direction)">
            <span class="drift-label">{{ d.label }}</span>
            <span class="drift-actual">{{ fmtPct(d.actualPct) }}</span>
            <DriftBulletChart :drift="d" class="drift-bar" />
            <span class="drift-target">{{ driftTargetLabel }} {{ fmtPct(d.targetPct) }}，区间 [{{ fmtPct(d.minPct) }}, {{ fmtPct(d.maxPct) }}]</span>
            <el-popover v-if="d.rationale" trigger="hover" width="320" placement="top">
              <template #reference><el-button text size="small" class="rationale-btn">依据</el-button></template>
              <div class="rationale-pop">
                <p><strong>意图：</strong>{{ d.rationale.intent }}</p>
                <p><strong>理论：</strong>{{ d.rationale.theoryRef }}<span class="rationale-doc">（{{ d.rationale.theoryDoc }}）</span></p>
                <p><strong>阈值依据：</strong>{{ d.rationale.thresholdBasis }}</p>
              </div>
            </el-popover>
            <el-tag v-if="d.direction !== 'within'" size="small" type="warning">⚠ {{ driftDirText(d.direction) }}</el-tag>
            <el-tag v-else size="small" type="success" effect="plain">区间内</el-tag>
          </div>
          <div v-if="d.direction !== 'within' && !driftAck(d)" class="drift-actions">
            <el-button size="small" type="primary" plain @click="acknowledgeDrift(d)">认可偏离</el-button>
            <el-button size="small" text type="primary" @click="deepAnalyzeDrift(d)">深度分析→GPT</el-button>
          </div>
          <div v-else-if="driftAck(d)" class="drift-acked">
            <el-tag type="success" effect="plain" size="small">✓ 已认可</el-tag>
            <span class="drift-ack-reason">{{ driftAck(d)?.reason || "（未填理由）" }}</span>
            <el-button size="small" text @click="revokeDriftAck(d)">撤销</el-button>
          </div>
        </div>
        <div class="show-all-row">
          <el-button v-if="breachedDrifts.length && allDriftsCount > breachedDrifts.length && !showAllDrifts" size="small" text type="primary" @click="showAllDrifts = true">查看其余 {{ allDriftsCount - breachedDrifts.length }} 项区间内</el-button>
          <el-button v-else-if="showAllDrifts" size="small" text type="primary" @click="showAllDrifts = false">只看超界</el-button>
        </div>
      </template>
    </el-card>

    <!-- 场景工具：历史周期压力测试（默认折叠）-->
    <el-collapse v-model="stressActiveNames">
      <el-collapse-item title="历史周期压力测试（可选：把当前组合放进历史市场风格）" name="stress">
        <LazyPanel :active="stressActiveNames.includes('stress')">
        <p class="tool-disclaimer">示意性历史风格，非精确回测；以当前市值为基准平移，不模拟交易、不预测未来。</p>
        <p class="tool-disclaimer">未覆盖市场：组合中跟踪全球配置/QDII（无单一基准）、日本/越南/印度/欧洲等市场的基金，在历史周期中无对应基准，末态市值不变、不参与回撤；可在下方各周期详情核验「（无该周期基准）」项。</p>
        <el-empty v-if="!osState.portfolio" description="尚无持仓，请先采集数据或在下方启动模拟器" />
        <template v-else>
          <el-alert v-if="isSimulator" type="info" :closable="false" show-icon title="演练模式：当前按演练持仓计算历史周期回撤"
            :description="`演练接管了全局数据，本卡输入为演练第 ${sim.state.round} 期持仓（${simPhaseLabel}）——正好用于复算演练末态回撤；真实持仓的压力测试请在结束演练后进行。`" />
          <div v-if="allCyclesResult.hasHoldings && allCyclesResult.summaries.length" class="all-cycles">
            <div class="all-cycles-verdict">
              最脆弱场景：<strong>{{ allCyclesResult.worstCycle?.cycleLabel }}</strong>（回撤 {{ fmtPct(allCyclesResult.worstCycle?.maxDrawdownPct) }}）；最稳健：<strong>{{ allCyclesResult.bestCycle?.cycleLabel }}</strong>（回撤 {{ fmtPct(allCyclesResult.bestCycle?.maxDrawdownPct) }}）
            </div>
            <DrawdownBars :summaries="allCyclesResult.summaries" height="320px" class="all-cycles-chart" />
            <div class="all-cycles-list">
              <div v-for="s in allCyclesResult.summaries" :key="s.cycleId" class="all-cycles-row">
                <span class="ac-name">{{ s.cycleLabel }}</span>
                <span class="ac-dd">回撤 {{ fmtPct(s.maxDrawdownPct) }}</span>
                <span class="ac-end">末态 {{ fmtMoney(s.endTotalAsset) }} 元</span>
                <el-tag size="small" :type="s.breachedCount ? 'warning' : 'success'" effect="plain">{{ s.breachedCount }} 项偏离</el-tag>
                <div v-if="s.breachedDrift.length" class="ac-drifts">
                  <span v-for="d in s.breachedDrift" :key="d.label" class="ac-drift">⚠ {{ d.label }}：实际 {{ fmtPct(d.actualPct) }}，声明区间 [{{ fmtPct(d.minPct) }}, {{ fmtPct(d.maxPct) }}]，{{ driftDirText(d.direction) }}</span>
                </div>
              </div>
            </div>
            <p v-if="stressFindings.length" class="stress-findings-note">以下为基于历史市场风格的推断提示，与规则机械检查结论性质不同。</p>
            <div v-if="stressFindings.length" class="stress-findings">
            <div v-for="(f, i) in stressFindings" :key="i" class="sim-finding" :class="`is-${f.level}`">
              <span class="sim-finding-title">{{ f.title }}</span>
              <span class="sim-finding-detail">{{ f.detail }}</span>
            </div>
          </div>
          </div>
          <div class="stress-controls">
            <el-select v-model="selectedCycleId" size="small" style="width: 280px">
              <el-option-group v-for="m in (['CN','HK','US','commodity'] as CycleMarket[])" :key="m" :label="marketLabel(m)">
                <el-option v-for="c in cycleGroups[m]" :key="c.id" :label="c.label" :value="c.id" />
              </el-option-group>
            </el-select>
          </div>
          <div v-if="stressVerdict" class="stress-verdict">
            <span>{{ stressVerdict }}</span>
            <el-button size="small" text type="primary" @click="showStressDetail = !showStressDetail">{{ showStressDetail ? "收起详细" : "查看详细" }}</el-button>
          </div>
          <div v-if="showStressDetail && stressResult" class="stress-detail">
            <p class="stress-desc">{{ stressResult.description }}</p>
            <div class="stress-sub-title">周期总资产净值曲线（当前市值平移，非真实回测）</div>
            <CycleNavChart :period-series="stressResult.periodSeries" class="stress-nav-chart" />
            <div class="stress-metrics">
              <div class="metric"><span class="metric-label">起始总资产</span><strong>{{ fmtMoney(stressResult.startTotalAsset) }} 元</strong></div>
              <div class="metric"><span class="metric-label">末态总资产</span><strong>{{ fmtMoney(stressResult.endTotalAsset) }} 元</strong></div>
              <div class="metric"><span class="metric-label">最大回撤</span><strong>{{ fmtMoney(stressResult.maxDrawdown) }} 元（{{ fmtPct(stressResult.maxDrawdownPct) }}）</strong></div>
            </div>
            <div class="stress-sub-title">各资产末态涨跌</div>
            <el-table :data="stressResult.assetResults" size="small" border>
              <el-table-column prop="name" label="基金" min-width="140" />
              <el-table-column label="情景映射指数" width="140">
                <template #default="{ row }">{{ row.matched ? row.indexId : "（无该周期基准）" }}</template>
              </el-table-column>
              <el-table-column label="起始市值" width="110">
                <template #default="{ row }">{{ fmtMoney(row.startMarketValue) }}</template>
              </el-table-column>
              <el-table-column label="末态市值" width="110">
                <template #default="{ row }">{{ fmtMoney(row.endMarketValue) }}</template>
              </el-table-column>
              <el-table-column label="收益率" width="90">
                <template #default="{ row }">
                  <span :class="row.endReturnPct === undefined ? '' : (row.endReturnPct > 0 ? 'profit-positive' : 'profit-negative')">
                    {{ row.endReturnPct === undefined ? "—" : fmtPct(row.endReturnPct) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="stressResult.endExposureSlices.length" class="stress-section">
              <div class="stress-sub-title">末态风险暴露（情景映射指数）</div>
              <div v-for="s in stressResult.endExposureSlices" :key="s.value" class="exposure-row">
                <span class="exposure-value">{{ s.value }}</span>
                <el-progress :percentage="Math.round(s.pct * 100)" :stroke-width="12" class="exposure-bar" />
                <span class="exposure-pct">{{ (s.pct * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div v-if="stressResult.endDrift.length" class="stress-section">
              <div class="stress-sub-title">末态配置偏离</div>
              <div v-for="d in stressResult.endDrift" :key="`stress-${d.label}`" class="drift-item">
                <div :class="driftRowClass(d.direction)">
                  <span class="drift-label">{{ d.label }}</span>
                  <span class="drift-actual">{{ fmtPct(d.actualPct) }}</span>
                  <DriftBulletChart :drift="d" class="drift-bar" />
                  <span class="drift-target">{{ driftTargetLabel }} {{ fmtPct(d.targetPct) }}，区间 [{{ fmtPct(d.minPct) }}, {{ fmtPct(d.maxPct) }}]</span>
                  <el-tag v-if="d.direction !== 'within'" size="small" type="warning">⚠ {{ driftDirText(d.direction) }}</el-tag>
                  <el-tag v-else size="small" type="success" effect="plain">区间内</el-tag>
                </div>
              </div>
            </div>
          </div>
        </template>
        </LazyPanel>
      </el-collapse-item>
    </el-collapse>

    <!-- 场景工具：牛熊周期演练（真实持仓逐期推进）。外观复用 el-collapse 同名类与上方压力测试保持一致；
         内容用 v-show 切换，避开 collapse transition 与逐期回放高频更新冲突导致的 patch 报错。-->
    <div class="el-collapse el-collapse-icon-position-right">
      <div class="el-collapse-item" :class="{ 'is-active': simPanelOpen }">
        <div class="el-collapse-item__header" :class="{ 'is-active': simPanelOpen }" role="button" @click="simPanelOpen = !simPanelOpen">
          <span class="el-collapse-item__title">牛熊周期演练（可选：真实持仓逐期推进）</span>
          <el-icon class="el-collapse-item__arrow" :class="{ 'is-active': simPanelOpen }"><ArrowRight /></el-icon>
        </div>
        <div v-show="simPanelOpen" class="el-collapse-item__wrap">
          <div class="el-collapse-item__content">
        <LazyPanel :active="simPanelOpen">
        <p class="sim-intro">用当前真实持仓逐期推进（按基金指数净值曲线模拟牛熊），生成行为交易并观察规则偏离。演练期间系统全局数据为模拟值：复盘/待办围绕演练运转（这正是演练目的），持仓页暂停（需真实数据），上方压力测试切换为按演练持仓计算；结束可一键恢复真实数据。</p>
        <div class="sim-controls">
          <span class="sim-meta" v-if="isSimulator">第 {{ sim.state.round }} / 23 期 · {{ sim.state.asOf }} · {{ simPhaseLabel }}</span>
          <span class="sim-meta" v-else>尚未启动</span>
          <div class="sim-actions">
            <el-button v-if="!isSimulator" size="small" type="primary" :disabled="!hasRealHoldings" @click="simInitReal">用真实持仓演练</el-button>
            <template v-else>
              <el-button v-if="runningFullSim" size="small" type="warning" plain @click="stopFullSimCycle">⏸ 停止回放</el-button>
              <el-button v-else size="small" type="primary" :disabled="simIsLastRound || sim.state.running" @click="runFullSimCycle">一键跑完整周期（逐期回放）</el-button>
              <!-- 刷新续演后快照栈丢失不可回退，tooltip 说明灰因避免误以为按钮故障。 -->
              <el-tooltip :disabled="sim.state.canRewind || sim.state.round === 0" content="回退依赖本次演练的内存快照，页面刷新后不可用">
                <span>
                  <el-button size="small" :disabled="!sim.state.canRewind || sim.state.running || runningFullSim" :loading="sim.state.running" @click="simRewind">← 上一轮</el-button>
                </span>
              </el-tooltip>
              <el-button size="small" :disabled="simIsLastRound || sim.state.running || runningFullSim" :loading="sim.state.running" @click="simAdvance">下一轮 →</el-button>
              <el-button size="small" type="warning" :disabled="runningFullSim" :loading="osState.syncing" @click="simExitReal">结束演练 / 恢复真实</el-button>
            </template>
            <el-button v-if="isSimulator" size="small" :disabled="runningFullSim" @click="simReset">重置</el-button>
          </div>
        </div>
        <div v-if="isSimulator && sim.state.assetHistory.length >= 1" class="sim-chart">
          <div class="sim-chart-title">演练总资产曲线（阶段底色为示意，非规则结论）</div>
          <SimAssetLine :history="sim.state.assetHistory" />
        </div>
        <p v-if="isSimulator && sim.state.assetHistory.length === 0" class="sim-hint">演练尚未启动。</p>
        <div v-if="isSimulator" class="sim-toggles">
          <el-switch v-model="sim.state.toggles.regularInvest" inline-prompt active-text="规律定投" inactive-text="规律定投" />
          <el-switch v-model="sim.state.toggles.chaseTrend" inline-prompt active-text="追涨杀跌" inactive-text="追涨杀跌" />
          <el-switch v-model="sim.state.toggles.heavyPosition" inline-prompt active-text="重仓猛干" inactive-text="重仓猛干" />
          <el-switch v-model="sim.state.toggles.profitAdd" inline-prompt active-text="浮盈加仓" inactive-text="浮盈加仓" />
        </div>
        <p v-if="isSimulator && simScenario" class="sim-scenario">{{ simScenario }}</p>
        <div v-if="isSimulator && sim.state.behaviorLog.length" class="sim-log">
          <span class="sim-log-title">本期 {{ sim.state.behaviorLog.length }} 笔操作</span>
          <el-tag v-for="(log, i) in sim.state.behaviorLog" :key="i" size="small" effect="plain" class="sim-log-tag">{{ log.behavior }}：{{ log.text }}</el-tag>
        </div>
        <div v-if="isSimulator && simFindings.length" class="sim-findings">
          <div v-for="(f, i) in simFindings" :key="i" class="sim-finding" :class="`is-${f.level}`">
            <span class="sim-finding-title">{{ f.title }}</span>
            <span class="sim-finding-detail">{{ f.detail }}</span>
          </div>
        </div>
        <p v-if="isSimulator" class="sim-hint">以上为基于历史市场风格的推断提示（非规则机械检查结论）；交易为演练模拟、日期属演练日历（{{ sim.state.asOf }} 所在期）非真实记录；末态回撤可在上方「历史周期压力测试」选对应周期复算。</p>
        </LazyPanel>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="focusedCtx.visible" :title="focusedCtx.label" width="720px">
      <el-input v-model="focusedCtx.text" type="textarea" :rows="20" readonly class="focused-text" />
      <template #footer>
        <el-button @click="copyFocused">复制</el-button>
        <el-button type="primary" @click="openChatGptFocused">一键跳转 ChatGPT</el-button>
        <el-button @click="focusedCtx.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowRight } from "@element-plus/icons-vue";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { useInvestmentSimulator } from "../../investment/composables/use-investment-simulator";
import { buildAllocationDrift, buildSimFindings, buildStressFindings, type AllocationDrift, type SimFinding } from "../../investment/composables/selectors";
import { useFocusedContext, buildContextInput, directionText as driftDirText } from "../../investment/composables/use-focused-context";
import { HISTORICAL_CYCLES, getCycle, type CycleMarket } from "../../investment/engines/scenario/historical-cycles";
import { buildHistoricalStressTest, buildAllCyclesStressTest, type StressTestResult, type AllCyclesResult } from "../../investment/engines/scenario/stress-test";
import { buildDefaultStrategyRules } from "../../investment/engines/policy/rule-rationale";
import DriftBulletChart from "../../investment/charts/DriftBulletChart.vue";
import DrawdownBars from "../../investment/charts/DrawdownBars.vue";
import CycleNavChart from "../../investment/charts/CycleNavChart.vue";
import SimAssetLine from "../../investment/charts/SimAssetLine.vue";
import LazyPanel from "./components/LazyPanel.vue";

const router = useRouter();
const investmentOS = useInvestmentOS();
const osState = investmentOS.state;
const sim = useInvestmentSimulator();

// 牛熊演练（真实持仓逐期推进）
const isSimulator = computed(() => osState.account?.source === "sim");
const hasRealHoldings = computed(() => osState.account?.source !== "sim" && Boolean(osState.portfolio) && (osState.portfolio?.holdings.length ?? 0) > 0);
const simPhaseLabel = computed(() => sim.phaseLabel.value);
const simIsLastRound = computed(() => sim.isLastRound.value);
const PHASE_SCENARIO: Record<string, string> = {
  bull: "牛市：成长板块领涨，仓位与集中度上升，留意是否越过目标上限。",
  top: "见顶：成长转跌、黄金避险走强，配置开始偏离。",
  bear: "熊市：普跌且成长跌幅最大，回撤扩大。",
  bottom: "触底：组合接近周期最大回撤。",
  rebound: "反弹：成长板反弹最猛，仓位结构变化。",
  range: "震荡：小幅波动，配置相对稳定。",
};
const simScenario = computed(() => PHASE_SCENARIO[sim.state.phase] ?? "");
const simFindings = computed<SimFinding[]>(() => {
  if (!isSimulator.value) return [];
  const drift = osState.portfolio
    ? buildAllocationDrift(osState.activeVersions, osState.strategyRuleVersions, osState.portfolio, osState.assets)
    : [];
  return buildSimFindings(sim.state.phase, sim.state.asOf, sim.state.behaviorLog, drift, sim.state.holdingIndex, sim.state.realTransactionsByAsset);
});
const simPanelOpen = ref(false);
let reviewActive = true;
onActivated(() => { reviewActive = true; });
onDeactivated(() => { reviewActive = false; stopFullSimCycle(); });
onBeforeUnmount(() => { reviewActive = false; stopFullSimCycle(); });
const runningFullSim = ref(false);
const stopFullSimRequested = ref(false);
/** 逐期回放节奏：每期间隔，让曲线逐点生长、进度可见，而不是一次性同步跑完卡住。 */
const SIM_PLAYBACK_INTERVAL_MS = 320;

async function simInitReal(): Promise<void> {
  try {
    await sim.init(false, { useRealHoldings: true });
    ElMessage.success("已用真实持仓启动演练，逐期推进观察规则偏离；结束可一键恢复真实");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function simExitReal(): Promise<void> {
  try {
    const ok = await investmentOS.loadBundledSnapshot();
    if (ok) ElMessage.success("已恢复脱敏采集快照（交易 72/72 页）");
    else ElMessage.error(osState.error || "恢复真实数据失败");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function simAdvance(): Promise<void> {
  try {
    await sim.advance();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function simRewind(): Promise<void> {
  if (!sim.state.canRewind || sim.state.running) return;
  const before = sim.state.round;
  try {
    await sim.rewind();
    // rewind 内部快照栈不足时静默返回（如刷新续演后无基线），此时不弹误导性提示。
    if (sim.state.round !== before) {
      ElMessage.info(`已回退到第 ${sim.state.round} 期（${sim.state.asOf}），可调行为开关后重新推进`);
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function simReset(): Promise<void> {
  try {
    await sim.reset();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function runFullSimCycle(): Promise<void> {
  if (runningFullSim.value || !isSimulator.value) return;
  runningFullSim.value = true;
  stopFullSimRequested.value = false;
  try {
    while (!sim.isLastRound.value && !sim.state.running && !stopFullSimRequested.value) {
      await sim.advance();
      if (sim.isLastRound.value || stopFullSimRequested.value) break;
      await new Promise((resolve) => setTimeout(resolve, SIM_PLAYBACK_INTERVAL_MS));
    }
    if (!reviewActive) return;
    if (stopFullSimRequested.value && !sim.isLastRound.value) {
      ElMessage.info(`回放已暂停在第 ${sim.state.round} 期，可继续逐轮推进或再次一键跑完`);
    } else {
      ElMessage.success("完整牛熊周期演练完成，上方结论与配置偏离已更新为末态");
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    runningFullSim.value = false;
    stopFullSimRequested.value = false;
  }
}
function stopFullSimCycle(): void {
  stopFullSimRequested.value = true;
}
function goPolicies(): void {
  router.push("/investment/policies");
}
/** 复盘页快捷采纳默认规则集：免去跳纪律页才能机械复盘的额外步骤。 */
async function adoptDefaultsFromReview(): Promise<void> {
  if (!osState.activeScope) { ElMessage.warning("尚无投资范围，请先导入数据"); return; }
  try {
    const assetIds = osState.activeScope.includedAssetIds;
    const latest = osState.strategyRuleVersions.at(-1);
    const version = latest ? latest.version + 1 : 1;
    const createdAt = new Date().toISOString();
    const today = createdAt.slice(0, 10);
    await investmentOS.saveStrategyRuleVersion({
      id: `srv:${osState.activeScope.scopeId}:v${version}`,
      scopeId: osState.activeScope.scopeId,
      version,
      createdAt,
      effectiveFrom: today,
      rules: buildDefaultStrategyRules(assetIds, today),
      changeReason: "复盘页快捷采纳默认规则集",
    });
    ElMessage.success("默认规则集已采纳，复盘将按默认阈值检查偏离");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

// 历史周期压力测试
const selectedCycleId = ref(HISTORICAL_CYCLES[0].id);
const cycleGroups = computed<Record<CycleMarket, typeof HISTORICAL_CYCLES>>(() => {
  const groups: Record<CycleMarket, typeof HISTORICAL_CYCLES> = { CN: [], HK: [], US: [], commodity: [] };
  for (const c of HISTORICAL_CYCLES) groups[c.market].push(c);
  return groups;
});
const stressResult = computed<StressTestResult | undefined>(() => {
  if (!osState.portfolio) return undefined;
  const cycle = getCycle(selectedCycleId.value);
  if (!cycle) return undefined;
  return buildHistoricalStressTest(osState.portfolio.holdings, osState.assets, cycle, osState.activeVersions, osState.strategyRuleVersions);
});
// 一键全部历史周期压力测试：一次跑完 6 段，返回最脆弱/最稳健汇总。
const allCyclesResult = computed<AllCyclesResult>(() => buildAllCyclesStressTest(osState.portfolio?.holdings ?? [], osState.assets, osState.activeVersions, osState.strategyRuleVersions));
const realDateByAsset = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {};
  for (const t of osState.transactions ?? []) {
    const d = (t.occurredAt ?? "").slice(0, 10);
    if (t.assetId && d && (!m[t.assetId] || d > m[t.assetId])) m[t.assetId] = d;
  }
  return m;
});
const stressFindings = computed<SimFinding[]>(() => buildStressFindings(allCyclesResult.value, osState.assets, realDateByAsset.value));
function marketLabel(m: CycleMarket): string {
  return { CN: "A股", HK: "港股", US: "美股", commodity: "商品" }[m];
}
function fmtMoney(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 第一性结论：复盘页只回答"有没有问题 + 怎么处理"。需处理项平铺，工具/细节折叠。
const allocationDrift = computed(() => buildAllocationDrift(osState.activeVersions, osState.strategyRuleVersions, osState.portfolio, osState.assets));
const dimensionDrifts = computed(() => allocationDrift.value.filter((d) => d.scope === "dimension"));
const assetDrifts = computed(() => allocationDrift.value.filter((d) => d.scope === "asset"));
const driftCardTitle = computed(() => "目标配置 vs 实际");
const driftCardHint = computed(() => "仅对照你已声明的目标/区间；系统不发明合理仓位");
const driftTargetLabel = computed(() => "目标");
const driftEmptyDesc = computed(() => "暂未声明目标配置；可一键采纳默认规则集，或去纪律页自定义");

function driftRowClass(direction: AllocationDrift["direction"]): string {
  return direction === "within" ? "drift-row within" : "drift-row breached";
}
function fmtPct(v: number | undefined): string {
  return v === undefined ? "—" : `${(v * 100).toFixed(2)}%`;
}

const breachedDrifts = computed(() => [...dimensionDrifts.value, ...assetDrifts.value].filter((d) => d.direction !== "within"));
const allDriftsCount = computed(() => dimensionDrifts.value.length + assetDrifts.value.length);
const showAllDrifts = ref(false);
const visibleDrifts = computed(() => showAllDrifts.value ? [...dimensionDrifts.value, ...assetDrifts.value] : breachedDrifts.value);
// 第一性结论区分三种态：无声明规则（无法机械复盘）/ 有规则且均在区间内 / 有超界偏离。
// 仅靠 drift 空判断会把"无规则"误判成"均在区间内"，与纪律页"尚未采纳规则集"矛盾。
const hasDeclaredRules = computed(() => osState.activeVersions.length > 0 || osState.strategyRuleVersions.length > 0);
const verdictTitle = computed(() => {
  if (!hasDeclaredRules.value) return "暂无规则，无法机械复盘";
  return breachedDrifts.value.length === 0 ? "今日无需操作" : `${breachedDrifts.value.length} 项配置偏离待复盘`;
});
const verdictDesc = computed(() => {
  if (!hasDeclaredRules.value) return "先到纪律页声明目标配置与区间，系统才能机械检查偏离；当前只呈现事实与暴露。";
  return breachedDrifts.value.length === 0
    ? "当前已声明规则均在区间内。可展开下方场景工具做历史周期压力测试。"
    : "下方列出超界项，可认可、调整规则或深度分析外包。";
});
const verdictLevel = computed<"ok" | "warn">(() => {
  if (!hasDeclaredRules.value) return "warn";
  return breachedDrifts.value.length === 0 ? "ok" : "warn";
});

const stressActiveNames = ref<string[]>([]);
const showStressDetail = ref(false);
const stressVerdict = computed(() => {
  if (!stressResult.value) return undefined;
  const r = stressResult.value;
  const breached = r.endDrift.filter((d) => d.direction !== "within").length;
  return `${r.cycleLabel}：最大回撤 ${fmtPct(r.maxDrawdownPct)}（${fmtMoney(r.maxDrawdown)} 元），末态 ${breached} 项偏离。`;
});

interface DriftAck { reason: string; at: string; }
const ackVersion = ref(0);
function driftAckKey(d: AllocationDrift): string {
  const target = d.scope === "asset" ? (d.assetId ?? "") : `${d.dimension ?? ""}:${d.value ?? ""}`;
  return `${d.ruleSource}:${target}:${d.minPct}:${d.maxPct}`;
}
function driftAck(d: AllocationDrift): DriftAck | undefined {
  void ackVersion.value;
  try {
    const raw = localStorage.getItem(`inv-drift-ack:${driftAckKey(d)}`);
    return raw ? (JSON.parse(raw) as DriftAck) : undefined;
  } catch {
    return undefined;
  }
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
async function acknowledgeDrift(d: AllocationDrift): Promise<void> {
  let reason = "";
  try {
    const result = await ElMessageBox.prompt(
      "你认可这个偏离为合理。请记录理由（仅本地保存，用于下次复盘追溯，不改变真实交易）。",
      "认可偏离",
      { confirmButtonText: "确认认可", cancelButtonText: "取消" },
    );
    reason = (result?.value ?? "").trim();
  } catch {
    return;
  }
  localStorage.setItem(`inv-drift-ack:${driftAckKey(d)}`, JSON.stringify({ reason, at: todayStr() }));
  ackVersion.value++;
}
function revokeDriftAck(d: AllocationDrift): void {
  localStorage.removeItem(`inv-drift-ack:${driftAckKey(d)}`);
  ackVersion.value++;
}
// 单偏离深度分析：共享 useFocusedContext 弹窗（聚焦），不跳待办页带全量。
const { fc: focusedCtx, openFocused, copy: copyFocused, openChatGpt: openChatGptFocused } = useFocusedContext();
function deepAnalyzeDrift(d: AllocationDrift): void {
  openFocused(d, buildContextInput(osState, allocationDrift.value));
}
</script>

<style scoped>
.review-view {
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
.verdict-warn {
  border-left-color: var(--el-color-warning);
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
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.drift-card {
  border-left: 3px solid var(--el-color-primary);
}
.exposure-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.drift-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.all-within {
  display: flex;
  align-items: center;
  gap: 12px;
}
.show-all-row {
  margin-top: 8px;
}
.drift-item {
  margin-bottom: 8px;
}
.drift-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drift-row.breached .drift-actual {
  color: var(--el-color-danger);
  font-weight: 600;
}
.drift-label {
  width: 180px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.drift-actual {
  width: 64px;
  flex-shrink: 0;
  text-align: right;
  color: var(--el-text-color-regular);
}
.drift-bar {
  flex: 1;
  min-width: 120px;
}
.drift-target {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.rationale-btn {
  font-size: 12px;
  color: var(--el-color-primary);
  padding: 0 4px;
}
.rationale-pop p {
  margin: 4px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.rationale-doc {
  color: var(--el-text-color-secondary);
}
.drift-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  padding-left: 4px;
}
.drift-acked {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  padding: 6px 10px;
  background: var(--el-color-success-light-9);
  border-radius: 4px;
  font-size: 12px;
}
.drift-ack-reason {
  color: var(--el-text-color-regular);
}
.tool-disclaimer {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.all-cycles {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
.all-cycles-verdict {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
  line-height: 1.6;
}
.all-cycles-chart {
  margin-bottom: 10px;
}
.all-cycles-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.all-cycles-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.ac-name {
  width: 180px;
  flex-shrink: 0;
}
.ac-dd {
  color: var(--el-color-danger);
}
.ac-end {
  color: var(--el-text-color-secondary);
}
.ac-drifts {
  width: 100%;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-drift {
  font-size: 12px;
  color: var(--el-color-warning);
}
.all-cycles-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.stress-controls {
  margin-bottom: 12px;
}
.stress-verdict {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.stress-detail {
  margin-top: 12px;
}
.stress-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.stress-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.stress-metrics .metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stress-metrics .metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stress-sub-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 12px 0 8px;
}
.stress-section {
  margin-top: 8px;
}
.exposure-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.exposure-value {
  width: 120px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
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
.profit-positive {
  color: var(--el-color-danger);
}
.profit-negative {
  color: var(--el-color-success);
}
.sim-chart {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
.sim-intro {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}
.sim-chart-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.stress-nav-chart {
  margin-bottom: 16px;
}
.sim-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.sim-meta {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.sim-actions {
  display: flex;
  gap: 12px;
  /* 「← 上一轮」外包 el-tooltip 的 span 后，.el-button + .el-button 相邻选择器不再命中，
     统一改纯 gap 布局，避免按钮间距不一致。 */
}
.sim-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.sim-toggles {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.sim-scenario {
  margin: 0 0 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.sim-log {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}
.sim-log-title {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.sim-log-tag {
  font-size: 12px;
}
.sim-findings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.sim-finding {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
}
.sim-finding.is-risk {
  background: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
}
.sim-finding.is-info {
  background: var(--el-color-info-light-9);
  border-left: 3px solid var(--el-color-info);
}
.sim-finding-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.sim-finding-detail {
  color: var(--el-text-color-regular);
}
.sim-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stress-findings-note {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.focused-text :deep(textarea) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
}
</style>
