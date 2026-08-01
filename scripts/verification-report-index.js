import { existsSync, readFileSync } from "node:fs";
import { basename, relative, resolve, sep } from "node:path";

export const REPORT_ROLES = new Set(["authoritative", "supporting", "superseded-in-part"]);
export const REPORT_STATUSES = new Set(["complete", "partial", "blocked", "unknown"]);
export const EVIDENCE_KINDS = new Set([
  "screenshot",
  "browser",
  "network",
  "collector",
  "artifact",
  "source",
  "ci",
]);

export const STATUS_LABELS = {
  complete: "完成",
  partial: "部分完成",
  blocked: "阻断",
  unknown: "未知",
};

function assert(condition, message) {
  if (!condition) throw new Error(`验证报告索引无效：${message}`);
}

function validateItemGroup(group, name) {
  assert(Array.isArray(group), `openItems.${name} 必须是数组`);
  const ids = new Set();
  for (const item of group) {
    assert(item && typeof item === "object" && !Array.isArray(item), `openItems.${name} 的条目必须是对象`);
    assert(typeof item.id === "string" && item.id.trim(), `openItems.${name} 的条目缺少 id`);
    assert(typeof item.title === "string" && item.title.trim(), `openItems.${name}.${item.id} 缺少 title`);
    assert(!ids.has(item.id), `openItems.${name} 存在重复 id：${item.id}`);
    ids.add(item.id);
  }
}

function resolveReportPath(currentDirectory, reportPath) {
  assert(typeof reportPath === "string" && reportPath.endsWith(".md"), `报告路径必须是 Markdown：${reportPath}`);
  assert(basename(reportPath) === reportPath, `报告路径只能指向 current/ 直属文件：${reportPath}`);
  const resolved = resolve(currentDirectory, reportPath);
  const prefix = `${resolve(currentDirectory)}${sep}`;
  assert(resolved.startsWith(prefix), `报告路径越界：${reportPath}`);
  return resolved;
}

function resolveEvidencePath(currentDirectory, evidencePath) {
  assert(typeof evidencePath === "string" && evidencePath.startsWith("assets/"), `证据路径必须位于 assets/：${evidencePath}`);
  assert(!evidencePath.includes("\\"), `证据路径必须使用正斜杠：${evidencePath}`);
  const resolved = resolve(currentDirectory, evidencePath);
  const prefix = `${resolve(currentDirectory, "assets")}${sep}`;
  assert(resolved.startsWith(prefix), `证据路径越界：${evidencePath}`);
  return resolved;
}

function validateEvidence(evidence, claimId, currentDirectory, requireFiles) {
  assert(Array.isArray(evidence) && evidence.length > 0, `关键结论 ${claimId} 必须至少关联一项事实证据`);
  const paths = new Set();
  for (const item of evidence) {
    assert(item && typeof item === "object" && !Array.isArray(item), `关键结论 ${claimId} 的 evidence 条目必须是对象`);
    assert(typeof item.label === "string" && item.label.trim(), `关键结论 ${claimId} 存在无 label 的证据`);
    assert(EVIDENCE_KINDS.has(item.kind), `关键结论 ${claimId} 的证据 kind 无效：${item.kind}`);
    const resolved = resolveEvidencePath(currentDirectory, item.path);
    assert(!paths.has(item.path), `关键结论 ${claimId} 存在重复证据路径：${item.path}`);
    paths.add(item.path);
    if (requireFiles) assert(existsSync(resolved), `关键结论 ${claimId} 的证据文件不存在：${item.path}`);
  }
}

function validateClaims(claims, currentDirectory, requireFiles) {
  assert(Array.isArray(claims) && claims.length > 0, "claims 必须是非空数组");
  const ids = new Set();
  for (const claim of claims) {
    assert(claim && typeof claim === "object" && !Array.isArray(claim), "claims 条目必须是对象");
    assert(typeof claim.id === "string" && claim.id.trim(), "关键结论缺少 id");
    assert(!ids.has(claim.id), `关键结论 id 重复：${claim.id}`);
    ids.add(claim.id);
    assert(typeof claim.title === "string" && claim.title.trim(), `关键结论 ${claim.id} 缺少 title`);
    assert(["proved", "partial", "blocked"].includes(claim.status), `关键结论 ${claim.id} 的 status 无效：${claim.status}`);
    assert(typeof claim.inference === "string" && claim.inference.trim(), `关键结论 ${claim.id} 缺少 inference`);
    assert(typeof claim.conclusion === "string" && claim.conclusion.trim(), `关键结论 ${claim.id} 缺少 conclusion`);
    validateEvidence(claim.evidence, claim.id, currentDirectory, requireFiles);
  }
}

