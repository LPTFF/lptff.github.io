# P2 — Attribution 与 Behavioral Review

**阶段出口**：系统只在数据支持范围内解释收益来源，并用长期统计识别值得复核的行为模式。

## Attribution Level 1

最低输入：Fund return、Transaction/CashFlow、Position、费用、Benchmark、币种/FX Coverage。

输出：

- Fund return contribution；
- Benchmark/market comparison；
- Excess Return；
- transaction cost effect；
- cash-flow timing difference（TWR vs MWR evidence）；
- FX effect（有可验证 FX 时）；
- residual 与 limitation。

## Attribution Level 2

只有存在完整的目标配置、实际分类权重和分类 Benchmark 时，才计算：

```text
Allocation Effect
Selection Effect
Interaction Effect
```

模型必须对应真实 Policy 决策层级。分类或 benchmark 不可比时回退 Level 1，不让 AI 补齐。

## Behavioral Review

### Outcome Bias evidence

检查事后 annotation、appraisal 或规则修改是否在已知结果后反转了原过程描述。系统只呈现变更事实和时间，不诊断心理动机。

### Disposition signal

计算 PGR/PLR 前必须有：

- 可识别 realized/unrealized gains/losses；
- 可靠成本基础；
- 机会集合和时间窗；
- 最低样本门槛。

输出 `Possible Disposition Pattern`、样本、差异和 limitation，不输出人格结论。

### Possible Overtrading

联合观察：

```text
tradeCount
turnover
averageHoldingPeriod
transactionCost
excessReturn / risk-adjusted evidence
```

只有频率/换手和成本上升且未观察到相应改善时，才提出复核问题。交易频率高本身不等于错误。

### Strategy Drift

统计无 Decision、Rule breach、planned/actual deviation 和规则外操作的持续模式，区分单次例外与重复偏离。

## Oracle

- 缺分类 benchmark：Level 2 必须 `INSUFFICIENT_DATA`；
- effects 与 contribution/excess 无法调和：显示 residual，不强行归零；
- PGR > PLR 但样本不足：不得输出稳定 disposition finding；
- turnover 增加且 excess 改善：不得仅因交易多标记 overtrading；
- 交易成本未知：Possible Overtrading 降级；
- AI 关闭后所有 effects 和 Finding 状态不变。

## 停止条件

任何归因或行为统计无法定义可比较样本、期间、成本或基准时，保留原始 deterministic facts 和 `INSUFFICIENT_DATA`，不进入因果解释。
