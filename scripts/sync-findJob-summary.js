const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
// 勿放在 /data 下：vite dev 会把 /data 代理到远程，导致 fetch 500
const outDir = path.join(root, "public", "findJob-summary");

const files = [
  {
    from: path.join(root, "src", "views", "home", "findJob", "前端八股文汇总背诵版.md"),
    to: path.join(outDir, "full.md"),
  },
  {
    from: path.join(
      root,
      "src",
      "views",
      "home",
      "findJobPlus",
      "前端八股文汇总背诵版-项目串联高级版.md"
    ),
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
    `[sync-findJob-summary] ${path.basename(from)} -> public/findJob-summary/${path.basename(to)}`
  );
});
