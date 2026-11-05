import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const releaseInputs = [
  "extension/", ":(exclude)extension/build-info.js", "scripts/extension/",
  "scripts/generate-build-tags.mjs", "scripts/lib/build-tags.mjs",
  "package.json", "package-lock.json", ".github/workflows/code-deployment.yml",
];

export function needsExtensionRelease(release, cwd = projectRoot) {
  const commit = typeof release?.body === "string" ? release.body.match(/\bcommit ([0-9a-f]{40})\b/)?.[1] : undefined;
  const hasAsset = Array.isArray(release?.assets) && release.assets.some((asset) =>
    asset?.name === "lptff-investment-assistant.zip" && asset.state === "uploaded");
  // Missing metadata, asset or Git history must never silently skip a release.
  if (!commit || !hasAsset) return true;
  try {
    const options = { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10000 };
    execFileSync("git", ["cat-file", "-e", `${commit}^{commit}`], options);
    return Boolean(execFileSync("git", ["diff", "--name-only", commit, "HEAD", "--", ...releaseInputs], options).trim());
  } catch {
    return true;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const needed = needsExtensionRelease(JSON.parse(fs.readFileSync(0, "utf8")));
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `needed=${needed}\n`);
  console.log(needed ? "扩展或打包输入变化，需要发布" : "扩展发布输入未变，复用现有 Release");
}
