import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebarEn: SidebarConfig = {
    '/guide/': [
        {
            text: 'guide',
            children: [
                '/guide/README.md',
            ]
        }]
}
