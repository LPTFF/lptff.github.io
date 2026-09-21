# Architecture 与 Domain Model

1. Adapter 将来源数据转为标准协议。
2. Sensor 记录来源状态、Coverage、warning 和更新时间。
3. Sync 以稳定键合并 Transaction 与 DailyPnL，并保留导入批次。
4. Ledger 使用 IndexedDB 保存标准化记录、快照、批次和迁移版本。
5. 页面只消费 Core 查询，不直接依赖 Eastmoney selector 或网络响应。

Core 必须能用 Mock Adapter 完整运行，以便离线开发和回归测试。
