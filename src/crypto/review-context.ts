import type {
  ContractPerformanceSlice,
  ContractReviewDataset,
  ContractReviewSnapshot,
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
      + "｜Profit Factor " + ratioText(item.profitFactor),
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
    "- Profit Factor：" + ratioText(analysis.profitFactor),
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
