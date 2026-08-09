# P0 — Performance Measurement

**阶段出口**：在不依赖 AI 的情况下，以可靠 Transaction、CashFlow、Position/NAV、Benchmark 和版本事实，重算 Portfolio/Benchmark/Excess Return 与基础风险。

## 输入基础

- Transaction：申请、确认、金额/份额、NAV/价格、费用、税、币种和状态；
- CashFlow：外部流入/流出、分红、费用与日期；
- PositionSnapshot：持仓、现金及等价物、估值时点；
- Fund NAV / MarketDataSnapshot；
- BenchmarkVersion：level/return、currency、price/total-return、期间和来源；
- 当时有效的 InvestmentPolicyVersion 和 FundStrategyProfileVersion；
- DataCoverage 与 warning。

## 确定性计算

1. Absolute Return / Profit；
2. TWR：按外部现金流切分子期间并链接；
3. MWR/XIRR：使用带日期现金流和终值；
4. Benchmark Return；
5. Excess Return；
6. Target Completion（独立于 Excess）；
7. Maximum Drawdown 与 Drawdown Duration；
8. 在输入足够时计算 Volatility；Sharpe/Sortino 放在同一 deterministic engine，但必须显示适用边界。

## 比较门槛

Portfolio 与 Benchmark 只有同时满足以下条件才比较：

```text
same period
same currency 或可验证 FX
same return type
compatible fee basis
complete-enough coverage
```

不满足时返回 `INSUFFICIENT_DATA` 和缺口，不偷偷换 benchmark 或口径。

## 财务边界

- 现金与现金等价物属于组合，不得从回报中静默排除；
- 费用和税明确 gross/net/unknown；
- 外部现金流不得直接虚增 TWR；
- MWR 与 TWR 同时保留，解释不同用途；
- 少于一年期间只显示期间实绩，不年化；
- 当前累计 DailyPnL 金额不是专业组合百分比回撤。

## 输出

`PerformanceSnapshot`、`RiskSnapshot`、计算使用的 version refs、Coverage、metric IDs、warnings 和 limitation。

## Oracle 与 fixture

- 无现金流、单次现金流、多次不规则现金流的手算序列；
- 资产价格不变但中途大额流入：TWR 不因流入上升，MWR 保持可解释；
- 费用 included/omitted 两个结果明确不同且带口径；
- Target 达成但落后 Benchmark；Benchmark 跑赢但 Target 未达；
- price return 与 total return 不可直接比较；
- 币种不匹配且无 FX 时停止；
- 当前 benchmark version 修改不改变历史结果；
- 11 个月期间不得显示年化实绩。

## 停止条件

缺少现金流方向、估值边界、benchmark return type 或可调和终值时，不发布完整 P0；可以交付局部 metric，但必须标出不可比较范围。
