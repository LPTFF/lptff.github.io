# 浏览器 UI 交互与动态加载真实验收指南

本指南总结自前端首页异步栏目切换（如“吾爱破解”分包预渲染）中多余滚动条与高度溢出的实战诊断与修复，用于规范涉及真实 Chrome 操作、加载态（骨架屏/Loading）、动态切换与多视口布局的验收闭环。

---

## 一、核心验收原则

1. **真实链路优先于静态模拟**：
   不能仅在控制台手动注入一段 HTML 或手动挂上 `.is-switching` 类作为通过依据；必须在运行着最新构建代码（如 `npm run build` 产物由 preview 服务托管）的真实 Chrome 实例中，真实触发点击、路由切换与渲染流程。
2. **全生命周期阶段对照**：
   动态交互必须同时覆盖三个阶段：
   - **切换前（Before）**：前一页面的滚动容器数、内容高度与滚动位置。
   - **加载中（Switching / Loading）**：分包或数据请求中，验证骨架屏/遮罩是否全向覆满、底层旧内容是否泄露、外层与内层是否产生多余滚动条。
   - **加载后（Resolved）**：新内容挂载后，验证主滚动条是否正常工作、内容是否被截断、能否正常滚动到底部、滚动记忆是否准确。
3. **指标最小化，拒绝上下文污染**：
   禁止向执行上下文回传整页 DOM 树或冗长控制台日志。每次采样只提取：视口尺寸、实际滚动容器数量与明细（`scrollHeight > clientHeight` 且支持滚动）、关键舞台高度与样式、是否发生截断。

---

## 二、测试前基线检查与现场恢复（防假阳性）

由于旧的调试会话可能在 Chrome 中残留配置，在开始正式验收前必须先执行基线重置：

1. **检查本地服务运行状态与代码版本**：
   - 确认构建或开发服务端口正在监听（如 4173 或 5173）。
   - 修改源码后先完成 `vue-tsc --noEmit` 与构建，并在浏览器中核对样式表是否已包含最新构建哈希或特征选择器。
2. **清除环境污染与调试残留**：
   - **清理注入**：移除此前控制台注入的临时 `<style>`、调试脚本或未受 Vue 管理的裸 DOM 节点。
   - **清理网络模拟**：调用 `emulate` 清除网络节流（恢复为 Normal），确保初始状态干净。
   - **恢复视口与滚动**：将视口复位为常规桌面尺寸，清除异常的滚动锁定。

---

## 三、多视口验收矩阵

所有涉及全局滚动容器与加载态的修改，必须至少覆盖以下 4 类视口：

| 视口类型 | 推荐规格（宽×高） | 重点排查问题 |
| :--- | :--- | :--- |
| **问题报告视口** | `1024×564`（或 Bug 原图比例） | 原样复现原始 Bug 场景，确认问题彻底解决。 |
| **常规桌面视口** | `1280×800` 或 `1440×900` | 验证标准宽屏下卡片布局、外层居中容器与滚动条贴边行为。 |
| **低矮视口** | `1024×450` | **最易暴露硬编码高度与内边距溢出**。检查固定 paddingTop/Bottom 叠加骨架屏是否强制撑爆视口。 |
| **移动窄屏** | `375×667`（移动设备模式） | 检查移动端媒体查询生效情况、隐藏滚动条负外边距（如 `right: -17px`）是否受嵌套影响、响应式排版。 |

---

## 四、受控过渡捕捉与标准采样脚本

在本地预览环境速度极快时，可通过 Chrome DevTools MCP 的 `emulate` 工具将网络受控设为 `Slow 3G`，为切换中阶段争取充足的采样窗口；采样完毕后必须立即恢复。

### 标准指标提取脚本（在 DevTools `evaluate_script` 中执行）

