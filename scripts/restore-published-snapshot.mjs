#!/usr/bin/env node
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const targetDir = path.resolve(repoRoot, ".local/published-data");

function parseArgs() {
  const args = process.argv.slice(2);
  let ref = process.env.DATA_REF || "origin/python-crawl";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ref" && args[i + 1]) {
      ref = args[i + 1];
      i++;
    } else if (args[i].startsWith("--ref=")) {
      ref = args[i].slice("--ref=".length);
    }
  }
  if (ref === "python-crawl") {
    ref = "origin/python-crawl";
  }
  return { ref };
}

function validateRef(ref) {
  if (ref === "origin/python-crawl") return true;
  if (/^[0-9a-f]{40}$/i.test(ref)) return true;
  return false;
}

function runGit(cmdArgs, options = {}) {
  return execFileSync("git", cmdArgs, {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    ...options,
  }).trim();
}

async function main() {
  const rename = async (from, to) => {
    for (let attempt = 0; ; attempt++) {
      try { fs.renameSync(from, to); return; }
      catch (error) {
        if (attempt >= 9 || !["EPERM", "EBUSY", "EACCES"].includes(error.code)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  };
  const { ref } = parseArgs();
  console.log(`[restore-published-snapshot] 开始从 ${ref} 恢复发布快照...`);

  if (!validateRef(ref)) {
    console.error(`[restore-published-snapshot] ❌ 无效的数据引用: "${ref}"。仅允许 "origin/python-crawl" 或 40 位 SHA。`);
    process.exit(1);
  }

  let sha = "";
  try {
    if (ref === "origin/python-crawl") {
      console.log(`[restore-published-snapshot] 正在从远程拉取 origin/python-crawl 最新快照...`);
      runGit(["fetch", "--depth=1", "origin", "python-crawl"]);
      sha = runGit(["rev-parse", "FETCH_HEAD"]);
    } else {
      console.log(`[restore-published-snapshot] 正在验证指定 SHA: ${ref}...`);
      try {
        sha = runGit(["rev-parse", "--verify", `${ref}^{commit}`]);
      } catch {
        console.log(`[restore-published-snapshot] 本地未找到该提交，尝试从远程 fetch...`);
        runGit(["fetch", "--depth=1", "origin", ref]);
        sha = runGit(["rev-parse", "FETCH_HEAD"]);
      }
    }
  } catch (error) {
    console.error(`[restore-published-snapshot] ❌ 获取发布快照失败: ${error.message}`);
    process.exit(1);
  }

  if (!sha || sha.length !== 40) {
    console.error(`[restore-published-snapshot] ❌ 解析提交 SHA 失败: "${sha}"`);
    process.exit(1);
  }

  const commitDate = runGit(["log", "-1", "--format=%cI", sha]);
  console.log(`[restore-published-snapshot] 确认快照版本: ${sha} (${commitDate})`);

  // 严格验证提交内容：只允许纯数据发布快照，禁止解包代码或工程仓库内容
  const rootEntries = runGit(["ls-tree", "--name-only", sha]).split(/\r?\n/).filter(Boolean);
  if (rootEntries.includes("package.json") || rootEntries.includes("src") || rootEntries.includes(".git")) {
    console.error(`[restore-published-snapshot] ❌ 拒绝提取：提交 ${sha} 包含代码工程结构，并非纯数据分支 (python-crawl)！`);
    process.exit(1);
  }

  const entries = runGit(["ls-tree", "-r", sha]).split(/\r?\n/).filter(Boolean);
  if (entries.some((line) => !/^100644 blob [a-f0-9]{40}\t[a-zA-Z0-9_/-]+\.json$/.test(line))) {
    throw new Error("快照只能包含普通 JSON 文件");
  }
  const localDir = path.dirname(targetDir);
  fs.mkdirSync(localDir, { recursive: true });
  if (fs.lstatSync(localDir).isSymbolicLink() || (fs.existsSync(targetDir) && fs.lstatSync(targetDir).isSymbolicLink())) throw new Error("拒绝链接快照目录");
  const stagingDir = fs.mkdtempSync(path.join(localDir, "published-staging-"));

  // 使用 git archive 管道解压至 .local/published-data
  await new Promise((resolve, reject) => {
    const gitProc = spawn("git", ["archive", "--format=tar", sha], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const tarProc = spawn("tar", ["-xf", "-", "-C", stagingDir], {
      cwd: repoRoot,
      stdio: ["pipe", "ignore", "pipe"],
    });

    let gitErr = "";
    let tarErr = "";
    gitProc.stderr.on("data", (d) => { gitErr += d.toString(); });
    tarProc.stderr.on("data", (d) => { tarErr += d.toString(); });

    gitProc.stdout.pipe(tarProc.stdin);
    const timeout = setTimeout(() => { gitProc.kill(); tarProc.kill(); reject(new Error("快照解包超时")); }, 60000);
    gitProc.on("error", (error) => { clearTimeout(timeout); tarProc.kill(); reject(error); });
    tarProc.on("error", (error) => { clearTimeout(timeout); gitProc.kill(); reject(error); });
    tarProc.stdin.on("error", (error) => { clearTimeout(timeout); gitProc.kill(); reject(error); });

    let finishedCount = 0;
    const checkDone = () => {
      finishedCount++;
      if (finishedCount === 2) { clearTimeout(timeout); resolve(); }
    };

    gitProc.on("close", (code) => {
      if (code !== 0) { clearTimeout(timeout); tarProc.kill(); reject(new Error(`git archive 失败 (code ${code}): ${gitErr}`)); }
      else checkDone();
    });

    tarProc.on("close", (code) => {
      if (code !== 0) { clearTimeout(timeout); gitProc.kill(); reject(new Error(`tar 解包失败 (code ${code}): ${tarErr}`)); }
      else checkDone();
    });
  });

  // 基础文件存在性与非空校验
  const requiredFiles = ["52pojie.json", "52pojie-ecosystem.json", "kanxue.json", "bilibili.json", "welfare.json", "welfare-ecosystem.json", "movie.json", "tiktok.json"];
  for (const rel of requiredFiles) {
    const filePath = path.join(stagingDir, rel);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      console.error(`[restore-published-snapshot] ❌ 快照损坏或缺少关键文件: ${rel}`);
      process.exit(1);
    }
  }
  for (const line of entries) JSON.parse(fs.readFileSync(path.join(stagingDir, line.split("\t")[1]), "utf8"));

  // 写入元数据
  const meta = {
    ref,
    sha,
    commitDate,
    restoredAt: new Date().toISOString(),
    source: "python-crawl",
  };
  fs.writeFileSync(
    path.join(stagingDir, "snapshot-meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
  const backup = path.join(localDir, `published-backup-${Date.now()}`);
  const hasPrevious = fs.existsSync(targetDir);
  if (hasPrevious) await rename(targetDir, backup);
  try { await rename(stagingDir, targetDir); }
  catch (error) { if (hasPrevious) await rename(backup, targetDir); throw error; }
  // Generated backup is retained for recovery; never delete the user's data files.

  console.log(`[restore-published-snapshot] ✅ 快照已成功恢复至 .local/published-data/ (SHA: ${sha})`);
}

main().catch((err) => {
  console.error(`[restore-published-snapshot] ❌ 执行异常:`, err);
  process.exit(1);
});
