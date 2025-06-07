import { createApp } from "vue";
import App from "./App.vue";
const myApp = createApp(App);
import * as ElIcons from "@element-plus/icons-vue";
for (const name in ElIcons) {
  myApp.component(name, ElIcons[name]);
} //全局注册element-icon图标
import router from "./router";
import "element-plus/theme-chalk/index.css";
// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 通过调用next()来继续导航
  if (
    to.path === "/home" ||
    to.path === "/job" ||
    to.path === "/blog" ||
    to.path === "/life" ||
    to.path === "/message" ||
    to.path === "/fundHoldInfoMsg" ||
    to.path === "/newsArticle" ||
    to.path === "/loginFund" ||
    to.path === "/fundPilot" ||
    to.path === "/"
  ) {
    next();
  } else {
    next("/"); // 否则重定向到"/home"
  }
});
myApp.use(router); //全局注册路由
myApp.mount("#app");
