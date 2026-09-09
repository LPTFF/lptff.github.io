# Web 网页与 Chrome MV3 扩展桥接真实验收与排障指南

本项目求职工作台（`/career`）及投资页面通过 `window.postMessage` 与 Chrome 扩展（`project-support/extension/lptff-investment-assistant`）的 `content/web-bridge.js` 和 `background.js` 进行双向 RPC 通信。本手册总结本次真实 Chrome 实测中沉淀的核心经验与排障模式，供后续 Agent 以极低成本、零副作用快速复用。

---

## 1. 核心问题与根因分析（避坑指南）

### 坑 1：Manifest V3 规则缓存导致“未连接扩展”
- **现象**：在源码中修改了 `manifest.json` 的 `content_scripts.matches`（例如新路由 `/career`）或修改了 `background.js`，但在真实 Chrome 中打开新路由页面时，页面始终提示“未连接扩展”。
- **根因**：Chrome MV3 运行态内部（`Secure Preferences`）在未显式重载前，始终缓存旧的匹配规则与旧 Service Worker。新页面不会被注入 `web-bridge.js`。同时，Chrome 安全机制严禁 DevTools MCP 直接导航至 `chrome://extensions`。
- **正解**：不能重启用户浏览器（会丢失日常几十个标签与登录态），必须采用 **OS 级 UI Automation 无感热重载**（详见下文脚本规范），并在重载后对业务页面执行 `location.reload()`。

### 坑 2：Vue 3 响应式 Proxy 导致 `[object Object] could not be cloned`
- **现象**：在 Vue 页面向扩展 Bridge 传递数据时，浏览器控制台抛出 DOMException：
  `Failed to execute 'postMessage' on 'Window': [object Object] could not be cloned.`
- **根因**：Vue 3 的 `ref` 与 `reactive` 底层由 ES6 `Proxy` 包装，而浏览器的结构化克隆算法（`structuredClone` / `window.postMessage`）不支持克隆带有 Proxy 的复杂对象。
- **正解**：
  1. **Bridge 通信层强制脱壳**：在 `career-bridge.ts` 发送前统一执行 `JSON.parse(JSON.stringify(payload))`；
  2. **View 层传参解包**：向 Bridge 方法传参时，使用 Vue 的 `toRaw(...)` 解除响应式包装；
  3. **扩展端回传对称防护**：`content/web-bridge.js` 发回 `postResponse` 时也执行 JSON 序列化并包裹 `try-catch`。

### 坑 3：Windows 下定位日常 Chrome 顶级窗口句柄
- **现象**：PowerShell 执行 `(Get-Process chrome).MainWindowHandle` 返回全部为 0。
- **根因**：Chrome 采用多进程多线程架构，顶层窗口 `Chrome_WidgetWin_1` 往往不挂载在主线程上，导致 .NET 的 `Process.MainWindowHandle` 抓取为空。
- **正解**：在 `WinSta0\default` 交互桌面下调用 Win32 API `EnumDesktopWindows`，匹配目标 PID（日常 Chrome PID）且窗口标题含 `"Chrome"`，即可 100% 稳定获得真实窗口句柄。

---

## 2. 真实日常 Chrome 免重启扩展热重载标准化流程

当修改了 `manifest.json`、`background.js` 或 `content/web-bridge.js` 后，按以下标准步骤执行：

### 第一步：获取真实日常 Chrome PID 并重载扩展
通过 PowerShell + UI Automation 在后台无感触发扩展重载（执行过程：打开新标签 -> `chrome://extensions` -> 点击对应未打包扩展的 `dev-reload-button` -> 关闭标签，耗时 < 1.5 秒）：

