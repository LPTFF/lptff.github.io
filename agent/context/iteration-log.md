# 迭代复盘

这里保留对未来维护者仍有帮助的决策和经验，不要求每次改动都添加记录。历史记录中的旧目录和工具名称只代表当时的工作环境，不是当前项目要求。

## 2026-08-07 — Agent 资料转为人的工作台

- 触发：原有 `agent/` 内容逐渐变成强制阅读顺序、固定生命周期、机器检查和 Agent 管理模板，让人为了工具维护格式。
- 决定：删除外部 Agent 协作模板、治理脚本、验证报告索引和恢复记录；保留项目事实、产品判断、研究资料和简短验收建议。
- 原则：人定义问题和取舍，Agent 只加速搜索、比较、起草和可逆验证；所有流程都是可选建议，不能成为人的工作门槛。
- 结果：`agent/README.md`、`standards/`、`context/project-context.md` 和 `verification/playbook.md` 已改成人可直接使用的资料；业务代码和现有扩展改动未纳入本轮。
- 未完成：尚未重新运行完整项目构建和业务页面浏览器验收；这些只在对应代码改动确实需要时执行。

## 2026-08-08 — 天天基金接口优先采集插件

- 目标：让用户登录后点击一次即可自动导出持仓、单基金详情和当前/历史交易数据，减少手工打开页面和页面展示字段造成的数据损失。
- 方案：扩展让真实的天天基金页面使用已有登录会话发起业务请求，由 MAIN world bridge 捕获 `/request/hold`、`/http/single/get` 和 `DelegateList` 的成功响应；后台不复制认证头、不读取 Cookie、不直接重发交易接口。
- 数据覆盖：持仓名称、金额、收益和收益率来自持仓接口；单基金分别保存 `fene`、`yingkui`、`dingtou` 的接口结果；交易按实际加载的当前/历史范围和分页收集，并按业务标识去重。
- 自动化：单基金详情采用最多 4 路受控并发；当前交易与历史交易使用独立页面并行，同一页面内分页保持串行；任务结束关闭扩展创建的临时标签页。
- 关键取舍：删除单基金页面名称选择器、页面正文收益解析和交易表格 DOM 降级。自动流程把持仓接口中的 `fundName` 传给详情页；手动详情入口缺少名称时也通过持仓接口按代码补齐。
- 安全边界：不申请 `cookies` 权限，不读取或保存 `document.cookie`、Authorization、access-token、session、password、secret；原始快照递归脱敏，未实际加载的历史范围和分页不伪造。
- 验证：用户已在本地浏览器验证插件可用；随后通过脚本语法检查、`npm run typecheck`、`git diff --check` 和扩展 zip 构建检查，未把静态检查误报成真实端到端验证。
- 产物：协议升级为 1.1，保留标准字段、详情数据、交易数据、脱敏接口快照和采集警告；扩展支持本地实时打包下载，生成 `lptff-investment-assistant.zip`。

## 2026-08-09 — Investment OS 本地账本与真实 Chrome 诊断

- 触发：Investment OS 初次进入会写入 Mock，扩展明明已采集却显示无响应，导入过程和 staging 清理状态不可见；真实数据导入后又暴露当前持仓浮盈、cash、风险元数据、规则可理解性和交易分页覆盖问题。
- 产品闭环：删除生产 Mock 入口，补齐“下载扩展 → 安装登录 → 采集 → staging → Ledger 导入 → ACK”的引导与持久状态；增加重新采集、重新读取、清除投资事实和完全清空。清除事实必须保留 Policies/PolicyVersions，避免用户为了重录来源数据丢失规则。
- 同步语义：Chrome API 方法必须保留所属对象调用，否则会触发 `StorageArea Illegal invocation`；Ledger 成功写入后 ACK 失败只影响 staging receipt，不能把已经持久化的数据回滚或把整次导入标成失败；Coverage warning 与同步 failure 也必须分开呈现。
- 事实边界：当前持仓浮盈由同批、全部已知的逐只持仓盈亏汇总，历史累计盈亏不能代替；cash 只按同批 `totalAsset - holdingValue` 且通过容差时派生。任一关键事实不足就保留 unknown 并给出补齐影响，不能静默填 0。
- 风险语义：基金指数、地区、资产类型、币种和主题没有可靠来源时保持 unknown。AssetMetadata 用 `source / classified / unknown` provenance 并按质量合并；Exposure 将 known/unknown 覆盖分开，未知不进入普通风险桶。规则只能使用当前已识别的暴露值，展示中文维度和当前比例；没有可用标签时先禁用创建，而不是让用户手输内部枚举。
- 诊断方法：真实登录态问题必须先观察用户现有且明确授权的 Chrome，再改代码。隔离自动化窗口不能代表真实 profile；无法附着就报告 BLOCKED。此次关键根因之一是 Chrome 实际加载了仓库外的解压副本，导致只修改仓库再点“重新加载”仍运行旧代码；同步前后以清单与哈希核对，最终保持仓库源码和加载副本一致。
- 隐私边界：只观察和报告固定布尔值、字段名、聚合计数、分页元数据和 warning 分类；不保存或展示认证头、Cookie、Token、银行卡、原始响应、账户 JSON、基金名称或金额明细。授权采集不等于授权交易，禁止购买、卖出、赎回或修改定投。
- 验证结果：持仓、单基金详情、staging、Ledger、ACK、持久进度、重采集和清理路径已有真实页面或静态证据支持；类型检查、构建、扩展脚本语法、zip 构建和 diff 检查通过。风险页面不再把未知展示为“未标注 100%”，低质量元数据不会覆盖高质量数据。
- 未完成：真实交易 timeType 3/4 均只确认第 1 页；`pageSize=20`，期望页数分别为 84 和 60，失败仍归类为 `page_response_missing` 和 `paging_incomplete`。即使复用非敏感请求头、真实 Content-Type、JSON/表单 body 并等待快照写入，后续页仍未成功，因此 Coverage 必须保持 `partial`。下一次应在真实 Network 中比较“页面成功请求”和“扩展委托请求”的非敏感结构差异，不能放宽完整性 Oracle 来消除 warning。
- 下次快速开始：先确认唯一目标 Chrome、真实 Investment OS origin、扩展 ID/加载目录和源码哈希；再核对 collection progress、staging、Ledger import 与 receipt；然后按 timeType 检查 `pageNum/pageSize/totalCount/expectedPages` 和实际页集合；只有获得这些观察证据后才定位 bridge、collector 或 adapter。

## 使用方式

遇到新问题时，只记录能改变未来判断的事实、取舍、结果和未知。不要为了保持文档整齐而记录每个命令、每个 Agent 动作或每次局部编辑。
