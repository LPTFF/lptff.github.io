# 投资绩效与决策复盘理论框架

- **领域**：Portfolio Management、Performance Measurement、Attribution、Appraisal、Behavioral Finance、Decision Quality
- **状态**：已转化，CFA 2026 摘要与 GIPS 官方入口已核验；论文正文及部分 GIPS 条款待进一步来源审计
- **收藏日期**：2026-08-09
- **产品落地**：[Investment Review 人的产品审查](../product/investment-review.md)、[工程契约与验证附录](../product/reference/investment-review-engineering.md)
- **产品输入**：维护者提供的《基金复盘产品：理论依据与完整业务逻辑 v1.0》

## 它试图解决什么问题

投资复盘很容易退化为收益展示、事后故事或 AI 建议。最终盈利会让人高估原决策，最终亏损会让人否定当时合理的过程；目标收益与绩效基准也可能被混用。没有版本化事前记录、现金流调整后的测量和数据能力匹配的归因，系统无法可靠回答“发生了什么、为什么、过程是否有质量”。

本框架为产品建立三层主干：

```text
Performance Measurement：客观发生了什么
→ Performance Attribution：可由现有数据支持的来源是什么
→ Performance Appraisal：这些证据对过程质量说明什么
```

该顺序来自投资绩效评价领域；本项目在此基础上增加 Decision/Outcome 分离、行为复盘、StrategyHypothesis 和 AI 可追溯边界。后半部分是工程综合，不声称是任何单一来源的原始模型。

## 原始理论与项目采用边界

### 1. 投资政策是事前约束

CFA Portfolio Management 体系把客户目标与约束、资产配置和绩效评价放在投资组合管理过程中。项目据此要求 `InvestmentPolicy` 记录收益目标、风险承受能力、期限、流动性和特殊约束，并按有效期版本化。

**项目采用**：历史复盘只能解析当时生效的 PolicyVersion；当前编辑不能回写历史。

**边界**：具体字段、状态和存储结构是产品设计，不是 CFA 的软件 schema。

### 2. Target 与 Benchmark 回答不同问题

Target 是个人希望达到的结果；Benchmark 是用于评价相同期间机会或 mandate 的比较参照。Benchmark 的选择会影响超额收益、归因与 appraisal。

**项目采用**：二者分开存储和展示；Benchmark 必须事前指定、版本化，并检查期间、币种和 return type 可比性。看到结果后重新挑选 benchmark 只能创建新版本，不能改变历史评价。

**边界**：项目采用“明确、可测量、适当、事前指定”等要求作为 benchmark 检查清单；是否可投资、责任归属等条件需结合个人组合的用途说明，不能把机构考核语境机械移植为所有个人 benchmark 的绝对要求。

### 3. TWR 与 MWR 衡量不同经验

Time-Weighted Return 通过子期间链接降低外部现金流时点对组合/策略表现的影响；Money-Weighted Return（可用 IRR/XIRR 表示）反映资金投入规模和时点后的投资者实际经验。

**项目采用**：同时保存 `strategyReturn` 与 `investorExperienceReturn`，不让其中一个替代另一个。计算前必须证明现金流、估值时点和期间边界足够可靠。

### 4. 归因必须匹配真实决策和数据能力

归因模型只有在输入和决策结构匹配时才有解释力。个人基金组合不应为了“完整”强行套用机构级模型。

**项目采用**：

- Level 1：基金收益贡献、benchmark/excess、现金流时点、成本和可验证 FX；
- Level 2：仅在目标/实际分类权重与分类 benchmark 完整时计算 allocation、selection、interaction；
- 证据不足返回 `INSUFFICIENT_DATA`，AI 不补原因。

### 5. Outcome Bias

Baron 与 Hershey 的实验研究显示，人在评价决策时会受到已知结果影响，即使评价目标是原决策质量。该研究支持把过程证据与最终结果分开，但不提供基金交易的自动评分公式。

**项目采用**：收益指标不得参与“事前决策过程是否合规”的确定性计算；输出保留四种组合：合理过程/正结果、合理过程/负结果、违规过程/正结果、违规过程/负结果。

### 6. Disposition Effect

Odean 对投资者账户的研究使用已实现盈利/亏损比例等方法观察到更愿意实现盈利、较少实现亏损的行为模式。

**项目采用**：PGR/PLR 只作为长期行为信号。需要可识别的成本基础、已实现与未实现头寸、足够样本和比较窗口；不能由 `PGR > PLR` 直接断言用户心理原因。

### 7. 交易频率与成本

Barber 与 Odean 对家庭账户的研究发现，高换手投资者的净绩效在样本中较差，交易成本是重要解释因素。

**项目采用**：同时观察 trade count、turnover、holding period、cost 和 excess return；只有频率和成本上升且结果未改善等证据共同出现时，才输出 `Possible Overtrading`。交易多本身不是违规。

### 8. Sharpe Ratio 的用途与限制

Sharpe Ratio 比较相对无风险资产的平均超额收益与收益波动，可用于特定条件下的风险调整比较。它依赖期间、频率、无风险收益、分布和可比性假设。

**项目采用**：Sharpe、Sortino、Information Ratio 等是多维证据，不生成万能排名或综合投资评分；必须显示输入口径和限制。

