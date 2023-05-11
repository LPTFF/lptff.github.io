import { defineUserConfig } from '@vuepress/cli'
import { defaultTheme } from '@vuepress/theme-default'
import { getDirname, path } from '@vuepress/utils'
import { viteBundler } from '@vuepress/bundler-vite'
import process from 'node:process'
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
        logo: '/img/myLogo.jpg',
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
        viteOptions: () => {
            const NODE_ENV = process.env.NODE_ENV
            if (NODE_ENV === 'production') {
                return {
                    output: {
                        publicPath: 'https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@master/docs/.vuepress/dist'
                    },
                    resolve: {
                        alias: {
                            'public': path.resolve(__dirname, './dist')
                        }
                    }
                }
            } else {
                return {
                    resolve: {
                        alias: {
                            'public': path.resolve(__dirname, './dist')
                        }
                    }
                }
            }
        },
        vuePluginOptions: {},
    }),
})