import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebarEn: SidebarConfig = [
    {
        text: '介绍',
        link: '/document/introduction',
    },
    {
        text: 'guide',
        children: [
            {
                text: 'guide1',
                link: '/guide/1.md',
            },
            {
                text: 'guide2',
                link: '/guide/2.md',
            },
        ]
    },
    {
        text: '12tall博客',
        link: 'https://12tall.cn/intro.html',
    }
]

