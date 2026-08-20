import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../../extension/lptff-investment-assistant/source-capture.js";
import "../../extension/lptff-investment-assistant/public-fund-metadata.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] || path.join(root, "project-support/fixtures/investment/eastmoney-source-desensitized.json");

if (!inputPath) {
  console.error(
    "用法: node project-support/scripts/investment/desensitize-source.js <真实采集包路径> [输出路径]",
  );
  console.error("只掩盖个人账户/银行卡/交易追踪标识，其余字段保留真实值。原始采集包应放在仓库之外。");
  process.exit(1);
}

const validator = globalThis.LPTFFSourceCapture;
if (!validator?.desensitizeSource) throw new Error("来源采集脱敏器未加载");
const metadata = globalThis.LPTFFPublicFundMetadata;
if (!metadata?.enrichCapture) throw new Error("公开基金元数据升级器未加载");

const raw = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
const output = validator.desensitizeSource(metadata.enrichCapture(raw));

const text = JSON.stringify(output);
const residual = [];
const hex32 = text.match(/\b[0-9a-f]{32}\b/g) || [];
if (hex32.length) residual.push(`残留 32 位交易/追踪 ID ${hex32.length} 个`);
const bankTail = text.match(/\|\s*\d{4,}\b/g) || [];
if (bankTail.length) residual.push(`残留银行卡尾号 ${bankTail.length} 处`);

if (residual.length) {
  console.error("脱敏自检失败：");
  residual.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(output, null, 2)}\n`, "utf8");
const bytes = fs.statSync(path.resolve(outputPath)).size;
console.log(`已生成法律脱敏快照：${outputPath}`);
console.log(`  ${bytes} bytes，仅掩盖个人账户/银行卡/交易追踪标识，其余字段保留真实值。`);
