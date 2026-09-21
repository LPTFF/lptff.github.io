# P4 — AI-assisted Review

**阶段出口**：AI 只基于 Review Engine 已生成的结构化事实与发现，帮助用户理解、关联、提问和总结；关闭或更换模型不改变任何核心计算和确定性状态。

## 输入契约

AI 只读取经脱敏和最小化后的结构化对象：

```text
ReviewPeriod
PerformanceSnapshot
RiskSnapshot
AttributionResult
DecisionAppraisal
BehaviorFinding
StrategyHypothesis
ReviewFinding
DataCoverage / limitations
```

不得让模型从原始网页、账户页面、Network Logs 或未规范化交易中自行重算核心结论。

## 输出类型

每段输出必须标记：

- `FACT`：忠实重述 deterministic metric、rule result 或 Coverage；
- `INFERENCE`：由明确列出的多项事实支持的有限推论；
- `HYPOTHESIS`：仍待验证的解释、反例或下期问题。

重要输出至少关联一种 evidence ref：

```text
metricId
transactionId
decisionId
strategyRuleId
```

涉及 benchmark、policy、profile 或 hypothesis 时同时携带对应 version/ref。没有依据时拒绝生成结论。

## 能做什么

1. 用普通语言解释 TWR、MWR、drawdown、attribution 和 process/outcome 差异；
2. 将分散 Findings 按 Review workflow 串联；
3. 提醒矛盾、unknown、反例和需要补的数据；
4. 生成供用户确认的 Review 摘要；
5. 提出下一周期观察问题或 StrategyHypothesis 草案；
6. 比较两个已存在版本的变化，不修改历史。

## 不能做什么

- 计算或改写 return、TWR、MWR/XIRR、benchmark、drawdown、turnover、cost、rule violation 或 appraisal status；
- 用自然语言补齐 Attribution 缺失项；
- 预测市场、基金净值或收益；
- 自动输出权威 `BUY/SELL`、申购、赎回、调仓建议；
- 自动发布 Policy、Rule、Benchmark/Profile 或 Hypothesis 状态；
- 用盈利结果把 process breach 描述为好决策；
- 隐藏 `INSUFFICIENT_DATA`。

## 交互与确认

AI 建议只能形成 draft。用户确认后，系统也只执行以下安全动作：

- 保存 Review annotation；
- 创建 StrategyHypothesis 草案；
- 创建下一版本 Policy/Rule/Profile/Benchmark 草案；
- 创建待处理复盘问题。

不得触发真实交易、申赎、转账或账户操作。

## Oracle

- 同一 deterministic input 使用不同模型：所有 metric、Finding 状态和 appraisal 完全一致；
- AI 关闭：P0–P3 的 Review 仍完整可用；
- 删除某 evidence ref：依赖它的重要结论必须降级或不生成；
- Attribution 为 `INSUFFICIENT_DATA`：AI 不得提供收益原因故事；
- profitable breach：文本同时保留 positive outcome 与 process breach；
- compliant loss：文本不得写成 bad decision；
- 每个重要陈述可从 UI 下钻到引用对象；
- 模型输出中的数字必须与输入 metric 一致，否则拒绝发布。

## 隐私与可观察性

- Prompt 只包含完成当前说明所需的最小字段；
- 不发送 Cookie、Token、登录状态、银行卡信息、真实账户页面或完整 Network Logs；
- 保存 model/version、prompt contract version、input refs、输出时间和用户确认状态；
- 不把 AI wording 当成稳定产品事实，Review 的确定性数据独立保存。
