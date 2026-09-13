/**
 * 需求验证与埋点监控 - 确定性指标聚合计算引擎
 * 严格执行规范算式，不混淆会话与操作，处理分母为0与小样本边界
 */

import type {
  ObservationEvent,
  FeatureId,
  FeatureMetricsSummary,
  TaskResult,
  ValueFeedbackType,
  ObstructionLevel,
  HealthStatus,
  ErrorCategory,
} from "./types";

export const FEATURE_NAMES: Record<FeatureId, string> = {
  career: "求职机会发现",
  welfare: "薅羊毛福利雷达",
  navigation: "导航专区",
  devtools: "开发工具",
  blog: "博客文章",
  entertainment: "娱乐专区",
};

/** 计算两个本地日期的天数差 */
function diffDays(dateA: string, dateB: string): number {
  const d1 = new Date(dateA).getTime();
  const d2 = new Date(dateB).getTime();
  return Math.abs(Math.round((d2 - d1) / (24 * 60 * 60 * 1000)));
}

/** 计算日期所属的 ISO 周（格式 YYYY-Wxx） */
function getIsoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** 对指定功能的原始事件流进行确定性聚合分析 */
export function computeFeatureMetrics(
  featureId: FeatureId,
  events: ObservationEvent[],
  includeTest = false
): FeatureMetricsSummary {
  const featureEvents = events.filter((ev) => {
    if (ev.feature_id !== featureId) return false;
    if (!includeTest && ev.is_test) return false;
    return true;
  });

  const visibleSessions = new Set<string>();
  const attemptSessions = new Set<string>();
  const outboundSessions = new Set<string>();

  // 操作状态表：operation_id -> { result, start_date, has_started }
  const operations = new Map<
    string,
    {
      has_started: boolean;
      start_date: string;
      result?: TaskResult;
      error_category?: ErrorCategory;
    }
  >();

  const distinctDays = new Set<string>();
  const distinctWeeks = new Set<string>();
  const completionWeeks = new Set<string>();

  const feedbackCounts: Record<ValueFeedbackType, number> = {
    helpful: 0,
    unhelpful: 0,
    not_needed_now: 0,
  };

  const obstructionCounts: Record<ObstructionLevel, number> = {
    blocking: 0,
    minor_inconvenience: 0,
    not_blocking: 0,
    unknown: 0,
  };

  const errorCounts: Record<ErrorCategory, number> = {
    network_error: 0,
    timeout: 0,
    parse_error: 0,
    storage_error: 0,
    runtime_error: 0,
    unknown: 0,
  };

  const healthCounts: Record<HealthStatus, number> = {
    available: 0,
    expired: 0,
    empty_data: 0,
    failed: 0,
    unknown: 0,
  };

  for (const ev of featureEvents) {
    if (ev.event_type === "feature_view") {
      visibleSessions.add(ev.session_id);
      distinctDays.add(ev.date);
      distinctWeeks.add(getIsoWeek(ev.date));
    } else if (ev.event_type === "task_start") {
      attemptSessions.add(ev.session_id);
      distinctDays.add(ev.date);
      distinctWeeks.add(getIsoWeek(ev.date));

      const existing = operations.get(ev.operation_id);
      if (!existing) {
        operations.set(ev.operation_id, {
          has_started: true,
          start_date: ev.date,
        });
      } else {
        existing.has_started = true;
      }
    } else if (ev.event_type === "task_result") {
      distinctDays.add(ev.date);
      distinctWeeks.add(getIsoWeek(ev.date));

      const existing = operations.get(ev.operation_id);
      if (existing) {
        // 同一操作仅采纳首次到达的终态
        if (!existing.result) {
          existing.result = ev.result;
          existing.error_category = ev.error_category;
        }
      } else {
        // 未匹配到 task_start 的孤立结果单独登记，不伪造 start
        operations.set(ev.operation_id, {
          has_started: false,
          start_date: ev.date,
          result: ev.result,
          error_category: ev.error_category,
        });
      }

      if (ev.result === "success") {
        completionWeeks.add(getIsoWeek(ev.date));
      }
      if (ev.result === "failure" && ev.error_category) {
        errorCounts[ev.error_category] = (errorCounts[ev.error_category] || 0) + 1;
      }
    } else if (ev.event_type === "outbound_open") {
      outboundSessions.add(ev.session_id);
      distinctDays.add(ev.date);
      distinctWeeks.add(getIsoWeek(ev.date));
    } else if (ev.event_type === "value_feedback") {
      feedbackCounts[ev.feedback] = (feedbackCounts[ev.feedback] || 0) + 1;
      if (ev.obstruction_level) {
        obstructionCounts[ev.obstruction_level] = (obstructionCounts[ev.obstruction_level] || 0) + 1;
      }
    } else if (ev.event_type === "feature_health") {
      healthCounts[ev.health_status] = (healthCounts[ev.health_status] || 0) + 1;
    }
  }

  // 统计任务结果
  let taskAttempts = 0;
  let taskSuccess = 0;
  let taskEmpty = 0;
  let taskFailure = 0;
  let taskCancelled = 0;
  let taskUnobserved = 0;

  for (const op of operations.values()) {
    taskAttempts += 1;
    if (op.result === "success") taskSuccess += 1;
    else if (op.result === "empty") taskEmpty += 1;
    else if (op.result === "failure") taskFailure += 1;
    else if (op.result === "cancelled") taskCancelled += 1;
    else taskUnobserved += 1;
  }

  const visibleCount = visibleSessions.size;
  const attemptCount = attemptSessions.size;
  const outboundCount = outboundSessions.size;

  // 尝试比例：主动尝试的可见会话数 / 可见会话数
  const attemptRatio = visibleCount > 0 ? attemptCount / visibleCount : null;
  // 外跳比例：有外跳的可见会话数 / 可见会话数
  const outboundRatio = visibleCount > 0 ? outboundCount / visibleCount : null;

  // 成功率与终态覆盖率
  const successRate = taskAttempts > 0 ? taskSuccess / taskAttempts : null;
  const finalStateCoverage =
    taskAttempts > 0 ? (taskSuccess + taskEmpty + taskFailure + taskCancelled) / taskAttempts : null;

  // 计算相邻活跃日平均间隔
  let adjacentDayInterval: number | null = null;
  const sortedDays = Array.from(distinctDays).sort();
  if (sortedDays.length > 1) {
    let totalDiff = 0;
    for (let i = 1; i < sortedDays.length; i++) {
      totalDiff += diffDays(sortedDays[i - 1], sortedDays[i]);
    }
    adjacentDayInterval = Number((totalDiff / (sortedDays.length - 1)).toFixed(1));
  }

  // 计算反馈覆盖率
  const totalFeedback = feedbackCounts.helpful + feedbackCounts.unhelpful + feedbackCounts.not_needed_now;
  const feedbackCoverage = visibleCount > 0 ? totalFeedback / visibleCount : null;

  // 数据充分度评估
  let dataSufficiency: "sufficient" | "insufficient" | "unknown" = "unknown";
  if (featureEvents.length === 0) {
    dataSufficiency = "unknown";
  } else if (visibleCount < 3 && taskAttempts < 5) {
    dataSufficiency = "insufficient";
  } else {
    dataSufficiency = "sufficient";
  }

  return {
    feature_id: featureId,
    feature_name: FEATURE_NAMES[featureId] || featureId,
    visible_sessions: visibleCount,
    attempt_sessions: attemptCount,
    outbound_sessions: outboundCount,
    attempt_ratio: attemptRatio,
    outbound_ratio: outboundRatio,
    task_attempts: taskAttempts,
    task_success: taskSuccess,
    task_empty: taskEmpty,
    task_failure: taskFailure,
    task_cancelled: taskCancelled,
    task_unobserved: taskUnobserved,
    success_rate: successRate,
    final_state_coverage: finalStateCoverage,
    distinct_days: distinctDays.size,
    distinct_weeks: distinctWeeks.size,
    weeks_with_completion: completionWeeks.size,
    adjacent_day_interval: adjacentDayInterval,
    feedback_counts: feedbackCounts,
    obstruction_counts: obstructionCounts,
    feedback_coverage: feedbackCoverage,
    error_category_counts: errorCounts,
    health_counts: healthCounts,
    data_sufficiency: dataSufficiency,
  };
}
