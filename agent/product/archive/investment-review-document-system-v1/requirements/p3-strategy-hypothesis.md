# P3 — Strategy Hypothesis

**阶段出口**：个人经验先成为可证伪、可积累证据的假设，而不是直接进入 StrategyRule。

## 模型

```text
id
statement
rationale
applicableConditions
expectedHorizon
primaryMetrics
riskMetrics
benchmarkVersion/role
createdAt
status
sampleCount
positiveCases
negativeCases
unknownCases
evidenceRefs
limitations
```

状态：

```text
UNTESTED
INSUFFICIENT_EVIDENCE
PRELIMINARY
SUPPORTED
CONTRADICTED
```

## 状态原则

- 新假设从 `UNTESTED` 开始；
- 有样本但 Coverage/期间/可比性不足时是 `INSUFFICIENT_EVIDENCE`；
- 达到最小样本且方向初步一致时可为 `PRELIMINARY`；
- `SUPPORTED/CONTRADICTED` 需要跨足够周期与市场状态、满足预先定义的证据规则；
- 一个样本不能直接进入最终两态；
- 状态更新保存计算规则和前一状态，不覆盖历史。

## Evidence 输入

- 对应 Decision/Rule/Profile 版本；
- excess return 与 risk-adjusted metrics；
- drawdown、duration、cost；
- Process compliance；
- Attribution limitation；
- 反例与 unknown。

不能只累计盈利案例，也不能把违规但盈利当作支持规则的无条件样本。

## 假设与规则的边界

`StrategyHypothesis` 描述待验证关系；`StrategyRule` 是用户决定执行的约束。假设达到 `SUPPORTED` 也不会自动发布规则，只在 Review 最后建议用户考虑新版本。规则执行结果也可以反过来提供假设证据。

## Oracle

- 第一次盈利后仍不能 `SUPPORTED`；
- 第一次亏损后仍不能 `CONTRADICTED`；
- 大量样本但 benchmark/period 不可比时保持不足；
- 只选择正案例的样本集验收失败；
- 修改状态门槛创建评估规则新版本，不重写历史 Hypothesis Review；
- profitable breach 的 Outcome 可以记录，但 process evidence 分开。

## 非目标

- 自动挖掘“稳赢规律”；
- p-value 或 confidence level 的伪精确展示；
- 在数据量不足时使用 AI 判定支持/反驳；
- 假设状态自动触发交易。
