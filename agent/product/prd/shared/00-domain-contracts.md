# 领域契约

## Core 对象

- `InvestmentSourceAdapter`：把来源数据转换为标准输入，不把站点 selector 泄漏到 Core。
- `DataCoverage`：记录来源、账户范围、基金范围、交易/盈亏时间窗、分页、采集时间和完整性状态。
- `InvestmentProtocol`：定义持仓、基金详情、交易记录、DailyPnL、warning、error 和 unknown 状态。
- `InvestmentLedger`：本地 IndexedDB 账本，保存标准化记录、导入批次、Coverage 和去重键。

## 不变量

1. Adapter 输出必须可被 Mock Adapter 替换。
2. 不完整数据必须携带 Coverage 和 warning。
3. Transaction 与 DailyPnL 使用稳定去重键，重复同步不得重复入账。
4. Core 不读取真实页面 DOM、Cookie、Token 或 Raw Snapshot。
5. 缺失字段、未知枚举和类型变化进入显式 unknown，而不是静默猜测。
