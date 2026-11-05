import { createRouter, createWebHistory } from "vue-router";
import { isInvestmentTab } from "./investment-tabs";
import { routes } from "./routes";

const tabScrollPositions = new Map();
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      let id = to.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* 使用原始锚点。 */ }
      const element = document.getElementById(id);
      // 异步文章尚未挂载时，由文章组件在生成目录后定位。
      return element ? { el: element, behavior: "smooth" } : false;
    }
    if (isInvestmentTab(to) && isInvestmentTab(from)) {
      if (to.name === from.name) return false;
      return tabScrollPositions.get(to.name) ?? { top: 0 };
    }
    return { top: 0 };
  },
});

router.beforeEach((to, from) => {
  if (isInvestmentTab(to) && isInvestmentTab(from)) {
    tabScrollPositions.set(from.name, { left: window.scrollX, top: window.scrollY });
  } else {
    // 离开投资产品时，页面缓存与滚动位置一起释放。
    tabScrollPositions.clear();
  }
});

router.afterEach((to) => {
  if (!to.meta?.title) { document.title = "随风而逝"; return; }
  document.title = `${to.meta.title} · ${to.meta.product ?? "随风而逝"}`;
});

export default router;
