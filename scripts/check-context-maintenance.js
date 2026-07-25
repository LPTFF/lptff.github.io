#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contextFiles = [".claude/project-context.md", ".claude/iteration-log.md"];
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
const maintenanceFiles = new Set(contextFiles);
const durablePatterns = [
  /^(package\.json|package-lock\.json)$/,
  /^(vite\.config\.(js|ts)|tsconfig[^/]*\.json)$/,
  /^(scripts|\.github\/workflows|src\/router)(\/|$)/,
  /^(src\/public\/data|public\/findJob-summary)(\/|$)/,
  /^(AGENTS\.md|CLAUDE\.md|README\.md|\.opencode\/)/,
];
const durableChanges = files.filter((file) => durablePatterns.some((pattern) => pattern.test(file)));
const changedMaintenance = files.filter((file) => maintenanceFiles.has(file));
const missing = contextFiles.filter((file) => !changedMaintenance.includes(file));

if (!files.length) {
  console.log("context:check：当前没有可检查的变更。");
  process.exit(0);
}

console.log(`context:check：检查 ${stagedOnly ? "暂存区" : "工作区"} 的 ${files.length} 个变更文件。`);
if (!durableChanges.length) {
  console.log("context:check：未发现需要持久化项目事实的高影响路径；无需强制更新上下文文档。");
  process.exit(0);
}

console.log(`context:check：发现高影响变更：${durableChanges.join("、")}`);
if (!missing.length) {
  console.log("context:check：project-context 和 iteration-log 均已包含在本轮变更中。");
  process.exit(0);
}

console.error(`context:check：缺少协作文档更新：${missing.join("、")}`);
console.error("先运行 `npm run iteration:report` 预览日志草稿，再按需使用 `--write`，并人工更新 project-context。");
process.exit(1);
