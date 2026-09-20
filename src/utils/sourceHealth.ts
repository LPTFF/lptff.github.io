/**
 * src/utils/sourceHealth.ts
 * 统一快照与采集健康状态管理工具库
 */
import rawHealthData from "../data/health-status.json";

export interface SnapshotSourceInfo {
  snapshotId: string;
  source: string;
  collectionMode: "server-https" | "plugin-bridge" | "legacy-http" | string;
  collectedAt: string;
  analyzedAt: string | null;
  publishedAt: string | null;
  contentLatestAt: string | null;
  itemCount: number;
  state: "fresh" | "unchanged" | "preserved" | "failed" | string;
  analysisMode: "gemini" | "mixed" | "rule-fallback" | "none" | string | null;
  model: string | null;
  reason: string | null;
}

export interface HealthStatusData {
  version: number;
  updatedAt: string;
  sources: Record<string, SnapshotSourceInfo>;
}

export function getHealthStatus(): HealthStatusData {
  if (rawHealthData && typeof rawHealthData === "object" && "sources" in rawHealthData) {
    return rawHealthData as unknown as HealthStatusData;
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sources: {},
  };
}

export function getSourceHealth(sourceKey: string): SnapshotSourceInfo | null {
  const health = getHealthStatus();
  return health.sources[sourceKey] || null;
}

export function formatCollectionMode(mode: string | undefined): {
  label: string;
  tagType: "success" | "warning" | "info" | "primary" | "danger";
  isServer: boolean;
  isBridge: boolean;
} {
  switch (mode) {
    case "server-https":
      return { label: "服务器 HTTPS 采集", tagType: "success", isServer: true, isBridge: false };
    case "plugin-bridge":
      return { label: "浏览器插件桥接采集", tagType: "warning", isServer: false, isBridge: true };
    case "legacy-http":
      return { label: "原生 HTTP 采集", tagType: "info", isServer: false, isBridge: false };
    default:
      return { label: "服务器采集", tagType: "info", isServer: true, isBridge: false };
  }
}

export function formatAnalysisMode(
  analysisMode: string | null | undefined,
  model: string | null | undefined
): {
  label: string;
  tagType: "success" | "warning" | "info" | "primary" | "danger";
  isAi: boolean;
} {
  if (analysisMode === "mixed") {
    return {
      label: "Gemini + 规则混合标注",
      tagType: "warning",
      isAi: true,
    };
  }
  if (analysisMode === "gemini") {
    const modelShort = model?.replace(/^gemini-/, "") || "3.5-flash-lite";
    return {
      label: `Gemini AI · ${modelShort}`,
      tagType: "success",
      isAi: true,
    };
  }
  if (analysisMode === "rule-fallback") {
    return {
      label: "规则分类引擎",
      tagType: "info",
      isAi: false,
    };
  }
  if (analysisMode === "none") {
    return {
      label: "原生数据 (无分析)",
      tagType: "info",
      isAi: false,
    };
  }
  if (!analysisMode && model?.includes("gemini")) {
    const modelShort = model.replace(/^gemini-/, "");
    return {
      label: `Gemini AI · ${modelShort}`,
      tagType: "success",
      isAi: true,
    };
  }
  return {
    label: "未标注",
    tagType: "info",
    isAi: false,
  };
}

export function formatFreshness(isoString: string | number | null | undefined): {
  label: string;
  isExpired: boolean;
  tagType: "success" | "warning" | "danger" | "info";
} {
  if (!isoString) {
    return { label: "时间未知", isExpired: true, tagType: "info" };
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return { label: "时间未知", isExpired: true, tagType: "info" };
  }
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let label = "";
  if (diffMs < 0 || diffMs < 1000 * 60 * 2) {
    label = "刚刚更新";
  } else if (diffMs < 1000 * 60 * 60) {
    label = `${Math.floor(diffMs / (1000 * 60))} 分钟前`;
  } else if (diffHours < 24) {
    label = `${Math.floor(diffHours)} 小时前`;
  } else {
    label = `${Math.floor(diffHours / 24)} 天前`;
  }

  // 超过 48 小时视为过期/迟滞
  const isExpired = diffHours > 48;
  const tagType = isExpired ? "warning" : "success";

  return { label, isExpired, tagType };
}
