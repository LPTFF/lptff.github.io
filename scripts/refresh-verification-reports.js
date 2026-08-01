#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadVerificationIndex, renderVerificationOverview } from "./verification-report-index.js";

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

function archiveSummaries() {
  if (!existsSync(archiveRoot)) return [];
  return readdirSync(archiveRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = resolve(archiveRoot, entry.name);
      const files = filesIn(directory);
      const bytes = files.reduce((total, path) => total + statSync(path).size, 0);
      return { date: entry.name, files: files.length, bytes, formattedBytes: formatBytes(bytes) };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

if (!existsSync(reportsRoot)) process.exit(0);

mkdirSync(currentReports, { recursive: true });
mkdirSync(currentEvidence, { recursive: true });
mkdirSync(archiveRoot, { recursive: true });

let index;
try {
  index = loadVerificationIndex(currentReports);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const reports = filesIn(currentReports)
  .filter((path) => path.endsWith(".md"))
  .map((path) => path.slice(currentReports.length + 1).replaceAll("\\", "/"))
  .sort();
const evidenceFiles = filesIn(currentEvidence);
const evidenceBytes = evidenceFiles.reduce((total, path) => total + statSync(path).size, 0);
const content = renderVerificationOverview({
  index,
  evidence: {
    files: evidenceFiles.length,
    bytes: evidenceBytes,
    formattedBytes: formatBytes(evidenceBytes),
  },
  archives: archiveSummaries(),
  unindexedReports: reports,
});

writeFileSync(indexFile, content, "utf8");
console.log(
  `verification:refresh：已刷新 docs/verification-reports/latest.md（${reports.length} 份当前报告，${evidenceFiles.length} 个当前证据${index ? "，使用显式权威索引" : "，未建立权威索引"}）。`,
);
