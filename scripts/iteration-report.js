#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const logPath = resolve(root, ".claude", "iteration-log.md");
const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");
const summaryIndex = args.indexOf("--summary");
const summary = summaryIndex >= 0 ? args.slice(summaryIndex + 1).join(" ").trim() : "";

function git(...gitArgs) {
  try {
    return execFileSync("git", gitArgs, { cwd: root, encoding: "utf8" });
  } catch (error) {
    console.error(`无法读取 Git 信息：${error.message}`);
    process.exit(1);
  }
}

function changedFiles() {
  const files = new Set();
  const status = git("status", "--short");

  for (const line of status.split(/\r?\n/).filter(Boolean)) {
    const path = line.slice(3).trim();
    if (path.includes(" -> ")) {
      files.add(path.split(" -> ").at(-1));
    } else if (path) {
      files.add(path);
    }
  }

  return [...files].sort();
}

function validationLines() {
  const files = changedFiles();
  const checks = [];
  if (files.length) checks.push("已由 `iteration:report` 读取当前 Git 工作区变更");
  checks.push("请补充本轮实际运行的构建、测试或浏览器验证结果");
  return checks;
}

const files = changedFiles();
const date = new Date().toISOString().slice(0, 10);
const title = summary || "本轮迭代记录（请补充摘要）";
const entry = [
  `## ${date} — ${title}`,
  "",
  `- 范围：${summary || "请补充本轮变更范围；脚本不会根据文件名推断业务事实。"}`,
  "- 证据/决策：请补充已确认的原因、方案和有意未修改的范围。",
  `- 文件：${files.length ? files.map((file) => `\`${file}\``).join("、") : "当前工作区没有可识别的变更文件。"}。`,
  `- 验证：${validationLines().join("；")}。`,
  "- 未解决问题：无（如有未决兼容性、部署或后续规划，请在这里补充）。",
  "",
].join("\n");

if (!shouldWrite) {
  console.log(entry);
  console.log("提示：确认并补充内容后，使用 `npm run iteration:report -- --write --summary \"本轮摘要\"` 追加到迭代日志。");
  process.exit(0);
}

const existing = readFileSync(logPath, "utf8");
const separator = existing.endsWith("\n") ? "\n" : "\n\n";
appendFileSync(logPath, `${separator}${entry}`, "utf8");
console.log(`已追加迭代日志草稿：${logPath}`);
console.log("请人工补充“证据/决策”和“验证”中的占位内容，避免把推断写成项目事实。");
