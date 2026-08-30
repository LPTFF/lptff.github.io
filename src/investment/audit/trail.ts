/**
 * Investment Ledger 本地审计事件链。
 *
 * 只记录用户可理解的操作摘要，不复制账户、持仓、交易或原始采集内容。每条事件
 * 通过 SHA-256 绑定上一条事件；校验用于发现链内记录被修改、插入或删除。
 */

export const AUDIT_GENESIS_HASH = "0".repeat(64);

export type AuditActor = "user" | "system";
export type AuditOrigin = "user-action" | "data-import" | "automatic-maintenance";

export interface AuditContext {
  actor: AuditActor;
  origin: AuditOrigin;
}

export const USER_AUDIT_CONTEXT: AuditContext = { actor: "user", origin: "user-action" };

export interface AuditEventInput {
  type: string;
  actor: AuditActor;
  origin: AuditOrigin;
  summary: string;
  subjectId?: string;
  details?: Record<string, unknown>;
}

export interface AuditEvent extends AuditEventInput {
  sequence: number;
  occurredAt: string;
  previousHash: string;
  hash: string;
}

export interface AuditVerification {
  ok: boolean;
  count: number;
  headHash: string;
  message: string;
  errorAt?: number;
}

/**
 * 审计详情采用逐事件白名单。未来调用方即使误传 Cookie、Token 或账户原文，未列入
 * 白名单的字段也不会进入本地操作链。
 */
const DETAIL_ALLOWLIST: Record<string, ReadonlySet<string>> = {
  "data.imported": new Set([
    "source", "status", "addedTransactions", "duplicateTransactions", "addedDailyPnl", "failureCount", "warningCount",
  ]),
  "rules.updated": new Set(["scopeId", "ruleCount", "effectiveFrom"]),
  "decision.recorded": new Set(["scopeId", "direction", "assetId"]),
  "execution.linked": new Set(["linkMethod", "confidence"]),
  "reduction.plan.created": new Set(["scopeId", "assetId"]),
};

function normalize(value: unknown, seen = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("审计事件不能包含非有限数字");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") throw new TypeError(`审计事件不能包含 ${typeof value}`);
  if (seen.has(value)) throw new TypeError("审计事件不能包含循环引用");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (item === undefined) throw new TypeError("审计事件数组不能包含 undefined");
        return normalize(item, seen);
      });
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("审计事件只能包含普通对象和数组");
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (item === undefined) throw new TypeError(`审计事件字段 ${key} 不能是 undefined`);
      result[key] = normalize(item, seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

function selectAllowedDetails(type: string, value: Record<string, unknown> | undefined): Record<string, unknown> {
  const allowed = DETAIL_ALLOWLIST[type];
  if (!allowed || !value) return {};
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (value[key] !== undefined) result[key] = value[key];
  }
  return result;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAuditEvent(
  input: AuditEventInput,
  previous?: AuditEvent,
  now = new Date(),
): Promise<AuditEvent> {
  if (!input.type.trim() || !input.summary.trim()) throw new TypeError("审计事件类型和摘要不能为空");
  const body = normalize({
    sequence: (previous?.sequence ?? 0) + 1,
    occurredAt: now.toISOString(),
    type: input.type,
    actor: input.actor,
    origin: input.origin,
    summary: input.summary,
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    details: selectAllowedDetails(input.type, input.details),
    previousHash: previous?.hash ?? AUDIT_GENESIS_HASH,
  }) as Omit<AuditEvent, "hash">;
  return { ...body, hash: await sha256(body) };
}

export async function verifyAuditTrail(events: AuditEvent[]): Promise<AuditVerification> {
  let previousHash = AUDIT_GENESIS_HASH;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const expectedSequence = index + 1;
    if (event.sequence !== expectedSequence || event.previousHash !== previousHash) {
      return {
        ok: false,
        count: events.length,
        headHash: events.at(-1)?.hash ?? AUDIT_GENESIS_HASH,
        errorAt: event.sequence,
        message: `第 ${event.sequence} 条事件的顺序或前序哈希不一致`,
      };
    }
    const { hash, ...body } = event;
    if (hash !== await sha256(body)) {
      return {
        ok: false,
        count: events.length,
        headHash: events.at(-1)?.hash ?? AUDIT_GENESIS_HASH,
        errorAt: event.sequence,
        message: `第 ${event.sequence} 条事件内容校验失败`,
      };
    }
    previousHash = hash;
  }
  return {
    ok: true,
    count: events.length,
    headHash: previousHash,
    message: events.length ? "链内记录顺序与内容校验通过" : "尚无可校验的操作记录",
  };
}
