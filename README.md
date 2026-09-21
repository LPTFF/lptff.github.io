# lptff.github.io

这是一个基于 Vue 3 的个人网站，使用 Vite 构建，包含博客、职业资产归档、生活记录以及基金和加密货币决策工具。职业方向以浏览器插件接触真实市场需求，博客负责保存长期知识和历史产品演进。

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
- 职业决策方向、面试知识树和项目证据的博客归档
- 基金分析和加密货币页面
- 基金、对冲基金和加密货币持仓数据导出为 `.xlsx`

Excel 导出使用浏览器端 `write-excel-file`，仅在用户执行导出时加载，并保留为独立的 `xlsx-export` 构建分块；项目不解析用户上传的 Excel 文件。

## 本地开发

安装依赖：

```bash
npm install
```

Live2D 模型包已纳入 devDependencies 和锁文件。开发服务器由 Vite 直接从已安装的 `node_modules` 提供模型，生产构建由同一 Vite 插件写入 `dist/live2dw/models/`；不维护 `public` 缓存，也没有安装后或启动前脚本。导航图标直接使用目标站点的官方 favicon 或官方 CDN，加载失败时显示首字符色块，不参与资源准备。

启动开发服务器（端口 8090）：

```bash
npm run serve
```

预览构建结果：

```bash
npm run preview
```

## 构建

```bash
npm run repo:check
npm run build
```

本地 `build` 只执行 Vite 生产构建；面试 Markdown、投资脱敏快照和 Live2D 模型均由 Vite 从唯一来源生成构建资源，不做启动前复制。GitHub Pages 的 `404.html` 继续由原有 CI 步骤生成。

## 公共数据采集与验收

公开来源采集、AI 分类与数据发布由私有 qinglongBackup 仓库的青龙任务维护；本站只消费 python-crawl 分支的公开 JSON。旧 Python/RSS 采集源码已迁入该仓库 research/legacy-site-collectors，本站不再保留定时采集工作流。浏览器授权采集扩展继续保留。研究书签是站主通过 GitHub Issues 维护的公开内容同步，不执行外部站点爬取。

## 拼写检查

仓库根目录的 `.cspell.json` 为编辑器和 cSpell CLI 提供统一的全局拼写检查配置：

- 默认检查仓库内所有受 Git 管理的文本文件，并遵循 `.gitignore`；
- 排除 `node_modules/`、`dist/`、大型数据快照、发布图片、依赖锁文件和自动生成声明等非业务文本；
- 项目专有词、技术术语、爬虫字段和已有内容中的专有名词统一维护在 `words` 中；
- 全局复核可使用 `npx --yes cspell@8.17.5 --no-progress --no-summary .`，无需将 cSpell 固定为生产依赖。

扫描配置只消除已确认的专有词误报，不会自动修改疑似拼写错误；发现疑似错误时，应另行确认后修正源码或内容。

## 目录说明

根目录只保留七类正式内容：

- `src/`：Vue 网站源码，页面、组件、领域逻辑和站内数据都在这里。
- `extension/`：Chrome 本地助手源码；生成的 ZIP 不进入 Git。
- `public/`：会原样发布的公开静态资源。
- `data/snapshots/`：产品需要的脱敏、可复现输入。
- `scripts/`：构建、检查、打包和手工部署脚本。
- `config/`、`contracts/`：构建配置与跨仓库接口契约。
- `docs/`：产品说明、项目事实、标准和长期验收记录。

依赖、构建结果、截图、报告、参考仓库和临时采集结果都属于本机内容，统一忽略或收进 `.local/`，不作为远程仓库产物。

完整的目录职责、生成物例外和禁止提交范围见 [仓库结构与交付边界](docs/standards/repository-structure.md)。`npm run repo:check` 会检查 Git 索引中的未登记顶层入口、缓存、日志、数据库、真实环境文件、截图/报告和构建包；首次使用可运行 `npm run hooks:install` 启用本地提交门禁。

## 部署

GitHub Pages 使用根目录 `CNAME` 声明自定义域名 `lptff.github.io`；该文件是发布配置，不是页面业务源码。

仓库还保留一个位于 `scripts/deploy/uploadQL.js` 的 SFTP 手动部署路径；仅在明确部署任务中使用。公开数据更新由青龙定期触发 master 上的 Pages 工作流。

## 依赖安全

依赖审计需要使用官方 npm registry：

```bash
npm audit --registry=https://registry.npmjs.org
```

当前完整依赖树和生产依赖审计均为 0 个漏洞。开发服务器当前监听 `0.0.0.0:8090` 并启用 CORS。不要直接运行 `npm audit fix --force`。

## Agent 资产

项目功能代码与维护者资料分开维护。`docs/` 是帮助人理解项目、做产品取舍和复盘结果的工作台，不要求固定阅读顺序或治理命令，入口见 [docs/README.md](docs/README.md)。

根 [AGENTS.md](AGENTS.md) 与 [CLAUDE.md](CLAUDE.md) 只用于宿主发现，项目资料不在根文件重复维护。
