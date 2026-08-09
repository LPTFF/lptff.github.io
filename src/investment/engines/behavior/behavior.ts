/**
 * Behavior Engine（PRD §23、§22.2、EPIC 8）
 *
 * 自动分析真实交易的时间规律、金额规律、方向与来源，分类为定投 / 主动买卖 / 再平衡 /
 * 未知，并发现稳定重复行为（DetectedPattern）。异常金额产生 ABNORMAL_TRANSACTION，
 * 无法分类的新行为产生 UNCLASSIFIED_TRANSACTION（PRD §22）。
 */
import type {
  Action,
  BehaviorType,
  DetectedPattern,
  Transaction,
} from "../../domain";

export interface BehaviorAssignment {
  txId: string;
  behaviorType: BehaviorType;
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

function std(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function coefficientOfVariation(nums: number[]): number {
  const m = mean(nums);
  return m === 0 ? Infinity : std(nums) / m;
}

function isSystematic(series: Transaction[]): boolean {
  if (series.length < 3) return false;
  const amounts = series.map((t) => t.amount);
  if (coefficientOfVariation(amounts) > 0.2) return false;
  const dates = series.map((t) => t.occurredAt.slice(0, 10)).sort();
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    intervals.push(diff);
  }
  return coefficientOfVariation(intervals) < 0.4;
}

/**
 * 分类每笔交易。先按 assetId 识别定投序列（固定周期 + 金额接近），其余按方向分类；
 * 失败 / 未确认交易归 UNKNOWN，避免被静默当作正常投资（PRD §6.4）。
 */
export function classifyTransactions(transactions: Transaction[]): BehaviorAssignment[] {
  const sorted = [...transactions].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
  const buyByAsset = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    if (tx.type === "BUY") {
      const arr = buyByAsset.get(tx.assetId) ?? [];
      arr.push(tx);
      buyByAsset.set(tx.assetId, arr);
    }
  }
  const systematicIds = new Set<string>();
  for (const series of buyByAsset.values()) {
    if (isSystematic(series)) {
      for (const tx of series) systematicIds.add(tx.id);
    }
  }

  return sorted.map((tx) => {
    let behaviorType: BehaviorType;
    if (tx.status === "FAILED" || tx.status === "PENDING") {
      behaviorType = "UNKNOWN";
    } else if (systematicIds.has(tx.id)) {
      behaviorType = "SYSTEMATIC_INVESTMENT";
    } else if (tx.type === "BUY") {
      behaviorType = "DISCRETIONARY_BUY";
    } else if (tx.type === "SELL") {
      behaviorType = "DISCRETIONARY_SELL";
    } else {
      behaviorType = "UNKNOWN";
    }
    return { txId: tx.id, behaviorType };
  });
}

/** 主动买入中金额明显高于历史正常范围的交易（PRD §22.2）。 */
export function detectAbnormalTransactions(transactions: Transaction[], assignments: BehaviorAssignment[]): Transaction[] {
  const buyByAsset = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.type === "BUY") {
      const arr = buyByAsset.get(tx.assetId) ?? [];
      arr.push(tx);
      buyByAsset.set(tx.assetId, arr);
    }
  }
  const globalBuys = transactions.filter((t) => t.type === "BUY").map((t) => t.amount);
  const globalMedian = medianOf(globalBuys);
  const abnormal: Transaction[] = [];
  const assignmentMap = new Map(assignments.map((a) => [a.txId, a.behaviorType]));

  for (const tx of transactions) {
    if (assignmentMap.get(tx.id) !== "DISCRETIONARY_BUY") continue;
    // 基线排除自身：若该资产其他买入不足，退回全局中位数，避免单笔自证。
    const otherBuys = (buyByAsset.get(tx.assetId) ?? [])
      .filter((t) => t.id !== tx.id)
      .map((t) => t.amount);
    const baseline = otherBuys.length >= 2 ? medianOf(otherBuys) : otherBuys.length > 0 ? mean(otherBuys) : globalMedian;
    if (baseline > 0 && tx.amount >= 3 * baseline && tx.amount >= 5000) {
      abnormal.push(tx);
    }
  }
  return abnormal;
}

function medianOf(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 发现稳定重复的定投序列，提示用户保存为 Policy（PRD §23）。 */
export function detectPatterns(transactions: Transaction[], detectedAt: string): DetectedPattern[] {
  const buyByAsset = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.type === "BUY") {
      const arr = buyByAsset.get(tx.assetId) ?? [];
      arr.push(tx);
      buyByAsset.set(tx.assetId, arr);
    }
  }
  const patterns: DetectedPattern[] = [];
  for (const [assetId, series] of buyByAsset) {
    if (!isSystematic(series)) continue;
    const sorted = [...series].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((new Date(sorted[i].occurredAt).getTime() - new Date(sorted[i - 1].occurredAt).getTime()) / 86400000);
    }
    const avgInterval = mean(intervals);
    const cadence = avgInterval >= 27 ? "monthly" : avgInterval >= 6 ? "weekly" : "daily";
    patterns.push({
      id: `pattern:${assetId}:${cadence}`,
      detectedAt,
      behaviorType: "SYSTEMATIC_INVESTMENT",
      assetId,
      cadence,
      typicalAmount: mean(sorted.map((t) => t.amount)),
      occurrences: sorted.length,
      suggestedPolicyName: `${assetId} ${cadence} 定投`,
    });
  }
  return patterns;
}

export interface BehaviorActionResult {
  actions: Action[];
  patterns: DetectedPattern[];
}

/** 生成行为类 Action：异常金额 + 无法分类，并产出 DetectedPattern。 */
export function buildBehaviorActions(transactions: Transaction[], today: string): BehaviorActionResult {
  const assignments = classifyTransactions(transactions);
  const abnormal = detectAbnormalTransactions(transactions, assignments);
  const actions: Action[] = [];

  for (const tx of abnormal) {
    actions.push({
      id: `act:abnormal:${tx.id}:${today}`,
      type: "ABNORMAL_TRANSACTION",
      status: "open",
      createdAt: today,
      transactionId: tx.id,
      title: "发现异常投资行为",
      detail: `金额 ${tx.amount} ${tx.amountUnit} 明显高于历史正常范围，请确认性质。`,
    });
  }

  const assignmentMap = new Map(assignments.map((a) => [a.txId, a.behaviorType]));
  for (const tx of transactions) {
    if (tx.status === "FAILED") continue;
    if (assignmentMap.get(tx.id) === "UNKNOWN") {
      actions.push({
        id: `act:unclassified:${tx.id}:${today}`,
        type: "UNCLASSIFIED_TRANSACTION",
        status: "open",
        createdAt: today,
        transactionId: tx.id,
        title: "发现无法自动分类的交易",
        detail: `交易 ${tx.type} ${tx.amount} ${tx.amountUnit} 暂未能归入既有策略，请确认。`,
      });
    }
  }

  const patterns = detectPatterns(transactions, today);
  return { actions, patterns };
}
