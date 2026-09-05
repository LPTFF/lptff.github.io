<template>
  <div :class="isPCRes ? '' : 'outer-container'">
    <div @scroll="handleScroll" :class="isPCRes ? 'scroll-home-container' : 'inner-container'" :style="containerStyle">
      <div class="news-aggregator">
        <el-header class="header-el">
          <div class="common-flex">
            <div class="header-div" @click="goBack">
              <img :src="logoUrl" alt="作者" class="logo-img" />
              <div class="logo-title">tangff</div>
            </div>
          </div>
          <el-menu class="navigation" mode="horizontal" :ellipsis="false" :default-active="selectIndex" @select="handleSelect">
            <el-menu-item
              v-for="item in menuConfig"
              :key="item.key"
              :index="item.key"
              @mouseenter="preloadTab(item.key)"
              @focus="preloadTab(item.key)"
            >
              {{ item.label }}
            </el-menu-item>
          </el-menu>
        </el-header>
        <el-main class="main-content">
          <div class="component-div">
            <div class="tab-stage" :class="{ 'is-switching': isTabSwitching }">
              <div class="tab-progress" aria-hidden="true"></div>
              <Transition name="tab-loading-fade">
                <div
                  v-if="isTabSwitching"
                  class="tab-loading tab-loading-overlay"
                  role="status"
                  aria-live="polite"
                >
                  <div class="loading-heading"></div>
                  <div v-for="index in 4" :key="index" class="loading-card">
                    <div class="loading-date"></div>
                    <div class="loading-copy">
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                  <span class="sr-only">正在加载{{ currentTabLabel }}</span>
                </div>
              </Transition>
              <Suspense @pending="handleTabPending" @resolve="handleTabResolved">
                <Transition
                  name="tab-content"
                  mode="out-in"
                  @after-enter="handleTabResolved"
                >
                  <KeepAlive :max="5">
                    <component
                      :is="currentComponent"
                      :key="selectIndex"
                      v-bind="currentComponentProps"
                    />
                  </KeepAlive>
                </Transition>
                <template #fallback>
                  <div class="tab-placeholder" aria-hidden="true"></div>
                </template>
              </Suspense>
            </div>
          </div>
        </el-main>
        <el-footer class="footer" @click="gotoIssue">
          <div class="footer-text">
            评论功能暂不支持，如有问题请提issue © {{ currentYear }}
          </div>
        </el-footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  defineAsyncComponent,
  nextTick,
  type Component,
} from "vue";
import { isPC, gotoOutPage, initEruda } from "../../utils/utils";
import { useRoute, useRouter } from "vue-router";
import logoUrl from "../../assets/logo.jpg";
import {
  ElMenu,
  ElMenuItem,
  ElHeader,
  ElFooter,
  ElMain,
} from "element-plus";

type TabKey = "guide" | "pojie" | "tools" | "entertainment" | "welfare";
type TabModule = { default: Component };

const tabLoaders: Record<TabKey, () => Promise<TabModule>> = {
  guide: () => import("./guide/index.vue"),
  pojie: () => import("./52pojie/index.vue"),
  tools: () => import("./tools/index.vue"),
  entertainment: () => import("./entertainment/index.vue"),
  welfare: () => import("./welfare/index.vue"),
};

const createAsyncTab = (key: TabKey) =>
  defineAsyncComponent({
    loader: tabLoaders[key],
    suspensible: true,
    timeout: 30_000,
  });

// 子组件继续按需分包；用户指向标签时提前请求目标分包。
const menuConfig = [
  {
    key: "guide",
    label: "热门资讯",
    component: createAsyncTab("guide"),
    propName: "guideLocation",
  },
  {
    key: "pojie",
    label: "吾爱破解",
    component: createAsyncTab("pojie"),
    propName: "pojieLocation",
  },
  {
    key: "tools",
    label: "导航专区",
    component: createAsyncTab("tools"),
  },
  {
    key: "entertainment",
    label: "娱乐专区",
    component: createAsyncTab("entertainment"),
    propName: "entertainmentLocation",
  },
  {
    key: "welfare",
    label: "薅羊毛",
    component: createAsyncTab("welfare"),
    propName: "welfareLocation",
  },
];

const previousRoute = ref("");
const isPCRes = computed(() => isPC());
const route = useRoute();
const router = useRouter();
const requestedTab = route.query.tab ? String(route.query.tab) : "";
const queryTab = requestedTab === "douban" ? "entertainment" : requestedTab;
const defaultTab = menuConfig.some((item) => item.key === queryTab)
  ? queryTab
  : "tools";
