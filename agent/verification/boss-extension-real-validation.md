# BOSS 直聘扩展自闭环测试手册

目标：把 `project-support/extension/lptff-investment-assistant/` 的每项 UI 承诺转成可观察结果，在普通 Windows Chrome 的真实 BOSS 页面中完成“复现 → 修复 → 重载 → 重测”，直到本次变更涉及的场景收敛。

## 1. 保存状态并确定范围

先查看 `git status --short`、`git diff`、`git diff --stat`，然后在仓库根目录 `REAL_VALIDATION_STATE.md` 维护：

- Changed files
- Impacted behaviors
- Pending real scenarios
- Infrastructure issue/attempts
- Current executor
- Issues found
- Next action

为每个文件建立 `Changed File → Changed Behavior → Real Scenario` 映射：P0 测直接变化，P1 测调用链和生命周期，P2 测最可能受影响的相邻功能。P3 只有发现连带影响时才扩展。

## 2. 确认产物能够加载

按当前改动完成必要的语法、类型、构建、manifest 文件引用和 ZIP 生成检查，确保扩展能被 Chrome 加载。失败立即修复。

这些检查只用于避免把无法加载的产物送入真实环境，不作为功能通过证据。

## 3. 获得普通桌面执行能力

最终 BOSS 验收使用普通 Chrome 与 OS 级截图、鼠标和键盘。不要给 Chrome 添加 remote debugging、WebDriver 或 automation 参数，也不研究或修改站点反自动化指纹。

按以下顺序取得执行器，成功即进入第 4 节：

1. 连接当前环境已有的 Desktop/Computer Use 能力。
2. 当前任务与 Chrome 在同一交互用户 Session 时，运行用户态 Desktop Runner。
3. 后台 Session 无法触达桌面时，通过已登录用户的 IDE terminal、启动项、计划任务或 tray app 启动 Runner。
4. 当前机器没有交互桌面时，只迁移测试执行层到已登录 Windows VM/测试机；代码分析和修复仍留在当前任务。

Runner 至少支持：`screenshot`、`list_windows`、`focus_window`、`maximize_window`、`click`、`double_click`、`scroll`、`type`、`hotkey`、`launch`。

执行器的验收顺序：

```text
截取完整桌面
→ 能看到普通 Windows 桌面
→ 打开记事本并完成聚焦、输入、点击
→ 关闭且不保存
→ 列出并控制现有普通 Chrome
```

多显示器时先截完整虚拟桌面，再按原图像素定位；不要按图片查看器缩放后的坐标点击。只对最小化窗口执行 restore，避免把最大化 Chrome 意外缩小。

执行器暂不可用属于待修复的基础设施故障，不是测试完成。只有已检查上述所有实际可用路径且有证据表明不存在授权的交互式 Windows 环境，才记录 `TEST_INFRASTRUCTURE_HARD_BLOCKED`。

## 4. 加载正确的扩展

1. 在现有普通 Chrome 打开 `chrome://extensions/`。
2. 核对扩展名称、版本、ID和加载目录，目录必须是当前工作区的 `project-support/extension/lptff-investment-assistant/`。
3. 记录其他会注入 BOSS 的扩展开关，测试期间关闭，结束时恢复。
4. 点击当前扩展的“重新加载”，回到 BOSS 页面后刷新。
5. 首屏先核对产品结构：保留统计、筛选、配置、AI、日志、对话、职位队列和自动处理；不再出现关于/赞赏、反馈和帮助模式。

## 5. 按用户路径验证 UI 承诺

每个场景都记录 `前置条件、操作、预期、实际、截图、PASS/FAIL、恢复动作`。

### 页面生命周期与岗位获取

- 初次进入职位列表后只出现一个工作台，职位卡片无需用户先手工滚动就开始获取。
- 自动加载/翻页时显示“当前页面处理数、今日成功数、运行/暂停状态”，用户能判断仍在工作、已完成还是失败。
- 滚动、异步替换、搜索条件变化、SPA 切换、扩展重载和页面刷新后不会重复挂载，处理能够恢复。

### BOSS 原生筛选与插件筛选

- 插件中的原生筛选条件与 BOSS 页面实际条件同步；修改后真实列表随之变化。
- 标题、公司、经验、学历、薪资、地区、活跃度等规则用可见正反样本验证，日志给出具体排除原因。
- 无匹配条件得到 0 命中且不发起沟通；恢复条件后重新出现候选岗位。
- 没有真实正反样本的规则记录“本轮未覆盖”，不能凭界面存在标记 PASS。

### 自动处理、即时反馈与恢复

- 点击开始后立即显示状态变化，持续更新当前/总数、成功、跳过、失败和剩余额度。
- 暂停/继续即时生效；达到日限额、无更多岗位、登录失效、页面结构变化或请求失败时明确停止并给出下一步。
- 同一岗位/公司/HR 的去重规则真实生效，刷新后缓存策略与 UI 描述一致。
- 每个失败项可从日志定位到岗位和失败阶段；可恢复错误按既定次数重试，不无限循环。

真实发送消息会影响招聘方。没有当前任务的明确发送授权时，先设置不可能匹配的条件验证完整控制流；涉及真正发送的场景标记待授权，不用模拟结果冒充真实成功。

### AI、地址与聊天

- AI 模型配置能够保存、校验并在失败时显示明确原因；密钥不出现在页面日志、截图文本或仓库文件中。
- AI 筛选的评分和理由进入岗位处理结果；AI 招呼语在发送前可见且与岗位数据一致。
- 地址/通勤规则的输入、地图服务失败和超限排除均有即时反馈，不能静默放行。
- 对话框能展示模型输出、编辑招呼内容并保持开关状态；关闭对话框不应停掉后台任务。

未获授权时不调用付费模型或外部地图额度，对应场景记录为未执行；获得授权后直接在真实配置和真实页面补齐验证。

## 6. 修复循环

发现 `FAIL` 后立即执行：

```text
保留复现条件
→ 定位根因和最小影响范围
→ 修改源码/生成产物
→ 确认产物可加载
→ 重新加载当前扩展
→ 在同一真实页面重测原失败路径
→ 补测成功、失败、刷新/恢复三个分支
→ 更新 REAL_VALIDATION_STATE.md
```

不要通过删除整项功能、放宽断言、隐藏错误文案或把模拟结果写成 PASS 来“收敛”。如果 UI 描述比实现更强，优先补齐实现；只有产品明确改变承诺时才同步修改 UI。

## 7. 收尾与报告

恢复临时配置和其他扩展开关，用最终代码再次重载扩展并检查关键路径。最终报告固定包含：

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

真实验收通过时写：

```text
Execution: ordinary Windows Chrome + OS screenshot/mouse/keyboard
Forbidden browser-control tools used: NO
REAL_BOSS_VALIDATION: EXECUTED — PASS
```

任一 P0 仍失败则整体写 `EXECUTED — FAIL`，并留下具体未收敛项和下一步。
