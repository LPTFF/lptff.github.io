# 币安合约观察采集插件任务记录（多资产升级第一轮）

- 日期：2026-08-24
- 目标：把单一基金采集插件升级为多资产插件，新增币安合约"观察采集"能力，让维护者在真实登录环境中用一次点击完成私有端点契约确认，替代人工 DevTools 抓包调试。
- 上游输入：[加密货币复盘助手产品分析](../product/source/crypto-review-product-analysis.md)（待审查）。
- **已被同日后续记录取代（防迷路）**：本文的三个专属文件（`binance-bridge.js`/`binance-collector.js`/`binance-capture.js`）已合并进通用观察引擎，登录调试入口从「加密货币观察 tab」变为「金融 tab 内的币安合约观察卡片」，v3.4.0 起报告还自动核对核心字段确认度（Position/Equity/Order/Funding）。最新状态与调试清单见 [多领域观察采集插件任务记录](multi-domain-observation-extension-20260824.md) 与[多领域采集产品数据诉求](../product/source/multi-domain-data-requirements.md)；本文保留作演进过程与架构决策依据（决策 1/2/4 与安全边界仍有效，已被通用引擎继承）。

## 架构决策

1. **后台不自行请求币安**。实测（2026-08-24，无凭据 curl）：本机 `fapi/api/www.binance.com` 全部连接超时，`data-api.binance.vision`（官方公开行情域）HTTP 200 可达。结论：插件无法假设直连币安的网络路径（用户走浏览器代理），且后台跨域请求引入 CORS 与代理双风险。因此沿用基金插件的已验证模式——**只被动捕获页面自身发出的请求**，行情与私有事实都从已登录页面自身的流量取得。
2. **观察优先（observation-first）而非直接契约**。币安合约页私有端点（`/bapi/*` 路径、字段语义、WS 流归属）未在真实登录环境确认，不预设契约；观察桥按「候选前缀（/bapi /fapi /api /sapi）+ 排除清单（pay/p2p/kyc/提现等强敏感路径）」宽匹配，产出端点清单报告。契约经登录调试确认后再升级为正式 `binance-source-capture/1.0`（对齐 `eastmoney-source-capture/1.0` 定位）。当前协议为 `binance-observation-capture/0.9`（kind: observation，明确标注草稿语义）。
3. **MAIN world 注入必须 document_start**：持仓/账户等 bapi 请求在页面加载时即发出，事后注入会错过。观察桥常驻期货页、纯内存记录、有上限（REST 400 快照/WS 40 流×5 样本），观察开始时清零（报告只覆盖本次窗口）。
4. **WebSocket 双保险**：合约页可能把行情流放进 Worker。页面级补丁看不到 Worker 内 WS，因此同时记录 Worker/SharedWorker 脚本 URL——"有 Worker 但无页面级 WS"本身就是「流在 Worker 中」的证据，覆盖度报告如实呈现该 unknown。
5. **基金链路零改动**：全部新代码在新文件（binance-bridge/binance-collector/binance-capture），background/popup 仅增量修改且原有行为不变；暂存键独立（`cryptoObservationStaging`），两任务互斥。协议、脱敏、残留自检标准与基金对齐。

## 实现内容

| 文件 | 角色 |
| --- | --- |
| `content/binance-bridge.js`（新） | MAIN world 观察桥：fetch/XHR/WS/Worker 拦截、候选端点过滤、crypto 脱敏（csrftoken/bnc-uuid/listenKey/apikey/助记词/邮箱等）、容量上限、listenKey URL 脱敏 |
| `content/binance-collector.js`（新） | ISOLATED 中继：chrome.runtime ↔ window.postMessage |
| `binance-capture.js`（新） | 协议组装：buildObservationCapture（覆盖度 observed/unobserved + 自动警告）、desensitizeObservation（订单/成交/持仓 ID→稳定伪 ID，邮箱→掩码）、residualCheck（原值残留+邮箱残留，宁可失败不生成假脱敏文件） |
| `background.js`（增） | 观察编排：定位/新开期货页（用户自己的页永不关闭，新建页用后即关）、注入幂等、观察窗口 chrome.alarms 兜底兑现（popup 关闭也能收尾）、独立暂存/丢弃/双导出 |
| `collection-policy.js`（增） | cryptoCollectionOptions：观察采集仅 popup 可启动（Investment 页面暂无消费者） |
| `popup.*`（增） | 双模式切换（基金采集/加密货币观察，记忆上次选择）、观察倒计时/提前结束/双导出/丢弃、登录调试操作指引 |
| `manifest.json` | v3.2.0：+`alarms` 权限、+`https://*.binance.com/*` host、+期货页 document_start MAIN 注入 |

