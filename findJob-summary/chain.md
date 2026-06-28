# 前端八股 · 项目串联背诵版（高级前端 / 技术负责人）

> **副本说明**：本文档由 `前端八股文汇总背诵版.md` 按「真实命中规律 + 项目→原理→八股」重组而成。  
> **不覆盖原稿**：原文件仍是完整知识树索引；本稿用于**怎么背、背什么、从哪条线串**。

---

## 使用说明

| 文档 | 用途 |
|------|------|
| `前端八股文汇总背诵版.md` | 全量题库检索、查漏补缺 |
| **本稿** | 按命中率优先级 + 业务场景串联背诵 |

**背诵原则**：先能讲清一条项目链路，再落到原稿对应章节抠细节。  
**面试原则**：高级岗少答「定义」，多答「我们项目里怎么做的 → 为什么 → 底层原理」。

**框架策略（Vue + React 双轨）**：

| 你的主栈 | 面试中的位置 |
|----------|----------------|
| **Vue**（金融 / 交易系统 / Agent） | 项目故事主战场，讲深讲透 |
| **React** | 高级岗**同等高频**；很多公司二面/交叉面必问；至少达到「能对比 + 能讲清 Hooks/Fiber/Redux 一条链」 |

> 下面每条业务链路都拆成：**通用原理 → Vue 落点 → React 落点**。背一条场景 = 两个框架都能接追问。

---

## 一、你的背景与命中规律

**背景标签**：金融系统 · **Vue + React** · 内部交易系统 · Agent 探索 · 高级前端 · 技术负责人方向  

**整体命中率（经验值，非绝对）**：

| 档位 | 占比 | 策略 |
|------|------|------|
| **高频** | ~80% | 必须能「项目故事 + 原理」闭环；**Vue、React 框架题都要能答** |
| **中频** | ~15% | 有余力补，面试前 1 周扫一遍 |
| **低频** | ~5% | 知道名词即可，**不必专门背** |

### 高频（80%）— 必串链路

| 领域 | 核心考点 |
|------|----------|
| **JS** | 事件循环、Promise、闭包、原型链、this、深浅拷贝、call/apply/bind、防抖节流 |
| **Vue** | 响应式、Diff、nextTick、生命周期、computed/watch、keep-alive、通信 |
| **React** | Hooks、Fiber/Diff、setState 批处理、useEffect、memo/useMemo/useCallback、Redux、lazy/Suspense、Error Boundary |
| **浏览器** | 输入 URL、缓存、回流重绘、渲染过程 |
| **网络** | HTTP、HTTPS、TCP、跨域 |
| **工程** | Webpack / Vite、性能优化 |
| **场景** | 首屏优化、权限、埋点、大列表 |
| **框架对比** | Vue vs React 设计差异、状态管理、更新机制（**中高级常问**） |

### 中频（15%）— 选背

HTML 语义 · CSS 进阶（IFC、幽灵节点、baseline）· Webpack 源码 · 浏览器多进程 · Next.js SSR 细节 · Zustand/Jotai 等

### 低频（5%）— 可跳过

DHTML、Flash、SGML、Cookie 隔离、clip、Waterfall 细抠等 — **很多公司根本不问**。