```javascript
() => {
  const scrollers = [];
  document.querySelectorAll('*').forEach(el => {
    const cs = window.getComputedStyle(el);
    // 仅捕获实际产生滚动能力且内容溢出的容器
    if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1 && (cs.overflowY === 'auto' || cs.overflowY === 'scroll')) {
      scrollers.push({
        tag: el.tagName,
        className: el.className ? el.className.toString().split(' ').slice(0, 2).join(' ') : '',
        scrollHeight: Math.round(el.scrollHeight),
        clientHeight: Math.round(el.clientHeight),
        overflowY: cs.overflowY
      });
    }
  });

  const stage = document.querySelector('.tab-stage');
  const stageCS = stage ? window.getComputedStyle(stage) : null;
  const overlay = document.querySelector('.tab-loading-overlay');

  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    scrollerCount: scrollers.length,
    scrollers,
    stageHeight: stage ? Math.round(stage.clientHeight) : 0,
    stageMaxHeight: stageCS ? stageCS.maxHeight : null,
    stageOverflow: stageCS ? stageCS.overflow : null,
    overlayPresent: !!overlay
  };
}
```

### 滚动与裁切验证脚本

```javascript
() => {
  const container = document.querySelector('.scroll-home-container') || document.querySelector('.inner-container');
  if (!container) return { error: 'Scroll container not found' };

  const maxScroll = container.scrollHeight - container.clientHeight;
  const initialTop = container.scrollTop;

  // 尝试滚动到底部
  if (maxScroll > 0) {
    container.scrollTop = maxScroll;
  }
  const reachedBottom = container.scrollTop > 0 && Math.abs(container.scrollTop - maxScroll) <= 2;

  // 复位滚动
  container.scrollTop = initialTop;

  return {
    maxScroll: Math.round(maxScroll),
    canReachBottom: reachedBottom,
    initialScrollTop: initialTop
  };
}
```

---

## 五、预渲染与加载态常见缺陷模式与防护准则

本次排查锁定的四大高频缺陷与对应的工程标准：

1. **盒模型高度超标（Box-Sizing 陷阱）**：
   - **现象**：骨架卡片写了 `min-height: 96px; padding: 18px;`，因未设 `box-sizing: border-box`，单卡高度膨胀至 `134px`，数张卡片加上页头内边距直接超过 900px，矮视口必然产生滚动条。
   - **准则**：所有骨架屏元素必须显式声明 `box-sizing: border-box; min-height: unset;`，并在常规视口内严格控制卡片总高度。
2. **Vue Suspense / KeepAlive 旧视图泄露**：
   - **现象**：当新异步分包下载时，Suspense 保留旧组件 DOM（可能达数千像素）。如果加载遮罩仅设置了 `position: absolute; inset: 0 0 auto;`，底层大高度依然撑开容器，且下翻会看到旧内容。
   - **准则**：
     - 加载遮罩使用 `inset: 0; background: #fff; overflow: hidden;` 全向覆盖。
     - 舞台容器在切换态绑定 `.is-switching`，强制施加 `overflow: hidden; max-height: calc(100vh - [固定内边距与页脚总和]);`，从 CSS 层彻底阻断旧高度外溢。
3. **外层滚动容器在切换中显式锁定**：
   - **准则**：主滚动容器绑定 `.is-switching { overflow-y: hidden; }`，在加载过程中禁止出现外层垂直滚动条。
4. **组件库默认容器样式污染**：
   - **现象**：Element Plus 的 `.el-main` 默认具有 `overflow: auto`。外层若已有专用的滚动容器（如 `.scroll-home-container`），`.el-main` 极易形成嵌套滚动条。
   - **准则**：业务层对 `.main-content` 显式声明 `overflow: visible;`，确保单页面只有唯一明确的主滚动容器。
5. **滚动事件防误判**：
   - **准则**：在页面全局滚动监听（`handleScroll`）首行加入 `if (isTabSwitching.value) return;`，防止在切换或高度重算瞬间将过渡状态的 scrollTop 误存入 sessionStorage。

---

## 六、审查现场保留规范

1. 自动化验收（脚本指标验证 + 截图取证）完成并不等同于人工审查结束。
2. 在交付最终报告时，**必须保留本地运行中的服务（如 Vite preview）和目标浏览器标签页**，保持在正常视口与正常网络状态。
3. 不在未获用户明确许可前关闭页面或 kill 运行中的服务进程。
