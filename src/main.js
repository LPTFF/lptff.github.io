import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "element-plus/theme-chalk/index.css";
// Element Plus 按需自动导入，无需手动引入

const myApp = createApp(App);

// 允许的路由白名单
const allowedRoutes = [
  "/", "/job", "/blog", "/life", "/message",
  "/fundHoldInfoMsg", "/newsArticle", "/loginFund",
  "/fundPilot", "/fundPilotPlus", "/fundPilotV1", "/cryptocurrency",
];

router.beforeEach((to, from, next) => {
  if (allowedRoutes.includes(to.path)) {
    next();
  } else {
    next("/");
  }
});

myApp.use(router);
myApp.mount("#app");