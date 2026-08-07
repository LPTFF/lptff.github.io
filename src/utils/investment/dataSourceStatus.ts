/**
 * 投资数据可信度状态工具（INV-DATA-001）
 *
 * 让 FundPilotPlus / Cryptocurrency 页面能诚实地告诉用户：
 * 数据来自哪里、什么时候生成、是否过期、加载是否成功。
 *
 * 状态分类遵循“事实观察 → 推导结论”：
 * - loading：正在请求
 * - fresh：成功且生成时间在新鲜度阈值内
 * - stale：展示的数据已过期（成功但旧，或刷新失败时保留的旧快照）
 * - failed：刷新失败且无任何可用数据
 * - unknown：有数据但生成时间缺失/无效
 */

export type DataSourceState = "loading" | "fresh" | "stale" | "failed" | "unknown";

export interface DataSourceMeta {
  /** 数据集标识（如 fundPilotData / cryptoMain / cryptoCandidates） */
  id: string;
  /** 展示名（如“基金分析数据”） */
  label: string;
  /** 来源描述（如“私人服务器定时生成的基金分析数据”） */
  source: string;
  /** 格式化后的生成时间，无则为空字符串 */
  generatedAt: string;
  /** 当前可信状态 */
  state: DataSourceState;
  /** 失败原因（state=failed 或失败保留旧快照时填写） */
  error?: string;
  /** 是否有可用数据（决定失败时是否保留旧快照） */
  hasData: boolean;
}

/** 数据新鲜度阈值：超过则视为过期。默认 24 小时。 */
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** 把后端返回的生成时间解析为 Date，容错秒/毫秒/字符串/Date。 */
export function parseGeneratedAt(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (typeof value === "number") {
    let ts = value;
    // 小于 1e12 视为秒级时间戳，转换为毫秒
    if (ts < 1e12) ts = ts * 1000;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** 格式化生成时间为本地可读字符串；无法解析时返回空字符串。 */
export function formatGeneratedAt(value: unknown): string {
  const d = parseGeneratedAt(value);
  if (!d) return "";
  return d.toLocaleString("zh-CN", { hour12: false });
}

/** 判断生成时间是否已过期。时间未知时返回 false（由 state=unknown 表达）。 */
export function isStale(generatedAt: unknown, now: number = Date.now()): boolean {
  const d = parseGeneratedAt(generatedAt);
  if (!d) return false;
  return now - d.getTime() > STALE_THRESHOLD_MS;
}

export interface ClassifyParams {
  loading: boolean;
  /** 捕获的异常，无异常传 null/undefined */
  error: unknown;
  /** 数据集中代表生成时间的字段值 */
  generatedAt: unknown;
  /** 当前是否已有可用数据（失败时保留旧数据的关键判据） */
  hasData: boolean;
  /** 注入用当前时间，便于测试 */
  now?: number;
}

/**
 * 分类数据集可信状态。
 *
 * 失败但有旧数据 → stale（明确标记为旧快照，配合 error 说明刷新失败）。
 * 失败且无数据 → failed。
 * 有数据但时间缺失/无效 → unknown。
 */
export function classifyDataSourceStatus({
  loading,
  error,
  generatedAt,
  hasData,
  now = Date.now(),
}: ClassifyParams): DataSourceState {
  if (loading) return "loading";
  if (error) {
    return hasData ? "stale" : "failed";
  }
  if (!hasData) return "unknown";
  const d = parseGeneratedAt(generatedAt);
  if (!d) return "unknown";
  return now - d.getTime() > STALE_THRESHOLD_MS ? "stale" : "fresh";
}

/** 状态的中文展示名。 */
export function stateLabel(state: DataSourceState): string {
  switch (state) {
    case "loading":
      return "加载中";
    case "fresh":
      return "最新";
    case "stale":
      return "已过期";
    case "failed":
      return "加载失败";
    case "unknown":
      return "时间未知";
    default:
      return "时间未知";
  }
}

/** 把异常归一化为简短可读字符串，不泄露堆栈细节。 */
export function describeError(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name;
  // fetch 失败常为 TypeError "Failed to fetch"
  return String(error);
}