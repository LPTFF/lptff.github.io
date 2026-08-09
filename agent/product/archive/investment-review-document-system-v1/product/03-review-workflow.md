# ReviewPeriod 复盘流程

复盘对象是有明确起止时间和数据边界的 `ReviewPeriod`，不是一张收益图。支持周、月、季、年，但每个周期必须冻结其 Policy/Benchmark/Profile 解析结果。

## 前置门槛

开始 Review 前先检查：

- Position、NAV、CashFlow、Transaction 和 Benchmark Coverage；
- 期间边界、估值时点、币种和 return type；
- 当时有效的 Policy、Rule、Benchmark 和 Fund profile；
- 费用/税/现金是否已知；
- 哪些步骤可运行、哪些必须 `INSUFFICIENT_DATA`。

局部可运行时允许 partial review，但 limitation 必须向下传播。

## 固定顺序

### 1. Objective

回答：本期适用的投资目标、风险与约束是什么？

输出：PolicyVersion、Target、RiskBudget、BenchmarkVersion、适用 Fund roles。只展示事前版本，不按结果修改。

### 2. Performance Measurement

只回答发生了什么：

```text
Absolute Return
TWR (strategy return)
MWR/XIRR (investor experience)
Portfolio value / profit
Benchmark Return
Excess Return
Target Completion
```

Target Completion 与 Excess Return 分开。任何比较失败都附原因。

### 3. Risk Measurement

```text
Volatility
Maximum Drawdown
Drawdown Duration
Sharpe / Sortino
Tracking Error / Information Ratio / Capture（满足条件时）
```

不生成综合风险分数；显示输入频率、期间和限制。

### 4. Performance Attribution

先声明可用 Level：

- Level 1：Fund contribution、Benchmark/market、cost、cash-flow timing、可验证 FX；
- Level 2：Allocation、Selection、Interaction，仅在目标/实际分类权重和分类 benchmark 完整时运行。

effects + residual 与 excess/return contribution 调和。无法可靠解释时停止，不由 AI 补原因。

### 5. Decision Appraisal

逐个 DecisionRecord 对照：

- thesis/trigger/invalidation 是否事前完整；
- Strategy/Risk Rule 是否合规；
- actual execution 与 planned amount/timing 是否一致；
- 是否出现 partial confirmation、无计划操作或 strategy drift；
- Evidence 是否足够。

结果使用多维状态，Outcome 单独显示。

### 6. Behavioral Review

只从跨记录模式生成可审查信号：

- Outcome Bias：是否因结果改变对原决策的标注或叙述；
- Disposition signal：PGR/PLR 与样本限制；
- Possible Overtrading：turnover、trade count、holding period、cost 与 excess 的联合变化；
- Strategy Drift：Decision/Execution 偏离规则的持续模式。

不得输出心理诊断。

### 7. Hypothesis Update

把本期证据关联到已有 `StrategyHypothesis`：新增样本、正/负/无法判断案例、excess/risk/cost 指标和 limitation。按显式门槛更新状态，不以一次胜负决定。

### 8. Rule Update

只有完成前七步后，才允许用户决定：

- 保留当前版本；
- 创建新 Policy/Rule/Benchmark/Profile 版本；
- 暂停某条 Hypothesis；
- 补充数据后再判断。

系统不能覆盖历史，也不能自动发布新规则。

## Review 输出

```text
ReviewPeriod
├── dataReadiness
├── objectiveSnapshot
├── performanceSnapshot
├── riskSnapshot
├── attributionResult
├── decisionAppraisals[]
├── behaviorFindings[]
├── hypothesisUpdates[]
├── ruleUpdateDecision
└── reviewFindings[]
```

## 可信 Oracle

- profitable breach：Process = BREACH，Outcome = POSITIVE；
- compliant loss：Process = COMPLIANT，Outcome = NEGATIVE；
- target achieved / benchmark underperformed 分别显示，不相互覆盖；
- Policy/Benchmark 当前版本变化不改变历史 Review；
- 缺 benchmark total-return 或币种不匹配时，不输出虚假 excess；
- Attribution 输入不足时明确停止；
- AI 开关和模型变化不改变上述结果。
