import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/foo", redirect: "/" },
  {
    path: "/blog",
    component: () => import("../views/Blog/BlogLayout.vue"),
    meta: { public: true },
    children: [
      { path: "", name: "blog", component: () => import("../views/Blog/index.vue") },
      { path: "articles/:slug", name: "blog-article", component: () => import("../views/Blog/ArticleDetail.vue") },
      { path: "search", name: "blog-search", component: () => import("../views/Blog/SearchView.vue") },
      { path: "archives", name: "blog-archives", component: () => import("../views/Blog/ArchiveView.vue") },
      { path: "archives/:year", name: "blog-year", component: () => import("../views/Blog/ArchiveView.vue") },
      { path: "categories/:category", name: "blog-category", component: () => import("../views/Blog/ArchiveView.vue") },
      { path: "reading", name: "blog-reading", component: () => import("../views/Blog/ReadingView.vue") },
      { path: "about", name: "blog-about", component: () => import("../views/Blog/AboutView.vue") },
    ],
  },
  { path: "/Blog", redirect: "/blog" },
  { path: "/archives", redirect: "/blog/archives" },
  { path: "/archives/:year", redirect: (to) => `/blog/archives/${to.params.year}` },
  { path: "/reading", redirect: "/blog/reading" },
  { path: "/about", redirect: "/blog/about" },
  { path: "/study/notebook/:pathMatch(.*)*", component: () => import("../views/Blog/LegacyBlogRedirect.vue") },
  { path: "/:year(2018|2019)/:month/:day/:pathMatch(.*)*", component: () => import("../views/Blog/LegacyBlogRedirect.vue") },
  {
    path: "/message",
    redirect: "/blog/articles/fund-tools-evolution",
  },
  {
    path: "/fundHoldInfoMsg",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "持仓明细" },
    children: [{ path: "", name: "fundHoldInfoMsg", component: () => import("../views/Message/FundHoldInfo.vue") }],
  },
  {
    path: "/newsArticle",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "资讯文章" },
    children: [{ path: "", name: "newsArticle", component: () => import("../views/Message/NewsArticle.vue") }],
  },
  // 旧版基金工具（买入建议/三代持仓分析）已归档，详见博客 fund-tools-evolution
  {
    path: "/fundPilot",
    redirect: "/blog/articles/fund-tools-evolution",
  },
  {
    path: "/fundPilotPlus",
    redirect: "/blog/articles/fund-tools-evolution",
  },
  {
    path: "/fundPilotV1",
    redirect: "/blog/articles/fund-tools-evolution",
  },
  {
    path: "/cryptocurrency",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "加密货币分析" },
    children: [{ path: "", name: "cryptocurrency", component: () => import("../views/Message/Cryptocurrency.vue") }],
  },
  {
    path: "/contract-review",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "合约复盘", product: "Investment OS" },
    children: [{ path: "", name: "contract-review", component: () => import("../views/crypto/ContractReviewView.vue") }],
  },
  {
    path: "/welfare",
    redirect: () => ({ path: "/", query: { tab: "welfare" } }),
  },
  {
    path: "/advanced-search",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "高级搜索" },
    children: [{ path: "", name: "advanced-search", component: () => import("../views/home/advancedSearch/index.vue") }],
  },
  // 旧职业信息消费页面已归档为博客文章，历史链接继续可用。
  { path: "/tech-forum", redirect: "/blog/articles/career-tools-evolution" },
  { path: "/github-trending", redirect: "/blog/articles/career-tools-evolution" },
  { path: "/leetcode", redirect: "/blog/articles/career-tools-evolution" },
  { path: "/interview", redirect: "/blog/articles/interview-knowledge-archive" },
  {
    path: "/investment",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "基金复盘助手", product: "基金复盘助手" },
    children: [
      {
        path: "",
        component: () => import("../views/investment/OSLayout.vue"),
        children: [
          { path: "", name: "os-console", component: () => import("../views/investment/ConsoleView.vue"), meta: { title: "总览", product: "基金复盘助手" } },
          { path: "review", name: "os-review", component: () => import("../views/investment/ReviewView.vue"), meta: { title: "复盘", product: "基金复盘助手" } },
          { path: "portfolio", name: "os-portfolio", component: () => import("../views/investment/PortfolioView.vue"), meta: { title: "持仓", product: "基金复盘助手" } },
          { path: "policies", name: "os-policies", component: () => import("../views/investment/PoliciesView.vue"), meta: { title: "纪律", product: "基金复盘助手" } },
          { path: "actions", name: "os-actions", component: () => import("../views/investment/ActionsView.vue"), meta: { title: "待办", product: "基金复盘助手" } },
          { path: "data", name: "os-data", component: () => import("../views/investment/DataView.vue"), meta: { title: "采集", product: "基金复盘助手" } },
          { path: "evidence", name: "os-evidence", component: () => import("../views/investment/EvidenceView.vue"), meta: { title: "明细", product: "基金复盘助手" } },
        ],
      },
    ],
  },
  { path: "/boss-zhipin", redirect: "/blog/articles/career-decision-system" },
  {
    path: "/pending",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "功能待完善" },
    children: [
      {
        path: "",
        name: "pending-feature",
        component: () => import("../views/home/pendingFeature/index.vue"),
      },
    ],
  },
  {
    path: "/live2d",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "看板娘" },
    children: [
      {
        path: "",
        name: "live2d",
        component: () => import("../views/home/live2d/index.vue"),
      },
    ],
  },
  {
    path: "/devtools",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "开发工具" },
    children: [
      {
        path: "",
        component: () => import("../views/home/devtools/index.vue"),
        children: [
          { path: "", redirect: "/devtools/text-compress" },
          {
            path: "text-compress",
            name: "devtools-text-compress",
            component: () => import("../views/home/devtools/TextCompress.vue"),
            meta: { title: "文本压缩", product: "开发工具" },
          },
          {
            path: "qr-code-gen",
            name: "devtools-qr-code-gen",
            component: () => import("../views/home/devtools/QrCodeGen.vue"),
            meta: { title: "文本转二维码", product: "开发工具" },
          },
          {
            path: "json-formatter",
            name: "devtools-json-formatter",
            component: () => import("../views/home/devtools/JsonFormatter.vue"),
            meta: { title: "JSON 格式化", product: "开发工具" },
          },
        ],
      },
    ],
  },
  { path: "/", name: "home", component: () => import("../views/home/index.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (!to.meta?.title) { document.title = "随风而逝"; return; }
  document.title = `${to.meta.title} · ${to.meta.product ?? "随风而逝"}`;
});

export default router;
