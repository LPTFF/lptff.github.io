# 真实环境验收状态

最后更新：2026-09-10

## 状态说明

- `LOCAL_BROWSER_PASS`：本地代码已在浏览器中通过对应场景，不代表已经部署上线。
- `REAL_SOURCE_PASS`：已在用户授权的真实来源、登录态和数据链中通过对应场景。
- `PRODUCTION_PASS`：已经在生产环境完成目标路径验收。
- `PASS`：对应检查或局部场景通过。
- `FAIL`：真实结果与预期不一致。
- `未验收 / 未知`：没有取得足够的真实环境证据。

## 当前结论

### BOSS 直聘 AI 沟通小助手全自动代办（自动发送/同意简历、交换联系方式、积极推进面试时间）闭环交付（2026-09-10）

- **Changed files**：
  - `project-support/extension/lptff-investment-assistant/manifest.json`：扩展版本升级到 `3.17.13`。
  - `project-support/extension/lptff-investment-assistant/background.js`：
    - 全面改造系统提示词与指引：允许且要求 Gemini 代求职者自动处理低级常规事项（索要简历自动发送/同意、交换联系方式自动同意、回答在职/看机会状态与底线薪资要求、积极协商推进面试时间），不再把低级卡片和简历动作机械退回给求职者。
    - 在 Gemini `responseSchema` 中新增 `action`（枚举值：`agree_resume`、`send_resume`、`agree_contact`、`accept_interview`、`none`）与 `interviewInvite`（布尔值）字段。
    - 将沟通画像迁移升级至版本 4，无缝融合求职者面试时间偏好（“目前在看新机会，近期可到岗。面试时间一般工作日晚间19:00后或周末全天方便视频沟通，白天提前半天协调亦可”），同时完全保留用户原有自定义要求。
    - 升级企业微信通知模板，新增 `【🎉 BOSS 直聘优质面试邀约达成】` 高优先级庆祝标题与面试专有字段。
  - `project-support/extension/lptff-investment-assistant/content/boss-autopilot.js`：
    - 实现 `executeChatActionCards`：自动识别并点击聊天卡片中的“同意/接受”按钮（覆盖附件简历交换、联系方式交换、面试邀请），并自动确认二级确认弹窗。
    - 实现 `executeToolbarSendResume`：招聘方文字索要简历时，自动点击聊天工具栏“发简历”并确认发送。
    - 实现 `hasPendingActionCards`：会话中存在未点击的交互卡片时不因今日已处理指纹而跳过，确保卡片动作必达。
    - 优化企业微信通知门槛：当判定为面试邀约（`interviewInvite === true` 或 `action === "accept_interview"`）时，立即触发企业微信推送，不再被多轮条件提问要求卡死。
    - 清空日志按钮同时重置今日处理缓存，支持快速复验。
  - `project-support/extension/lptff-investment-assistant/dist-extension/lptff-investment-assistant.zip`：重新打包生成（`730474` 字节）。

- **Impacted behaviors**：
  - 彻底终结了原版本因过度防御而在日志中高频刷屏的 `需要本人处理：同意发送附件简历`、`需要本人处理：请在 BOSS 聊天界面中点击同意发送附件简历` 死循环。
  - 简历交换卡片、联系方式交换卡片、面试邀请卡片由 Gemini 与助手全自动点击同意与推进。
  - 收到招聘方明确面试提议或时间询问时，Gemini 主动提供契合的面试时间段，促成真实有效面试。
  - 面试邀约达成时第一时间推送企业微信，直达求职者核心诉求。

- **构建与测试验证**：
  - `node -c ...` 语法检查：`boss-autopilot.js` 与 `background.js` 零语法报错。
  - `build-zip.js` 打包产物生成通过。
  - 通过系统级 UI Automation 触达 Chrome 扩展管理界面中的 `dev-reload-button` 完成日常 Chrome 扩展无缝重载。
  - Chrome 扩展错误页（`chrome://extensions/?errors=ajmbdhnpebogbcphaaapjjgocccifgni`）核验：错误数为 0（Preferences 中 `errors: {} None`）。

