# BOSS 直聘扩展真实验收与测试基础设施修复手册

本手册用于测试 `project-support/extension/lptff-investment-assistant/` 在普通 Windows Chrome 与真实 BOSS 直聘页面中的行为。它把已验证有效的做法写成可机械执行的步骤，避免执行者依赖隐含经验。

需要了解本手册的真实验证来源和已观察问题时，读 [`../records/boss-extension-real-validation-20260827.md`](../records/boss-extension-real-validation-20260827.md)。

## 适用边界

- 只在任务涉及 BOSS 直聘 Chrome Extension 的真实页面功能时使用。
- BOSS 是项目特例：最终验收不得使用 Chrome DevTools MCP、CDP、Playwright、Puppeteer、Selenium、WebDriver、remote debugging 或隔离自动化浏览器控制真实 BOSS 页面。
- 原因是这些连接方式可能改变登录、验证、风控或页面行为。这里验证的是普通用户实际使用的 Chrome，不是自动化浏览器。
- 不得研究、隐藏或修改 webdriver/CDP/automation 指纹，不得逆向 BOSS 的反自动化检测或专用字体映射。
- 静态分析、构建、单元测试、fixture 和本地模拟只能形成 `Development Evidence`，不能冒充 `Real BOSS Validation`。

## 结果状态

- `PASS`：真实普通 Chrome 已执行目标路径，实际结果符合预期。
- `FAIL`：真实路径已执行，结果明确不符合预期。
- `NOT EXECUTED`：尚未进入真实页面执行。
- `TEST_INFRASTRUCTURE_FAILURE`：当前没有桌面执行能力，但仍有修复路径；必须继续修复，不能结束。
- `TEST_INFRASTRUCTURE_HARD_BLOCKED`：已检查所有当前实际可用路径，且有证据证明无法创建或连接授权的交互式 Windows 执行环境。只有此条件允许因基础设施停止。

不要把 `FAIL` 改写成 `BLOCKED`，也不要把构建成功改写成真实验收 `PASS`。

## 维护测试状态

仓库根目录使用 `TEST_STATE.md` 保存跨轮次状态。不存在时创建，至少保留：

```markdown
# BOSS Extension Test State

## Changed files
## Impacted behaviors
## Pending real scenarios
## Infrastructure issue
## Infrastructure attempts
## Current executor
## Issues found
## Next action
```

每次基础设施尝试、真实场景结果、临时配置变更和恢复动作后更新。基础设施恢复后从 `Pending real scenarios` 继续，禁止从头重复已经完成的分析。

## 第一阶段：从 Git 变更确定测试范围

先执行并阅读：

```powershell
git status --short
git diff
git diff --stat
```

注意：`git diff` 不显示未跟踪文件，必须把 `git status --short` 中的 `??` 文件单独读完。

建立映射：`Changed File -> Changed Behavior -> Impacted Real BOSS Scenario`。

优先级固定为：

1. `P0`：diff 直接改变的真实功能。
2. `P1`：直接调用方、被调用方和生命周期。
3. `P2`：最可能受影响的相邻功能。
4. `P3`：默认不测试；只有发现连带影响才扩大。

| 变更 | 必测真实场景 |
| --- | --- |
| `content/boss-helper.js` | 初始扫描、异步/滚动卡片、字段解析、筛选、高亮/虚化、批处理、重载恢复 |
| `content/observation-bridge.js` | 搜索条件、分页、SPA 切换、重复快照、刷新 |
| `background.js` | 消息来源校验、API 权限、失败回退、密钥隔离 |
| `popup/boss-helper.js` | 配置保存、页面同步、持久化、HTML 安全、AI 域名权限 |
| `manifest.json` | 内容脚本顺序、匹配域名、可选 host 权限、加载版本 |
| CSS/HTML | 遮挡、重复 UI、标签位置、弹窗滚动、原页面布局 |

## 第二阶段：开发证据

