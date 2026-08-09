# LPTFF Investment OS 产品需求文档（PRD）

**文档版本**：V2.0
**产品阶段**：个人投资能力增强系统
**项目仓库**：LPTFF/lptff.github.io
**核心终端**：Chrome Browser Extension + `/investment` Web App
**产品形态**：Local-first Personal Investment Software
**目标用户**：个人使用
**文档状态**：研发基线
**优先级**：P0

---

# 1. 产品摘要

LPTFF Investment OS 是一个基于个人真实投资数据运行的投资决策辅助系统。

产品不以：

- 行情展示；
- 基金推荐；
- AI 预测涨跌；
- 自动买卖；
- 大规模采集平台数据；

作为主要价值。

产品核心目标是：

> 利用用户自己的真实投资数据，持续提升投资决策质量、执行一致性、风险控制能力和策略验证能力，使投资逐渐从“凭感觉”转变为“基于事实、规则和长期证据”。

产品由两个部分组成：

```text
Chrome Browser Extension
Investment Sensor
        ↓
获取真实投资事实
        ↓
Local Investment Ledger
        ↓
Investment Web App
        ↓
风险分析 / 规则判断 / 行为识别 / 策略验证
```

浏览器插件负责：

> 获取事实。

Investment 页面负责：

> 理解事实、形成规则、检查偏差、验证结果。

---

# 2. 产品背景

项目目前已经拥有投资相关页面和独立 `/investment` 基金复盘模块。

当前浏览器插件已经能够从用户已登录的天天基金页面获取账户、持仓、单基金详情、每日盈亏、定投页面和交易流水，并生成协议版本为 `1.1` 的本地投资数据。

真实采集结果已经证明当前协议可以包含：

- Account；
- Holdings；
- Daily Profit；
- Transaction；
- Raw Snapshot；
- Collection Warning。

现有真实文件也已经存在账户级数据与持仓级数据。

交易流水中能够识别实际发生的“银行卡定投”行为。

但不同数据源之间可能存在语义差异。例如真实交易流水可以观察到定投交易，而单基金定投页面仍可能显示“暂无定投计划”。

同时，当前交易历史存在覆盖范围限制，采集程序只能保证已经实际加载的时间范围和分页，数据中已经明确记录这一限制。

项目现有产品规划也已经从“扩展信息工作台”收敛到“利用私人数据持续改善重要决策”，并把交易场景作为第一落点。

因此下一阶段产品不应该继续扩大“信息展示”和“采集数量”，而应该开始建立真正的个人投资决策系统。

---

# 3. 产品定位

## 3.1 一句话定位

**基于个人真实投资事实运行的本地投资决策、风险控制和策略验证系统。**

---

## 3.2 产品不是

LPTFF Investment OS 不定位为：

- 天天基金替代品；
- 实时行情终端；
- 投资资讯平台；
- AI 荐股/荐基工具；
- 高频交易工具；
- 自动交易机器人；
- 云端财富管理服务；
- 全量金融数据仓库。

---

## 3.3 产品最终解决的问题

产品长期只回答五个问题：

### 现在发生了什么？

账户、资产、持仓、交易、盈亏真实状态是什么。

### 我的风险在哪里？

实际资金集中在哪些资产、指数、地区和风险因子。

### 现在是否需要行动？

是否触发自己事先定义的投资规则。

### 我的行为是否偏离系统？

真实交易是否属于既有投资策略，是否出现临时性或异常行为。

### 什么方法长期有效？

哪些投资行为贡献收益，哪些行为增加损失和回撤。

---

# 4. 产品目标

## 4.1 核心业务目标

通过持续积累个人投资数据，建立以下闭环：

```text
事实
↓
规则
↓
行动
↓
真实结果
↓
统计证据
↓
规则调整
↓
再次执行
```

使投资方法能够：

- 被记录；
- 被重复执行；
- 被量化；
- 被验证；
- 被修改；
- 被持续优化。

---

# 5. 用户价值目标

## 5.1 增强记忆能力

软件自动保存：

- 历史资产；
- 历史持仓；
- 真实交易；
- 每日盈亏；
- 投资规则；
- 规则变化；
- 行为分类；
- 策略结果。

用户不需要依赖记忆回想：

> 当时我为什么这么买？

---

## 5.2 增强风险识别能力

软件需要从：

```text
基金产品数量
```

进一步推导：

```text
实际底层风险暴露
```

