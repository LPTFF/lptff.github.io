# Definition of Done

## Agent A

- Core 逻辑可由 Mock Adapter 驱动。
- 正常、空、部分、过期、失败、复杂和大数据 fixture 有测试覆盖。
- typecheck、相关单元测试和生产构建通过。
- 页面展示来源、Coverage、warning、失败和恢复路径。
- 不引入真实账户数据或运行时对 agent/ 的依赖。

## Agent B

- 单次只验证一个接口、一个真实场景、一个目标。
- 结果固定为 PASS、FAIL 或 BLOCKED，并列出缺失字段、未知状态、Required change、Sensitive data exposed。
- 真实证据只保留脱敏摘要，不保留原始 HTML、JSON、Cookie、Token 或完整网络日志。
- Adapter/selector 问题修复后重新验证；Core 问题回传 Agent A。

## Shared

- 协议、fixture、真实场景和 mapping 能相互追踪。
- 重复导入不会重复写入 Ledger。
- 未知和不完整状态不会被静默升级为成功。
