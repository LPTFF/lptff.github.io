# 系统地图

```text
真实站点
  ↓ 仅由 Agent B 在授权环境验证
Eastmoney Adapter / selector / mapping
  ↓ 脱敏协议结果、字段映射、fixture
InvestmentSourceAdapter
  ↓
Sensor → Coverage → Incremental Sync → IndexedDB Ledger
  ↓
Console / Portfolio / Data / Exposure / Policy / Behavior / Evidence
```

## 责任边界

- Agent B 负责真实站点到标准协议之间的适配和验证证据。
- Agent A 负责标准协议之后的 Core、Mock、账本、页面和分析能力。
- Shared 定义两端都必须遵守的字段、状态、Coverage 和完成标准。
- `project-support/` 提供扩展、脚本和爬虫等交付链路，但不替代 `src/` 的应用领域逻辑。

## 状态流

```text
unknown / blocked / failed / partial / success / stale
```

任何页面和账本写入都应保留来源、采集时间、覆盖范围、重复同步结果和警告，而不是只保留一组无上下文的数值。
