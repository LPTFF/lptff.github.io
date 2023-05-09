import type { NavbarConfig } from '@vuepress/theme-default'

export const navbarEn: NavbarConfig = [
    {
        text: '介绍',
        link: '/document/introduction',
    },
    // {
    //     text: '短视频',
    //     link: '../src/life/index.vue',
    // },
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
        text: 'Github',
        link: 'https://github.com/LPTFF/lptff.github.io',
    },
]