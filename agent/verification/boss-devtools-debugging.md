# BOSS 直聘 Chrome DevTools MCP 调试

本项目从扩展 3.17.11 起加入页面启动时的防关闭逻辑，供真实 Chrome 调试使用。它针对已知前端分支；是否能在当前 BOSS 版本、登录态和页面上工作，仍以实际观察为准。

## 来源与实现范围

参考来源是本机 `qinglongBackup/research/zhipin/`：`extension/inject.js`、`manifest.json`、`rules.json` 和 `anti-debug-analysis.md`。该文档描述 BOSS 的 `BZLFE` UA 白名单、`nd_result_13912_number_1.result === "QM&Lb"` 免检分支，以及关闭、回退、清空 DOM、重载和内存消耗路径。参考目录未包含被分析的原始站点包，不把文档描述当作当前线上版本已验证的事实。

本项目入口：

- `project-support/extension/lptff-investment-assistant/content/boss-devtools-shield.js`：静态 `MAIN` 世界、`document_start` 注入，覆盖匹配子框架和相关空白框架；追加 UA 标识、触点数设为 0，适配上述 AB 配置。
- `project-support/extension/lptff-investment-assistant/rules/boss-devtools.json`：向 BOSS 域名请求的 `user-agent` 追加标识，保持请求头与页面属性配合。
- 页面关闭兜底限定在顶层 BOSS `/web/geek/` 和 `/job_detail/` 路由；拦截关闭及空白 `_self` 打开，并只在同步惩罚链中拦截回退，普通返回继续交给浏览器。

适配保留其他 AB 字段和实例属性语义，不照搬参考扩展的全局 `history.back` 禁用、平台/`webdriver` 改写或 iframe 控制台静音。

## 真实 Chrome 环境层次与连接原则

**特别重要约定**：
- **真实 Chrome 环境定义**：明确指用户日常使用、已有日常扩展插件和真实登录状态的 Chrome 实例（通常为 `Default` 用户个人资料目录）。只有在该环境中取得的验证结果，才能标记为日常真实环境结论。
- **严禁独立配置冒充**：严禁自动为本任务新建独立的 Chrome 用户配置（如 `%LOCALAPPDATA%\LPTFF\BossChromeDebug` 或 `chrome-normal-profile`）并伪装为日常环境；在这些独立配置中运行的结果**必须且只能标记为“独立环境测试”**。
- **严禁数据复制**：严禁复制用户的 Cookie、登录资料或整个个人资料目录。
- **连接日常 Chrome**：
  1. 优先定位用户已在运行的日常 Chrome 窗口。
  2. 引导或检查日常 Chrome 的 `chrome://inspect/#remote-debugging`，开启 `Allow remote debugging for this browser instance`。
  3. MCP 客户端配置优先使用 `--auto-connect` 模式连接日常运行中的 Chrome（在用户授权提示时获得连接）。
  4. 若在 Windows 会话隔离环境下执行辅助工具，应正确绑定 `WinSta0\default` 交互桌面以定位日常 Chrome 真实窗口。

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--auto-connect", "--allowUnrestrictedPaths"]
    }
  }
}
```

- **不保留自写测试脚本或启动脚本**：
  本项目不接受自写的自动化启动脚本（如 `.ps1` 脚本）或单元测试脚本作为产物进入仓库。调试和验证必须直接复用用户现有的真实日常 Chrome，或在需要时直接通过操作系统标准能力与 MCP 协议连接。

1. 按 [真实验收手册](boss-extension-real-validation.md#02-无副作用的真实验收)暂停已有页面的自动运行。测试浏览器不执行发送、投递、联系方式交换或通知，除非当前任务另有明确授权。
2. 复用用户日常 Chrome，MCP 调用 `list_pages` 确认连接目标。确认加载的扩展路径为本仓库 `project-support/extension/lptff-investment-assistant/`；修改代码后调用 `reload_extension` 或在 `chrome://extensions` 页面点击“重新加载”。核对实际版本、目录与扩展错误，暂时关闭会注入 BOSS 的其他扩展。
3. 扩展重载后必须在 BOSS 页面执行刷新，确保新文档执行防护与新脚本注入。仅重载扩展不会替换已运行页面上的旧脚本；打开 DevTools 后临时粘贴代码也不能补救已经发生的页面销毁。
4. 如工具策略拒绝启动或安装，记录被拒动作和具体原因，不改用其他机制绕过；登录、验证码及浏览器要求的用户确认仍由用户本人处理。页面复测由 Agent 在既有授权内完成。

