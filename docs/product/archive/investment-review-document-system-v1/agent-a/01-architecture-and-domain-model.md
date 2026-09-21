# Canonical Architecture 与 Domain Model

本文件说明 Agent A 的实现边界；canonical 业务定义由 [product/02-domain-model.md](../product/02-domain-model.md) 和 [Shared contracts](../shared/00-domain-contracts.md) 唯一负责。

## 依赖方向

```text
Source-specific Adapter
→ Normalized Facts + Coverage
→ Ledger / Version Resolver
→ Deterministic Engines
→ Review Orchestrator / Query DTO
→ Vue Views
→ Optional AI explanation
```

- 页面不读取 Eastmoney selector 或原始响应，也不重算领域规则；
- AI 层只能消费 Query/Review DTO，不能反向写入 metric/status；
- Core 必须能用 Mock Adapter 和人工 fixture 离线完整运行；
- 真实来源字段语义由 Agent B 验证，Core 对未知语义停止而不是猜测。

## 实现模块

1. **Facts**：Transaction、CashFlow、PositionSnapshot、MarketDataSnapshot、DataCoverage；
2. **Ex-ante versions**：InvestmentPolicy、StrategyRule、Benchmark、FundStrategyProfile、DecisionRecord；
3. **Measurement**：return/TWR/MWR、benchmark/excess、risk；
4. **Decision**：Decision→Execution、rule engines、Appraisal；
5. **Review**：Attribution、Behavior、Hypothesis、ReviewPeriod；
6. **Presentation**：稳定 DTO、evidence refs、unknown 恢复路径；
7. **AI boundary**：FACT/INFERENCE/HYPOTHESIS draft，只有 annotation/draft 写入口。

## Ledger 与版本解析

- 记录稳定 ID、schemaVersion、source batch 和 immutable version refs；
- 新 schema 通过 migration 保留现有 Policy/Action/Fact，不能默认清库；
- current 对象与 historical effective object 分开查询；
- Snapshot/metric/appraisal 保存计算 contract version 与输入 refs，支持重算和审计；
- annotation、resolution 和 draft 使用追加历史，不覆盖事前对象。

## 确定性边界

以下只能由 Core 生成：return、TWR、MWR/XIRR、benchmark、excess、target completion、drawdown、risk metrics、transaction cost、turnover、rule violation、Attribution effects/residual、Appraisal 与 Hypothesis evidence state。

所有 engine 输出共同携带：

```text
status
asOf / period
calculationContractVersion
inputVersionRefs
evidenceRefs
coverage
warnings
limitations
```

不满足输入前提时返回 `INSUFFICIENT_DATA/PARTIAL/STALE/UNKNOWN`，不得由 UI 或 AI 补值。

## 测试架构

- expected 来自手算表、独立数学库对照、性质和状态转换表；
- fixture builder 不能调用被测生产函数生成 expected；
- migration/round-trip、幂等、version immutability、Process/Outcome separation 和 LLM independence 是跨模块不变量；
- Agent B 真实语义只决定 Adapter mapping 是否可用，不替代 Core 数学正确性测试。
