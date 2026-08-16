// 同步真实脱敏快照到 vite publicDir，供前端 fetch 加载做产品功能审查。
// 源唯一存在于 project-support/fixtures/，public/ 下是构建副本，避免两份漂移。
// 在 `serve` / `build` 前由 npm 脚本串入，与 sync-findJob-summary.js 同款风格。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../fixtures/investment/eastmoney-source-desensitized.json");
const destDir = path.resolve(here, "../public/fixtures/investment");
const dest = path.join(destDir, "eastmoney-source-desensitized.json");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`[sync-investment-fixture] 已复制脱敏快照到 ${path.relative(process.cwd(), dest)}`);