例如多只不同基金可能实际上属于同一个指数或市场风险。

系统必须识别：

- Index Exposure；
- Region Exposure；
- Asset Class Exposure；
- Currency Exposure；
- 重复资产暴露；
- 集中度。

---

## 5.3 增强执行能力

把用户自己的投资方法转换成 Policy：

```text
什么时候正常投资
什么时候增加
什么时候停止增加
最大仓位多少
什么情况必须重新判断
```

软件负责监控。

用户不需要每天重新做一次完整判断。

---

## 5.4 增强学习能力

长期验证：

```text
计划内投资
VS
临时投资

定期投资
VS
主动择时

规则内交易
VS
规则外交易
```

最终形成基于个人真实历史的 Evidence。

---

# 6. 产品设计原则

## 6.1 默认无需操作

最理想的首页状态不是：

> 今天有三个机会。

而是：

> 当前投资系统正常，今天无需操作。

---

## 6.2 只在重要时刻打扰用户

只有以下情况进入 Action：

- 规则触发；
- 风险超过边界；
- 出现异常交易；
- 数据不足以支持判断；
- 发现无法自动分类的新行为。

---

## 6.3 自动优先

凡是能够从真实数据推断出来的内容，不要求用户手工填写。

例如：

交易时间、金额、基金、收益结果、定投行为原则上均自动获得。

---

## 6.4 事实优先

产品严格区分：

```text
Fact
Inference
Suggestion
```

不能把推断当作事实保存。

---

## 6.5 数据最小化

浏览器插件只获取支持现有投资判断所需要的数据。

不以：

> 数据越多越好

作为产品指标。

---

## 6.6 Local-first

第一阶段所有私人投资数据：

- 本地处理；
- 本地存储；
- 不上传服务器；
- 不建设云账户；
- 不做远程埋点。

---

# 7. 产品整体架构

```text
┌──────────────────────────────┐
│ 天天基金                     │
│ Real Financial Source        │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│ Eastmoney Adapter            │
│ 平台真实适配层               │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│ Investment Protocol          │
│ 标准数据协议                 │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│ Investment Ledger            │
│ IndexedDB                    │
│                              │
│ Snapshot                     │
│ Holding                      │
│ Transaction                  │
│ DailyPnL                     │
│ Coverage                     │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│ Investment Core             │
│                              │
│ Exposure Engine             │
│ Policy Engine               │
│ Behavior Engine             │
│ Evidence Engine             │
└───────────────┬──────────────┘
                ↓
┌──────────────────────────────┐
│ Investment Web App          │
│                              │
│ 控制台                       │
│ 组合                         │
│ 规则                         │
│ 行动                         │
│ 证据                         │
│ 数据                         │
└──────────────────────────────┘
```

---

# 8. 浏览器插件产品需求

# 8.1 插件定位升级

当前插件从：

**数据采集工具**

升级成：

**Investment Sensor / 投资事实感知器**

插件仅负责：

1. 判断当前支持的数据源；
2. 获取新增投资事实；
3. 判断哪些数据存在缺口；
4. 将数据写入标准 Investment Protocol；
5. 同步至本地 Investment Ledger。

插件禁止负责：

- 投资推荐；
- 策略判断；
- 风险判断；
- AI 建议；
- 自动交易。

---

# 9. 插件首页升级

默认界面：

```text
LPTFF Investment

天天基金
● 已连接

上次同步
今天 08:30

────────────

账户
完整

持仓
完整

每日盈亏
最近数据完整

交易历史
部分覆盖

────────────

预计同步

账户最新状态
新增交易
最近每日盈亏

[同步最近变化]
```

---

# 10. 插件功能需求

## SENSOR-001 数据源识别

识别当前页面是否属于支持的数据页面。

状态：

```text
unsupported
ready
loading
authentication_required
error
```

---

## SENSOR-002 增量同步

默认行为从：

```text
重新采全部数据
```

变为：

```text
同步新增数据
```

DailyPnL 主键：

```text
fundCode + date
```

Transaction 首选主键：

```text
sourceTransactionId
```

如果不存在，则使用：

```text
date
+
fundCode
+
type
+
amount
+
status
```

作为 fallback fingerprint。

---

# 11. Data Coverage

新增核心实体：

