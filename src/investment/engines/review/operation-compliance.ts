/**
 * Investment Review P0 引擎：计划操作与真实执行对照（WP0-2）。
 *
 * 区分无操作、计划内、计划外/超量操作，以及待确认/部分确认/失败/撤销；历史金额偏离只作为
 * 补充信号，不直接产生规则 breach（工程附录 §4）。决策记录事前不可变——已发生的交易不得
 * 被补写为 DecisionRecord；关联不确定时输出 unlinked，不以金额/日期相近强行关联。
 *
 * 纯函数：不读 DOM / 真实来源 / Cookie / Token。
 */
import type {
  DecisionRecord,
  ExecutionLink,
  OperationComplianceJudgment,
  OperationComplianceValue,
  OperationDeviation,
  OperationPlan,
  ExecutionState,
  PerJudgmentCoverage,
  PlanStatus,
  PlanValueUnit,
  StrategyRuleVersion,
  Transaction,
} from "../../domain";
import { comparableTransactionValue } from "../../domain";
import { classifyTransactions, detectAbnormalTransactions } from "../behavior";

export interface OperationComplianceInput {
  /** 范围内交易（已按 scope 过滤）。 */
  transactions: Transaction[];
  decisions: DecisionRecord[];
  plans?: OperationPlan[];
  /** 用户/adapter 声明的计划-执行关联。未在 links 中且无显式 source_id 的交易视为 unlinked。 */
  links: ExecutionLink[];
  /** 当时生效的策略规则版本（用于 pause_window 检查）。 */
  rules: StrategyRuleVersion[];
  asOf: string;
  /** 该 scope 的 operation 判断 Coverage（来自 buildPerJudgmentCoverage）。 */
  coverage: PerJudgmentCoverage;
}

const AMOUNT_TOLERANCE = 0.01;

function txDirection(tx: Transaction): "BUY" | "SELL" | null {
  if (tx.type === "BUY") return "BUY";
  if (tx.type === "SELL") return "SELL";
  return null;
}

function executionStateOf(status: Transaction["status"]): ExecutionState {
  switch (status) {
    case "requested":
    case "partially_confirmed":
    case "confirmed":
    case "failed":
    case "cancelled":
    case "unknown":
      return status;
    default:
      return "unknown";
  }
}

function wasRecordedBefore(decidedAt: string, occurredAt: string): boolean {
  const occurredDate = occurredAt.slice(0, 10);
  if (!occurredAt.includes("T")) return decidedAt.slice(0, 10) < occurredDate;
  return decidedAt < occurredAt;
}

function eligiblePriorDecisions(
  tx: Transaction,
  decisions: DecisionRecord[],
): DecisionRecord[] {
  const direction = txDirection(tx);
  return decisions.filter((decision) =>
    decision.immutable === true
    && decision.status === "recorded"
    && wasRecordedBefore(decision.decidedAt, tx.occurredAt)
    && (!decision.assetId || decision.assetId === tx.assetId)
    && (!direction || decision.direction === direction),
  );
}

/** 找到交易对应的决策记录与关联。未声明关联时返回 unlinked，不猜测。 */
function resolveLink(
  tx: Transaction,
  decisions: DecisionRecord[],
  links: ExecutionLink[],
): { decision?: DecisionRecord; link?: ExecutionLink } {
  const link = links.find((l) => l.transactionId === tx.id && l.linkMethod !== "unlinked");
  if (!link) return {};
  const decision = decisions.find((d) =>
    d.id === link.decisionRecordId
    && wasRecordedBefore(d.decidedAt, tx.occurredAt),
  );
  return decision ? { decision, link } : {};
}

function inWindow(date: string, window?: { start: string; end: string }): boolean {
  if (!window) return true;
  const d = date.slice(0, 10);
  return d >= window.start && d <= window.end;
}

interface PlannedQuantity {
  value: number;
  unit: PlanValueUnit;
}

function plannedQuantityOf(
  decision: DecisionRecord,
  plans: OperationPlan[],
): PlannedQuantity | undefined {
  const operationPlan = plans.find((plan) => plan.decisionRecordId === decision.id);
  if (operationPlan) return { value: operationPlan.plannedValue, unit: operationPlan.unit };
  if (decision.plannedAmount !== undefined) return { value: decision.plannedAmount, unit: "CNY" };
  if (decision.plannedShares !== undefined) return { value: decision.plannedShares, unit: "shares" };
  if (decision.plannedPct !== undefined) return { value: decision.plannedPct, unit: "pct" };
  return undefined;
}

function normalizeTransactionUnit(unit: string): PlanValueUnit | undefined {
  const normalized = unit.trim().toLowerCase();
  if (["cny", "rmb", "元", "人民币"].includes(normalized)) return "CNY";
  if (["shares", "share", "份", "份额"].includes(normalized)) return "shares";
  if (["pct", "%", "percent", "percentage"].includes(normalized)) return "pct";
  return undefined;
}

function quantityDimension(unit: PlanValueUnit): OperationDeviation["dimension"] {
  if (unit === "shares") return "shares";
  if (unit === "pct") return "pct";
  return "amount";
}

