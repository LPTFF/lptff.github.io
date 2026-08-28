# agent/：项目维护工作台

`agent/` 只保存能帮助后续维护者快速理解项目、做产品判断和完成验证的资料。它不是运行时代码目录，也不是一套让执行者先证明“为什么不能做”的流程系统。

## 默认执行方式

1. 先读当前任务直接相关的代码、Git 变更和一份对应说明，不遍历整套文档。
2. 把用户目标拆成可观察结果；优先保留现有有效能力，只有用户明确要求或证据证明无价值时才删除。
3. 先复现，再修改，再在同一目标环境重测；失败就记录实际差异并继续修复。
4. 只保留让产物能够加载所需的静态检查和构建；功能结论直接来自目标环境的真实结果。
5. 工具不可用时先寻找同等可信的执行路径、修复执行环境或迁移测试执行层。只有所有合法路径都已证实不可用时，才报告硬阻塞。

## 按任务找资料

- 项目现状：[`context/project-context.md`](context/project-context.md)
- 文件归属：[`context/project-file-boundaries.md`](context/project-file-boundaries.md)
- 产品方向：[`product/README.md`](product/README.md)
- Investment Review：[`product/investment-review.md`](product/investment-review.md)
- 开发环境：[`docs/development-environment.md`](docs/development-environment.md)
- 通用验证：[`verification/playbook.md`](verification/playbook.md)
- BOSS 直聘扩展：[`verification/boss-extension-real-validation.md`](verification/boss-extension-real-validation.md)
- 代码组织：[`standards/code-organization.md`](standards/code-organization.md)
- 产品设计：[`standards/product-design.md`](standards/product-design.md)
- 外部项目研究：[`product/research/`](product/research/)

不要求按固定顺序阅读，也不要求简单任务套模板。`archive/` 只用于追溯旧决策，不能覆盖当前代码和当前产品说明。

## BOSS 扩展的产品边界

核心能力包括岗位获取、原生筛选、自动处理、进度与日志、AI 筛选/招呼、地址分析、聊天和失败恢复。审查这些能力时，默认方向是修复或改进，不是因为权限、网络或实现复杂就整项删除。

当前明确精简的是“关于/赞赏”“反馈”“帮助模式”三个非核心入口。不要把这项产品决定扩大解释为删除 AI、地址、聊天、通知、外观配置或自动投递链路。

真实 BOSS 验收使用普通 Windows Chrome 和 OS 级桌面截图、鼠标、键盘；不使用会改变站点运行环境的 CDP/WebDriver 控制链路。正确步骤和失败后的替代路径见 BOSS 专用手册。

## 目录卫生

- `src/` 和 `project-support/` 保存产品代码、构建脚本与交付物。
- `agent/` 保存说明、研究结论、长期记录和只读参考源码。
- 外部参考仓库可保留固定提交和许可证，但不要保留可重新安装的 `node_modules`、测试产物、截图、登录态、凭据或原始网络日志。
- `agent/references/` 是本地比对材料，不是项目运行依赖；生产代码不得从这里导入。
- 对外部副作用、提交和推送保持人工审核卡点；普通可逆的本地分析、修复和验证应主动完成。

好的交接只需要写清楚：目标、现状、已证实事实、失败点、修复、验证结果和下一步。删除过时内容通常比继续叠加新规则更有价值。
