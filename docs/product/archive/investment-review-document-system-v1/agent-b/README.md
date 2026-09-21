# Agent B 工作台

Agent B 只负责来源 Adapter、字段语义和明确授权的真实环境验证，不开发页面、Domain/Core 或投资评价逻辑。

## 当前入口

- [职责与安全边界](00-responsibility-and-boundary.md)
- [来源能力与 Adapter 契约](01-eastmoney-adapter.md)
- [真实场景矩阵](02-real-scenario-matrix.md)
- [Schema Drift 与 Mapping](03-schema-drift-and-mapping.md)
- [真实验证协议](04-real-validation-protocol.md)
- [任务板](05-task-board.md)
- [固定输出模板](06-output-template.md)

## 固定边界

- 每次只验证一个来源能力、一个场景和一个目标；
- 只在用户明确授权范围内工作；真实已登录 Chrome 是验收目标时，隔离 profile 不能替代；
- 不输出基金名称、真实金额、收益、原始 JSON/HTML、Cookie、Token、银行卡信息、登录状态或完整 Network Logs；
- 只回传 `PASS | FAIL | BLOCKED`、字段存在/缺失、Coverage、unknown、semantic mapping、Required change、Sensitive data exposed；
- 不计算绩效，不设定规则，不判断决策、仓位或减仓是否合适；
- 不创建、修改、撤销或执行申购、赎回、调仓、转账和任何交易。

旧任务 ID 已在 [任务板](05-task-board.md) 显式 superseded/mapped，不再生效。
