import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
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