export function validateVerificationIndex(index, currentDirectory, { requireFiles = true } = {}) {
  assert(index && typeof index === "object" && !Array.isArray(index), "根节点必须是对象");
  assert(index.schemaVersion === 1, "schemaVersion 必须为 1");
  assert(typeof index.verifiedAt === "string" && !Number.isNaN(Date.parse(index.verifiedAt)), "verifiedAt 必须是 ISO 日期");
  assert(typeof index.authoritativeReport === "string", "缺少 authoritativeReport");
  assert(Array.isArray(index.reports) && index.reports.length > 0, "reports 必须是非空数组");

  const ids = new Set();
  const reportPaths = new Set();
  for (const report of index.reports) {
    assert(report && typeof report === "object" && !Array.isArray(report), "reports 条目必须是对象");
    assert(typeof report.id === "string" && report.id.trim(), "报告缺少 id");
    assert(!ids.has(report.id), `报告 id 重复：${report.id}`);
    ids.add(report.id);
    assert(typeof report.title === "string" && report.title.trim(), `报告 ${report.id} 缺少 title`);
    assert(REPORT_ROLES.has(report.role), `报告 ${report.id} 的 role 无效：${report.role}`);
    assert(REPORT_STATUSES.has(report.status), `报告 ${report.id} 的 status 无效：${report.status}`);
    const resolved = resolveReportPath(currentDirectory, report.path);
    assert(!reportPaths.has(report.path), `报告路径重复：${report.path}`);
    reportPaths.add(report.path);
    if (requireFiles) assert(existsSync(resolved), `报告文件不存在：${report.path}`);
    if (report.supersededBy !== undefined) {
      assert(typeof report.supersededBy === "string" && report.supersededBy, `报告 ${report.id} 的 supersededBy 无效`);
    }
  }

  const authoritative = index.reports.filter((report) => report.role === "authoritative");
  assert(authoritative.length === 1, "必须且只能有一份 authoritative 报告");
  assert(authoritative[0].path === index.authoritativeReport, "authoritativeReport 与 authoritative 条目不一致");
  for (const report of index.reports) {
    if (report.supersededBy !== undefined) {
      assert(ids.has(report.supersededBy), `报告 ${report.id} 指向未知 supersededBy：${report.supersededBy}`);
      assert(report.supersededBy !== report.id, `报告 ${report.id} 不能取代自身`);
    }
  }

  assert(index.openItems && typeof index.openItems === "object", "缺少 openItems");
  for (const name of ["product", "verification", "external"]) {
    validateItemGroup(index.openItems[name], name);
  }
  validateClaims(index.claims, currentDirectory, requireFiles);

  return {
    ...index,
    authoritative: authoritative[0],
  };
}

export function loadVerificationIndex(currentDirectory, options) {
  const indexPath = resolve(currentDirectory, "index.json");
  if (!existsSync(indexPath)) return null;
  let index;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8"));
  } catch (error) {
    throw new Error(`无法解析验证报告索引 ${relative(process.cwd(), indexPath)}：${error.message}`);
  }
  return validateVerificationIndex(index, currentDirectory, options);
}

function reportRows(reports) {
  if (!reports.length) return ["| — | — | — | — |"];
  return reports.map((report) => {
    const relation = report.role === "superseded-in-part"
      ? `部分被 [${report.supersededBy}](#报告关系) 取代${report.note ? `：${report.note}` : ""}`
      : report.note || "—";
    return `| [${report.title}](current/${report.path}) | ${STATUS_LABELS[report.status]} | ${report.role} | ${relation} |`;
  });
}

function claimLink(item, claimIds) {
  const suffix = claimIds.has(item.id) ? `（[查看推导与证据](#claim-${item.id.toLowerCase()})）` : "";
  return `- **${item.id}**：${item.title}${suffix}`;
}

function openItemLines(items, claimIds) {
  return items.length ? items.map((item) => claimLink(item, claimIds)) : ["- 无。"];
}

