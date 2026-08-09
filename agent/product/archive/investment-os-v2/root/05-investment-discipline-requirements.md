# 05 投资纪律需求

**状态**：规划中的业务需求，不代表运行时已实现。
**优先级**：P0 操作纪律复核 → P1 移动止损与减仓 → P2 Policy Evidence。
**边界**：所有“合理”“适当”“应处理”均相对于用户事先定义的 Policy；没有 Policy 或可信事实时输出 unknown。

## 1. 完整业务链

```text
业务目的
  提高个人投资过程一致性与风险调整后长期结果
系统约束
  本地优先、用户定义风险、无自动交易、事实与推导分离
用户任务
  建立纪律 → 检查偏离 → 复核操作 → 跟踪执行 → 验证规则
用户判断
  能否判断 / 是否越界 / 是否按计划 / 是否需处理 / 规则是否有效
所需信息
  持仓、现金、交易申请与确认、净值、快照、PolicyVersion、计划、基准
加工与表示
  Coverage → 仓位/暴露 → 计划/实际 → Action → OperationReview → Evidence
技术能力
  Adapter → Ledger → Core Engine → UI → 授权真实验证
```

## 2. 结果状态约定

任何纪律判断必须返回以下之一，而不是只有 true/false：

| 状态 | 含义 | 产品行为 |
| --- | --- | --- |
| `pass` | 所需事实充分，未发现该规则的偏离 | 明确规则范围和数据截止时间，不扩大为“全部正常” |
| `violation` | 事实充分且满足明确规则的越界条件 | 创建可追溯 Action，展示规则、事实和计算 |
| `unknown` | 缺少必要事实、语义或用户规则 | 不生成确定性减仓/止损结论，列出 Required data |
| `partial` | 只能覆盖部分资产、时间或交易 | 标出可判断与不可判断范围，局部结果不得代表整体 |
| `stale` | 字段存在但超过规则允许的新鲜度 | 保留旧值供参考，停止依赖新鲜度的确定性判断 |

## 3. `InvestmentPlan`：操作前计划

### 目的

保存操作发生前的意图和约束，使事后复盘不能用结果重写当时计划。

### 最小字段

| 字段 | 语义 |
| --- | --- |
| `id`、`createdAt` | 稳定标识和事前创建时间 |
| `purpose` | 本次操作要解决的问题，不是事后结果 |
| `assetId`、`direction` | 对象与申购/赎回/保持等计划方向 |
| `plannedAmount` 或 `plannedPct` | 金额或组合比例；至少一个明确 |
| `expectedPortfolioState` | 操作后预期单基金、风险资产、现金和相关暴露 |
| `evidenceRefs` | 创建计划时引用的事实快照与 Coverage |
| `policyVersionIds` | 约束此次计划的不可变规则版本 |
| `validFrom`、`expiresAt` | 执行窗口 |
| `status` | draft / active / submitted / expired / cancelled / completed |

### 判断和输出

- 计划创建前模拟操作后组合，显示预计越界或恢复区间。
- 实际交易只能关联计划，不能覆盖计划原值。
- 没有有效计划的交易输出“计划外操作，待复核”，不是自动判错。
- 计划创建晚于交易申请时，不得冒充事前计划。

### Oracle

给定固定事前快照、计划量和规则版本，独立手算的操作后持仓/现金/暴露应与 Core 结果一致；修改实际确认不得改变事前计划快照和字段。

## 4. `RiskBudget` 与可执行 PolicyRule

### 用户定义字段

- 总风险资产目标、下限和上限；
- 单基金最大组合占比；
- 最低现金/可用资金占比或金额；
- 指数、地区、主题、资产类型、币种的目标区间；
- 允许的新鲜度和未知处理方式；
- 生效日期、失效日期和规则版本。

### 计算要求

