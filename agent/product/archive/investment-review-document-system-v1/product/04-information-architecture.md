# 信息架构

**状态**：目标 IA。`/investment/review` 尚未实现；当前路由事实见 [Current State](../current-state.md)。

## 复盘入口

规划新增：

```text
/investment/review
├── 本期结论
├── 目标 vs 实际
├── 收益表现
├── 风险表现
├── 收益归因
├── 决策复盘
├── 行为偏差
├── 策略假设
└── 下一周期改变
```

页面按人的复盘认知顺序组织，而不是按“系统有什么指标”堆卡片。

## 页面结构

### ① 本期结论

先显示 Data Readiness，再显示多维结果：

```text
Strategy Compliance
Risk Compliance
Execution Discipline
Evidence Completeness
Decision Consistency
Outcome
```

不显示综合 Investment Score。任何结论可展开到 evidence refs。

### ② 目标 vs 实际

并列但不混合：

- Target 与完成度；
- Portfolio Return；
- Benchmark Return；
- Excess Return；
- 期间、币种、return type 和版本。

### ③ 收益表现

显示 Absolute、TWR、MWR/XIRR 及解释：策略/资产表现与真实资金体验回答不同问题。

### ④ 风险表现

显示 drawdown curve/duration、volatility 与适用的 risk-adjusted metrics；每个指标带 limitation。

### ⑤ 收益归因

先显示 Attribution Level 和 Coverage，再显示可解释 effects、residual 与无法归因项。禁止 AI 原因故事代替数据。

### ⑥ 决策复盘

按 DecisionRecord 展示：事前 thesis/trigger/invalidation、规则版本、计划/执行差异、Process 与 Outcome 四象限。

### ⑦ 行为偏差

只展示统计信号、样本和反例：PGR/PLR、turnover、holding period、cost、Possible Overtrading、Outcome Bias evidence、strategy drift。

### ⑧ 策略假设

显示假设、样本、正/负/未知案例、证据状态和仍需观察的指标。

### ⑨ 下一周期需要改变什么

只允许创建下一版本或保留当前版本。说明变化依据和未知；不修改历史，不自动交易。

## 现有页面关系

| 当前页面 | 未来职责 |
| --- | --- |
| `/investment` Console | 今日数据与规则状态，进入最新 Review；不替代周期复盘 |
| `/investment/portfolio` | Position、现金、Fund role、风险暴露和下钻 |
| `/investment/policies` | Policy/Rule/Benchmark/Profile 版本管理 |
| `/investment/actions` | 待处理偏离与执行状态，不等于 Review 结论 |
| `/investment/evidence` | 迁移为 Review/Hypothesis 证据下钻，避免第二个总览 |
| `/investment/data` | Coverage、来源、时间、费用/现金/benchmark readiness |
| `/investment/legacy/*` | 历史入口，不参与 canonical Review 语义 |

## AI 表示

AI 区域只能放在 deterministic 结果之后，逐条标记：

- FACT：直接重述指标或规则结果；
- INFERENCE：由多项事实支持的有限推论；
- HYPOTHESIS：待验证解释或问题。

每条重要输出提供“查看依据”，不得用自然语言隐藏数据不足。

## 默认状态

默认不是“今天无需操作”，而是更精确地说明：

- 数据是否足以复盘；
- 哪些范围未发现已知偏离；
- 哪些判断尚不可做；
- 下一步是补数据、处理偏离、完成 Review，还是保持规则不变。