function computeDeviations(
  tx: Transaction,
  decision: DecisionRecord,
  plans: OperationPlan[],
): { deviations: OperationDeviation[]; quantityComparable: boolean } {
  const deviations: OperationDeviation[] = [];
  // 对象偏离
  if (decision.assetId && decision.assetId !== tx.assetId) {
    deviations.push({ dimension: "object", expected: decision.assetId, actual: tx.assetId });
  }
  // 方向偏离
  const dir = txDirection(tx);
  if (dir && dir !== decision.direction) {
    deviations.push({ dimension: "direction", expected: decision.direction, actual: dir });
  }
  const planned = plannedQuantityOf(decision, plans);
  const actualUnit = normalizeTransactionUnit(tx.amountUnit);
  let quantityComparable = true;
  if (planned) {
    if (!actualUnit || actualUnit !== planned.unit) {
      quantityComparable = false;
      deviations.push({
        dimension: "unit",
        expected: planned.unit,
        actual: actualUnit ?? tx.amountUnit,
        note: "缺少同一估值边界的可靠换算依据",
      });
    } else {
      const actual = comparableTransactionValue(tx);
      if (Math.abs(actual - planned.value) > AMOUNT_TOLERANCE) {
        deviations.push({
          dimension: quantityDimension(planned.unit),
          expected: String(planned.value),
          actual: String(actual),
          note: actual > planned.value ? "超过计划" : "低于计划",
        });
      }
    }
  }
  // 时间偏离
  if (decision.allowedWindow && !inWindow(tx.occurredAt, decision.allowedWindow)) {
    deviations.push({
      dimension: "timing",
      expected: `${decision.allowedWindow.start}~${decision.allowedWindow.end}`,
      actual: tx.occurredAt.slice(0, 10),
    });
  }
  return { deviations, quantityComparable };
}

function findPauseConflict(
  tx: Transaction,
  rules: StrategyRuleVersion[],
): { ruleVersionId: string; window: { start: string; end: string } } | undefined {
  for (const version of rules) {
    for (const rule of version.rules) {
      if (rule.kind !== "pause_window") continue;
      if (rule.assetId && rule.assetId !== tx.assetId) continue;
      if (inWindow(tx.occurredAt, rule.window)) {
        return { ruleVersionId: version.id, window: rule.window };
      }
    }
  }
  return undefined;
}

/**
 * 评估每笔范围内交易的计划合规性。申请不等于确认：requested/partially_confirmed 的执行状态
 * 被独立报告；failed/cancelled 不进入 confirmed/restored。
 */