```powershell
$c = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;

public class ChromeExtensionReloader {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, int dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool CloseDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    public static string Reload(uint targetPid) {
        var sb = new StringBuilder();
        Thread t = new Thread(() => {
            try {
                IntPtr hDesk = OpenDesktop("default", 0, false, 0x01FF);
                SetThreadDesktop(hDesk);
                IntPtr foundHwnd = IntPtr.Zero;
                EnumDesktopWindows(hDesk, (h, l) => {
                    uint pid;
                    GetWindowThreadProcessId(h, out pid);
                    if (pid == targetPid) {
                        int len = GetWindowTextLength(h);
                        if (len > 0) {
                            var titleSb = new StringBuilder(len + 1);
                            GetWindowText(h, titleSb, titleSb.Capacity);
                            if (titleSb.ToString().Contains("Chrome")) {
                                foundHwnd = h;
                                return false;
                            }
                        }
                    }
                    return true;
                }, IntPtr.Zero);

                if (foundHwnd == IntPtr.Zero) {
                    sb.AppendLine("未找到 Chrome 窗口");
                    CloseDesktop(hDesk);
                    return;
                }

                SetForegroundWindow(foundHwnd);
                Thread.Sleep(300);
                SendKeys.SendWait("^t");
                Thread.Sleep(600);
                SendKeys.SendWait("chrome://extensions{ENTER}");
                Thread.Sleep(1200);

                var root = AutomationElement.FromHandle(foundHwnd);
                if (root != null) {
                    var reloadCond = new PropertyCondition(AutomationElement.AutomationIdProperty, "dev-reload-button");
                    var btn = root.FindFirst(TreeScope.Descendants, reloadCond);
                    if (btn != null) {
                        object pattern;
                        if (btn.TryGetCurrentPattern(InvokePattern.Pattern, out pattern)) {
                            ((InvokePattern)pattern).Invoke();
                            sb.AppendLine("Reload button clicked successfully!");
                        }
                    }
                }
                Thread.Sleep(600);
                SendKeys.SendWait("^w");
                CloseDesktop(hDesk);
            } catch (Exception ex) {
                sb.AppendLine("Error: " + ex.Message);
            }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
        return sb.ToString();
    }
}
'@
Add-Type -ReferencedAssemblies "UIAutomationClient", "UIAutomationTypes", "System.Windows.Forms" -TypeDefinition $c
# targetPid 传用户实际 Chrome PID（如 2372）
[ChromeExtensionReloader]::Reload(2372)
```

### 第二步：刷新业务目标页面
扩展热重载后，原页面中的旧 content script 已断开，必须通过 DevTools MCP 在目标页面执行刷新：
```javascript
// MCP evaluate_script on target pageId
location.reload();
```

### 第三步：验证通信握手
在目标页面执行 `checkCareerStatus()`，确认返回 `{ connected: true, hasGeminiKey: true }`，并在 DOM 状态徽标中感知到 `助手扩展已连接`。

---

## 3. Gemini 共享配置与 1:1 对齐小助手体验规范

### 3.1 底层存储打通
- **单源存储**：统一存储于扩展本地存储 `chrome.storage.local` 下的 `lptffBossAutopilot`（`BOSS_AUTOPILOT_CONFIG_KEY`）。
- **字段规范**：
  - `model`: 模型名称，支持 `gemini-3.7-flash`、`gemini-3.6-flash`、`gemini-3.5-flash-lite`；
  - `geminiKey`: 用户 API 密钥字符串。
- **两端互通**：求职工作台修改模型或密钥，BOSS 直聘 AI 沟通小助手实时生效；反之亦然。页面显著提示：“两边只需要配置一次就能共用”。

### 3.2 界面交互规范
1. **自动调取 + 默认掩码**：页面加载时若后台有 Key，输入框预填内容，但输入框 `type="password"`（渲染为圆点掩码 `••••••••`），绝不直接展示明文；
2. **显示/隐藏切换**：
   - 按钮样式：浅绿圆角按钮（背景 `#edf7f3`，文字 `#17624f`，字号 `12px` / `13px`）；
   - 点击时切换为明文并显示 `[隐藏]`；再次点击切回掩码并显示 `[显示]`；
3. **状态指示徽标**：右侧展示绿色文字 `已保存`；
4. **实时连通性测试**：点击“保存并测试连接”调用扩展执行真实 Gemini 握手，捕获实际延迟（例如 `915ms`）并展示绿色反馈胶囊。

---

## 4. DevTools MCP 验证执行最佳实践

1. **精准状态轮询**：
   - 调用需要后台网络请求的方法（如连通性测试或画像提取）时，不要使用固定长 sleep。
   - 使用 `evaluate_script` 配合内部循环检查 DOM 状态（检查加载状态类名与反馈文本），既能秒级响应又不会超时。
2. **脱敏存证要求**：
   - 所有输出结果、日志与测试反馈中，严禁打印完整的 Gemini API Key 明文，仅允许打印前缀（如 `AQ.A...`）或脱敏标记；
   - 截图仅保留在本地临时目录，通过复制到 artifact 目录中供用户交互审查，不将截图提交入 git 仓库。
