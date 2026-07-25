# OpenCode Instructions

Use `CLAUDE.md` as the source of truth for project facts, commands, generated files, search exclusions, and verification.

Use `.claude/project-context.md` when a change affects directories, routes, build behavior, dependencies, generated files, or data flow.

This is a Vue 3 + Vite project. The normal validation command is `npm run build`.

Keep changes scoped to the user's request. Do not modify user-level Claude configuration, memory, `.claude.json`, or global settings. Do not add automatic hooks unless explicitly requested.
