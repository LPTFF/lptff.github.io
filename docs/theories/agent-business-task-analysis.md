# Agent 业务任务分析协议

- **领域**：Cognitive Work Analysis、Task–Technology Fit、Sensemaking、Information Foraging、Representation、Bounded Rationality、Human-Centred Design
- **状态**：已转化，验证中
- **收藏日期**：2026-08-09
- **项目落地**：[业务任务分析执行规范](../standards/business-task-analysis.md)、[产品设计标准](../standards/product-design.md)、[产品工作台](../product/README.md)

## 它试图解决什么问题

软件需求经常以“加一个导出”“做个大表格”“提供搜索”“展示更多字段”等技术能力出现。能力名称说明了可能的实现手段，却不自动说明用户最终要完成什么任务、回答什么问题、依据什么信息作出判断，以及完成整个任务还要付出多少成本。

如果 Agent 直接把能力名称当成业务目标，可能交付了可运行的 UI、API 或代码，却把搜索、筛选、比较、计算、解释和后续行动留给用户。局部取数更快，也不等于端到端任务更容易完成。

本协议综合多组理论，为项目建立一条可追溯的分析链：

```text
业务目的 / 系统约束
  → 用户任务
  → 用户需要回答的问题或作出的判断
  → 所需信息
  → 信息获取、加工与表示
  → 技术能力
  → UI / API / 数据
  → 代码
```

这条链是**本项目的工程综合**，不是下列任一理论或标准的原始模型。它用于暴露目的与手段之间的断点，不用于在证据不足时补齐一个看起来完整的故事。

## 理论基础与原始主张

### Cognitive Work Analysis 与 Abstraction Hierarchy

Rasmussen 的认知工程研究以及后续 Cognitive Work Analysis 使用抽象层级描述工作域中的 means–ends 关系。相邻层之间可以用 WHY（上层目的或约束）和 HOW（下层实现方式）理解：同一能力在不同目的下可能承担不同角色，同一目的也可能有多种实现手段。

本项目据此得到的分析规则是：被点名的功能先作为候选手段，至少向上追问一层 WHY，并向下说明一层 HOW。这里的“一层”是防止功能名直接等同于任务的最低检查，不是 Rasmussen 理论规定的固定问答次数。

例如“Excel 导出”首先只表示一种技术能力。只有结合上下文后，才能判断它是在支持完整归档、跨系统交换、审计留痕、对账、异常识别还是其他任务。

### Task–Technology Fit

Goodhue 与 Thompson 的 Task–Technology Fit 模型关注技术能力与用户必须执行的任务之间是否匹配。技术本身可用，不代表它适合目标任务；匹配程度还取决于任务特征和技术功能。

本项目把它转化为一个定性判断：

- **HIGH**：能力直接降低目标任务的主要成本；
- **MEDIUM**：能力解决必要中间步骤，但用户仍要完成重要加工；
- **LOW**：技术可运行，却把大部分关键工作留给用户；
- **UNKNOWN**：任务或使用证据不足，不能判断匹配度。

这四档是项目分析语言，不是原论文提供的通用评分量表。若需要比较方案，应写明理由和证据，不能只贴等级。

### Sensemaking 与总任务成本

Russell、Stefik、Pirolli 与 Card 将 sensemaking 描述为寻找合适表示、把信息编码进表示并用其回答任务问题的过程。用户成本不仅来自取数，还来自建立结构、转换、比较和推理。

因此项目区分：

```yaml
optimization:
  retrieval_improvement: high
  overall_task_improvement: low
```

这表示取数可能显著变快，但端到端任务只得到有限改善。该 YAML 是说明差异的示例，不是理论原文格式，也不是强制输出模板。

### Information Foraging

Pirolli 与 Card 的 Information Foraging Theory 研究人在信息环境中如何依据线索、收益和成本寻找信息。对软件设计而言，“系统暴露了更多数据”不自动意味着“用户更容易找到有用信息”。

项目分析信息密集型功能时，关注：

- **访问成本**：到达信息需要多少入口、权限、等待或页面跳转；
- **搜索成本**：需要多少查询、过滤、翻页和浏览；
- **识别成本**：用户能否快速分辨相关、异常或重要信息；
- **加工成本**：还要做多少清洗、汇总、计算和转换；
- **注意成本**：无关信息、弱线索和频繁切换占用多少注意力。

这些成本是项目检查维度，不声称等同于理论的完整数学模型。

### Representation Theory

Larkin 与 Simon 说明，信息等价的表示可能带来不同的搜索和计算效率。表示会通过信息分组、位置关系和可感知推理改变问题求解成本。

项目据此检查表示是否支持用户实际需要的操作：

- search：定位目标信息；
- recognition：识别类别、状态、模式或异常；
- comparison：在对象、时间或方案间比较；
- inference：从信息得到任务相关结论。

