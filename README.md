# lptff.github.io

这是一个基于 Vue 3 的个人网站，使用 Vite 构建，包含博客、面试/求职资料、生活记录以及基金和加密货币工具页面。

## 技术栈

- Vue 3 + Vue Router 4
- Vite 5.4.21
- JavaScript + TypeScript
- Element Plus
- Markdown 内容编译与渲染
- npm 管理依赖

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

当前生产依赖审计为 0 个漏洞。完整依赖树仍可能报告 Vite 5 构建链中的开发依赖告警；Vite 6+ 升级、Node 版本基线和相关插件兼容性需要单独规划。不要直接运行 `npm audit fix --force`。

## 项目维护文档

- [AGENTS.md](AGENTS.md)：可复用的 Agent 工作流和项目协作规则
- [CLAUDE.md](CLAUDE.md)：项目命令、目录事实和验证规则
- [.claude/project-context.md](.claude/project-context.md)：当前项目事实和未解决决策
- [.claude/iteration-log.md](.claude/iteration-log.md)：项目迭代记录