## 安全边界

- 不读取 `document.cookie`；不保存 Authorization/Cookie/csrftoken/listenKey/API key/助记词等任何认证字段（捕获时即递归剥离）。
- 正式采集只重放币安合约页已经使用的只读历史查询；认证请求模板仅保留在来源页 MAIN world 内存，不经消息传递、不写 storage/来源包。绝不调用下单、撤单、转账、提现或数据中心“生成”任务。
- 排除支付/P2P/KYC/提现路径；WS URL 中 listenKey 即刻脱敏为 `<LISTENKEY-MASKED>`。
- 脱敏导出残留自检失败即拒绝生成；完整备份仅限本地。
- 观察数据只在页面内存与本地 storage，不外传。

## 验收状态

已验证：全部脚本 `node --check` 通过；manifest JSON 校验通过（v3.2.0，5 组 content_scripts）；`node project-support/scripts/extension/build-zip.js` 成功生成 `dist-extension/lptff-investment-assistant.zip`（46703 bytes）。

未验证（按[可信验证](../standards/trusted-verification.md)如实声明）：**真实 Chrome 加载插件后的端到端观察流程未执行**——需要登录态币安环境，属维护者的登录调试环节。未加载验证前，本记录不声称观察采集可用，只声称静态交付完成。

## 维护者登录调试清单（你来做）

前提：Chrome 已加载新 zip（chrome://extensions → 加载已解压的扩展程序指向 `project-support/extension/lptff-investment-assistant/`，或直接加载 zip）。

1. **登录币安**（你平时的网络路径），打开任一合约页（如 `www.binance.com/zh-CN/futures/BTCUSDT`），等持仓/权益加载出来。
2. 点插件 popup → 「加密货币观察」tab → 「开始观察采集」（默认 90 秒）。
3. 观察期间在合约页里**正常操作一遍想复盘的功能**：切换 1–2 个合约、打开持仓面板、打开历史委托/成交记录、看一眼资金费率。
4. 倒计时结束自动生成报告（或点「提前结束并生成报告」）。
5. 「下载脱敏观察报告」→ 得到 `binance-observation-desensitized.json`，把文件给我（或贴关键片段）。
6. 期望从报告中确认的契约事实：
   - bapi 私有端点清单：持仓/保证金率/爆仓价/资金费率/历史成交各是哪条路径、字段名是什么；
   - WS 流归属：行情流和用户数据流是页面直连还是在 Worker 里（覆盖度报告会直接提示）；
   - 覆盖度 `unobserved` 的类别（如签名接口/用户流）→ 决定下一轮正式采集协议还要补什么。
7. 若首份报告 bapi 端点为 0：说明未登录或数据早于观察窗口加载 → 刷新合约页后立即重新观察一次。

## 下一步（收到观察报告后）

1. 按报告确认的端点契约写正式 `binance-source-capture/1.0`（结构化持仓/成交/资金费率快照，替代观察样本）；
2. 写 crypto adapter（`toInvestmentDataset` 对应的 crypto scope 版）与 Ledger 迁移；
3. 再往后才是 WP0-2 防爆仓三判断的产品切片。
# 2026-08-24 最终来源采集闭环（v3.6.0）

观察采集已降级为端点契约诊断方法，不再作为币安产品的最终交付。扩展新增“合约复盘 · 来源采集”正式任务，后台复制当前合约页并生成 `binance-source-capture/1.0`；三条产品支线为“账户权益与头寸”“委托与成交事实”“标记价格与资金费率”。正式来源包写入一次性 `binanceStaging`，Investment OS 成功写入本地 Ledger 后 ACK 清除暂存。

站点 `/cryptocurrency` 已替换旧静态 JSON 工具，新增来源包校验/标准化、独立 `contract-review-db` IndexedDB Ledger、采集/导入/丢弃控制、Coverage 与 Position/Equity/Order/Funding 事实表。页面发起采集时会等待后台任务完成并自动导入，不做行情预测，不发起交易，也不在规则范围未确定前生成风险结论。

Chrome DevTools MCP 真实验收：用户实际扩展由 3.5.1 重载到 3.6.0；已登录 ETHUSDT 原页保持打开。先将历史正式来源包导入为第 1 批，再从 `/cryptocurrency` 点击一次“开始高效采集”，后台副本完成后自动关闭，20:38:21 新批次自动写入 Ledger 并 ACK，页面显示 2 条头寸、11 个权益资产、37 条订单、21 条资金费率事实和 1 条合约配置，本地档案由 1 批增至 2 批。刷新后 2 批仍在，插件显示暂存已确认清除；原币安页未刷新/关闭，Console 无 error/warn/issue。

