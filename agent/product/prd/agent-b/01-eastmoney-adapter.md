# Eastmoney Adapter

Adapter 按来源页面和业务接口分层：持仓、单基金详情、当前交易、历史交易分别记录 endpoint、字段 mapping、分页条件、成功判定和失败状态。

页面 DOM 只用于触发筛选和分页；业务字段来自页面真实发出的业务接口响应。输出给 Core 前必须转为 Shared 协议，不能把站点字段、selector 或原始响应泄漏到页面层。

每次变更限定为一个接口、一个场景、一个验证目标，并记录对 Shared 协议和 Agent A fixture 的影响。
