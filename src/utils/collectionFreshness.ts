import policy from "../../project-support/extension/lptff-investment-assistant/content-freshness.json";
export function collectionFreshness(meta: any, uids: string[], now = Date.now()) {
  const states = uids.map(uid => meta?.sources?.find((item: any) => item.uid === uid));
  const times = states.map(item => Number(item?.lastSuccessAt || (item?.state === "success" ? meta?.updatedAt : 0)));
  const checkedAt = times.every(time => time > 0 && time <= now + 60000) ? Math.min(...times) : 0;
  if (meta?.state === "running") return { state: "running", label: "正在采集", checkedAt };
  if (states.some(item => item && !["success", "unknown"].includes(item.state)) || ["failed", "cancelled"].includes(meta?.state)) {
    return { state: "failed", label: "上次采集未完成，请重试", checkedAt };
  }
  if (!checkedAt || !uids.length) return { state: "unknown", label: "尚未确认采集时间", checkedAt: 0 };
  const age = now - checkedAt;
  return age >= policy.refreshAfterMs ? { state: "stale", label: "信息已过期，建议刷新", checkedAt }
    : age >= policy.warnAfterMs ? { state: "soon", label: "信息即将过期", checkedAt }
    : { state: "fresh", label: "信息在有效期内", checkedAt };
}
