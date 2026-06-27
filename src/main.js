import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "element-plus/theme-chalk/index.css";

const myApp = createApp(App);

router.beforeEach((to, from, next) => {
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
    to.path === "/fundPilotPlus" ||
    to.path === "/fundPilotV1" ||
    to.path === "/cryptocurrency" ||
    to.path === "/"
  ) {
    next();
  } else {
    next("/");
  }
});

myApp.use(router);
myApp.mount("#app");