export function evaluateOperationCompliance(input: OperationComplianceInput): OperationComplianceJudgment[] {
  const { transactions, decisions, plans = [], links, rules, asOf, coverage } = input;
  const assignments = classifyTransactions(transactions);
  const abnormal = new Set(detectAbnormalTransactions(transactions, assignments).map((t) => t.id));
  const results: OperationComplianceJudgment[] = [];

  for (const tx of transactions) {
    const executionStatus = executionStateOf(tx.status);
    const { decision } = resolveLink(tx, decisions, links);
    const planExists = Boolean(decision);
    const priorDecisionRecordIds = planExists
      ? []
      : eligiblePriorDecisions(tx, decisions).map((record) => record.id);
    const comparison = decision
      ? computeDeviations(tx, decision, plans)
      : { deviations: [] as OperationDeviation[], quantityComparable: true };
    const deviations = comparison.deviations;
    const pauseConflict = findPauseConflict(tx, rules);
    const historicalAmountSignal = abnormal.has(tx.id);

    let conclusion: OperationComplianceValue["conclusion"];
    let status: OperationComplianceJudgment["status"];
    let reason: string;
    let nextStep: string | undefined;

    if (pauseConflict) {
      conclusion = "BREACH";
      status = "VALID";
      reason = `交易落在暂停窗口内（${pauseConflict.window.start}~${pauseConflict.window.end}），引用当时规则版本`;
      nextStep = "确认暂停规则是否仍生效，或撤销该笔操作";
    } else if (executionStatus === "requested") {
      // 申请未确认：执行尚未完成，无法判定计划合规或计划外。
      conclusion = "INSUFFICIENT_DATA";
      status = "PARTIAL";
      reason = "已提交申请但未确认，执行尚未完成";
      nextStep = "等待来源确认结果";
    } else if (executionStatus === "failed") {
      conclusion = "INSUFFICIENT_DATA";
      status = "FAILED";
      reason = "交易失败，未构成有效执行";
      nextStep = "确认是否重新提交或忽略";
    } else if (executionStatus === "cancelled") {
      conclusion = "INSUFFICIENT_DATA";
      status = "FAILED";
      reason = "交易已撤销";
      nextStep = "确认撤销原因";
    } else if (executionStatus === "unknown") {
      conclusion = "INSUFFICIENT_DATA";
      status = "UNKNOWN";
      reason = "来源已记录这笔操作，但没有提供可确认的执行结果";
      nextStep = "重新同步或等待来源更新；当前不能把它当作成功、失败或违规";
    } else if (executionStatus === "partially_confirmed") {
      if (planExists) {
        conclusion = "PARTIAL";
        status = "PARTIAL";
        reason = "部分确认，执行进行中";
        nextStep = "等待剩余份额确认";
      } else {
        conclusion = "INSUFFICIENT_DATA";
        status = "PARTIAL";
        reason = "部分确认且无显式计划关联，未确认完不判定计划外";
        nextStep = "等待全部确认后再判定计划合规";
      }
    } else if (!planExists) {
      conclusion = "BREACH";
      status = "VALID";
      if (priorDecisionRecordIds.length) {
        reason = "这笔已确认操作尚未关联到已有的事前计划记录";
        nextStep = "由你选择真实对应的事前计划；系统不会按金额或日期自动匹配";
      } else {
        reason = "计划核对启用后，这笔已确认操作没有可验证的事前计划记录";
        nextStep = "记录本次复盘说明；下一次操作前先建立计划，不能事后补写";
      }
    } else if (!comparison.quantityComparable && deviations.every((item) => item.dimension === "unit")) {
      conclusion = "INSUFFICIENT_DATA";
      status = "UNKNOWN";
      reason = "计划量与来源执行量的口径不同，当前没有可靠换算依据";
      nextStep = "补齐同一估值边界的净值或分母，或使用与来源一致的计划口径";
    } else if (deviations.some((item) => item.dimension !== "unit")) {
      conclusion = "BREACH";
      status = "VALID";
      reason = `计划内执行但存在偏离：${deviations.filter((item) => item.dimension !== "unit").map((d) => d.dimension).join("、")}`;
      nextStep = comparison.quantityComparable
        ? "按偏离维度核对计划与执行"
        : "先处理已确认的偏离；数量口径仍需补证据后另行核对";
    } else {
      conclusion = "COMPLIANT";
      status = "VALID";
      reason = "有匹配的事前计划且申请、确认与计划一致";
    }

    const judgmentId = planExists && decision
      ? `operation:${decision.id}`
      : `operation:unplanned:${tx.id}`;

    const value: OperationComplianceValue = {
      decisionRecordId: decision?.id,
      transactionId: tx.id,
      assetId: tx.assetId,
      amount: comparableTransactionValue(tx),
      occurredAt: tx.occurredAt,
      direction: txDirection(tx) ?? undefined,
      priorDecisionRecordIds: priorDecisionRecordIds.length
        ? priorDecisionRecordIds
        : undefined,
      planExists,
      deviations,
      pauseConflict,
      executionStatus,
      historicalAmountSignal: historicalAmountSignal || undefined,
      conclusion,
    };

    results.push({
      judgmentId,
      question: "operation_compliance",
      status,
      value,
      reason,
      ruleVersionRefs: [
        ...(decision?.strategyRuleVersionId ? [decision.strategyRuleVersionId] : []),
        ...(pauseConflict ? [pauseConflict.ruleVersionId] : []),
      ],
      evidenceRefs: [tx.id, ...(decision ? [decision.id] : [])],
      missingEvidence: executionStatus === "requested"
        ? ["来源确认结果"]
        : executionStatus === "unknown"
          ? ["可解释的来源执行状态"]
          : planExists && !comparison.quantityComparable
            ? ["计划与执行口径的可靠换算依据"]
            : !planExists
              ? [priorDecisionRecordIds.length ? "用户声明的计划关联" : "事前计划记录"]
              : [],
      stillAnswerable: [],
      nextStep,
      coverage: {
        judgmentId,
        sources: coverage.sources,
        window: coverage.window,
        pagingComplete: coverage.pagingComplete,
        freshness: coverage.freshness,
        warnings: coverage.warnings,
        affectedJudgmentIds: status === "VALID" && conclusion === "BREACH" ? [judgmentId] : [],
      },
    });
  }

  void asOf;
  return results;
}

/**
 * 状态机校验：计划 draft → recorded → linked|unlinked → reviewed。
 * 非法迁移抛错；用于保证事前记录不可被已发生执行覆盖。
 */
export function transitionPlan(current: PlanStatus, next: PlanStatus): PlanStatus {
  const allowed: Record<PlanStatus, PlanStatus[]> = {
    draft: ["recorded"],
    recorded: ["linked", "unlinked", "reviewed"],
    linked: ["reviewed"],
    unlinked: ["reviewed"],
    reviewed: [],
  };
  if (!allowed[current].includes(next)) {
    throw new Error(`transitionPlan: 非法状态迁移 ${current} → ${next}`);
  }
  return next;
}

/** 拒绝把已发生交易补写为事前 DecisionRecord：只能创建于 draft，且 decidedAt 须早于任何已关联交易。 */
export function assertDecisionImmutable(
  decision: DecisionRecord,
  linkedTransactionOccurredAt?: string,
): void {
  if (decision.immutable !== true) {
    throw new Error("assertDecisionImmutable: DecisionRecord 必须标记为不可变");
  }
  if (linkedTransactionOccurredAt && !wasRecordedBefore(decision.decidedAt, linkedTransactionOccurredAt)) {
    throw new Error("assertDecisionImmutable: 无法证明决策记录早于交易，不得关联或事后补写");
  }
}
