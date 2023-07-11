import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  // plugins: [vue(), visualizer()],
  plugins: [vue()],
  server: {
    cors: true,
    open: false,
    port: 9000,
    proxy: {
      //https://www.runoob.com/try/ajax/json_demo.json
      '/Run': {
        target: 'https://www.runoob.com',
        secure: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Run/, ''),
      },
      //https://api.juejin.cn/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20
      '/Jue': {
        target: 'https://api.juejin.cn', //接口域名
        secure: true,
        changeOrigin: true,             //是否跨域
        rewrite: (path) => path.replace(/^\/Jue/, ''),
      },
      '/douban': {
        target: 'https://movie.douban.com', //接口域名
        secure: true,
        changeOrigin: true,             //是否跨域
        rewrite: (path) => path.replace(/^\/douban/, ''),
      }
    }
  },
  build: {
    target: 'es2015',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // entryFileNames: `assets/[name].js`,
        // chunkFileNames: `assets/[name].js`,
        // assetFileNames: `assets/[name].[ext]`,
        ...({
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const arr = id.toString().split('node_modules/')[1].split('/')
              switch (arr[0]) {
                case '@vue':
                case 'element-plus': // UI 库
                case '@element-plus': // 图标
                case 'eruda': // 图标
                  return arr[0]
                  break
                default:
                  return 'framework'
                  break
              }
            }
            return undefined
          },
        }),
      },
    },
    chunkSizeWarningLimit: 200,
  },
  experimental: {
    renderBuiltUrl(filename) {
      // 对项目public文件下资源进行加载
      return filename
      // return 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/' + filename
    }
  },
});
