import type {
  ContractPerformanceSlice,
  ContractReviewDataset,
  ContractReviewSnapshot,
  ContractRiskFinding,
  TradePreflightInput,
  TradePreflightResult,
} from "./domain";

function numberText(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "未知";
}

function ratioText(value: number | undefined): string {
  if (value === undefined) return "未知";
  if (!Number.isFinite(value)) return "无亏损分母";
  return value.toFixed(2);
}

function pctText(value: number | undefined): string {
  return value === undefined ? "未知" : numberText(value) + "%";
}

function sliceLines(title: string, slices: ContractPerformanceSlice[]): string[] {
  return [
    "【" + title + "】",
    ...slices.map((item) =>
      "- " + item.label
      + "｜" + item.trades + "笔"
      + "｜胜率 " + pctText(item.winRatePct)
      + "｜净盈亏 " + numberText(item.netPnl) + " USDT"
      + "｜平均每笔 " + numberText(item.averagePnl) + " USDT"
      + "｜盈利因子 " + ratioText(item.profitFactor),
    ),
  ];
}

export function buildContractReviewContext(
  dataset: ContractReviewDataset,
  review: ContractReviewSnapshot,
): string {
  const analysis = review.analysis;
  const metrics = review.metrics;
  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values);

  push(
    "【任务】",
    "你是一名独立的合约交易风险复盘专家。请基于下面的本地账户历史事实做深入分析，目标不是预测行情，而是找出最可能导致一次重大失误的行为模式，并把结论压缩成少量可执行规则。",
    "",
    "请严格遵守：",
    "1. 明确区分“数据事实”“统计推断”“待验证假设”，不要把相关性写成因果。",
    "2. 优先分析尾部损失、杠杆、仓位、止损执行、连续亏损、方向执念、交易频率、持仓时长和费用侵蚀。",
    "3. 找出盈利与亏损交易在标的、方向、时段、星期、持仓时长上的显著差异，并判断样本量是否足够。",
    "4. 只给出最多 3 条下一笔交易前可机械检查的硬规则，每条说明能拦住什么重大错误，以及可能的副作用。",
    "5. 输出一个“最需要停止重复的错误”、一个“仍缺什么数据”、一个“下一轮需要验证的假设”。",
    "6. 不索取账户身份、订单追踪号、Cookie、令牌等敏感信息；本上下文未包含这些字段。",
    "",
    "【数据边界】",
    "- 来源：Binance U 本位合约只读采集，本地 IndexedDB 快照。",
    "- 采集时间：" + dataset.capturedAt,
    "- 历史范围：" + (dataset.historyRange
      ? new Date(dataset.historyRange.startAt).toISOString() + " 至 " + new Date(dataset.historyRange.endAt).toISOString()
      : "未知"),
    "- 已平仓样本：" + metrics.closedPositions + " 笔。",
    "- 覆盖：" + dataset.coverage.map((item) => item.dataset + "=" + item.completeness + "(" + (item.recordCount ?? 0) + ")").join("；"),
    "- 警告：" + (dataset.warnings.length ? dataset.warnings.join("；") : "无来源警告"),
    "",
    "【核心收益质量】",
    "- 净盈亏（已扣除持仓历史可识别交易费与资金费）：" + numberText(metrics.netPnl) + " USDT",
    "- 盈利交易合计：" + numberText(analysis.grossProfit) + " USDT；亏损交易合计：" + numberText(analysis.grossLoss) + " USDT",
    "- 胜率：" + pctText(metrics.winRatePct),
    "- 盈利因子：" + ratioText(analysis.profitFactor),
    "- 单笔期望：" + numberText(analysis.expectancy) + " USDT",
    "- 平均盈利：" + numberText(analysis.averageWin) + " USDT；平均亏损：" + numberText(analysis.averageLoss) + " USDT",
    "- 盈亏比：" + ratioText(analysis.payoffRatio),
    "- 交易手续费：" + numberText(analysis.totalTradingFees) + " USDT；占毛盈利 " + pctText(analysis.feeDragPct),
    "- 资金费净额：" + numberText(analysis.totalFunding) + " USDT",
    "",
    "【尾部风险与行为】",
    "- 最大回撤：" + numberText(analysis.maximumDrawdown) + " USDT（相对当前可识别权益 " + pctText(analysis.maximumDrawdownPct) + "）",
    "- 最大单笔亏损：" + numberText(metrics.largestLoss) + " USDT",
    "- 最差 5 笔平均亏损：" + numberText(analysis.worstFiveAverageLoss) + " USDT",
    "- 当前连续亏损：" + metrics.currentLossStreak + " 笔；历史最长连续亏损：" + metrics.maxLossStreak + " 笔",
    "- 历史最大杠杆：" + numberText(metrics.maxLeverage, 0) + "x",
    "- 盈利日占比：" + pctText(analysis.profitableDaysPct) + "；最佳日 " + numberText(analysis.bestDayPnl) + " USDT；最差日 " + numberText(analysis.worstDayPnl) + " USDT",
    "- 平均持仓：" + numberText(analysis.averageHoldingMinutes, 0) + " 分钟；盈利交易 " + numberText(analysis.winningHoldingMinutes, 0) + " 分钟；亏损交易 " + numberText(analysis.losingHoldingMinutes, 0) + " 分钟",
    "- 可识别的历史止损保护率：" + pctText(analysis.stopProtectedClosedPct) + "。这是按同标的、持仓时间窗内减仓 STOP/TRAILING 委托匹配的派生值，不代表止损一定有效成交。",
    "",
    "【规则引擎已识别异常】",
    ...(review.findings.length
      ? review.findings.map((item) => "- [" + item.priority + "] " + item.title + "｜" + item.summary + "｜建议规则：" + item.nextRule)
      : ["- 未识别到规则异常；这不等于未来没有风险。"]),
    "",
  );

  push(...sliceLines("按标的", analysis.bySymbol.slice(0, 12)), "");
  push(...sliceLines("按方向", analysis.byDirection), "");
  push(...sliceLines("按杠杆", analysis.byLeverage), "");
  push(...sliceLines("按持仓时长", analysis.byHoldingPeriod), "");
  push(...sliceLines("按开仓时段（本机时区）", analysis.byTradingSession), "");
  push(...sliceLines("按星期", analysis.byWeekday), "");

  push(
    "【期望输出格式】",
    "一、执行摘要（不超过 150 字）",
    "二、最有价值的 5 个发现（每项包含事实、解释、置信度、反例）",
    "三、一次重大失误最可能怎样发生（风险链条）",
    "四、最多 3 条交易前硬规则",
    "五、建议停止统计或减少关注的低价值指标",
    "六、仍缺的数据与下一轮验证方案",
  );
  return lines.join("\n");
}

