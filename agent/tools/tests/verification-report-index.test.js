import assert from "node:assert/strict";
import test from "node:test";
import { renderVerificationOverview, validateVerificationIndex } from "../verification-report-index.js";

function indexFixture(overrides = {}) {
  return {
    schemaVersion: 1,
    verifiedAt: "2026-08-01T12:00:00+08:00",
    authoritativeReport: "comprehensive.md",
    reports: [
      {
        id: "comprehensive",
        title: "综合报告",
        path: "comprehensive.md",
        role: "authoritative",
        status: "partial",
      },
      {
        id: "legacy",
        title: "旧报告",
        path: "legacy.md",
        role: "superseded-in-part",
        status: "partial",
        supersededBy: "comprehensive",
        note: "旧结论已更新",
      },
    ],
    claims: [
      {
        id: "INV-DATA-001",
        title: "投资状态",
        status: "blocked",
        inference: "浏览器指标记录 3 个 No Data，网络响应记录返回 HTML。",
        conclusion: "真实浏览器显示缺失状态。",
        evidence: [
          {
            label: "浏览器指标",
            path: "assets/investment-browser.json",
            kind: "browser",
          },
          {
            label: "真实截图",
            path: "assets/investment.png",
            kind: "screenshot",
          },
        ],
      },
    ],
    openItems: {
      product: [{ id: "INV-DATA-001", title: "投资数据可信度" }],
      verification: [{ id: "LEETCODE-UI", title: "随机交互" }],
      external: [],
    },
    ...overrides,
  };
}

function render(index) {
  return renderVerificationOverview({
    index: validateVerificationIndex(index, ".", { requireFiles: false }),
    evidence: { files: 3, bytes: 100, formattedBytes: "100 B" },
    archives: [{ date: "2026-07-31", files: 2, bytes: 20, formattedBytes: "20 B" }],
  });
}

test("uses explicit authority, status and superseded relation", () => {
  const content = render(indexFixture());
  assert.match(content, /\*\*部分完成\*\*：\[综合报告\]/);
  assert.match(content, /INV-DATA-001/);
  assert.match(content, /关键结论与事实依据/);
  assert.match(content, /事实观察.*3 个 No Data/);
  assert.match(content, /推导结论.*真实浏览器显示缺失状态/);
  assert.match(content, /\[浏览器指标\]\(current\/assets\/investment-browser\.json\)/);
  assert.match(content, /\[真实截图\]\(current\/assets\/investment\.png\)/);
  assert.match(content, /INV-DATA-001.*\[查看推导与证据\]\(#claim-inv-data-001\)/);
  assert.match(content, /LEETCODE-UI/);
  assert.match(content, /legacy.*comprehensive/);
});

test("renders deterministically", () => {
  const fixture = indexFixture();
  assert.equal(render(fixture), render(fixture));
});

test("rejects duplicate ids", () => {
  const fixture = indexFixture();
  fixture.reports[1].id = "comprehensive";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /id 重复/);
});

test("rejects multiple authoritative reports", () => {
  const fixture = indexFixture();
  fixture.reports[1].role = "authoritative";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /只能有一份 authoritative/);
});

test("rejects unknown superseded target", () => {
  const fixture = indexFixture();
  fixture.reports[1].supersededBy = "missing";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /未知 supersededBy/);
});

test("rejects paths outside current directory", () => {
  const fixture = indexFixture();
  fixture.reports[0].path = "../outside.md";
  fixture.authoritativeReport = "../outside.md";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /只能指向 current/);
});

test("rejects missing claim inference", () => {
  const fixture = indexFixture();
  delete fixture.claims[0].inference;
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /缺少 inference/);
});

test("rejects missing claim evidence", () => {
  const fixture = indexFixture();
  fixture.claims[0].evidence = [];
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /必须至少关联一项事实证据/);
});

test("rejects evidence outside assets", () => {
  const fixture = indexFixture();
  fixture.claims[0].evidence[0].path = "../secret.json";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /必须位于 assets/);
});

test("rejects unknown evidence kind", () => {
  const fixture = indexFixture();
  fixture.claims[0].evidence[0].kind = "guess";
  assert.throws(() => validateVerificationIndex(fixture, ".", { requireFiles: false }), /证据 kind 无效/);
});

test("does not guess status when the index is missing", () => {
  const content = renderVerificationOverview({
    index: null,
    evidence: { files: 0, bytes: 0, formattedBytes: "0 B" },
    archives: [],
    unindexedReports: ["legacy.md"],
  });
  assert.match(content, /\*\*未知\*\*/);
  assert.match(content, /不会再根据文件修改时间或正文关键词猜测/);
  assert.doesNotMatch(content, /\*\*部分完成\*\*/);
});