1. 明确分母：总资产、净资产或可投资资产，禁止同一页面混用。
2. 当前值和操作后模拟值使用同一估值时点；时间不一致时标记 partial/unknown。
3. 底层暴露必须展示元数据来源和覆盖率；未知资产不被静默排除。
4. 同时输出当前值、目标区间、偏离量、计算时点和规则版本。
5. 规则触发只说明“违反用户定义的护栏”，不直接证明应立即交易。

### Oracle

- 单基金占比 = 该基金可计量市值 / 明确的组合分母。
- 总风险资产与现金分项在相同范围内可调和；无法调和时输出 unknown。
- 恰好位于边界按规则定义为包含边界，不得因浮点误差反复触发。
- 未知持仓使总体判断可能翻转时，整体结果必须是 partial/unknown。

## 5. `TrailingStopRule` 与 `TrailingStopState`

### 适用边界

面向按日公布净值、申赎存在确认延迟的开放式基金。它用于提醒复核和创建赎回计划，不是交易所盘中止损或保证成交价的订单。

### 最小字段

| 对象 | 字段 |
| --- | --- |
| `TrailingStopRule` | assetId、priceBasis、drawdownPct、effectiveFrom、allowedStaleness、policyVersionId |
| `TrailingStopState` | highWaterMark、highWaterMarkDate、currentValue、currentValueDate、stopLine、currentDrawdown、triggerState、coverage |

`priceBasis` 必须明确使用单位净值、累计净值或经过可验证处理的复权序列；分红语义未知时不得混接序列。

### 核心不变量

```text
newHighWaterMark = max(previousHighWaterMark, eligibleCurrentValue)
newStopLine = max(previousStopLine, newHighWaterMark × (1 - drawdownPct))
```

- 新高可使止损线上移；没有新高时止损线绝不下降。
- 规则阈值变化创建新 PolicyVersion；旧状态和旧触发必须保留原版本语义。
- stale/partial/unknown 净值不得推进高水位或制造确定性触发。
- 触发后进入 `review_required`，只有真实申赎确认和操作后状态才能进入 `completed`。

### 输出文案

- pass：`截至 {date}，止损线为 {value}；本次未创新高，止损线未变化。`
- ratcheted：`截至 {date} 出现新高，止损线由 {old} 上移至 {new}。`
- triggered：`当前值已达到用户规则定义的复核线；这是复核提醒，不代表实时成交。`
- unknown：`净值日期/分红语义/历史范围不足，暂不能更新或判断止损线。`

### Oracle

属性测试必须证明任意合格净值序列下止损线单调不降；插入低于历史高点的净值不得改变高水位和止损线；将最新净值标为 stale 后不得改变状态。

## 6. `ReductionPlan`：减仓计划

### 目的

把“需要减仓”转换为相对于用户目标区间的可复核计划，而不是输出脱离 Policy 的卖出建议。

### 最小字段

- 触发原因与关联 Action；
- 关联规则版本和事前快照；
- 当前值、目标区间和允许的执行窗口；
- 计划赎回金额/份额/比例；
- 计划后预计仓位、现金和底层暴露；
- 申请量、确认量、费用、确认日期和最终状态；
- partial/failed/cancelled/expired 状态。

### 计算边界

- 计算目标是使规则指标返回用户定义的目标区间，不是预测最佳卖点。
- 显示估值、份额、净值和申赎延迟造成的误差范围。
- 多个规则同时触发时，展示每条规则的改善或恶化，不暗示单一计划必然解决全部偏离。
- 部分确认后用真实确认量和新快照重新计算剩余偏离，不把申请量当成交量。

### Oracle

给定固定组合、规则和确认量，独立计算的操作后指标应落入或仍偏离目标区间，并与页面结论一致；部分确认的剩余计划量不得按原申请量直接清零。

## 7. `OperationReview` 与 `ActionResolution`

### `ActionResolution`

必须持久化：

- `reasonCode` 与用户说明；
- 决策时间和依据快照；
- `plannedAction`：暂停新增、创建/调整计划、调整 Policy、补充数据、观察或其他；
- 截止时间；
- 关联的 Plan/PolicyVersion；
- resolution 状态。