## 2026-08-24 订单契约与金融页统一（v3.6.1）

`filled-order` 返回的是历史成交摘要，不提供开放订单才有的 `type / positionSide / origQty`。旧版用开放订单字段集合校验全部 37 条记录，造成“数量 37/37、字段完整度 2/37”的误导。v3.6.1 按来源端点区分 `openOrder` 与 `filledOrderSummary`：前者校验委托类型、持仓方向和原始数量，后者校验合约、方向、状态、成交量、均价、更新时间等真实可用字段，不推测 LIMIT/MARKET。21:02:59 真实重采集结果为 `orders complete 37/37`；逐笔 Trade 仍单列为 0，不与历史成交摘要混为一谈。

插件金融页把基金与合约统一为相同卡片结构：领域标识、标题、说明、主按钮、三条支线、数据质量、状态块、来源包/设置折叠区。字段覆盖改为中文数据质量摘要，高级入口分别归属各自卡片。Chrome DevTools MCP 验收显示两张卡结构一致，合约三支线均完成，数据质量为头寸 2/2、权益 11/11、委托与历史成交摘要 37/37、资金费率 1/1；自动导入后的支线状态同步收口为完成，Popup Console 无 error/warn/issue。

## 2026-08-24 对齐币安数据下载中心的全量历史（v3.7.0）

合约正式结果改为币安官方同名四类核心历史：合约订单历史、交易历史、持仓历史、资金流水；当前权益、头寸、标记价格、资金费率与合约配置降为补充快照。插件先读取 `get-first-trade-time` 确立账户时间轴，再按 90 天窗口覆盖首笔交易至当前时刻。订单、成交和流水分页到底；持仓接口没有可靠页码时，若 `total` 大于返回条数则递归二分时间区间，直到能证明没有截断。来源包记录 requested range、窗口数、页数、请求数和各分支完整性。

Chrome DevTools MCP 在用户实际登录 ETHUSDT 环境验收：原合约页始终保留，后台副本自动创建并关闭；17 次只读请求覆盖 2025-10-17 19:33:16 至 2026-08-24 21:25:09 的 4 个 90 天窗口，最终写入订单历史 60、交易历史 197、持仓历史 48、资金流水 408 条。最初资金流水因错误使用可重复的 `tranId` 去重而从 408 误减为 278，已改用每条记录 `id` 为主键并重采通过；订单接口加入时间窗口后由近期 47 条扩展为 60 条。跨数据集核对发现 197 条成交涉及 149 个订单号，在线订单历史仍缺 89 个已被成交证明存在的订单，因此订单分支必须标为 partial，不能把“接口遍历完成”误报为“账户归档完整”；其他三类为 complete。`/cryptocurrency` 自动导入、ACK 清暂存、IndexedDB reload 恢复均通过，刷新后 Console 无 error/warn/issue；官方数据中心“生成”未调用，额度未消耗。

## 2026-08-24 并行提效与成交订单重建（v3.8.0）

四类历史由串行改为并行采集，开始后同时进入“进行中”；后台副本在历史遍历完成且首屏快照已稳定后立即合并，不再固定等待 30 秒，30 秒闹钟只作为 Service Worker 中断时的兜底。Popup 与合约台账统一使用“开始高效采集”、并行阶段提示和自动导入反馈。

在线订单历史接口漏掉的 89 个订单，不再只显示缺口：插件按 `orderId` 聚合逐笔成交，使用成交量加权均价、累计成交量、首末成交时间重建 `tradeReconstructedOrder`，与 60 条 `filled-order` 在线事实合并去重。来源台账逐条标注“币安在线”或“成交重建”，分支显示“在线 60 + 成交重建 89”。此处完整性含义是“全部有成交证据的订单均已覆盖”；没有成交的陈年撤单无法从成交事实推导，仍受币安在线留存范围限制，来源包 limitation 明确保留这一边界。

Chrome DevTools MCP 多轮真实重采耗时约 9–12 秒：订单历史 149/149、交易历史 197/197、持仓历史 48/48、资金流水 408/408 全部完成，账户与行情快照 61 条；IndexedDB 核对为在线 60、成交重建 89，重建记录保留成交端点来源与推导标记。后台副本自动关闭，用户 ETHUSDT 原页未刷新/关闭，Console 无 error/warn/issue，官方生成额度未使用。

