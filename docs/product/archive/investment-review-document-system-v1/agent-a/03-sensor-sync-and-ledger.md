# Sensor、同步与 Ledger

- Sensor：展示 source、采集时间、状态、Coverage、warning 和失败原因。
- Incremental Sync：按稳定键合并，重复批次幂等；交易和每日盈亏分别维护去重策略。
- Ledger：IndexedDB stores 保存 holdings、transactions、dailyPnL、imports 和 coverage；迁移需可回滚并有版本测试。
- 失败或部分成功：保留最后有效账本，同时标记当前批次状态，不覆盖为零值。

Agent B 只提供字段 mapping、真实场景和未知状态摘要；任何 Core 行为由 Agent A 用 fixture 验证。
