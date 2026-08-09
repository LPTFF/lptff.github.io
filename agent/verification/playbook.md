# 人类验收清单

验证不是为了让工具显示绿色，而是让维护者知道改动是否真的改善了目标结果。具体验证方法应遵循 [`standards/trusted-verification.md`](../standards/trusted-verification.md)；理论来源、适用边界和未知项见 [`theories/software-trusted-verification.md`](../theories/software-trusted-verification.md)。结论必须由与要求匹配的客观证据支持，证据不足时保持未知。

## 项目区与工作台隔离

- 先按实际消费者判断文件归属，不按 `docs/`、`scripts/` 或 `extension/` 名称机械移动。
- `project-support/extension/`、`project-support/scripts/`、`project-support/crawl/` 和 `src/views/investment/investment-assistant.md` 属于项目功能或交付链路；`agent/` 只放维护资料。
- 确认 `src/`、Vite、npm scripts、扩展打包器和 CI 没有 import 或执行 `agent/` 文件。
- 检查 `agent/` 没有生成 ZIP、动态 JSON、凭据、Cookie、登录状态、真实投资数据或原始网络日志。
- 文件迁移后检查 Markdown 相对链接，并运行受影响的构建、采集和扩展验证。

## 真实 Chrome 与浏览器扩展

真实登录态和扩展运行环境是验收对象的一部分。源码检查、隔离 profile 或新开的自动化浏览器不能替代用户实际使用的 Chrome。

### 接管前

- 先确认用户已明确授权本次观察或采集，以及不可触碰的行为边界；投资数据授权不包含购买、卖出、赎回、定投修改或其他交易操作。
- 确认目标是用户现有的 Chrome 窗口、真实 Investment OS origin 和实际登录 profile。用户要求唯一窗口时，操作前后都核对窗口数量与目标句柄；不能附着就报告 `BLOCKED`，不要另开浏览器冒充验收环境。
- 在 `chrome://extensions` 核对扩展 ID、版本和“已解压的扩展程序”加载目录。若加载的是仓库外副本，先比较文件清单与哈希；只有经明确授权才能覆盖外部目录，重载旧副本不能证明仓库改动已生效。

### 观察与操作

1. 先在真实页面复现用户路径，观察页面状态、Console、Network 和 IndexedDB 的脱敏 Oracle，再决定修改位置；不要只凭错误文案直接改代码。
2. 重载实际加载的扩展后，刷新真实 Investment OS origin，实际点击采集和“读取待导入数据”，观察持仓、单基金、交易、下载、导入和确认阶段的持久进度。
3. 核对一次性传输生命周期：staging 是否存在、Ledger import 是否增加、ACK receipt 是否变为 imported、刷新后状态是否仍正确。Ledger 已写入而 ACK 失败时，结论应区分“数据已导入”和“暂存确认失败”。
4. 对分页只记录并比较 `timeType`、`pageNum`、`pageSize`、`totalCount`、`expectedPages`、响应条数、状态码和 warning 分类。只有页集合、每页长度、最后一页余数和总数稳定性都通过 Oracle，Coverage 才能标为 complete。
5. 只输出固定状态、字段名和聚合计数。不得保存、复制或展示密码、Cookie、Token、Authorization、银行卡、原始 Network Log、原始账户 JSON、基金名称与金额明细。

### 下结论

- `PASS`：真实目标环境中的用户路径与对应 Oracle 都通过，并写清本次证据证明的范围。
- `FAIL`：真实路径已执行且 Oracle 明确不满足；保留准确的缺口和影响，不能通过放宽检查或清除 warning 伪装完成。
- `BLOCKED`：无法附着目标 Chrome、缺少用户授权、扩展加载源不明或站点条件不允许验证；说明阻塞条件，不用隔离浏览器、旧 JSON 导入或静态测试替代。
- 每个结论同时写“没有证明什么”。例如构建成功只证明可构建，旧 JSON 导入只证明兼容迁移，隔离窗口只证明隔离环境行为，都不能写成真实扩展闭环通过。

## 开始前

- 哪条现有路径、数据或页面会受到影响？
- 哪些事实已经确认，哪些仍是猜测？
- 哪些行为、数据、隐私或兼容性边界不能悄悄改变？

## 实施后

- 走一遍最重要的真实使用路径，而不是只看源码或静态文件。
- 检查空数据、失败、过期、权限不足和恢复路径等反例。
- 如果涉及数据，确认来源、时间、结构、重复项和实际消费者。
- 如果涉及 UI，检查关键交互、桌面/移动布局、网络和控制台。
- 记录检查证明了什么、没有证明什么，以及剩余风险。

## 做决定

- 结果是否满足人的原始目标，而不只是满足实现指标？
- 失败是代码问题、外部条件、目标不清，还是方案本身不值得继续？
- 下一步是修复、缩小范围、保留现状、继续观察还是停止？
- 只有当这次认识会帮助未来的人，才把它写入 `agent/context/` 或产品资料；不必为每次改动生成日志或报告。

截图、日志、测试和构建都是证据的一部分，但没有哪一种证据天然等于成功。证据不足时，明确写“未知”或“未完成”。
