import type { NavbarConfig } from '@vuepress/theme-default'

export const navbarZh: NavbarConfig = [
    {
        text: '首页',
        link: '/',
    },
    {
        text: '开发者',
        link: '/develop',
    },
    {
        text: '工具区',
        link: '/job/video/shortVideo.md',
    },
    {
        text: '实验室',
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