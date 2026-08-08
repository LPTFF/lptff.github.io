# agent/：个人工作台

这里不是让人服从 Agent 的控制面，而是项目的外置认知工具箱。它帮助人记住事实、理解取舍、规划产品、研究外部方案和复盘结果。

## 按问题使用

- 想了解项目现在是什么：看 `context/project-context.md`。
- 想知道产品服务谁、解决什么问题：看 `product/business-overview.md`。
- 想决定下一步做什么：看 `product/business-planning.md`。
- 想设计页面或交互：看 `product/product-design.md`。
- 想知道当前 Investment OS 的产品基线和拆解：看 `product/prd/README.md`。
- 想知道哪些文件属于项目功能、哪些属于工作台：看 `context/project-file-boundaries.md`。
- 想了解代码放在哪里：看 `standards/code-organization.md`。
- 想查看已收藏理论或引入新理论：看 `theories/README.md`；想了解当前可执行的 Agent 约定：看 `standards/`。
- 想了解本地开发环境和远程数据服务：看 `docs/development-environment.md`。
- 想验证一个改动是否真的有效：看 `verification/playbook.md`；需要可信验证原则、证据边界和方法选择时，再看 `standards/trusted-verification.md`。
- 想研究其他项目：看 `product/research/`。
- 想回顾过去做过什么：看 `context/iteration-log.md`，但以当前代码和当前事实为准。

不要求每次任务先读完整目录，也不要求使用固定模板或维护无助于判断的流程。资料是否值得更新，由维护者根据未来的人是否会因此更快理解和做出更好判断来决定。

## 人机协作原则

人负责定义问题、选择取舍、批准外部或不可逆行动，并承担最终结果。Agent 可以帮助搜索、比较、起草、运行可逆的本地检查和暴露未知，但不能替人决定目标、风险承受能力、产品范围或完成标准。

好的记录应该让未来的人少走弯路：写清楚事实、判断、依据、未知和下一步；不要为了让某个工具更容易解析而堆砌格式。

## 资料边界

- 产品源码、运行时资源和构建配置留在项目目录。
- 项目事实、产品判断、研究结论和有长期价值的复盘资料放在这里。
- 临时输出、自动生成文件、凭据、个人宿主配置和无助于判断的过程材料不放在这里。
- `AGENTS.md` 和 `CLAUDE.md` 只是宿主发现入口，不是第二套规则来源。