核心边界是：**数据等价不等于任务等价**。原始记录、导出文件、聚合指标、趋势图和异常列表即使来自同一数据，也可能对目标任务提供完全不同的支持。

### Bounded Rationality

Simon 的 bounded rationality 研究拒绝把决策者视为拥有无限信息、时间和计算能力的完全理性主体。现实中的判断受到可获得信息、认知能力和环境约束影响。

因此项目必须区分“字段或数据可获得”与“人在当前场景中能据此作出可靠判断”。完整数据集不自动证明信息量适当、关系可见、表示可理解或决策可执行。

### ISO 9241-210 Human-Centred Design

ISO 9241-210:2019 为交互系统全生命周期的人本设计原则与活动提供要求和建议，强调理解并明确使用情境、用户、任务与环境，并通过以用户为中心的评价推动设计迭代。

ISO 官方目录显示该标准为第 2 版，发布于 2019-07，最近在 2025 年复审并确认，当前版本仍有效。它支持以用户、任务和使用情境评价交互系统，但不直接规定本项目的业务图、TTF 分档或 YAML 结构。

## 项目的工程综合

### 目的与实现双向可追溯

面对非简单产品或代码任务，项目使用以下业务图检查链路：

```text
[业务目的 / 系统约束]
          │ WHY
          ↓
      [用户任务]
          ↓
 [问题 / 判断 / 决策]
          ↓
      [所需信息]
          ↓
 [获取 / 清洗 / 聚合 / 计算]
          ↓
      [信息表示]
          ↓
      [技术能力]
          ↓
   [UI / API / Data]
          ↓ HOW
        [Code]
```

每个重要实现节点应该能向上说明 WHY，每个已确认目标应该能向下说明 HOW。链路断裂时记录缺口；不得用未经证实的业务目的把图补完整。

证据可来自需求、项目资料、当前代码、API、数据库、测试、真实消费者或真实使用。不同来源只能支持其直接覆盖的结论；来源冲突时应暴露冲突并继续核验。

### 信息密集型功能需要加强分析

搜索、列表、筛选、报表、仪表盘、Excel/CSV、日志、BI、大表格、统计和监控通常把大量信息加工留给人。分析这些功能时，至少回答：

1. 用户最终要回答什么问题或作出什么判断？
2. 完成判断实际需要多少信息，系统又暴露了多少？
3. 用户还要执行哪些搜索、过滤、比较、计算、转换或推理？
4. 改动降低的是访问/取数成本，还是端到端 sensemaking 成本？
5. 当前表示是否支持所需的搜索、识别、比较和推理？
6. 技术能力与用户任务的实际匹配度是什么，依据是什么？

### 大数据导出的不同任务

“导出一万行”本身既不是好方案，也不是坏方案：

- 若任务是归档、审计留存或系统间数据交换，用户需要的是完整记录，CSV/Excel 可能直接降低主要任务成本，TTF 可以是 HIGH。
- 若任务是人工识别异常交易，原始导出只解决访问数据。用户仍可能需要排序、筛选、聚合、比较、计算、识别异常并回到原系统采取行动，TTF 可能只有 MEDIUM 或 LOW。

判断必须基于任务和剩余工作，不能仅以导出成功、行数完整或文件可打开宣告业务目标完成。

## 当前项目采纳范围

当前项目将以下最小规则转化为执行规范：

1. 非简单需求中的功能名称先视为候选手段，而不是自动视为业务目的或用户任务。
2. 至少建立一层向上 WHY 和一层向下 HOW；重要链路从目的、任务、判断、信息、表示追踪到实现。
3. 证据不足的目的、任务和链路必须标为未知或缺失，不得伪造。
4. 方案需要说明 Task–Technology Fit 及用户仍需承担的关键工作。
5. 信息密集型功能必须检查访问、搜索、识别、加工、比较和推理成本，以及表示是否支持目标判断。
6. 必须区分局部检索改善与端到端任务改善。
7. 只有发现重要业务结构、关键缺口或任务—技术错配时，才显式输出完整业务分析；简单任务不强制套模板。
8. “产品更有效”的结论仍需遵循[可信验证执行规范](../standards/trusted-verification.md)，由匹配目标任务的 Oracle 和真实证据支持。

这些规则不要求每个问题都生成业务图，也不授权 Agent 替人决定目标、产品范围、风险承受能力或成功标准。

## 可选的显式记录形式

当分析发现重要业务结构、跨层断点或需要维护者取舍时，可以使用表格、短段落或以下结构。字段允许删减；没有证据的值写 `unknown`，不为格式完整而猜测。