1. 阅读变更代码和直接调用链。
2. 对所有扩展 JavaScript 执行语法检查。
3. 执行与改动对应的 fixture/unit tests。
4. 执行 `npm run typecheck` 和 `npm run build`。
5. 检查 manifest 引用文件都存在、内容脚本顺序正确。
6. 执行 `git diff --check`。
7. 使用 `project-support/scripts/extension/build-zip.js` 重新生成 ZIP。

失败时先修复再继续。即使全部通过，也只能写 `Development Evidence: PASS`。

## 第三阶段：修复桌面测试基础设施

### 确认会话事实

```powershell
[Environment]::UserInteractive
[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Get-Process explorer,chrome,ChatGPT,Code -ErrorAction SilentlyContinue |
  Select-Object ProcessName,Id,SessionId,MainWindowTitle
```

可用路径按顺序选择：

1. 已挂载且获授权的 OS Desktop/Computer Use。
2. 当前进程与 Chrome 同在交互用户 Session：建立用户态 Desktop Runner。
3. 通过已登录用户的启动项、Task Scheduler、tray app、IDE terminal 或已有用户态进程启动 Runner。
4. 把测试执行层迁移到已登录 Windows VM、测试机或支持桌面控制的执行入口；代码推理仍留在当前任务。

不要从 Session 0 穿透 Windows 安全边界。某条启动方式失败后换下一条合法路径，不要无限重复同一种尝试。

### Desktop Runner 最小契约

```text
screenshot
screenshot_region
list_windows
focus_window
maximize_window
click
double_click
scroll
type
hotkey
launch
```

Runner 只能调用普通 Win32 用户输入和屏幕捕获能力，不启动 remote debugging，不附着 CDP，不加载 webdriver。

仓库提供已在本次真实验收中验证过的实现：[`../../project-support/scripts/testing/windows-desktop-runner.ps1`](../../project-support/scripts/testing/windows-desktop-runner.ps1)。先运行 `-Action list_windows` 和一次临时目录截图验证环境，再进行任何输入操作。

验证顺序固定为：

```text
截取桌面 -> 看见普通 Windows 桌面 -> 启动无害的记事本 ->
聚焦 -> 键盘输入 -> 鼠标点击 -> 截图确认 -> 关闭且不保存 ->
控制现有普通 Chrome
```

### 多显示器和 DPI 陷阱

- `GetWindowRect`、输入坐标和截图 bitmap 可能使用不同坐标空间。
- 第二显示器直截可能得到黑图。可靠做法是先截完整虚拟桌面，再按截图 bitmap 的逻辑坐标裁剪。
- 不要根据图片查看器缩放后的显示位置点击；必须以原图像素和显示器缩放比例换算。
- 先用无害窗口验证一个点击坐标，再操作 Chrome。
- `focus_window` 不应无条件 restore 已最大化窗口，否则 Chrome 可能缩小；只对最小化窗口 restore，另提供 `maximize_window`。

## 第四阶段：准备普通 Chrome

1. 使用现有普通 Chrome profile；启动参数不得包含 debugging、automation 或 webdriver 相关参数。
2. 打开 `chrome://extensions/`。
3. 在扩展详情底部确认名称、版本、ID、来源为“未打包的扩展程序”，且加载来源精确指向当前工作区目录。
4. “Service Worker（无效）”通常表示当前未激活，不等同于加载错误；不要仅凭该文字判失败。
5. 找出其他会注入 BOSS 页面的扩展。记录原开关状态，测试期间临时关闭以隔离结果，结束后恢复。
6. 点击当前扩展卡片的重新加载按钮，并通过 Chrome 提示确认重载发生。

## 第五阶段：真实 BOSS 验收

所有输入、点击、滚动、刷新和截图必须经过 OS Desktop Runner。

### 基础生命周期

