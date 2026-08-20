import assert from "node:assert/strict";
import test from "node:test";
import { mergeCoverageEntry } from "../../../../src/investment/sensor/coverage.ts";

const partial = {
  dataset: "transactions",
  knownRanges: [{ start: "2026-01-01", end: "2026-08-16" }],
  completeness: "partial",
  lastSyncedAt: "2026-08-16T00:00:00.000Z",
  warningCodes: ["eastmoney:transactions-partial"],
};

const complete = {
  dataset: "transactions",
  knownRanges: [{ start: "2025-08-20", end: "2026-08-20" }],
  completeness: "complete",
  lastSyncedAt: "2026-08-20T00:00:00.000Z",
  warningCodes: [],
};

test("新完整采集可以修复旧 partial 并清除过期警告", () => {
  const merged = mergeCoverageEntry(partial, complete);
  assert.equal(merged.completeness, "complete");
  assert.equal(merged.lastSyncedAt, complete.lastSyncedAt);
  assert.deepEqual(merged.warningCodes, []);
});

test("后续 partial 不会破坏最后一次已验证完整的 Coverage", () => {
  const failedLater = {
    ...partial,
    lastSyncedAt: "2026-08-21T00:00:00.000Z",
  };
  const merged = mergeCoverageEntry(complete, failedLater);
  assert.equal(merged.completeness, "complete");
  assert.equal(merged.lastSyncedAt, complete.lastSyncedAt);
  assert.deepEqual(merged.warningCodes, []);
});
