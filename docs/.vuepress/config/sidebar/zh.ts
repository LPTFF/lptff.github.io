import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebarZh: SidebarConfig = {
    '/document/': [
        {
            text: 'document',
            children: [
                '/document/introduction/README.md',
            ]
        }]
}