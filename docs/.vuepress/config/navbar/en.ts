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
                link: '/document/tips/1.md',
            },
            {
                text: '2019',
                link: '/document/tips/2.md',
            }
        ]
    },
    {
        text: 'Github',
        link: 'https://github.com/LPTFF',
    },
]