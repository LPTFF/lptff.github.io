# OpenCode 使用说明

- 先读取根目录 `AGENTS.md` 和 `CLAUDE.md` 的发现入口。
- 完整项目规则以 `agent/standards/project-instructions.md`、`agent/standards/agent-execution.md` 和 `agent/context/project-context.md` 为唯一来源。
- 这是一个 Vue 3 + Vite 项目。常规验证命令为 `npm run build`。
- 变更范围应限定在用户请求内。不要修改用户级 Claude 配置、记忆、`.claude.json` 或全局设置；除非用户明确要求，否则不要添加自动钩子。
