/**
 * Policy Engine（PRD §19-20、§22、EPIC 7）
 *
 * 版本不可覆盖：每次修改生成新 PolicyVersion，旧版本设置 effectiveTo，便于 Evidence
 * 日后做 v1 vs v2 对比（PRD §20）。evaluate 把当前组合暴露与规则对照，生成 Action。
 */
import type {
  Action,
  AssetMetadata,
  Policy,
  PolicyRule,
  PolicyVersion,
  PortfolioSnapshot,
} from "../../domain";
import { aggregateExposure } from "../exposure/exposure";

export interface NewVersionInput {
  createdAt?: string;
  effectiveFrom: string;
  rules: PolicyRule[];
  changeReason?: string;
}

export function nextVersionNumber(versions: PolicyVersion[]): number {
  return versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
}

export function buildPolicyVersion(
  policyId: string,
  version: number,
  input: NewVersionInput,
): PolicyVersion {
  return {
    id: `${policyId}:v${version}`,
    policyId,
    version,
    createdAt: input.createdAt,
    effectiveFrom: input.effectiveFrom,
    rules: input.rules,
    changeReason: input.changeReason,
  };
}

/** 把旧版本标记为被取代（设置 effectiveTo）。 */
export function supersede(version: PolicyVersion, effectiveTo: string): PolicyVersion {
  return { ...version, effectiveTo };
}

export function createInitialPolicy(input: {
  id: string;
  name: string;
  objective: string;
  effectiveFrom: string;
  createdAt?: string;
  rules: PolicyRule[];
  changeReason?: string;
}): { policy: Policy; version: PolicyVersion } {
  const version: PolicyVersion = {
    id: `${input.id}:v1`,
    policyId: input.id,
    version: 1,
    createdAt: input.createdAt,
    effectiveFrom: input.effectiveFrom,
    rules: input.rules,
    changeReason: input.changeReason,
  };
  const policy: Policy = {
    id: input.id,
    name: input.name,
    objective: input.objective,
    status: "active",
    currentVersionId: version.id,
    createdAt: input.createdAt,
  };
  return { policy, version };
}

/**
 * 评估当前生效版本，对超阈值的规则生成 POLICY_TRIGGER Action（PRD §22.1）。
 * 未知/缺失数据不静默升级：若资产元数据缺失导致无法计算暴露，返回 DATA_REQUIRED 提示而非跳过。
 */
export function evaluatePolicies(input: {
  portfolio?: PortfolioSnapshot;
  assets: AssetMetadata[];
  activeVersions: PolicyVersion[];
  today: string;
}): Action[] {
  const { portfolio, assets, activeVersions, today } = input;
  const actions: Action[] = [];
  if (!portfolio) return actions;

  for (const version of activeVersions) {
    for (const rule of version.rules) {
      if (rule.kind === "target_allocation" || rule.kind === "pause") {
        const slices = aggregateExposure(portfolio.holdings, assets, rule.dimension);
        const maxPct = rule.maxPct;
        const matched = rule.value ? slices.filter((s) => s.value === rule.value) : slices;
        for (const slice of matched) {
          if (slice.pct > maxPct) {
            actions.push({
              id: `act:policy:${version.policyId}:${rule.dimension}:${slice.value}:${today}`,
              type: "POLICY_TRIGGER",
              status: "open",
              createdAt: today,
              policyId: version.policyId,
              title: `${slice.value} 暴露 ${(slice.pct * 100).toFixed(1)}% 超过上限 ${(maxPct * 100).toFixed(1)}%`,
              detail: `规则：${rule.kind}；维度：${rule.dimension}`,
            });
          }
        }
      }
      // Regular/Additional/Review 规则不直接产生 Action，留作 Behavior/Evidence 使用。
    }
  }
  return actions;
}

/** 去重：已存在的同 id open action 不重复生成。 */
export function diffActions(existing: Action[], incoming: Action[]): Action[] {
  const ids = new Set(existing.filter((a) => a.status === "open").map((a) => a.id));
  return incoming.filter((a) => !ids.has(a.id));
}
