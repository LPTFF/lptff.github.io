# Agent 资产中心

本目录是项目内 Agent 相关资产的唯一事实来源。产品功能代码、运行时资源和构建配置留在项目目录；规划、规范、上下文、协作方法和本地验证证据统一维护在这里。

## 阅读顺序

1. [项目执行说明](standards/project-instructions.md)：项目事实、命令、边界和验证要求。
2. [Agent 执行标准](standards/agent-execution.md)：任务定义、实施、证据和报告标准。
3. [代码组织标准](standards/code-organization.md)：如何高效组织项目代码与 Agent 资产。
4. [项目上下文](context/project-context.md)：当前已确认事实、决策和未解决问题。
5. [业务能力基线](product/business-overview.md)、[业务规划](product/business-planning.md)和[产品设计标准](product/product-design.md)。
6. [自测与验收手册](verification/playbook.md)：按任务影响选择验证证据。

## 目录职责

- `standards/`：Agent 执行、项目约束和代码组织规范。
- `product/`：业务现状、产品规划、产品设计和外部项目研究。
- `context/`：持久项目事实和可审查迭代记录。
- `verification/`：自测方法；`reports/` 保存被 Git 忽略的本地报告、截图和机器证据。
- `collaboration/`：面向外部开发者的通用方法、脱敏审批和开源反哺模板。
- `tools/`：生成迭代日志、检查上下文和管理验证报告的 Agent 工具。
- `records/`：用户提供的原始恢复记录等非运行时输入。

## 隔离规则

- `src/`、`public/`、运行时直接导入的内容和构建/部署必需配置属于项目功能产物。
- Agent 规范、规划、上下文、过程日志、验证报告和研究资料属于本目录。
- 根 [AGENTS.md](../AGENTS.md)、[CLAUDE.md](../CLAUDE.md)及工具专用配置仅作为自动发现入口，不复制完整规范。
- 同一事实只维护一份 canonical 内容；其他位置使用链接，不复制正文。
- `verification/reports/` 是本地证据目录，不提交；长期有效的结论写回 `context/project-context.md`，过程证据写入 `context/iteration-log.md`。
