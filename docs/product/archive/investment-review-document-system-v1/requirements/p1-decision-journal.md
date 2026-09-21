# P1 — Decision Journal 与 Appraisal

**阶段出口**：用户可以保存不可事后改写的决策依据，将真实执行与计划比较，并在不读取最终盈亏的情况下评价过程。

## Investment Policy

- return objective、risk tolerance、drawdown、horizon、liquidity、constraints；
- asset allocation、position/cash/exposure limits；
- StrategyRule IDs；
- effective period 与 immutable version。

Target 与 Benchmark 分开保存。Benchmark/Profile/Rule 修改创建新版本。

## FundStrategyProfile

每个 Fund 定义 asset class、strategy type、portfolio role、currency、risk bucket、expected holding period 和事前 benchmark。跨角色不按绝对收益直接排名。

## DecisionRecord

至少保存：

```text
createdAt, fund, action, plannedAmount
thesis, trigger, invalidation
expected/risk scenario, expected holding period
policy/rule/benchmark/profile version refs
confidence(optional)
```

核心字段不可覆盖；只允许追加 annotation。

## Decision → Execution

将 DecisionRecord 与 Transaction、确认和 PositionSnapshot 对照：

- planned vs requested vs confirmed；
- object/direction/amount/time deviation；
- partial/failed/cancelled；
- 交易前后 Rule 状态；
- 无事前 Decision 的操作标为 unplanned，不能事后伪造。

## StrategyRule variants

上一轮纪律能力在本阶段作为规则类型落地：

- position/risk asset/cash/exposure guard；
- trailing stop high-water mark 与只上移不变量；
- reduction target band 与部分确认；
- pause/review/regular investment。

规则触发是 process fact，不是市场预测或自动订单。

## Decision Appraisal

输出独立维度：

```text
Strategy Compliance
Risk Compliance
Execution Discipline
Evidence Completeness
Decision Consistency
Outcome（单独）
```

状态为 `COMPLIANT | PARTIAL | BREACH | INSUFFICIENT_DATA`，不生成综合分数。

## Oracle

- profitable breach：不能是 GOOD_DECISION；
- compliant loss：不能因亏损成为 BAD_DECISION；
- 计划 5%、实际确认 12%：Execution = BREACH，与收益无关；
- 今天修改 Policy/Benchmark/Profile 不改变历史 Decision；
- Decision 晚于 Transaction 时仍为 unplanned；
- 止损线任意合格序列下单调不降；
- 部分赎回按确认量重算，不进入 completed。

## 停止条件

P0 无法可靠提供 Transaction/CashFlow/Position 时，P1 仍可保存 Decision Journal，但不得声称完成 execution appraisal 或 outcome evaluation。
