# 仓库结构与交付边界

本仓库区分产品源码、发布所需支持文件、可部署公开数据和本地验证材料。新增目录或根文件前先确定消费者与生命周期，再运行 `npm run repo:check`。

## 顶层职责

| 目录 | 职责 | 是否进入 Git |
| --- | --- | --- |
| `src/` | Vue 应用、领域逻辑、可维护的数据模型和站内资源 | 是 |
| `public/` | 浏览器按 URL 读取、无需打包进 JS 的公开静态资源 | 是，必须确认可公开 |
| `data/snapshots/` | 产品功能需要的脱敏、可复现输入，不是测试夹具 | 是 |
| `extension/` | 浏览器扩展源码；构建出的 ZIP 不进入 Git | 是源码，不含构建包 |
| `scripts/` | 构建、校验、扩展打包与手工部署脚本 | 是 |
| `config/` | 构建工具使用的配置模块 | 是 |
| `contracts/` | 与私有后端共享的稳定接口契约 | 是 |
| `docs/` | 项目标准、长期事实和维护说明 | 是 |
| `.local/`、`.artifacts/`、`artifacts/` | 临时截图、报告、浏览器证据和本地验证材料 | 否 |
| `dist/`、`dist-extension/`、缓存与临时工作树 | CI 或本机可重建产物 | 否 |

## 依赖与数据方向

```text
data/snapshots/ ──构建输入──> src/ ──Vite──> dist/
public/ ─────────────────────────浏览器 URL───────────┘
extension/ ──scripts/extension/build-zip.js──> dist-extension/
docs/ ──只描述和约束，不参与浏览器运行
```

- `src/` 不得读取 `.local/`、报告目录、开发机绝对路径或临时工作树。
- `public/` 中的内容会原样发布；凭据、私有采集包和未脱敏数据不得放入其中。
- 页面需要的大型映射数据优先放在 `public/data/` 并按功能按需请求，避免进入首屏 JS。
- `data/snapshots/` 只接收有产品消费者的脱敏快照；测试替身留在 `.local/verification/`。
- 长期验收事实维护在 `docs/verification/real-validation-state.md`；可生成 HTML、截图和原始运行结果留在 `.local/verification/`。
- 新增顶层入口必须同步更新本文件和仓库治理脚本。

## 提交门禁

`npm run repo:check` 直接检查 Git 索引，会阻断未登记顶层入口，以及缓存、日志、数据库、真实环境文件、密钥、截图/报告目录、临时构建和压缩包。本地 pre-commit 与 GitHub Actions 使用同一规则；忽略规则只负责减少误操作，不能替代门禁。

整理尚未暂存的工作区时可运行 `npm run repo:check -- --working-tree`，同时审查未忽略的新文件并排除已经删除的旧路径；最终提交仍以默认的 Git 索引检查为准。

图片、公开 JSON 和生成声明文件可能是合法产品文件，不能只按扩展名删除；它们必须位于明确目录，并能说明页面消费者、公开边界和更新方式。
