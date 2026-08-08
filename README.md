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

启动开发服务器（端口 8090）：

```bash
npm run serve
```

预览构建结果：

```bash
npm run preview
```

## 本地开发数据服务

本地开发时，Vite 严格固定在 `8090` 端口运行，并将页面使用的 `/data` 请求代理到家庭服务器 `http://192.168.1.100:5000`；如果 `8090` 已被占用，Vite 会直接启动失败，不会自动顺延到其他端口。`npm run preview` 不继承该开发代理，而是直接读取 `dist/data/`，用于验证生产构建中的静态数据。基金持仓数据的远程文件为 `/root/Test/data/fundHoldData.json`，页面代码保持使用 `/data/fundHoldData.json` 相对路径，不直接硬编码远程地址。

如需通过 SSH 检查该服务器，可连接 `root@192.168.1.100:22`；密码不写入仓库。完整的本地开发、远程数据服务、SSH 运维边界和排查步骤见 [开发环境与远程数据服务](agent/docs/development-environment.md)。

## 构建

```bash
npm run build
```

构建命令会依次：

1. 从 `src/views/home/findJob/` 同步面试摘要到 `project-support/public/findJob-summary/`；
2. 运行 `vue-tsc --noEmit` 类型检查；
3. 执行 Vite 生产构建；
4. 生成 `dist/404.html`。

## 公共数据采集验证

项目提供一套本地与 GitHub Actions 共用的 Node.js 公共数据采集实现。先用离线 fixture 验证采集边界：

```bash
npm run test:collectors
npm run collect:rss:fixture
```

离线 fixture 命令会验证 RSS/Atom 解析、域名和 HTTPS 边界、数据结构、非空/大小限制及失败不覆盖，并把候选结果写入被 Git 忽略的 `.artifacts/`。离线验证通过后，还必须执行真实数据和浏览器闭环：

```bash
npm run verify:rss:local
```

该命令依次运行 collector 测试、访问白名单真实 RSS 来源、通过与 CI 共用的 `collect:rss:site` 生成 `project-support/public/data/recommendArticleData.json`、执行生产构建，再用 `vite preview` 打开项目已有的资讯页面 `http://localhost:4173/newsArticle`。页面请求 `/data/recommendArticleData.json`；维护者需确认生成时间、来源和文章列表正常，JSON 网络请求为 200、控制台无错误。原始 RSS 没有 AI 阅读评分和推荐理由，页面不会伪造这些字段。只运行 fixture、直接打开 JSON 或新增平行验证页面不能视为现有业务功能闭环。验证结束后按 `Ctrl+C` 停止预览，并删除本地生成的 `project-support/public/data/recommendArticleData.json`，避免将动态数据误提交。

正式 `.github/workflows/ci.yml` 在 `master` push、手动触发和每日北京时间 06:17 的定时触发下自动运行同一组 collector 测试与 `collect:rss:site`，随后执行原有 Python crawl、生产构建和 Pages 发布。采集器会独立处理白名单来源：单个来源临时失败时记录警告并使用其余成功来源；全部来源失败、最终数据为空或校验不通过时停止本次发布，避免上线缺失或无效 JSON。构建后还会校验 `project-support/public/data/recommendArticleData.json` 已原样进入 `dist/data/recommendArticleData.json`，然后才执行现有部署。

本地动态 JSON 不随源码提交；CI 每次在 Runner 工作区重新生成。线上第一次自动运行仍需在 Actions 和 Pages 中核验，因为本地网络与 GitHub Runner 网络并不等价。参考项目的能力分类与禁用边界见 [qinglongBackup 数据能力评估](agent/product/research/qinglong-backup-assessment.md)。

## 拼写检查

仓库根目录的 `.cspell.json` 为编辑器和 cSpell CLI 提供统一的全局拼写检查配置：

- 默认检查仓库内所有受 Git 管理的文本文件，并遵循 `.gitignore`；
- 排除 `node_modules/`、`dist/`、大型数据快照、发布图片、依赖锁文件和自动生成声明等非业务文本；
- 项目专有词、技术术语、爬虫字段和已有内容中的专有名词统一维护在 `words` 中；
- 全局复核可使用 `npx --yes cspell@8.17.5 --no-progress --no-summary .`，无需将 cSpell 固定为生产依赖。

扫描配置只消除已确认的专有词误报，不会自动修改疑似拼写错误；发现疑似错误时，应另行确认后修正源码或内容。

## 目录说明

- `src/views/`：页面组件
- `src/views/Blog/articles/`：博客文章 Markdown 内容
- `src/views/home/findJob/`：求职页面使用的面试资料 Markdown 和加载逻辑
- `src/views/investment/`：投资页面及其运行时协议文档
- `src/utils/`：共享工具，包括 Excel 导出适配器
- `src/assets/`：页面打包图片等应用资源
- `project-support/public/`：Vite 静态发布资源
- `src/data/`：页面打包的数据快照
- `project-support/scripts/`：产品摘要同步、数据采集和构建辅助脚本
- `project-support/crawl/`：Python 数据采集和 CI 发布链路
- `project-support/extension/`：Chrome 投资助手运行功能
- `project-support/deploy/`：手工部署工具
- `agent/`：维护者的项目工作台，记录业务规划、产品设计、项目事实、研究材料和有长期价值的验收经验
- `agent/product/prd/`：Investment OS PRD 原文归档、拆解和需求追踪
- `agent/docs/`：没有运行时消费者的维护文档

## 部署

GitHub Pages 使用根目录 `CNAME` 声明自定义域名 `lptff.github.io`；该文件是发布配置，不是页面业务源码。

仓库还保留一个位于 `project-support/deploy/uploadQL.js` 的 SFTP 手动部署路径。除非明确进行部署工作，否则不要运行 `project-support/build.sh` 或 `project-support/deploy/uploadQL.js`。

## 依赖安全

依赖审计需要使用官方 npm registry：

```bash
npm audit --registry=https://registry.npmjs.org
```

当前完整依赖树和生产依赖审计均为 0 个漏洞。开发服务器当前监听 `0.0.0.0:8090` 并启用 CORS，`/data` 请求代理到家庭服务器；详见[开发环境与远程数据服务](agent/docs/development-environment.md)。不要直接运行 `npm audit fix --force`。

## Agent 资产

项目功能代码与维护者资料分开维护。`agent/` 是帮助人理解项目、做产品取舍和复盘结果的工作台，不要求固定阅读顺序或治理命令，入口见 [agent/README.md](agent/README.md)。

根 [AGENTS.md](AGENTS.md) 与 [CLAUDE.md](CLAUDE.md) 只用于宿主发现，项目资料不在根文件重复维护。
