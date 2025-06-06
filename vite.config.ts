import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import vitePrerender from 'vite-plugin-prerender'
// import path from 'path'
// import { visualizer } from "rollup-plugin-visualizer";
import Markdown from "unplugin-vue-markdown/vite";

export default defineConfig({
  base: "./",
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/], // <-- allows Vue to compile Markdown files
    }),
    Markdown({}),
    // visualizer(),
    // vitePrerender({
    //     staticDir: path.join(__dirname, 'dist'),
    //     routes: ['/', '/home'],
    //   }),
  ],
  server: {
    cors: true,
    open: false,
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      //https://www.runoob.com/try/ajax/json_demo.json
      "/Run": {
        target: "https://www.runoob.com",
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Run/, ""),
      },
      //https://api.juejin.cn/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20
      "/Jue": {
        target: "https://api.juejin.cn", //接口域名
        secure: true,
        changeOrigin: true, //是否跨域
        rewrite: (path) => path.replace(/^\/Jue/, ""),
      },
      "/douban": {
        target: "https://movie.douban.com", //接口域名
        secure: true,
        changeOrigin: true, //是否跨域
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
        // entryFileNames: `assets/[name].js`,
        // chunkFileNames: `assets/[name].js`,
        // assetFileNames: `assets/[name].[ext]`,
        ...{
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const arr = id.toString().split("node_modules/")[1].split("/");
              switch (arr[0]) {
                case "@vue":
                case "element-plus": // UI 库
                case "@element-plus": // 图标
                case "eruda":
                case "openai":
                case "axios":
                  return arr[0];
                  break;
                default:
                  return "framework";
                  break;
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
    },
    chunkSizeWarningLimit: 200,
  },
  experimental: {
    renderBuiltUrl(filename) {
      // 对项目public文件下资源进行加载  cdn.jsdelivr.net|cdn.jsdelivr.net
      return filename;
      // return 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/' + filename
    },
  },
});