按钮提示“已记录”必须有可重载的 Ledger 记录作为证据。仅更新 Action 的 open/resolved/ignored 状态不满足要求。

### `OperationReview`

必须关联：

- 事前计划和规则版本；
- 操作前快照；
- 交易申请、确认、费用和失败/撤销状态；
- 操作后快照；
- 计划—实际差异；
- 规则内/外、计划内/外结论及 unknown 原因；
- 用户判定、错误归因和后续动作；
- 执行状态与真实结果。

### 状态机

```text
open
→ resolution_recorded
→ planned（若需要行动）
→ submitted
→ partially_confirmed | confirmed | failed | cancelled | expired
→ post_state_verified
→ completed
```

`ignored` 是用户处置，不证明偏离消失；`resolved` 也不等于执行完成。只有规则恢复或用户明确接受且有结果记录，才能完成复盘闭环。

### Oracle

刷新页面和重新打开 Ledger 后，处置原因、计划、确认和结果仍存在；失败或部分确认不会进入 completed；实际结果的更新不能改变事前字段。

## 8. `PolicyEvidence`

### 要回答的问题

某条规则及其版本是否改善了执行一致性、风险控制和现金流调整后的结果？现有证据能证明什么、不能证明什么？

### 分组维度

- Policy / PolicyVersion；
- 规则内 / 规则外；
- 计划内 / 计划外；
- 触发后按期完成 / 未完成；
- 旧规则版本 / 新规则版本；
- 可比较的资产、时间窗和基准。

### 指标顺序

1. Coverage、样本数、可比较性和现金流完整性；
2. 规则覆盖率、计划—实际一致率、违规频率、偏离持续时间、执行完成率；
3. 组合净值、XIRR、TWR、百分比最大回撤、恢复期和下行波动；
4. 与基准及规则版本的对比；
5. 在数据支持时进行收益、风险和行为归因。

当前简单累计 DailyPnL 的金额回撤只能标记为简化指标，不能冒充专业组合最大回撤。缺少贡献、赎回、组合估值或基准时，相关指标必须降级或停止计算。

### Evidence Strength

| 等级 | 最低含义 |
| --- | --- |
| `INSUFFICIENT` | 必要 Coverage/现金流/样本缺失，不能比较 |
| `WEAK` | 可描述个案，但样本少、时间短或混杂因素明显 |
| `MODERATE` | 有多个可比较记录和风险调整指标，但仍不能建立强因果 |
| `STRONG` | 跨足够周期、版本和市场状态重复出现稳定结果，且关键替代解释已检查 |

强度不能只由“有交易且数量 ≥ 3”决定。系统不得把相关性写成因果，不得用盈利结果为违规行为自动正名。

### Oracle

- 加入外部现金流后，TWR 不应仅因申购金额增加而虚增；XIRR 应使用真实带日期现金流。
- 同一事实按相同规则版本重算结果稳定。
- 缺少必要 Coverage 时由明确规则降级 Strength。
- 盈利但规则外的记录仍归类为 violation/unplanned，结果字段单独保留。

## 9. 可信验证案例

1. 买入导致单基金或底层暴露超限，可从事实和 PolicyVersion 追溯到偏离、处置、执行和结果。
2. 新净值创新高后止损线上移；没有新高时任何输入序列都不能使止损线下降。
3. 减仓计划按目标区间计算，部分确认后保留剩余偏离并等待新快照。
4. stale NAV 或 partial 交易历史使受影响判断降级为 unknown/partial，不生成确定性行动。
5. 盈利但违反事前规则的操作不会自动被标记为正确；Policy Evidence 只在 Coverage、样本和风险/现金流调整指标足够时升级。

## 10. 非目标

- 不预测基金短期涨跌；
- 不输出权威 BUY/SELL；
- 不替用户设定风险承受能力；
- 不承诺收益或持续盈利；
- 不自动执行任何交易；
- 不用 Mock 或文档更新声称真实能力已交付。
