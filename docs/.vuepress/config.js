import { defineUserConfig } from '@vuepress/cli'
import { defaultTheme } from '@vuepress/theme-default'
import {
    head,
    navbarEn,
    sidebarEn
} from './config/index.js'
export default defineUserConfig({
    base: '/',
    lang: 'zh-CN',
    title: '随风而逝',
    description: 'Just do it!',
    // head: [['link', { rel: 'icon', href: '/img/vue.svg' }]],
    head,
    theme: defaultTheme({
        // set config here
        locales: {
            '/': {
                navbar: navbarEn,
                sidebar: sidebarEn,
                editLinkText: 'Edit this page on GitHub',
                notFound: [
                    '这里什么都没有',
                    '我们怎么到这来了？',
                    '这是一个 404 页面',
                    '看起来我们进入了错误的链接',
                ],
                backToHome: '返回首页'
            },
        }
    }),
})