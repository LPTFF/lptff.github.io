import type {
  ContractPerformanceAnalysis,
  ContractPerformanceSlice,
  ContractReviewDataset,
  ContractReviewMetrics,
  ContractReviewSnapshot,
  ContractRiskFinding,
  ContractRiskRules,
  TradePreflightCheck,
  TradePreflightInput,
  TradePreflightResult,
} from "./domain";

export const EMPTY_CONTRACT_RISK_RULES: ContractRiskRules = {
  maxLeverage: 0,
  maxRiskPerTradePct: 0,
  maxMarginPerTradePct: 0,
  maxSymbolExposurePct: 0,
  maxConcurrentPositions: 0,
  maxDailyLossPct: 0,
  maxConsecutiveLosses: 0,
  cooldownHoursAfterLossStreak: 0,
  maxTradesPerDay: 0,
  minRewardRiskRatio: 0,
  requireStopLoss: false,
};

function numberOf(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function stableId(parts: unknown[]): string {
  const material = JSON.stringify(parts);
  let hash = 2166136261;
  for (let index = 0; index < material.length; index += 1) {
    hash ^= material.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function closedPositions(dataset: ContractReviewDataset): Record<string, unknown>[] {
  return dataset.positionHistory
    .filter((position) => textOf(position.status).toUpperCase() === "CLOSED")
    .sort((left, right) => numberOf(left.closedAt || left.updatedAt) - numberOf(right.closedAt || right.updatedAt));
}

function lossStreaks(positions: Record<string, unknown>[]): { current: number; maximum: number } {
  let current = 0;
  let maximum = 0;
  for (const position of positions) {
    if (positionPnl(position) < 0) {
      current += 1;
      maximum = Math.max(maximum, current);
    } else {
      current = 0;
    }
  }
  return { current, maximum };
}

function accountEquity(dataset: ContractReviewDataset): number {
  return dataset.equity.reduce(
    (sum, row) => sum + Math.max(numberOf(row.marginBalance), numberOf(row.availableBalance)),
    0,
  );
}

function openPositions(dataset: ContractReviewDataset): Record<string, unknown>[] {
  return dataset.positions.filter((position) => Math.abs(numberOf(position.positionAmount)) > 0);
}

function stopProtectedSymbols(dataset: ContractReviewDataset): Set<string> {
  return new Set(dataset.orders
    .filter((order) => {
      const type = textOf(order.type || order.originalType).toUpperCase();
      const active = ["NEW", "PARTIALLY_FILLED"].includes(textOf(order.status).toUpperCase());
      return active && (type.includes("STOP") || type.includes("TRAILING"))
        && (Boolean(order.reduceOnly) || Boolean(order.closePosition));
    })
    .map((order) => textOf(order.symbol))
    .filter(Boolean));
}

function finding(
  snapshotId: string,
  input: Omit<ContractRiskFinding, "id">,
): ContractRiskFinding {
  return {
    ...input,
    id: "contract-finding:" + stableId([snapshotId, input.category, input.title, input.affectedSymbols]),
  };
}

function positionPnl(position: Record<string, unknown>): number {
  return numberOf(position.closingPnl)
    + numberOf(position.tradingFeeTotal)
    + numberOf(position.fundingFee);
}

function holdingMinutes(position: Record<string, unknown>): number {
  const openedAt = numberOf(position.openedAt);
  const closedAt = numberOf(position.closedAt || position.updatedAt);
  return openedAt && closedAt > openedAt ? (closedAt - openedAt) / 60000 : 0;
}

function performanceSlices(
  positions: Record<string, unknown>[],
  keyOf: (position: Record<string, unknown>) => { key: string; label: string },
): ContractPerformanceSlice[] {
  const groups = new Map<string, { label: string; positions: Record<string, unknown>[] }>();
  for (const position of positions) {
    const item = keyOf(position);
    const current = groups.get(item.key) ?? { label: item.label, positions: [] };
    current.positions.push(position);
    groups.set(item.key, current);
  }
  return [...groups.entries()].map(([key, group]) => {
    const values = group.positions.map(positionPnl);
    const grossProfit = values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
    const grossLoss = Math.abs(values.filter((value) => value < 0).reduce((sum, value) => sum + value, 0));
    return {
      key,
      label: group.label,
      trades: values.length,
      winRatePct: values.length ? values.filter((value) => value > 0).length / values.length * 100 : 0,
      netPnl: values.reduce((sum, value) => sum + value, 0),
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Number.POSITIVE_INFINITY : undefined,
      averagePnl: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    };
  }).sort((left, right) => right.trades - left.trades || right.netPnl - left.netPnl);
}

function stopProtectedClosedPct(
  positions: Record<string, unknown>[],
  dataset: ContractReviewDataset,
): number | undefined {
  if (!positions.length) return undefined;
  const protectedCount = positions.filter((position) => {
    const symbol = textOf(position.symbol);
    const openedAt = numberOf(position.openedAt);
    const closedAt = numberOf(position.closedAt || position.updatedAt);
    return dataset.orderHistory.some((order) => {
      const type = textOf(order.type || order.originalType).toUpperCase();
      const orderTime = numberOf(order.insertedAt || order.updatedAt);
      return textOf(order.symbol) === symbol
        && (type.includes("STOP") || type.includes("TRAILING"))
        && (Boolean(order.reduceOnly) || Boolean(order.closePosition))
        && orderTime >= openedAt
        && orderTime <= closedAt;
    });
  }).length;
  return protectedCount / positions.length * 100;
}

function computePerformanceAnalysis(
  positions: Record<string, unknown>[],
  dataset: ContractReviewDataset,
  equity: number,
): ContractPerformanceAnalysis {
  const pnlValues = positions.map(positionPnl);
  const wins = pnlValues.filter((value) => value > 0);
  const losses = pnlValues.filter((value) => value < 0);
  const grossProfit = wins.reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? grossLoss / losses.length : 0;
  const totalTradingFees = positions.reduce(
    (sum, position) => sum + Math.abs(numberOf(position.tradingFeeTotal)),
    0,
  );
  const positionFunding = positions.reduce((sum, position) => sum + numberOf(position.fundingFee), 0);
  const totalFunding = positionFunding || dataset.transactionHistory
    .filter((item) => textOf(item.type).toUpperCase().includes("FUNDING"))
    .reduce((sum, item) => sum + numberOf(item.amount), 0);
  const curve: ContractPerformanceAnalysis["equityCurve"] = [];
  let cumulativePnl = 0;
  let peak = 0;
  let maximumDrawdown = 0;
  for (const position of positions) {
    cumulativePnl += positionPnl(position);
    peak = Math.max(peak, cumulativePnl);
    const drawdown = peak - cumulativePnl;
    maximumDrawdown = Math.max(maximumDrawdown, drawdown);
    curve.push({
      time: numberOf(position.closedAt || position.updatedAt),
      cumulativePnl,
      drawdown,
    });
  }
  const daily = new Map<string, number>();
  for (const position of positions) {
    const timestamp = numberOf(position.closedAt || position.updatedAt);
    if (!timestamp) continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + positionPnl(position));
  }
  const dailyValues = [...daily.values()];
  const durations = positions.map(holdingMinutes).filter((value) => value > 0);
  const winningDurations = positions.filter((position) => positionPnl(position) > 0).map(holdingMinutes).filter((value) => value > 0);
  const losingDurations = positions.filter((position) => positionPnl(position) < 0).map(holdingMinutes).filter((value) => value > 0);
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const worstFive = [...losses].sort((left, right) => left - right).slice(0, 5);
  const sessionOf = (position: Record<string, unknown>) => {
    const hour = new Date(numberOf(position.openedAt)).getHours();
    if (hour < 8) return { key: "00-08", label: "00:00–08:00" };
    if (hour < 16) return { key: "08-16", label: "08:00–16:00" };
    return { key: "16-24", label: "16:00–24:00" };
  };
  const holdingBucket = (position: Record<string, unknown>) => {
    const minutes = holdingMinutes(position);
    if (minutes < 15) return { key: "lt15", label: "少于15分钟" };
    if (minutes < 60) return { key: "15-60", label: "15–60分钟" };
    if (minutes < 240) return { key: "1-4h", label: "1–4小时" };
    return { key: "gt4h", label: "超过4小时" };
  };
  const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return {
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Number.POSITIVE_INFINITY : undefined,
    expectancy: pnlValues.length ? (grossProfit - grossLoss) / pnlValues.length : 0,
    averageWin,
    averageLoss,
    payoffRatio: averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Number.POSITIVE_INFINITY : undefined,
    totalTradingFees,
    totalFunding,
    feeDragPct: grossProfit > 0 ? totalTradingFees / grossProfit * 100 : undefined,
    maximumDrawdown,
    maximumDrawdownPct: equity > 0 ? maximumDrawdown / equity * 100 : undefined,
    worstFiveAverageLoss: Math.abs(average(worstFive)),
    averageHoldingMinutes: average(durations),
    winningHoldingMinutes: average(winningDurations),
    losingHoldingMinutes: average(losingDurations),
    stopProtectedClosedPct: stopProtectedClosedPct(positions, dataset),
    profitableDaysPct: dailyValues.length ? dailyValues.filter((value) => value > 0).length / dailyValues.length * 100 : 0,
    bestDayPnl: dailyValues.length ? Math.max(...dailyValues) : 0,
    worstDayPnl: dailyValues.length ? Math.min(...dailyValues) : 0,
    bySymbol: performanceSlices(positions, (position) => ({ key: textOf(position.symbol), label: textOf(position.symbol) })),
    byDirection: performanceSlices(positions, (position) => ({ key: textOf(position.positionSide), label: textOf(position.positionSide) })),
    byLeverage: performanceSlices(positions, (position) => ({ key: textOf(position.leverage), label: textOf(position.leverage) + "x" })),
    byHoldingPeriod: performanceSlices(positions, holdingBucket),
    byTradingSession: performanceSlices(positions, sessionOf),
    byWeekday: performanceSlices(positions, (position) => {
      const day = new Date(numberOf(position.openedAt)).getDay();
      return { key: String(day), label: weekdayLabels[day] };
    }),
    equityCurve: curve,
  };
}

export function computeContractReview(
  dataset: ContractReviewDataset,
  rules: ContractRiskRules,
  checkedAt = new Date().toISOString(),
): ContractReviewSnapshot {
  const positions = closedPositions(dataset);
  const pnlValues = positions.map(positionPnl);
  const losses = pnlValues.filter((value) => value < 0);
  const streaks = lossStreaks(positions);
  const symbolCounts = new Map<string, number>();
  const losingDirections = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  for (const position of positions) {
    const symbol = textOf(position.symbol);
    symbolCounts.set(symbol, (symbolCounts.get(symbol) ?? 0) + 1);
    if (positionPnl(position) < 0) {
      const direction = textOf(position.positionSide);
      losingDirections.set(direction, (losingDirections.get(direction) ?? 0) + 1);
    }
    const openedAt = numberOf(position.openedAt || position.updatedAt);
    if (openedAt) {
      const day = new Date(openedAt).toISOString().slice(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
  }

  const dominant = [...symbolCounts.entries()].sort((left, right) => right[1] - left[1])[0];
  const busiest = Math.max(0, ...dayCounts.values());
  const activePositions = openPositions(dataset);
  const protectedSymbols = stopProtectedSymbols(dataset);
  const unprotected = activePositions.filter((position) => !protectedSymbols.has(textOf(position.symbol)));
  const equity = accountEquity(dataset);
  const snapshotId = "contract-review:" + dataset.capturedAt + ":" + stableId([rules, positions.length, dataset.orders.length]);
  const metrics: ContractReviewMetrics = {
    closedPositions: positions.length,
    winRatePct: positions.length ? pnlValues.filter((value) => value > 0).length / positions.length * 100 : 0,
    netPnl: pnlValues.reduce((sum, value) => sum + value, 0),
    largestLoss: losses.length ? Math.abs(Math.min(...losses)) : 0,
    currentLossStreak: streaks.current,
    maxLossStreak: streaks.maximum,
    maxLeverage: Math.max(0, ...positions.map((position) => numberOf(position.leverage))),
    protectedOpenPositions: activePositions.length - unprotected.length,
    unprotectedOpenPositions: unprotected.length,
    busiestTradingDay: busiest,
    dominantSymbol: dominant?.[0],
    dominantSymbolPct: positions.length && dominant ? dominant[1] / positions.length * 100 : 0,
  };
  const analysis = computePerformanceAnalysis(positions, dataset, equity);
  const findings: ContractRiskFinding[] = [];
  const requiredCoverage = ["orderHistory", "tradeHistory", "positionHistory", "transactionHistory"];
  const incomplete = dataset.coverage.filter(
    (item) => requiredCoverage.includes(item.dataset) && item.completeness !== "complete",
  );

  if (incomplete.length) {
    findings.push(finding(snapshotId, {
      priority: "high",
      category: "data",
      title: "核心历史不完整，禁止把缺失当作正常",
      summary: incomplete.map((item) => item.dataset).join("、") + " 存在缺口，本轮只能做有限判断。",
      evidence: incomplete.map((item) => item.dataset + ": " + item.completeness),
      nextRule: "核心历史未完整覆盖时，只允许补数据，不允许放宽风险阈值。",
      affectedSymbols: [],
    }));
  }

  const excessiveLeverage = positions.filter((position) => numberOf(position.leverage) > rules.maxLeverage);
  if (excessiveLeverage.length) {
    const symbols = [...new Set(excessiveLeverage.map((position) => textOf(position.symbol)).filter(Boolean))];
    findings.push(finding(snapshotId, {
      priority: "critical",
      category: "leverage",
      title: "历史杠杆超过 " + rules.maxLeverage + "x 硬上限",
      summary: excessiveLeverage.length + "/" + positions.length + " 笔已平仓使用更高杠杆，单次波动可能放大为不可恢复损失。",
      evidence: ["历史最高 " + metrics.maxLeverage.toFixed(0) + "x", "涉及 " + symbols.join("、")],
      nextRule: "下一笔交易杠杆不得超过 " + rules.maxLeverage + "x；超限直接拦截，不接受临场例外。",
      affectedSymbols: symbols,
    }));
  }

  if (unprotected.length) {
    const symbols = unprotected.map((position) => textOf(position.symbol));
    findings.push(finding(snapshotId, {
      priority: "critical",
      category: "stop",
      title: "存在未被止损单保护的当前持仓",
      summary: unprotected.length + " 个持仓未找到同标的有效减仓止损委托。",
      evidence: symbols.map((symbol) => symbol + " 未匹配 STOP/TRAILING 减仓委托"),
      nextRule: "开仓指令必须与止损价同时确认；没有止损，不允许开仓。",
      affectedSymbols: symbols,
    }));
  }

  if (metrics.currentLossStreak >= rules.maxConsecutiveLosses) {
    findings.push(finding(snapshotId, {
      priority: "critical",
      category: "loss_streak",
      title: "连续亏损 " + metrics.currentLossStreak + " 笔，进入强制冷静期",
      summary: "已触发 " + rules.maxConsecutiveLosses + " 笔连续亏损上限，继续交易更可能是情绪化补偿。",
      evidence: ["历史最长连续亏损 " + metrics.maxLossStreak + " 笔", "当前连续亏损 " + metrics.currentLossStreak + " 笔"],
      nextRule: "连续亏损达到 " + rules.maxConsecutiveLosses + " 笔后暂停 " + rules.cooldownHoursAfterLossStreak + " 小时，并完成一次带结论复盘。",
      affectedSymbols: [],
    }));
  }

  if (equity > 0 && metrics.largestLoss / equity * 100 > rules.maxDailyLossPct) {
    const lossPct = metrics.largestLoss / equity * 100;
    findings.push(finding(snapshotId, {
      priority: "high",
      category: "position",
      title: "历史单笔最大亏损已越过账户保护线",
      summary: "最大单笔亏损约占当前可识别权益 " + lossPct.toFixed(1) + "%，超过 " + rules.maxDailyLossPct + "% 保护线。",
      evidence: ["最大单笔亏损 " + metrics.largestLoss.toFixed(2) + " USDT", "可识别权益 " + equity.toFixed(2) + " USDT"],
      nextRule: "任何交易的止损金额不得超过账户权益 " + rules.maxRiskPerTradePct + "%。",
      affectedSymbols: [],
    }));
  }

  if (metrics.dominantSymbol && metrics.dominantSymbolPct > rules.maxSymbolExposurePct) {
    findings.push(finding(snapshotId, {
      priority: "high",
      category: "concentration",
      title: "交易过度集中在 " + metrics.dominantSymbol,
      summary: metrics.dominantSymbolPct.toFixed(0) + "% 的已平仓记录来自同一标的，错误模式容易重复放大。",
      evidence: [metrics.dominantSymbol + ": " + (dominant?.[1] ?? 0) + "/" + positions.length + " 笔"],
      nextRule: "单一标的风险暴露不得超过账户权益 " + rules.maxSymbolExposurePct + "%。",
      affectedSymbols: [metrics.dominantSymbol],
    }));
  }

  if (busiest > rules.maxTradesPerDay) {
    const peakDays = [...dayCounts.entries()].filter(([, count]) => count === busiest).map(([day]) => day);
    findings.push(finding(snapshotId, {
      priority: "medium",
      category: "frequency",
      title: "高频交易日超过管理上限",
      summary: "单日最高 " + busiest + " 笔，超过 " + rules.maxTradesPerDay + " 笔上限，复盘与执行质量容易下降。",
      evidence: peakDays.map((day) => day + ": " + busiest + " 笔"),
      nextRule: "单日新开仓不超过 " + rules.maxTradesPerDay + " 笔；达到上限后只允许减仓。",
      affectedSymbols: [],
    }));
  }

  const totalDirectionLosses = [...losingDirections.values()].reduce((sum, count) => sum + count, 0);
  const dominantLossDirection = [...losingDirections.entries()].sort((left, right) => right[1] - left[1])[0];
  if (totalDirectionLosses >= 4 && dominantLossDirection && dominantLossDirection[1] / totalDirectionLosses >= 0.7) {
    findings.push(finding(snapshotId, {
      priority: "medium",
      category: "direction",
      title: dominantLossDirection[0] + " 方向承载了多数亏损",
      summary: dominantLossDirection[1] + "/" + totalDirectionLosses + " 笔亏损来自 " + dominantLossDirection[0] + "，需防止方向执念。",
      evidence: [dominantLossDirection[0] + " 亏损占比 " + (dominantLossDirection[1] / totalDirectionLosses * 100).toFixed(0) + "%"],
      nextRule: "同一方向连续两次止损后，下一笔必须写出反证条件；无法写出则不交易。",
      affectedSymbols: [],
    }));
  }

  return { id: snapshotId, capturedAt: dataset.capturedAt, rules: { ...rules }, findings, metrics, analysis, checkedAt };
}

function check(
  id: string,
  severity: TradePreflightCheck["severity"],
  label: string,
  detail: string,
): TradePreflightCheck {
  return { id, severity, label, detail };
}

export function evaluateTradePreflight(
  input: TradePreflightInput,
  rules: ContractRiskRules,
  checkedAt = new Date().toISOString(),
): TradePreflightResult {
  const notional = Math.max(0, input.entryPrice * input.quantity);
  const initialMargin = input.leverage > 0 ? notional / input.leverage : 0;
  const hasStop = Boolean(input.stopPrice && input.stopPrice > 0);
  const stopDistance = hasStop ? Math.abs(input.entryPrice - input.stopPrice!) : 0;
  const riskAmount = hasStop ? stopDistance * input.quantity : undefined;
  const riskPct = riskAmount !== undefined && input.accountEquity > 0
    ? riskAmount / input.accountEquity * 100
    : undefined;
  const reward = input.takeProfitPrice
    ? Math.abs(input.takeProfitPrice - input.entryPrice) * input.quantity
    : undefined;
  const rewardRiskRatio = reward !== undefined && riskAmount && riskAmount > 0
    ? reward / riskAmount
    : undefined;
  const checks: TradePreflightCheck[] = [];

  checks.push(input.leverage > 0 && input.leverage <= rules.maxLeverage
    ? check("leverage", "pass", "杠杆在硬上限内", input.leverage + "x ≤ " + rules.maxLeverage + "x")
    : check("leverage", "block", "杠杆超限", "当前 " + (input.leverage || 0) + "x，允许上限 " + rules.maxLeverage + "x"));

  if (rules.requireStopLoss && !hasStop) {
    checks.push(check("stop", "block", "缺少止损", "没有止损价，不允许开仓"));
  } else if (hasStop) {
    const wrongSide = input.direction === "LONG"
      ? input.stopPrice! >= input.entryPrice
      : input.stopPrice! <= input.entryPrice;
    checks.push(wrongSide
      ? check("stop-side", "block", "止损方向错误", input.direction + " 的止损位置无效")
      : check("stop-side", "pass", "止损方向有效", "计划止损 " + input.stopPrice));
  }

  if (riskPct !== undefined) {
    checks.push(riskPct <= rules.maxRiskPerTradePct
      ? check("risk", "pass", "单笔风险可承受", riskPct.toFixed(2) + "% ≤ " + rules.maxRiskPerTradePct + "%")
      : check("risk", "block", "单笔止损金额超限", riskPct.toFixed(2) + "% > " + rules.maxRiskPerTradePct + "%"));
  }

  const marginPct = input.accountEquity > 0 ? initialMargin / input.accountEquity * 100 : 0;
  checks.push(input.accountEquity > 0 && marginPct <= rules.maxMarginPerTradePct
    ? check("margin", "pass", "初始保证金占用可控", marginPct.toFixed(1) + "% ≤ " + rules.maxMarginPerTradePct + "%")
    : check("margin", "block", "保证金占用超限或权益无效", "预计占用 " + marginPct.toFixed(1) + "%，上限 " + rules.maxMarginPerTradePct + "%"));

  const exposureAfter = input.currentSymbolExposurePct + marginPct;
  checks.push(exposureAfter <= rules.maxSymbolExposurePct
    ? check("concentration", "pass", "单标的集中度可控", "交易后约 " + exposureAfter.toFixed(1) + "%")
    : check("concentration", "block", "单标的集中度超限", "交易后约 " + exposureAfter.toFixed(1) + "%，上限 " + rules.maxSymbolExposurePct + "%"));

  checks.push(input.currentOpenPositions < rules.maxConcurrentPositions
    ? check("positions", "pass", "并发持仓未超限", (input.currentOpenPositions + 1) + "/" + rules.maxConcurrentPositions)
    : check("positions", "block", "并发持仓已达上限", "当前已有 " + input.currentOpenPositions + " 个持仓"));

  checks.push(input.consecutiveLosses < rules.maxConsecutiveLosses
    ? check("streak", "pass", "未触发连续亏损冷静期", "当前连续亏损 " + input.consecutiveLosses + " 笔")
    : check("streak", "block", "连续亏损冷静期生效", "达到 " + rules.maxConsecutiveLosses + " 笔，暂停 " + rules.cooldownHoursAfterLossStreak + " 小时"));

  if (rewardRiskRatio !== undefined) {
    checks.push(rewardRiskRatio >= rules.minRewardRiskRatio
      ? check("reward-risk", "pass", "盈亏比达标", rewardRiskRatio.toFixed(2) + " ≥ " + rules.minRewardRiskRatio)
      : check("reward-risk", "warn", "盈亏比偏低", rewardRiskRatio.toFixed(2) + " < " + rules.minRewardRiskRatio));
  } else {
    checks.push(check("reward-risk", "warn", "未声明止盈目标", "不阻断，但无法验证计划盈亏比"));
  }

  checks.push(input.thesis.trim().length >= 12
    ? check("thesis", "pass", "交易理由已记录", input.thesis.trim())
    : check("thesis", "warn", "交易理由过短", "至少写清入场依据、失效条件和不交易条件"));

  const verdict = checks.some((item) => item.severity === "block")
    ? "blocked"
    : checks.some((item) => item.severity === "warn") ? "review" : "pass";
  return { verdict, checks, notional, initialMargin, riskAmount, riskPct, rewardRiskRatio, checkedAt };
}
