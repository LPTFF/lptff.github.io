import type { NavbarConfig } from '@vuepress/theme-default'

export const navbarZh: NavbarConfig = [
    {
        text: '首页',
        link: '/',
    },
    {
        text: '实验室',
        children: [
            {
                text: '工具区',
                link: '/job/video/shortVideo.md',
            },
            {
                text: '开发者',
                link: '/job/develop/README.md',
            }
        ]
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
        text: '学术网站',
        children: [
            {
                text: 'arXiv',
                link: 'https://arxiv.org/',
            },
            {
                text: 'sci-hub',
                link: 'https://sci-hub.se/',
            },
            {
                text: 'IEEE',
                link: 'https://ieeexplore.ieee.org/Xplore/home.jsp',
            }
        ]
    },
    {
        text: '相关链接',
        children: [
            {
                text: '我的Github',
                link: 'https://github.com/LPTFF/lptff.github.io',
            },
            {
                text: 'vuepress中文',
                link: 'https://v2.vuepress.vuejs.org/zh/',
            },
            {
                text: 'cdn博客参考',
                link: 'https://jwchan.cn/',
            },
            {
                text: '标标的博客',
                link: 'https://github.com/12Tall/12tall.github.io/tree/master',
            }
        ]
    }
]