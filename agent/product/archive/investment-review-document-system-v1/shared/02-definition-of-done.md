# Definition of Done

文档完成、页面出现、Mock 成功、HTTP 200、字段存在或 AI 能生成文字，都不是业务能力完成的充分条件。完成声明必须有与声明匹配的 Objective Evidence 和独立 Oracle。

## 通用完成条件

每个交付项必须同时满足：

1. **契约**：对象、字段、版本、状态、Coverage 和失败行为与 canonical contracts 一致；
2. **实现**：deterministic Core 可由人工 fixture 完全驱动，不依赖真实账户或 LLM；
3. **Oracle**：expected 来自手算表、独立公式、性质/不变量或状态转换，不复制生产实现；
4. **边界**：normal、empty、partial、stale、failed、unknown 和阶段专项场景覆盖；
5. **持久化**：migration、round-trip、reload 后历史版本与关联不丢失；
6. **表示**：UI 展示期间、口径、来源、版本、Coverage、limitation 和下钻证据；
7. **验证**：相关 tests、typecheck 和 production build 通过；失败如实记录；
8. **安全**：不引入真实基金名、金额、收益、账户、Cookie、Token、Raw Snapshot、登录态或完整 Network Logs；
9. **状态**：只有完成实现和匹配验证后，才能更新 [Current State](../current-state.md)。

## Agent A

- Core 不访问真实账户，Adapter 可由 Mock 替换；
- 每个数学指标明确输入、公式、期间、币种、费用/现金口径和 `INSUFFICIENT_DATA` 条件；
- 每个规则明确 Policy/Rule version、分母、边界、事实时点和 Coverage；
- Decision、Execution、Outcome、Review 和 Hypothesis 分开保存；
- sequence/state 能力至少包含属性测试或状态机测试；
- AI 集成只能消费 deterministic Findings，不能成为核心计算 Oracle；
- 运行时代码不依赖 `agent/`。

## Agent B

### 范围

- 单次只验证一个来源能力、一个场景和一个明确目标；
- 开始前记录用户授权范围和停止条件；
- 真实登录 Chrome 是验收目标时，隔离 profile 不得代替真实验收；
- 不设计 Core 规则，不计算绩效，不评价决策，不执行申购、赎回、调仓、转账或交易。

### 字段证据

不能只报告字段存在，还应在授权范围内验证：

- 业务语义、单位和正负方向；
- 数据时点、时区、新鲜度和修订；
- 历史范围、分页、上限和完整性；
- 申请、部分确认、确认、失败、撤销等状态；
- 现金、分红、费用、税、NAV/累计或复权、benchmark price/total-return 的语义；
- Transaction、Decision 和 Snapshot 可关联键及其限制；
- 币种、估值时点和 Coverage。

不能可靠证明时返回 `BLOCKED/unknown` 与 Required change，不猜 mapping。

### 输出与隐私

输出仅限：

```text
PASS | FAIL | BLOCKED
field presence/absence
Coverage
unknown state
semantic mapping
Required change
Sensitive data exposed
```

不得输出或保存真实基金名称、真实金额、收益、可组合识别个人的日期金额、原始 JSON/HTML、Cookie、Token、银行卡信息、登录状态或完整 Network Logs。

## P0 — Measurement

完成需证明：

- Transaction/CashFlow/Position/Market/Benchmark/Policy/Profile 的日期、方向、版本和 Coverage 可调和；
- Absolute、TWR、MWR/XIRR、Benchmark、Excess、Target Completion 和基础风险有独立手算 fixture；
- Portfolio/Benchmark 不同期间、币种、return type 或费用口径时停止比较；
- 外部现金流不直接改变 TWR；现金和费用 included/omitted 结果及口径明确；
- 11 个月实绩不显示年化；
- 修改当前 BenchmarkVersion 不改变历史 PerformanceSnapshot；
- `B-REAL-MEAS-001` 在授权真实 Chrome 给出脱敏结果，或明确 BLOCKED 及阻断范围。

## P1 — Decision Journal

完成需证明：

- Policy/Rule/Profile/Benchmark/DecisionRecord 事前版本不可覆盖；
- 计划、申请、部分确认、确认、失败、撤销和操作后快照分别持久化；
- profitable breach 为 `BREACH + POSITIVE`；compliant loss 为 `COMPLIANT + NEGATIVE`；
- Appraisal 只输出独立维度，不生成综合 Investment Score；
- trailing stop 在所有合格序列下单调不降；
- partial reduction 保留剩余计划和偏离；
- 当前版本修改不改变历史 Decision/Appraisal/Review。

## P2 — Attribution + Behavior

完成需证明：

- Level 1 明确 fund/benchmark/timing/cost/FX/residual 与 limitation；
- 缺分类权重或分类 Benchmark 时 Level 2 返回 `INSUFFICIENT_DATA`；
- effects 无法调和时 residual 可见；
- PGR/PLR、turnover、holding period、cost 的样本规则由 deterministic code 执行；
- 样本不足不发布稳定 disposition/overtrading finding；
- 行为信号显示反例和替代解释，不输出心理诊断；
- AI 关闭不改变 Attribution 或 BehaviorFinding。

## P3 — Strategy Hypothesis

完成需证明：

- 新假设从 `UNTESTED` 开始；
- 单次盈利不能成为 `SUPPORTED`，单次亏损不能成为 `CONTRADICTED`；
- 样本选择包含正、负和 unknown，不允许只挑成功案例；
- 状态规则和历史 evidence 版本化；
- 状态变化只生成 Rule update draft，不自动发布规则或交易。

## P4 — AI Review

完成需证明：

- 同一 deterministic input 更换模型后，metric、Finding 和 appraisal 状态完全一致；
- AI 关闭时 P0–P3 Review 仍完整可用；
- 输出明确标记 `FACT | INFERENCE | HYPOTHESIS`；
- 每条重要结论至少引用 metric/transaction/decision/rule 之一；
- `INSUFFICIENT_DATA` 不被自然语言原因故事覆盖；
- 模型复述的数字与输入不一致时拒绝发布；
- 所有建议仅形成 annotation、hypothesis 或下一版本 draft，不触发真实操作。

## Shared 追踪

- 协议、fixture、任务 ID、测试、真实场景和 Current State 能相互追踪；
- Agent A fixture 必须是人工构造数据，不能由真实记录改名、缩放或扰动产生；
- Agent B 只回传构造语义 fixture 所需的脱敏结论；
- 被替代任务在任务板明确 mapped/superseded，不与新阶段并行生效。
