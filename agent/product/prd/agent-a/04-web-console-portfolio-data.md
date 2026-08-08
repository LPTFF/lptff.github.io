# Web：Console、Portfolio、Data

页面按 Core 查询展示：当前组合、来源状态、Coverage、最近同步、交易、每日盈亏和 warning。空数据、过期数据、部分数据、失败和权限不足都必须有明确状态。

页面不直接 fetch Eastmoney 业务接口，不读取 Cookie/Token，不把 Raw Snapshot 作为用户内容。所有交互应能由 Mock Adapter 驱动并在移动端保持可读。
