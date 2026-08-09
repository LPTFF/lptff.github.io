# 理论采用与 Hard Constraints

**理论卡**：[投资绩效与决策复盘理论框架](../../../theories/investment-performance-and-decision-review.md)。本文件只记录产品已采纳的规则；理论来源、限制和未知留在理论卡。

## 来源层级

| 类型 | 含义 | 产品使用方式 |
| --- | --- | --- |
| 原始理论/标准主张 | 可追溯到 CFA/GIPS 或论文 | 在原始适用范围内使用，不扩张权威 |
| 项目工程综合 | 多个理论转化成产品模型 | 明确标为产品约束，用 Oracle 验证 |
| 产品选择 | 为降低风险或复杂度作出的取舍 | 可随真实证据调整，不冒充理论要求 |

## Hard Constraints

### HC-01 Process 与 Outcome 分离

收益、亏损和最终回撤不得改变 Strategy/Risk/Execution Compliance。严禁：

```text
盈利 = GOOD_DECISION
亏损 = BAD_DECISION
```

### HC-02 Target 与 Benchmark 分离

Target 回答个人希望获得多少；Benchmark 回答事前可比较替代方案如何。二者字段、版本、计算和 UI 分开。

### HC-03 所有事前对象按有效期版本化

`InvestmentPolicy`、`StrategyRule`、`Benchmark`、`FundStrategyProfile` 和 `DecisionRecord` 解析当时版本。今天的修改不能改变历史 Review。

### HC-04 Benchmark 不得事后重选

历史评价使用 Decision/Review 当时绑定的 BenchmarkVersion。新选择只对未来有效。比较前验证：

- same period；
- same currency 或可验证 FX 转换；
- same return type（price/total，gross/net）；
- benchmark 角色与 Fund/Policy 匹配。

任何一项不足时，不计算可误导的 Excess Return。

### HC-05 现金、现金等价物和成本不得静默忽略

Portfolio Measurement 必须说明现金范围、申赎现金流、费用和税的已知/未知状态。无法纳入时降级结果并披露 limitation。

### HC-06 不足一年不伪装成年化实绩

少于一年的实际期间收益按期间展示。可以展示独立、明确标识的目标推演或情景假设，但不得把它冒充实际年化表现。

### HC-07 归因匹配数据能力

Level 1 可做基金贡献、benchmark/excess、成本、资金时点和可靠 FX；Level 2 allocation/selection/interaction 需要目标/实际分类权重和分类 benchmark。没有输入时输出 `INSUFFICIENT_DATA`。

### HC-08 风险指标是多维证据

Volatility、Drawdown、Sharpe、Sortino、Tracking Error、Information Ratio、Capture 等不能压成一个分数；每个指标显示期间、频率、口径和适用限制。

### HC-09 DecisionRecord 核心字段不可事后覆盖

Thesis、Trigger、Invalidation、计划量、预期期限、场景和绑定版本创建后不可改写。允许追加带时间和作者的 annotation。

### HC-10 单次结果不能升级规则

一个样本不能把 StrategyHypothesis 升级为 `SUPPORTED`，也不能降为 `CONTRADICTED`。状态转换必须由明确样本、期间和证据规则驱动。

### HC-11 行为信号不是心理诊断

PGR/PLR、turnover、trade count 和 holding period 只能产生可审查的 Finding。严禁从交易统计直接输出“情绪化”“恐惧”“贪婪”等心理因果。

### HC-12 核心财务逻辑 deterministic

Return、TWR、MWR/XIRR、benchmark comparison、drawdown、turnover、cost、rule violation 和 appraisal 状态由确定性代码计算。相同数据换 LLM 后核心结果完全一致。

### HC-13 AI 输出可追溯且分层

AI 只消费结构化 Finding，输出 `FACT | INFERENCE | HYPOTHESIS`。重要陈述至少引用一个：

```text
metricId | transactionId | decisionId | strategyRuleId
```

无法可靠归因时不能让 AI 补故事。

### HC-14 unknown 优先于虚假精确

结果状态统一支持 `COMPLIANT | PARTIAL | BREACH | INSUFFICIENT_DATA`。必要输入缺失、过期、期间不匹配或语义未知时，宁可停止。

### HC-15 无自动交易和权威建议

Review Engine 不输出权威 BUY/SELL，不提交申购、赎回、转账或交易。移动止损和减仓是用户定义的 StrategyRule 与执行复核，不是自动订单。

## 产品约束而非外部标准原文

以下是本项目的工程设计，不应写成“CFA 明确规定了此软件模型”：

- Decision/Outcome 四象限；
- `COMPLIANT/PARTIAL/BREACH/INSUFFICIENT_DATA` 枚举；
- ReviewPeriod 八步顺序；
- StrategyHypothesis 五态；
- AI evidence reference schema；
- P0–P4 实施顺序。

这些约束需要通过测试与真实使用验证其价值。
