import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { live2dModelAssetsPlugin } from "./scripts/vite/live2d-model-assets";
import { markdownComponentsPlugin } from "./scripts/vite/markdown-components";
import fs from "node:fs";
import path from "node:path";

function getPublishedDataMeta(overrideDir: string) {
  const metaPath = path.join(overrideDir, "snapshot-meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {}
  }
  return null;
}

const publishedDataPlugin = (isPublished: boolean, overrideDir: string): Plugin => {
  if (isPublished) {
    if (!fs.existsSync(overrideDir) || !fs.existsSync(path.join(overrideDir, "snapshot-meta.json"))) {
      throw new Error(
        "【发布快照模式】本地发布快照缓存不存在或缺少 snapshot-meta.json！请先运行 npm run serve 恢复快照。"
      );
    }
  }

  return {
    name: "lptff-published-data",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (isPublished && req.url && req.url.startsWith("/data/")) {
          const cleanUrl = req.url.split("?")[0];
          const rel = cleanUrl.replace(/^\/data\//, "");
          const target = path.resolve(overrideDir, rel);
          if (target.startsWith(overrideDir + path.sep) && target.endsWith(".json") && fs.existsSync(target) && fs.statSync(target).isFile()) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            fs.createReadStream(target).pipe(res);
            return;
          }
        }
        next();
      });
    },
    transformIndexHtml() {
      if (!isPublished) return [];
      return [{ tag: "script", children: `window.__PUBLISHED_DATA_META__=${JSON.stringify(getPublishedDataMeta(overrideDir)).replace(/</g, "\\u003c")}`, injectTo: "head" }];
    },
  };
};

const extensionDownloadPlugin = (): Plugin => ({
  name: "lptff-extension-download",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== "/__extension_download__") {
        next();
        return;
      }

      try {
        const { buildExtensionZip } = await import("./scripts/extension/build-zip.js");
        const outputFile = await buildExtensionZip();
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=lptff-investment-assistant.zip");
        fs.createReadStream(outputFile).pipe(response);
      } catch (error) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(error instanceof Error ? error.message : "扩展打包失败");
      }
    });
  },
});

const staticRouteEntriesPlugin = (): Plugin => ({
  name: "lptff-static-route-entries",
  closeBundle() {
    const distDir = path.resolve(__dirname, "dist");
    const indexFile = path.join(distDir, "index.html");
    if (!fs.existsSync(indexFile)) return;
    for (const route of ["todo", "community"]) {
      const routeDir = path.join(distDir, route);
      fs.mkdirSync(routeDir, { recursive: true });
      fs.copyFileSync(indexFile, path.join(routeDir, "index.html"));
    }
  },
});

export default defineConfig(({ mode }) => {
  const isPublished = mode === "published" || process.env.USE_PUBLISHED_DATA === "true";
  const overrideDir = path.resolve(__dirname, "node_modules/.cache/lptff/published-data");

  return {
    base: "/",
    publicDir: "public",
    resolve: {
      alias: {
        "@published": overrideDir,
      },
    },
    define: {
      __PUBLISHED_DATA_META__: JSON.stringify(getPublishedDataMeta(overrideDir)),
    },
    plugins: [
      publishedDataPlugin(isPublished, overrideDir),
      live2dModelAssetsPlugin(),
      markdownComponentsPlugin(),
      extensionDownloadPlugin(),
      staticRouteEntriesPlugin(),
      AutoImport({
        resolvers: [ElementPlusResolver({ importStyle: "css" })],
      }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: "css" })],
      }),
      vue({
        include: [/\.vue$/, /\.md$/],
      }),
    ],
    preview: {
      port: 4173,
      host: "127.0.0.1",
    },

  server: {
    cors: true,
    open: false,
    host: '0.0.0.0',
    port: 8090,
    strictPort: false,
  },
  build: {
    target: "es2015",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          const nodeModulesIndex = normalizedId.lastIndexOf("/node_modules/");

          if (nodeModulesIndex === -1) return undefined;

          const packagePath = normalizedId.slice(nodeModulesIndex + "/node_modules/".length);
          const packageName = packagePath.startsWith("@")
            ? packagePath.split("/").slice(0, 2).join("/")
            : packagePath.split("/")[0];

          // 保留导出功能的延迟加载边界，只有用户执行导出时才请求
          if (packageName === "write-excel-file") return "xlsx-export";

          // echarts 按需注册体量可观且仅投资复盘路由使用，独立分包便于缓存与校验尺寸
          if (packageName === "echarts" || packageName === "zrender" || packageName === "tslib") return "echarts-vendor";

          // Vue 运行时稳定分包，避免业务代码变化导致框架缓存失效
          if (packageName === "vue" || packageName === "vue-router" || packageName.startsWith("@vue/")) {
            return "vue-vendor";
          }

          // 其余依赖交给 Rollup 按静态/动态导入关系自然拆分
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 200,
  },
};
});
