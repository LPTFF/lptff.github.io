# Canonical Domain Contracts

**状态**：目标契约与跨阶段不变量。当前 TypeScript 支持程度见 [Current State](../current-state.md)；未实现对象不得冒充 runtime 能力。

## 分层

```text
Source Adapter
→ Normalized Facts + DataCoverage
→ Versioned ex-ante objects
→ Deterministic Measurement / Rule Engines
→ Attribution / Appraisal / Behavior
→ ReviewPeriod / StrategyHypothesis
→ Optional AI explanation
```

Core 不读取真实页面 DOM、Cookie、Token、Raw Snapshot、登录态或完整 Network Logs；Adapter 可被人工 Mock 完全替换。

## Canonical 对象

### 事前对象

- `InvestmentPolicyVersion`：Target、风险承受、回撤、期限、流动性、资产配置、仓位/现金/暴露限制和 `RiskBudget`；
- `StrategyRuleVersion`：position、exposure、cash floor、regular/pause/review、trailing stop、reduction 等 variants；
- `BenchmarkVersion`：角色、来源、币种、`PRICE | TOTAL_RETURN`、费用口径、频率和有效期；
- `FundStrategyProfileVersion`：asset class、strategy type、portfolio role、currency、risk bucket、holding period 和 benchmark；
- `DecisionRecord`：事前 thesis、trigger、invalidation、scenario、planned amount/quantity/pct 及所有 version refs。

上述对象通过显式版本和有效期解析。核心字段不可覆盖；修订创建新版本或追加 annotation。

### 执行与事实

- `Transaction`：申请、部分确认、确认、失败、撤销、数量、金额、NAV/价格、费用、税、币种、稳定键和可选 decision ref；
- `CashFlow`：外部流入/流出、交易流、分红、费用、税、日期、方向和来源；
- `PositionSnapshot`：Fund position、现金及等价物、估值时间、币种和 Coverage；
- `MarketDataSnapshot`：Fund NAV、Benchmark level/return、日期、币种、return type、修订和 Coverage；
- `DataCoverage`：来源、账户/基金范围、时间窗、分页、采集时间、完整性、新鲜度、warning 和受影响判断。

申请不等于确认；Action status 不等于真实执行。partial、failed、cancelled、expired 和 unlinked 必须保留。

### Deterministic 输出

- `PerformanceSnapshot`：Absolute Return/Profit、TWR、MWR/XIRR、Benchmark Return、Excess Return、Target Completion；
- `RiskSnapshot`：Drawdown/Duration、Volatility，以及满足适用条件的 Sharpe/Sortino/Tracking Error/Information Ratio/Capture；
- `AttributionResult`：level、effects/contributions、residual、Coverage、limitations、evidence refs；
- `DecisionAppraisal`：Strategy Compliance、Risk Compliance、Execution Discipline、Evidence Completeness、Decision Consistency 和独立 Outcome；
- `BehaviorFinding`：可观察模式、样本、阈值、反例、limitations 和 evidence refs；
- `ReviewFinding`：`FACT | INFERENCE | HYPOTHESIS`、确定性来源、severity、limitations 和 evidence refs。

### 复盘与学习

- `ReviewPeriod`：固定边界和版本，按 Objective → Measurement → Risk → Attribution → Appraisal → Behavior → Hypothesis → Rule Update 组织；
- `StrategyHypothesis`：statement、conditions、metrics、sample、正/负/未知案例、limitations 和版本化 evidence status；
- `RuleUpdateDraft`：只创建下一版本草案，不能修改历史或执行交易。

## 结果状态

适用对象统一使用显式状态，而不是默认数字：

```text
VALID
PARTIAL
STALE
INSUFFICIENT_DATA
FAILED
UNKNOWN
```

Appraisal 维度使用：

```text
COMPLIANT
PARTIAL
BREACH
INSUFFICIENT_DATA
```

Outcome 独立表达 `POSITIVE | NEGATIVE | NEUTRAL | INSUFFICIENT_DATA`。不得生成综合 Investment Score、GOOD_DECISION 或 BAD_DECISION 覆盖多维事实。

## 全局不变量

1. Adapter 输出必须能由 Mock Adapter 替换。
2. 缺失、未知枚举、Schema Drift、partial/stale 都进入 Coverage，不静默猜测。
3. 同步和重算具备稳定去重键与幂等性。
4. Decision Quality 不读取最终 Outcome 来决定过程状态。
5. Target 与 Benchmark 不共享字段、不互换计算。
6. Benchmark、Policy、Rule、Profile 和 Decision 使用事前有效版本；当前修改不改变历史。
7. DecisionRecord 核心字段和事前 Snapshot 不被执行或事后 annotation 覆盖。
8. 现金、现金等价物、费用、税、外部现金流和未知资产不能静默消失。
9. Portfolio/Benchmark/Excess 只有同期间、同币种或可验证 FX、同 return type、兼容费用口径时才比较。
10. 少于一年只展示期间实绩，不伪装成年化。
11. 所有 return、TWR、MWR/XIRR、benchmark、drawdown、turnover、cost、rule violation 和 appraisal 由 deterministic code 产生。
12. Attribution 超出数据能力时返回 `INSUFFICIENT_DATA`；residual 与 limitation 可见。
13. 行为 Finding 必须有样本门槛、计算规则和替代解释，不构成心理诊断。
14. 单个成功/失败样本不能直接升级或否定 StrategyRule。
15. 重要 ReviewFinding 至少引用 metric、transaction、decision 或 strategy rule 之一。
16. AI 关闭或更换模型不改变任何核心指标、Finding 状态或 appraisal。
17. Action 关闭不证明 planned、submitted、confirmed、post-state restored 或 completed。
18. 没有用户 Policy/Rule 时，Core 不自行生成“合理仓位”“合适减仓”或权威买卖阈值。
19. 任何真实申购、赎回、调仓、转账和交易都不由本系统自动执行。

## 专项计算不变量

### TWR / MWR

- 外部现金流用于切分 TWR 子期间，不能直接虚增收益；
- MWR/XIRR 使用带日期现金流和可调和终值；
- 现金流方向、日期或期末估值不可靠时停止相应计算。

### Trailing Stop

```text
newHighWaterMark = max(previousHighWaterMark, eligibleCurrentValue)
newStopLine = max(previousStopLine, newHighWaterMark × (1 - drawdownPct))
```

stale/partial/unknown NAV 不推进状态；basis 变化需要新规则版本或停止比较。

### Reduction / Execution

计划量以用户目标区间为 Oracle，不预测卖点。部分确认按真实确认量和新 PositionSnapshot 重算剩余偏离，不能提前完成。

### Attribution

Level 2 只有完整的目标权重、实际分类权重与分类 Benchmark 才可运行。Effects 与可解释总额无法调和时必须显示 residual。

## 上一版概念映射

| 上一版 | Canonical owner |
| --- | --- |
| `Policy/PolicyVersion` | `InvestmentPolicyVersion` |
| `RiskBudget` | Policy 值对象 |
| `PolicyRule` | `StrategyRuleVersion` variants |
| `InvestmentPlan` | `DecisionRecord` |
| `ActionResolution` | Review/Decision workflow 的处置历史 |
| `OperationReview` | 单笔 `DecisionAppraisal`，不替代 `ReviewPeriod` |
| `TrailingStopRule/State` | StrategyRule variant + deterministic state |
| `ReductionPlan` | Rule 触发后的执行计划 |
| `PolicyEvidence` | ReviewPeriod 的 evidence view |
