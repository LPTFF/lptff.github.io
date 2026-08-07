# 天天基金接口优先采集插件任务记录

- 日期：2026-08-08
- 目标：用户登录天天基金后，通过一次主动点击自动导出全部持仓、单基金详情和当前/历史交易数据，避免逐页手工操作和页面展示字段造成的数据损失。

## 过程与决策

1. 先观察持仓页、单基金详情页和交易查询页的真实 Network 请求，确认三个业务入口：
   - `POST /request/hold`：持仓明细和账户汇总；
   - `POST /http/single/get`：`dt=fene` 份额详情、`dt=yingkui` 每日盈亏、`dt=dingtou` 定投计划；
   - `POST /queryapi/trading/Query/DelegateList`：当前/历史交易及分页。
2. 改为接口优先采集。页面自身发出请求，MAIN world bridge 捕获成功业务响应；后台不复制认证请求头，不直接重发交易接口。
3. 增加自动编排：持仓页作为前置，单基金详情最多 4 路受控并发；当前交易和历史交易使用两个独立查询页并发；同一查询页内分页保持串行。
4. 修正基金名称来源：名称以 `/request/hold` 的 `fundName` 为准，由后台传给 single 页面；删除 single 页面 DOM 名称选择器。手动 single 入口缺少名称时也通过持仓接口按代码补齐。
5. 删除页面展示降级：收益不再从 `document.body` 读取，交易不再从表格 DOM 读取；接口缺失时记录 warning，不伪造未捕获数据。
6. 协议升级到 `1.1`，保存标准数据、单基金详情、交易详情、递归脱敏后的接口快照和采集警告；增加本地扩展 zip 打包与开发下载入口。

## 安全边界

- 不申请 `cookies` 权限，不读取 `document.cookie`。
- 不读取、保存或导出 Authorization、access-token、Cookie、session、password、secret 等认证字段。
- 只保存实际成功接口响应和非敏感请求元数据。
- 未实际加载的历史范围或分页不标记为已采集。
- 临时采集标签页在任务结束后统一关闭，原始登录页面不关闭。

## 验收

- 用户已在本地浏览器验证插件采集流程可用。
- 扩展脚本 `node --check` 通过。
- `npm run typecheck` 通过。
- `git diff --check` 通过（仅有现有换行符提示）。
- `node scripts/extension/build-zip.js` 成功生成 `dist-extension/lptff-investment-assistant.zip`。
- 限制：本记录不替代每次真实登录会话下的逐请求 Network 核验；实际历史数据仍受账户权限、站点接口和页面实际分页加载结果限制。
