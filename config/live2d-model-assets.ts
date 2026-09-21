import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

const MODEL_DEFINITIONS = [
  { id: "hijiki", pkg: "live2d-widget-model-hijiki", name: "hijiki 黑猫" },
  { id: "tororo", pkg: "live2d-widget-model-tororo", name: "tororo 白猫" },
  { id: "shizuku", pkg: "live2d-widget-model-shizuku", name: "shizuku 看板娘" },
  { id: "wanko", pkg: "live2d-widget-model-wanko", name: "wanko 柴犬" },
  { id: "haru", pkg: "live2d-widget-model-haru", name: "haru 春·双马尾" },
  { id: "haruto", pkg: "live2d-widget-model-haruto", name: "haruto 春人·学生" },
  { id: "hibiki", pkg: "live2d-widget-model-hibiki", name: "hibiki 响·学生" },
  { id: "izumi", pkg: "live2d-widget-model-izumi", name: "izumi 泉·女学生" },
  { id: "koharu", pkg: "live2d-widget-model-koharu", name: "koharu 小春·和服" },
  { id: "tsumiki", pkg: "live2d-widget-model-tsumiki", name: "tsumiki 积木·方块" },
  { id: "chitose", pkg: "live2d-widget-model-chitose", name: "chitose 千岁" },
  { id: "nico", pkg: "live2d-widget-model-nico", name: "nico 看板娘" },
  { id: "ni-j", pkg: "live2d-widget-model-ni-j", name: "ni-j" },
  { id: "nietzsche", pkg: "live2d-widget-model-nietzsche", name: "nietzsche 尼采" },
  { id: "nipsilon", pkg: "live2d-widget-model-nipsilon", name: "nipsilon 尼普西伦" },
  { id: "z16", pkg: "live2d-widget-model-z16", name: "z16" },
  { id: "unitychan", pkg: "live2d-widget-model-unitychan", name: "unitychan Unity娘" },
  { id: "miku", pkg: "live2d-widget-model-miku", name: "miku 初音未来" },
] as const;

interface ResolvedModel {
  id: string;
  name: string;
  assetsDir: string;
  modelJson: string;
  preview?: string;
}

function findFiles(root: string): string[] {
  return fs.readdirSync(root, { recursive: true }).map(String).sort();
}

function resolveModels(root: string): ResolvedModel[] {
  return MODEL_DEFINITIONS.map(({ id, pkg, name }) => {
    const packageDir = path.join(root, "node_modules", pkg);
    if (!fs.existsSync(packageDir)) {
      throw new Error(`Live2D 依赖未安装：${pkg}，请先运行 npm install`);
    }

    const packageFiles = findFiles(packageDir);
    const modelJsonInPackage = packageFiles.find((file) => file.endsWith(".model.json"));
    if (!modelJsonInPackage) throw new Error(`Live2D 包缺少 model.json：${pkg}`);

    const assetsDir = path.join(packageDir, path.dirname(modelJsonInPackage));
    const assetFiles = findFiles(assetsDir);
    const modelJson = path.basename(modelJsonInPackage);
    const preview = assetFiles.find((file) => file.endsWith("texture_00.png"));
    return { id, name, assetsDir, modelJson, preview };
  });
}

function manifestOf(models: ResolvedModel[]) {
  return models.map(({ id, name, modelJson, preview }) => ({
    id,
    name,
    jsonPath: `/live2dw/models/${id}/${modelJson}`,
    ...(preview ? { preview: `/live2dw/models/${id}/${preview.split(path.sep).join("/")}` } : {}),
  }));
}

function contentType(file: string): string {
  switch (path.extname(file).toLowerCase()) {
    case ".json": return "application/json; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".mtn":
    case ".txt": return "text/plain; charset=utf-8";
    default: return "application/octet-stream";
  }
}

export function live2dModelAssetsPlugin(): Plugin {
  let config: ResolvedConfig;
  let models: ResolvedModel[] = [];

  return {
    name: "lptff-live2d-model-assets",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      models = resolveModels(config.root);
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || "/", "http://vite.local").pathname;
        const prefix = "/live2dw/models/";
        if (!pathname.startsWith(prefix)) return next();

        if (pathname === `${prefix}manifest.json`) {
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(JSON.stringify(manifestOf(models)));
          return;
        }

        const [modelId, ...assetParts] = pathname.slice(prefix.length).split("/");
        const model = models.find(({ id }) => id === modelId);
        if (!model || assetParts.length === 0) return next();

        const relativeAsset = decodeURIComponent(assetParts.join("/"));
        const target = path.resolve(model.assetsDir, relativeAsset);
        const relativeTarget = path.relative(model.assetsDir, target);
        if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
          response.statusCode = 403;
          response.end("Forbidden");
          return;
        }
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return next();

        response.statusCode = 200;
        response.setHeader("Content-Type", contentType(target));
        fs.createReadStream(target).pipe(response);
      });
    },
    writeBundle(outputOptions) {
      const outputDir = path.resolve(config.root, outputOptions.dir || config.build.outDir);
      const modelOutputDir = path.join(outputDir, "live2dw", "models");
      fs.mkdirSync(modelOutputDir, { recursive: true });
      for (const model of models) {
        fs.cpSync(model.assetsDir, path.join(modelOutputDir, model.id), { recursive: true });
      }
      fs.writeFileSync(
        path.join(modelOutputDir, "manifest.json"),
        JSON.stringify(manifestOf(models), null, 2),
      );
    },
  };
}
