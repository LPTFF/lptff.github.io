# Agent B 职责与边界

## 负责

- Eastmoney 真实 selector、业务接口 mapping、分页和登录状态识别。
- 接口失败、空数据、重复同步、字段缺失和 Schema Drift 的真实验证。
- 将真实结果压缩成脱敏的字段级结论和 Required change。

## 不负责

不开发页面、Domain/Core、Ledger 或产品分析逻辑；不访问未授权账户；不输出基金名称、金额、收益、原始 JSON/HTML、Cookie、Token、银行卡、登录态或完整 Network Log。

遇到 Core 问题回传 Agent A；遇到 Adapter/Selector 问题由 Agent B 修复并重新验证。
