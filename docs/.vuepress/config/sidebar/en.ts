import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebarEn: SidebarConfig = [
    {
        text: '求学笔记',
        collapsible: true,
        children: [
            {
                text: '2018',
                collapsible: true,
                children: [
                    {
                        text: '水下机器人研究01',
                        link: '/study/notebook/2018/水下机器人研究01.md'
                    },
                    {
                        text: '无人驾驶麻省理工01讲',
                        link: '/study/notebook/2018/无人驾驶麻省理工01讲.md'
                    },
                    {
                        text: '无人驾驶麻省理工02讲',
                        link: '/study/notebook/2018/无人驾驶麻省理工02讲.md'
                    },
                    {
                        text: '无人驾驶麻省理工03讲',
                        link: '/study/notebook/2018/无人驾驶麻省理工03讲.md'
                    }
                ],
            },
            {
                text: '2019',
                collapsible: true,
                children: [
                    {
                        text: 'AI应用之水下机器人02',
                        link: '/study/notebook/2019/AI应用之水下机器人02.md'
                    },
                    {
                        text: '无人驾驶麻省理工04讲',
                        link: '/study/notebook/2019/无人驾驶麻省理工04讲.md'
                    },
                ],
            },
        ]
    },
    {
        text: '短视频',
        link: '/job/video/shortVideo.md',
    },
    {
        text: '工具区',
        children: [
            {
                text: '产品',
                link: '/job/tools/products.md',
            },
            {
                text: '测试',
                link: '/job/tools/test.md',
            }
        ]

    },
    {
        text: '12tall博客',
        link: 'https://12tall.cn/intro.html',
    }
]