## 调试与验收顺序

1. 发现工具并调用 `list_pages`，取得已加载本扩展的 BOSS 标签编号；MCP 1.8.0 的页面工具使用 `pageId` 指定目标（旧版本按实际 schema 选择页面）。新测试标签通过 `new_page` 或 `navigate_page` 导航。不要把 MCP 自动新建但未安装扩展的 Chrome 当作已受防护的目标。
2. 用 `take_snapshot` / `take_screenshot` 观察真实页面；用 `evaluate_script` 只返回必要状态，例如下列函数。它只能确认注入相关状态和页面当下存在，不代表业务验收通过。

```javascript
() => ({
  shield: globalThis.__LPTFF_BOSS_DEVTOOLS_SHIELD__,
  bzlfe: navigator.userAgent.includes('BZLFE'),
  maxTouchPoints: navigator.maxTouchPoints,
  readyState: document.readyState,
  timeOrigin: performance.timeOrigin,
  bodyPresent: Boolean(document.body && document.body.childElementCount),
  jobCardCount: document.querySelectorAll('.job-card-box').length
})
```

3. 使用 `list_console_messages` 和 `list_network_requests` 定位错误，仅记录脱敏状态、资源类别和计数，不保存 Cookie、令牌、请求正文、聊天内容或原始日志。脚本读取 UA 含标识不能单独证明网络头规则已生效。
4. 在 MCP 连接和 F12 控制台保持打开时持续观察至少 30 秒，至少取两个时间点，确认同一标签存活、正文存在且无循环导航；再刷新并重测。记录 Chrome、扩展、MCP 版本和实际观察时长。
5. 补测职位列表、打开详情、正常站内返回、SPA 切换及刷新后工作台只有一个；确认统计、筛选和现有配置仍可使用。非 BOSS 页面不应出现 UA/AB/生命周期改写。扩展重载后再次刷新，按最终源码复测。
6. 记录已执行与未覆盖场景。没有实际页面证据就写“未验收”；登录、验证码或工具连接失败分别记录真实阻塞点。用户审查前保留目标页面，结束后恢复其他扩展开关和临时配置，自动运行保持暂停。

## 限制与回退

- 白名单、实验键和结果值是站点实现细节，可能变更。MAIN 世界属性能被站点覆盖；已有 own 属性、冻结对象或不同加载路径也需要实际验证。防护不能保证站点永不刷新，也不直接拦截 `location` 赋值或 DOM 清空。
- UA 与触点修改可能影响站点设备判断；AB 原型钩子仍有兼容性代价，例如 `'abData' in obj` 为真。默认对象按接收对象隔离，可追加元数据，但不会自动成为该对象的自有属性；JSON/object literal 的自有字段可能绕开钩子。DNR 与其他扩展改写相同请求头时可能冲突。顶层工作页面的正常脚本 `window.close()` 也会被拦截，登录弹窗及子框架关闭继续透传。遇到异常先停调试，使用普通 Chrome 复现并收窄原因。
- 回退时只移除 manifest 中 `boss-devtools-shield.js` 对应内容脚本项和 `boss-devtools.json` 对应 ruleset 注册，保留原有业务脚本、权限和其他规则；重载扩展并刷新或重建标签，清除旧文档中的属性改写，再用普通 Chrome 检查。不要在旧页面上反复覆盖原生方法恢复。
- 参考目录的 `verify-devtools.js` 没有完整的关闭/超时处理，失败分支仍可能退出为成功；不可直接作为本项目真实通过证据。
