import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { finished } from "node:stream/promises";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceDir = path.join(rootDir, "extension");
const outputDir = path.join(rootDir, "dist-extension");
const outputFile = path.join(outputDir, "lptff-investment-assistant.zip");

const builds = new Map();

async function build(output) {
  if (!fs.existsSync(sourceDir)) throw new Error(`扩展目录不存在：${sourceDir}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });

  function* entries(directory, prefix = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const source = path.join(directory, entry.name);
      const name = prefix + entry.name;
      if (entry.isDirectory()) {
        yield { source, name: name + "/", directory: true };
        yield* entries(source, name + "/");
      } else if (entry.isFile()) {
        yield { source, name, directory: false };
      } else {
        throw new Error(`扩展包只接受普通文件与目录：${name}`);
      }
    }
  }
  const temporary = `${output}.${randomUUID()}.tmp`;
  const stream = fs.createWriteStream(temporary);
  let failure;
  stream.on("error", (error) => { failure = error; });
  const archive = new Zip((error, bytes, final) => {
    if (error) { stream.destroy(error); return; }
    stream.write(bytes);
    if (final) stream.end();
  });
  try {
    for (const item of entries(sourceDir)) {
      const entry = item.directory ? new ZipPassThrough(item.name) : new ZipDeflate(item.name, { level: 9 });
      entry.mtime = fs.statSync(item.source).mtime;
      archive.add(entry);
      if (!item.directory) {
        for await (const chunk of fs.createReadStream(item.source)) {
          if (failure) throw failure;
          entry.push(chunk);
          if (stream.writableNeedDrain) await once(stream, "drain");
        }
      }
      entry.push(new Uint8Array(), true);
      if (failure) throw failure;
      if (stream.writableNeedDrain) await once(stream, "drain");
    }
    archive.end();
    await finished(stream);
    await fs.promises.rename(temporary, output);
  } finally {
    stream.destroy();
    await finished(stream).catch(() => {});
    await fs.promises.rm(temporary, { force: true });
  }
  return output;
}

export function buildExtensionZip(output = outputFile) {
  const key = path.resolve(output);
  if (!builds.has(key)) {
    builds.set(key, build(output).finally(() => builds.delete(key)));
  }
  return builds.get(key);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildExtensionZip().then((file) => {
    console.log(`已生成 ${path.relative(rootDir, file)}（${fs.statSync(file).size} bytes）`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
