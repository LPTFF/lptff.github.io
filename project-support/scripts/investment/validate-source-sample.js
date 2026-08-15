import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../../extension/lptff-investment-assistant/source-capture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

const samplePath = path.resolve(
  process.argv[2] || path.join(root, "project-support/fixtures/investment/eastmoney-source-sample.json"),
);
const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
const validator = globalThis.LPTFFSourceCapture;

if (!validator) throw new Error("来源采集样本校验器未加载");

const validation = validator.validateDevelopmentSample(sample);
const errors = [...validation.errors];
const sampleCodes = new Set();
let representativeRecords = 0;

function visit(value, key = "", currentPath = "$") {
  if (Array.isArray(value)) {
    if (currentPath !== "$.sampleMeta.fieldInventory") representativeRecords += value.length;
    value.forEach((item, index) => visit(item, key, `${currentPath}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([name, item]) => visit(item, name, `${currentPath}.${name}`));
    return;
  }
  if (typeof value !== "string") return;

  const sixDigitCodes = value.match(/(?<!\d)\d{6}(?!\d)/g) || [];
  sixDigitCodes.forEach((code) => {
    if (!/^9000\d{2}$/.test(code)) errors.push(`${currentPath}: 非样本基金代码`);
    sampleCodes.add(code);
  });
  if (/url/i.test(key) && value !== "https://example.invalid/sample") {
    errors.push(`${currentPath}: 非样本 URL`);
  }
  const dateTokens = value.match(/20\d{2}[年./-]\d{1,2}(?:[月./-]\d{1,2}日?)?/g) || [];
  if (dateTokens.some((date) => date !== "2025-01-15")) {
    errors.push(`${currentPath}: 非固定样本日期`);
  }
}

visit(sample);

if (!Array.isArray(sample.sampleMeta?.fieldInventory) || !sample.sampleMeta.fieldInventory.length) {
  errors.push("$.sampleMeta.fieldInventory: 字段清单为空");
}
if (sample.sampleMeta?.generatedFrom !== validator.PROTOCOL) {
  errors.push("$.sampleMeta.generatedFrom: 来源协议不匹配");
}

const uniqueErrors = [...new Set(errors)];
if (uniqueErrors.length) {
  console.error(`脱敏来源样本自检失败：${uniqueErrors.length} 项`);
  uniqueErrors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const bytes = fs.statSync(samplePath).size;
  console.log(
    `脱敏来源样本自检通过：${bytes} bytes，${validation.fieldCount} 个字段路径，${representativeRecords} 个代表数组项，${sampleCodes.size} 个样本基金代码。`,
  );
}
