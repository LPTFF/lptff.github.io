# Canonical Domain Model

**状态**：目标领域模型，不代表当前 TypeScript 已实现。当前差距见 [Current State](../current-state.md)。

## 聚合与实体

### `InvestmentPolicy`

投资过程的版本化聚合根：

```text
id, version, effectiveFrom, effectiveTo
returnObjective
riskTolerance, maxAcceptableDrawdown
 timeHorizon, liquidityRequirement, constraints
assetAllocationTargets, positionLimits, allowedAssetTypes
riskBudget
strategyRuleIds
```

`returnObjective` 是 Target，不是 Benchmark。

### `StrategyRule`

Policy 下的可执行事前规则。variants 包括：

- 资产配置/单基金/底层暴露区间；
- 风险资产区间与现金底线；
- 定投、暂停和复核；
- 移动止损；
- 减仓触发、目标区间和执行窗口。

所有 Rule 按版本与有效期解析。

### `Benchmark` / `BenchmarkVersion`

```text
id, version, effectiveFrom, effectiveTo
name, role, source
currency
returnType: PRICE | TOTAL_RETURN
feeBasis: GROSS | NET | NOT_APPLICABLE
frequency
appropriateForProfileIds
```

Benchmark 事前绑定到 Policy、FundStrategyProfile 或 DecisionRecord，不能由结果选择。

### `Fund` / `FundStrategyProfile`

```text
Fund: id, code, name
Profile: version, effective period
assetClass, strategyType, portfolioRole
benchmarkVersionId, currency
expectedHoldingPeriod, riskBucket
```

基金只能在其角色和适用 benchmark 中评价，不能用绝对收益跨不同角色直接排名。

### `DecisionRecord`

合并上一版 `InvestmentPlan` 的事前语义：

```text
decisionId, createdAt
fundId, action, plannedAmount/quantity/pct
decisionType
investmentThesis
triggerConditions
invalidatingConditions
expectedScenario, riskScenario
expectedHoldingPeriod
policyVersionId, strategyRuleVersionIds
benchmarkVersionId, fundProfileVersionId
confidence(optional)
status
```

核心字段不可修改；追加 annotation 进入独立历史。

### 执行与事实

- `Transaction`：真实申购/赎回申请、部分确认、确认、失败、撤销、数量、金额、价格/NAV、费用、税、币种，并可选关联 DecisionRecord。
- `CashFlow`：外部资金流、交易流、分红、费用和税，明确方向、日期与来源。
- `PositionSnapshot`：持仓、现金及等价物、估值和 Coverage。
- `MarketDataSnapshot`：Fund NAV 与 Benchmark level/return，明确 price/total-return、币种、日期和修订。

### 确定性分析输出

- `PerformanceSnapshot`：Absolute Return、TWR、MWR/XIRR、Benchmark Return、Excess Return、Target Completion。
- `RiskSnapshot`：Volatility、Maximum Drawdown、Drawdown Duration、Sharpe、Sortino；有可靠 benchmark 时可扩展 Tracking Error、Information Ratio、Capture。
- `AttributionResult`：Level、effects、residual、Coverage、limitation 与 evidence refs。
- `DecisionAppraisal`：Strategy/Risk Compliance、Execution Discipline、Evidence Completeness、Decision Consistency，以及分离的 Outcome。

### 复盘与学习

- `BehaviorFinding`：可观察统计、阈值、样本、limitation 和 `Possible` 类型，不保存心理诊断。
- `StrategyHypothesis`：陈述、适用条件、指标、样本和证据状态。
- `ReviewPeriod`：周/月/季/年边界、绑定版本、Measurement/Risk/Attribution/Appraisal/Behavior/Hypothesis/Rule Update。
- `ReviewFinding`：`FACT | INFERENCE | HYPOTHESIS`、severity、evidenceRefs、limitation 和 suggestedQuestion。

## 关系

```text
InvestmentPolicyVersion
  ├── StrategyRuleVersion
  ├── BenchmarkVersion
  └── FundStrategyProfileVersion
            ↓
      DecisionRecord（事前冻结）
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
 StrategyHypothesis evidence update
            ↓
下一版本 Policy / Rule / Benchmark / Profile
```

## 上一版对象映射

| 上一版 | Canonical 去向 |
| --- | --- |
| `RiskBudget` | `InvestmentPolicy` 的值对象 |
| `Policy` / `PolicyVersion` | 迁移为 `InvestmentPolicy` / version；保留兼容映射 |
| `PolicyRule` | `StrategyRule` variants |
| `InvestmentPlan` | 合并进 `DecisionRecord` |
| `ActionResolution` | Decision/Review workflow 中的用户处置记录 |
| `OperationReview` | 单笔 Decision/Execution appraisal，不替代周期 `ReviewPeriod` |
| `TrailingStopRule/State` | StrategyRule variant + deterministic state |
| `ReductionPlan` | Rule 触发后的执行计划，关联 DecisionRecord/Transaction |
| `PolicyEvidence` | ReviewPeriod 中按 Policy/RuleVersion 聚合的 evidence view |

## 全局不变量

1. Process 状态不读取 Outcome 决定合规与否。
2. Target 与 Benchmark 不共享字段或替代计算。
3. 历史对象通过 effective period 和显式 version 引用解析。
4. 核心事前字段只追加 annotation，不覆盖。
5. 现金、费用、税和未知资产进入 Coverage，不静默消失。
6. Portfolio/Benchmark 比较必须同期间、同币种、同 return type。
7. 少于一年实绩不年化展示。
8. Attribution effects 应与可解释总额调和；residual 必须可见。
9. 行为 Finding 必须携带样本和替代解释限制。
10. 重要 ReviewFinding 至少有一个 metric/transaction/decision/rule reference。
11. 数据不足统一返回 `INSUFFICIENT_DATA`，不由 AI 改写。
12. 任何真实执行、确认和操作后恢复都不能由 Action 状态替代。