```ts
interface DataCoverage {
  dataset:
    | "account"
    | "holdings"
    | "dailyPnl"
    | "transactions"
    | "fundDetail";

  knownRanges: DateRange[];

  completeness:
    | "complete"
    | "partial"
    | "unknown";

  lastSyncedAt?: string;

  warningCodes: string[];
}
```

---

## 插件展示

```text
数据覆盖

账户
████████████ 完整

当前持仓
████████████ 完整

每日盈亏
███████████░

交易流水
██████░░░░░░ 部分
```

---

# 12. 目的驱动采集

默认情况下插件不得主动要求获取全部历史。

如果某项分析需要历史：

```text
Evidence 分析需要：

2025-01 → 2026-08

目前：

2026-01 → 2026-08
```

Investment 页面发送：

```text
NeedDataRequest
transactions
2025-01 → 2025-12
```

插件再提示用户补充。

---

# 13. 插件与网页同步

JSON 文件继续保留为：

- 备份；
- Debug；
- 数据迁移；
- 手工导入。

但正常流程改成：

```text
Extension Storage
↓
Investment Web App
↓
IndexedDB
```

如果网页未打开：

```text
Extension Staging DB
```

暂存数据。

Investment 页面下次启动时执行 merge。

---

# 14. 插件高级功能

高级菜单：

```text
高级

数据覆盖
同步记录
异常日志
原始快照
导出数据
清除缓存
```

Raw Snapshot 不出现在普通产品流程。

---

# 15. 插件验收标准

V2 插件满足：

- 可以识别真实账户页面；
- 可以增量同步；
- 重复同步不产生重复交易；
- 重复同步不产生重复 DailyPnL；
- 数据覆盖可以识别 partial；
- 交易历史不完整时不会标记 complete；
- 支持失败、未登录、空数据状态；
- 正常用户无需操作原始 JSON；
- JSON 导出仍然可用；
- 不保存密码；
- 不保存 Cookie；
- 不新增远程服务器；
- 不后台无限采集。

---

# 16. Web 产品信息架构

主导航：

```text
投资

控制台
组合
规则
行动
证据

数据
```

对应：

```text
/investment
/investment/portfolio
/investment/policies
/investment/actions
/investment/evidence
/investment/data
```

---

# 17. 页面一：投资控制台

## 页面目标

用户进入 Investment OS 后 10 秒内知道：

> 当前投资系统是否正常，以及自己是否需要做事情。

---

## 17.1 系统状态

顶部：

```text
投资系统

● 正常

当前组合符合你的投资规则。

今天无需操作。
```

异常：

```text
⚠ 需要关注

1 条规则已经触发。

[查看]
```

---

## 17.2 账户状态

核心指标：

```text
总资产

当前持仓浮动盈亏

历史累计盈亏

最大回撤
```

禁止把：

```text
历史累计收益
```

直接当成：

```text
当前持仓收益
```

---

## 17.3 风险摘要

只显示最大的风险暴露：

```text
NASDAQ
42%

恒生科技
21%

黄金
10%

中国权益
XX%
```

---

## 17.4 Action

```text
需要处理
0

当前没有需要做出的投资判断。
```

或者：

```text
需要处理
1

NASDAQ Exposure
超过你的复核阈值。

[查看]
```

---

## 17.5 最近变化

```text
最近变化

新增 5 笔正常定投

NASDAQ Exposure
+0.8%

黄金 Exposure
-0.2%
```

不展示全部交易日志。

---

# 18. 页面二：组合 Portfolio

## 页面目标

回答：

> 我的钱实际上承担了什么风险？

---

## 18.1 Account

展示：

- Total Asset；
- Holding Value；
- Cash；
- Current Holding PnL；
- Cumulative PnL。

---

## 18.2 Fund Holdings

持仓表字段：

```text
基金
市值
持仓盈亏
仓位
底层指数
地区
策略
```

---

## 18.3 Exposure Engine

统一资产模型：

```ts
interface AssetMetadata {
  assetId: string;

  assetClass:
    | "equity"
    | "bond"
    | "commodity"
    | "cash"
    | "other";

  regions: string[];

  indexes: string[];

  currencies: string[];

  themes: string[];
}
```

---

## 18.4 Exposure 展示

```text
指数暴露

NASDAQ
████████

S&P 500
███

恒生科技
████
```

支持：

```text
指数
地区
资产类型
币种
主题
```

切换。

---

## 18.5 重复暴露

系统自动识别：

```text
重复暴露

NASDAQ

模拟基金 A
模拟基金 B
模拟基金 C

实际总暴露
XX%
```

