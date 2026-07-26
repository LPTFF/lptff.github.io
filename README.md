# lptff.github.io

这是一个基于 Vue 3 的个人网站，使用 Vite 构建，包含博客、面试/求职资料、生活记录以及基金和加密货币工具页面。

## 技术栈

- Vue 3 + Vue Router 4
- Vite 6.4.3
- JavaScript + TypeScript
- Element Plus
- Markdown 内容编译与渲染
- npm 管理依赖

## UI 设计约定

项目已采用 Element Plus 作为基础组件库。为降低页面设计和实现成本、保持不同功能页的一致性，后续新增或重构页面默认遵循 Element Plus 的设计语言和组件体系：

- 优先使用 Element Plus 的现有组件、布局、主题变量和交互模式；
- 页面结构优先采用 `el-container`、`el-header`、`el-main`、`el-footer`、`el-row`、`el-col`、`el-card`、`el-table`、`el-form`、`el-tabs`、`el-dialog` 等组件组合；
- 按钮、表单、反馈、加载、分页、筛选、弹窗和表格等交互优先复用 Element Plus，不重复设计同类基础控件；
- 局部 CSS 只用于业务布局、内容适配和必要的品牌调整，不覆盖或另起一套与 Element Plus 冲突的视觉体系；
- 新页面应优先参考 Element Plus 官方组件语义和当前项目已有页面，保证快速搭建、可维护性和响应式一致性；
- 如确需偏离 Element Plus 风格，应在任务说明或迭代记录中明确原因和影响范围。

## 主要功能

- 首页及个人信息展示
- 博客文章、归档、搜索和旧地址重定向
- 面试/求职资料和 Markdown 内容
- 基金分析和加密货币页面
- 基金、对冲基金和加密货币持仓数据导出为 `.xlsx`

Excel 导出使用浏览器端 `write-excel-file`，仅在用户执行导出时加载，并保留为独立的 `xlsx-export` 构建分块；项目不解析用户上传的 Excel 文件。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器（端口 8080）：

```bash
npm run serve
```

预览构建结果：

```bash
npm run preview
```

## 构建

```bash
npm run build
```

构建命令会依次：

1. 从 `src/content/interview/` 同步面试摘要到 `public/findJob-summary/`；
2. 运行 `vue-tsc --noEmit` 类型检查；
3. 执行 Vite 生产构建；
4. 生成 `dist/404.html`。

## 拼写检查

仓库根目录的 `.cspell.json` 为编辑器和 cSpell CLI 提供统一的全局拼写检查配置：

- 默认检查仓库内所有受 Git 管理的文本文件，并遵循 `.gitignore`；
- 排除 `node_modules/`、`dist/`、大型数据快照、发布图片、依赖锁文件和自动生成声明等非业务文本；
- 项目专有词、技术术语、爬虫字段和已有内容中的专有名词统一维护在 `words` 中；
- 全局复核可使用 `npx --yes cspell@8.17.5 --no-progress --no-summary .`，无需将 cSpell 固定为生产依赖。

扫描配置只消除已确认的专有词误报，不会自动修改疑似拼写错误；发现疑似错误时，应另行确认后修正源码或内容。

## 目录说明

- `src/views/`：页面组件
- `src/content/blog/`：博客 Markdown 内容
- `src/content/interview/`：面试/求职 Markdown 内容
- `src/utils/`：共享工具，包括 Excel 导出适配器
- `public/`：静态资源和运行时资源
- `src/public/data/`：较大的数据快照
- `scripts/`：摘要同步和构建辅助脚本

## 部署

GitHub Actions 会构建站点，并将 `dist/` 发布到 `gh-pages` 分支。

仓库还保留一个独立的 `uploadQL.js` SFTP 手动部署路径。除非明确进行部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 依赖安全

依赖审计需要使用官方 npm registry：

```bash
npm audit --registry=https://registry.npmjs.org
```

当前完整依赖树和生产依赖审计均为 0 个漏洞。开发服务器默认仅监听本机且不启用全来源 CORS。不要直接运行 `npm audit fix --force`。

## 项目维护文档

- [业务功能说明](docs/business-function-overview.md)：按用户入口、业务域和典型流程说明当前功能边界
- [业务演进规划](docs/business-evolution-plan.md)：记录产品假设、阶段路线、指标和后续实施清单
- [AGENTS.md](AGENTS.md)：可复用的 Agent 工作流和项目协作规则
- [CLAUDE.md](CLAUDE.md)：项目命令、目录事实和验证规则
- [.claude/project-context.md](.claude/project-context.md)：当前项目事实和未解决决策
- [.claude/iteration-log.md](.claude/iteration-log.md)：项目迭代记录
