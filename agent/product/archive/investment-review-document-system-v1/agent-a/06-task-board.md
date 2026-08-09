# Agent A 任务板

**安全边界**：只使用人工 fixture、源码和 Agent B 脱敏结论；禁止访问真实账户、真实资产/交易、Cookie、Token、Raw Snapshot、登录态和完整 Network Logs。所有任务满足 [Shared DoD](../shared/02-definition-of-done.md)。初始状态均为“待开始”。

## 依赖图

```text
A-FOUND-001
├── A-MEAS-001 ← B-POSITION/CASHFLOW/NAV
├── A-BENCH-001 ← B-BENCH-001
├── A-JOURNAL-001
└── A-EXEC-001 ← B-LINK-001

A-MEAS + A-BENCH → A-RISK-001 → A-REVIEW-001
A-JOURNAL + A-EXEC → A-APPRAISE-001 → A-REVIEW-001
A-MEAS + A-BENCH → A-ATTR-001 ────────────┘
A-APPRAISE + sufficient history → A-BEHAV-001 ─┘
A-REVIEW + A-ATTR + A-BEHAV → A-HYP-001 → A-AI-001
```

P0 Measurement 未满足发布门槛时，不得以 A-AI-001 提前补产品结论。

## 总表

| ID | 阶段 | 任务 | 主要依赖 | 状态 |
| --- | --- | --- | --- | --- |
| `A-FOUND-001` | Foundation | canonical domain、版本关系与 Ledger migration | Shared contracts | 待开始 |
| `A-MEAS-001` | P0 | Absolute/TWR/MWR 与 cash-flow reconciliation | A-FOUND、B Position/CashFlow/NAV | 待开始 |
| `A-BENCH-001` | P0 | BenchmarkVersion、对齐门槛与 Excess Return | A-FOUND、B-BENCH | 待开始 |
| `A-RISK-001` | P0 | Drawdown/duration、volatility 与适用风险指标 | A-MEAS、A-BENCH | 待开始 |
| `A-JOURNAL-001` | P1 | Policy/Rule/Profile/DecisionRecord 与规则 variants | A-FOUND | 待开始 |
| `A-EXEC-001` | P1 | Decision 与申请/确认/Snapshot 对照 | A-FOUND、A-JOURNAL、B-LINK | 待开始 |
| `A-APPRAISE-001` | P1 | Process/Outcome 分离的多维 Appraisal | A-JOURNAL、A-EXEC | 待开始 |
| `A-REVIEW-001` | P0–P3 | ReviewPeriod deterministic orchestrator 与 UI DTO | Measurement/Risk/Appraisal | 待开始 |
| `A-ATTR-001` | P2 | Level 1/2 Attribution 与 residual | A-MEAS、A-BENCH | 待开始 |
| `A-BEHAV-001` | P2 | Outcome Bias/Disposition/Overtrading/Drift signals | A-APPRAISE、历史 Coverage | 待开始 |
| `A-HYP-001` | P3 | StrategyHypothesis evidence state | A-REVIEW、A-ATTR、A-BEHAV | 待开始 |
| `A-AI-001` | P4 | 可追溯 AI Review boundary 与 draft workflow | P0–P3 稳定 | 待开始 |

## 任务规格

### `A-FOUND-001` — Domain 与 Ledger

- **输出**：canonical types、schemaVersion、version resolver、repository API、现有 Policy/Action/Fact migration；
- **Oracle**：不可变字段表、effective-period 决策表、migration 前后等价表、round-trip；
- **关键 fixture**：policy/benchmark version change、decision immutable、unknown schema；
- **停止条件**：无法无损保留已有本地记录时先提交 migration 决策，不得清库。

### `A-MEAS-001` — Return / TWR / MWR

- **输出**：CashFlow reconciliation、Absolute Return、TWR subperiod linking、dated MWR/XIRR、PerformanceSnapshot；
- **Oracle**：独立手算序列和 XIRR residual；不调用生产 solver 生成 expected；
- **关键 fixture**：no cashflow、external-flow timing、irregular cashflows、cash/fee included vs omitted；
- **停止条件**：方向、估值边界、费用或终值不可调和时按 metric 返回 `INSUFFICIENT_DATA`。

### `A-BENCH-001` — Benchmark 与比较

- **输出**：BenchmarkVersion、Target Completion、Benchmark Return、Excess Return、same-period/currency/return-type/fee-basis gate；
- **Oracle**：相反 Target/Benchmark 结论、版本不可变、mismatch 停止表；
- **关键 fixture**：target beat/benchmark miss、benchmark beat/target miss、period/currency/return-type mismatch；
- **停止条件**：来源语义或 FX 不可信时不比较，不自动换 benchmark。

### `A-RISK-001` — Risk Measurement

- **输出**：percentage drawdown curve、maximum drawdown、duration、volatility；输入满足时再发布 Sharpe/Sortino 等；
- **Oracle**：手算 peak/trough/recovery 序列、统计定义和少于一年展示规则；
- **关键 fixture**：drawdown curve、DailyPnL-not-drawdown、partial series；
- **停止条件**：资本基数、频率、risk-free/target 或样本不足时隐藏受影响指标并说明 limitation。

