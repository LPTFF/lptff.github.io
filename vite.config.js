import { defineConfig } from "vite";
import { resolve } from "path";
import vue from '@vitejs/plugin-vue';
function pathResolve(dir) {
  return resolve(__dirname, ".", dir);
}
import externalGlobals from 'rollup-plugin-external-globals'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/lptff.github.io/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      "/@": pathResolve("src"),
    }
  },
  optimizeDeps: {
    include: ['axios'],
  },
  build: {
    rollupOptions: {
      //重新打包配置
      external: ['vue'],
      plugins: [
        externalGlobals({
          vue: 'Vue'
        })
      ]
    },
    target: 'modules',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser' // 混淆器
  },
  server: {
    cors: true,
    open: true,
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://192.168.99.223:3000',   //代理接口
        changeOrigin: true
      }
    }
  }
});