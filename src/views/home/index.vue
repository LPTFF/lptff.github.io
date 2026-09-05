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
            <el-menu-item v-for="item in menuConfig" :key="item.key" :index="item.key">
              {{ item.label }}
            </el-menu-item>
          </el-menu>
        </el-header>
        <el-main class="main-content">
          <div class="component-div">
            <component :is="currentComponent" v-bind="currentComponentProps" />
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
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent, nextTick } from "vue";
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

// 子组件懒加载，按需分包，减少首屏加载体积
const menuConfig = [
  {
    key: "guide",
    label: "热门资讯",
    component: defineAsyncComponent(() => import("./guide/index.vue")),
    propName: "guideLocation",
  },
  {
    key: "pojie",
    label: "吾爱破解",
    component: defineAsyncComponent(() => import("./52pojie/index.vue")),
    propName: "pojieLocation",
  },
  {
    key: "tools",
    label: "导航专区",
    component: defineAsyncComponent(() => import("./tools/index.vue")),
  },
  {
    key: "entertainment",
    label: "娱乐专区",
    component: defineAsyncComponent(() => import("./entertainment/index.vue")),
    propName: "entertainmentLocation",
  },
  {
    key: "welfare",
    label: "薅羊毛",
    component: defineAsyncComponent(() => import("./welfare/index.vue")),
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
}
</style>
