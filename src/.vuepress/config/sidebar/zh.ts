import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebarZh: SidebarConfig = {
    '/study/': [
        {
            text: '求学笔记',
            collapsible: true,
            children: [
                {
                    text: '2018',
                    collapsible: true,
                    children: [
                        '/study/notebook/2018/underwaterRobots01.md',
                        '/study/notebook/2018/autoDriveForMIT01.md',
                        '/study/notebook/2018/autoDriveForMIT02.md',
                        '/study/notebook/2018/autoDriveForMIT03.md',
                    ],
                },
                {
                    text: '2019',
                    collapsible: true,
                    children: [
                        '/study/notebook/2019/underwaterRobots02.md',
                        '/study/notebook/2019/autoDriveForMIT04.md',
                    ],
                },
            ],
        }
    ],
    '/job/': [
        {
            text: '工具区',
            children: [
                '/job/video/shortVideo.md',
            ]
        },
        {
            text: '开发者',
            children: [
                '/job/develop/README.md',
            ]
        },
        {
            text: 'idea',
            children: [
                '/job/tools/products.md',
                '/job/tools/test.md',
                '/job/tools/chatGPT.md'
            ]
        }
    ]
}