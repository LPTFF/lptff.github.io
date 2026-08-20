# Source Adapter 能力契约

## 目标

Adapter 不只证明“接口读取成功”，而要向 Core 提供足以支持 P0 Measurement 的字段语义、时间边界、状态、历史 Coverage 和 unknown。每次验证仍限定一个来源能力/接口、一个场景和一个目标。

```text
授权真实页面/接口
→ Source-specific endpoint + selector
→ 字段语义、单位、日期、状态、分页和错误分类
→ Source Adapter
→ Normalized Fact + DataCoverage + warning/unknown
→ Agent A deterministic Core
```

DOM 只用于在授权环境中触发筛选/分页；业务字段优先来自页面真实使用的接口。站点字段、selector 和原始响应不能泄漏到页面层或 Agent A fixture。

## P0 所需来源能力

### Position / Cash

逐项验证：

- 稳定账户/资产/基金标识的适用范围；
- 持有、可用、冻结、待确认份额；
- 市值、成本、币种和单位；
- 现金、现金等价物、余额或可用资金及待确认处理；
- 总资产、净资产、可投资资产的口径；
- Position 估值日期、NAV 日期、快照时间和接口时间；
- 空值、零值、未知资产和修订。

来源不能可靠提供现金或总资产口径时返回 `BLOCKED/unknown`，不从敏感汇总值反推。

### Transaction / CashFlow

逐项验证：

- 申购/赎回方向与申请时间；
- 申请金额/份额；
- pending、partial、confirmed、failed、cancelled 的来源语义；
- 确认金额/份额、NAV、日期；
- 费用、税、退款、分红现金/再投资；
- 哪些是外部现金流，哪些只是组合内部交易；
- sourceTransactionId、分页、重叠和状态更新。

申请量不得 mapping 为确认量；现金流方向或外部/内部性质不明确时阻断对应计算。

### Fund NAV / Market Data

逐项验证：

- 日期、单位净值、累计净值或其他 basis；
- 历史区间、分页、缺口、非交易日、最新可用日期；
- 分红、拆分、再投资、复权和修订语义；
- 币种、发布时间和同日重复记录。

不能证明序列可比较时只输出 normalized fact + warning；Adapter 不自行复权或选择有利序列。

### Benchmark Data

Benchmark 可能不在 Eastmoney 或当前授权范围。逐项验证：

- 指标/指数身份的稳定标识和用途；
- level 或 return 字段；
- `PRICE | TOTAL_RETURN`；
- currency、date/timezone、frequency、revision；
- 历史可得性、分页、缺口、数据许可/缓存边界；
- 是否能覆盖事前 BenchmarkVersion 所需期间。

来源不支持时返回 `BLOCKED + Required change`，说明需要其他授权来源、用户导入或产品降级；不得以相似基金或结果最好的指数替代。

### Decision / Transaction / Snapshot Link

报告是否存在：稳定交易 ID、申请/确认时间、PositionSnapshot 时间、同基金多笔交易消歧、待确认资金/份额。时间邻近不证明因果；无法可靠关联时只输出 partial/blocked。

## Mapping 记录

| 项目 | 必需内容 |
| --- | --- |
| Shared field | Core 消费的稳定语义 |
| 来源能力 | 脱敏能力标识，不保存原始响应 |
| presence | present / absent / conditional / unknown |
| semantics | 单位、方向、包含/排除项 |
| time | 数据日、确认日、接口时间、时区 |
| Coverage | 历史区间、分页、缺口、新鲜度 |
| state | 来源枚举到 Shared 状态 |
| risk | Schema Drift、登录依赖、歧义、许可 |
| result | PASS / FAIL / BLOCKED |
| Required change | Adapter / Shared / Agent A / alternative source / product downgrade |

## 失败原则

- absent 明确为 absent，不拼接其他真实敏感字段猜测；
- 字段存在但语义不清仍是 unknown；
- 历史未完整加载为 partial Coverage；
- 登录失效为 authentication required，不降级为空账户；
- Schema Drift 停止受影响 mapping，保留未受影响范围；
- 原始材料只在授权浏览器会话临时观察，不复制到仓库、任务板、日志摘要或 fixture。

## 隐私与安全

Agent B 只输出字段级脱敏结论。禁止输出或保存真实基金名称、金额、收益、可组合识别个人的日期金额、原始 JSON/HTML、Cookie、Token、银行卡、登录状态或完整 Network Logs。不得执行任何真实账户操作。