const selectIndex = ref(defaultTab);
const isTabSwitching = ref(true);
const currentTabLabel = computed(
  () => menuConfig.find((item) => item.key === selectIndex.value)?.label || "栏目"
);

const preloadTab = (key: string) => {
  const loader = tabLoaders[key as TabKey];
  if (loader) void loader();
};

const handleTabPending = () => {
  isTabSwitching.value = true;
};

const handleTabResolved = () => {
  window.requestAnimationFrame(() => {
    isTabSwitching.value = false;
  });
};

const lastClickTime = ref(0);
let clickTimer: ReturnType<typeof setTimeout>;
let erudaInitialized = false;

const goBack = () => {
  const nowTime = Date.now();
  if (nowTime - lastClickTime.value < 300) {
    lastClickTime.value = 0;
    clearTimeout(clickTimer);
    if (!erudaInitialized) {
      initEruda();
      erudaInitialized = true;
    }
  } else {
    lastClickTime.value = nowTime;
    clickTimer = setTimeout(() => {
      previousRoute.value ? router.back() : router.push("/");
    }, 400);
  }
};

const handleSelect = (key: string) => {
  if (key === selectIndex.value) return;
  preloadTab(key);
  isTabSwitching.value = true;
  const currentItem = menuConfig.find((item) => item.key === key);
  document.title = currentItem?.label || "";
  selectIndex.value = key;
  void router.replace({
    path: "/",
    query: { ...route.query, tab: key },
  }).then(() => {
    document.title = currentItem?.label || "";
  });
  const locationInfo = sessionStorage.getItem(`scrollInfoLocation-${key}`);
  const container = document.querySelector(
    isPCRes.value ? ".scroll-home-container" : ".inner-container"
  );
  if (container) {
    container.scrollTo({
      top: locationInfo ? Number(JSON.parse(locationInfo)) : 0,
      behavior: "auto",
    });
  }
  void scrollActiveMenuIntoView();
};

const scrollActiveMenuIntoView = async () => {
  await nextTick();
  const navigation = document.querySelector<HTMLElement>(".navigation");
  const activeItem = navigation?.querySelector<HTMLElement>(".is-active");
  if (!navigation || !activeItem) return;
  navigation.scrollTo({
    behavior: "smooth",
    left: Math.max(0, activeItem.offsetLeft - (navigation.clientWidth - activeItem.clientWidth) / 2),
  });
};

const gotoIssue = () => {
  const issueUrl = window.location.hostname.includes("gitee.io")
    ? "https://gitee.com/love-tff/love-tff/issues"
    : "https://github.com/LPTFF/lptff.github.io/issues";
  gotoOutPage(issueUrl);
};

onMounted(() => {
  const requestedTab = route.query.tab ? String(route.query.tab) : "";
  const currentTab = requestedTab === "douban" ? "entertainment" : requestedTab;
  if (currentTab && menuConfig.some((item) => item.key === currentTab)) {
    selectIndex.value = currentTab;
  }
  previousRoute.value = window.history.state?.back ?? "";
  document.title = menuConfig.find((item) => item.key === selectIndex.value)?.label || "";
  void scrollActiveMenuIntoView();
});

onUnmounted(() => {
  clearTimeout(clickTimer);
});

const contentLocation = ref(0);
let currentScroll = 0;
let previousScroll = 0;

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight } = target;
  sessionStorage.setItem(`scrollInfoLocation-${selectIndex.value}`, JSON.stringify(scrollTop));
  currentScroll = scrollHeight - scrollTop;
  if (currentScroll - previousScroll < 0) {
    contentLocation.value = Math.floor(isPCRes.value ? scrollTop / 200 : scrollTop / 100);
  }
  previousScroll = currentScroll;
};

const containerStyle = computed(() => ({
  height: `${window.innerHeight - 16}px`,
}));

// 当前激活的懒加载组件
const currentComponent = computed(() =>
  menuConfig.find((item) => item.key === selectIndex.value)?.component
);

// 当前组件需要传入的 props（无 location prop 的组件传空对象）
const currentComponentProps = computed(() => {
  const propName = menuConfig.find((item) => item.key === selectIndex.value)?.propName;
  return propName ? { [propName]: contentLocation.value } : {};
});

// 北京时间年份，静态值无需响应式
const currentYear = new Date(
  Date.now() + (8 * 60 - new Date().getTimezoneOffset()) * 60000
).getFullYear();
</script>

