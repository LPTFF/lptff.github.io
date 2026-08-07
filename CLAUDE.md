# Claude Code 项目入口

本项目的完整 Agent 资产统一维护在 [agent/](agent/README.md)。执行任何任务前必须读取并遵循：

- [项目执行说明](agent/standards/project-instructions.md)
- [Agent 执行标准](agent/standards/agent-execution.md)
- [当前项目上下文](agent/context/project-context.md)

涉及产品、代码组织或复杂验收时，再读取：

- [产品设计标准](agent/product/product-design.md)
- [代码组织标准](agent/standards/code-organization.md)
- [自测与验收手册](agent/verification/playbook.md)

根目录只保留此自动发现入口；不得在此复制 canonical 规范。工具配置仍留在 `.claude/`，个人 `settings.local.json` 不提交。
