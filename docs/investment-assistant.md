# LPTFF 投资助手（个人基金复盘助手）

> 通过浏览器插件从天天基金页面主动导出自己的基金数据，在 GitHub Pages 页面完成资产分析、收益分析与投资复盘。
> 核心原则：用户登录后主动点击一次开始采集；插件使用浏览器已有登录会话自动打开采集页面，不保存账号密码、不读取 Cookie、不向服务器上传数据；不执行用户未发起的后台采集；数据由用户自己控制、GitHub Pages 可独立运行。

## 一、整体架构

```
用户
  ↓ 在天天基金正常登录并点击一次“自动采集”
Chrome 扩展 (LPTFF Investment Assistant)
  ↓ 自动创建临时持仓、单基金详情和交易查询标签页，页面自身发出已授权请求
后台编排与本地聚合
  ↓ 标准分析视图 + 脱敏原始接口快照
用户下载 fund-data.json
  ↓ 用户上传
GitHub Pages (lptff.github.io/investment)
  ↓ 纯前端分析并在浏览器 localStorage 保存
资产 / 收益 / 持仓 / 复盘
```

扩展只监听以下已确认的数据接口，不从页面展示字段反推全部数据：

- `POST /request/hold`：账户持仓和资产汇总；
- `POST /http/single/get`：单只基金详情。页面会用 `dt=fene` 返回份额明细、用 `dt=yingkui` 返回每日盈亏表、用 `dt=dingtou` 返回定投计划；三类业务 HTML 会分别保存；
- `POST /queryapi/trading/Query/DelegateList`：交易查询及分页结果，包含页面实际加载的当前/历史时间范围。

页面已经成功发出的响应会优先被保存。由于交易接口依赖当前登录会话中的短期认证状态，扩展不会读取或保存认证请求头，也不会在后台重发交易请求；未加载的历史时间范围和分页不会被伪造，导出文件会通过 `collectionWarnings` 标明采集范围。

## 二、目录结构

| 路径 | 作用 |
| --- | --- |
| `src/utils/fund/fund-schema.ts` | 基金数据标准协议与校验 |
| `src/utils/fund/fund-parser.ts` | 文件/JSON 解析 |
| `src/utils/fund/fund-analysis.ts` | 收益曲线、收益贡献、复盘报告 |
| `src/utils/fund/fund-storage.ts` | localStorage 持久化 |
| `src/views/investment/FundLayout.vue` | 二级导航布局 |
| `src/views/investment/FundImport.vue` | 拖拽上传 + 示例数据 |
| `src/views/investment/FundDashboard.vue` | 资产总览 + 仓位/收益贡献 |
| `src/views/investment/FundHolding.vue` | 持仓明细表 + 导出 Excel |
| `src/views/investment/FundPerformance.vue` | 收益曲线（SVG）+ 极值 |
| `src/views/investment/FundTransaction.vue` | 交易流水 |
| `src/views/investment/FundReview.vue` | 自动投资复盘 |
| `extension/lptff-investment-assistant/` | Chrome 扩展（Manifest V3） |
| `public/fund/sample-fund-data.json` | 协议示例数据 |

## 三、数据协议 fund-data.json

协议版本为 `1.1`。文件同时包含面向现有页面的标准字段和用于追溯/再分析的脱敏原始快照：

```json
{
  "version": "1.1",
  "source": "1234567",
  "updateTime": "2026-08-07",
  "account": {
    "totalAsset": 61570.03,
    "totalProfit": 8889.39,
    "profitRate": 12.4
  },
  "holdings": [
    {
      "code": "017437",
      "name": "华宝纳斯达克精选",
      "amount": 18204,
      "profit": 1236,
      "profitRate": 7.29,
      "ratio": 29.6,
      "nav": 2.2611,
      "navDate": "2026-08-06",
      "shares": 7929.31,
      "availableShares": 7929.31,
      "details": { "fundCode": "017437" }
    }
  ],
  "transactions": [
    {
      "date": "2026-06-09",
      "type": "BUY",
      "fundCode": "017437",
      "fundName": "华宝纳斯达克精选",
      "amount": 5000,
      "amountUnit": "元",
      "confirmedAmount": 2200.1,
      "confirmedAmountUnit": "份",
      "status": "成功",
      "details": { "id": "业务记录标识" }
    }
  ],
  "raw": {
    "capturedAt": "2026-08-07T00:00:00.000Z",
    "pageUrl": "https://trade.1234567.com.cn/myAssets/hold",
    "snapshots": [
      {
        "key": "hold",
        "method": "POST",
        "path": "/request/hold",
        "requestBody": { "type": 0, "sort": 5 },
        "status": 200,
        "response": { "code": 200, "result": { "assetList": [] } }
      }
    ],
    "collectionWarnings": []
  },
  "collectionWarnings": []
}
```

字段说明：

