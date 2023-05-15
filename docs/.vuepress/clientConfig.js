import { defineClientConfig } from '@vuepress/client'
import MyComponent from './components/index.vue'
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import * as ElIcons from '@element-plus/icons-vue';

export default defineClientConfig({
    enhance({ app, router, siteData }) {
        app.component('MyComponent', MyComponent)
        for (const name in ElIcons) {
            app.component(name, ElIcons[name])
        };//全局注册element-icon图标
        app.use(ElementPlus)//全局注册element组件
        // router.beforeEach((to) => {
        //     console.log('before navigation', to)
        // })
        // router.afterEach((to) => {
        //     console.log('after navigation', to)
        // })
        // console.log('siteData', siteData);
    },
    setup() { },
    layouts: {},
    rootComponents: []
})