## 项目工程综合

### Decision Quality 与 Outcome Quality 分离

```text
Process Appraisal ── 不读取最终收益决定合规状态
Outcome             ── 只记录客观结果
```

多维 appraisal 使用 `COMPLIANT | PARTIAL | BREACH | INSUFFICIENT_DATA`，不生成虚假精确的单一分数。

### ReviewPeriod 固定顺序

```text
Objective
→ Measurement
→ Risk
→ Attribution
→ Decision Appraisal
→ Behavioral Review
→ Hypothesis Update
→ Rule Update
```

只有最后一步允许讨论下一版本规则。前面任何不足都必须传播为 limitation，而不是由 AI 补齐。

### StrategyHypothesis

个人经验先成为可证伪假设，再按样本和证据进入 `UNTESTED | INSUFFICIENT_EVIDENCE | PRELIMINARY | SUPPORTED | CONTRADICTED`。一次盈利或亏损不能完成状态跃迁。

### AI 边界

Deterministic code 负责收益、风险、benchmark、换手、成本、规则和状态。AI 只解释结构化 Finding、发现值得核查的关系、提出问题和生成摘要，并把输出标为 `FACT | INFERENCE | HYPOTHESIS`。重要结论必须关联 metric、transaction、decision 或 rule。

## GIPS 相关项目约束的使用方式

GIPS 是面向投资管理机构公平展示与完整披露的专业标准。项目参考其对收益口径、benchmark、费用和期间展示的严谨性，但个人本地复盘产品不声称 GIPS 合规。

以下作为产品 hard constraints 使用，实施前仍需在测试规格中记录直接依据：

- 现金和现金等价物不能从组合结果中静默消失；
- 费用必须有明确 gross/net 口径；
- benchmark 与组合必须使用可比较期间和收益类型；
- 少于一年期间不显示伪装成实绩的年化收益。

这些是产品保守边界；文档引用不等于取得 GIPS verification。

## 当前未知与验证要求

- Baron/Hershey、Odean、Barber/Odean 与 Sharpe 的作者、题名、期刊、年份和 DOI 已登记，但本轮未取得全部论文正文逐段核验；采用表述保持保守，后续 source audit 不得把项目工程规则反推为论文原始结论。
- 现金、费用和少于一年不年化目前作为项目 hard constraints；虽然 GIPS 官方入口和标准文件已确认存在，本轮未完成对应条款的逐条正文定位，不能将三项全部表述为已逐字核验的 GIPS 要求。
- 哪个 benchmark 最适合具体 FundStrategyProfile，仍由用户事前选择并接受可比性检查，系统不能替用户决定。
- 个人基金数据是否足以构造可靠 TWR、现金流、费用和 total-return benchmark，需由 Agent B 在授权来源中验证。
- Level 2 attribution 是否有足够分类权重和分类 benchmark，当前未知。
- PGR/PLR、Possible Overtrading 在个人小样本中是否产生可行动价值，需要长期真实记录验证。
- “过程评价改善未来结果”是产品假设，不因理论文档完成而成立。

## 主要来源

查阅日期均为 2026-08-09：

- CFA Institute, [Portfolio Performance Evaluation（2026 Curriculum）](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/portfolio-performance-evaluation)；官方摘要明确区分 Measurement、Attribution、Appraisal，要求归因反映决策过程并调和总组合收益/风险，也列出 benchmark quality tests 与 appraisal limitations。
- CFA Institute, [Global Investment Performance Standards (GIPS)](https://www.cfainstitute.org/ethics-standards/codes/gips-standards)；项目只参考严谨表示原则，不声称合规。
- GIPS Standards, [GIPS Standards for Firms](https://www.gipsstandards.org/standards/gips-standards-for-firms/)；用于追溯机构绩效展示要求。
- Jonathan Baron & John C. Hershey, “Outcome Bias in Decision Evaluation”, *Journal of Personality and Social Psychology*, 54(4), 1988, pp. 569–579, [DOI: 10.1037/0022-3514.54.4.569](https://doi.org/10.1037/0022-3514.54.4.569)。
- Terrance Odean, “Are Investors Reluctant to Realize Their Losses?”, *The Journal of Finance*, 53(5), 1998, pp. 1775–1798, [DOI: 10.1111/0022-1082.00072](https://doi.org/10.1111/0022-1082.00072)。
- Brad M. Barber & Terrance Odean, “Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors”, *The Journal of Finance*, 55(2), 2000, pp. 773–806, [DOI: 10.1111/0022-1082.00226](https://doi.org/10.1111/0022-1082.00226)。
- William F. Sharpe, “The Sharpe Ratio”, *The Journal of Portfolio Management*, 21(1), 1994, pp. 49–58, [DOI: 10.3905/jpm.1994.409501](https://doi.org/10.3905/jpm.1994.409501)。

## 复评触发条件

- CFA/GIPS 官方材料更新或当前链接不再支持相应主张；
- 数据证明某个指标在个人基金语境不可可靠计算；
- 行为 Finding 经常被误解为心理诊断；
- Review 页面仍诱导用户以收益倒推过程质量；
- AI 输出无法追溯或开始影响 deterministic 结果；
- 真实复盘未改善规则一致性、错误发现或未来判断。