1. 打开真实登录态 `https://www.zhipin.com/web/geek/jobs`。
2. 工作台只出现一个；检查关键内容遮挡和关闭入口。
3. 核对初始卡片数、命中数和排除数。
4. 在职位列表区域滚动，确认虚拟列表/异步替换后仍有标签且无重复工作台。
5. 点击一个站内推荐搜索项，确认 SPA 内容改变后重新扫描。
6. 在扩展页重载当前扩展，回到 BOSS 页确认恢复。
7. 完整刷新页面，再确认设置、工作台和卡片处理恢复。

### 字段和筛选

逐项比对可见卡片：标题、公司、薪资、经验、学历、地区和可见活跃时间。然后用可恢复配置验证：

- 标题包含词：选择能产生部分命中和部分排除的词，记录统计变化。
- 无匹配词：使用明显不存在的词，确认 `0 命中` 和全部排除。
- 高亮：关闭后命中卡片的插件边框消失，恢复后重新出现。
- 虚化：存在排除卡片时关闭/开启，确认透明度变化。
- 薪资：设置明显高于当前可见岗位的最低值，必须得到基于真实数字的排除原因；若全部显示“薪资格式未知”，判 `FAIL`。
- fresh/chatted/headhunter/gold：只有结果集中存在确定正反样本时才能做真实结论；没有样本则记录未覆盖，不要臆造 `PASS`。

每次临时修改都记录原值，测试后恢复并保存。

### 批处理安全边界

真实招聘方沟通属于外部副作用。没有明确授权时：

- 不得在存在匹配职位时点击“开始”。
- 可设置不可能匹配的标题词，使统计为 `0 命中`，再点击“开始”。
- 预期：日志出现“当前页面未匹配到符合规则的职位”，`今日投递` 保持不变。
- 实际点击、计数、日限额、低 AI 分数和去重分支用 fixture 验证；不能把 fixture 写成真实投递通过。

### AI 与密钥

- BOSS 页面 AI Tab 的 API Key 字段必须为空、禁用，并提示去扩展弹窗配置。
- 不要把真实 Key 输出到日志、截图文字或报告。
- 未获授权时不调用付费 API；使用 fixture 验证低分、无评分、请求失败均阻止沟通。
- 弹窗设置的 API host 权限只能按用户配置的 origin 请求。

## 已知真实站点问题：薪资专用字体

当前 BOSS 卡片肉眼可见 `50-70K·15薪` 等数字，但复制到普通字体区域后会显示为非数字字形，数字正则无法解析。

允许：兼容常规短横线、尝试正常 DOM 选择器/属性/完整卡片文本回退、显示“薪资格式未知”、将真实结果记为 `FAIL`。

禁止：逆向或解码站点字体映射、研究反抓取实现、伪造可见数字，或放宽规则后宣称薪资筛选通过。

## 证据记录

每个真实场景记录：

```text
Scenario
Priority
Precondition
Action
Expected
Actual
Evidence screenshot
Result: PASS | FAIL | NOT EXECUTED
Restoration
```

截图只保存在临时工作目录，不提交含私人页面信息的图片。报告只写聚合计数和脱敏结果。

## 收尾检查

1. 恢复所有测试配置。
2. 恢复临时关闭的其他扩展开关。
3. 用最终代码重新加载扩展并刷新 BOSS 页。
4. 再跑语法、fixture、typecheck、build、manifest 引用和 ZIP 打包。
5. 更新 `TEST_STATE.md`。
6. 不自动 commit 或 push；遵守项目人工审核卡点。

## 最终报告模板

```markdown
## Changed Files
## Impacted Behaviors
## Tested Scenarios
## Issues Found
## Root Causes
## Fixes
## Verification
## Real BOSS Validation
```

`Real BOSS Validation` 必须明确写执行工具和状态：

```text
Execution: ordinary Windows Chrome + OS screenshot/mouse/keyboard
Forbidden browser-control tools used: NO
REAL_BOSS_VALIDATION: EXECUTED — PASS
```

存在一个 P0 失败时必须写 `EXECUTED — FAIL`，不能因为其他场景通过而写整体 `PASS`。
