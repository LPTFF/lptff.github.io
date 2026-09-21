/**
 * 需求验证与埋点监控 - 类型定义与白名单
 * 遵循 docs/product/README.md 隐私边界与事件语义约束
 */

export type FeatureId =
  | "career"
  | "welfare"
  | "navigation"
  | "devtools"
  | "blog"
  | "entertainment";

export type ActionId =
  // career
  | "generate_directions"
  | "filter_jobs"
  | "open_platform"
  // welfare
  | "filter_welfare"
  | "open_resource"
  // navigation
  | "open_site"
  // devtools
  | "compress_text"
  | "format_json"
  | "generate_qr"
  // blog
  | "view_article"
  | "open_reference"
  // entertainment
  | "filter_platform"
  | "open_media";

export type TaskResult = "success" | "empty" | "failure" | "cancelled";

export type TargetCategory =
  | "card"
  | "ai"
  | "vps"
  | "domain"
  | "hosting"
  | "job_platform"
  | "general_link"
  | "other";

export type ErrorCategory =
  | "network_error"
  | "timeout"
  | "parse_error"
  | "storage_error"
  | "runtime_error"
  | "unknown";

export type HealthStatus = "available" | "expired" | "empty_data" | "failed" | "unknown";

export type ValueFeedbackType = "helpful" | "unhelpful" | "not_needed_now";

export type ObstructionLevel = "blocking" | "minor_inconvenience" | "not_blocking" | "unknown";

export type ObservationEventType =
  | "feature_view"
  | "task_start"
  | "task_result"
  | "outbound_open"
  | "value_feedback"
  | "feature_health";

export interface BaseEvent {
  event_id: string;
  event_type: ObservationEventType;
  feature_id: FeatureId;
  session_id: string;
  timestamp: number;
  date: string; // 本地 YYYY-MM-DD
  tz_offset: number; // 分钟
  contract_version: string; // 契约版本，如 "1.0.0"
  feature_version?: string;
  is_test?: boolean;
}

export interface FeatureViewEvent extends BaseEvent {
  event_type: "feature_view";
}

export interface TaskStartEvent extends BaseEvent {
  event_type: "task_start";
  action_id: ActionId;
  operation_id: string;
}

export interface TaskResultEvent extends BaseEvent {
  event_type: "task_result";
  action_id: ActionId;
  operation_id: string;
  result: TaskResult;
  error_category?: ErrorCategory;
}

export interface OutboundOpenEvent extends BaseEvent {
  event_type: "outbound_open";
  action_id: ActionId;
  target_category: TargetCategory;
}

export interface ValueFeedbackEvent extends BaseEvent {
  event_type: "value_feedback";
  feedback: ValueFeedbackType;
  obstruction_level?: ObstructionLevel;
}

export interface FeatureHealthEvent extends BaseEvent {
  event_type: "feature_health";
  health_status: HealthStatus;
}

export type ObservationEvent =
  | FeatureViewEvent
  | TaskStartEvent
  | TaskResultEvent
  | OutboundOpenEvent
  | ValueFeedbackEvent
  | FeatureHealthEvent;

export interface ObservationSettings {
  status: "active" | "paused" | "disabled";
  coverageStartTime: string | null;
  retentionDaysRaw: number; // 默认 28 天
  retentionDaysAgg: number; // 默认 180 天
  isTestMode: boolean;
  truncated: boolean; // 是否发生过存储上限截断
}

export interface DailyFeatureAggregation {
  date: string; // YYYY-MM-DD
  tz_offset: number;
  feature_id: FeatureId;
  visible_sessions: number;
  attempt_sessions: number;
  outbound_sessions: number;
  task_attempts: number;
  task_success: number;
  task_empty: number;
  task_failure: number;
  task_cancelled: number;
  task_unobserved: number;
  feedback_counts: Record<ValueFeedbackType, number>;
  obstruction_counts: Record<ObstructionLevel, number>;
  health_counts: Record<HealthStatus, number>;
  error_category_counts: Record<ErrorCategory, number>;
}

export interface FeatureMetricsSummary {
  feature_id: FeatureId;
  feature_name: string;
  visible_sessions: number;
  attempt_sessions: number;
  outbound_sessions: number;
  attempt_ratio: number | null; // 尝试比例: 有尝试的可见会话数 / 可见会话数
  outbound_ratio: number | null; // 外跳比例: 有外跳的可见会话数 / 可见会话数
  task_attempts: number;
  task_success: number;
  task_empty: number;
  task_failure: number;
  task_cancelled: number;
  task_unobserved: number;
  success_rate: number | null; // 成功数 / 尝试数
  final_state_coverage: number | null; // 终态覆盖比例: (成功+空+失败+取消) / 尝试数
  distinct_days: number; // 跨周期活跃自然日数
  distinct_weeks: number; // 跨周期活跃自然周数
  weeks_with_completion: number; // 产生成功结果的自然周数
  adjacent_day_interval: number | null; // 相邻活跃日均间隔天数
  feedback_counts: Record<ValueFeedbackType, number>;
  obstruction_counts: Record<ObstructionLevel, number>;
  feedback_coverage: number | null; // 反馈覆盖率
  error_category_counts: Record<ErrorCategory, number>;
  health_counts: Record<HealthStatus, number>;
  data_sufficiency: "sufficient" | "insufficient" | "unknown";
}