<style scoped>
.outer-container {
  width: 97vw;
  height: 97vh;
  position: relative;
  overflow: hidden;
}

.inner-container {
  position: absolute;
  left: 0;
  top: 0;
  right: -17px;
  bottom: 0;
  overflow-x: hidden;
  overflow-y: scroll;
}

.scroll-home-container {
  height: 921px;
  overflow: auto;
}

.header-el {
  height: fit-content;
  position: fixed;
  z-index: 9;
  background-color: var(--el-menu-bg-color);
  width: 100%;
  max-width: 1200px;
}

.logo-title {
  margin: auto 0;
  color: rgb(44, 62, 80);
  font-weight: 600;
  font-size: 21px;
}

.header-div {
  padding: 11px 0px;
  display: flex;
}

.common-flex {
  display: flex;
  justify-content: space-between;
}

.logo-img {
  width: 35px;
  height: 35px;
  margin-right: 10px;
  border-radius: 50%;
}

.news-aggregator {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.navigation {
  line-height: 80px;
  overflow-x: auto;
  scrollbar-width: none;
}

.navigation::-webkit-scrollbar {
  display: none;
}

.footer {
  padding: 20px;
  text-align: center;
  background-color: rgb(255, 255, 255);
  position: static;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
}

.footer-text {
  margin-bottom: 10px;
  color: #666;
}

.component-div {
  margin-bottom: 40px;
}

.tab-stage {
  position: relative;
  min-height: 260px;
}

.tab-progress {
  position: absolute;
  z-index: 2;
  top: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  overflow: hidden;
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.tab-progress::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(90deg, transparent, #409eff 42%, #79bbff 58%, transparent);
  transform: translateX(-100%);
}

.tab-stage.is-switching .tab-progress {
  opacity: 1;
}

.tab-stage.is-switching .tab-progress::after {
  animation: tab-progress 0.9s ease-in-out infinite;
}

.tab-content-enter-active,
.tab-content-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tab-content-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-content-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.tab-loading {
  padding: 4px 0;
  animation: tab-fade-in 0.18s ease both;
}

.tab-loading-overlay {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  min-height: 480px;
  background: #fff;
}

.tab-placeholder {
  min-height: 480px;
}

.tab-loading-fade-enter-active,
.tab-loading-fade-leave-active {
  transition: opacity 0.16s ease;
}

.tab-loading-fade-enter-from,
.tab-loading-fade-leave-to {
  opacity: 0;
}

.loading-heading,
.loading-date,
.loading-copy span {
  position: relative;
  overflow: hidden;
  background: #edf1f5;
}

.loading-heading::after,
.loading-date::after,
.loading-copy span::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  transform: translateX(-100%);
  animation: skeleton-shimmer 1.25s ease-in-out infinite;
}

.loading-heading {
  width: 180px;
  height: 24px;
  margin-bottom: 16px;
  border-radius: 7px;
}

.loading-card {
  display: flex;
  min-height: 96px;
  margin-bottom: 10px;
  padding: 18px;
  align-items: center;
  gap: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.loading-date {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 8px;
}

.loading-copy {
  display: flex;
  width: min(640px, 70%);
  flex-direction: column;
  gap: 12px;
}

.loading-copy span {
  height: 14px;
  border-radius: 999px;
}

.loading-copy span:last-child {
  width: 62%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes tab-progress {
  to {
    transform: translateX(100%);
  }
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@keyframes tab-fade-in {
  from {
    opacity: 0;
  }
}

.main-content {
  padding-top: 135px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-el {
    position: fixed;
    z-index: 9999;
    width: 100%;
    background-color: var(--el-menu-bg-color);
    top: 0;
    left: 0;
  }

  .main-content {
    padding-top: 115px;
  }

  .navigation :deep(.el-menu-item) {
    flex-shrink: 0;
    padding: 0 18px;
  }

  .tab-stage {
    min-height: 220px;
  }

  .tab-loading-overlay,
  .tab-placeholder {
    min-height: 400px;
  }

  .loading-card {
    min-height: 82px;
    padding: 14px;
    gap: 14px;
  }

  .loading-date {
    width: 48px;
    height: 48px;
  }

  .loading-copy {
    width: calc(100% - 62px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-progress::after,
  .loading-heading::after,
  .loading-date::after,
  .loading-copy span::after {
    animation: none;
  }

  .tab-content-enter-active,
  .tab-content-leave-active,
  .tab-loading-fade-enter-active,
  .tab-loading-fade-leave-active,
  .tab-progress {
    transition-duration: 0.01ms;
  }
}
</style>
