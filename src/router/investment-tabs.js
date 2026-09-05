// 路由与菜单复用加载器：预加载只获取代码，不创建页面或读取账本。
export const investmentTabs = [
  { path: "", name: "os-console", title: "总览", component: () => import("../views/investment/ConsoleView.vue") },
  { path: "review", name: "os-review", title: "复盘", component: () => import("../views/investment/ReviewView.vue") },
  { path: "portfolio", name: "os-portfolio", title: "持仓", component: () => import("../views/investment/PortfolioView.vue") },
  { path: "policies", name: "os-policies", title: "纪律", component: () => import("../views/investment/PoliciesView.vue") },
  { path: "actions", name: "os-actions", title: "待办", component: () => import("../views/investment/ActionsView.vue") },
  { path: "evidence", name: "os-evidence", title: "明细", component: () => import("../views/investment/EvidenceView.vue") },
  { path: "data", name: "os-data", title: "采集", component: () => import("../views/investment/DataView.vue") },
];

export const isInvestmentTab = (route) => investmentTabs.some((tab) => tab.name === route.name);

const preloads = new Map();
export function preloadInvestmentTab(tab) {
  if (!preloads.has(tab.name)) {
    preloads.set(tab.name, tab.component().catch(() => {
      // 网络失败不影响当前页；下次聚焦或实际导航仍可重试。
      preloads.delete(tab.name);
    }));
  }
}
