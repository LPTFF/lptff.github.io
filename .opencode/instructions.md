# OpenCode 使用说明

- 以 `CLAUDE.md` 作为项目事实、命令、生成文件、搜索排除项和验证规则的唯一来源。
- 当变更影响目录、路由、构建行为、依赖、生成文件或数据流时，使用 `.claude/project-context.md`。
- 这是一个 Vue 3 + Vite 项目。常规验证命令为 `npm run build`。
- 变更范围应限定在用户请求内。不要修改用户级 Claude 配置、记忆、`.claude.json` 或全局设置；除非用户明确要求，否则不要添加自动钩子。
