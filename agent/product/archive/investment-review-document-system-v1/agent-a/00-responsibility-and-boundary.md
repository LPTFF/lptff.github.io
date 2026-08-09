# Agent A 职责与边界

## 负责

- canonical domain types、版本关系、migration 和 IndexedDB Ledger；
- Adapter 后的 Normalized Facts、DataCoverage、同步、幂等和查询；
- Absolute/TWR/MWR、Benchmark/Excess、risk、Attribution、Appraisal、Behavior、Hypothesis 等 deterministic engines；
- InvestmentPolicy、StrategyRule、FundStrategyProfile、DecisionRecord、ReviewPeriod 工作流；
- 人工 fixture、独立公式/性质/状态机 Oracle；
- `/investment` 与目标 `/investment/review` 的任务导向体验；
- AI 只读 structured Findings 的契约和防越权验证。

## 输入

- [Shared contracts](../shared/00-domain-contracts.md)；
- canonical P0–P4 requirements；
- 人工构造 fixture；
- Agent B 回传的脱敏字段语义、Coverage 与 `PASS | FAIL | BLOCKED`；
- 当前源码、测试和本地非敏感日志。

## 禁止事项

- 访问真实账户、真实资产、真实交易、Cookie、Token、Raw Snapshot、登录状态或完整 Network Logs；
- 根据 Eastmoney 字段名猜语义；来源问题回传 Agent B；
- 由 LLM 计算核心指标、补归因或决定规则状态；
- 将 Target 当 Benchmark、忽略现金/费用或用 Outcome 改写 Process；
- 输出权威买卖建议或执行任何真实交易；
- 清库规避 migration，或修改历史版本规避兼容。

## 每项交付

必须记录：任务 ID、输入/输出、修改范围、独立 Oracle、fixture、测试/构建命令、UI/状态证据、Agent B 依赖、未验证内容和停止条件。完成标准见 [Shared DoD](../shared/02-definition-of-done.md)。
