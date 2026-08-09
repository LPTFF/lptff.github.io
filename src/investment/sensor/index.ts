/**
 * Sensor source 状态（PRD §8.1、§10 SENSOR-001）。
 *
 * Agent A 仅消费 Adapter 输出推断状态；真实页面登录态由 Agent B 判定并脱敏回传。
 */
export type SourceStatus =
  | "unsupported"
  | "ready"
  | "loading"
  | "authentication_required"
  | "error";

export * from "./coverage";
