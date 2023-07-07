import { createApp } from 'vue'
import App from './App.vue'
const myApp = createApp(App);
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import * as ElIcons from '@element-plus/icons-vue';
for (const name in ElIcons) {
    myApp.component(name, ElIcons[name])
};//全局注册element-icon图标
myApp.use(ElementPlus)//全局注册element组件
import router from './router';
// 全局前置守卫
router.beforeEach((to, from, next) => {
    // 通过调用next()来继续导航
    console.log('to', to.path);
    if (to.path === '/home' || to.path === '/job' || to.path === '/blog' || to.path === '/life') {
        next()
    } else {
        next('/home') // 否则重定向到"/home"
    }
})
myApp.use(router);//全局注册路由
myApp.mount('#app')