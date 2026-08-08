import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourceDir = path.join(rootDir, "project-support", "extension", "lptff-investment-assistant");
const outputDir = path.join(rootDir, "dist-extension");
const outputFile = path.join(outputDir, "lptff-investment-assistant.zip");

export function buildExtensionZip(output = outputFile) {
  if (!fs.existsSync(sourceDir)) throw new Error(`扩展目录不存在：${sourceDir}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(output);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    stream.on("close", () => resolve(output));
    stream.on("error", reject);
    archive.on("error", reject);
    archive.pipe(stream);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildExtensionZip().then((file) => {
    console.log(`已生成 ${path.relative(rootDir, file)}（${fs.statSync(file).size} bytes）`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