只报告事实。

不自动评价对错。

---

# 19. 页面三：投资规则 Policies

## 页面目标

把投资方法转换成可以运行和验证的规则。

---

## Policy

```ts
interface Policy {
  id: string;

  name: string;

  objective: string;

  status:
    | "draft"
    | "active"
    | "paused"
    | "retired";

  currentVersionId: string;
}
```

---

## PolicyVersion

```ts
interface PolicyVersion {
  id: string;

  policyId: string;

  version: number;

  effectiveFrom: string;

  effectiveTo?: string;

  rules: PolicyRule[];

  changeReason?: string;
}
```

---

## 第一版 Rule

支持：

### Target Allocation

```text
NASDAQ

目标：
35%

允许：
25% ~ 45%
```

### Regular Investment

```text
正常定期投资
```

### Additional Investment

```text
允许额外增加的条件
```

### Pause

```text
超过最大风险暴露后暂停新增
```

### Review

```text
满足条件以后重新评估
```

---

# 20. Policy 版本管理

规则修改不得覆盖旧版本。

例如：

```text
NASDAQ Strategy

v1
2026-01 → 2026-04

v2
2026-04 → Now
```

以后 Evidence Engine 可以比较：

```text
v1
VS
v2
```

---

# 21. 页面四：行动 Actions

## 页面目标

整个系统唯一需要用户主动处理投资判断的地方。

---

## 默认状态

```text
待处理
0

当前没有需要你做出的投资判断。
```

---

# 22. Action 类型

第一版：

```text
POLICY_TRIGGER

RISK_REVIEW

UNCLASSIFIED_TRANSACTION

ABNORMAL_TRANSACTION

DATA_REQUIRED
```

---

## 22.1 Rule Trigger

```text
NASDAQ

当前风险暴露
46%

你的规则
最大 45%

请选择：

暂停新增
调整 Policy
暂时忽略
```

---

## 22.2 异常交易

如果正常行为：

```text
¥100
```

突然出现：

```text
¥5000
```

产生：

```text
发现异常投资行为

金额明显高于历史正常范围。

这是：

临时机会
调整策略
操作错误
其他
```

用户只回答一次。

---

# 23. 行为识别 Behavior Engine

自动分析真实交易：

```text
时间规律
金额规律
交易方向
资产类别
交易来源
```

识别：

```text
SYSTEMATIC_INVESTMENT

DISCRETIONARY_BUY

DISCRETIONARY_SELL

REBALANCE

UNKNOWN
```

---

## 重复行为发现

例如多次出现：

```text
固定周期
+
金额接近
+
同类型买入
```

产生：

```text
DetectedPattern
```

并提示：

```text
发现稳定的重复投资行为。

是否保存为一个 Policy？
```

---

# 24. 页面五：Evidence

## 页面目标

这是 Investment OS 的长期核心价值。

回答：

> 哪些投资行为真正有效？

---

# 25. Evidence 内容

按 Policy 展示：

```text
观察期

执行次数

投入金额

收益

XIRR

TWR

最大回撤

规则偏离次数

Evidence Strength
```

---

# 26. 行为对比

必须支持：

```text
Systematic Investment
VS
Discretionary Investment
```

```text
Policy Compliant
VS
Policy Violation
```

```text
Old Policy Version
VS
New Policy Version
```

---

# 27. Evidence Strength

禁止小样本产生强结论。

等级：

```text
INSUFFICIENT

WEAK

MODERATE

STRONG
```

例如：

```text
主动加仓

样本：
3

Evidence:
INSUFFICIENT

当前无法判断是否有效。
```

---

# 28. 收益归因

长期目标：

```text
我的投资收益来自哪里？

长期持有
+XXX

系统定投
+XXX

主动投资
+XXX

再平衡
+XXX

规则外投资
-XXX
```

---

# 29. 页面六：数据 Data Center

## 页面目标

明确回答：

> 系统知道什么，以及不知道什么。

---

## Data Health

```text
账户
完整

持仓
完整

每日盈亏
完整

交易历史
部分
```

---

## Coverage

时间轴展示：

```text
2025 ───────────── 2026

██████░░░██████████
```

---

## 数据缺口影响

系统不能只说：

```text
数据不完整
```

必须说：

```text
缺少：

2025-03 → 2025-06
交易历史

影响：

无法可靠计算该时期主动交易策略收益。

不影响：

当前持仓风险分析。
```

