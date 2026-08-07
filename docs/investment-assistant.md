# LPTFF 投资助手（个人基金复盘助手）

> 通过浏览器插件从天天基金页面主动导出自己的基金数据，在 GitHub Pages 页面完成资产分析、收益分析与投资复盘。
> 核心原则：不保存账号密码、不做后台自动爬取、不依赖家庭服务器、数据由用户自己控制、GitHub Pages 可独立运行。

## 一、整体架构

```
用户
  ↓ 登录天天基金
Chrome 扩展 (LPTFF Investment Assistant)
  ↓ 读取已登录页面 DOM
生成标准 fund-data.json
  ↓ 用户上传
GitHub Pages (lptff.github.io/investment)
  ↓ 纯前端分析
资产 / 收益 / 持仓 / 复盘
```

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

```json
{
  "version": "1.0",
  "source": "1234567",
  "updateTime": "2026-08-05",
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
      "ratio": 29.6
    }
  ],
  "transactions": [
    {
      "date": "2026-06-09",
      "type": "BUY",
      "fundCode": "017437",
      "fundName": "华宝纳斯达克精选",
      "amount": 5000
    }
  ]
}
```

字段说明：

- `account.totalAsset`：总资产（元）
- `account.totalProfit`：累计收益（元）
- `account.profitRate`：累计收益率（%）
- `holdings[].ratio`：仓位比例（%）
- `transactions[].type`：`BUY` / `SELL` / `DIVIDEND`

导入时仍会做归一化：缺失字段以默认值补全，金额支持千分位/百分号字符串。

## 四、网页端使用

1. 打开 `lptff.github.io/investment`；
2. 进入「导入数据」，拖入 `fund-data.json`，或点击「加载示例数据」体验；
3. 数据保存在浏览器 `localStorage` 键名 `fundData`，可随时「清空数据」；
4. 在导航查看资产总览、持仓、收益、交易、复盘。

## 五、Chrome 扩展使用

1. 进入 `chrome://extensions`，开启「开发者模式」；
2. 「加载已解压的扩展程序」，选择 `extension/lptff-investment-assistant/` 目录；
3. 登录天天基金并进入「我的资产 - 持仓」页面（`trade.1234567.com.cn/myAssets/hold` 之类）；
4. 点击扩展图标 → 「导出基金数据」，下载 `fund-data.json`；
5. 将该文件上传到网页端即可。

> 说明：扩展只在你主动点击时读取当前页面的 DOM，不会后台运行、不会保存账号密码、不会向任何服务器发送数据。

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

- 不保存账号密码，不做后台自动爬取，不依赖家庭服务器；
- 数据只存在用户浏览器与本地下载数据中；
- GitHub Pages 静态站点可独立运行，无后端。

## 七、V2：扩展与网页直通同步（已实现）

扩展「同步到复盘助手」按钮采集当前天天基金持仓页后，直接写入复盘页 `localStorage` 并自动切到该页，免去下载 JSON 和手动上传两步操作。数据仍只存在用户浏览器，不经过任何服务器。

使用步骤：

1. 在复盘页打开 `lptff.github.io/investment`（本地调试用 `http://127.0.0.1:8090/investment`）；扩展优先同步到已打开的本地调试页，否则同步到线上页；
2. 另开一个页签登录天天基金 → 进入「我的资产 - 持仓」；
3. 点击扩展图标 → 「同步到复盘助手」；
4. 复盘页自动刷新并展示数据，若停在导入页会自动跳到资产总览，无须手动导入。

> 若需本地留存 JSON 文件，扩展弹窗仍保留「下载 JSON 备份」按钮（V1 流程）。网页端 `FundLayout` 监听 `window` 的 `lptff-fund-data-updated` 事件刷新数据。

## 八、后续规划

- V3：扩展支持更多资产（股票、加密货币、银行资产），形成个人财富驾驶舱。