```yaml
business_analysis:
  purpose:
    value: unknown
    confidence: unknown
  task:
    value: ""
  decision_or_question:
    value: ""
  required_information: []
  transformations: []
  representation:
    current: ""
    required_operations: []
    mismatch: ""
  technology:
    value: ""
  task_technology_fit:
    value: unknown
    reason: ""
  sensemaking_cost:
    access: unknown
    search: unknown
    recognition: unknown
    transformation: unknown
    comparison: unknown
    inference: unknown
  outcome_gap:
    user_receives: ""
    user_actually_needs: ""
  implementation: []
  evidence: []
  missing_links: []
```

## 适用边界与局限

- 该协议适合目标、任务或方案可能错配的复杂需求，不适合把明确的小修变成业务研究项目。
- WHY 追问不能自动发现唯一真实目的；不同参与者可能拥有冲突目标，系统约束也可能比单一业务目的更重要。
- 定性 TTF 和成本等级帮助暴露差异，但不是经验证的量化测量工具。
- 任务分析不能代替用户研究、领域专家判断、真实使用观测或产品取舍。
- 用户陈述、文档、代码和行为数据都可能不完整；协议只能让未知可见，不能凭结构消除未知。
- 更好的信息表示不能保证正确判断；数据质量、领域知识、风险偏好和外部环境仍会影响结果。
- ISO 9241-210 的标准文本受版权保护；本卡片只记录官方目录元数据和概括性关联，不声称替代标准正文。

## 当前证据与未知

当前仓库已经存在与本协议相容的产品实践：[产品设计标准](../standards/product-design.md)要求从用户决策或任务开始，并明确人类可理解性和渐进披露；[产品工作台](../product/README.md)区分当前事实、目标产品与历史资料；[Investment Review 人的产品审查](../product/investment-review.md)把用户问题、当前差距、纵向分工和人工验收放在同一审查面。新增协议为这些实践提供目的—手段、信息成本和表示层的理论依据。

但“文档已经落地”不能证明协议会改善产品：

- Agent 是否会减少把功能名直接当作任务的情况，仍需观察；
- 加强分析是否减少无效信息展示，还是增加不必要讨论，仍需观察；
- HIGH/MEDIUM/LOW 判断在不同任务中能否保持一致，仍需真实案例复评；
- 结构化记录是否只在重要断点出现，而不会演化为固定仪式，仍需观察；
- 当前产品方向由维护者和真实使用证据决定，理论不能替代该判断。

## 主要来源

以下来源用于追溯理论原始主张；查阅日期均为 2026-08-09：

- Jens Rasmussen, *Information Processing and Human-Machine Interaction: An Approach to Cognitive Engineering*, North-Holland, 1986。
- Kim J. Vicente, *Cognitive Work Analysis: Toward Safe, Productive, and Healthy Computer-Based Work*, Lawrence Erlbaum Associates, 1999。
- Dale L. Goodhue & Ronald L. Thompson, “Task-Technology Fit and Individual Performance”, *MIS Quarterly*, 19(2), 1995, pp. 213–236, [DOI: 10.2307/249689](https://doi.org/10.2307/249689)。
- Daniel M. Russell, Mark J. Stefik, Peter Pirolli & Stuart K. Card, “The Cost Structure of Sensemaking”, *CHI ’93*, 1993, pp. 269–276, [DOI: 10.1145/169059.169209](https://doi.org/10.1145/169059.169209)。
- Peter Pirolli & Stuart Card, “Information Foraging”, *Psychological Review*, 106(4), 1999, pp. 643–675, [DOI: 10.1037/0033-295X.106.4.643](https://doi.org/10.1037/0033-295X.106.4.643)。
- Jill H. Larkin & Herbert A. Simon, “Why a Diagram is (Sometimes) Worth Ten Thousand Words”, *Cognitive Science*, 11(1), 1987, pp. 65–100, [DOI: 10.1111/j.1551-6708.1987.tb00863.x](https://doi.org/10.1111/j.1551-6708.1987.tb00863.x)。
- Herbert A. Simon, “A Behavioral Model of Rational Choice”, *The Quarterly Journal of Economics*, 69(1), 1955, pp. 99–118, [DOI: 10.2307/1884852](https://doi.org/10.2307/1884852)。
- International Organization for Standardization, [ISO 9241-210:2019 — Human-centred design for interactive systems](https://www.iso.org/standard/77520.html)，官方目录显示 2019-07 发布、Edition 2、2025 年复审确认且当前有效。

## 复评触发条件

出现以下情况时，应重新检查理论卡片和执行规范：

- 规则被用于简单任务并显著增加沟通或维护成本；
- Agent 仍频繁把技术交付当作用户任务完成；
- 真实使用表明 TTF 或 sensemaking 成本判断与用户结果不符；
- 产品出现新的信息密集型、自动决策或高风险判断场景；
- 业务目的、系统约束、用户群体或产品方向发生实质变化；
- 新研究或标准变化使当前理论解释、来源状态或适用边界需要修正。