---

# 30. Investment Ledger 数据模型

IndexedDB：

```text
investment-db
```

Stores：

```text
accounts

portfolioSnapshots

holdingSnapshots

transactions

dailyPnl

dataCoverage

assets

policies

policyVersions

observations

actions

evidence
```

---

# 31. Core Domain Model

## AccountSnapshot

```ts
{
  id
  source
  capturedAt

  totalAsset

  currentHoldingPnl?

  cumulativePnl?
}
```

---

## PortfolioSnapshot

```ts
{
  id
  date

  totalAsset

  holdingValue

  cash?

  currentHoldingPnl?

  holdings[]
}
```

---

## Transaction

```ts
{
  id

  sourceTransactionId?

  occurredAt

  assetId

  type

  amount

  amountUnit

  confirmedAmount?

  status

  sourceType?

  behaviorType?

  policyId?
}
```

---

## DailyPnL

```ts
{
  assetId

  date

  nav?

  shares?

  dailyReturn?

  pnl
}
```

---

# 32. 数据来源分层

产品必须严格分：

```text
Source Raw Data
↓
Adapter
↓
Normalized Fact
↓
Inference
↓
Decision
```

禁止：

```text
Raw 天天基金字段
```

直接进入业务页面。

---

# 33. 双 Agent 研发约束

项目存在两个 Agent。

---

# 34. Agent A：主力 Agent

## 定位

**Investment Core + Product UI 主开发 Agent**

承担约：

```text
80% ~ 90%
```

开发工作。

---

## Agent A 可以访问

- 项目源码；
- Investment Protocol；
- Domain Model；
- Mock 数据；
- 单元测试；
- 脱敏测试结果；
- 页面；
- Exposure；
- Policy；
- Evidence；
- IndexedDB。

---

## Agent A 禁止访问

- 真实资产金额；
- 真实收益；
- 真实基金持仓；
- 真实交易流水；
- 真实银行卡信息；
- Raw Snapshot；
- Cookie；
- 登录状态；
- 真实账户 HTML；
- 未脱敏接口响应。

---

# 35. Agent B：Real Environment Agent

## 定位

**平台适配 + 真实环境验证 Agent**

承担约：

```text
10% ~ 20%
```

工作。

由于 Token 有限，禁止承担大规模产品开发。

---

## Agent B 负责

- Eastmoney Adapter；
- 真实页面 Selector；
- 真实 API Mapping；
- 登录状态验证；
- 分页验证；
- Real Data Smoke Test；
- Mock 是否覆盖真实结构；
- Schema Drift 检查。

---

## Agent B 不负责

- 页面设计；
- CSS；
- IndexedDB Core；
- Policy Engine；
- Exposure Engine；
- Evidence Engine；
- 大规模重构；
- 产品规划。

---

# 36. Agent 边界架构

必须形成：

```text
Real Eastmoney
      ↓
Eastmoney Adapter
      ↓
InvestmentSourceAdapter
      ↓
Investment Core
```

---

## InvestmentSourceAdapter

```ts
interface InvestmentSourceAdapter {

  getAccount():
    Promise<AccountSnapshot>;

  getHoldings():
    Promise<HoldingSnapshot[]>;

  getTransactions(
    range?: DateRange
  ):
    Promise<TransactionBatch>;

  getDailyPnL(
    assetId: string
  ):
    Promise<DailyPnL[]>;

  getCoverage():
    Promise<DataCoverage[]>;
}
```

---

# 37. MockInvestmentSourceAdapter

Agent A 只使用：

```text
MockInvestmentSourceAdapter
```

完成整个系统开发。

真实环境使用：

```text
EastmoneyInvestmentSourceAdapter
```

---

# 38. Mock Data Kit

必须建立：

```text
src/investment/__fixtures__/
```

至少包含：

```text
normal

empty

partial

stale

failed

complex

large
```

---

## normal

正常账户：

```text
多个持仓
正常盈亏
正常交易
完整 Coverage
```

---

## empty

```text
无持仓
无交易
资产为 0
```

---

## partial

```text
交易历史部分覆盖
DailyPnL 部分缺失
```

---

## stale

```text
数据超过 stale threshold
```

---

## failed

```text
Account 成功
Holdings 成功
Transactions 失败
```

---

## complex

包含：

```text
系统定投

主动买入

卖出

交易失败

未确认交易

重复底层风险

规则触发
```