> 原稿索引见 [六、低频可跳过](#六低频5--附录可跳过索引)。

---

## 二、怎么背：项目 → 原理 → 八股

不要从「知识树顶层」往下背。  
要建立：**真实项目问题 → 你怎么做 → 追问落到哪条八股**。

### 万能答题结构（30 秒 + 2 分钟）

1. **场景**：什么业务、什么页面、什么指标  
2. **手段**：你/团队做了什么（可量化）  
3. **原理**：为什么有效（链路节点）  
4. **权衡**：代价、边界、重来会怎么改  
5. **（加分）框架对比**：「Vue 里用 nextTick，React 里对应 batching + useEffect queue」

### 主链路总览（覆盖 ~80% 面试）

| 链路 | 场景 | 框架相关节点 |
|------|------|----------------|
| **A** | Agent / 首屏慢 | nextTick ↔ batching；异步组件 ↔ lazy/Suspense |
| **B** | 交易大列表 | v-for/key ↔ list key/memo；虚拟列表两端通用 |
| **C** | 权限 / 安全 | 路由守卫 ↔ ProtectedRoute；XSS 两端通用 |
| **D** | 埋点 / 监控 | errorHandler ↔ Error Boundary |
| **E** | JS 手写 / 原理 | 与框架无关 |
| **F** | URL → 页面 | 与框架无关 |
| **G** | React 专项 | Fiber、Hooks、Redux（无 Vue 项目时也必问） |

---

### 链路 A：Agent / 首屏 — 「为什么慢？怎么优化？」

```
【通用】Agent 对话页 / 多模块首屏慢、流式输出卡顿
    ↓ 指标
LCP、FCP、TTI、长任务 TBT（Performance API、Core Web Vitals）
    ↓ 构建
路由懒加载、dynamic import、splitChunks / manualChunks（Webpack、Vite）
    ↓ 缓存
强缓存 + 协商缓存、content-hash、CDN（Cache-Control、ETag、304）
    ↓ 运行时
Tree-shaking、按需加载、减首屏 bundle
    ↓ 框架更新层
    ├─ Vue：defineAsyncComponent / 路由 lazy；nextTick 后测 DOM；流式内容合并 patch
    └─ React：React.lazy + Suspense；startTransition / useDeferredValue 降优先级；
              useEffect 里请求；避免父组件 state 导致全树重渲染
    ↓ 虚拟 DOM
    ├─ Vue：Diff + 稳定 key；keep-alive 缓存子面板（若适用）
    └─ React：reconciliation + key；React.memo 包纯展示子树
    ↓ 异步
Promise / 微任务调度 UI 更新（事件循环）
    ↓ 交互
防抖（输入）、节流（滚动/resize）
```

| | Vue 话术要点 | React 话术要点 |
|---|-------------|----------------|
| 加载 | 路由 lazy、异步组件、prefetch 降级 | `React.lazy`、`Suspense` fallback、路由 `lazy()` |
| 更新 | `nextTick` 合并测量/滚动 | 自动批处理（React 18）；`flushSync` 何时打破批处理 |
| 体验 | `v-show` vs 频繁切换 | `useDeferredValue` 延迟非紧急 UI |

**必背**：事件循环 · Promise · Diff · 缓存 · 分包 · **nextTick + React 批处理**  

**原稿**：`# 前端性能优化` · `# webpack` · `# Vite` · `# Vue` · `# React`（14、19、34、40）

---

### 链路 B：交易系统 / 大列表 — 「高频刷新怎么扛？」

```
【通用】订单簿 / 行情表：千行级、秒级推送
    ↓ 现象
掉帧、内存涨、选中态丢、滚动跳动
    ↓ 方案
虚拟列表（react-window / vue-virtual-scroller 等）
    ↓ DOM
固定行高、transform、避免 layout thrashing（回流重绘）
    ↓ 框架
    ├─ Vue：稳定 key；子组件拆分；`shallowRef` / 冻结纯展示；computed 派生列；
    │        watch 精确来源，忌 deep 大对象
    └─ React：列表 key 不用 index；`memo` + 稳定 props；`useMemo` 派生数据；
              父组件少存可下放 state；推送节流 + `useReducer` 批量合并
    ↓ 通信
    ├─ Vue：props/emit、Pinia 按交易域拆 store
    └─ React：props/callback、Context（慎）、Redux/Zustand 分 slice
    ↓ 实时
WebSocket 消息进队列 → 节流渲染（100ms 一批）
```

| | Vue | React |
|---|-----|-------|
| 列表 | `v-for` + `:key="id"` | `map` + `key={id}` |
| 少渲染 | `computed`、`v-memo`（Vue3） | `React.memo`、`useMemo` |
| 陷阱 | 深度 `watch` 行情对象 | 每次 render `onClick={() => {}}` 新引用 |

**原稿**：`# Vue` · `# React`（22-25、40-42）· `# CSS` · `# 前端性能优化`

---

### 链路 C：金融权限 / 安全

```
【通用】菜单 / 按钮 / 接口三级权限 + 合规
    ↓ 前端
    ├─ Vue：vue-router beforeEach；动态 `addRoute`；`v-if` / 自定义指令
    └─ React：`<ProtectedRoute>`；路由配置里 role/meta；条件渲染 + 权限 Hook
    ↓ 状态
    ├─ Vue：Pinia 存 user/permissions
    └─ React：Redux/Zustand 或 Context（小项目）；JWT 解析角色
    ↓ 安全（通用）
HTTPS、HttpOnly Cookie、CSRF Token、XSS（dangerouslySetInnerHTML / v-html）
    ↓ 跨域
devServer.proxy / Vite proxy；生产 Nginx；CORS 预检
```

**原稿**：`# 其他` 权限 · `# Vue` 路由守卫 · `# React` 32-33 · `# HTTP` · `# 浏览器`

---

### 链路 D：埋点 / 监控

```
【通用】错误率、接口慢、白屏
    ↓ 采集
    ├─ Vue：`app.config.errorHandler`、全局 `window.onerror`
    └─ React：Error Boundary（渲染错误）；`componentDidCatch` / 类或 react-error-boundary
    ↓ 请求
axios/fetch 拦截器；`unhandledrejection`
    ↓ 上报
批量队列、采样、sendBeacon、微任务里 flush（不阻塞主线程）
    ↓ 性能
LCP/FCP、PerformanceObserver
```

**原稿**：`# 其他` 51 · `# React` 35 · `# JS` · `# 前端性能优化`

---

### 链路 E：JS 基础（Vue / React 都会突然切题）

```
事件循环 ↔ Promise/async ↔ 闭包 ↔ this/call/apply/bind
    ↔ 原型链 ↔ 深浅拷贝 ↔ 防抖节流
```

**React 加考**：手写简易 `useState` / `useEffect`（链表 + 调度）；与事件循环的关系。  
**原稿**：`# JS` · `# React` 52 · `# 在线笔试题`

---

### 链路 F：浏览器 + 网络（框架无关）

```
URL → DNS → TCP → TLS(HTTPS) → HTTP → 缓存(200/304)
    → 解析 → DOM/CSSOM → 渲染树 → Layout/Paint/Composite → 回流重绘
```

**原稿**：`# 浏览器` · `# HTTP`

---

### 链路 G：React 专项（无 Vue 项目也会问满 15 分钟）

适合简历写 React、或面试官主攻 React 时**单独串一条**：

```
JSX / 单向数据流 / 虚拟 DOM 是什么、解决什么问题
    ↓
Fiber：可中断、双缓冲、优先级（时间切片）
    ↓
更新：setState → 调度 → reconcile（Diff）→ commit DOM
    ↓
Hooks：useState（链表）、useEffect（deps + 清理）、规则（顺序）
    ↓
性能：memo / useMemo / useCallback（何时别滥用）
    ↓
状态管理：Redux 单向数据流 / RTK；与 Vue Pinia 对比
    ↓
路由：React Router；ProtectedRoute
    ↓
代码分割：lazy + Suspense；Error Boundary
    ↓
18+：自动批处理、startTransition、Concurrent
```

**必背节点**：Fiber（能讲清两层）· Hooks 规则 · Diff+key · useEffect 依赖 · Redux 流程 · 批处理  

**原稿**：`# React` 全文 · `# 其他` 12-18（Fiber、Hooks 提纲）

---

## 三、Vue ↔ React 对照（面试「区别」题直接背这张表）

| 维度 | Vue | React |
|------|-----|-------|
| 核心理念 | 渐进式、模板/ SFC、自动依赖收集 | 函数式 UI、JSX、显式 setState / Hooks |
| 响应式 | Vue2 `defineProperty` / Vue3 `Proxy` + effect | `useState` + 不可变更新；Proxy 无内置响应式 |
| 更新调度 | 异步队列 + `nextTick` | Scheduler + Fiber；React 18 自动批处理 |
| 组件缓存 | `keep-alive` | 无内置；靠 `memo` + 路由 outlet 自实现 |
| 派生状态 | `computed`（自动缓存） | `useMemo`（手动 deps） |
| 副作用 | `watch` / `watchEffect` | `useEffect` / `useLayoutEffect` |
| 通信 | props / emit / provide / Pinia | props / callback / Context / Redux-Zustand |
| 列表 Diff | 双端指针 + key | 单端 + key；Fiber 链表 |
| 路由权限 | `beforeEach` + 动态路由 | `<ProtectedRoute>` + loader（v6.4+） |
| 异步组件 | `defineAsyncComponent` | `React.lazy` + `Suspense` |
| 错误捕获 | `errorHandler` | Error Boundary（仅渲染树） |
| SSR | Nuxt | Next.js（hydration 常问） |
| 适用话术 | 「业务台、中后台、团队 Vue 栈」 | 「生态、招聘面、复杂交互 / 跨端」 |

**一句话总结**：Vue 偏「编译期 + 自动依赖」；React 偏「运行时 + 显式数据流 + Fiber 调度」。**底层都要会：虚拟 DOM、Diff、key、单向数据、性能优化。**

**原稿**：`# Vue` 9、66-68 · `# React` 1、53

---

## 四、高频知识点速查

### JavaScript（Vue / React 共用 · P0）

| 主题 | 要能讲清什么 | 原稿 |
|------|----------------|------|
| 事件循环 | 宏/微任务顺序；async 输出题 | `# JS` 5、112；`# 在线笔试题` 24-28 |
| Promise | 状态、链式、all/race、catch 后 then | `# JS` 7、73-79 |
| 闭包 | 防抖、Hooks 闭包陷阱（React） | `# JS` 3；`# React` 44 |
| 原型链 / this | 继承、bind/call/apply | `# JS` 3、11、13 |
| 深浅拷贝 | 循环引用 | `# JS` 15、98 |
| 防抖节流 | 搜索、表格滚动 | `# JS` 121 |

### Vue（P0 · 主栈讲项目）

| 主题 | 原稿 |
|------|------|
| 响应式 / Proxy | `# Vue` 4、110 |
| Diff / key | `# Vue` 2、92 |
| nextTick | `# Vue` 12、88 |
| 生命周期 | `# Vue` 7、81 |
| computed / watch | `# Vue` 5 |
| keep-alive | `# Vue` 8、93 |
| 通信 / Pinia | `# Vue` 11、114-115 |

### React（P0 · 与 Vue 同级，不可只背对比）

| 主题 | 要能讲清什么 | 原稿 |
|------|----------------|------|
| 设计思想 | 声明式、单向数据流、组合 | `# React` 1、53 |
| JSX | 编译、createElement | `# React` 2 |
| Hooks 规则 | 顺序、为何不能 if 里调用 | `# React` 5 |
| useState / 批处理 | 函数式更新；React 18 batching | `# React` 6、19 |
| useEffect | 依赖、清理、与生命周期对应 | `# React` 7、43 |
| useLayoutEffect | 与 useEffect 区别 | `# React` 8 |
| useMemo / useCallback / memo | 何时用、何时滥用 | `# React` 10、25、40 |
| Fiber / Diff | 可中断、key、reconciliation | `# React` 20-23 |
| 合成事件 | 委托、与原生区别 | `# React` 17 |
| Redux / RTK | 流程、中间件、与 Pinia 对比 | `# React` 28-30 |
| Router / 权限 | ProtectedRoute | `# React` 32-33 |
| lazy / Suspense | 首屏分包 | `# React` 34 |
| Error Boundary | 能抓什么、不能抓什么 | `# React` 35 |
| React 18 | startTransition、useDeferredValue | `# React` 14 |
| 手写 | 简易 useState、useEffect | `# React` 52 |
| 性能 | 虚拟列表、render 里少建对象 | `# React` 40-42 |
| SSR / Next | hydration（做过再深讲） | `# React` 46-47 |

### 浏览器 & 网络（P0）

| 主题 | 原稿 |
|------|------|
| 输入 URL | `# 浏览器` 2 · `# HTTP` 18 |
| 缓存 | `# 浏览器` 10 · `# HTTP` |
| 回流重绘 | `# CSS` 30-31 · `# 浏览器` 2 |
| HTTP / HTTPS / TCP | `# HTTP` · `# 浏览器` 6-8 |
| 跨域 | `# 浏览器` 12 |

### 工程 & 场景（P0）

| 主题 | 原稿 |
|------|------|
| Webpack / Vite | `# webpack` · `# Vite` |
| 首屏 / 大列表 / 权限 / 埋点 | 链路 A–D · `# 前端性能优化` · `# 其他` |

---

## 五、场景题模板（Vue + React 双版本）

### 1. 首屏优化

**通用**：FCP/LCP/TTI · 分包 · 缓存 hash · CDN · 骨架屏 · 减 JS  

| Vue | React |
|-----|-------|
| 路由/组件 lazy | `React.lazy` + `Suspense` |
| `nextTick` 后测速 | 避免同步 setState 风暴；`startTransition` 降优先级 |
| Pinia 按需注册 | 路由级 code splitting；Redux 勿整包进 entry |

→ 链路 **A**

### 2. 大列表

**通用**：虚拟滚动 · 固定行高 · 节流推送 · Worker（可选）  

| Vue | React |
|-----|-------|
| `key`、子组件、`computed` | `memo`、`useMemo`、稳定 callback（`useCallback`） |
| `v-memo` | `react-window` |

→ 链路 **B**

### 3. 权限

**通用**：RBAC · 前后端一致 · Token · XSS/越权  

| Vue | React |
|-----|-------|
| `beforeEach`、`addRoute` | `ProtectedRoute`、权限 Hook |
| `v-permission` 指令 | 高阶组件 / 组件内 `useAuth()` |

→ 链路 **C**

### 4. 埋点

| Vue | React |
|-----|-------|
| `errorHandler` | Error Boundary + 全局 onerror |

→ 链路 **D**

### 5. 「Vue 和 React 你更熟？区别？」（必准备 2 分钟）

按 [三、对照表](#三vue--react-对照面试区别题直接背这张表) 答 + 各举**一个你项目里的真实选择原因**（不要只背八股）。

### 6. 技术负责人加答

方案评审、规范、技术债、带人 — 与框架无关，任何栈都要准备。

---

## 六、低频（5%）— 附录：可跳过索引

| 原稿关键词 | 说明 |
|------------|------|
| DHTML、Flash、SGML | 历史题 |
| Waterfall 细抠、Cookie 隔离、clip | 问得少 |
| 只考 Vue 的公司 | React 仍建议会对比 + Hooks 链，防换面试官 |

---

## 七、与原知识树对照

| 原文章节 | 优先级 | 背诵方式 |
|----------|--------|----------|
| `# JS` | **P0** | 链路 E + 笔试题 |
| `# Vue` | **P0** | 链路 A–D + 对照表 |
| `# React` | **P0** | 链路 A–D + **链路 G** + 对照表 |
| `# 浏览器` / `# HTTP` | **P0** | 链路 F |
| `# webpack` / `# Vite` | **P0** | 链路 A |
| `# 前端性能优化` | **P0** | 链路 A、B |
| `# 其他` | **P0/P1** | 权限、埋点、Fiber 提纲 |
| `# TypeScript` | **P1** | Vue + React 项目各 1 个例子 |
| `# ES6` | **P1** | 并入 JS |
| `# CSS` / `# HTML` | **P1/P2** | 回流重绘、script 加载 |
| `# Node.js` | **P2** | 全栈岗 |

---

## 八、复习节奏（4 周 · Vue + React 交替）

| 周次 | 目标 |
|------|------|
| **第 1 周** | 链路 E（JS）+ 笔试输出题；手写 Promise、防抖、**简易 useState** |
| **第 2 周** | 链路 F；**对照表背熟**；Vue 速查 + **React 链路 G**（Fiber/Hooks/Redux） |
| **第 3 周** | 链路 A、B：同一故事 **各讲一遍 Vue 版 + React 版**（各 3 分钟） |
| **第 4 周** | 链路 C、D + Webpack；模拟题：「从 Agent 首屏问到事件循环」+ 「从列表问到 Fiber」 |

**每日 30 min**：1 条链路口述 + **1 道 Vue 或 React 追问题**（隔天交替）+ 原稿补 1 个薄弱点。

---

## 九、自测清单（上场前勾选）

**通用**

- [ ] 链路 A/B/C 各 3 分钟（**每个场景能说 Vue 和 React 两种落点**）
- [ ] 事件循环 + Promise 输出题稳定
- [ ] URL → 渲染 → 缓存能画简图
- [ ] Webpack 优化结合真实项目讲 3 条

**Vue**

- [ ] 响应式、nextTick、Diff、生命周期、Pinia 各 1 分钟

**React**

- [ ] Hooks 规则 + useEffect 依赖陷阱能举例
- [ ] Fiber + Diff + key 能讲清「为什么列表不用 index」
- [ ] setState 批处理（React 18）+ `memo`/`useMemo` 区别
- [ ] Redux 数据流能画箭头图；与 Pinia 对比 3 句
- [ ] Error Boundary vs `window.onerror` 分工
- [ ] 手写简易 useState 或能说清链表结构

**对比题**

- [ ] 「Vue 和 React 区别」2 分钟不卡壳（对照表）

**负责人**

- [ ] 2 个失败案例 + 复盘

---

## 十、跳转全量题库

同目录：**`前端八股文汇总背诵版.md`**

- Vue 专题 → `# Vue`
- React 专题 → `# React`（53 条）
- 笔试 → `# 在线笔试题`

---

*文档版本：项目串联高级版 v2 · Vue + React 双轨 · 与全量知识树副本配套使用*
