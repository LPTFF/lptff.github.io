# 基金复盘产品：理论依据与完整业务逻辑 v1.0

> **来源属性**：维护者于 2026-08-09 提供的产品输入，按其业务结构整理保存。它是历史上游输入，不等于外部理论已逐条核验，也不代表运行时已交付；审查后采用的当前业务顺序、范围和工作包以[人的产品审查正文](../investment-review.md)为准，本文不随当前规划反向改写。

## 产品目的

基金复盘不是净值页面美化、收益榜或自动买卖工具。它要帮助用户评价完整投资过程，改善未来可重复的、风险调整后的决策质量：

```text
目标与约束
→ 事前判断
→ 投资执行
→ 绩效测量
→ 收益/风险归因
→ 决策评价
→ 行为偏差识别
→ 策略假设更新
→ 下一轮决策
```

产品不承诺持续盈利。当前要放大的是决策杠杆：由系统承担记忆、计算、监控、比较、追踪和证据组织，而不是在缺少证据时鼓励金融杠杆。

## 业务主干

```text
Performance Measurement
→ Performance Attribution
→ Performance Appraisal
```

Measurement 先证明“发生了什么”，Attribution 在数据能力允许时解释“来自哪里”，Appraisal 再评价过程。三者不能倒序，也不能由 AI 故事替代。

## 核心业务对象

```text
InvestmentPolicy
StrategyRule
StrategyHypothesis
Fund
FundStrategyProfile
Benchmark
BenchmarkVersion
DecisionRecord
Transaction
CashFlow
PositionSnapshot
MarketDataSnapshot
PerformanceSnapshot
RiskSnapshot
AttributionResult
DecisionAppraisal
BehaviorFinding
ReviewPeriod
ReviewFinding
```

历史关系：

```text
InvestmentPolicyVersion
  ├── StrategyRuleVersion
  ├── BenchmarkVersion
  └── FundStrategyProfileVersion
              ↓
        DecisionRecord
              ↓
 Transaction + CashFlow + Position/Market Snapshots
              ↓
 PerformanceSnapshot + RiskSnapshot
              ↓
       AttributionResult
              ↓
 DecisionAppraisal + BehaviorFinding
              ↓
   ReviewPeriod + ReviewFinding
              ↓
   StrategyHypothesis update
              ↓
下一版本 Policy / Rule / Benchmark / Profile
```

## 完整 ReviewPeriod

每个复盘周期固定执行：

```text
Objective
→ Performance Measurement
→ Risk Measurement
→ Performance Attribution
→ Decision Evaluation
→ Behavioral Review
→ Hypothesis Update
→ Rule Update
```

只有最后一步可以提出下一版本变化。任何当前版本修改不得改变历史 Review。

## Hard Constraints

1. `Decision Quality` 与 `Outcome Quality` 严格分离；不得使用 `收益高 = 好决策` 或 `亏损 = 坏决策`。
2. 盈利但违规必须保留 process breach；合规但亏损不得自动成为 bad decision。
3. `InvestmentPolicy/IPS` 必须先于基金评价，记录 Target、风险、期限、流动性、配置和约束。
4. 个人 `Target` 与 `Benchmark` 是不同对象、不同问题和不同计算，不能互换。
5. Benchmark 必须事前确定、说明适用角色并版本化；不得根据结果事后更换。
6. Fund 必须有版本化 `FundStrategyProfile` 和 portfolio role，不能跨不同角色按绝对收益直接排名。
7. `DecisionRecord` 必须保存 thesis、trigger、invalidation、scenario 和计划量；核心事前字段不得事后覆盖。
8. Decision 与 Execution 分离，保留计划、申请、确认、部分确认、失败和撤销差异。
9. 现金与现金等价物、费用、税和外部现金流不得被静默忽略。
10. TWR 与 MWR/XIRR 同时保存，分别解释投资组合/策略表现和投资者资金体验。
11. Portfolio、Benchmark 和 Excess Return 必须使用相同期间、币种和收益口径；不匹配时返回 `INSUFFICIENT_DATA`。
12. 少于一年不得把期间实绩伪装成年化收益。
13. 风险指标是多维证据，不生成万能风险分数或综合 Investment Score。
14. Attribution 必须匹配数据能力：缺分类权重或分类 benchmark 时不得生成 allocation/selection/interaction。
15. 无法调和的归因显示 residual 和 limitation，不由 AI 猜原因。
16. Decision Appraisal 分开呈现 Strategy Compliance、Risk Compliance、Execution Discipline、Evidence Completeness、Decision Consistency 和 Outcome。
17. Outcome Bias、Disposition Effect、Possible Overtrading 等只能作为有样本、时间窗、计算口径和限制的行为信号，不能作为心理诊断。
18. 个人经验先进入 `StrategyHypothesis`，不得因一次成功或失败直接修改整个 StrategyRule。
19. 所有核心指标和规则判断由 deterministic code 完成；不同 LLM 下结果必须一致。
20. AI 只解释、关联、提问和总结结构化 Findings，不自行计算核心财务指标，不默认预测市场。
21. AI 输出区分 `FACT | INFERENCE | HYPOTHESIS`；重要结论关联 metric/transaction/decision/rule evidence。
22. 数据不足宁可 `INSUFFICIENT_DATA`，不得用默认值或自然语言补齐。
23. 系统不自动输出权威 BUY/SELL，不自动申购、赎回、调仓、转账或交易。

## 优先级

### P0 — Measurement

建立可靠 Transaction、CashFlow、Position/NAV、Benchmark/Version、Policy/Profile version 和 Coverage，交付 Absolute Return、TWR、MWR/XIRR、Benchmark Return、Excess Return、Target Completion、Drawdown/Duration 与适用风险指标。

### P1 — Decision Journal

交付 InvestmentPolicy、StrategyRule、FundStrategyProfile、不可覆盖的 DecisionRecord、Decision→Execution 对照、多维 Decision Appraisal。仓位护栏、移动止损与减仓作为 StrategyRule variants。

### P2 — Attribution + Behavior

先做 Fund/benchmark/timing/cost/FX/residual 等 Level 1；有完整分类数据才做 Level 2 allocation/selection/interaction。增加 Outcome Bias evidence、Disposition signal、Possible Overtrading 和 Strategy Drift。

### P3 — Strategy Hypothesis

用 `UNTESTED → INSUFFICIENT_EVIDENCE → PRELIMINARY → SUPPORTED/CONTRADICTED` 保存长期证据，不让单个样本升级规则。

### P4 — AI Review

在 deterministic Review Engine 之后解释、关联、提问和总结；输出必须可追溯，模型变化不得改变核心事实和分类。

## 工程验收

- 不同 LLM 下核心指标和确定性状态一致；
- 违规但盈利不能成为 GOOD_DECISION；
- 合规但亏损不能成为 BAD_DECISION；
- 修改当前 Policy 不改变历史 Review；
- 修改当前 Benchmark 不改变历史 Decision 或 Review；
- Target completion 与 Benchmark excess 能产生相反结论并分别展示；
- 现金流、费用、币种、期间或 return type 不满足比较条件时停止；
- Attribution 数据不足返回 `INSUFFICIENT_DATA`；
- AI 重要结论可下钻到 evidence refs；
- 数据不足不发布伪精确结果；
- 所有交易动作都需要在产品范围外，不能由 Review 自动执行。

## 理论使用边界

CFA/GIPS、Outcome Bias、Disposition Effect、Overtrading 和 Sharpe 等内容需要在领域理论卡中分别核验。这里的 hard constraints 是维护者选择的产品工程约束；即使受外部理论启发，也不能全部归称为某一标准的原文要求。