---

## large

用于：

```text
大量交易
大量 DailyPnL
性能测试
```

---

# 39. Mock 数据安全要求

禁止从真实数据进行简单：

```text
姓名替换
金额乘 0.5
基金名称替换
```

这种“伪脱敏”。

Mock 必须完全人工构造。

真实：

```text
时间
金额
基金组合
交易组合
```

均不得被反推出。

---

# 40. Agent B 固定输出协议

Agent B 真实测试结果统一输出：

```text
Task:
SENSOR-REAL-XXX

Status:
PASS / FAIL / BLOCKED

Cases:

normal:
PASS

pagination:
PASS

failed request:
PASS

Schema drift:
NONE

Missing fields:
NONE

Required change:
...

Sensitive data exposed:
NO
```

---

# 41. Agent B 禁止输出

禁止在研发反馈中输出：

- 基金名称；
- 金额；
- 收益；
- 原始 JSON；
- 原始 HTML；
- 银行卡；
- 真实日期 + 金额组合；
- 完整 Network Log。

除非定位 Adapter Bug 必须临时使用，且不得提交项目仓库。

---

# 42. 开发任务拆分

## EPIC 0 — Architecture Boundary

### `INV-ARCH-001`

Owner：

**Agent A**

实现：

```text
InvestmentSourceAdapter
Domain Models
Mock Adapter
```

---

### `INV-REAL-001`

Owner：

**Agent B**

验证：

```text
Eastmoney
↓
InvestmentSourceAdapter

字段是否可完整映射。
```

---

# 43. EPIC 1 — Mock Infrastructure

## `INV-MOCK-001`

Owner：

Agent A

实现完整 Fixture。

---

## `INV-MOCK-REAL-CHECK`

Owner：

Agent B

只回答：

```text
Mock 缺少哪些真实边界情况。
```

---

# 44. EPIC 2 — Sensor/Data Trust

## Agent A

```text
SENSOR-001
Source Status

SENSOR-002
Source Warning

SENSOR-003
Coverage

SENSOR-004
Plugin UI
```

---

## Agent B

```text
SENSOR-REAL-001
正常登录

SENSOR-REAL-002
登录失效

SENSOR-REAL-003
分页

SENSOR-REAL-004
接口失败
```

---

# 45. EPIC 3 — Incremental Sync

Agent A：

```text
SYNC-001
Transaction Dedup

SYNC-002
DailyPnL Dedup

SYNC-003
Coverage Merge

SYNC-004
Incremental Import
```

Agent B：

```text
SYNC-REAL-001

真实同步两次
检查是否出现重复数据。
```

---

# 46. EPIC 4 — Investment Ledger

Agent A：

```text
LEDGER-001
IndexedDB

LEDGER-002
PortfolioSnapshot

LEDGER-003
HoldingSnapshot

LEDGER-004
Transaction

LEDGER-005
DailyPnL

LEDGER-006
Coverage

LEDGER-007
Migration
```

Agent B：

只执行：

```text
真实数据 Smoke Test
```

---

# 47. EPIC 5 — Web Foundation

Agent A：

```text
WEB-CONSOLE-001

WEB-PORTFOLIO-001

WEB-DATA-001
```

Agent B：

只验证真实数据：

```text
页面是否 Crash

空字段是否 Crash

负值是否正常

Partial Coverage 是否正确显示
```

---

# 48. EPIC 6 — Exposure Engine

Owner：

Agent A

任务：

```text
EXPOSURE-001
Asset Metadata

EXPOSURE-002
Index Aggregation

EXPOSURE-003
Region Aggregation

EXPOSURE-004
Duplicate Exposure
```

Agent B：

原则上不参与。

---

# 49. EPIC 7 — Policy Engine

Owner：

Agent A

任务：

```text
POLICY-001
Policy

POLICY-002
PolicyVersion

POLICY-003
Allocation Rule

POLICY-004
Review Rule

POLICY-005
Policy Evaluation

POLICY-006
Action Generation
```

---

# 50. EPIC 8 — Behavior Engine

Agent A：

```text
BEHAVIOR-001
Systematic Investment Detection

BEHAVIOR-002
Discretionary Investment Detection

BEHAVIOR-003
Abnormal Amount Detection

BEHAVIOR-004
Pattern Detection
```

Agent B：

只验证真实平台产生的交易语义能否正确进入分类器。

---

# 51. EPIC 9 — Evidence Engine

