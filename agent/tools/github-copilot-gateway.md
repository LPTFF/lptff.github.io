# GitHub Copilot 接入 Claude Code

本项目支持通过本机 `copilot-gateway` 将 Claude Code 的请求转发到 GitHub Copilot。该配置用于个人开发环境，不属于网站运行时配置。

## 请求链路

```text
Claude Code
    │ ANTHROPIC_BASE_URL=http://localhost:4141
    ▼
本机 copilot-gateway
    │ GitHub Copilot 凭据
    ▼
GitHub Copilot 模型服务
```

## 启动方式

在使用 Claude Code 前，先在单独的终端启动 gateway：

```bash
npx copilot-gateway@latest start --claude-code
```

gateway 默认监听 `http://localhost:4141`。如果该进程没有运行，Claude Code 的模型请求会失败；这不影响网站本身的本地开发服务，网站仍使用 `npm run serve` 在 8090 端口启动。

## 本项目的配置位置

实际个人配置放在项目内的 `.claude/settings.local.json`。该文件匹配仓库的 `*.local` 忽略规则，不会提交到 Git；这样可以让当前项目持续复用本机 gateway，同时避免把个人环境配置误作为团队或线上配置。

当前配置的模型映射如下：

| Claude Code 角色 | gateway 模型 | 显示名称 |
| --- | --- | --- |
| Fable | `gpt-5.5` | GPT-5.5 |
| Haiku | `gpt-5.6-luna` | GPT-5.6 Luna |
| Opus | `gpt-5.3-codex` | GPT-5.3-Codex |
| Sonnet | `gpt-5.6-terra` | GPT-5.6 Terra |
| 子 Agent | `gpt-5.4-mini` | — |

项目默认选择 `haiku`，因此当前主会话默认使用 `gpt-5.6-luna` 的映射。

## 凭据边界

- `ANTHROPIC_AUTH_TOKEN=sk-dummy` 只是 gateway 兼容 Claude Code 请求格式所需的占位值，不是 GitHub Copilot 凭据。
- 不要把真实 GitHub、Copilot、gateway 或 Claude 凭据写入仓库、`CLAUDE.md`、项目上下文、迭代日志或命令示例。
- 如果 gateway 的认证方式发生变化，只更新本机的 `.claude/settings.local.json` 或 gateway 自己的凭据存储，不要改网站源码。
- `.claude/settings.json` 是可提交的项目级设置，本项目不把个人 gateway 地址和模型映射放入其中，以免影响其他开发者。

## 排查顺序

1. 确认 Node.js/npm 可用。
2. 启动 `npx copilot-gateway@latest start --claude-code`。
3. 再启动 Claude Code，并在本项目目录工作。
4. 如果模型请求失败，先检查 `localhost:4141` 的 gateway 进程和认证状态，再检查 `.claude/settings.local.json` 是否仍包含 `env` 和 `model` 配置。
5. 网站开发服务问题单独检查 `npm run serve` 和 `http://localhost:8090`，不要将网站端口 8090 与 gateway 端口 4141 混淆。

## 来源

- [GitHub Copilot 接入 Claude Code 教程](https://github.com/feiskyer/claude-code-settings/blob/main/guidances/github-copilot.md)
