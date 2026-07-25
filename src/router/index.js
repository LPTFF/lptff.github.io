import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/foo", redirect: "/" },
  { path: "/job", name: "job", component: () => import("../views/job/index.vue") },
  { path: "/life", name: "life", component: () => import("../views/life/index.vue") },
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
  { path: "/message", name: "message", component: () => import("../views/Message/index.vue") },
  { path: "/fundHoldInfoMsg", name: "fundHoldInfoMsg", component: () => import("../views/Message/FundHoldInfo.vue") },
  { path: "/newsArticle", name: "newsArticle", component: () => import("../views/Message/NewsArticle.vue") },
  { path: "/loginFund", name: "loginFund", component: () => import("../views/Login/FundLogin.vue") },
  { path: "/fundPilot", name: "fundPilot", component: () => import("../views/Message/FundPilot.vue") },
  { path: "/fundPilotPlus", name: "fundPilotPlus", component: () => import("../views/Message/FundPilotPlus.vue") },
  { path: "/fundPilotV1", name: "fundPilotV1", component: () => import("../views/Message/FundPilotV1.vue") },
  { path: "/cryptocurrency", name: "cryptocurrency", component: () => import("../views/Message/Cryptocurrency.vue") },
  {
    path: "/welfare",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "薅羊毛" },
    children: [{ path: "", name: "welfare", component: () => import("../views/home/welfare/index.vue") }],
  },
  {
    path: "/advanced-search",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "高级搜索" },
    children: [{ path: "", name: "advanced-search", component: () => import("../views/home/advancedSearch/index.vue") }],
  },
  {
    path: "/tech-forum",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "技术论坛" },
    children: [{ path: "", name: "tech-forum", component: () => import("../views/home/news/index.vue") }],
  },
  {
    path: "/github-trending",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "GitHub Trending" },
    children: [{ path: "", name: "github-trending", component: () => import("../views/home/githubTrending/index.vue") }],
  },
  {
    path: "/leetcode",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "LeetCode" },
    children: [{ path: "", name: "leetcode", component: () => import("../views/home/leetCode/index.vue") }],
  },
  {
    path: "/interview",
    component: () => import("../views/home/StandaloneFeatureLayout.vue"),
    meta: { title: "面试题" },
    children: [{ path: "", name: "interview", component: () => import("../views/home/findJob/index.vue") }],
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

export default router;
