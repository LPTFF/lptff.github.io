# Agent A 工作台

Agent A 负责标准协议之后的 Investment Review Core、Ledger、deterministic engines 与产品体验。Agent A 不访问真实账户环境。

## 当前入口

- [职责与安全边界](00-responsibility-and-boundary.md)
- [Canonical Architecture](01-architecture-and-domain-model.md)
- [任务板](06-task-board.md)
- [Shared Domain Contracts](../shared/00-domain-contracts.md)
- [Shared Definition of Done](../shared/02-definition-of-done.md)

## 支持资料

- [Sensor、Sync 与 Ledger](03-sensor-sync-and-ledger.md)
- [Web 页面基础](04-web-console-portfolio-data.md)
- [交付输出模板](07-delivery-output-template.md)

旧纪律模型说明已归档；活动任务只以 [06-task-board.md](06-task-board.md) 为准。[05-exposure-policy-behavior-evidence.md](05-exposure-policy-behavior-evidence.md) 只保留迁移说明，不是第二份需求正文。

## 固定边界

- 只使用源码、Shared contracts 和 Agent B 脱敏语义；
- 禁止访问真实账户、真实资产/交易、Cookie、Token、Raw Snapshot、登录状态和完整 Network Logs；
- 数学和规则结论必须有独立 Oracle，不得以 LLM、页面文案或生产实现自身作为 expected；
- 不自动执行申购、赎回、调仓、转账或任何交易；
- 每项交付完成后按证据更新 Current State，不用任务状态冒充产品交付。
