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
myApp.use(router);//全局注册路由
myApp.mount('#app')