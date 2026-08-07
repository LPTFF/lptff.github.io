#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const logPath = resolve(root, "agent", "context", "iteration-log.md");
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

const files = changedFiles();
const date = new Date().toISOString().slice(0, 10);
const title = summary || "本轮迭代记录（请补充摘要）";
const entry = [
  `## ${date} — ${title}`,
  "",
  `- 任务基线：${summary || "请补充本轮目标、依据的已确认事实、明确不做什么和完成条件。"}`,
  "- 实际变更/偏离控制：请补充实际变更；如偏离任务基线，说明触发证据、影响范围和确认状态。",
  `- 文件：${files.length ? files.map((file) => `\`${file}\``).join("、") : "当前工作区没有可识别的变更文件。"}。`,
  "- 验证证据：请补充已运行什么、证明了什么、跳过了什么、仍不能证明什么。",
  "- 剩余风险/责任人：请确认并填写“无（已核验）”，或列出风险、影响、责任人和后续动作。",
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
console.log("请人工补充任务基线、偏离控制、验证证据和剩余风险/责任人，避免把推断写成项目事实。");
