#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const stagedOnly = args.includes("--staged");
const diffArgs = stagedOnly ? ["diff", "--cached", "--name-only"] : ["status", "--short"];

function git(...gitArgs) {
  try {
    return execFileSync("git", gitArgs, { cwd: root, encoding: "utf8" });
  } catch (error) {
    console.error(`无法读取 Git 信息：${error.message}`);
    process.exit(1);
  }
}

function refreshVerificationReports() {
  const script = resolve(import.meta.dirname, "refresh-verification-reports.js");
  try {
    execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    console.error(`无法刷新验证报告总览：${error.message}`);
    process.exit(1);
  }
}

function changedFiles() {
  const output = git(...diffArgs);
  if (!output.trim()) return [];
  if (stagedOnly) return output.split(/\r?\n/).filter(Boolean);
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().split(" -> ").at(-1))
    .filter(Boolean);
}

const files = changedFiles();
const projectContextFile = ".claude/project-context.md";
const iterationLogFile = ".claude/iteration-log.md";
const durablePatterns = [
  /^(package\.json|package-lock\.json)$/,
  /^(vite\.config\.(js|ts)|tsconfig[^/]*\.json)$/,
  /^(scripts|\.github\/workflows|src\/router)(\/|$)/,
  /^(src\/public\/data|public\/findJob-summary)(\/|$)/,
  /^(AGENTS\.md|CLAUDE\.md|README\.md|\.opencode\/)/,
];
const iterationPatterns = [
  /^(src\/|scripts\/|docs\/|public\/|AGENTS\.md|CLAUDE\.md|README\.md|\.opencode\/)/,
  /^(package\.json|package-lock\.json|vite\.config\.(js|ts)|tsconfig[^/]*\.json|\.github\/)/,
];
const iterationChanges = files.filter((file) => iterationPatterns.some((pattern) => pattern.test(file)));
const durableChanges = files.filter((file) => durablePatterns.some((pattern) => pattern.test(file)));
const changedProjectContext = files.includes(projectContextFile);
const changedIterationLog = files.includes(iterationLogFile);
const verificationPatterns = [
  /^(src\/crawl|scripts\/collectors)(\/|$)/,
  /^(src\/views|src\/router)(\/|$)/,
  /^(build\.sh|vite\.config\.(js|ts)|\.github\/workflows)(\/|$)/,
];
const verificationChanges = files.filter((file) =>
  verificationPatterns.some((pattern) => pattern.test(file)),
);
const reportDirectory = resolve(root, "docs/verification-reports");
const requiredReportSections = [
  "基线",
  "工具与启动条件",
  "产物校验",
  "页面、网络与控制台",
  "失败与跳过",
  "剩余风险",
];

function verificationReportStatus() {
  if (!existsSync(reportDirectory)) return { found: false, missing: requiredReportSections };
  const currentDirectory = resolve(reportDirectory, "current");
  const candidateDirectory = existsSync(currentDirectory) ? currentDirectory : reportDirectory;
  const reports = readdirSync(candidateDirectory)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .reverse();
  for (const report of reports) {
    const content = readFileSync(resolve(candidateDirectory, report), "utf8");
    const missing = requiredReportSections.filter((section) => !content.includes(section));
    if (!missing.length) {
      return { found: true, report: relative(root, resolve(candidateDirectory, report)), missing: [] };
    }
  }
  return { found: false, missing: requiredReportSections };
}

refreshVerificationReports();

if (!files.length) {
  console.log("context:check：当前没有可检查的变更。");
  process.exit(0);
}

console.log(`context:check：检查 ${stagedOnly ? "暂存区" : "工作区"} 的 ${files.length} 个变更文件。`);
if (verificationChanges.length) {
  const reportStatus = verificationReportStatus();
  console.log(`context:check：发现需要可信事实链的高影响变更：${verificationChanges.join("、")}`);
  if (reportStatus.found) {
    console.log(`context:check：发现包含必需章节的本地验证报告 ${reportStatus.report}。`);
    console.log("context:check：此检查只确认报告结构，不判断采集、页面或部署业务结果是否正确。");
  } else {
    console.error("context:check：未发现包含必需章节的本地可信验证报告。");
    console.error(`报告至少需要：${reportStatus.missing.join("、")}。报告目录应继续被 Git 忽略。`);
    process.exit(1);
  }
}
if (!iterationChanges.length) {
  console.log("context:check：未发现需要迭代记录的变更路径。无需补充生命周期记录。");
  process.exit(0);
}

if (!changedIterationLog) {
  console.error("context:check：发现需要迭代记录的变更，但本轮未更新 .claude/iteration-log.md。");
  console.error("先运行 `npm run iteration:report` 预览日志草稿，再按需使用 `--write` 并人工补充基线、偏离、验证和风险责任。");
  process.exit(1);
}

if (!durableChanges.length) {
  console.log("context:check：已更新 iteration-log；本轮没有需要持久化到 project-context 的长期事实变更。");
  process.exit(0);
}

console.log(`context:check：发现可能影响长期项目事实的变更：${durableChanges.join("、")}`);
if (!changedProjectContext) {
  console.log("context:check：未更新 project-context；请确认本轮是否改变架构、命令、依赖、生成链、验证基线或长期决策。若没有，保持不变即可。");
  process.exit(0);
}

console.log("context:check：project-context 和 iteration-log 均已包含在本轮变更中。");