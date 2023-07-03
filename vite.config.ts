import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
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
  }
});
