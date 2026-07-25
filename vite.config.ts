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
          if (id.includes("node_modules")) {
            const arr = id.toString().split("node_modules/")[1].split("/");
            const pkgName = arr[0];

            // 大型库单独分包
            if (pkgName === "xlsx") return "xlsx";
            if (pkgName === "marked") return "marked";
            if (pkgName === "ssh2" || pkgName === "ssh2-sftp-client") return "ssh2";
            if (pkgName === "archiver") return "archiver";
            if (pkgName === "jsencrypt") return "jsencrypt";
            if (pkgName === "openai") return "openai";

            // Vue 生态
            if (pkgName === "@vue" || pkgName === "vue" || pkgName === "vue-router") return "vue";

            // Element Plus 相关拆分
            if (pkgName === "element-plus" || pkgName === "@element-plus") return "element-plus";
            if (pkgName === "@element-plus/icons-vue") return "element-icons";
            if (pkgName === "@popperjs") return "popper";
            if (pkgName === "@ctrl") return "tinycolor";
            if (pkgName === "@vueuse") return "vueuse";
            if (pkgName === "dayjs") return "dayjs";
            if (pkgName === "lodash-es") return "lodash-es";
            if (pkgName === "normalize-wheel-es") return "normalize-wheel-es";

            // 工具库单独分包
            if (pkgName === "axios") return "axios";
            if (pkgName === "eruda") return "eruda";
            if (pkgName === "file-saver") return "file-saver";

            // 剩余小型库按类别细分
            if (pkgName.startsWith("@types")) return "types";
            if (pkgName.includes("vite") || pkgName.includes("rollup")) return "build-tools";

            return undefined;
          }
          // JSON 数据文件单独分包
          if (id.includes("zhipin.json")) return "zhipin";
          if (id.includes("leetCode_1.json")) return "leetcode";
          if (id.includes("websiteGroups.json")) return "websiteGroups";

          // src 目录按模块细分
          if (id.includes("src/public/data/findJobMarkDown/vue")) return "vue-md";
          if (id.includes("src/public/data/findJobMarkDown")) return "findjob-md";
          if (id.includes("src/views/home/findJob")) return "findjob";
          if (id.includes("src/views/home/leetCode")) return "leetcode-view";
          if (id.includes("src/views/home/bossZhipin")) return "boss-view";
          if (id.includes("src/views/home/githubTrending")) return "github-view";
          if (id.includes("src/views/home/douban")) return "douban-view";
          if (id.includes("src/views/home/news")) return "news-view";
          if (id.includes("src/views/Message")) return "message-view";
          if (id.includes("src/views/Login")) return "login-view";
          if (id.includes("src/views/Blog")) return "blog-view";
          if (id.includes("src/study/notebook")) return "blog-content";
          if (id.includes("src/views/job")) return "job-view";
          if (id.includes("src/views/life")) return "life-view";
          if (id.includes("src/components")) return "components";
          if (id.includes("src/utils")) return "utils";
          if (id.includes("src/public/data")) return "data";
          if (id.includes("src")) return "app-core";

          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 200,
  },
});
