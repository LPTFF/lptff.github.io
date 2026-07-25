# 项目上下文

这是当前项目事实和决策的持久化来源。在进行广泛探索之前先阅读本文档。除非任务改变了相关区域或仓库与之矛盾，否则相信已记录的事实；只验证受影响的那些事实，而不是重新发现整个项目。

## 当前架构

- 技术栈：Vue 3、Vue Router 4、Vite 6.4.3、JavaScript 和 TypeScript；npm 管理依赖。
- UI 设计约定：Element Plus 是项目的基础组件库；后续新增或重构页面默认遵循 Element Plus 设计语言、主题变量、布局和交互模式，优先复用组件与现有页面模式，仅以少量业务 CSS 完成布局和品牌调整；确需偏离时记录原因和影响范围。
- 入口流程：`index.html` → `src/main.js` → `src/App.vue` → `src/router/index.js`。
- 页面位于 `src/views/`；主要路由分组为首页、博客、求职/生活、登录、留言/理财工具，以及通过导航专区进入的独立功能页。
- 业务功能说明统一维护在 `docs/business-function-overview.md`，按用户入口、业务域、典型流程和当前业务边界描述现有能力；该文档不作为未来规划或技术设计文档。
- 首页顶部保留热门资讯、吾爱破解、导航专区、Boss直聘、豆瓣电影；PC 默认选中导航专区，移动端默认选中热门资讯。首页菜单使用稳定 key 配置，滚动位置按功能 key 缓存。
- 独立功能页包括 `/welfare`、`/advanced-search`、`/tech-forum`、`/github-trending`、`/leetcode`、`/interview`，共享 `src/views/home/StandaloneFeatureLayout.vue`，入口位于导航专区 `InternalWebsite` 分类；共享布局沿用首页的白色背景、1200px 内容宽度、固定顶部品牌区和移动端紧凑间距。
- 首页列表组件的 location prop 仅用于首页内部滚动增量；薅羊毛、技术论坛、GitHub Trending 独立路由未传 prop 时展示完整数据快照。
- 博客路由嵌套在 `/blog` 下；旧版归档、读书、关于、笔记本和带日期的文章 URL 都重定向到当前博客路由。
- 面向用户的 Markdown 内容位于 `src/content/blog/` 和 `src/content/interview/`。
- 运行时/静态资源位于 `public/`；大型爬虫数据快照位于 `src/public/data/`。

## 构建和生成数据流

- `npm run serve` 在启动 Vite 开发服务器（端口 8080）之前运行 `scripts/sync-findJob-summary.js`。
- `npm run build` 同步面试摘要，运行 `npm run typecheck`（`vue-tsc --noEmit -p tsconfig.json`），用 Vite 构建，然后运行 `scripts/copy-404.js`。
- `npm run iteration:report` 从当前 Git 工作区生成可审查的迭代日志草稿；`npm run context:check` 只读检查高影响路径是否同步更新协作文档。两者不挂载到 `serve`/`build`，也不自动提交或推送。
- `src/content/interview/full.md` 和 `chain.md` 生成 `public/findJob-summary/full.md` 和 `chain.md`。
- `auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件，已纳入 `tsconfig.json`；`npm run typecheck` 是独立的 Vue/TypeScript 类型检查入口。
- `.cspell.json` 是仓库级拼写检查配置：全局检查遵循 `.gitignore`，排除依赖、构建产物、大型数据快照、发布图片、锁文件和自动生成声明；项目专有词统一维护在 `words` 中，不把疑似拼写错误自动当作正确词修改。
- `dist/` 是构建输出；`auto-imports.d.ts` 和 `components.d.ts` 是自动生成的声明文件。
- Vite 将 `write-excel-file` 保留在懒加载的 `xlsx-export` chunk 中，因为基金和加密货币页面只在导出电子表格时才会加载它。

## 部署和运维路径

- `.github/workflows/ci.yml` 安装依赖、运行爬虫工作、构建站点，并将 `dist/` 直接推送到 `gh-pages` 分支；未使用 `gh-pages` npm 包。
- Vite 构建未使用预渲染插件。
- Vite 开发服务器默认仅监听本机，不启用全来源 CORS；需要局域网调试时由开发者显式使用 `--host`。
- `uploadQL.js` 是一个单独的手动 SFTP 部署路径，需要 `archiver`、`ssh2` 和 `ssh2-sftp-client`。
- 除非明确要求爬虫或部署工作，否则不要运行 `build.sh` 或 `uploadQL.js`。

## 依赖决策

- 移除了 `gh-pages` 和 `vite-plugin-prerender`，因为仓库搜索确认它们未被使用；这移除了它们过时的部署/预渲染依赖树。
- 只要 `uploadQL.js` 还在使用，就保留 `archiver`；当前已升级到 `archiver@8`。
- 电子表格导出已从有安全通告且无官方修复的 `xlsx` 切换到浏览器端 `write-excel-file@4.1.1`，当前仅生成工作簿，不解析上传文件。
- 构建工具已从 Vite 4 升级到 Vite 6.4.3，`@vitejs/plugin-vue` 为 5.2.4；`vue-tsc` 已升级到 3.3.8，PostCSS 锁定到 8.5.18。
- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 已声明但尚未配置；visualizer 当前升级到 5.14.0，预期用途仍未确认。

## 验证和安全基线

- 默认代码验证：`npm run build`。
- 仅类型验证：`npx vue-tsc --noEmit`。
- 浏览器相关变更：运行 `npm run serve` 并在浏览器中检查受影响的流程。
- 依赖审计必须使用 `npm audit --registry=https://registry.npmjs.org`，因为配置的 npm 镜像没有审计端点。
- 完整依赖审计和生产依赖审计均为 0 个漏洞；Vite 6.4.3 已将 esbuild 更新到 0.25.12，现有 Vue/Markdown 插件和 CI Node 20 构建已通过验证。
- `npm run build` 已在 Vite 6、vue-tsc 3 和新的浏览器导出适配器下通过；构建会保留独立的 `xlsx-export` 延迟加载 chunk。

## 已验证的工作偏好

- 优先选择小型、可审查的变更，而不是将依赖清理与破坏性迁移混在一起。
- 不要运行 `npm audit fix --force`；明确检查并限定主要升级的范围。
- 除非用户要求，否则不为当前变更执行提交或推送。
- 不使用 Git worktree 隔离；默认只在主 checkout 中连续迭代。历史 worktree 已清理，后续任务不要创建隔离副本或 worktree 分支。

## 未解决问题

- `vite-plugin-compression` 和 `rollup-plugin-visualizer` 是为了将来使用而有意保留的，还是应该作为未使用的工具移除？
- 手动 `uploadQL.js` SFTP 部署路径是否应长期保留？


通过将已解答的问题替换为相关部分的已确认事实或决策来解决；不要把已回答的问题留在这里。

## 维护规则

- 本文件只记录当前仍有用的项目事实、决策、验证基线和未解决问题；不记录普通过程日志、提交历史或局部函数细节。
- 当架构、路由、目录、依赖、命令、生成文件、部署、验证或数据流实际变化时，更新相关事实并移除过时条目。
- 小型局部 UI/内容编辑和纯只读说明通常无需更新本文件；有价值的复杂迭代证据再记录到 `.claude/iteration-log.md`。
