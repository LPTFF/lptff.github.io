import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "../..");
// 勿放在 /data 下：vite dev 会把 /data 代理到远程，导致 fetch 500
const outDir = path.join(root, "project-support", "public", "findJob-summary");

const files = [
  {
    from: path.join(root, "src", "content", "interview", "full.md"),
    to: path.join(outDir, "full.md"),
  },
  {
    from: path.join(root, "src", "content", "interview", "chain.md"),
    to: path.join(outDir, "chain.md"),
  },
];

fs.mkdirSync(outDir, { recursive: true });

files.forEach(({ from, to }) => {
  if (!fs.existsSync(from)) {
    console.error(`[sync-findJob-summary] 源文件不存在: ${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
  console.log(
    `[sync-findJob-summary] ${path.basename(from)} -> project-support/public/findJob-summary/${path.basename(to)}`
  );
});