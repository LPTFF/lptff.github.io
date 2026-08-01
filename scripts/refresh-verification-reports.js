#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reportsRoot = resolve(root, "docs/verification-reports");
const currentReports = resolve(reportsRoot, "current");
const currentEvidence = resolve(currentReports, "assets");
const archiveRoot = resolve(reportsRoot, "archive");
const indexFile = resolve(reportsRoot, "latest.md");

function filesIn(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleAndStatus(path) {
  const content = readFileSync(path, "utf8");
  const title = content.match(/^#\s+(.+)$/m)?.[1] ?? path.split(/[\\/]/).at(-1);
  const status =
    content.includes("## 已证明、部分证明与未证明") || content.includes("## 剩余风险")
      ? "部分完成"
      : "待人工标注";
  return { title, status };
}

function archiveSummaries() {
  if (!existsSync(archiveRoot)) return [];
  return readdirSync(archiveRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = resolve(archiveRoot, entry.name);
      const files = filesIn(directory);
      return {
        date: entry.name,
        files: files.length,
        bytes: files.reduce((total, path) => total + statSync(path).size, 0),
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

if (!existsSync(reportsRoot)) {
  process.exit(0);
}

mkdirSync(currentReports, { recursive: true });
mkdirSync(currentEvidence, { recursive: true });
mkdirSync(archiveRoot, { recursive: true });

const reports = filesIn(currentReports)
  .filter((path) => path.endsWith(".md"))
  .map((path) => ({ path, modified: statSync(path).mtime, ...titleAndStatus(path) }))
  .sort((left, right) => right.modified - left.modified);
const evidence = filesIn(currentEvidence);
const evidenceBytes = evidence.reduce((total, path) => total + statSync(path).size, 0);
const latest = reports.at(0);
const timestamp = new Date().toLocaleString("zh-CN", { hour12: false });

const lines = [
  "<!-- 由 npm run verification:refresh 自动生成，请勿手工编辑。 -->",
  "# 当前验证总览",
  "",
  `更新时间：${timestamp}`,
  "",
  "## 最新结论",
  latest
    ? `- **${latest.status}**：[\`${latest.title}\`](${relative(reportsRoot, latest.path).replaceAll("\\", "/")})`
    : "- 尚无当前验证报告。",
  "",
  "## 当前报告",
  "| 报告 | 状态 | 最后修改 |",
  "|---|---|---|",
  ...reports.map(
    (report) =>
      `| [${report.title}](${relative(reportsRoot, report.path).replaceAll("\\", "/")}) | ${report.status} | ${report.modified.toLocaleString("zh-CN", { hour12: false })} |`,
  ),
  "",
  "## 当前证据",
  `- 文件：${evidence.length} 个`,
  `- 大小：${formatBytes(evidenceBytes)}`,
  `- 目录：[current/assets/](current/assets/)`,
  "",
  "## 历史归档",
  "| 日期 | 文件 | 大小 |",
  "|---|---:|---:|",
  ...archiveSummaries().map((archive) => `| ${archive.date} | ${archive.files} | ${formatBytes(archive.bytes)} |`),
  "",
  "## 维护规则",
  "- 新报告写入 `current/`，关联截图、DOM、日志和机器摘要写入 `current/assets/`。",
  "- 每次运行 `npm run context:check` 或 `npm run verification:refresh` 会刷新本文件。",
  "- 已结束批次按日期移动到 `archive/YYYY-MM-DD/`；归档用于追溯，不参与当前结论。",
];

writeFileSync(indexFile, `${lines.join("\n")}\n`, "utf8");
console.log(`verification:refresh：已刷新 docs/verification-reports/latest.md（${reports.length} 份当前报告，${evidence.length} 个当前证据）。`);