export function buildFocusedFindingContext(
  dataset: ContractReviewDataset,
  review: ContractReviewSnapshot,
  finding: ContractRiskFinding,
): string {
  const analysis = review.analysis;
  const metrics = review.metrics;
  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values);

  push(
    "【专项任务：合约单项风险聚焦归因】",
    "你是一名独立合约交易风控专家。系统本地确定性规则引擎检测到了一项关键风险线索：",
    "【" + finding.priority.toUpperCase() + "】" + finding.title,
    "问题摘要：" + finding.summary,
    "建议下次开仓前硬规则：" + finding.nextRule,
    "涉及标的：" + (finding.affectedSymbols.join("、") || "全部标的"),
    "",
    "【相关数据证据与事实】",
    ...finding.evidence.map((e) => "- " + e),
    "",
    "【关联宏观表现事实】",
    "- 净盈亏：" + numberText(metrics.netPnl) + " USDT",
    "- 盈利因子：" + ratioText(analysis.profitFactor) + "｜单笔期望：" + numberText(analysis.expectancy) + " USDT",
    "- 胜率：" + pctText(metrics.winRatePct) + "｜盈亏比：" + ratioText(analysis.payoffRatio),
    "- 最大回撤：" + numberText(analysis.maximumDrawdown) + " USDT（" + pctText(analysis.maximumDrawdownPct) + "）",
    "- 当前连续亏损：" + metrics.currentLossStreak + " 笔（历史最长 " + metrics.maxLossStreak + " 笔）",
    "- 历史止损保护率：" + pctText(analysis.stopProtectedClosedPct),
    "- 平均持仓时长：盈利 " + numberText(analysis.winningHoldingMinutes, 0) + " 分钟，亏损 " + numberText(analysis.losingHoldingMinutes, 0) + " 分钟",
    "",
    "【期望模型输出】",
    "1. 针对该异常项的根本交易行为归因（区分是市场行情随机性、策略失效、还是执行纪律变形）。",
    "2. 该异常在什么行情下最容易诱发爆仓或重大单次亏损？",
    "3. 如何将该风险固化为下次开仓前的机械约束？给出一个明确的数值化规则。",
  );
  return lines.join("\n");
}

