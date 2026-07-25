import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Markdown from "unplugin-vue-markdown/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  base: "/",
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: "css" })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: "css" })],
    }),
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      exclude: [/前端八股文汇总背诵版/],
    }),
  ],
  server: {
    cors: true,
    open: false,
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      "/Run": {
        target: "https://www.runoob.com",
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Run/, ""),
      },
      "/Jue": {
        target: "https://api.juejin.cn",
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Jue/, ""),
      },
      "/douban": {
        target: "https://movie.douban.com",
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/douban/, ""),
      },
      '/data': {
        target: 'http://106.15.131.89:60080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/data/, '/data')
      }
    },
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
          if (packageName === "xlsx") return "xlsx";

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
});