### `A-JOURNAL-001` — Ex-ante objects 与规则

- **输出**：InvestmentPolicy、StrategyRule、FundStrategyProfile、DecisionRecord 的 versioned APIs；position/exposure/cash/trailing-stop/reduction variants；
- **Oracle**：不可变字段、版本解析、规则边界手算、stop-line 单调性质；
- **关键 fixture**：decision immutable、policy change、position/cash breach、stop ratchet/stale NAV；
- **停止条件**：没有用户规则时不生成“合理仓位”或“合适减仓”。

### `A-EXEC-001` — Decision → Execution

- **输出**：planned/requested/partial/confirmed/failed/cancelled、前后 Snapshot、deviation、remaining plan 的持久化状态机；
- **Oracle**：合法转换表和必填字段表；
- **关键 fixture**：unplanned operation、plan deviation、partial confirmation/reduction、snapshot unlinked；
- **停止条件**：来源不能区分申请/确认或不能关联 Snapshot 时停在 partial/unknown。

### `A-APPRAISE-001` — Decision Appraisal

- **输出**：Strategy Compliance、Risk Compliance、Execution Discipline、Evidence Completeness、Decision Consistency 和独立 Outcome；
- **Oracle**：profitable breach、compliant loss、5% planned/12% confirmed；
- **禁止**：综合 Investment Score、GOOD_DECISION/BAD_DECISION、用 Outcome 改 Process；
- **停止条件**：规则版本或事前记录缺失时仅发布可证明维度。

### `A-REVIEW-001` — ReviewPeriod 与 IA

- **输出**：固定 workflow orchestrator、可重算 snapshot refs、`/investment/review` Query DTO 和按认知顺序的页面；
- **Oracle**：阶段顺序、历史版本不变、每条结论下钻、partial/unknown 恢复路径；
- **边界**：页面不重算 Core，不把 `/investment/legacy/review` 当 canonical Review；
- **停止条件**：阶段输入不足时显示 readiness，不跳过并伪造完整结论。

### `A-ATTR-001` — Attribution

- **输出**：Level 1 fund/benchmark/timing/cost/FX/residual；满足条件时 Level 2 allocation/selection/interaction；
- **Oracle**：独立 reconciliation 表和 Level 2 手算；
- **关键 fixture**：level1 reconciliation、level2 complete/missing benchmark、residual；
- **停止条件**：分类权重或 benchmark 不足时 Level 2 为 `INSUFFICIENT_DATA`，AI 不补齐。

### `A-BEHAV-001` — Behavioral Review

- **输出**：Outcome Bias evidence、PGR/PLR disposition signal、turnover/holding/cost overtrading signal、strategy drift；
- **Oracle**：预先定义样本门槛、机会集合、反例与时间窗；
- **关键 fixture**：disposition sufficient/insufficient、high-turnover improved excess、possible overtrading；
- **停止条件**：成本基础、机会集合或样本不足时不发布稳定 finding；不诊断心理动机。

### `A-HYP-001` — Strategy Hypothesis

- **输出**：UNTESTED/INSUFFICIENT_EVIDENCE/PRELIMINARY/SUPPORTED/CONTRADICTED、正负未知案例、版本化 evidence、Rule draft；
- **Oracle**：single win/loss 不到最终态、mixed evidence、cherry-pick rejection；
- **停止条件**：不可比样本保持不足；状态不自动发布规则或交易。

### `A-AI-001` — AI Review

- **输出**：structured input minimizer、FACT/INFERENCE/HYPOTHESIS schema、evidence validation、annotation/hypothesis/version draft workflow；
- **Oracle**：同输入换模型 deterministic outputs 不变、AI disabled、missing ref、number mismatch、insufficient attribution；
- **禁止**：核心计算、市场预测、权威 BUY/SELL、自动改规则或执行交易；
- **停止条件**：任何重要文本无 evidence ref 或数字与 metric 不一致时拒绝发布。

## 旧任务映射（不再生效）

| 旧 ID | 状态 | 当前去向 |
| --- | --- | --- |
| `A-DISC-001` | superseded | `A-FOUND-001`、`A-JOURNAL-001` |
| `A-DISC-002` | superseded | `A-JOURNAL-001`、`A-EXEC-001` |
| `A-DISC-003` | superseded | `A-EXEC-001`、`A-APPRAISE-001` |
| `A-STOP-001` | mapped | `A-JOURNAL-001` 的 StrategyRule variant |
| `A-REDUCE-001` | mapped | `A-JOURNAL-001` + `A-EXEC-001` |
| `A-EVID-001` | superseded | `A-MEAS/BENCH/RISK/ATTR/REVIEW/HYP` |
| `A-UI-001` | superseded | `A-REVIEW-001` 和各阶段切片 UI |

旧规格保存在 [archive](../archive/investment-os-v2/agent-a/06-task-board.md)，不得继续领取或据此更新状态。
