import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Markdown from "unplugin-vue-markdown/vite";

export default defineConfig({
  base: "./",
  plugins: [
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
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const arr = id.toString().split("node_modules/")[1].split("/");
            switch (arr[0]) {
              case "@vue":
              case "element-plus":
              case "@element-plus":
              case "eruda":
              case "openai":
              case "axios":
                return arr[0];
              default:
                return "framework";
            }
          }
          if (id.includes("zhipin.json")) {
            return "zhipin.json";
          }
          if (id.includes("leetCode_1.json")) {
            return "leetCode_1.json";
          }
          if (id.includes("websiteGroups.json")) {
            return "websiteGroups.json";
          }
          if (id.includes("src/public/data/findJobMarkDown/vue")) {
            return "vueMarkDown";
          }
          if (id.includes("src/views/home/findJob")) {
            return "findJob";
          }
          if (id.includes("findJobUtils.js")) {
            return "findJobUtils";
          }
          if (id.includes("src/public/data/findJobMarkDown")) {
            return "findJobMarkDown";
          }
          if (id.includes("src")) {
            return "src";
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 200,
  },
});