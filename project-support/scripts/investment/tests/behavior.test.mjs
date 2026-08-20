import assert from "node:assert/strict";
import test from "node:test";
import { buildBehaviorActions } from "../../../../src/investment/engines/behavior/behavior.ts";

function tx(overrides) {
  return {
    id: "tx:1",
    occurredAt: "2026-08-20T00:00:00.000Z",
    assetId: "000001",
    type: "OTHER",
    amount: 100,
    amountUnit: "CNY",
    status: "confirmed",
    ...overrides,
  };
}

test("只有已确认且来源语义未知的 OTHER 交易生成未分类行动", () => {
  const transactions = [
    tx({ id: "transfer", type: "TRANSFER" }),
    tx({ id: "dividend", type: "DIVIDEND" }),
    tx({ id: "legacy-other" }),
    tx({ id: "pending", status: "requested", classificationWarning: "unmapped_transaction_type" }),
    tx({ id: "unknown", classificationWarning: "unmapped_transaction_type" }),
  ];
  const result = buildBehaviorActions(transactions, "2026-08-20");
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].transactionId, "unknown");
  assert.equal(result.actions[0].id, "act:unclassified:unknown");
});