Agent A：

```text
EVIDENCE-001
XIRR

EVIDENCE-002
TWR

EVIDENCE-003
Drawdown

EVIDENCE-004
Policy Performance

EVIDENCE-005
Behavior Comparison

EVIDENCE-006
Evidence Strength
```

Agent B：

验证真实数据是否拥有足够字段。

如果不足：

```text
BLOCKED
```

禁止使用猜测数据补齐。

---

# 52. 产品版本规划

## V2.1 — Trusted Investment Ledger

目标：

> 建立可信的个人投资事实账本。

交付：

### Plugin

- Data Coverage；
- Incremental Sync；
- Dedup；
- Direct Sync；
- Source Status。

### Web

- IndexedDB；
- Snapshot；
- DailyPnL；
- Transaction；
- Data 页面；
- Console 基础版；
- Portfolio 基础版。

---

# 53. V2.1 验收流程

```text
进入天天基金
↓
打开 Plugin
↓
同步最近变化
↓
数据增量写入
↓
打开 Investment
↓
自动读取 Ledger
↓
显示：

账户状态
真实 DailyPnL
当前持仓
交易记录
Data Coverage

↓
明确：

无需操作

或者：

数据不足 / 存在异常
```

---

# 54. V2.2 — Exposure

交付：

```text
Asset Metadata

Index Exposure

Region Exposure

Asset Class

Duplicate Exposure
```

核心结果：

用户能够看到：

> 实际风险结构。

而不是只有：

> 基金产品列表。

---

# 55. V2.3 — Policy

交付：

```text
Policy

PolicyVersion

Allocation

Regular Investment

Pause

Review Condition

Action
```

核心结果：

系统第一次能够明确告诉用户：

> 当前组合符合规则，无需操作。

---

# 56. V2.4 — Behavior

交付：

```text
定投识别

主动交易识别

异常金额

未知交易

重复行为

Action Confirmation
```

核心结果：

降低用户手工记录成本。

---

# 57. V2.5 — Evidence

交付：

```text
收益计算

最大回撤

Systematic VS Discretionary

Compliant VS Violation

Policy Version Comparison

Evidence Strength
```

核心结果：

回答：

> 什么方法对我长期有效？

---

# 58. V3 — AI Research Assistant

AI 只建立在：

```text
Ledger
+
Policy
+
Evidence
```

之上。

AI 功能：

```text
解释

比较

发现模式

归因

总结
```

不以：

```text
预测

BUY

SELL
```

作为核心功能。

---

# 59. 产品指标

本产品不追求：

```text
DAU
使用时长
打开次数
```

因为投资软件打开次数越多不一定越好。

---

## 数据质量

```text
Transaction Duplicate Rate

DailyPnL Continuity

Coverage Completeness

Parsing Error Rate
```

---

## 自动化能力

```text
Auto Classified Transaction %

Manual Input Count

Monthly User Confirmation Count
```

目标：

> 随着系统成熟，人工维护次数持续减少。

---

## 行为质量

```text
Policy Coverage %

Policy Violation %

Abnormal Transaction Frequency
```

---

## 投资结果

长期观察：

```text
XIRR

TWR

Maximum Drawdown

Downside Volatility

Policy Performance

Policy-Compliant Performance
```

---

# 60. 隐私与安全要求

P0 要求：

- 不保存密码；
- 不保存 Cookie；
- 不上传真实账户数据；
- 不建设远程账户数据库；
- Raw Snapshot 仅本地；
- Mock 数据进入 Git；
- 真实数据禁止进入 Git；
- Real Validation Log 必须脱敏；
- Agent A 禁止访问真实数据；
- Agent B 真实结果必须使用固定摘要格式。

---

# 61. Git 结构建议

Agent A 主要修改：

```text
src/investment/

src/views/investment/

src/utils/investment/

tests/investment/

fixtures/
```

Agent B 主要修改：

```text
extension/
  lptff-investment-assistant/
    adapter/
    sensor/

tests/
  real-adapter/
```

---

# 62. Branch 建议

```text
feature/investment-core
```

Agent A。

```text
feature/eastmoney-adapter
```

Agent B。

真实环境适配代码尽可能限制在 Adapter 层。

---

# 63. Agent 开发流程

每个功能遵循：