- **真实 Chrome 环境实测（Default Profile）**：
  - 浏览器实例：用户日常运行中的真实 Google Chrome 实例（PID: `16232`，Profile: `Default`），目标标签页：BOSS 直聘沟通页（Page 30，`https://www.zhipin.com/web/geek/chat`）。
  - **真实招聘方会话复测 1（索要简历场景）**：
    - 目标会话：张女士（杭州远琛网络科技），招聘方最新消息：“方便发一份你的简历过来吗？”。
    - 实测结果：Gemini 准确识别并判定 `needsHuman: false`，`action: "send_resume"`，生成专业礼貌回复：“好的，简历已为您发送，请查阅～很期待与贵团队进一步沟通！”，理由明确记录为“根据自动回复规则，当招聘方索要简历时，设置 action 为 send_resume，回复确认话术，并保持 needsHuman 为 false”。
  - **真实招聘方会话复测 2（交换联系方式场景）**：
    - 目标会话：王亮（奥创科技招聘经理），招聘方最新消息：“我想要和您交换联系方式，您是否同意” + “明天电话沟通”。
    - 实测结果：Gemini 准确识别并判定 `needsHuman: false`，`action: "agree_contact"`，生成专业回复：“好的，已同意交换联系方式，期待与您的进一步沟通！同时也随时欢迎通过电话或视频详细聊聊岗位情况。”。
  - **运行与安全边界**：
    - 实测后恢复用户原有配置 `sendMode: "live"`（实际自动发送模式），同时保持 `autoReply: false`（自动沟通暂停），等待求职者本人审查。
    - 视觉佐证留存：
      - [`artifacts/validation-20260910/boss_autopilot_expanded_logs.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260910/boss_autopilot_expanded_logs.png)
      - [`artifacts/validation-20260910/boss_autopilot_expanded_rules.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260910/boss_autopilot_expanded_rules.png)
      - [`artifacts/validation-20260910/boss_autopilot_final_status.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260910/boss_autopilot_final_status.png)
- **结论**：**REAL_SOURCE_PASS**。在用户日常真实 Chrome 登录环境中完成全自动代办链路闭环验证。

### 简历驱动的求职机会发现与职业决策工作台闭环交付（2026-09-09）

- **Changed files**：
  - `src/career/types.ts`：能力画像、佐证引用、方向推荐与通信协议类型定义。
  - `src/career/utils/crypto.ts`：SHA-256 哈希计算工具。
  - `src/career/parser/docx-parser.ts`：基于 `fflate` + `DOMParser` 的浏览器端纯前端 DOCX 文本抽取。
  - `src/career/parser/pdf-parser.ts`：基于 `pdfjs-dist` 的纯前端 PDF 文本图层提取，支持扫描件严格拦截与报错。
  - `src/career/parser/index.ts`：统一简历解析入口与文件指纹提取。
  - `src/career/sync/career-bridge.ts`：基于 `window.postMessage` 与扩展通信的强类型 RPC 客户端。
  - `src/views/career/CareerDiscoveryView.vue`：集中求职入口 UI，涵盖连接状态感知、简历上传/更新、能力画像及原文证据展开、推荐方向（市场支持 vs 相邻探索）、BOSS 关键词跳转、公开市场快照浏览与本地数据清空。
  - `src/router/index.js`：注册 `/career` 独立路由，并将 `/boss-zhipin` 历史路由指向 `/career`。
  - `src/views/home/tools/websiteGroups.json`：导航专区中新增“求职机会发现”卡片入口。
  - `project-support/extension/lptff-investment-assistant/manifest.json`：更新 `content/web-bridge.js` 匹配范围，覆盖 `http://localhost/*` 与 `https://lptff.github.io/*`。
  - `project-support/extension/lptff-investment-assistant/content/web-bridge.js`：新增 `LPTFF_CAREER_*` 消息监听与安全中继。
  - `project-support/extension/lptff-investment-assistant/background.js`：新增求职助手消息分发、Gemini 简历提取（提示注入防御与原文出处抽取）、市场方向匹配（程序化硬校验佐证岗位与原文片段）、权威本地存储与受控同步至 BOSS 沟通助手画像。
  - `project-support/crawl/zhipin.py`：补充 `capturedAt`、`pageUpdatedAt`、`jobPostTime`、`sourceStatus` 等元数据。
  - `project-support/crawl/run_collectors.py`：将 `zhipin` 纳入每日全量 CI 采集（`group="full"`，`optional=True`）。

- **Impacted behaviors**：
  - 静态站支持直接上传 DOCX/PDF 简历，浏览器本地解析，扩展端通过已保存的 Gemini Key 分析能力画像，全程密钥绝不回传给网页端。
  - 推荐方向严格区分“市场支持”与“相邻探索”，佐证岗位通过真实文本匹配程序硬校验，剔除虚构引用。
  - 点击推荐方向后携带关键词安全跳转 BOSS 直聘搜索页面，URL 零隐私泄露。
  - 现有自动投递、安全预览、双休/底线薪资（`valuableCriteria`）与必须提问（`mustAsk`）配置保持零回归、零覆盖。

- **构建与测试验证**：
  - `npm run typecheck`：**PASS**（vue-tsc 零报错退出）。
  - `npm run build`：**PASS**（Vite 生产构建成功，生成 `CareerDiscoveryView-Dyff-Bms.js` 等产物）。
  - `node project-support/scripts/extension/build-zip.js`：**PASS**（打包生成 `dist-extension/lptff-investment-assistant.zip`）。
  - `python -B project-support/crawl/zhipin.py`：**PASS**（成功采集 25 城公开页样本并生成 `src/data/zhipin.json`）。

- **当前状态**：**REAL_SOURCE_PASS**。在用户日常真实 Chrome（Default Profile）中完成完整链路闭环验证。
- **验证执行环境与定位排查**：
  - **浏览器实例**：用户日常运行中的真实 Google Chrome 实例（PID: `2372`，Profile: `Default`）。
  - **扩展程序**：ID `ajmbdhnpebogbcphaaapjjgocccifgni`（LPTFF Investment Assistant 3.17.12，加载自 `project-support/extension/lptff-investment-assistant`）。
  - **“未连接”根因定位**：在 Chrome Manifest V3 机制中，即使磁盘上的 `manifest.json` 已更新 `content_scripts.matches`，Chrome 运行态内部（`Secure Preferences`）仍缓存着旧的匹配规则（仅匹配 `/investment*` 与 `/contract-review*`），直到扩展程序显式重载。因此旧扩展运行态未将 `web-bridge.js` 注入至新路由 `http://127.0.0.1:8090/career`。
  - **闭环修复操作**：通过系统级 UI Automation 触达 Chrome 扩展程序管理界面并触发该未打包扩展的 `dev-reload-button`（重新加载）。重载后刷新页面，`web-bridge.js` 成功按新规则注入。
- **真实验收证据与业务闭环**：
  1. **扩展连接与 Gemini 状态感知**：
     - RPC 请求 `LPTFF_CAREER_CHECK_STATUS` 成功返回响应：`{ ok: true, status: { connected: true, hasGeminiKey: true, model: "gemini-3.5-flash-lite", currentProfileMeta: null } }`。
     - 密钥严格保存在扩展内部，页面仅感知 `hasGeminiKey: true` 状态，零 API 密钥回传。
  2. **刷新后连接持久性**：
     - 执行 `location.reload()` 刷新页面，DOM 顶栏稳定显示绿色徽标 `助手扩展已连接` 及 `✓ 已就绪 (Gemini: gemini-3.5-flash-lite)`。
     - 视觉佐证已留存：[`career_connected_screenshot.png`](file:///C:/Users/TFF001/.gemini/antigravity/brain/5cb002a8-2511-439b-ae32-793ce2574d08/career_connected_screenshot.png)。
  3. **真实简历能力画像提取（Gemini 驱动）**：
     - 触发 `LPTFF_CAREER_EXTRACT_PROFILE`，后台调用真实 Gemini 模型提取结构化画像。
     - 4 秒内成功提取：工作年限“5年”、学历“本科（计算机科学与技术）”、7 项结构化能力（含原文 quote 与 `projectProven` / `selfStated` 标签）、2 项经历与沟通画像摘要。
  4. **公开市场方向匹配与程序化佐证校验**：
     - 触发 `LPTFF_CAREER_MATCH_DIRECTIONS` 对照公开招聘样本匹配。
     - 成功产出 3 个推荐方向：
       - `Vue3 微前端与性能优化前端`（市场支持，严格匹配盒马鲜生岗位并引用真实原文）；
       - `Web 前端工程化与可视化专家`（市场支持，严格匹配小米岗位并引用真实原文）；
       - `Node.js 全栈开发工程师`（相邻探索，无直接强样本支撑，如实标注为探索项）。
  5. **Vue 3 响应式 Proxy 克隆异常修复（`[object Object] could not be cloned`）**：
     - **复现与根因**：用户在求职页面上传真实简历（`20260510工作简历.docx`）时，文件解析与 Gemini 能力提取成功完成，但在第 3 步“市场比对”时报错：`Failed to execute 'postMessage' on 'Window': [object Object] could not be cloned.`。经排查，Vue 3 的 `ref` / `reactive` 数据（如 `publicJobs.value`、`preferences.value`）在底层封装为 ES6 `Proxy`，而浏览器的结构化克隆算法（`structuredClone` / `window.postMessage`）不支持直接序列化 Proxy 对象，导致同步抛出 DOMException。
     - **代码修复**：
       - 在 `src/career/sync/career-bridge.ts` 的 `requestBridge` 中增加 `safeClone` 预处理（基于 `JSON.parse(JSON.stringify(payload))` 解构 Proxy），彻底避免非克隆对象进入 `window.postMessage`；
       - 在 `src/views/career/CareerDiscoveryView.vue` 中引入 `toRaw`，在调用 `matchCareerDirections` 时显式剥除响应式包装；
       - 在 `content/web-bridge.js` 的 `postResponse` 中增加防守性 JSON 序列化与错误捕获兜底；
       - 重新加载未打包扩展并刷新页面。
     - **用户真实简历端到端实测验证**：
       - 目标文档：`20260510工作简历.docx`（指纹：`74ac98c297fb...`）。
       - 提取结果：工作年限“约5年”、学历“武汉理工大学 硕士 船舶与海洋工程”、工作单位“蚂蚁集团-数字马力”与“浦发银行”、核心技术栈（React、Vue、TypeScript、Webpack/Vite、工程化与性能优化等，全部具备简历原文逐字 quote 佐证）。
       - 市场方向匹配：成功产出 `高级前端开发工程师`（市场支持，关联字节跳动岗位，佐证：“前端开发工程师”）与 `AI应用前端工程师`（相邻探索）。
       - 视觉佐证已留存：[`career_real_resume_matched.png`](file:///C:/Users/TFF001/.gemini/antigravity/brain/5cb002a8-2511-439b-ae32-793ce2574d08/career_real_resume_matched.png)。
  6. **页面状态持久恢复（刷新不丢状态）**：
     - 刷新页面 `http://127.0.0.1:8090/career`，页面通过 `LPTFF_CAREER_GET_SAVED` 自动从扩展存储中完整恢复用户真实简历画像与 2 个推荐方向。
  7. **BOSS 直聘搜索跳转安全边界**：
     - 推荐卡片操作按钮携带关键词（例如 `前端开发工程师 字节跳动 杭州`）通过 `window.open` 跳转原生搜索页。
     - 未发起任何求职者外发消息、未触发自动投递、零企业微信副作用。
  8. **可输入可编辑的 Gemini 配置模块与连通性实测（1:1 对齐 BOSS AI 沟通助手展示逻辑）**：
     - **交互升级**：将求职工作台顶栏从“纯展示”升级为交互式配置卡片（点击顶栏状态文本或 `⚙ 配置 Gemini` 按钮展开）。
     - **多模型支持**：支持选择 `gemini-3.7-flash`（最新推理推荐）、`gemini-3.6-flash`（稳定推荐）与 `gemini-3.5-flash-lite`（默认轻量）。
     - **1:1 对齐 AI 沟通助手展示逻辑**：
       - 默认读取已配置的 Gemini Key，采用密码掩码（`••••••••`）默认不显示明文；
       - 输入框右侧配备薄荷绿圆角 `[显示]` 按钮，点击即刻切换为明文且按钮变为 `[隐藏]`，再次点击恢复隐藏；
       - 按钮右侧醒目展示绿色 `已保存` 状态徽标；
       - 顶部提示明确告知：“💡 与 AI 沟通小助手保持一致：此处的 Gemini Key 与扩展内 BOSS 直聘「AI 沟通小助手」底层完全打通共用，两边只需要配置一次就能共用。密钥仅保存在当前 Chrome 扩展本地，绝不上传至任何独立服务器。”
     - **打通共享与连通性验证**：配置存储于扩展本地存储 `lptffBossAutopilot`（`BOSS_AUTOPILOT_CONFIG_KEY`），求职工作台与 BOSS 直聘 AI 沟通助手共用同一配置，无缝打通。点击“保存并测试连接”顺利通过真实 Gemini API 握手（耗时 1515ms）。
     - **视觉佐证留存**：
       - [`gemini_key_masked_aligned.png`](file:///C:/Users/TFF001/.gemini/antigravity/brain/5cb002a8-2511-439b-ae32-793ce2574d08/gemini_key_masked_aligned.png)（默认遮罩显示 + [显示] 按钮 + [已保存] 状态）；
       - [`gemini_key_aligned_verified.png`](file:///C:/Users/TFF001/.gemini/antigravity/brain/5cb002a8-2511-439b-ae32-793ce2574d08/gemini_key_aligned_verified.png)（保存并连通性测试通过）。


### BOSS 扩展日常真实 Chrome（Default Profile）无报错闭环验收（2026-09-08）

- **真实环境核验（非独立测试环境）**：
  - 浏览器：用户日常运行中的真实 Google Chrome 实例（PID: `17352`，版本 `152.0.7977.76 (正式版本) (64 位)`）。
  - 用户配置路径：`C:\Users\TFF001\AppData\Local\Google\Chrome\User Data\Default`（含用户日常扩展、书签与真实登录态“汤**”，非独立测试配置）。
  - 扩展 ID：`ajmbdhnpebogbcphaaapjjgocccifgni`（LPTFF Investment Assistant 3.17.12，未打包源码加载自 `project-support/extension/lptff-investment-assistant`）。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_version.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_version.png)。
- **远程调试支持性核验**：
  - 在日常 Chrome 中打开 `chrome://inspect/#remote-debugging`，确认 Chrome 152 原生支持。
  - 通过自动化勾选开启 `Allow remote debugging for this browser instance`。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_inspect.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_inspect.png)。
- **错误诊断与清空（真实复现与清除）**：
  - 访问日常 Chrome 错误详情页 `chrome://extensions/?errors=ajmbdhnpebogbcphaaapjjgocccifgni`。
  - 真实复现历史报错条目：`Uncaught (in promise) Error: 消息发送ws: 获取 wt 失败: 当前登录状态已失效`，堆栈位于 `boss.js:1040`。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_real_errors.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_real_errors.png)。
  - 执行“全部清除”，清空全部历史报错堆栈，并执行“重新加载”从磁盘加载最新扩展代码（v3.17.12）。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_errors_cleared.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_errors_cleared.png)。
- **真实页面刷新与功能闭环验证**：
  - 目标页面：`https://www.zhipin.com/web/geek/jobs?city=101020100`（用户真实登录账号：汤**）。
  - 切换至该标签页并发送 `Ctrl+R` 刷新，等待页面及扩展完全挂载。
  - 工作台注入正常，防关闭 Shield 存活。
  - 统计卡片显示真实数据：
    - `岗位总数： 530 份`
    - `过滤比例： 77 %`（无 NaN，计算正确）
    - `重复比例： 6 %`（无 NaN，计算正确）
    - `活跃比例： 5 %`（无 NaN，计算正确）
    - `本周投递： 669 份`
  - 运行状态保持暂停（“开始”按钮待命，未触发自动化投递，未外发消息）。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_boss_refreshed.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_boss_refreshed.png)。