export function buildPreflightContext(
  preflight: TradePreflightInput,
  result: TradePreflightResult | undefined,
  dataset: ContractReviewDataset | undefined,
  review: ContractReviewSnapshot | undefined,
): string {
  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values);

  push(
    "【专项任务：开仓前交易计划风险复核与盲点审查】",
    "我正准备在 Binance 合约执行一笔交易，本地规则引擎已完成初筛，请结合市场环境与风控原理进行独立盲点分析。",
    "",
    "【本次拟开仓参数】",
    "- 合约代码：" + preflight.symbol,
    "- 交易方向：" + preflight.direction,
    "- 杠杆倍数：" + preflight.leverage + "x",
    "- 账户权益：" + numberText(preflight.accountEquity) + " USDT",
    "- 拟入场价：" + numberText(preflight.entryPrice, 4) + " USDT",
    "- 拟委托数量：" + preflight.quantity,
    "- 设定止损价：" + (preflight.stopPrice ? numberText(preflight.stopPrice, 4) + " USDT" : "未设置止损（高危）"),
    "- 设定止盈价：" + (preflight.takeProfitPrice ? numberText(preflight.takeProfitPrice, 4) + " USDT" : "未设置止盈"),
    "- 交易理由与失效条件：" + (preflight.thesis || "（未填写交易理由）"),
    "",
  );

  if (result) {
    push(
      "【本地规则引擎初筛结论】",
      "- 检查结论：" + result.verdict.toUpperCase(),
      "- 预估名义价值：" + numberText(result.notional) + " USDT",
      "- 占用保证金：" + numberText(result.initialMargin) + " USDT",
      "- 单笔止损风险：" + (result.riskPct ? numberText(result.riskPct) + "%" : "未计算"),
      "- 计划盈亏比：" + (result.rewardRiskRatio ? numberText(result.rewardRiskRatio) : "未设置"),
      "各项细则校验：",
      ...result.checks.map((c) => "- [" + c.severity + "] " + c.label + "：" + c.detail),
      "",
    );
  }

  if (review) {
    push(
      "【账户近期背景与历史表现】",
      "- 账户历史单笔期望：" + numberText(review.analysis.expectancy) + " USDT",
      "- 历史胜率：" + pctText(review.metrics.winRatePct) + "｜盈利因子：" + ratioText(review.analysis.profitFactor),
      "- 当前连亏笔数：" + review.metrics.currentLossStreak + " 笔",
      "",
    );
  }

  push(
    "【期望模型输出】",
    "1. 这笔交易计划最脆弱的前提假设是什么？在什么情况下该计划会完全失效？",
    "2. 止损位置与仓位大小是否合理？是否会因正常市场波动（如假突破/插针）被过早扫损？",
    "3. 如果执行这笔交易，开仓后最应盯紧的盘面异常信号是什么？",
  );

  return lines.join("\n");
}
