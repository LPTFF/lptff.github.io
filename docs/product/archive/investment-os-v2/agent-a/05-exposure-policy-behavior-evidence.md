# Exposure、Policy、Behavior、Evidence

本文件约束 Agent A 的产品语义。目标不是给现有页面增加更多卡片，而是把可信事实转成可复核的投资纪律闭环。详细字段和 Oracle 见 [../05-investment-discipline-requirements.md](../05-investment-discipline-requirements.md)，Shared 不变量见 [../shared/00-domain-contracts.md](../shared/00-domain-contracts.md)。

## 1. Exposure：从展示聚合到风险护栏

当前已有指数、地区、主题等聚合基础。下一步必须同时表示：

- 当前值、用户目标区间/上限、偏离量；
- 统一估值时点和明确分母；
- 元数据来源、未知资产和 Coverage；
- 哪些持仓贡献偏离；
- 计划操作后的模拟值；
- 当前事实与 PolicyVersion 的追溯关系。

Agent A 不得自行设定单基金、风险资产或现金阈值。未知持仓可能改变结果时输出 partial/unknown。

## 2. Policy：从配置保存到可执行风险预算

Policy Engine 要支持的优先顺序：

1. 单基金最大占比；
2. 总风险资产区间；
3. 最低现金底线；
4. 指数/地区/主题/资产类型等暴露区间；
5. 移动止损；
6. 减仓目标与执行窗口。

每次评估返回规则版本、事实时间、Coverage、current/target/deviation、计算解释和 pass/violation/unknown/partial/stale。`targetPct`、`minPct` 等字段只有被引擎真实评估后才能在 UI 标记为“运行中”。

## 3. Behavior：从金额异常到操作纪律

金额异常仍可作为观察信号，但不能代替 Policy-relative 复盘。Behavior 的核心分组升级为：

- 有效事前计划 / 计划外；
- 规则内 / 规则外 / unknown；
- 按计划完成 / 部分偏离 / 未完成；
- 重复偏离模式；
- 用户判定和错误归因。

计划外不自动等于错误；盈利不自动等于正确。任何分类都必须保留原始事实和用户判断的边界。

## 4. Action 与 OperationReview 状态机

Action 是待处理判断，不是结果。Agent A 必须把以下状态分别持久化：

```text
open
→ resolution_recorded
→ planned
→ submitted
→ partially_confirmed | confirmed | failed | cancelled | expired
→ post_state_verified
→ completed
```

- `reasonCode`、用户说明、计划动作和截止时间必须可重载。
- `pause-new` 若声称暂停新增，必须创建/关联真实可执行规则或明确只是一条用户决策记录。
- `adjust-policy` 必须创建新 PolicyVersion，不能只关闭 Action。
- `ignore` 不代表偏离消失。
- 部分确认后保留剩余计划和偏离。
- 操作后快照不可可靠关联时停在 partial/unknown。

## 5. 移动止损

Agent A 只基于 Agent B 已确认语义或 Mock 合同使用净值序列。需要实现：

- price basis 明确；
- high-water mark；
- `newStopLine >= previousStopLine`；
- 新高上移、非新高不变；
- stale/partial/dividend-unknown 停止路径；
- 触发后创建复核 Action，而非自动赎回。

必须用属性测试覆盖任意序列，不只测试两个示例。

## 6. 减仓计划

系统根据用户规则将当前指标恢复到目标区间，并模拟计划后的单基金、风险资产、现金和暴露。输出计划量、假设、误差和可能仍未解决的其他规则。

申请、部分确认、确认和操作后状态分别保存。不得把申请量作为真实成交，不得在没有目标区间时输出“合适减仓”。

## 7. Evidence：从汇总卡到 Policy Evidence

Evidence 的第一层是可比较性，不是收益：

1. Coverage、现金流、估值、样本和时间跨度；
2. 规则内外、计划内外、执行完成情况；
3. XIRR/TWR、百分比回撤、恢复期和下行波动；
4. PolicyVersion 和可靠基准比较；
5. 在证据允许时进行归因。

现有累计 DailyPnL 回撤必须标记为简化金额指标，不能作为专业组合最大回撤。Evidence Strength 不能只按记录数量升级。

## 8. UI 表示要求

- Console：能否判断 → 硬规则偏离 → 最近操作 → 待处理 Action。
- Portfolio：当前/目标/偏离/来源/贡献持仓/计划后模拟。
- Policies：用户风险预算、引擎支持状态、版本差异。
- Actions：触发事实、用户处置、计划、确认和结果。
- Evidence：按 PolicyVersion 回答证据充分性与不能证明的内容。

UI 只能消费 Core 语义，不得在组件中复制或发明计算规则。

## 9. Agent A 验证要求

- 只使用已授权真实环境中直接观察到的场景。
- expected 由手算、公式、不变量或状态转换表生成，不调用生产函数生成。
- 每项任务包含正常、partial、stale/failed、重载和版本边界。
- 完成必须满足 [Definition of Done](../shared/02-definition-of-done.md)。
- 依赖真实字段时先消费 Agent B 的脱敏结论；不得自行访问真实账户补齐。
