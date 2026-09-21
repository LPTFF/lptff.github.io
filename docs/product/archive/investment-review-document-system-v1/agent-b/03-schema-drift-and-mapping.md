# Schema Drift 与 Mapping

检查字段新增、缺失、重命名、类型变化、空值、枚举变化和分页结构变化。未知字段不得静默映射为已有字段；未知枚举进入 unknown 并回传 Shared。

Mapping 记录字段语义、来源接口、是否必需、脱敏后的样例类型、缺失行为和对 Core 的影响。禁止保存真实值；只保留字段名、类型、是否存在和必要的安全摘要。

如果 Drift 只影响 Adapter，Agent B 修复；如果需要修改协议、Ledger 或页面行为，提交给 Agent A 和 Shared 评估。
