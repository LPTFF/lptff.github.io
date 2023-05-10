import type { NavbarConfig } from '@vuepress/theme-default'

console.log('navbar');

export const navbarEn: NavbarConfig = [
    {
        text: '首页',
        link: '/',
    },
    {
        text: '短视频',
        link: '/job/video/shortVideo.md',
    },
    {
        text: '工具区',
        link: '/job/tools/products.md',
    },
    {
        text: '求学笔记',
        children: [
            {
                text: '2018',
                link: '/study/notebook/2018/underwaterRobots01.md',
            },
            {
                text: '2019',
                link: '/study/notebook/2019/underwaterRobots02.md',
            }
        ]
    },
    {
        text: 'Github',
        link: 'https://github.com/LPTFF/lptff.github.io',
    },
]