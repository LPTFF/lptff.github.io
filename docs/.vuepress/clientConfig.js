import { defineClientConfig } from '@vuepress/client'
import MyComponent from './components/index.vue'
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import * as ElIcons from '@element-plus/icons-vue';
import routesAdd from './router/index'
import Develop from './views/index.vue'
export default defineClientConfig({
    enhance({ app, router, siteData }) {
        app.component('MyComponent', MyComponent)
        app.component('Develop', Develop)
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
        for (let index = 0; index < routesAdd.length; index++) {
            const element = routesAdd[index];
            console.log('233', element);
            router.addRoute(element)
        }
    },
    setup() { },
    layouts: {},
    rootComponents: []
})