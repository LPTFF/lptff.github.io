import { defineUserConfig } from '@vuepress/cli'
import { defaultTheme } from '@vuepress/theme-default'
import { getDirname, path } from '@vuepress/utils'
import { viteBundler } from '@vuepress/bundler-vite'
import viteCompression from 'vite-plugin-compression'
import process from 'node:process'
// import { visualizer } from 'rollup-plugin-visualizer'
const __dirname = getDirname(import.meta.url)
import {
    head,
    navbarEn,
    sidebarEn,
    sidebarZh
} from './config/index.js'
export default defineUserConfig({
    base: '/',
    lang: 'zh-CN',
    title: '随风而逝',
    description: '期待改变!',
    head,
    theme: defaultTheme({
        // set config here
        logo: 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg',
        locales: {
            '/': {
                navbar: true ? navbarEn : [],
                sidebar: false ? sidebarEn : sidebarZh,
                editLinkText: '在 GitHub 上编辑此页',
                notFound: [
                    '这里什么都没有',
                    '我们怎么到这来了？',
                    '这是一个 404 页面',
                    '看起来我们进入了错误的链接',
                ],
                backToHome: '返回首页',
                lastUpdatedText: '上次更新',
                contributorsText: '贡献者',
                toggleColorMode: '切换颜色模式',
                toggleSidebar: '切换侧边栏',
            },
        },
        docsRepo: 'https://github.com/LPTFF/lptff.github.io',
        docsBranch: 'master',
        docsDir: 'docs',
        editLinkPattern: ':repo/edit/:branch/:path',
    }),
    clientConfigFile: path.resolve(
        __dirname,
        './clientConfig.js'
    ),
    bundler: viteBundler({
        viteOptions: {
            base: './',
            server: {
                cors: true,
                open: false,
                port: 9000,
                proxy: {
                    '/api': {
                        target: 'http://192.168.99.223:3000',   //代理接口
                        changeOrigin: true
                    }
                }
            },
            build: {
                target: 'es2015',
                emptyOutDir: false,
                rollupOptions: {
                    output: {
                        ...({
                            manualChunks(id) {
                                if (id.includes('node_modules')) {
                                    return 'framework'
                                }
                                return undefined
                            },
                        }),
                    },
                }
            },
            experimental: {
                renderBuiltUrl(filename) {
                    return 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/' + filename
                }
            },
            resolve: {
                alias: {}
            },
            // plugins: [viteCompression(), visualizer()]
            plugins: [viteCompression()]
        },
        vuePluginOptions: {},
    }),
})