function evidenceLinks(evidence) {
  return evidence.map((item) => `[${item.label}](current/${item.path})`).join("；");
}

function claimLines(claims) {
  const labels = { proved: "已证明", partial: "部分证明", blocked: "阻断" };
  return claims.map((claim) => [
    `<a id="claim-${claim.id.toLowerCase()}"></a>`,
    `### ${claim.id}｜${labels[claim.status]}`,
    "",
    `- **事实观察**：${claim.inference}`,
    `- **推导结论**：${claim.conclusion}`,
    `- **事实依据**：${evidenceLinks(claim.evidence)}`,
    "",
  ].join("\n"));
}

export function renderVerificationOverview({ index, evidence, archives, unindexedReports = [] }) {
  if (!index) {
    return `${[
      "<!-- 由 npm run verification:refresh 自动生成，请勿手工编辑。 -->",
      "# 当前验证总览",
      "",
      "## 当前结论",
      "",
      "- **未知**：尚未建立 `current/index.json` 权威索引；不会再根据文件修改时间或正文关键词猜测业务状态。",
      "",
      "## 未索引报告",
      "",
      ...(unindexedReports.length ? unindexedReports.map((path) => `- [${path}](current/${path})`) : ["- 无。"]),
      "",
      "## 维护规则",
      "",
      "- 新报告和证据继续写入 `current/` 与 `current/assets/`；建立显式索引后再发布权威结论。",
    ].join("\n")}\n`;
  }

  const supportingReports = index.reports.filter((report) => report.role !== "authoritative");
  const superseded = index.reports.filter((report) => report.role === "superseded-in-part");
  const claimIds = new Set(index.claims.map((claim) => claim.id));
  const lines = [
    "<!-- 由 npm run verification:refresh 自动生成，请勿手工编辑。 -->",
    "# 当前验证总览",
    "",
    `核验时间：${index.verifiedAt}`,
    "",
    "## 当前权威结论",
    "",
    `- **${STATUS_LABELS[index.authoritative.status]}**：[${index.authoritative.title}](current/${index.authoritative.path})`,
    "- 状态来自显式索引；下列关键结论直接链接到采集结果、接口/网络响应、浏览器指标和真实截图，不由文件修改时间或正文关键词推断。",
    "",
    "## 关键结论与事实依据",
    "",
    ...claimLines(index.claims),
    "",
    "## 未解决产品任务",
    "",
    ...openItemLines(index.openItems.product, claimIds),
    "",
    "## 未完成验证",
    "",
    ...openItemLines(index.openItems.verification, claimIds),
    "",
    "## 外部与授权边界",
    "",
    ...openItemLines(index.openItems.external, claimIds),
    "",
    "## 当前报告",
    "",
    "| 报告 | 状态 | 角色 | 关系/说明 |",
    "|---|---|---|---|",
    ...reportRows(index.reports),
    "",
    "## 报告关系",
    "",
    ...(superseded.length
      ? superseded.map((report) => `- **${report.id}** → **${report.supersededBy}**：${report.note || "部分结论已被后续事实取代。"}`)
      : ["- 当前没有被取代的报告结论。"]),
    "",
    "## 当前证据",
    "",
    `- 文件：${evidence.files} 个`,
    `- 大小：${evidence.formattedBytes}`,
    "- 目录：[current/assets/](current/assets/)",
    "",
    "## 历史归档",
    "",
    "| 日期 | 文件 | 大小 |",
    "|---|---:|---:|",
    ...(archives.length ? archives.map((archive) => `| ${archive.date} | ${archive.files} | ${archive.formattedBytes} |`) : ["| — | 0 | 0 B |"]),
    "",
    "## 维护规则",
    "",
    "- `current/index.json` 显式指定权威、支持和部分被取代报告，并要求每项关键结论关联至少一份存在于 `current/assets/` 的事实证据；生成器会拒绝无效索引或失效证据链接。",
    "- 新报告写入 `current/`，关联截图、DOM、日志和机器摘要写入 `current/assets/`。",
    "- 每次运行 `npm run context:check` 或 `npm run verification:refresh` 会刷新本文件。",
    "- 已结束批次按日期移动到 `archive/YYYY-MM-DD/`；归档用于追溯，不参与当前结论。",
  ];

  return `${lines.join("\n")}\n`;
}
