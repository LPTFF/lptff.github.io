import { defineUserConfig } from '@vuepress/cli'
import { defaultTheme } from '@vuepress/theme-default'
import { getDirname, path } from '@vuepress/utils'
import { viteBundler } from '@vuepress/bundler-vite'
import viteCompression from 'vite-plugin-compression'
// import process from 'node:process'
// import { visualizer } from 'rollup-plugin-visualizer'
const __dirname = getDirname(import.meta.url)
// import { createPage } from '@vuepress/core'
import {
    head,
    navbarEn,
    navbarZh,
    sidebarEn,
    sidebarZh
} from './config/index.js'
export default defineUserConfig({
    base: '/',
    lang: 'zh-CN',
    title: 'tangff',
    description: '期待改变!',
    head,
    theme: defaultTheme({
        // set config here
        logo: 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg',
        locales: {
            '/': {
                navbar: false ? navbarEn : navbarZh,
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
    shouldPrefetch: true,
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
                        // entryFileNames: `assets/[name].js`,
                        // chunkFileNames: `assets/[name].js`,
                        // assetFileNames: `assets/[name].[ext]`,
                        ...({
                            manualChunks(id) {
                                if (id.includes('node_modules')) {
                                    return 'framework'
                                }
                                return undefined
                            },
                        }),
                    },
                },
                chunkSizeWarningLimit: 200,
                modulePreload: {
                    // resolveDependencies: (filename, deps, { hostId, hostType }) => {
                    //     console.log('resolveDependencies filename', filename);
                    //     console.log('resolveDependencies deps', deps, typeof deps);
                    //     console.log('resolveDependencies hostId', hostId);
                    //     console.log('resolveDependencies hostType', hostType);
                    //     return ['https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/']
                    // }
                }
            },
            experimental: {
                renderBuiltUrl(filename) {
                    // 对项目docs/.vuepress/public文件下资源进行加载
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
    // async onInitialized(app) {
    //     // 创建开发主页
    //     const homepage = await createPage(app, {
    //         path: '/develop',
    //         filePath: path.resolve(__dirname, './views/develop.md'),
    //         // 设置 frontmatter
    //         frontmatter: {
    //             layout: 'Layout',
    //             navbar: true,//关闭导航
    //             sidebar: true,//关闭侧边栏
    //             editLink: false,//关闭GitHub链接
    //             lastUpdated: false,//关闭最后提交时间
    //             contributors: false,//关闭贡献者
    //         },
    //     })
    //     // 把它添加到 `app.pages`
    //     app.pages.push(homepage)
    // },
})