## 2026-08-24 按官方历史委托面板纠正来源（v3.9.0）

v3.8.0 把 `/order/filled-order` 误当成完整历史委托，因而产生“在线 60 + 成交重建 89”的中间口径。Chrome DevTools MCP 重新检查币安合约页的 Elements 与 Network 后确认：基础单历史真实调用 `/order/order-history`，带账户类型、五种终态、时间区间和 100 条分页；条件委托历史真实调用 `/order/get-all-algo-order`，带条件单类型、五种终态、时间区间和 100 条分页。两者都能按页面提供的最长 3 个月区间切片，不需要从成交推导委托。

v3.9.0 删除全部成交重建逻辑，90 天切片内并行遍历基础单和条件委托，再按官方记录主键合并。Investment OS 和 Popup 统一显示“基础单 / 条件委托”，不再出现“币安在线 / 成交重建”。完整性以每个窗口、每种来源的分页是否读到 `total` 为准；跨窗口重复记录只计为去重，不计为缺失。

真实登录环境重采覆盖 2025-10-17 19:33:16 至 2026-08-24 22:03:12：基础单 365、条件委托 134，共 499 条唯一官方委托；11 个委托请求页原始返回合计 500 条，其中 1 条跨段重复。交易历史 197、持仓历史 48、资金流水 408 均完整。正式包四类核心 coverage 全部 `complete`、warnings 为空、推导委托为 0；后台副本自动关闭，用户原 ETHUSDT 页未刷新或关闭，Investment OS Console 无 error/warn/issue，官方生成额度未使用。

## 2026-08-24 自动导入后的导出状态收口（v3.9.1）

Investment OS 自动导入后会 ACK 并清除插件一次性暂存；旧 Popup 仍保留下载入口，若在导入与点击之间发生清除，会收到“当前没有正式来源包”的生命周期错误。v3.9.1 在无待导入暂存时隐藏插件下载按钮，已导入状态展示最近一批四类计数并明确提示插件暂存已清除；导出发生竞态时刷新为已导入状态，不再显示失败。合约说明同步删除“成交事实补齐”的旧口径。

Investment OS 合约复盘台账新增“导出正式来源包 / 导出脱敏来源包”，直接导出台账中已保存的 `rawCapture`，因此自动导入后仍可取得文件，同时不恢复插件一次性暂存。Chrome DevTools MCP 在真实页面点击脱敏导出后，下载记录出现带采集时间的 JSON 文件，页面反馈成功，Console 无 error/warn/issue。

## 2026-08-24 内置币安脱敏快照

维护者提供的 `C:\Users\TFF001\Desktop\binance-source-desensitized.json` 已作为法律脱敏结构样本写入 `project-support/fixtures/crypto/binance-source-desensitized.json`，SHA256 为 `6962FA5F5BD57C337AA1DB338EE8E18CEFC942A8EFA5FB707FE46FFE953CABA4`。协议为 `binance-source-capture/1.0`；订单历史 499、交易历史 197、持仓历史 48、资金流水 408，四类核心 coverage 全部 complete，warnings 为空。自检未发现认证字段或未替换的订单、交易、仓位、流水数字标识。

合约复盘页像基金复盘一样通过 Vite `?url` 引入独立 JSON 资源，并提供显式“导入内置脱敏快照”入口；快照不会默认冒充当前账户。Chrome DevTools MCP 真实点击导入后，IndexedDB 新增采集时间 2026-08-24 22:13:05 的批次，页面显示四类数量与完整覆盖，Console 无 error/warn/issue。

## 2026-08-24 保留旧加密货币分析并拆分合约复盘（v3.9.2）

维护者确认合约复盘应作为新增产品入口，不能替换原有加密货币分析。`/cryptocurrency` 已恢复为 `views/Message/Cryptocurrency.vue`，继续承载旧持仓分析与策略展示；合约来源台账迁至独立 `/contract-review`。InternalWebsite 同时展示“加密货币分析”和“合约复盘”两张卡片。扩展网页桥接和采集来源校验同步迁至 `/contract-review`，版本升至 3.9.2。

Chrome DevTools MCP 在用户实际 Chrome 验收：从导航分别点击后，`/cryptocurrency` 显示原“加密货币分析 - tangfufa”页面并在刷新后保持；`/contract-review` 显示合约复盘台账。实际重载未打包扩展至 3.9.2 并刷新新路由后，插件桥接从“未响应”恢复为“本地台账已就绪”，合约页 Console 无 error/warn，用户原币安 ETHUSDT 页未刷新或关闭。
