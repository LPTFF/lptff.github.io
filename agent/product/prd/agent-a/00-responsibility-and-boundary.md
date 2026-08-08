# Agent A 职责与边界

## 负责

- InvestmentSourceAdapter 抽象、Domain Model 和 Mock Adapter。
- Sensor 状态、warning、DataCoverage 和增量同步。
- Transaction/DailyPnL 去重、Coverage merge 和 IndexedDB Ledger。
- Console、Portfolio、Data 页面。
- Exposure、Policy、Behavior、Evidence 后续能力。

## 输入与禁止事项

输入是 Shared 协议、脱敏 mapping、Mock fixture 和测试结果。禁止访问真实资产、交易、Cookie、Token、Raw Snapshot、登录状态和完整 Network Log。发现真实适配器问题时回传 Agent B；不得自行猜测站点字段。

## 每项交付

必须写明输入、输出、修改文件范围、测试命令、构建命令、边界场景、证据和对 Agent B 的依赖。
