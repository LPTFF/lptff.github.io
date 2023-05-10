import type { NavbarConfig } from '@vuepress/theme-default'

console.log('navbar');

export const navbarEn: NavbarConfig = [
    {
        text: '短视频',
        link: '/job/video/shortVideo.md',
    },
    {
        text: '求学笔记',
        children: [
            {
                text: '2018',
                link: '/study/notebook/2018/水下机器人研究01.md',
            },
            {
                text: '2019',
                link: '/study/notebook/2019/AI应用之水下机器人02.md',
            }
        ]
    },
    {
        text: '工具区',
        link: '/job/tools/products.md',
    },
    {
        text: 'Github',
        link: 'https://github.com/LPTFF/lptff.github.io',
    },
]