import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "element-plus/theme-chalk/index.css";

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