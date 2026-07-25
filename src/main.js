import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "element-plus/theme-chalk/index.css";

const myApp = createApp(App);

router.beforeEach((to, _from, next) => {
  if (to.matched.some((record) => record.meta.public) || to.path === "/" || to.matched.length) next();
  else next("/");
});

myApp.use(router);
myApp.mount("#app");