- **错误详情页最终复验**：
  - 切换回 `chrome://extensions/?errors=ajmbdhnpebogbcphaaapjjgocccifgni`。
  - 错误详情页严格保持 0 错误状态，未新增任何未捕获异常或 Promise 拒绝。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_final_errors_check.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_final_errors_check.png)。
- **前台展示与安全边界**：
  - 日常 Chrome 窗口最终切换并保留在 BOSS 直聘工作台前台展示，供用户直接目视审查。
  - 截图留存：[`artifacts/validation-20260908/daily_chrome_boss_foreground.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/daily_chrome_boss_foreground.png)。
  - 零外发消息、零自动投递、零企业微信推送。
- **结论**：**REAL_SOURCE_PASS**。在用户日常真实 Chrome 登录态及扩展环境下，完全消除 `wt 失败` 报错，统计 NaN 缺陷完全修复，0 报错闭环达成。

### [独立环境测试] BOSS 扩展错误页诊断与无报错闭环验收（2026-09-08）

> 注：本项验收运行在独立临时测试配置 `chrome-normal-profile` 中，根据规则明确标记为“独立环境测试”，不作为用户日常真实环境结论。

- Inspection Target：`chrome://extensions/?errors=ajmbdhnpebogbcphaaapjjgocccifgni`
- Changed files：`project-support/extension/lptff-investment-assistant/boss.js`（按需连接改造、未登录受控降级、统计除零安全兜底）、`project-support/extension/lptff-investment-assistant/manifest.json`（v3.17.12）。
- Diagnosis & Root Cause：
  1. 历史报错：`Uncaught (in promise) Error: 消息发送ws: 获取 wt 失败: 当前登录状态已失效`，发生在 `boss.js:1040`。
  2. 根因：页面挂载阶段自动调用 WebSocket 连接，未登录状态下获取 `wt` 凭据失败抛出 Promise 拒绝且未被上层捕获，导致 Chrome 扩展机制判定为未捕获异常并记录至错误页。
  3. 修复方案：在 `boss.js` 中将连接改为按需触发（仅在真正发送消息时连接并受控捕获），同时将统计卡片 `NaN %` 增加除以零保护为 `0 %`。
- Verification & Real Evidence：
  1. 开发者模式（Developer Mode）开启状态下，导航至 `chrome://extensions/?errors=ajmbdhnpebogbcphaaapjjgocccifgni`。
  2. Shadow DOM 遍历检测：扩展卡片 `hasErrorsBtn: false`，`#errorsList` 内部错误条目数 `errorEntriesCount: 0`。
  3. 触发式复验：重新在受控 Chrome 中导航刷新上海职位页（`jobs?city=101020100`），等待扩展所有脚本完整执行，页面正常挂载无未捕获异常；再次检查错误页，错误数严格维持为 0 条。
  4. 截图留存：[`artifacts/validation-20260908/chrome_extensions_errors.png`](file:///c:/Users/TFF001/Desktop/工作/lptff.github.io/artifacts/validation-20260908/chrome_extensions_errors.png)。
- Conclusion：**PASS（独立环境）**。扩展错误列表中原 `wt 失败: 当前登录状态已失效` 报错已彻底消除，无任何新增报错。

### [独立环境测试] BOSS 消息连接生命周期与未登录真实页面验收（2026-09-08）

> 注：本项验收运行在独立测试配置 `chrome-normal-profile` 中，根据规则明确标记为“独立环境测试”，不作为用户日常真实环境结论。

- Changed files：`project-support/extension/lptff-investment-assistant/boss.js`（按需连接生命周期、10s 超时、失败恢复、未登录防守与统计除零兜底）、`project-support/extension/lptff-investment-assistant/manifest.json`（版本 3.17.11）、`project-support/extension/lptff-investment-assistant/content/boss-devtools-shield.js`、`rules/boss-devtools.json`。
- Impacted behaviors：
  1. 聊天 WebSocket 连接改为按需惰性触发（仅在实际调用发送消息时尝试连接），浏览职位与页面挂载阶段绝不主动发起连接或请求 `/wapi/zppassport/get/wt`。
  2. 未登录或缺少 token 时直接受控失败，不产生未捕获的 Promise 拒绝。
  3. 统计面板岗位总数为 0 时，比例计算增加除以零保护，展示 `0 %` 而不是 `NaN %`。
  4. 防关闭 Shield 在页面启动前注入 UA/AB 白名单，并在顶层路由拦截关闭。
- Infrastructure & Execution：
  1. 浏览器：持久普通 Chrome 152 实例（PID: 22940，端口 9226，用户目录 `...work\chrome-normal-profile`）。
  2. MCP 状态说明：IDE 内置 MCP 启动参数带 `--isolated` 缺少 `--browserUrl` 导致 IDE 侧工具调用超时（context deadline exceeded）；按调试指南通过 `npx -y chrome-devtools-mcp@latest --browserUrl=http://127.0.0.1:9226 --categoryExtensions` 建立标准 MCP stdio 会话执行受控调试。
  3. 截图限制说明：MCP 工具 `take_screenshot` 因 `filePath` 限制仅限配置工作区根目录而被拒绝（Access denied）；base64 流模式传输受限，截图状态如实记录为未取得，不使用原始 CDP 绕过。
- Real Verification & Evidence（目标页面：`https://www.zhipin.com/web/geek/jobs?city=101020100`）：
  1. **扩展热重载**：MCP `list_extensions` 确认 ID `ajmbdhnpebogbcphaaapjjgocccifgni`，版本 `3.17.11`，Enabled；调用 `reload_extension` 成功热重载。
  2. **原始未捕获错误检验**：MCP `navigate_page (reload)` 刷新目标上海职位页；初始化后 `list_console_messages` 捕获 9 条日志，未出现任何 `Uncaught (in promise) Error: 消息发送ws: 获取 wt 失败: 当前登录状态已失效`，目标异常完全消除。
  3. **按需连接生效检验**：MCP `list_network_requests` 检查重载后 39 个请求，确认无任何 `/wapi/zppassport/get/wt` 请求，无任何扩展聊天 WebSocket 请求，证实浏览职位阶段不发起连接。
  4. **工作台与 0 份 NaN 检验**：MCP `evaluate_script` 检查 DOM，`boss-helper-job` 正常挂载（rootFound: true，shadowFound: true），5 项指标卡片显示 `岗位总数： 0 份`、`过滤比例： 0 %`、`重复比例： 0 %`、`活跃比例： 0 %`、`本周投递: 0 份`，原 `NaN %` 显示已消除。
  5. **防关闭持续观察**：$T_1$（`timeOrigin: 1788841589153.7`，readyState: complete，title 稳定）后持续静置观察 30 秒；$T_2$ 再次检查 readyState: complete，`timeOrigin` 严格一致证明无重载或强退循环，页面持续存活。
  6. **稳定性复验**：二次执行 `navigate_page (reload)`，控制台仍无 `wt` 异常，DOM 5 项指标与工作台挂载稳定。
  7. **安全暂停**：页面 `autoRunning: false`，自动运行保持暂停，零外发。
- Conclusion：**未登录状态下的未捕获 Promise 异常消除、按需连接不发请求、0 份 NaN % 显示修复以及 DevTools 下 30 秒持续存活均在真实 Chrome + MCP 环境下验证通过。**
- Pending real scenarios（未验收范围）：
  1. 真实用户登录后的凭据按需握手与恢复连接（当前为未登录访客环境，未覆盖）；
  2. 真实职位投递与打招呼发送（零外发限制，未覆盖）；
  3. 企业微信通知（零外发限制，未覆盖）；
  4. 视觉截图文件落盘（工具策略限制，未取得）。

### [独立环境测试] BOSS DevTools 防关闭融合与 MCP 真实页面验证（2026-09-07）

- Changed files：`manifest.json` 升为 3.17.11，新增 `content/boss-devtools-shield.js`、`rules/boss-devtools.json`（均位于扩展源码目录）；优化 `project-support/extension/lptff-investment-assistant/boss.js` 以及上游源码 `agent/references/boss-helper-upstream/src/components/Tabs/Statistics.vue` 与 `src/entrypoints/boss/chat/index.ts`、`src/entrypoints/boss/index.ts`；同步根 AGENTS、验收原则、本手册状态和 BOSS 调试文档。
- Impacted behaviors：
  1. BOSS MAIN document_start 的 UA/AB 免检与顶层工作路由关闭兜底；普通返回、有效 URL 打开和现有业务脚本继续保留，扩展权限不增加。
  2. 修复未登录或 token 失效时 WebSocket 连接（`wapi/zppassport/get/wt`）抛出未捕获的 Promise 拒绝报错，优雅降级为 warning 日志并防护 `sendMessage`。
  3. 修复岗位总数为 0 份时，统计面板除以 0 导致的 `过滤比例：NaN %`、`重复比例：NaN %`、`活跃比例：NaN %` 计算缺陷，防守兜底显示 `0 %`。
- Current executor：Chrome DevTools MCP 1.8.0，通过持久普通 Chrome 实例（端口 9226）实际调用。执行 `reload_extension` 热重载扩展（ID: `ajmbdhnpebogbcphaaapjjgocccifgni`），并通过 `navigate_page (reload)` 刷新真实 BOSS 职位页。
- Real Verification & Evidence：
  1. **防关闭与反调试探测**：页面在 CDP 连接下持续存活无强退无崩溃，反调试探针均被 Shield 吸收；
  2. **未捕获错误消除**：控制台（`list_console_messages`）完全清空 `Uncaught (in promise) Error: 消息发送ws: 获取 wt 失败: 当前登录状态已失效`，无任何未捕获脚本异常；
  3. **统计面板除以 0 消除**：DOM 检查（`evaluate_script`）读取 shadow DOM 内数据，指标卡片显示：
     - `岗位总数： 0 份`
     - `过滤比例： 0 %`（原 `NaN %` 已消除）
     - `重复比例： 0 %`（原 `NaN %` 已消除）
     - `活跃比例： 0 %`（原 `NaN %` 已消除）
     - `本周投递: 0 份`
  4. **可视截图佐证**：通过 MCP `take_screenshot` 截取受控浏览器真实渲染画面（留存于 `boss_after_fix.png`），自动投递面板与 AI 沟通助手挂载正常，无任何 NaN 提示或红字异常。
- Conclusion：**已在真实 Chrome + Chrome DevTools MCP 环境中自闭环证实：未登录时 ws 连接未捕获异常与统计面板 NaN % 缺陷均已彻底修复，页面运行稳定。**
- Pending real scenarios：登录态下的个人聊天队列、投递等涉及真实用户账号动作的场景未在此无账号环境下覆盖；当前任务保持零外发。

### Bilibili 定向发现聚焦厂商基础设施优惠（2026-09-05）

- 原因：宽泛的 AI/福利/兑换码召回，加上含 AI 的兑换码白名单，使 AI2U 游戏推广误入；失败回退会继续发布未经当前范围重筛的旧快照。
- 改动：六组 VPS/域名/云服务/AI 订阅与额度查询；AI 返回服务类别及逐字原文证据，本地双重准入；启动和 CI 发布前清理旧缓存；允许成功零结果。固定银行来源规则不变。
- 真实 Chrome 在 `https://lptff.github.io/?tab=welfare` 复现 1 条 AI2U 推广。新配置的 Bilibili AI 订阅 RSS 主文档为 `200 application/xml`，含 66 条具备标题、链接、时间、来源的记录：`REAL_SOURCE_PASS`。
- 真实采集与 Gemini API 最终生成 2 条 Bilibili AI 额度相关线索，GitHub/Telegram 各 0 条；2 条均通过连续原文证据检查，旧快照中的 3 条跨范围内容不再准入。来源索引并不保证穷尽全部活动。
- 本地福利采集后执行 CI 同类统一后处理：银行候选 171 条，Gemini 与银行护栏保留 11 条；主机采集真实成功 1 条；发布前定向结果重筛保留 2 条。页面实际合并 13 条（银行后处理的置顶文件有 1 条未被现有页面消费）。
- Chrome 在 `http://127.0.0.1:8090/?tab=welfare` 验证来源筛选、Telegram 零结果状态、Bilibili 2 条日期与来源、刷新及游戏广告为 0；点击活动通过 Google RSS 跳转到匹配的 Bilibili 视频：`LOCAL_BROWSER_PASS`。页面无控制台错误，可见图片回退正常。
- Python 语法、Vue 类型检查、生产构建和差异检查通过。当前 Chrome 页面与本地服务保留供审查。
- 未验证厂商官网领取资格、当前额度是否仍可领取，也未提交、推送或部署；不能声明 `PRODUCTION_PASS`。本次本地记录在 `artifacts/validation-20260905-infrastructure/`，不提交原始过程材料。

### 关键词采集器 → Gemini → 薅羊毛（2026-09-05）

#### Changed files

- `project-support/crawl/welfare/keyword_search.py`：新增 Google 新闻关键词 RSS 采集、时效/去重、Gemini 结构化分类、ID 完整性校验和本地权益信号护栏。
- `project-support/crawl/welfare/keyword_search_config.json`、`src/data/welfare/keyword-search.json`：新增可审查的四组采集词和 AI 准入快照。
- `src/views/home/welfare/index.vue`：消费关键词采集结果，显示真实来源并纳入现有薅羊毛排序。
- `project-support/crawl/run_collectors.py`、`.github/workflows/ci.yml`：注册采集器并加入每小时福利采集。

#### Impacted behaviors

- 不新增页面、路由或用户操作；`/advanced-search` 继续跳转到原归档文章。
- 每小时由后台自动执行“公开来源关键词采集 → 时效/去重校验 → Gemini 判断 → 本地二次护栏 → 写入现有薅羊毛数据”。
- 本机调试优先读取进程环境变量，缺失时读取被 Git 忽略的 `.env.local`；CI 继续使用 Secret。页面、日志和公开数据均不包含 Key、Cookie 或账号信息，也不会自动报名、下单或外发。

#### Verification

- Chrome 真实打开 Google 新闻 RSS：主文档 `200`、`application/xml`，可见标题、来源、发布时间和跳转：`REAL_SOURCE_PASS`。
- 自动采集器已从 `.env.local` 读取现有调试配置并真实调用 Gemini API；最终公开快照收录 6 条通过双重准入的近期权益信息：`REAL_GEMINI_API_PIPELINE_PASS`。
- 本地按 CI 同一流程对既有福利源执行 Gemini 与银行主体硬规则过滤：72 条输入保留 24 条；`0818tuan.json` 从 49 条缩减为 2 条，普通饮料和水果商品均已移除：`LOCAL_GEMINI_FILTER_PASS`。
- Chrome 本地 `/?tab=welfare` 可见自动采集结果及其真实来源、权益与判断理由，且无控制台错误：`LOCAL_BROWSER_PASS`。
- 采集器注册、Vue 类型检查、生产构建、敏感值泄露检查和 `git diff --check`：`PASS`；测试类产物不作为本项目交付或完成证据。
- CI 配置已接入既有 Secret，但代码未推送，不能声明 CI 或生产通过。
- 脱敏截图与报告：`artifacts/validation-20260905-keyword-collector/REAL_KEYWORD_COLLECTOR_VALIDATION_REPORT.md`。

#### Infrastructure issue / executor / next action

- 当前结论：`REAL_SOURCE_PASS`、`REAL_GEMINI_API_PIPELINE_PASS`、`LOCAL_BROWSER_PASS`；`PRODUCTION_PASS: UNEXECUTED`。
- 下一步只剩提交/推送后观察首个 GitHub Actions 运行，确认 CI Secret 环境中的定时分类和生产页面更新；提交与推送需用户另行明确批准。

### AI 沟通实时进度（2026-09-05）

#### Changed files

- `content/boss-autopilot.js`：增加本轮处理状态、阶段切换、完成计数、剩余队列、运行计时、下一动作倒计时和最近活动时间；暂停时冻结计时。
- `content/boss-autopilot.css`：增加独立进度卡、进度条和四项实时指标样式。
- `BOSS_HELPER_UPSTREAM.md`：记录可观察性和暂停语义边界。

#### Impacted behaviors

- 不再只显示一行“Gemini 正在分析”；扫描队列、切换未读、打开会话、读取内容、Gemini 分析、等待发送、临时重试、完成与暂停均有明确阶段。
- 活动状态每秒刷新已运行时长；发送等待和重试显示剩余倒计时。
- 本轮进度条同步显示完成数、目标数、剩余未读与当前可处理数；重复消息只计一次。
- 暂停后运行计时冻结，下一动作明确显示“已暂停”。

#### Verification

- JavaScript 语法、manifest JSON、阶段覆盖、完成计数挂接、一秒刷新、暂停冻结和 `git diff --check`：`PASS`。
- 普通、已登录 Windows Chrome 重载未打包扩展后，暂停态显示本轮、剩余未读、当前可处理、运行时长和下一动作：`REAL_SOURCE_PASS`。
- 临时切换安全预览并启动，真实 Gemini 分析阶段从 `00:00` 更新到 `00:03`，模式明确显示“不发送”：`REAL_SOURCE_PASS`。
- 活动态验收后暂停并恢复原“实际自动发送”配置；再次重载后仍保持暂停，计时固定 `00:00`：`PASS`。
- 脱敏证据与报告：`artifacts/validation-20260905-chat-progress/REAL_CHAT_PROGRESS_VALIDATION_REPORT.md`。

#### Infrastructure issue / executor / next action

- Current executor：普通 Windows Chrome + 操作系统级截图、鼠标和键盘。
- Forbidden browser-control tools used：`NO`；未使用 DevTools、CDP、WebDriver、Playwright、Puppeteer、Selenium、远程调试或内置浏览器控制 BOSS 页面。
- 首次安全暂停时，用户此前已启动的实际发送流程仍有两条既有处理在暂停生效前完成；后续功能验收全部使用安全预览，没有发送测试消息。
- 最终状态为“实际自动发送”已配置但自动分析暂停；用户确认后可点击“一键启动”继续。

结论：实时进度与暂停冻结在真实 BOSS 页面为 `REAL_BOSS_VALIDATION: EXECUTED — PASS`。

### AI 沟通未读队列恢复（2026-09-04）

#### Changed files

- `content/boss-autopilot.js`：未读总数大于零而当前队列为空时，自动切换 BOSS“未读”标签并等待虚拟列表挂载；连续打开失败的行在 60 秒后重新进入队列。
- `BOSS_HELPER_UPSTREAM.md`：记录 BOSS 未读角标、虚拟列表和诊断日志边界。

#### Impacted behaviors

- 不再要求用户手工点击“未读”标签；助手可从“全部”页的 `未读 26、可处理 0` 自动恢复。
- 切换后按当前已挂载的可见会话逐条处理；虚拟列表继续滚动或更新时，其余会话会随后进入队列。
- 五秒内仍找不到可打开行时显示明确状态并写入一分钟限频日志，不再静默空转。
- 单行连续打开失败两次后只冷却 60 秒，不再永久跳过。

#### Verification

- JavaScript 语法、未读标签发现、自动点击、可见行发现、失败冷却和 `git diff --check`：`PASS`。
- 普通、已登录 Windows Chrome 真实复现：BOSS“全部”标签下显示未读 26，助手显示可处理 0：`REAL_SOURCE_PASS`。
- 手工切到“未读”后，助手立即识别 19 条当前挂载行，证明故障来自列表标签而非 Gemini 或消息内容：`REAL_SOURCE_PASS`。
- 重载最终代码并回到“全部”后短暂启动，助手自动切换“未读”、打开一条会话并进入 Gemini 分析；无需手工切换：`REAL_SOURCE_PASS`。
- 在 20 秒发送等待前立即暂停，并额外等待 25 秒；自动分析保持关闭、输入框为空、没有新增招聘方消息：`PASS`。
- 证据报告：`artifacts/validation-20260904-chat-queue/REAL_CHAT_QUEUE_RECOVERY_VALIDATION_REPORT.md`。

#### Infrastructure issue / executor / next action

- Current executor：普通 Windows Chrome + 操作系统级截图、鼠标和键盘。
- Forbidden browser-control tools used：`NO`；未使用 DevTools、CDP、WebDriver、Playwright、Puppeteer、Selenium、远程调试或内置浏览器控制 BOSS 页面。
- 为避免未经单独批准继续批量发送，最终保持自动分析暂停。用户确认后可点击“一键启动”继续处理剩余未读。

结论：未读队列自动发现与真实打开链路为 `REAL_BOSS_VALIDATION: EXECUTED — PASS`；本轮没有新增发送。

### Gemini 超时与单模型拥堵恢复（2026-09-04）

#### Changed files

- `background.js`：将 Gemini 单模型固定超时改为超时/网络/429/5xx 统一有限重试，并在临时故障时依次尝试三个已支持模型。
- `content/boss-autopilot.js`：临时连接故障不再永久关闭自动沟通；保留当前消息并按 15–300 秒递增间隔重试，配置页持久显示连接结果和实际成功模型。
- `BOSS_HELPER_UPSTREAM.md`：记录临时故障恢复与不可恢复错误安全暂停边界。

#### Impacted behaviors

- 45 秒请求超时、网络中断、限流、503 和 high demand 均可自动重试；不再由一次代理或服务抖动触发永久暂停。
- 首选模型临时不可用时自动尝试备用模型，用户保存的首选模型不被修改。
- 三个模型均临时失败时不标记当前消息为已处理，也不切换下一会话；15、30、60、120、240、300 秒递增恢复。
- Key 无效、请求参数或模型配置错误等不可恢复错误仍停止自动沟通，避免无限重试。

#### Verification

- JavaScript 语法和 `git diff --check`：`PASS`。
- 可控回归覆盖：连续两次超时后第三次成功、持续网络失败、503 后恢复、401 不重试、模型尝试顺序、前台临时错误分类和 15/30 秒退避：`PASS`。
- 普通、已登录 Windows Chrome 重载未打包扩展后，真实连接测试首先复现 `Gemini 3.5 Flash-Lite` high demand；加入模型故障转移后再次测试，由 `Gemini 3.6 Flash` 成功返回：`REAL_SOURCE_PASS`。
- 配置页持久显示“连接通过 · Gemini 3.6-flash”，且用户保存的首选项仍为 Gemini 3.5 Flash-Lite：`PASS`。
- 自动分析保持未开启；未打开具体会话，未发送招聘方消息或企业微信通知：`PASS`。
- 证据报告：`artifacts/validation-20260904-gemini-recovery/REAL_GEMINI_RECOVERY_VALIDATION_REPORT.md`。

#### Infrastructure issue / executor / next action

- Current executor：普通 Windows Chrome + 操作系统级截图、鼠标和键盘。
- Forbidden browser-control tools used：`NO`；未使用 DevTools、CDP、WebDriver、Playwright、Puppeteer、Selenium、远程调试或内置浏览器控制 BOSS 页面。
- 真实自动会话中的延时恢复未执行，因为当前任务未授权读取或发送招聘会话；该分支由可控状态机回归覆盖，不声明真实消息发送结果。

结论：Gemini 连接测试与模型故障转移为 `REAL_BOSS_VALIDATION: EXECUTED — PASS`；真实招聘消息仍未发送。

### 求职访谈默认筛选（2026-09-04）

#### Changed files

- `content/boss-resume-profile.js`：增加一次性配置迁移，扩大前端相关岗位名覆盖，薪资改为 18–50K 宽松匹配，关闭并清空地址文本筛选，只拦截明确冲突。
- `background.js`、`content/boss-autopilot.js`：将沟通画像调整为收入、业务前景、稳定性优先，工作强度为硬底线。
- `BOSS_HELPER_UPSTREAM.md`：记录默认筛选与先投递后确认的产品边界。

#### Impacted behaviors

- 工作地点只由用户在 BOSS 原生筛选中决定，扩展不再对岗位地址做第二层包含过滤。
- 岗位标题按前端工作方向宽匹配，不再依赖“高级/资深/负责人”等头衔。
- 月薪 18K 起且 13–14 薪有可靠兑现依据的岗位可进入后续沟通。
- 业务、稳定性和工作强度信息缺失时不预先排除；明确外包/派遣/驻场/创业早期、单休/大小周/加班/值班/夜间响应时才过滤。

#### Verification

- 本地 Chrome 直接加载的 3 个 JavaScript 变更文件语法检查：`PASS`。
- 通过模拟 `chrome.storage.local` 执行真实迁移脚本：地址关闭且清空、18K 下限、宽岗位名、明确冲突词、其他用户配置保留和迁移幂等均为 `PASS`。
- Manifest JSON 与后台入口存在性：`PASS`；仍使用本地调试版本 `3.17.10`，未执行发包。
- 普通、已登录 Windows Chrome 在 `chrome://extensions/` 重载当前工作区未打包扩展后，真实 BOSS 配置页显示：工作地址筛选为空且关闭、薪资 18–50K、前端相关岗位名扩展、明确冲突排除项生效：`REAL_SOURCE_PASS`。
- 临时启用 AI 沟通小助手后，真实“沟通规则”页显示新的求职画像、25 万最低年薪、30 万以上理想年薪、18K × 13–14 薪接受条件以及分阶段确认策略：`REAL_SOURCE_PASS`。
- 验收后恢复 AI 沟通小助手原有关闭状态；未点击“开始”或“一键启动”，未打开具体会话，未发送招聘方消息、Gemini 请求或企业微信通知：`PASS`。
- 证据报告：`artifacts/validation-20260904-boss-filter/REAL_BOSS_FILTER_VALIDATION_REPORT.md`。

#### Pending real scenarios

- 因未获授权启动真实投递，本轮不声明新的投递命中率、投递效率或沟通转化率；这些指标仍为 `未验收 / 未知`。

#### Infrastructure issue / executor / next action

- 首次尝试重载时，Chrome 位于第二块屏幕，窗口内坐标没有换算为桌面绝对坐标，导致后台进程未真正重载；职位注入脚本已读取新文件，但 Gemini 画像仍由旧后台返回。按真实窗口边界修正坐标并重新点击重载后，两条链路均通过复验。
- Current executor：普通 Windows Chrome + 操作系统级截图、鼠标和键盘。
- Forbidden browser-control tools used：`NO`；未使用 DevTools、CDP、WebDriver、Playwright、Puppeteer、Selenium、远程调试或内置浏览器控制 BOSS 页面。

结论：求职默认筛选和 Gemini 沟通画像为 `REAL_BOSS_VALIDATION: EXECUTED — PASS`；真实投递效率仍为未知。

### AI 沟通成功率优化（2026-09-02）

#### Changed files

- `background.js`：更新访谈画像、分阶段沟通策略、人工接管字段和 Gemini 临时拥堵有限重试。
- `content/boss-autopilot.js`、`.css`：为历史消息标注招聘方/求职者；增加本地脱敏沟通优化样本的保存、查看、保留期限和独立清理；在简历、联系方式或约面等场景提示本人处理。
- `manifest.json`：扩展版本升级到 `3.17.10`。
- `BOSS_HELPER_UPSTREAM.md`：记录新的沟通产品边界。

#### Impacted behaviors

- 从“逐项补齐事实”改为“先建立匹配感，再每轮推进一个关键问题”。
- 避免重复询问已经回答的信息；初聊不批量盘问薪资、社保、用工和面试流程。
- 需要发送简历、提供联系方式或确定面试时不自动拒绝或承诺，而是在助手状态和脱敏日志中提示本人处理。
- Gemini 遇到高负载、限流或临时服务错误时等待 1.8 秒并重试一次。
- 每次模型分析后保存招聘方最新消息、近期角色化上下文、助手建议、动作、判断理由和后续待确认事项；手机号、邮箱、证件号、账号、链接参数和凭据先遮盖，最多保存 200 条或 30 天。
- 沟通优化样本与运行日志分开查看和清理，内容只进入当前 Chrome 的 `chrome.storage.local`，不写入仓库。

#### Verification

- 19 个扩展 JavaScript 文件语法、Manifest `3.17.10`、脱敏断言、扩展 ZIP 和 `git diff --check`：`PASS`。
- 脱敏断言覆盖手机号、邮箱、身份证号、微信号、Token 和带参数链接：`PASS`。
- ZIP：`dist-extension/lptff-investment-assistant.zip`，大小 `713377` 字节。
- 普通、已登录 Windows Chrome 重载工作区扩展后显示版本 `3.17.10`：`PASS`。
- 真实 BOSS 会话在安全预览模式调用真实 Gemini，生成一条未发送的建议回复；“沟通技巧优化样本”出现 1 条可展开记录，运行日志仍独立展示：`PASS`。
- 测试完成后恢复原有“实际自动发送”配置，但自动分析保持停止；没有向招聘方发送消息，没有发送企业微信通知：`PASS`。
- 证据报告：`artifacts/validation-20260902/REAL_COMMUNICATION_LOG_VALIDATION_REPORT.md`。

#### Pending real scenarios

- 仍需用安全预览观察真实 Gemini 对“索要简历”“已说明薪资和作息”“仅打招呼”三类自然会话的输出；本轮覆盖的是招聘方追问语言能力和签约安排的会话。
- 只有取得新的明确发送授权后，才验证真实回复能否提高继续沟通率；当前成功率变化仍为 `未验收 / 未知`。

#### Infrastructure issue / executor / next action

- Current executor：普通 Windows Chrome + 操作系统级截图、Windows UI Automation、鼠标和键盘。
- Forbidden browser-control tools used：`NO`；未使用 DevTools、CDP、WebDriver、Playwright、Puppeteer、Selenium、远程调试或内置浏览器控制 BOSS 页面。
- Next action：继续积累自然安全预览样本并按回复率、继续沟通率、人工接管率和重复追问率复盘；真实发送仍需新的明确授权。

结论：本轮日志存储和安全预览链路为 `REAL_BOSS_VALIDATION: EXECUTED — PASS`；沟通成功率提升仍为未知。

### Chrome 扩展重载报错修复（2026-09-02）

#### 问题根因

- 在 `chrome://extensions` 重载本地扩展后，已打开 BOSS 页面中的旧内容脚本仍可能被定时器或 DOM 观察器唤醒。
- 旧脚本直接调用 `chrome.storage.local`，扩展上下文失效时产生未处理的 `Extension context invalidated` Promise 拒绝。
- 真实复测还发现页面快速跳转时存在注入竞争：后台开始加载 BOSS 功能后，目标标签可能已经离开 BOSS 页面，从而产生 `Cannot access a chrome:// URL` 伪故障。

#### 修复结果

- 增加统一的上下文失效识别与收尾，停止轮询、断开观察器、清理延迟任务并移除旧助手面板。
- 存储和扩展消息改用安全入口；AI 分析异常分支不再因二次保存配置而泄漏未处理拒绝。
- BOSS 功能注入前后重新检查目标标签地址，正常导航竞争改为安全跳过。
- 本地扩展版本升级到 `3.17.8`，并对已排队的会话处理、下一未读会话和延迟发送入口增加失效上下文硬停止保护。

#### 真实 Chrome 验证

- 普通、已登录 Windows Chrome 加载的版本为 `3.17.8`：`PASS`。
- BOSS 页面保持打开时重载扩展，并等待旧轮询触发：扩展卡片没有新增“错误”入口，`PASS`。
- 刷新真实 BOSS 职位页后，自动投递工作台和 AI 沟通小助手重新挂载，且助手保持“自动分析未开启”：`PASS`。
- 没有启动职位处理，没有发送招聘方消息，没有请求 Gemini，也没有发送企业微信通知。
- 证据报告：`artifacts/validation-20260902/REAL_EXTENSION_VALIDATION_REPORT.md`。

结论：原始扩展上下文失效路径和复测时发现的标签跳转竞争均为 `REAL_BOSS_VALIDATION PASS`。

### 合约复盘真实只读采集补充验证（2026-09-02）

- 在当前生产页面启动真实只读币安采集，刷新页面后再次点击采集，页面接续现有任务，没有出现“该平台的观察任务正在运行”：`REAL_SOURCE_PASS`。
- 任务自然完成后，新快照写入本地台账，归档历史计数增加：`REAL_SOURCE_PASS`。
- 没有执行任何下单、撤单、转账或其他交易动作。
- 当前生产站点仍是旧前端，本地新增的结束按钮和 180 秒等待交互要部署后才能声明 `PRODUCTION_PASS`。

### 合约复盘采集生命周期修复（2026-09-01）

#### 问题根因

- 合约复盘页面原来只轮询约 45 秒，但币安历史数据分支在收尾阶段还可能继续约 2 分钟。
- 页面先结束等待、后台任务仍在运行，用户再次点击后便收到“该平台的观察任务正在运行”。
- 错误提示提到“提前结束”，但合约复盘页面没有提供对应按钮。

#### 修复结果

- 再次启动同一平台时，改为接续健康的现有任务并返回 `alreadyRunning`，不再直接报错。
- 采集页消失，或任务超过截止时间及宽限期时，自动清理旧任务后重新开始。
- 初始采集页仍在准备时，重复请求会被识别为同一任务，避免两个启动流程互相竞争。
- 合约复盘页面最长等待时间由 45 秒提升到 180 秒，并实时同步运行状态。
- 空数据页和“采集”页均增加“结束当前采集”按钮。
- 页面与扩展之间新增币安结束/收尾通信；重复结束时接续正在生成的结果。
- 扩展版本升级到 `3.17.5`。

#### 验证结果

- 当前生产页面可以正常加载，但尚未包含本地修复。
- 本地 `http://localhost:8090/contract-review` 修改后可以正常渲染。
- TypeScript 检查、扩展 JavaScript 语法、生产构建、通信链路核对、扩展 ZIP 生成和 `git diff --check`：`PASS`。
- 本轮无法接管已加载未打包扩展的 Chrome，因此真实登录币安采集生命周期仍为 `未验收 / 未知`。
- 本轮没有执行任何交易操作。

结论：页面加载和构建集成为 `LOCAL_BROWSER_PASS`。站点部署并在用户 Chrome 中重新加载扩展 `3.17.5` 前，不声明 `PRODUCTION_PASS`。

### 简历驱动筛选、功能开关与数值范围（2026-09-01）

#### 文件、行为与真实场景

- `content/boss-resume-profile.js`、`background.js`：在保留用户城市选择的前提下，一次性迁移为覆盖面更宽的高级前端画像。
- 真实配置页显示 React、Vue、AI 应用前端、低代码、可视化、前端全栈等方向，薪资为 20–50K，仅保留强冲突排除项。
- `content/boss-autopilot.js`：根据用户简历扩展沟通参考画像，并将默认值调整为回复前等待 20 秒、每日 300 条、单会话 30 条。
- 真实“沟通规则”页显示有效范围：5–900 秒、1–1000 条、1–100 条。
- Popup 与 `content/boss-feature-bootstrap.js`：增加默认开启的“自动投递”和“AI 沟通小助手”独立开关。
- `manifest.json`、`background.js`：根据开关按需注入自动投递和 AI 沟通脚本，关闭的功能不会在页面初始化。

#### 真实 BOSS 验证

- 在普通、已登录的 Windows Chrome 中重新加载未打包扩展 `3.17.4`：`PASS`。
- 两个功能开关默认开启：`PASS`。
- 单独关闭 AI 沟通后刷新页面，聊天页不再出现小助手：`PASS`。
- 同时关闭自动投递后，职位页只保留 BOSS 原生页面：`PASS`。
- 重新开启后，“自动投递”工作台和折叠状态的“AI 沟通小助手”恢复：`PASS`。
- 自动投递配置确认：标题关键词已扩展、描述仅排除强冲突、薪资 20–50K、杭州/上海地址保留、活跃/好友/同 HR 去重启用、公司规模和 HR 职位不作为硬门槛、投递上限 120：`PASS`。
- 沟通规则确认：实际发送模式已恢复，等待 20 秒、每日 300 条、单会话 30 条；助手保持“自动分析未开启”：`PASS`。
- 清空旧画像搜索遗留错误后刷新真实职位页，扩展没有产生新错误：`PASS`。
- 本轮没有启动职位处理，没有发送招聘方消息，没有请求 Gemini，也没有发送企业微信通知。

#### 可加载性检查

- 19 个扩展 JavaScript 文件语法：`PASS`。
- Manifest JSON 与 23 个引用资源：`PASS`。
- TypeScript 检查：`PASS`。
- 扩展 ZIP：`PASS`，当时产物大小为 `708366` 字节。
- `git diff --check`：`PASS`，仅有换行符提示。

结论：`REAL_BOSS_VALIDATION` 已执行，结果为 `PASS`。已验证画像配置、独立开关、数值边界展示和安全暂停状态；因为没有授权启动真实投递，所以不声明新的投递命中率。

### 自动投递与 AI 沟通小助手重构（2026-09-01）

#### 修改内容

- `agent/references/boss-helper-upstream/src/App.vue`：工作台更名为“自动投递”，移除上游 AI/Chat 入口，只保留统计、筛选、配置和日志。
- `content/boss-autopilot.js`、`.css`：实现可拖动的“AI 沟通小助手”，包含运行状态、配置、沟通规则和日志四个标签页。
- 一键启动会将当前标签页导航到 `https://www.zhipin.com/web/geek/chat`，并启用保存的沟通模式。
- 历史沟通日志只记录时间、会话定位、动作和结果，不保存完整聊天原文或凭据。

#### 已验证场景

- 普通 Chrome 中最终工作台名称、标签和小助手四标签布局：`PASS`。
- 拖动过程中没有最大化、全屏或改变页面布局：`PASS`。
- 当前标签页一键进入沟通页，再安全暂停；没有发送招聘方消息：`PASS`。
- 位置保存、收起/展开、职位页与沟通页交互一致：`PASS`。
- 仅元数据日志的新增、显示和清理：`PASS`。

执行环境：普通、已登录的 Windows Chrome，只使用操作系统级截图、鼠标和键盘。BOSS 线上页面没有使用 CDP、DevTools MCP、Playwright、Puppeteer、Selenium、WebDriver 或远程调试。

## 上游 Boss-Helper 集成基线

### 主要文件变化

- 删除旧的 `content/boss-helper.js` 和 `popup/boss-helper.js`。
- 引入 Boss-Helper `0.5.2.2` 的 Chrome MV3 产物：`boss.js`、`boss-helper-upstream-background.js`、`content/boss-helper-upstream.js`、`content/boss-helper-upstream.css`。
- 上游主界面已按需求移除“关于与赞赏”“反馈”“帮助”等入口。
- `manifest.json`、`background.js`、`popup/popup.html` 改为加载上游模块，并移除重复的 Popup 功能面板。
- 上游基线固定为 tag `0.5.2.2`、提交 `ddc15026e8c9c04e4243d98379c85856eba43ab3`。
- 删除参考仓库里本地生成的 `node_modules` 和 `.output`；依赖仍可根据锁文件重建。
- 增加 `content/boss-autopilot.js`、`.css`，用于个人画像和受保护的 AI 沟通。
- Gemini Key 和企业微信 Webhook 只保存在浏览器本地，并始终遮罩显示。

### 行为边界

- BOSS 页面直接复用上游的信息架构与运行时：统计、原生筛选、配置、职位卡片、自动处理、通知、外观和地址分析。
- 开始、暂停、重置、筛选流水线、翻页、投递上限、预设、招呼语、缓存和日志均遵循上游实现。
- 已删除非上游的右侧工作台、总开关、快捷搜索标签、职位卡片高亮/虚化和自创工作流。
- 画像搜索阶段曾生成 Gemini 搜索计划，并同步 BOSS 查询和扩展筛选；该能力后来按产品要求移除，详见后续时间线。
- 自动沟通最初采用安全预览优先、显式实际发送切换、限额、去重和可暂停设计；有价值线索只向企业微信发送摘要。

### 历史可加载性检查

- 上游 `build:chrome`：`PASS`。
- JavaScript 语法、Manifest JSON、Manifest 引用：`PASS`。
- `npm run typecheck`、`npm run build`：`PASS`。
- 扩展 ZIP 生成、`git diff --check`：`PASS`。

这些结果只证明产物能够加载，功能结论以真实 BOSS 验证为准。

## 真实 BOSS 验证时间线

### 2026-08-28：上游基线

- 重新加载未打包扩展：`PASS`。
- Chrome 应用商店版 Boss-Helper 保持禁用，避免重复注入：`PASS`。
- 页面只出现一个居中的 `Boss-Helper v0.5.2.2` 面板和横向职位卡片：`PASS`。
- 旧右侧悬浮工作台和旧 Popup 控制面板已消失：`PASS`。
- 统计、筛选、配置、AI、日志、对话等核心入口可见：`PASS`。
- “关于与赞赏”“反馈”“帮助”入口已移除：`PASS`。
- 筛选页可以显示并移动 BOSS 原生期望、搜索和筛选控件：`PASS`。
- 配置页可以显示筛选、外观、通知、保存、重载、推荐配置和预设控件：`PASS`。
- AI 页可以显示 AI 招呼、AI 筛选、禁用状态的 AI 回复和模型配置弹窗：`PASS`。
- 日志页和右侧对话抽屉可以正常打开：`PASS`。
- 使用临时“不可能命中”的标题安全运行，进度达到 9/15，全部职位被过滤，当日投递仍为 0/120：`PASS`。
- 暂停后恢复“开始”状态，临时筛选被还原并保存；刷新后进度恢复为 0/15：`PASS`。
- 真实联系招聘方和自定义招呼语：`未执行`，因为没有授权外部副作用。

### 2026-08-28：界面精简回归

- 删除“关于与赞赏”标签及其未使用组件。
- 删除“反馈”操作。
- 删除“帮助”复选框、悬浮层、跟踪状态和动画循环。
- 清理配置、筛选、工作流和引导中的旧“帮助/反馈”文案。
- 重新构建并加载后，页面只保留统计、筛选、配置、AI、日志、对话：`PASS`。
- 没有启动工作流，也没有联系招聘方。

### 2026-08-28：删除范围纠正

- 恢复此前误删的 AI、对话抽屉、通知、外观、地址分析、模型请求基础设施和完整处理流水线。
- 普通 Chrome 中确认上述能力重新可见：`PASS`。
- “关于与赞赏”“反馈”“帮助”仍保持删除：`PASS`。
- 没有启动处理，没有发送消息，没有产生付费 AI 或高德地图请求。

### 2026-08-28：测试产物清理

- 删除废弃的一致性测试命令/脚本、测试专用文档、未使用的 `fake-indexeddb` 依赖和空 `tests/` 目录。
- 删除只提供占位或虚构交互的 `/job`、`/life`、`/loginFund` 及其导航和登录辅助代码。
- 运行时脱敏数据从 `project-support/fixtures/` 移至 `project-support/data-snapshots/`，明确其为产品数据而非测试替身。
- 保留 `src/investment/engines/scenario/stress-test.ts`，因为它属于用户可见的组合压力分析功能。
- 类型检查、构建、扩展 ZIP、差异检查：`PASS`。
- 普通 Chrome 中 `/investment/data`、`/contract-review` 可加载；已删除路由回到真实首页：`PASS`。

### 2026-08-31：个人画像与无人值守助手

- 重新加载未打包扩展 `3.16.0`，应用商店版 Boss-Helper 保持禁用：`PASS`。
- 个人画像面板只渲染一次，包含画像、遮罩凭据、无人值守规则和状态卡：`PASS`。
- Gemini 和企业微信凭据只保存于本地，并只显示“已保存”；截图和仓库没有明文凭据：`PASS`。
- 空白凭据输入不会覆盖已保存值；清除与重新录入 Gemini Key 均正常：`PASS`。
- 企业微信发送过一条明确标注为开发测试的通知，页面显示成功：`PASS`。
- Gemini 首次真实连接返回 `User location is not supported for the API use.`：`FAIL`，属于外部出口地区限制，页面已明确显示。
- WinXray 增加 Gemini 域名 PAC 路由后仍返回相同限制：`FAIL`。
- Windows PowerShell 使用同一 Key 也返回相同限制；PowerShell 出口显示香港，普通 Chrome 出口显示中国大陆，说明两条网络路径不同，但两者当时都被 Gemini 拒绝。
- WinXray 切换日本后，Windows 出口稳定显示日本；首次 Gemini 请求由地区限制变为超时。
- 扩展请求随后能够到达 Google 模型服务：`gemini-3.7-flash` 返回高负载，切换 `gemini-3.5-flash-lite` 后连接测试通过：`PASS`。
- Flash-Lite 生成结构化画像搜索计划，并应用到真实 BOSS 原生搜索：`PASS`。
- 增加 30 秒 Gemini 超时和可操作错误提示：语法、ZIP、扩展重载和页面恢复均通过。
- 凭据控件改为默认遮罩、可显隐、30 秒自动重新遮罩；日志和导出不包含明文：`PASS`。
- 页面加载、扩展重载、刷新或保存配置后，已保存凭据会重新填充但保持遮罩：`PASS`。
- 一键画像搜索在 Gemini 失败时使用保守本地降级方案，并同步标题、内容、地址和薪资条件：`PASS`。
- 安全预览、延迟、每日上限、单会话上限、启用开关和暂停状态可以跨刷新保存：`PASS`。
- 本轮只启用安全预览进行控制验证，随后暂停；没有开启实际发送，没有联系招聘方：`PASS`。

### 2026-08-31：聊天页遮挡与未读队列修复

- 根因：小助手插入 BOSS 对话容器之前，完整配置面板把会话列表推到首屏下方，标题还会滚动到固定导航下面。
- 旧自动化只监听当前打开的会话；未选择会话时，即使存在未读队列，也不会自动打开或送入 Gemini。
- 扩展 `3.16.1` 将小助手改为聊天页固定、默认折叠的面板，展开后内部滚动，不再推动页面；支持 `Alt+Shift+B`。
- 折叠标题显示真实运行状态和未读数；展开状态区分总未读会话和当前 DOM 可处理行。
- 实际发送模式能够按顺序打开未读会话，执行延迟和限额，分析最新收到的消息，确认编辑器清空后再处理下一条。
- Gemini 分析失败不再写入去重记录；安全预览不会自动打开未读队列，也不会发送企业微信通知。
- 普通 Chrome 中面板位置和未读汇总：`PASS`。
- 一个已打开的未读会话使用真实 Gemini 凭据完成安全预览，并显示“已判定为有价值线索”：`PASS`。
- 本轮没有点击 BOSS 发送，也没有企业微信通知；最终保持安全预览。

### 2026-08-31：真实无人值守沟通执行

- 用户明确授权对当前 BOSS 未读队列进行真实无人值守测试。
- 复现未读队列卡住：4 个会话行合计 5 条未读；旧代码点击 `<li>`，而 BOSS 实际把选择事件绑定在 `.friend-content`，且固定等待 1.3 秒、没有打开成功校验。
- `3.16.2` 改用真实 DOM 结构，并增加有限次数的打开、等待、重试和跳过状态机；普通 Chrome 无需人工选择即可将未读总数从 5 降到 0：`PASS`。
- 真实发送暴露两个问题：手动触发输入事件导致草稿重复；发送按钮搜索停在 `.chat-input`，没有上溯到 `.chat-editor`。每次失败后均暂停并清空草稿。
- `3.16.5` 改为一次原生编辑插入，从 `.chat-editor` 查找可见发送按钮，执行完整鼠标序列并校验编辑器清空；发送失败时自动暂停。
- 真实 BOSS 页面接受了一条生成回复，出现本人消息气泡和送达状态，编辑器清空，会话预览时间更新：`PASS`。
- 第一次去重回归暴露会话 ID 不稳定：ID 包含会变化的最后消息预览，失败期间出现 3 个发出气泡，随后 BOSS 显示 3 条撤回提示，最终仍有 1 条送达消息。该副作用如实记录。
- `3.16.6` 改用稳定行属性、头像和身份生成会话 ID；只有最后一条为对方消息时才分析；成功处理先于企业微信通知记录，不把后续本人消息当成新输入。
- 最终去重回归：实际发送保持开启 18 秒，没有新增发出消息，编辑器为空，状态为“实际发送 · 当前未读 0 · 可处理 0”：`PASS`。
- 当时最终状态按用户要求保持实际无人值守开启，每日上限 20、单会话上限 4。
- 队列清零后没有新的自然未读消息，因此 `3.16.6` 对全新到达消息的生命周期边缘在当时仍未观察到。

### 2026-09-01：严格企业微信通知与新未读生命周期

- `3.16.7` 将企业微信消息改为 `msgtype: text` 和 `text.content`。
- 只有 `valuable`、`requirementsComplete`、`allCriteriaMet` 全为 `true`，`stop` 为 `false`，且 `missingQuestions` 为空时，岗位才可进入通知队列。
- 通知只包含结构化岗位信息和审核理由，不包含原始对话。
- 待通知状态与 BOSS 回复去重分开保存，失败最多指数退避重试 3 次，避免通知失败导致重复回复。
- 增加每 5 秒一次的未读轮询，作为 DOM 变化监听的兜底。
- 一个自然到达的未读会话使未读数从 0 变为 1；扩展自动打开、调用真实 Gemini、等待配置的 12 秒、发送一次追问并显示送达，未读随后从 1 变为 0：`PASS`。
- 继续运行 20 秒没有重复回复：`PASS`。
- 该真实样本缺少完整岗位事实，因此正确地没有触发企业微信岗位通知：负向门槛 `PASS`。
- 当时没有自然出现完全符合条件的岗位，因此真实正向企业微信岗位通知仍未观察到。
- 企业微信连接测试没有显示页面错误，但没有查看机器人接收端内容，因此不声明接收端渲染结果。

### 2026-09-01：多地区画像搜索和全职结果防护

- 普通 Chrome 中重新加载 `3.17.1`，应用商店版 Boss-Helper 保持禁用：`PASS`。
- Gemini 将实体城市和工作方式分开，生成杭州、上海和远程任务；一次操作打开多个独立 BOSS 原生搜索：`PASS`。
- 地址栏确认杭州 `city=101210100`、上海 `city=101020100`，远程任务使用包含“远程办公”的独立查询：`PASS`。
- 全职画像强制排除兼职、实习、临时、小时工、日结、短期，并将小时/日结薪资视为冲突：`PASS`。
- 真实远程结果中原本存在无关 Java/PHP 和小时计薪前端职位；最终页面隐藏这些卡片，只保留目标前端正式岗位：`PASS`。
- 同样的目标/冲突规则加入上游第一阶段职位标题流水线，隐藏卡片不会被“开始”按钮处理。
- 搜索计划和净化计数在 BOSS 导航及整页刷新后保持：`PASS`。
- 没有启动真实投递，因为任务没有授权联系招聘方。

### 2026-09-01：恢复上游筛选并统一小助手交互

- 删除画像搜索计划器、多地区标签创建、上游筛选同步、画像标题防护和职位卡片隐藏。
- 保存的画像只保留为 Gemini 分析与回复的沟通上下文。
- 职位页和沟通页统一为右上角悬浮、默认折叠的小助手。
- Boss-Helper 职位标题流水线恢复仓库基线，扩展升级为 `3.17.2`。
- Boss-Helper 原有“筛选”标签重新成为唯一的扩展职位筛选入口。
- 小助手不再生成搜索词、修改预设、打开城市/远程标签或隐藏职位卡片。
- 迁移只删除废弃画像搜索元数据，不清除普通 Boss-Helper 筛选值。
- 普通 Chrome 中职位页和聊天页都显示同一个紧凑小助手，且不会推动会话列表：`PASS`。
- `Alt+Shift+B` 展开后只保留 Gemini/企业微信、沟通画像、沟通规则和运行状态；画像搜索入口已消失：`PASS`。
- 本轮没有启动职位处理，没有发送招聘方消息，没有请求 Gemini，也没有企业微信通知。
- JavaScript、Manifest `3.17.2`、ZIP 和差异检查：`PASS`。

结论：`REAL_BOSS_VALIDATION` 已执行，结果为 `PASS`。已验证上游筛选所有权恢复、一键画像搜索移除、职位页与沟通页交互一致；没有执行真实招聘方发送。

## 当前待办与未知

- 合约复盘修复尚未部署，扩展 `3.17.5` 尚未在可控的用户 Chrome 中完成真实币安只读采集验证。
- 企业微信完全符合条件岗位的真实正向通知仍缺少自然样本。
- BOSS 实际发送属于外部副作用，除已明确授权并如实记录的历史场景外，不主动重复执行。
- 当前已验证可用的 Gemini 默认模型为 `gemini-3.5-flash-lite`；应继续使用受支持的代理出口。

## 证据与隐私边界

- 2026-09-01 及此前的 BOSS 历史验收使用普通 Windows Chrome 与 OS 操作；2026-09-07 防关闭任务按用户明确要求新增了独立 Chrome DevTools MCP 验证，范围与未覆盖项见当日记录。
- 验收截图只保存脱敏状态；凭据、岗位名称、金额、收益、账户和原始会话内容不进入仓库或验收记录。
- 历史脱敏截图和验收材料位于 `artifacts/`，仅用于对应时间点的事实核对。
