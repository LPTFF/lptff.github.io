import { defineUserConfig } from '@vuepress/cli'
import { defaultTheme } from '@vuepress/theme-default'
import { getDirname, path } from '@vuepress/utils'
const __dirname = getDirname(import.meta.url)
import {
    head,
    navbarEn,
    sidebarEn
} from './config/index.js'
console.log('config');
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
                sidebar: sidebarEn,
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
        }
    }),
    clientConfigFile: path.resolve(
        __dirname,
        './clientConfig.js'
    ),
})