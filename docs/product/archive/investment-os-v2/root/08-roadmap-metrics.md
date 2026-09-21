# 08 路线与指标

**来源**：原始 PRD 第 52–59、66–70 节与当前纪律闭环设计。**状态**：路线规划；指标只有在字段、Coverage 和样本满足时才可计算。

## 当前能力基线

Trusted Ledger、Coverage、Exposure、Policy、Behavior 和 Evidence 已有不同程度的局部实现，但现状仍主要支持事实读取、风险展示、最大暴露检查、异常大额买入识别和汇总式证据。它们不是按版本全部完成的水平层。

因此后续不继续按“再做一个引擎/页面”推进，而按用户任务交付垂直切片。

## 垂直路线

### P0 操作纪律复核

```text
Shared 纪律语义冻结
→ B 字段可得性结论与 A 脱敏 fixture 并行
→ A 领域对象、风险护栏和状态机
→ B 授权真实来源验证
→ A 任务导向 UI 与闭环验收
```

交付：风险预算、单基金/总风险资产/现金/暴露护栏、事前计划、计划—实际对照、Action 处置持久化、真实执行结果和操作后复核。

### P1 移动止损与减仓

依赖 `B-NAV-001` 和 `B-TX-001` 对净值、分红/复权、申赎申请与确认语义的结论。交付高水位状态、只上移不变量、触发复核、按目标区间的减仓计划和部分确认处理。

### P2 Policy Evidence

依赖 P0/P1 产生真实、可追溯的计划与执行记录，以及足够历史 Coverage。交付规则内外、计划内外、版本对比、现金流调整绩效、基准、回撤/恢复期和证据强度。

### 后续 AI Research Assistant

仅在 Ledger、Policy、OperationReview 和 Evidence 足够可信后用于解释、比较、发现模式和提出可审查问题；不预测市场，不以 BUY/SELL 为核心，也不替代用户风险判断。

## 指标

### 数据与判断可用性

- Position / Transaction / NAV / Cash Coverage；
- Daily NAV Continuity；
- 交易申请—确认可关联率；
- 操作前后快照可关联率；
- stale/partial/unknown 判断占比；
- Parsing Error 与 Schema Drift 率。

### 纪律覆盖与一致性

- **Policy Coverage**：被有效规则覆盖的持仓、暴露和操作比例；
- **Pre-plan Coverage**：有有效事前计划的可复核操作比例；
- **Plan–Actual Consistency**：对象、方向、金额/比例和期限符合计划的比例；
- **Out-of-policy Frequency**：规则外操作频率；
- **Unplanned Operation Frequency**：计划外操作频率；
- **Repeat Violation Rate**：同类偏离重复发生比例。

### 风险与执行

- 单基金/总风险资产/现金/暴露超限次数；
- **Exposure Breach Duration**：超限暴露持续时间；
- **Action Resolution Completeness**：处置原因与计划动作完整率；
- **Triggered-to-completed Rate**：规则触发后按期执行完成率；
- 部分确认后剩余偏离关闭时间；
- **Missed Stop Ratchet Count**：按合格净值应上移但状态未上移的次数；
- 止损触发后等待复核/确认的时间。

### 规则证据

- 各 PolicyVersion 的有效样本数与时间跨度；
- 规则内/外、计划内/外的执行和结果差异；
- XIRR、TWR、百分比最大回撤、下行波动和恢复期；
- 相对可比较基准的差异；
- Evidence Strength 及其降级原因；
- 规则修改后重复违规、风险暴露和执行一致性的变化。

## 指标解释边界

- 收益率、累计盈亏或单次胜负不能单独证明产品或规则有效。
- 没有完整现金流和组合估值时，不计算或不升级现金流调整绩效证据。
- 没有可靠复权/分红语义时，不把净值序列用于移动止损或长期比较。
- 指标必须绑定时间范围、Coverage、PolicyVersion 和样本量。
- 规则外操作即使盈利也不自动转为“正确”；规则内操作即使亏损也不因单次结果自动判为“错误”。

## 不使用的主要指标

不以 DAU、使用时长、打开次数、页面数量、数据卡片数量或建议数量作为主要成功指标。投资软件更少被打开不必然意味着价值降低；如果它能在关键时点可靠发现偏离、减少重复错误并保留证据，低频仍可有高价值。