```text
PRD Task
↓
Agent A
Mock Implementation
↓
Unit Test
↓
Build
↓
Agent B
Real Validation
↓
PASS / FAIL
↓
如果 Core Bug
Agent A 修

如果 Adapter Bug
Agent B 修
↓
再次验证
```

---

# 64. Agent B Token 控制原则

Agent B 每次只处理单一任务。

单次 Prompt 目标控制为：

```text
一个数据接口

一个真实场景

一个验证目标
```

禁止把完整 PRD 每次传给 Agent B。

---

## Agent B 示例任务

```text
任务：
验证 Transaction Adapter。

目标：

确认真实天天基金交易数据能够转换为：

id
date
type
assetId
amount
status
sourceType

只输出：

PASS / FAIL
缺少字段
未知状态
Mapping 问题

禁止输出：

任何真实基金名称
金额
账户信息
原始 JSON
```

---

# 65. Definition of Done

一个 Investment 功能只有同时满足以下条件才能标记完成：

### Core

- Mock Test PASS；
- Typecheck PASS；
- Build PASS；
- Edge Case PASS。

### Product

- 正常场景可用；
- Empty 可用；
- Partial 可用；
- Failed 可用；
- 不错误展示未知数据。

### Real Adapter

如果依赖真实平台：

- Agent B Real Validation PASS；
- 无 Schema Drift；
- 无敏感信息泄漏。

### Documentation

- Task 状态更新；
- 已记录遗留限制；
- 已记录下一阶段依赖。

---

# 66. 当前开发顺序

现在从以下顺序开始：

## 第一阶段

```text
INV-ARCH-001
Adapter/Core 隔离
```

↓

```text
INV-MOCK-001
完整 Mock Kit
```

↓

```text
SENSOR-003
Data Coverage
```

↓

```text
SYNC-001~004
增量同步
```

↓

```text
LEDGER-001~007
IndexedDB Ledger
```

↓

```text
WEB-CONSOLE-001
WEB-PORTFOLIO-001
WEB-DATA-001
```

完成这一阶段以后再进入：

```text
Exposure
↓
Policy
↓
Behavior
↓
Evidence
```

---

# 67. 当前明确不做

本阶段禁止范围扩张到：

- 股票券商账户；
- Crypto 真实账户；
- 银行资产；
- 自动买基金；
- 自动卖基金；
- AI 自动交易；
- 实时行情采集；
- 大规模财经新闻采集；
- 云端账号；
- 多用户；
- 社区；
- 策略市场。

只有基金闭环稳定以后再评估。

---

# 68. 最终产品闭环

最终日常体验应该是：

```text
用户正常投资
↓
隔一段时间同步一次
↓
Plugin 获取新增事实
↓
Ledger 自动保存
↓
Core 重新计算
↓
Policy Engine 检查

如果没有问题：

「今天无需操作」

如果出现问题：

「有 1 件事值得重新判断」

↓
用户做一次判断
↓
系统继续观察真实结果
↓
Evidence 积累
↓
长期发现：

哪些策略有效
哪些行为无效
哪些错误重复发生
哪些规则应该修改
```

---

# 69. 最终产品成功标准

LPTFF Investment OS 的成功，不以拥有多少页面、采集多少金融数据衡量。

真正成功的标准是：

### 软件越来越少要求用户输入。

因为它能够自动理解真实投资行为。

### 软件越来越少制造交易建议。

因为很多时候最优行动就是不行动。

### 软件越来越清楚用户真正承担的风险。

而不是只展示基金数量。

### 软件越来越能够证明某个策略是否有效。

而不是依赖感觉。

### 软件使用时间越长，对用户越有价值。

因为历史数据、规则版本和 Evidence 会持续积累。

---

# 70. 产品最终定义

**Chrome Extension 是用户投资世界的 Sensor。**

它扩展用户的：

> 观察能力。

**Investment Ledger 是用户的长期外部记忆。**

它扩展用户的：

> 记忆能力。

**Exposure Engine 是风险认知层。**

它扩展用户的：

> 风险识别能力。

**Policy Engine 是投资执行层。**

它扩展用户的：

> 规则执行能力。

**Behavior Engine 是行为观察层。**

它扩展用户的：

> 自我观察能力。

**Evidence Engine 是个人投资实验室。**

它扩展用户的：

> 长期学习能力。

最终产品不是让用户服从软件。

最终产品应该达到：

> **软件承担计算、记忆、监控和验证，把真正需要人判断的事情压缩到最少，让用户自己的投资能力随着真实经验不断增强。**