- `account`：标准账户汇总，供资产总览使用；
- `holdings[]`：标准持仓视图；`details` 保留 `/request/hold` 中对应的完整脱敏持仓对象，`nav`、`navDate`、`shares`、`availableShares` 便于直接分析；单基金详情的 `shareTable`、`profitTable`、`investmentPlanTable` 以及对应业务 HTML 也保存在 `details`；
- `transactions[]`：标准交易视图；`details` 保留 DelegateList 中对应的完整脱敏交易对象，`type` 还允许 `OTHER`，避免无法可靠归类的业务被误判；
- `raw.snapshots[]`：每次已捕获成功接口响应的请求路径、方法、非敏感查询/请求体、状态、内容类型和完整业务响应；单基金的 `fene`、`yingkui`、`dingtou` 以及交易的不同时间范围/分页都会独立保留；
- `collectionWarnings`：采集范围或降级解析提示，例如交易接口未捕获、只加载了一个分页等；
- `raw` 中的 `responseHtml` 仅指单基金接口返回的业务 HTML，不是整页页面源码。

导入时仍会做归一化：缺失字段以默认值补全，金额支持千分位/百分号字符串；已定义的扩展字段和 `raw.snapshots` 会继续保留。未知字段如果没有放在 `details` 或 `raw` 中，则不保证在网页端归一化后存在，因此扩展会把接口对象放入这些字段，避免受页面展示字段限制。

## 四、网页端使用

1. 打开 `lptff.github.io/investment`；
2. 进入「导入数据」，拖入 `fund-data.json`，或点击「加载示例数据」体验；
3. 数据保存在浏览器 `localStorage` 键名 `fundData`，可随时「清空数据」；
4. 在导航查看资产总览、持仓、收益、交易、复盘；
5. 导入后标准字段用于现有页面展示，原始快照仍保存在本地数据中供后续检查。

### 自动采集流程

1. 先在天天基金正常登录，再点击扩展中的「自动采集全部基金数据」；
2. 扩展自动创建临时持仓页，读取账户持仓和全部基金代码；
3. 扩展会以受控并发方式打开少量单基金详情页，等待 `fene`、`yingkui`、`dingtou` 三类请求并分别保存份额、每日盈亏和定投计划；
4. 扩展会并行创建当前交易和历史交易查询页，每个页面内部按实际分页顺序加载 DelegateList；
5. 后台聚合所有页面的标准数据和脱敏快照，按交易业务 id 去重后下载 `fund-data.json`；
6. 任务完成后关闭扩展自己创建的临时标签页，不关闭用户原始登录页面。

自动采集只包含账户权限允许且页面实际成功加载的接口数据。为提升效率，插件对单基金详情使用固定上限的受控并发，对当前/历史交易使用独立页面并发；同一页面内的分页仍按顺序执行，避免筛选状态互相覆盖。交易历史仍受天天基金的授权、时间范围、单次查询跨度、接口分页和页面限制；未实际加载的服务器数据不会被伪造为已采集。
### 扩展打包与发布

网页端「导入数据」页顶部有「下载采集插件（zip）」入口，行为随环境不同：

- **本地调试（`npm run serve`）**：点击下载时，dev 服务实时把当前工作区的 `extension/lptff-investment-assistant/` 目录打包成 `lptff-investment-assistant.zip` 返回给浏览器。打包逻辑见 `scripts/extension/build-zip.js`，依赖仓库已有的 `archiver`，不需要额外安装。便于在改扩展源码后立刻重新加载验证。
- **线上（GitHub Pages）**：下载按钮指向已发布的 GitHub Release 资产 `https://github.com/LPTFF/lptff.github.io/releases/latest/download/lptff-investment-assistant.zip`。若该链接 404，是因为尚未发布 Release。

发布 Release 流程：

1. 本地打包：`node scripts/extension/build-zip.js`，生成 `dist-extension/lptff-investment-assistant.zip`（该目录已 gitignore，不进提交）；
2. 解压校验 zip 内 `manifest.json` 位于根层、含 `background.js` / `popup.*` / `content/`，可在 `chrome://extensions` 直接加载；
3. 在 GitHub 仓库 `LPTFF/lptff.github.io` 新建 Release（建议 tag 形如 `extension-v1.0.0`），上传 zip，资产名固定为 `lptff-investment-assistant.zip`；
4. 发布后网页端线上下载按钮即自动指向该 Release。

## 六、隐私与安全

- 只保存已确认三个业务接口的非认证元数据和业务响应；
- 递归过滤 `Authorization`、`access-token`、`token`、`Cookie`、`set-cookie`、`session`、`password`、`secret` 等字段；
- 不读取 `document.cookie`，不申请 cookies 权限，不读取请求头中的认证令牌；
- 不保存账号密码，不做后台自动爬取，不依赖家庭服务器；
- 数据只存在用户浏览器与本地下载数据中；
- GitHub Pages 静态站点可独立运行，无后端。

## 七、后续规划

- V3：扩展支持更多资产（股票、加密货币、银行资产），形成个人财富驾驶舱。