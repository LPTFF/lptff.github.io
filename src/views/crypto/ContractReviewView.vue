<template>
  <div class="os-layout contract-review">
    <!-- 头部 -->
    <div class="os-header">
      <div class="os-title">
        <span class="os-name">合约复盘助手</span>
      </div>
    </div>

    <!-- 横向导航菜单（7 大 Tab 体系） -->
    <el-menu mode="horizontal" :default-active="activeTab" class="os-menu" @select="switchTab">
      <el-menu-item index="overview">总览</el-menu-item>
      <el-menu-item index="review">复盘</el-menu-item>
      <el-menu-item index="portfolio">持仓</el-menu-item>
      <el-menu-item index="policies">纪律</el-menu-item>
      <el-menu-item index="actions">待办</el-menu-item>
      <el-menu-item index="evidence">明细</el-menu-item>
      <el-menu-item index="data">采集</el-menu-item>
    </el-menu>

    <!-- Tab 页面主体 -->
    <div class="os-body">
      <!-- 空数据状态：未导入快照时展示引导卡 -->
      <el-card v-if="!latest" shadow="never" class="empty-card section">
        <el-empty description="尚未导入合约交易数据" />
        <p class="empty-intro">先导入一份来源数据，系统才能机械复盘。真实账户建议通过浏览器插件只读采集；内置脱敏快照仅用于体验完整流程。</p>
        <div class="guide-actions">
          <el-button type="primary" :loading="busy" :disabled="pending" @click="collect">开始采集投资数据</el-button>
          <el-button :loading="busy" :disabled="!pending" @click="importPending">读取待导入数据</el-button>
          <el-button type="primary" plain :loading="busy" @click="importBundledSnapshot">导入内置脱敏快照（2026-08-24）</el-button>
        </div>
      </el-card>

      <!-- ── Tab 1: 总览 (Overview / 策略与账户总览) ── -->
      <div v-else-if="activeTab === 'overview'" class="tab-pane">
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>账户与策略核心指标</span>
              <span class="head-hint">只展示已导入历史事实的确定性统计，不生成交易许可</span>
            </div>
          </template>
          <div class="metric-grid">
            <div class="metric">
              <span class="metric-label">净盈亏</span>
              <span class="metric-value" :class="pnlClass(review?.metrics.netPnl)">{{ money(review?.metrics.netPnl ?? 0) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">单笔期望</span>
              <span class="metric-value" :class="pnlClass(review?.analysis.expectancy)">{{ money(review?.analysis.expectancy ?? 0) }}</span>
              <small>平均每笔留下的收益，比胜率更接近策略质量</small>
            </div>
            <div class="metric">
              <span class="metric-label">盈利因子</span>
              <span class="metric-value">{{ ratio(review?.analysis.profitFactor) }}</span>
              <small>每亏 1 USDT 能赚多少；低于 1 代表整体亏损</small>
            </div>
            <div class="metric">
              <span class="metric-label">盈亏比</span>
              <span class="metric-value">{{ ratio(review?.analysis.payoffRatio) }}</span>
              <small>平均盈利 ÷ 平均亏损</small>
            </div>
            <div class="metric">
              <span class="metric-label">胜率</span>
              <span class="metric-value">{{ pct(review?.metrics.winRatePct) }}</span>
              <small>盈利交易占已平仓样本比例</small>
            </div>
            <div class="metric">
              <span class="metric-label">最大回撤</span>
              <span class="metric-value danger-text">{{ money(review?.analysis.maximumDrawdown ?? 0) }}</span>
              <small>{{ pct(review?.analysis.maximumDrawdownPct) }} 可识别权益</small>
            </div>
            <div class="metric">
              <span class="metric-label">最差 5 笔平均亏损</span>
              <span class="metric-value danger-text">{{ money(review?.analysis.worstFiveAverageLoss ?? 0) }}</span>
              <small>观察尾部而非平均值</small>
            </div>
            <div class="metric">
              <span class="metric-label">手续费侵蚀</span>
              <span class="metric-value">{{ pct(review?.analysis.feeDragPct) }}</span>
              <small>{{ money(review?.analysis.totalTradingFees ?? 0) }} 交易手续费</small>
            </div>
            <div class="metric">
              <span class="metric-label">历史止损保护率</span>
              <span class="metric-value">{{ pct(review?.analysis.stopProtectedClosedPct) }}</span>
              <small>时间窗内可识别保护单</small>
            </div>
            <div class="metric">
              <span class="metric-label">已平仓样本数</span>
              <span class="metric-value">{{ review?.metrics.closedPositions ?? 0 }} 笔</span>
              <small>基于历史已平仓记录</small>
            </div>
          </div>
        </el-card>

        <!-- 累计盈亏与回撤曲线（真实时间轴序列 + 水下回撤） -->
        <el-card shadow="never" class="section curve-card">
          <template #header>
            <div class="card-head-row">
              <span>收益随时间变化趋势（累计盈亏与水下回撤）</span>
              <span class="head-hint">按平仓时间逐笔累计；精准展示每笔交易带来的权益变化与回撤深度</span>
            </div>
          </template>
          <div class="chart-container">
            <EquityTimeCurveChart :points="review?.analysis.equityCurve ?? []" height="330px" />
          </div>
          <div class="curve-summary">
            <span>盈利交易合计 <b class="positive-text">{{ money(review?.analysis.grossProfit ?? 0) }}</b></span>
            <span>亏损交易合计 <b class="danger-text">{{ money(review?.analysis.grossLoss ?? 0) }}</b></span>
            <span>盈利日占比 <b>{{ pct(review?.analysis.profitableDaysPct) }}</b></span>
            <span>最差单日盈亏 <b class="danger-text">{{ money(review?.analysis.worstDayPnl ?? 0) }}</b></span>
          </div>
        </el-card>

        <!-- 持仓行为差异 -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>持仓行为差异</span>
              <span class="head-hint">盈利与亏损交易是否使用了不同节奏</span>
            </div>
          </template>
          <div class="behavior-compare">
            <div><span>平均持仓时长</span><strong>{{ duration(review?.analysis.averageHoldingMinutes) }}</strong></div>
            <div><span>盈利交易持仓</span><strong class="positive-text">{{ duration(review?.analysis.winningHoldingMinutes) }}</strong></div>
            <div><span>亏损交易持仓</span><strong class="danger-text">{{ duration(review?.analysis.losingHoldingMinutes) }}</strong></div>
            <div><span>最长连亏</span><strong>{{ review?.metrics.maxLossStreak ?? 0 }} 笔</strong><small>当前连亏 {{ review?.metrics.currentLossStreak ?? 0 }} 笔</small></div>
          </div>
        </el-card>
      </div>

      <!-- ── Tab 2: 复盘 (Review / 风险与重大决策) ── -->
      <div v-else-if="activeTab === 'review'" class="tab-pane">
        <!-- 第一性结论卡片 -->
        <el-card shadow="never" class="section verdict-card" :class="verdictCardClass">
          <div class="verdict-kicker">复盘结论 · {{ review?.metrics.closedPositions ?? 0 }} 笔已平仓样本</div>
          <h2>{{ automaticVerdict.title }}</h2>
          <p>{{ automaticVerdict.detail }}</p>
        </el-card>

        <!-- 需处理项 -->
        <el-card shadow="never" class="section findings-section">
          <template #header>
            <div class="section-card-head">
              <span>需要你处理（{{ urgentFindings.length }} 项重大风险）</span>
              <span class="section-hint">优先固定硬规则，复杂深层归因一键外包给 ChatGPT</span>
            </div>
          </template>
          <template v-if="urgentFindings.length">
            <article v-for="item in urgentFindings" :key="item.id" class="finding-card" :class="'priority-' + item.priority">
              <div class="finding-head">
                <el-tag :type="priorityTag(item.priority)" size="small">{{ priorityLabel(item.priority) }}</el-tag>
                <strong>{{ item.title }}</strong>
              </div>
              <p class="finding-desc">{{ item.summary }}</p>
              <div class="rule-line"><b>建议下次开仓前：</b>{{ item.nextRule }}</div>
              <div class="finding-actions">
                <el-button size="small" type="primary" plain @click="switchTab('actions')">去开仓前拦截检查</el-button>
                <el-button size="small" text type="primary" @click="openFindingDeepAnalysis(item)">疑问→深度分析(GPT)</el-button>
              </div>
            </article>
          </template>
          <div v-else class="all-clear">
            <el-tag type="success" effect="plain">当前没有未处理的重大风险</el-tag>
            <span>仍建议每次开仓前执行一次拦截检查。</span>
          </div>

          <el-collapse v-if="(review?.findings.length ?? 0) > urgentFindings.length" class="secondary-findings">
            <el-collapse-item :title="'查看其余 ' + ((review?.findings.length ?? 0) - urgentFindings.length) + ' 项次要线索'">
              <article v-for="item in secondaryFindings" :key="item.id" class="finding-card" :class="'priority-' + item.priority">
                <div class="finding-head">
                  <el-tag :type="priorityTag(item.priority)" size="small">{{ priorityLabel(item.priority) }}</el-tag>
                  <strong>{{ item.title }}</strong>
                </div>
                <p class="finding-desc">{{ item.summary }}</p>
                <div class="rule-line"><b>建议下次开仓前：</b>{{ item.nextRule }}</div>
                <div class="finding-actions">
                  <el-button size="small" text type="primary" @click="openFindingDeepAnalysis(item)">疑问→深度分析(GPT)</el-button>
                </div>
              </article>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 场景与工具快捷跳转 -->
        <div class="review-shortcuts">
          <el-button type="primary" plain @click="switchTab('actions')">开仓前检查（执行重大失误拦截）→</el-button>
          <el-button @click="switchTab('policies')">调整交易风险边界（纪律）→</el-button>
          <el-button @click="switchTab('evidence')">查看交易表现明细与历史台账 →</el-button>
        </div>
      </div>

      <!-- ── Tab 3: 持仓 (Portfolio / 资产与头寸) ── -->
      <div v-else-if="activeTab === 'portfolio'" class="tab-pane">
        <!-- 持仓图表分析工具箱（资金分布、强平缓冲标尺、敏感度推演） -->
        <PortfolioAnalytics :positions="activePositions" :equity="latest.equity" />

        <!-- 当前活跃持仓 -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>当前合约头寸</span>
              <span class="head-hint">活跃仓位与未实现盈亏（自动同步至开仓前检查）</span>
            </div>
          </template>
          <el-table v-if="activePositions.length" :data="activePositions" size="small" border stripe>
            <el-table-column prop="symbol" label="合约" width="120" />
            <el-table-column prop="positionSide" label="方向" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.positionSide === 'SHORT' || Number(row.positionAmount) < 0 ? 'danger' : 'success'" effect="plain">
                  {{ formatPositionSide(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="leverage" label="杠杆" width="70">
              <template #default="{ row }">{{ row.leverage ? row.leverage + 'x' : '—' }}</template>
            </el-table-column>
            <el-table-column prop="positionAmount" label="持仓数量" min-width="100">
              <template #default="{ row }">{{ formatNumber(row.positionAmount) }}</template>
            </el-table-column>
            <el-table-column prop="entryPrice" label="开仓均价" min-width="100">
              <template #default="{ row }">{{ formatPrice(row.entryPrice || row.averageOpenPrice) }}</template>
            </el-table-column>
            <el-table-column prop="markPrice" label="标记价格" min-width="100">
              <template #default="{ row }">{{ formatPrice(row.markPrice) }}</template>
            </el-table-column>
            <el-table-column prop="unrealizedProfit" label="未实现盈亏" min-width="120">
              <template #default="{ row }">
                <span :class="pnlClass(Number(row.unrealizedProfit))">
                  {{ money(Number(row.unrealizedProfit) || 0) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="isolatedMargin" label="保证金" min-width="100">
              <template #default="{ row }">{{ money(Number(row.isolatedMargin || row.positionInitialMargin) || 0) }}</template>
            </el-table-column>
            <el-table-column prop="liquidationPrice" label="强平价" min-width="110">
              <template #default="{ row }">
                <span class="danger-text font-mono">{{ formatPrice(row.liquidationPrice) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="当前无活跃持仓头寸" :image-size="60" />
        </el-card>

        <!-- 账户资产与权益（支持隐藏0余额） -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>账户资产与权益（{{ displayedEquity.length }}/{{ latest.equity.length }} 个币种）</span>
              <div class="card-head-right-actions">
                <el-switch v-model="hideZeroBalances" active-text="仅看有余额资产" inactive-text="全部币种" size="small" />
              </div>
            </div>
          </template>
          <el-table :data="displayedEquity" size="small" border stripe>
            <el-table-column prop="asset" label="资产币种" width="110">
              <template #default="{ row }">
                <span class="font-bold">{{ row.asset }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="walletBalance" label="钱包余额" min-width="130">
              <template #default="{ row }">{{ formatNumber(row.walletBalance) }}</template>
            </el-table-column>
            <el-table-column prop="unrealizedProfit" label="未实现盈亏" min-width="130">
              <template #default="{ row }">
                <span :class="pnlClass(Number(row.unrealizedProfit))">
                  {{ formatNumber(row.unrealizedProfit) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="marginBalance" label="保证金余额" min-width="130">
              <template #default="{ row }">
                <b class="positive-text">{{ formatNumber(row.marginBalance) }}</b>
              </template>
            </el-table-column>
            <el-table-column prop="availableBalance" label="可用余额" min-width="130">
              <template #default="{ row }">{{ formatNumber(row.availableBalance) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- ── Tab 4: 纪律 (Policies / 风控规则) ── -->
      <div v-else-if="activeTab === 'policies'" class="tab-pane">
        <el-card shadow="never" class="section verdict-card" :class="management.rulesConfirmed ? 'verdict-ok' : 'verdict-warn'">
          <div class="verdict-kicker">规则状态</div>
          <h2>{{ management.rulesConfirmed ? '已声明本人的交易风险边界' : '尚未声明本人的交易风险边界' }}</h2>
          <p>系统不提供适用于你的默认阈值。只有逐项填写并主动确认后，规则对照才会启用；检查结果也不代表交易安全或可以执行。</p>
          <div class="verdict-actions">
            <el-button type="primary" size="small" @click="saveRules">确认本人规则并重新计算</el-button>
            <el-button v-if="management.rulesConfirmed" size="small" @click="revokeRules">撤销规则确认</el-button>
            <el-button v-if="management.rulesConfirmed" size="small" text type="primary" @click="openFullDeepAnalysis">生成规则复盘事实包</el-button>
          </div>
        </el-card>

        <!-- 规则配置表单（支持用户自定义修改） -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>交易风险边界规则设置</span>
              <span class="head-hint">所有数值必须由你根据自己的账户范围和纪律声明</span>
            </div>
          </template>
          <el-form label-position="top" size="small">
            <div class="rule-grid">
              <el-form-item label="本人声明的最大杠杆倍数">
                <el-input-number v-model="management.rules.maxLeverage" :min="1" :max="125" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的单笔最大损失（占权益%）">
                <el-input-number v-model="management.rules.maxRiskPerTradePct" :min="0.1" :max="20" :step="0.1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的账户单日损失边界（占权益%）">
                <el-input-number v-model="management.rules.maxDailyLossPct" :min="0.5" :max="30" :step="0.5" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的单笔保证金上限（占权益%）">
                <el-input-number v-model="management.rules.maxMarginPerTradePct" :min="1" :max="100" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的单标的暴露上限（占权益%）">
                <el-input-number v-model="management.rules.maxSymbolExposurePct" :min="1" :max="100" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的最大同时持仓数">
                <el-input-number v-model="management.rules.maxConcurrentPositions" :min="1" :max="10" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的连续亏损暂停阈值">
                <el-input-number v-model="management.rules.maxConsecutiveLosses" :min="1" :max="20" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的连亏后冷静期（小时）">
                <el-input-number v-model="management.rules.cooldownHoursAfterLossStreak" :min="1" :max="72" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的单日最大交易笔数">
                <el-input-number v-model="management.rules.maxTradesPerDay" :min="1" :max="50" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人声明的最小目标盈亏比">
                <el-input-number v-model="management.rules.minRewardRiskRatio" :min="1" :max="5" :step="0.5" style="width: 100%" />
              </el-form-item>
              <el-form-item label="本人是否要求每笔计划记录止损">
                <el-switch v-model="management.rules.requireStopLoss" active-text="强制止损" inactive-text="可选止损" />
              </el-form-item>
            </div>
            <div class="form-actions-row">
              <el-button type="primary" @click="saveRules">确认本人规则并重新计算</el-button>
              <el-button v-if="management.rulesConfirmed" @click="revokeRules">撤销规则确认</el-button>
            </div>
          </el-form>
        </el-card>
      </div>

      <!-- ── Tab 5: 待办 (Actions / 待办汇总 + 极简开仓拦截 + 深度分析外包) ── -->
      <div v-else-if="activeTab === 'actions'" class="tab-pane">
        <!-- 深度分析外包声明（与基金复盘助手同风格） -->
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="深度分析外包给通用大模型"
          description="把收益质量、尾部风险、行为维度、已声明规则和数据边界整理成事实包，由外部模型独立分析。系统不提供默认交易参数，不调 AI，不替你判断，也不自动外传。"
          class="section-alert"
        />

        <!-- 1. 待办汇总（来自复盘 / 纪律 / 采集 / 明细）· N 项 -->
        <el-card v-if="todoList.length" shadow="never" class="section todo-card">
          <template #header>
            <div class="card-head-row">
              <span>待办汇总（来自复盘 / 纪律 / 采集 / 明细）· {{ todoList.length }} 项</span>
              <el-tag type="warning" size="small" effect="plain">{{ urgentFindings.length ? '存在重大阻断项' : '待处理' }}</el-tag>
            </div>
          </template>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="todo-note"
            description="以下为各页需要你处理的事项，每条附去向按钮；复杂问题可一键外包给 GPT。系统只汇总事实，不替你判断怎么处理。"
          />
          <div v-for="(todo, index) in todoList" :key="index" class="todo-group">
            <span class="todo-source">{{ todo.source }}</span>
            <div class="todo-item" :class="{ 'is-danger': todo.priority === 'critical' }">
              <span class="todo-text">{{ todo.title }}</span>
              <small v-if="todo.detail" class="todo-detail">{{ todo.detail }}</small>
              <div class="todo-btn-group">
                <el-button size="small" type="primary" plain @click="todo.action">{{ todo.actionText }}</el-button>
                <el-button v-if="todo.finding" size="small" text type="primary" @click="openFindingDeepAnalysis(todo.finding)">深度分析→GPT</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          class="section-alert"
          title="当前没有可列出的规则偏离"
          description="这不代表交易安全或可以执行；可能是尚未声明规则、数据不足，或当前事实未触发已声明的边界。"
        />

        <!-- 2. 用户声明计划与本人规则的机械对照 -->
        <el-card shadow="never" class="section preflight-card">
          <template #header>
            <div class="card-head-row">
              <span>交易计划与本人规则对照</span>
              <div class="card-head-right-actions">
                <el-button size="small" @click="syncPreflightFacts">同步已采集账户事实</el-button>
              </div>
            </div>
          </template>

          <section class="preflight-layout">
            <el-form label-position="top" size="small" class="preflight-form">
              <!-- 账户现状快速指标栏（只读 / 自动同步） -->
              <div class="account-facts-bar">
                <span>账户权益 <b>{{ money(preflight.accountEquity) }}</b></span>
                <span>当前持仓 <b>{{ preflight.currentOpenPositions }} 个</b></span>
                <span>当前连亏 <b>{{ preflight.consecutiveLosses }} 笔</b></span>
                <span>声明杠杆上限 <b>{{ management.rulesConfirmed ? management.rules.maxLeverage + 'x' : '未确认' }}</b></span>
                <span>声明单笔损失边界 <b>{{ management.rulesConfirmed ? management.rules.maxRiskPerTradePct + '%' : '未确认' }}</b></span>
              </div>

              <div class="form-grid">
                <el-form-item label="合约代码">
                  <el-input v-model="preflight.symbol" placeholder="ETHUSDT" />
                </el-form-item>
                <el-form-item label="交易方向">
                  <el-segmented v-model="preflight.direction" :options="['LONG', 'SHORT']" style="width: 100%" />
                </el-form-item>
                <el-form-item label="计划使用的杠杆倍数">
                  <el-input-number v-model="preflight.leverage" :min="1" :max="125" style="width: 100%" />
                </el-form-item>
                <el-form-item label="拟入场价（USDT）">
                  <el-input-number v-model="preflight.entryPrice" :min="0" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="计划委托数量（手工输入）">
                  <el-input-number v-model="preflight.quantity" :min="0" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="计划止损价（手工输入）">
                  <el-input-number v-model="preflight.stopPrice" :min="0" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="计划止盈价（可选，手工输入）">
                  <el-input-number v-model="preflight.takeProfitPrice" :min="0" :precision="4" style="width: 100%" />
                </el-form-item>
                <el-form-item label="当前标的暴露（%）">
                  <el-input-number v-model="preflight.currentSymbolExposurePct" :min="0" :max="100" style="width: 100%" />
                </el-form-item>
              </div>

              <el-form-item label="交易理由、失效条件、不交易条件（简单记录思路）">
                <el-input v-model="preflight.thesis" type="textarea" :rows="2" placeholder="例如：突破4小时阻力位做多，跌破前低止损，若盘中出现放量反转则放弃" />
              </el-form-item>

              <div class="preflight-btn-row">
                <el-button type="primary" size="large" class="main-check-btn" :disabled="!management.rulesConfirmed" @click="runPreflight">对照本人已确认规则</el-button>
                <el-button v-if="preflightResult" size="large" @click="openPreflightDeepAnalysis">针对此计划→GPT独立复核</el-button>
              </div>
            </el-form>

            <!-- 只说明与本人规则是否一致，不提供执行许可 -->
            <el-card v-if="preflightResult" shadow="never" class="result-card" :class="'verdict-' + preflightResult.verdict">
              <template #header>
                <div class="verdict-head">
                  <div>
                    <p class="eyebrow">规则对照结果</p>
                    <h3>{{ verdictTitle(preflightResult.verdict) }}</h3>
                  </div>
                  <el-tag :type="verdictType(preflightResult.verdict)" effect="dark">{{ verdictTag(preflightResult.verdict) }}</el-tag>
                </div>
              </template>
              <div class="result-metrics">
                <span>名义价值 <b>{{ money(preflightResult.notional) }}</b></span>
                <span>占用保证金 <b>{{ money(preflightResult.initialMargin) }}</b></span>
                <span>单笔止损风险 <b>{{ preflightResult.riskPct?.toFixed(2) ?? '—' }}%</b></span>
                <span>计划盈亏比 <b>{{ preflightResult.rewardRiskRatio?.toFixed(2) ?? '—' }}</b></span>
              </div>
              <div v-for="item in preflightResult.checks" :key="item.id" class="check-row" :class="'check-' + item.severity">
                <span class="check-icon-box">{{ checkIcon(item.severity) }}</span>
                <div>
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.detail }}</small>
                </div>
              </div>
              <div class="result-footer-actions">
                <el-button size="small" type="primary" plain @click="openPreflightDeepAnalysis">
                  生成此计划的独立复核事实包
                </el-button>
              </div>
            </el-card>
          </section>
        </el-card>

        <!-- 3. 深度分析上下文（ChatGPT 事实包） -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>深度分析事实包</span>
              <span class="head-hint">生成标准化事实包交给 ChatGPT 进行独立归因</span>
            </div>
          </template>
          <p class="hint">生成内容是“历史事实快照＋规则配置＋数据质量”，不是站内预测报告。外部模型需要结合最新行情独立分析。</p>
          <div class="deep-actions">
            <el-button type="primary" @click="openFullDeepAnalysis">生成全量深度分析事实包</el-button>
            <el-button @click="openChatGpt">一键跳转 ChatGPT</el-button>
          </div>
        </el-card>

        <!-- 4. 历史检查记录 -->
        <el-card v-if="management.preflightHistory.length" shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>开仓检查历史记录（近 {{ management.preflightHistory.length }} 条）</span>
            </div>
          </template>
          <el-table :data="management.preflightHistory" size="small" border stripe>
            <el-table-column prop="id" label="时间" min-width="140">
              <template #default="{ row }">{{ formatTime(row.result.checkedAt) }}</template>
            </el-table-column>
            <el-table-column prop="input.symbol" label="合约" width="100" />
            <el-table-column prop="input.direction" label="方向" width="80" />
            <el-table-column prop="input.leverage" label="杠杆" width="70">
              <template #default="{ row }">{{ row.input.leverage }}x</template>
            </el-table-column>
            <el-table-column label="检查结论" width="100">
              <template #default="{ row }">
                <el-tag :type="verdictType(row.result.verdict)" size="small">{{ row.result.verdict.toUpperCase() }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="input.thesis" label="交易理由与说明" min-width="180" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>

      <!-- ── Tab 6: 明细 (Evidence / 表现与可验证历史明细) ── -->
      <div v-else-if="activeTab === 'evidence'" class="tab-pane">
        <!-- 平台对账与底层数据核对指引卡（口径对账溯源） -->
        <el-card shadow="never" class="section audit-guide-card">
          <template #header>
            <div class="card-head-row">
              <span>平台口径对账与核对路径（确保数据真实与底层穿透）</span>
              <el-tag type="success" effect="plain" size="small">币安真实采集账本</el-tag>
            </div>
          </template>
          <div class="audit-guide-content">
            <div class="audit-guide-grid">
              <div class="audit-guide-item">
                <span class="guide-title">🔍 资金流水核对路径</span>
                <p>登录币安网页/App →【合约交易】→【合约对账单】/【资金流水】，可使用 <code>transactionId / recordId</code> 按单号精准查账。</p>
              </div>
              <div class="audit-guide-item">
                <span class="guide-title">🔍 已平仓持仓核对路径</span>
                <p>登录币安 →【合约交易】→【持仓历史】/【平仓盈亏】，通过 <code>positionId</code> 核对开平仓均价、实际盈亏与已扣手续费。</p>
              </div>
              <div class="audit-guide-item">
                <span class="guide-title">🔍 委托与撮合成交核对</span>
                <p>登录币安 →【合约交易】→【历史委托】与【成交历史】，使用 <code>orderId / tradeId</code> 核对成交价格与手续费扣除记录。</p>
              </div>
              <div class="audit-guide-item">
                <span class="guide-title">📐 口径计算公式完全公开</span>
                <p><b>平仓盈亏</b> = 卖出总额 - 买入成本；<b>净盈亏</b> = Σ已实现盈亏 - Σ交易手续费 + Σ资金费用。系统不做任何主观篡改。</p>
              </div>
            </div>

            <!-- 全局单号极速检索器 -->
            <div class="id-search-bar">
              <span class="search-label">平台单号快速定位：</span>
              <el-input
                v-model="globalIdSearch"
                placeholder="输入任一平台单号（如 ID-0012、orderId、tradeId、transactionId）快速核验"
                clearable
                size="small"
                style="max-width: 460px"
              />
              <span v-if="globalIdSearchResult" class="search-result-hint">
                已在 <b>{{ globalIdSearchResult.dataset }}</b> 找到对应记录（{{ globalIdSearchResult.summary }}）
              </span>
            </div>
          </div>
        </el-card>

        <!-- 交易表现多维明细 -->
        <el-card shadow="never" class="section dimension-card">
          <template #header>
            <div class="card-head-row">
              <span>哪里赚钱，哪里亏钱（多维表现明细）</span>
              <span class="head-hint">标的、方向、持仓时长、时段和星期自动分组；支持表头点击排序；小样本只作线索</span>
            </div>
          </template>
          <el-tabs v-model="dimensionTab" class="dimension-tabs">
            <el-tab-pane label="标的" name="symbol">
              <PerformanceTable :rows="review?.analysis.bySymbol ?? []" />
            </el-tab-pane>
            <el-tab-pane label="方向" name="direction">
              <PerformanceTable :rows="review?.analysis.byDirection ?? []" />
            </el-tab-pane>
            <el-tab-pane label="持仓时长" name="holding">
              <PerformanceTable :rows="review?.analysis.byHoldingPeriod ?? []" />
            </el-tab-pane>
            <el-tab-pane label="开仓时段" name="session">
              <PerformanceTable :rows="review?.analysis.byTradingSession ?? []" />
            </el-tab-pane>
            <el-tab-pane label="星期" name="weekday">
              <PerformanceTable :rows="review?.analysis.byWeekday ?? []" />
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 可验证事实明细（持仓/订单/成交/流水历史，含筛选、分页、展开底层字段与单号复制） -->
        <el-card shadow="never" class="section evidence-facts-card">
          <template #header>
            <div class="card-head-row">
              <span>可验证事实明细（逐笔可核对 · 底层单号与原始字段全关联）</span>
              <span class="head-hint">点击单号可一键复制去币安查账；点击左侧 ▶ 可展开查看全部底层原始采集字段</span>
            </div>
          </template>
          <el-tabs v-model="evidenceTab">
            <!-- 1. 持仓历史 -->
            <el-tab-pane :label="`持仓历史 (${filteredPositions.length}/${latest.positionHistory.length})`" name="positions">
              <!-- 筛选工具条 -->
              <div class="filter-toolbar">
                <div class="filter-inputs">
                  <el-select v-model="posFilterSymbol" clearable placeholder="全部标的" size="small" style="width: 140px" @change="posPage = 1">
                    <el-option v-for="s in availablePosSymbols" :key="s" :label="s" :value="s" />
                  </el-select>
                  <el-select v-model="posFilterSide" clearable placeholder="全部方向" size="small" style="width: 120px" @change="posPage = 1">
                    <el-option label="多头 (LONG)" value="LONG" />
                    <el-option label="空头 (SHORT)" value="SHORT" />
                  </el-select>
                  <el-select v-model="posFilterPnl" placeholder="盈亏状态" size="small" style="width: 120px" @change="posPage = 1">
                    <el-option label="全部盈亏" value="all" />
                    <el-option label="仅看盈利" value="profit" />
                    <el-option label="仅看亏损" value="loss" />
                  </el-select>
                  <el-button size="small" text @click="resetPosFilter">重置</el-button>
                </div>
                <div class="filter-stat-summary">
                  <span>筛选共 <b>{{ posSummary.total }}</b> 笔</span>
                  <span class="positive-text">盈利 <b>{{ posSummary.win }}</b> 笔</span>
                  <span class="danger-text">亏损 <b>{{ posSummary.loss }}</b> 笔</span>
                  <span>胜率 <b>{{ posSummary.winRate }}%</b></span>
                  <span>合计盈亏 <b :class="pnlClass(Number(posSummary.totalPnl))">{{ posSummary.totalPnl }} USDT</b></span>
                </div>
              </div>

              <!-- 表格（支持展开底层字段 + 单号复制 + 关联穿透） -->
              <el-table :data="pagedPositions" size="small" border stripe>
                <!-- 展开行：展示底层原始事实档案 -->
                <el-table-column type="expand" width="40">
                  <template #default="{ row }">
                    <div class="raw-fact-expand">
                      <div class="raw-fact-title">底层原始采集事实字段（币安 API 原生数据）：</div>
                      <div class="raw-fact-grid">
                        <div><span>平台持仓单号 (positionId)：</span><code>{{ row.positionId || '—' }}</code></div>
                        <div><span>记录编号 (recordId)：</span><code>{{ row.recordId || '—' }}</code></div>
                        <div><span>开仓规模 (openedVolume)：</span><b>{{ formatNumber(row.openedVolume) }}</b></div>
                        <div><span>平仓规模 (closedVolume)：</span><b>{{ formatNumber(row.closedVolume) }}</b></div>
                        <div><span>总手续费 (tradingFeeTotal)：</span><b>{{ formatNumber(row.tradingFeeTotal || row.tradingFee) }} USDT</b></div>
                        <div><span>累计资金费 (fundingFee)：</span><b>{{ formatNumber(row.fundingFee) }} USDT</b></div>
                        <div><span>保险清算费 (insuranceClearFee)：</span><b>{{ formatNumber(row.insuranceClearFee) }}</b></div>
                        <div><span>收益率 (ROI)：</span><b>{{ row.roi ? (Number(row.roi) * 100).toFixed(2) + '%' : '—' }}</b></div>
                        <div><span>开仓时间 (openedAt)：</span><span>{{ formatTime(row.openedAt) }}</span></div>
                        <div><span>平仓时间 (closedAt)：</span><span>{{ formatTime(row.closedAt) }}</span></div>
                      </div>
                      <div class="raw-fact-drilldown">
                        <span>底层穿透：</span>
                        <el-button size="small" text type="primary" @click="drillDownSymbol(row.symbol, 'orders')">查看该标的订单历史 →</el-button>
                        <el-button size="small" text type="primary" @click="drillDownSymbol(row.symbol, 'trades')">查看该标的成交明细 →</el-button>
                        <el-button size="small" text type="primary" @click="drillDownSymbol(row.symbol, 'transactions')">查看该标的资金流水 →</el-button>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="closedAt" label="平仓时间" min-width="140">
                  <template #default="{ row }">{{ formatTime(row.closedAt || row.updatedAt) }}</template>
                </el-table-column>
                <el-table-column prop="symbol" label="合约" width="110">
                  <template #default="{ row }">
                    <span class="symbol-link" @click="drillDownSymbol(row.symbol, 'orders')">{{ row.symbol }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="positionSide" label="方向" width="90">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.positionSide === 'LONG' || row.side === 'LONG' ? 'success' : 'danger'" effect="plain">
                      {{ formatPositionSide(row) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="leverage" label="杠杆" width="70">
                  <template #default="{ row }">{{ row.leverage ? row.leverage + 'x' : '—' }}</template>
                </el-table-column>
                <el-table-column prop="averageOpenPrice" label="开仓均价" min-width="100" sortable>
                  <template #default="{ row }">{{ formatPrice(row.averageOpenPrice) }}</template>
                </el-table-column>
                <el-table-column prop="averageClosePrice" label="平仓均价" min-width="100" sortable>
                  <template #default="{ row }">{{ formatPrice(row.averageClosePrice) }}</template>
                </el-table-column>
                <el-table-column prop="closingPnl" label="平仓盈亏" min-width="110" sortable>
                  <template #default="{ row }">
                    <span :class="pnlClass(Number(row.closingPnl))">{{ money(Number(row.closingPnl) || 0) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="平台持仓单号 (positionId)" min-width="160">
                  <template #default="{ row }">
                    <div class="source-id-cell" :title="row.positionId || row.recordId">
                      <span class="source-id-text">{{ shortenId(row.positionId || row.recordId) }}</span>
                      <el-button size="small" text type="primary" class="copy-btn" @click="copyText(row.positionId || row.recordId, '持仓单号')">复制</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页器 -->
              <div class="table-pagination">
                <el-pagination
                  v-model:current-page="posPage"
                  v-model:page-size="posPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="filteredPositions.length"
                  layout="total, sizes, prev, pager, next, jumper"
                  size="small"
                />
              </div>
            </el-tab-pane>

            <!-- 2. 订单历史 -->
            <el-tab-pane :label="`订单历史 (${filteredOrders.length}/${latest.orderHistory.length})`" name="orders">
              <!-- 筛选工具条 -->
              <div class="filter-toolbar">
                <div class="filter-inputs">
                  <el-select v-model="orderFilterSymbol" clearable placeholder="全部标的" size="small" style="width: 140px" @change="orderPage = 1">
                    <el-option v-for="s in availableOrderSymbols" :key="s" :label="s" :value="s" />
                  </el-select>
                  <el-select v-model="orderFilterSide" clearable placeholder="买卖" size="small" style="width: 100px" @change="orderPage = 1">
                    <el-option label="BUY 买入" value="BUY" />
                    <el-option label="SELL 卖出" value="SELL" />
                  </el-select>
                  <el-select v-model="orderFilterPosSide" clearable placeholder="持仓方向" size="small" style="width: 110px" @change="orderPage = 1">
                    <el-option label="LONG 多" value="LONG" />
                    <el-option label="SHORT 空" value="SHORT" />
                    <el-option label="BOTH 双向" value="BOTH" />
                  </el-select>
                  <el-select v-model="orderFilterType" clearable placeholder="订单类型" size="small" style="width: 130px" @change="orderPage = 1">
                    <el-option v-for="t in availableOrderTypes" :key="t" :label="t" :value="t" />
                  </el-select>
                  <el-select v-model="orderFilterStatus" clearable placeholder="状态" size="small" style="width: 120px" @change="orderPage = 1">
                    <el-option v-for="st in availableOrderStatuses" :key="st" :label="st" :value="st" />
                  </el-select>
                  <el-button size="small" text @click="resetOrderFilter">重置</el-button>
                </div>
                <div class="filter-stat-summary">
                  <span>共 <b>{{ filteredOrders.length }}</b> 条订单</span>
                </div>
              </div>

              <!-- 表格 -->
              <el-table :data="pagedOrders" size="small" border stripe>
                <el-table-column type="expand" width="40">
                  <template #default="{ row }">
                    <div class="raw-fact-expand">
                      <div class="raw-fact-title">委托订单底层原生字段：</div>
                      <div class="raw-fact-grid">
                        <div><span>委托单号 (orderId)：</span><code>{{ row.orderId || '—' }}</code></div>
                        <div><span>客户端自定义单号 (clientOrderId)：</span><code>{{ row.clientOrderId || '—' }}</code></div>
                        <div><span>历史编号 (historyId)：</span><code>{{ row.historyId || '—' }}</code></div>
                        <div><span>原始订单类型 (originalType)：</span><b>{{ row.originalType || row.type }}</b></div>
                        <div><span>是否只减仓 (reduceOnly)：</span><b>{{ row.reduceOnly ? '是' : '否' }}</b></div>
                        <div><span>是否平仓单 (closePosition)：</span><b>{{ row.closePosition ? '是' : '否' }}</b></div>
                        <div><span>创建时间 (insertedAt)：</span><span>{{ formatTime(row.insertedAt) }}</span></div>
                        <div><span>更新时间 (updatedAt)：</span><span>{{ formatTime(row.updatedAt) }}</span></div>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="updatedAt" label="更新时间" min-width="140">
                  <template #default="{ row }">{{ formatTime(row.updatedAt || row.insertedAt) }}</template>
                </el-table-column>
                <el-table-column prop="symbol" label="合约" width="110" />
                <el-table-column prop="side" label="买卖" width="80">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.side === 'BUY' ? 'success' : 'danger'" effect="plain">{{ formatSide(row.side) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="订单类型" width="110">
                  <template #default="{ row }">
                    <el-tag size="small" effect="plain">{{ formatOrderType(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="price" label="委托价" min-width="90">
                  <template #default="{ row }">{{ formatPrice(row.price || row.averagePrice) }}</template>
                </el-table-column>
                <el-table-column label="成交/委托量" min-width="120">
                  <template #default="{ row }">
                    {{ formatNumber(row.executedQuantity) }} / {{ formatNumber(row.originalQuantity) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'FILLED' ? 'success' : row.status === 'CANCELED' ? 'info' : 'warning'">
                      {{ formatOrderStatus(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="委托单号 (orderId)" min-width="150">
                  <template #default="{ row }">
                    <div class="source-id-cell" :title="row.orderId">
                      <span class="source-id-text">{{ shortenId(row.orderId) }}</span>
                      <el-button size="small" text type="primary" class="copy-btn" @click="copyText(row.orderId, '委托单号')">复制</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页器 -->
              <div class="table-pagination">
                <el-pagination
                  v-model:current-page="orderPage"
                  v-model:page-size="orderPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="filteredOrders.length"
                  layout="total, sizes, prev, pager, next, jumper"
                  size="small"
                />
              </div>
            </el-tab-pane>

            <!-- 3. 成交记录 -->
            <el-tab-pane :label="`成交记录 (${filteredTrades.length}/${latest.tradeHistory.length})`" name="trades">
              <!-- 筛选工具条 -->
              <div class="filter-toolbar">
                <div class="filter-inputs">
                  <el-select v-model="tradeFilterSymbol" clearable placeholder="全部标的" size="small" style="width: 140px" @change="tradePage = 1">
                    <el-option v-for="s in availableTradeSymbols" :key="s" :label="s" :value="s" />
                  </el-select>
                  <el-select v-model="tradeFilterSide" clearable placeholder="买卖" size="small" style="width: 100px" @change="tradePage = 1">
                    <el-option label="BUY 买入" value="BUY" />
                    <el-option label="SELL 卖出" value="SELL" />
                  </el-select>
                  <el-select v-model="tradeFilterPnl" placeholder="盈亏状态" size="small" style="width: 120px" @change="tradePage = 1">
                    <el-option label="全部" value="all" />
                    <el-option label="仅看实现盈利" value="profit" />
                    <el-option label="仅看实现亏损" value="loss" />
                  </el-select>
                  <el-button size="small" text @click="resetTradeFilter">重置</el-button>
                </div>
                <div class="filter-stat-summary">
                  <span>共 <b>{{ filteredTrades.length }}</b> 笔成交</span>
                </div>
              </div>

              <!-- 表格 -->
              <el-table :data="pagedTrades" size="small" border stripe>
                <el-table-column type="expand" width="40">
                  <template #default="{ row }">
                    <div class="raw-fact-expand">
                      <div class="raw-fact-title">撮合成交底层原生字段：</div>
                      <div class="raw-fact-grid">
                        <div><span>成交ID (tradeId)：</span><code>{{ row.tradeId || '—' }}</code></div>
                        <div><span>关联委托单号 (orderId)：</span><code>{{ row.orderId || '—' }}</code></div>
                        <div><span>是否主动吃单买入 (activeBuy)：</span><b>{{ row.activeBuy ? '是 (Taker)' : '否 (Maker)' }}</b></div>
                        <div><span>成交价格 (price)：</span><b>{{ formatPrice(row.price) }}</b></div>
                        <div><span>成交数量 (quantity)：</span><b>{{ formatNumber(row.quantity || row.qty) }}</b></div>
                        <div><span>实现盈亏 (realizedProfit)：</span><b :class="pnlClass(Number(row.realizedProfit ?? row.realizedPnl))">{{ money(Number(row.realizedProfit ?? row.realizedPnl) || 0) }}</b></div>
                        <div><span>手续费扣除 (commission)：</span><b>{{ formatNumber(row.commission) }} {{ row.commissionAsset || 'USDT' }}</b></div>
                        <div><span>成交毫秒时间戳：</span><span>{{ row.time }}</span></div>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="time" label="成交时间" min-width="140">
                  <template #default="{ row }">{{ formatTime(row.time) }}</template>
                </el-table-column>
                <el-table-column prop="symbol" label="合约" width="110" />
                <el-table-column prop="side" label="买卖" width="80">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.side === 'BUY' ? 'success' : 'danger'" effect="plain">{{ formatSide(row.side) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="price" label="成交价" min-width="100" sortable>
                  <template #default="{ row }">{{ formatPrice(row.price) }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="成交量" min-width="90" sortable>
                  <template #default="{ row }">{{ formatNumber(row.quantity || row.qty) }}</template>
                </el-table-column>
                <el-table-column prop="realizedProfit" label="已实现盈亏" min-width="110" sortable>
                  <template #default="{ row }">
                    <span :class="pnlClass(Number(row.realizedProfit ?? row.realizedPnl))">
                      {{ money(Number(row.realizedProfit ?? row.realizedPnl) || 0) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="commission" label="手续费" min-width="100">
                  <template #default="{ row }">
                    {{ formatNumber(row.commission) }} {{ row.commissionAsset || 'USDT' }}
                  </template>
                </el-table-column>
                <el-table-column label="成交单号 (tradeId)" min-width="150">
                  <template #default="{ row }">
                    <div class="source-id-cell" :title="row.tradeId">
                      <span class="source-id-text">{{ shortenId(row.tradeId) }}</span>
                      <el-button size="small" text type="primary" class="copy-btn" @click="copyText(row.tradeId, '成交单号')">复制</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页器 -->
              <div class="table-pagination">
                <el-pagination
                  v-model:current-page="tradePage"
                  v-model:page-size="tradePageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="filteredTrades.length"
                  layout="total, sizes, prev, pager, next, jumper"
                  size="small"
                />
              </div>
            </el-tab-pane>

            <!-- 4. 资金流水 -->
            <el-tab-pane :label="`资金流水 (${filteredTransactions.length}/${latest.transactionHistory.length})`" name="transactions">
              <!-- 筛选工具条 -->
              <div class="filter-toolbar">
                <div class="filter-inputs">
                  <el-select v-model="txFilterAsset" clearable placeholder="资产币种" size="small" style="width: 120px" @change="txPage = 1">
                    <el-option v-for="a in availableTxAssets" :key="a" :label="a" :value="a" />
                  </el-select>
                  <el-select v-model="txFilterType" clearable placeholder="流水类型" size="small" style="width: 160px" @change="txPage = 1">
                    <el-option v-for="t in availableTxTypes" :key="t" :label="t" :value="t" />
                  </el-select>
                  <el-button size="small" text @click="resetTxFilter">重置</el-button>
                </div>
                <div class="filter-stat-summary">
                  <span>共 <b>{{ filteredTransactions.length }}</b> 笔资金流水</span>
                </div>
              </div>

              <!-- 表格 -->
              <el-table :data="pagedTransactions" size="small" border stripe>
                <el-table-column type="expand" width="40">
                  <template #default="{ row }">
                    <div class="raw-fact-expand">
                      <div class="raw-fact-title">资金账单底层原生字段：</div>
                      <div class="raw-fact-grid">
                        <div><span>平台流水编号 (transactionId)：</span><code>{{ row.transactionId || '—' }}</code></div>
                        <div><span>记录编号 (recordId)：</span><code>{{ row.recordId || '—' }}</code></div>
                        <div><span>业务类型代码 (type)：</span><b>{{ row.type }}</b></div>
                        <div><span>业务中文说明 (typeLabel)：</span><b>{{ row.typeLabel || row.type }}</b></div>
                        <div><span>详细业务描述 (description)：</span><span>{{ row.description || '—' }}</span></div>
                        <div><span>变动金额 (amount)：</span><b :class="pnlClass(Number(row.amount))">{{ formatNumber(row.amount) }} {{ row.asset }}</b></div>
                        <div><span>流水发生时间：</span><span>{{ formatTime(row.time) }}</span></div>
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column prop="time" label="时间" min-width="140" sortable>
                  <template #default="{ row }">{{ formatTime(row.time) }}</template>
                </el-table-column>
                <el-table-column prop="asset" label="资产" width="80" />
                <el-table-column prop="type" label="流水类型" width="130">
                  <template #default="{ row }">
                    <el-tag size="small" effect="plain">{{ formatTransactionType(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="symbol" label="涉及合约" width="110">
                  <template #default="{ row }">{{ row.symbol || '—' }}</template>
                </el-table-column>
                <el-table-column prop="amount" label="变动金额" min-width="110" sortable>
                  <template #default="{ row }">
                    <span :class="pnlClass(Number(row.amount))">{{ formatNumber(row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="平台流水单号 (transactionId)" min-width="160">
                  <template #default="{ row }">
                    <div class="source-id-cell" :title="row.transactionId || row.recordId">
                      <span class="source-id-text">{{ shortenId(row.transactionId || row.recordId) }}</span>
                      <el-button size="small" text type="primary" class="copy-btn" @click="copyText(row.transactionId || row.recordId, '流水单号')">复制</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 分页器 -->
              <div class="table-pagination">
                <el-pagination
                  v-model:current-page="txPage"
                  v-model:page-size="txPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="filteredTransactions.length"
                  layout="total, sizes, prev, pager, next, jumper"
                  size="small"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>

      <!-- ── Tab 7: 采集 (Data / 来源与采集) ── -->
      <div v-else-if="activeTab === 'data'" class="tab-pane">
        <!-- 数据状态第一性结论 -->
        <el-card shadow="never" class="section verdict-card verdict-ok">
          <div class="verdict-kicker">数据采集与本地台账状态</div>
          <h2>{{ dataVerdictTitle }}</h2>
          <p>数据采集仅读取交易所导出快照或插件同步，绝不发起任何真实链上/交易所交易；所有风控指标与复盘结论均在本地沙箱内确定性计算。</p>
          <div class="verdict-actions">
            <el-button type="primary" size="small" :loading="busy" :disabled="pending" @click="collect">重新采集数据</el-button>
            <el-button size="small" :loading="busy" :disabled="!pending" @click="importPending">读取待导入插件数据</el-button>
            <el-button size="small" @click="importBundledSnapshot">重新导入内置脱敏快照</el-button>
            <el-button v-if="pending" size="small" :disabled="busy" @click="discard">丢弃插件暂存</el-button>
          </div>
        </el-card>

        <!-- 原始采集事实档案 -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>原始采集事实档案</span>
              <el-tag type="success" size="small" effect="plain">本地已归档 {{ archiveCount }} 批历史数据</el-tag>
            </div>
          </template>
          <p class="archive-summary">最新快照时间：<b>{{ formatTime(latest.capturedAt) }}</b> · 数据协议：<b>{{ formatProtocol(latest.protocol) }}</b></p>
          <p class="archive-boundary">完整的原始 API 响应对象安全加密保存在本地浏览器 IndexedDB 中，作为不可篡改的事实审计源；标准化账本负责指标与风控计算；导出与深度分析已自动完成脱敏处理。</p>
          <div class="archive-actions">
            <el-button size="small" @click="exportLatest(false)">导出正式快照 (.json)</el-button>
            <el-button size="small" @click="exportLatest(true)">导出脱敏分享快照 (.json)</el-button>
          </div>
        </el-card>

        <!-- 采集分支与覆盖度 -->
        <el-card shadow="never" class="section">
          <template #header>
            <div class="card-head-row">
              <span>数据采集分支与覆盖度审计</span>
              <span class="head-hint">核验各数据维度的完整性与记录总数</span>
            </div>
          </template>
          <div v-if="branchList.length" class="branches">
            <div v-for="branch in branchList" :key="branch.label" class="branch">
              <span>{{ formatBranchLabel(branch.label) }}</span>
              <strong>{{ formatBranchStatus(branch.status) }}{{ branch.total ? ' · 共 ' + branch.total + ' 条' : '' }}</strong>
              <small v-if="branch.pageCount || branch.windowsTotal">
                {{ branch.pageCount ? branch.pageCount + ' 页' : '' }}
                {{ branch.windowsTotal ? ' · ' + (branch.windowsCompleted || 0) + '/' + branch.windowsTotal + ' 时间段' : '' }}
              </small>
            </div>
          </div>
          <div class="coverage-tags">
            <el-tag v-for="item in latest.coverage" :key="item.dataset" :type="item.completeness === 'complete' ? 'success' : 'warning'" effect="plain" class="cov-tag">
              {{ formatDatasetName(item.dataset) }}：{{ formatCompleteness(item.completeness) }} (完整记录: {{ item.completeRecordCount ?? 0 }}/总数: {{ item.recordCount ?? 0 }})
            </el-tag>
          </div>
        </el-card>
      </div>
    </div>

    <!-- ChatGPT 深度分析弹窗（聚焦单项 / 开仓计划 / 全量整体） -->
    <el-dialog v-model="deepAnalysis.visible" :title="deepAnalysis.title" width="760px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="统计由确定性引擎完成，复杂归因与盲点审查交给 ChatGPT"
        description="事实包已包含收益质量、尾部风险、行为维度、规则异常、数据边界和明确输出格式；不会自动上传，只有你主动复制或打开 ChatGPT。"
        class="dialog-alert"
      />
      <el-input v-model="deepAnalysis.text" type="textarea" :rows="22" readonly class="context-text" />
      <template #footer>
        <el-button @click="copyDeepAnalysis">复制事实包</el-button>
        <el-button type="primary" @click="openChatGpt">复制并打开 ChatGPT</el-button>
        <el-button @click="deepAnalysis.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { toContractReviewDataset } from "../../crypto/adapter";
import type {
  BinanceSourceCapture,
  ContractReviewDataset,
  ContractReviewManagementState,
  ContractRiskFinding,
  ContractRiskPriority,
  TradePreflightInput,
  TradePreflightResult,
} from "../../crypto/domain";
import {
  acknowledgeBinanceStaging,
  discardBinanceStaging,
  getBinanceStaging,
  getBinanceStatus,
  startBinanceCollection,
} from "../../crypto/extension-sync";
import { ContractReviewLedger } from "../../crypto/ledger";
import {
  computeContractReview,
  evaluateTradePreflight,
} from "../../crypto/review-engine";
import {
  buildContractReviewContext,
  buildFocusedFindingContext,
  buildPreflightContext,
} from "../../crypto/review-context";
import {
  loadContractReviewManagementState,
  saveContractReviewManagementState,
} from "../../crypto/review-store";
import PerformanceTable from "./components/PerformanceTable.vue";
import PortfolioAnalytics from "./components/PortfolioAnalytics.vue";
import EquityTimeCurveChart from "./components/EquityTimeCurveChart.vue";
import bundledSnapshotUrl from "../../../project-support/data-snapshots/crypto/binance-source-desensitized.json?url";

interface Branch {
  label: string;
  status: string;
  total: number;
  pageCount?: number;
  windowsCompleted?: number;
  windowsTotal?: number;
}
interface ExtensionStatus {
  pending: boolean;
  collection?: { running: boolean; branches?: Record<string, Branch> };
}

const route = useRoute();
const router = useRouter();
const ledger = new ContractReviewLedger();

const latest = ref<ContractReviewDataset>();
const archiveCount = ref(0);
const pending = ref(false);
const busy = ref(false);
const dimensionTab = ref("symbol");
const evidenceTab = ref("positions");
const branchList = ref<Branch[]>([]);

// Tab 状态
const VALID_TABS = ["overview", "review", "portfolio", "policies", "actions", "evidence", "data"];
const initialTab = typeof route.query.tab === "string" && VALID_TABS.includes(route.query.tab) ? route.query.tab : "overview";
const activeTab = ref(initialTab);

function switchTab(tabName: string): void {
  activeTab.value = tabName;
  router.replace({ query: { ...route.query, tab: tabName } });
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (typeof newTab === "string" && VALID_TABS.includes(newTab) && newTab !== activeTab.value) {
      activeTab.value = newTab;
    }
  },
);

const management = reactive<ContractReviewManagementState>(loadContractReviewManagementState());
const preflight = reactive<TradePreflightInput>({
  symbol: "",
  direction: "LONG",
  leverage: 1,
  accountEquity: 0,
  entryPrice: 0,
  stopPrice: undefined,
  takeProfitPrice: undefined,
  quantity: 0,
  currentSymbolExposurePct: 0,
  currentOpenPositions: 0,
  consecutiveLosses: 0,
  thesis: "",
});
const preflightResult = ref<TradePreflightResult>();
const deepAnalysis = reactive({ visible: false, text: "", title: "交给 ChatGPT 的深度分析事实包" });

const review = computed(() => (latest.value ? computeContractReview(latest.value, management.rules) : undefined));
const urgentFindings = computed(() => management.rulesConfirmed
  ? review.value?.findings.filter((item) => item.priority === "critical" || item.priority === "high") ?? []
  : []);
const secondaryFindings = computed(() => management.rulesConfirmed
  ? review.value?.findings.filter((item) => item.priority !== "critical" && item.priority !== "high") ?? []
  : []);

const activePositions = computed(() => (latest.value?.positions ?? []).filter((p) => Math.abs(Number(p.positionAmount) || 0) > 0));

const hideZeroBalances = ref(true);
const displayedEquity = computed(() => {
  const list = latest.value?.equity ?? [];
  if (!hideZeroBalances.value) return list;
  return list.filter(
    (row) =>
      (Number(row.marginBalance) || 0) !== 0 ||
      (Number(row.availableBalance) || 0) !== 0 ||
      (Number(row.walletBalance) || 0) !== 0 ||
      (Number(row.unrealizedProfit) || 0) !== 0,
  );
});

// ── Tab 6: 全局单号核对与筛选 ──
const globalIdSearch = ref("");

const globalIdSearchResult = computed(() => {
  const q = globalIdSearch.value.trim().toLowerCase();
  if (!q || !latest.value) return null;

  // 1. 查找持仓
  const pos = latest.value.positionHistory.find(
    (p) => String(p.positionId || "").toLowerCase().includes(q) || String(p.recordId || "").toLowerCase().includes(q),
  );
  if (pos) {
    return {
      dataset: "持仓历史",
      summary: `${pos.symbol} ${pos.positionSide || pos.side} 盈亏 ${money(Number(pos.closingPnl) || 0)}`,
    };
  }

  // 2. 查找订单
  const order = latest.value.orderHistory.find(
    (o) =>
      String(o.orderId || "").toLowerCase().includes(q) ||
      String(o.clientOrderId || "").toLowerCase().includes(q) ||
      String(o.historyId || "").toLowerCase().includes(q),
  );
  if (order) {
    return {
      dataset: "订单历史",
      summary: `${order.symbol} ${order.side} ${order.type} 状态 ${order.status}`,
    };
  }

  // 3. 查找成交
  const trade = latest.value.tradeHistory.find(
    (t) => String(t.tradeId || "").toLowerCase().includes(q) || String(t.orderId || "").toLowerCase().includes(q),
  );
  if (trade) {
    return {
      dataset: "成交记录",
      summary: `${trade.symbol} ${trade.side} 价格 ${formatPrice(trade.price)}`,
    };
  }

  // 4. 查找流水
  const tx = latest.value.transactionHistory.find(
    (t) => String(t.transactionId || "").toLowerCase().includes(q) || String(t.recordId || "").toLowerCase().includes(q),
  );
  if (tx) {
    return {
      dataset: "资金流水",
      summary: `${tx.typeLabel || tx.type} 金额 ${formatNumber(tx.amount)} ${tx.asset}`,
    };
  }

  return null;
});

// ── 复制单号与辅助函数 ──
async function copyText(text: string | number | undefined, label: string): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
    ElMessage.success(`已复制 ${label}：${text}，可直接前往币安平台后台检索核对`);
  } catch {
    ElMessage.warning(`复制失败，请手动选中复制：${text}`);
  }
}

function shortenId(id: string | number | undefined): string {
  if (!id) return "—";
  const s = String(id);
  if (s.length <= 14) return s;
  return s.slice(0, 6) + "..." + s.slice(-6);
}

function drillDownSymbol(symbol: string | undefined, targetTab: "positions" | "orders" | "trades" | "transactions"): void {
  if (!symbol) return;
  evidenceTab.value = targetTab;
  if (targetTab === "positions") {
    posFilterSymbol.value = symbol;
    posPage.value = 1;
  } else if (targetTab === "orders") {
    orderFilterSymbol.value = symbol;
    orderPage.value = 1;
  } else if (targetTab === "trades") {
    tradeFilterSymbol.value = symbol;
    tradePage.value = 1;
  } else if (targetTab === "transactions") {
    txPage.value = 1;
  }
  ElMessage.info(`已联动切换至 ${targetTab} 并筛选标的 ${symbol}`);
}

// ── Tab 6: 明细（Evidence）筛选与分页逻辑 ──

// 1. 持仓历史
const posFilterSymbol = ref("");
const posFilterSide = ref("");
const posFilterPnl = ref<"all" | "profit" | "loss">("all");
const posPage = ref(1);
const posPageSize = ref(10);

const availablePosSymbols = computed(() => {
  const set = new Set<string>();
  (latest.value?.positionHistory ?? []).forEach((p) => {
    if (p.symbol) set.add(String(p.symbol));
  });
  return Array.from(set).sort();
});

const filteredPositions = computed(() => {
  const list = latest.value?.positionHistory ?? [];
  return list.filter((row) => {
    if (globalIdSearch.value) {
      const q = globalIdSearch.value.trim().toLowerCase();
      const matchId = String(row.positionId || "").toLowerCase().includes(q) || String(row.recordId || "").toLowerCase().includes(q);
      if (matchId) return true;
    }
    if (posFilterSymbol.value && String(row.symbol) !== posFilterSymbol.value) return false;
    if (posFilterSide.value) {
      const side = String(row.positionSide || row.side || "");
      if (side !== posFilterSide.value) return false;
    }
    if (posFilterPnl.value === "profit" && (Number(row.closingPnl) || 0) < 0) return false;
    if (posFilterPnl.value === "loss" && (Number(row.closingPnl) || 0) >= 0) return false;
    return true;
  });
});

const pagedPositions = computed(() => {
  const start = (posPage.value - 1) * posPageSize.value;
  return filteredPositions.value.slice(start, start + posPageSize.value);
});

const posSummary = computed(() => {
  const list = filteredPositions.value;
  let win = 0;
  let loss = 0;
  let totalPnl = 0;
  list.forEach((r) => {
    const pnl = Number(r.closingPnl) || 0;
    totalPnl += pnl;
    if (pnl >= 0) win += 1;
    else loss += 1;
  });
  return {
    total: list.length,
    win,
    loss,
    winRate: list.length ? ((win / list.length) * 100).toFixed(1) : "0.0",
    totalPnl: totalPnl.toFixed(2),
  };
});

function resetPosFilter() {
  posFilterSymbol.value = "";
  posFilterSide.value = "";
  posFilterPnl.value = "all";
  posPage.value = 1;
}

// 2. 订单历史
const orderFilterSymbol = ref("");
const orderFilterSide = ref("");
const orderFilterPosSide = ref("");
const orderFilterType = ref("");
const orderFilterStatus = ref("");
const orderPage = ref(1);
const orderPageSize = ref(10);

const availableOrderSymbols = computed(() => {
  const set = new Set<string>();
  (latest.value?.orderHistory ?? []).forEach((o) => {
    if (o.symbol) set.add(String(o.symbol));
  });
  return Array.from(set).sort();
});

const availableOrderTypes = computed(() => {
  const set = new Set<string>();
  (latest.value?.orderHistory ?? []).forEach((o) => {
    if (o.type) set.add(String(o.type));
  });
  return Array.from(set).sort();
});

const availableOrderStatuses = computed(() => {
  const set = new Set<string>();
  (latest.value?.orderHistory ?? []).forEach((o) => {
    if (o.status) set.add(String(o.status));
  });
  return Array.from(set).sort();
});

const filteredOrders = computed(() => {
  const list = latest.value?.orderHistory ?? [];
  return list.filter((row) => {
    if (globalIdSearch.value) {
      const q = globalIdSearch.value.trim().toLowerCase();
      const matchId =
        String(row.orderId || "").toLowerCase().includes(q) ||
        String(row.clientOrderId || "").toLowerCase().includes(q) ||
        String(row.historyId || "").toLowerCase().includes(q);
      if (matchId) return true;
    }
    if (orderFilterSymbol.value && String(row.symbol) !== orderFilterSymbol.value) return false;
    if (orderFilterSide.value && String(row.side) !== orderFilterSide.value) return false;
    if (orderFilterPosSide.value && String(row.positionSide) !== orderFilterPosSide.value) return false;
    if (orderFilterType.value && String(row.type) !== orderFilterType.value) return false;
    if (orderFilterStatus.value && String(row.status) !== orderFilterStatus.value) return false;
    return true;
  });
});

const pagedOrders = computed(() => {
  const start = (orderPage.value - 1) * orderPageSize.value;
  return filteredOrders.value.slice(start, start + orderPageSize.value);
});

function resetOrderFilter() {
  orderFilterSymbol.value = "";
  orderFilterSide.value = "";
  orderFilterPosSide.value = "";
  orderFilterType.value = "";
  orderFilterStatus.value = "";
  orderPage.value = 1;
}

// 3. 成交记录
const tradeFilterSymbol = ref("");
const tradeFilterSide = ref("");
const tradeFilterPnl = ref<"all" | "profit" | "loss">("all");
const tradePage = ref(1);
const tradePageSize = ref(10);

const availableTradeSymbols = computed(() => {
  const set = new Set<string>();
  (latest.value?.tradeHistory ?? []).forEach((t) => {
    if (t.symbol) set.add(String(t.symbol));
  });
  return Array.from(set).sort();
});

const filteredTrades = computed(() => {
  const list = latest.value?.tradeHistory ?? [];
  return list.filter((row) => {
    if (globalIdSearch.value) {
      const q = globalIdSearch.value.trim().toLowerCase();
      const matchId = String(row.tradeId || "").toLowerCase().includes(q) || String(row.orderId || "").toLowerCase().includes(q);
      if (matchId) return true;
    }
    if (tradeFilterSymbol.value && String(row.symbol) !== tradeFilterSymbol.value) return false;
    if (tradeFilterSide.value && String(row.side) !== tradeFilterSide.value) return false;
    const pnl = Number(row.realizedProfit ?? row.realizedPnl) || 0;
    if (tradeFilterPnl.value === "profit" && pnl < 0) return false;
    if (tradeFilterPnl.value === "loss" && pnl >= 0) return false;
    return true;
  });
});

const pagedTrades = computed(() => {
  const start = (tradePage.value - 1) * tradePageSize.value;
  return filteredTrades.value.slice(start, start + tradePageSize.value);
});

function resetTradeFilter() {
  tradeFilterSymbol.value = "";
  tradeFilterSide.value = "";
  tradeFilterPnl.value = "all";
  tradePage.value = 1;
}

// 4. 资金流水
const txFilterAsset = ref("");
const txFilterType = ref("");
const txPage = ref(1);
const txPageSize = ref(10);

const availableTxAssets = computed(() => {
  const set = new Set<string>();
  (latest.value?.transactionHistory ?? []).forEach((t) => {
    if (t.asset) set.add(String(t.asset));
  });
  return Array.from(set).sort();
});

const availableTxTypes = computed(() => {
  const set = new Set<string>();
  (latest.value?.transactionHistory ?? []).forEach((t) => {
    if (t.type) set.add(String(t.type));
  });
  return Array.from(set).sort();
});

const filteredTransactions = computed(() => {
  const list = latest.value?.transactionHistory ?? [];
  return list.filter((row) => {
    if (globalIdSearch.value) {
      const q = globalIdSearch.value.trim().toLowerCase();
      const matchId = String(row.transactionId || "").toLowerCase().includes(q) || String(row.recordId || "").toLowerCase().includes(q);
      if (matchId) return true;
    }
    if (txFilterAsset.value && String(row.asset) !== txFilterAsset.value) return false;
    if (txFilterType.value && String(row.type) !== txFilterType.value) return false;
    return true;
  });
});

const pagedTransactions = computed(() => {
  const start = (txPage.value - 1) * txPageSize.value;
  return filteredTransactions.value.slice(start, start + txPageSize.value);
});

function resetTxFilter() {
  txFilterAsset.value = "";
  txFilterType.value = "";
  txPage.value = 1;
}

// ── 待办汇总（来自复盘 / 纪律 / 采集 / 明细） ──
interface TodoItem {
  source: string;
  title: string;
  detail?: string;
  priority?: string;
  actionText: string;
  action: () => void;
  finding?: ContractRiskFinding;
}

const todoList = computed<TodoItem[]>(() => {
  const list: TodoItem[] = [];
  // 1. 复盘阻断/高风险项
  urgentFindings.value.forEach((f) => {
    list.push({
      source: "复盘 · " + (f.priority === "critical" ? "阻断项" : "高风险"),
      title: f.title,
      detail: f.summary + "（下次开仓前：" + f.nextRule + "）",
      priority: f.priority,
      actionText: "去复盘处理",
      action: () => switchTab("review"),
      finding: f,
    });
  });

  // 2. 规则尚未由用户明确声明时，不生成任何默认规则结论。
  if (!management.rulesConfirmed) {
    list.push({
      source: "纪律 · 规则声明",
      title: "尚未确认本人的交易风险边界",
      detail: "系统不会使用默认阈值评价历史交易或当前计划。请逐项填写本人规则后主动确认。",
      actionText: "去声明规则",
      action: () => switchTab("policies"),
    });
  }

  // 3. 采集缺口
  const coverageGaps = latest.value?.coverage.filter((c) => c.completeness !== "complete") ?? [];
  if (coverageGaps.length) {
    list.push({
      source: "采集 · 数据覆盖度",
      title: `${coverageGaps.map((g) => g.dataset).join("、")} 覆盖不完整`,
      detail: "建议在币安合约页保持登录后更新数据以获得更全面历史。",
      actionText: "去采集页",
      action: () => switchTab("data"),
    });
  }

  // 4. 最近一次开仓检查若阻断
  if (preflightResult.value && preflightResult.value.verdict === "blocked") {
    list.push({
      source: "待办 · 开仓前拦截",
      title: `最近一笔 ${preflight.symbol} 检查被阻断`,
      detail: preflightResult.value.checks.find((c) => c.severity === "block")?.detail || "存在硬规则不满足",
      priority: "critical",
      actionText: "微调交易计划",
      action: () => {
        // stay in actions
      },
    });
  }

  return list;
});

const automaticVerdict = computed(() => {
  if (!review.value || review.value.metrics.closedPositions < 10) {
    return { title: "样本不足，先不要评价策略", detail: "当前已平仓样本不足 10 笔，只展示事实，不做稳定性判断。" };
  }
  const { analysis, metrics } = review.value;
  if (analysis.expectancy < 0 || (analysis.profitFactor ?? 0) < 1) {
    return {
      title: "这套交易方式当前是负期望，继续放大仓位只会放大亏损",
      detail:
        "胜率 " +
        metrics.winRatePct.toFixed(1) +
        "%，盈利因子 " +
        ratio(analysis.profitFactor) +
        "，每笔期望 " +
        money(analysis.expectancy) +
        "，最大回撤 " +
        money(analysis.maximumDrawdown) +
        "。",
    };
  }
  if ((analysis.profitFactor ?? 0) < 1.2 || (analysis.payoffRatio ?? 0) < 1) {
    return {
      title: "统计优势很薄，少数尾部亏损足以抹掉大量小盈利",
      detail:
        "盈利因子 " +
        ratio(analysis.profitFactor) +
        "，盈亏比 " +
        ratio(analysis.payoffRatio) +
        "，每笔期望 " +
        money(analysis.expectancy) +
        "；当前不适合通过提高杠杆扩大收益。",
    };
  }
  return {
    title: "历史样本为正期望，但仍需控制尾部损失",
    detail:
      "盈利因子 " +
      ratio(analysis.profitFactor) +
      "，每笔期望 " +
      money(analysis.expectancy) +
      "；最差 5 笔平均亏损 " +
      money(analysis.worstFiveAverageLoss) +
      "。",
  };
});

const verdictCardClass = computed(() => {
  if (!review.value) return "verdict-ok";
  if ((review.value.analysis.expectancy ?? 0) < 0) return "verdict-warn";
  return "verdict-ok";
});

const dataVerdictTitle = computed(() => {
  if (!latest.value) return "尚未导入数据";
  return `已写入本地台账 · ${review.value?.metrics.closedPositions ?? 0} 笔已平仓样本`;
});

function priorityLabel(priority: ContractRiskPriority): string {
  return { critical: "阻断", high: "高风险", medium: "需复盘", info: "提示" }[priority];
}
function priorityTag(priority: ContractRiskPriority): "danger" | "warning" | "info" {
  if (priority === "critical") return "danger";
  if (priority === "high" || priority === "medium") return "warning";
  return "info";
}
function verdictTitle(verdict: TradePreflightResult["verdict"]): string {
  return {
    blocked: "计划与本人已声明规则存在偏离",
    review: "计划仍有信息需要补充或复核",
    pass: "未发现与本人已声明规则的机械偏离",
  }[verdict];
}
function verdictTag(verdict: TradePreflightResult["verdict"]): string {
  return { blocked: "存在偏离", review: "需要复核", pass: "未发现偏离" }[verdict];
}
function verdictType(verdict: TradePreflightResult["verdict"]): "danger" | "warning" | "success" {
  return ({ blocked: "danger", review: "warning", pass: "success" } as const)[verdict];
}
function checkIcon(severity: "block" | "warn" | "pass"): string {
  return { block: "✕", warn: "!", pass: "✓" }[severity];
}
function formatTime(value: string | number | undefined): string {
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
}
function money(value: number): string {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}
function ratio(value: number | undefined): string {
  if (value === undefined) return "—";
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}
function pct(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(1) + "%";
}
function duration(value: number | undefined): string {
  if (value === undefined) return "—";
  if (value < 60) return value.toFixed(0) + " 分钟";
  return (value / 60).toFixed(1) + " 小时";
}
function pnlClass(value: number | undefined): string {
  return (value ?? 0) >= 0 ? "positive-text" : "danger-text";
}
function formatPrice(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n.toLocaleString("zh-CN", { maximumFractionDigits: 6 }) : "—";
}
function formatNumber(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) : String(value ?? "—");
}
function formatPositionSide(row: Record<string, unknown>): string {
  const s = String(row.positionSide || "");
  if (s === "LONG") return "多头 (LONG)";
  if (s === "SHORT") return "空头 (SHORT)";
  return Number(row.positionAmount) >= 0 ? "多头" : "空头";
}

function formatBranchLabel(label: string): string {
  const map: Record<string, string> = {
    positions: "当前活跃持仓",
    positionHistory: "已平仓持仓历史",
    orderHistory: "历史委托订单",
    tradeHistory: "撮合成交明细",
    transactionHistory: "资金账户流水",
    equity: "账户资产与权益",
  };
  return map[label] || label;
}

function formatBranchStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "⏳ 待采集",
    running: "🔄 正在采集",
    completed: "✅ 采集完成",
    partial: "⚠️ 部分完成",
    failed: "❌ 采集异常",
    error: "❌ 采集异常",
  };
  return map[status] || status;
}

function formatDatasetName(dataset: string): string {
  const map: Record<string, string> = {
    positions: "当前活跃持仓",
    positionHistory: "已平仓持仓历史",
    orderHistory: "历史委托订单",
    tradeHistory: "撮合成交明细",
    transactionHistory: "资金流水",
    equity: "账户资产与权益",
  };
  return map[dataset] || dataset;
}

function formatCompleteness(status: string): string {
  const map: Record<string, string> = {
    complete: "完整采集",
    partial: "部分覆盖",
    empty: "暂无记录",
    missing: "缺失",
  };
  return map[status] || status;
}

function formatProtocol(proto: string): string {
  if (!proto) return "标准快照协议";
  if (proto.includes("binance-futures")) return "币安合约采集协议 (v1)";
  return proto;
}

function formatSide(side: unknown): string {
  const s = String(side || "").toUpperCase();
  if (s === "BUY") return "买入";
  if (s === "SELL") return "卖出";
  return String(side || "—");
}

function formatOrderType(type: unknown): string {
  const map: Record<string, string> = {
    LIMIT: "限价单",
    MARKET: "市价单",
    STOP_MARKET: "止损市价",
    TAKE_PROFIT_MARKET: "止盈市价",
    STOP: "止损限价",
    TAKE_PROFIT: "止盈限价",
    TRAILING_STOP_MARKET: "跟踪止损",
  };
  return map[String(type || "")] || String(type || "—");
}

function formatOrderStatus(status: unknown): string {
  const map: Record<string, string> = {
    FILLED: "全部成交",
    CANCELED: "已撤单",
    EXPIRED: "已过期",
    NEW: "等待成交",
    PARTIALLY_FILLED: "部分成交",
  };
  return map[String(status || "")] || String(status || "—");
}

function formatTransactionType(type: unknown): string {
  const map: Record<string, string> = {
    FUNDING_FEE: "资金费用",
    COMMISSION: "交易手续费",
    REALIZED_PNL: "平仓盈亏",
    INSURANCE_CLEAR: "强平清算",
    TRANSFER: "资金划转",
    FEE: "手续费",
    COIN_SWAP_DEPOSIT: "充值",
    COIN_SWAP_WITHDRAW: "提现",
    REFERRAL_KICKBACK: "推荐返佣",
  };
  return map[String(type || "")] || String(type || "—");
}

function persistManagement(): void {
  saveContractReviewManagementState(management);
}
function saveRules(): void {
  const numericRules = [
    management.rules.maxLeverage,
    management.rules.maxRiskPerTradePct,
    management.rules.maxMarginPerTradePct,
    management.rules.maxSymbolExposurePct,
    management.rules.maxConcurrentPositions,
    management.rules.maxDailyLossPct,
    management.rules.maxConsecutiveLosses,
    management.rules.cooldownHoursAfterLossStreak,
    management.rules.maxTradesPerDay,
    management.rules.minRewardRiskRatio,
  ];
  if (numericRules.some((value) => !Number.isFinite(value) || value <= 0)) {
    ElMessage.error("请先逐项填写大于 0 的本人规则；系统不提供默认阈值。");
    return;
  }
  management.rulesConfirmed = true;
  persistManagement();
  preflightResult.value = undefined;
  ElMessage.success("本人规则已确认，历史事实将按这些边界重新对照。");
}
function revokeRules(): void {
  management.rulesConfirmed = false;
  preflightResult.value = undefined;
  persistManagement();
  ElMessage.info("已撤销规则确认；系统停止生成规则偏离结论，已填写数值仅保留为草稿。");
}

function runPreflight(): void {
  if (!management.rulesConfirmed) {
    ElMessage.warning("请先逐项声明并确认本人的规则。");
    return;
  }
  preflight.symbol = preflight.symbol.trim().toUpperCase();
  if (!preflight.symbol || preflight.accountEquity <= 0 || preflight.entryPrice <= 0 || preflight.quantity <= 0 || preflight.leverage <= 0) {
    ElMessage.error("缺少合约代码、真实账户权益、计划入场价、委托数量或杠杆；系统不会使用回退值补齐。");
    return;
  }
  preflightResult.value = evaluateTradePreflight({ ...preflight }, management.rules);
  management.preflightHistory.unshift({
    id: "preflight:" + preflightResult.value.checkedAt,
    input: { ...preflight },
    result: preflightResult.value,
  });
  management.preflightHistory = management.preflightHistory.slice(0, 30);
  persistManagement();
  if (preflightResult.value.verdict === "blocked") {
    ElMessage.error("计划与本人已声明规则存在偏离，请核对具体项目。");
  } else if (preflightResult.value.verdict === "review") {
    ElMessage.warning("计划仍有信息需要补充或复核。");
  } else {
    ElMessage.info("未发现与本人已声明规则的机械偏离；这不代表交易安全或可以执行。");
  }
}

// ── 深度分析事实包外包给 ChatGPT（支持全量、单项聚焦、开仓计划复核） ──
function openFullDeepAnalysis(): void {
  if (!latest.value || !review.value) {
    ElMessage.warning("请先导入合约数据");
    return;
  }
  if (!management.rulesConfirmed) {
    ElMessage.warning("请先声明并确认本人规则，系统不会把空白或默认阈值写入分析事实包。");
    return;
  }
  deepAnalysis.title = "全量账户与策略深度分析事实包";
  deepAnalysis.text = buildContractReviewContext(latest.value, review.value);
  deepAnalysis.visible = true;
}

function openFindingDeepAnalysis(finding: ContractRiskFinding): void {
  if (!latest.value || !review.value) {
    ElMessage.warning("请先导入合约数据");
    return;
  }
  deepAnalysis.title = `单项风险聚焦归因 · ${finding.title}（${finding.priority.toUpperCase()}）`;
  deepAnalysis.text = buildFocusedFindingContext(latest.value, review.value, finding);
  deepAnalysis.visible = true;
}

function openPreflightDeepAnalysis(): void {
  deepAnalysis.title = `开仓前交易计划风险复核 · ${preflight.symbol} (${preflight.direction})`;
  deepAnalysis.text = buildPreflightContext(preflight, preflightResult.value, latest.value, review.value);
  deepAnalysis.visible = true;
}

async function copyDeepAnalysis(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(deepAnalysis.text);
    ElMessage.success("完整事实包已复制，可直接粘贴给 ChatGPT");
    return true;
  } catch {
    ElMessage.warning("复制失败，请在弹窗内手动复制");
    return false;
  }
}

async function openChatGpt(): Promise<void> {
  if (!deepAnalysis.text && latest.value && review.value) {
    deepAnalysis.text = buildContractReviewContext(latest.value, review.value);
  }
  window.open("https://chatgpt.com/", "_blank", "noopener");
  const copied = await copyDeepAnalysis();
  if (copied) ElMessage.success("已打开 ChatGPT，请直接粘贴发送");
}

function desensitizeCapture(value: unknown): unknown {
  const identifierKey = /^(?:historyId|algoId|orderId|clientOrderId|tradeId|positionId|transactionId|recordId)$/;
  const identifiers = new Map<string, string>();
  let sequence = 0;
  const collectRec = (item: unknown, key = "") => {
    if (Array.isArray(item)) return item.forEach((entry) => collectRec(entry, key));
    if (item && typeof item === "object") return Object.entries(item).forEach(([name, entry]) => collectRec(entry, name));
    const text = item === undefined || item === null ? "" : String(item);
    if (identifierKey.test(key) && text.length >= 6 && !identifiers.has(text)) {
      sequence += 1;
      identifiers.set(text, "ID-" + String(sequence).padStart(4, "0"));
    }
  };
  collectRec(value);
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
  preflight.currentOpenPositions = latest.value.positions.filter((p) => Math.abs(Number(p.positionAmount)) > 0).length;
  preflight.consecutiveLosses = review.value.metrics.currentLossStreak;
  const totalEquity = latest.value.equity.reduce(
    (sum, row) => sum + Math.max(Number(row.marginBalance) || 0, Number(row.availableBalance) || 0),
    0,
  );
  if (totalEquity > 0) {
    preflight.accountEquity = Number(totalEquity.toFixed(2));
  }
  // 计算当前标的已占用暴露
  const matchingPos = latest.value.positions.find((p) => p.symbol === preflight.symbol && Math.abs(Number(p.positionAmount)) > 0);
  if (matchingPos && preflight.accountEquity > 0) {
    const margin = Number(matchingPos.isolatedMargin || matchingPos.positionInitialMargin || 0);
    preflight.currentSymbolExposurePct = Number(((margin / preflight.accountEquity) * 100).toFixed(1));
  } else {
    preflight.currentSymbolExposurePct = 0;
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
  try {
    const response = await fetch(bundledSnapshotUrl);
    if (!response.ok) throw new Error("读取内置脱敏快照失败：HTTP " + response.status);
    const dataset = toContractReviewDataset((await response.json()) as BinanceSourceCapture);
    await ledger.put(dataset);
    await loadLocal();
    syncPreflightFacts();
    ElMessage.success("已成功导入脱敏快照（53 笔已平仓样本）");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导入内置脱敏快照失败");
  } finally {
    busy.value = false;
  }
}

async function refreshStatus(): Promise<void> {
  const response = await getBinanceStatus<ExtensionStatus>();
  if (!response.ok || !response.status) throw new Error(response.error || "无法读取插件状态");
  pending.value = response.status.pending;
  branchList.value = Object.values(response.status.collection?.branches || {});
}

function handleBridgeError(error: unknown, defaultMessage = "操作失败"): void {
  const msg = error instanceof Error ? error.message : String(error || "");
  if (/失效|未响应|未连接|Extension context invalidated|重试/i.test(msg)) {
    ElMessageBox.confirm(
      "采集插件后台已重新加载或更新，当前浏览器页面中的旧通信通道已断开。\n\n是否立即自动刷新本页面以重新建立插件连接？",
      "插件连接需刷新",
      {
        confirmButtonText: "立即刷新页面",
        cancelButtonText: "稍后手动刷新",
        type: "warning",
      },
    )
      .then(() => window.location.reload())
      .catch(() => {});
    return;
  }
  ElMessage.error(msg || defaultMessage);
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
    syncPreflightFacts();
    pending.value = false;
    ElMessage.success("来源包已写入本地台账");
  } catch (error) {
    handleBridgeError(error, "导入失败");
  } finally {
    busy.value = false;
  }
}

async function collect(): Promise<void> {
  busy.value = true;
  ElMessage.info("正在准备后台采集页，历史与账户快照将并行采集。");
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
        return;
      }
      if (!status.status.collection?.running && attempt > 5) {
        throw new Error("后台采集未生成来源包，请确认币安合约页仍保持登录状态");
      }
    }
    throw new Error("等待采集完成超时，请检查插件状态");
  } catch (error) {
    handleBridgeError(error, "启动失败");
  } finally {
    busy.value = false;
  }
}

async function discard(): Promise<void> {
  busy.value = true;
  try {
    await discardBinanceStaging();
    pending.value = false;
    ElMessage.info("插件暂存已丢弃");
  } catch (error) {
    handleBridgeError(error, "丢弃暂存失败");
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  try {
    await loadLocal();
    await refreshStatus();
    if (latest.value) {
      syncPreflightFacts();
    }
  } catch {
    // ignore
  }
});
</script>

<style scoped>
/* ── 统一容器与布局 ── */
.os-layout {
  padding: 8px 0 32px;
}

.os-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.os-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.os-name {
  font-size: 16px;
  font-weight: 600;
}

.os-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── 菜单 ── */
.os-menu {
  border-bottom: 1px solid var(--el-border-color);
  margin-bottom: 16px;
}

.os-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 卡片与通用结构 ── */
.section {
  width: 100%;
}

.section-alert {
  margin-bottom: 4px;
}

.card-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.card-head-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ── 第一性结论卡片（verdict-card） ── */
.verdict-card {
  border-left: 4px solid var(--el-color-success);
}

.verdict-card.verdict-warn {
  border-left-color: var(--el-color-warning);
}

.verdict-card.verdict-danger {
  border-left-color: var(--el-color-danger);
}

.verdict-kicker {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.verdict-card h2 {
  margin: 4px 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.verdict-card p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.verdict-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* ── 指标网格 ── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.metric small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.positive-text {
  color: var(--el-color-success);
}

.danger-text {
  color: var(--el-color-danger);
}

/* ── 曲线卡片 ── */
.curve-card .chart-container {
  margin-bottom: 12px;
}

.equity-svg {
  display: block;
  width: 100%;
  height: 190px;
  background: linear-gradient(180deg, #f8fafc, #fff);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.axis {
  stroke: var(--el-border-color);
  stroke-width: 1;
}

.equity-line {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.curve-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.curve-summary span {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.curve-summary b {
  margin-top: 3px;
  font-size: 15px;
}

/* ── 行为对比 ── */
.behavior-compare {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.behavior-compare div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.behavior-compare span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.behavior-compare strong {
  font-size: 16px;
}

.behavior-compare small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ── 需处理项 / findings ── */
.findings-section {
  border-left: 3px solid var(--el-color-primary);
}

.section-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.finding-card {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-warning);
}

.finding-card.priority-critical {
  border-left-color: var(--el-color-danger);
}

.finding-card.priority-high {
  border-left-color: var(--el-color-warning);
}

.finding-card.priority-medium {
  border-left-color: var(--el-color-primary);
}

.finding-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.finding-desc {
  margin: 8px 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
}

.rule-line {
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.finding-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.all-clear {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.secondary-findings {
  margin-top: 12px;
}

.review-shortcuts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── 待办汇总（与基金复盘助手一致） ── */
.todo-card {
  border-left: 3px solid var(--el-color-warning);
}

.todo-note {
  margin-bottom: 12px;
}

.todo-group {
  margin-bottom: 12px;
}

.todo-source {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  margin-top: 4px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.todo-item.is-danger {
  background: var(--el-color-danger-light-9);
  border-left: 3px solid var(--el-color-danger);
}

.todo-text {
  font-weight: 500;
}

.todo-detail {
  display: block;
  width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 2px;
}

.todo-btn-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* ── 规则表单 ── */
.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-actions-row {
  display: flex;
  gap: 12px;
}

/* ── 开仓前检查（极简 + 预装配） ── */
.account-facts-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 12px;
  margin-bottom: 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.account-facts-bar b {
  color: var(--el-text-color-primary);
  margin-left: 4px;
}

.preflight-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 16px;
}

@media screen and (max-width: 900px) {
  .preflight-layout {
    grid-template-columns: 1fr;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.preflight-btn-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.main-check-btn {
  flex: 1;
}

.result-card {
  border-left: 4px solid var(--el-color-success);
}

.result-card.verdict-blocked {
  border-left-color: var(--el-color-danger);
}

.result-card.verdict-review {
  border-left-color: var(--el-color-warning);
}

.verdict-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.verdict-head h3 {
  margin: 2px 0 0;
  font-size: 16px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.result-metrics span {
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-metrics b {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.check-row.check-block {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.check-row.check-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}

.check-row.check-pass {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.check-icon-box {
  font-weight: 700;
  width: 14px;
  flex-shrink: 0;
}

.check-row div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.check-row small {
  color: var(--el-text-color-regular);
}

.result-footer-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

/* ── 对账指引卡（口径对账与核对路径） ── */
.audit-guide-card {
  border-left: 3px solid var(--el-color-primary);
}

.audit-guide-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audit-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.audit-guide-item {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 12px;
}

.guide-title {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.audit-guide-item p {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.audit-guide-item code {
  background: var(--el-fill-color-darker);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--el-color-primary);
}

.id-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 12px;
}

.search-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.search-result-hint {
  color: var(--el-color-success);
  font-size: 12px;
}

.search-result-hint b {
  color: var(--el-text-color-primary);
}

/* ── 明细工具条与分页 ── */
.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.filter-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-stat-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.filter-stat-summary b {
  color: var(--el-text-color-primary);
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ── 底层单号展示与复制 ── */
.source-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-id-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.copy-btn {
  padding: 0 4px;
  font-size: 11px;
}

.symbol-link {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 500;
}

.symbol-link:hover {
  text-decoration: underline;
}

/* ── 展开行（Raw Facts） ── */
.raw-fact-expand {
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  margin: 4px 0;
}

.raw-fact-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.raw-fact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px 16px;
  font-size: 12px;
}

.raw-fact-grid div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.raw-fact-grid span {
  color: var(--el-text-color-secondary);
}

.raw-fact-grid code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--el-fill-color-darker);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--el-text-color-primary);
}

.raw-fact-drilldown {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.deep-actions {
  display: flex;
  gap: 12px;
}

/* ── 采集与档案 ── */
.archive-summary {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 500;
}

.archive-boundary {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.archive-actions {
  display: flex;
  gap: 8px;
}

.branches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.branch {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
}

.branch strong {
  font-size: 13px;
}

.coverage-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cov-tag {
  font-size: 12px;
}

/* ── 空态引导 ── */
.empty-card {
  min-height: 320px;
  padding: 20px 0;
}

.empty-intro {
  max-width: 680px;
  margin: 0 auto 16px;
  color: var(--el-text-color-regular);
  text-align: center;
  line-height: 1.7;
  font-size: 13px;
}

.guide-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── 弹窗 ── */
.dialog-alert {
  margin-bottom: 12px;
}

.context-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
</style>
