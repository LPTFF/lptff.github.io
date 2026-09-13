import policy from "../../project-support/extension/lptff-investment-assistant/content-freshness.json";

export function collectionFreshness(meta: any, uids: string[], now = Date.now()) {
  const states = uids.map((uid) => meta?.sources?.find((item: any) => item.uid === uid));
  const times = states.map((item) => Number(item?.lastSuccessAt || (["success", "completed"].includes(item?.state) ? meta?.updatedAt : 0)));
  const validTimes = times.filter((t) => t > 0 && t <= now + 60000);
  const checkedAt = validTimes.length === uids.length && uids.length > 0 ? Math.min(...validTimes) : (validTimes.length ? Math.max(...validTimes) : 0);

  if (meta?.state === "running") return { state: "running", label: "正在采集", checkedAt };

  const failedAuthors = states.filter((item) => item && !["success", "completed", "unknown"].includes(item.state));
  if (failedAuthors.length > 0 || ["failed", "cancelled"].includes(meta?.state)) {
    if (validTimes.length > 0) {
      return { state: "partial", label: `部分作者采集成功（${validTimes.length}/${uids.length}），未完成可重试`, checkedAt };
    }
    return { state: "failed", label: "上次采集未完成，请重试", checkedAt: 0 };
  }

  if (!checkedAt || !uids.length) return { state: "unknown", label: "尚未确认采集时间", checkedAt: 0 };
  const age = now - checkedAt;
  return age >= policy.refreshAfterMs
    ? { state: "stale", label: "信息已过期，建议刷新", checkedAt }
    : age >= policy.warnAfterMs
    ? { state: "soon", label: "信息即将过期", checkedAt }
    : { state: "fresh", label: "信息在有效期内", checkedAt };
}
