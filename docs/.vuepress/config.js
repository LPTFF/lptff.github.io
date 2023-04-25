import { defineComponent } from "vue";
export default defineComponent({
    // 站点配置
    lang: 'zh-CN',
    title: '随风而逝',
    description: 'Just do it!',
    head: [ // 注入到当前页面的 HTML <head> 中的标签
        ['link', {
            rel: 'icon',
            href: '/img/vue.svg'
        }], // 增加一个自定义的 favicon(网页标签的图标)
    ],
    // 主题和它的配置
    // theme: '@vuepress/theme-default',
    themeConfig: {
        nav: [
            { text: 'External', link: 'https://google.com', target: '_self', rel: '' },
            { text: 'Guide', link: '/guide/', target: '_blank' }
        ]
    }
})
