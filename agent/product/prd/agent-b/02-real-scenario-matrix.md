# 真实场景矩阵

| 场景 | 观察目标 | 结果必须包含 |
| --- | --- | --- |
| 正常登录 | 接口成功和字段完整 | PASS/FAIL、Coverage、缺失字段 |
| 未登录或失效 | 权限状态识别 | BLOCKED 或 FAIL、Required change |
| 空持仓/空交易 | 空结果不是失败 | PASS、空状态和 Coverage |
| 接口失败/超时 | 保留旧结果和错误分类 | FAIL、未知状态、恢复建议 |
| 分页/历史范围 | 实际加载边界 | Coverage、未加载范围 |
| 重复同步 | 稳定键和幂等性 | 重复项结论、Agent A 依赖 |
| 字段缺失/变化 | Schema Drift | 缺失字段、未知状态、mapping 变更 |
