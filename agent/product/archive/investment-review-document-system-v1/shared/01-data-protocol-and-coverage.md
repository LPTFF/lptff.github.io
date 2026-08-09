# 数据协议与 Coverage

标准记录至少包含 `source`、`collectedAt`、`coverage`、`status` 和业务字段。Coverage 需要表达账户/基金范围、交易和盈亏时间窗、分页是否完成、是否存在 partial/stale/blocked 状态。

- Agent B 提供脱敏的字段 mapping 和真实场景结论。
- Agent A 将 mapping 转为 fixture、协议解析和 Ledger 输入。
- 未加载的分页或历史范围必须保持 unknown/partial，不得推断为完整。
- 重复同步按稳定业务键合并；新批次保留来源和时间，便于审计。
