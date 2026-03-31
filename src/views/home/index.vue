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
          <el-menu class="navigation" mode="horizontal" :default-active="selectIndex" @select="handleSelect">
            <el-menu-item
              v-for="(item, index) in menuList"
              :key="index"
              :index="String(index)"
              :ref="el => menuItemRefs[index] = el"
            >
              {{ item }}
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

<script lang="ts">
import { ref, onMounted, computed, defineAsyncComponent, Ref } from "vue";
import { isPC, gotoOutPage, initEruda } from "../../utils/utils";
import { useRouter } from "vue-router";
import logoImageUrl from "../../public/img/logo.jpg";
import {
  ElMenu,
  ElMenuItem,
  ElHeader,
  ElFooter,
  ElMain,
} from "element-plus";

// 子组件懒加载，按需分包，减少首屏加载体积
const componentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  '0': defineAsyncComponent(() => import('./guide/index.vue')),
  '1': defineAsyncComponent(() => import('./52pojie/index.vue')),
  '2': defineAsyncComponent(() => import('./welfare/index.vue')),
  '3': defineAsyncComponent(() => import('./douban/index.vue')),
  '4': defineAsyncComponent(() => import('./tools/index.vue')),
  '5': defineAsyncComponent(() => import('./news/index.vue')),
  '6': defineAsyncComponent(() => import('./bossZhipin/index.vue')),
  '7': defineAsyncComponent(() => import('./leetCode/index.vue')),
  '8': defineAsyncComponent(() => import('./findJob/index.vue')),
  '9': defineAsyncComponent(() => import('./advancedSearch/index.vue')),
  '10': defineAsyncComponent(() => import('./githubTrending/index.vue')),
};

// 各组件对应的 location prop 名称
const propNameMap: Record<string, string> = {
  '0': 'guideLocation',
  '1': 'pojieLocation',
  '2': 'welfareLocation',
  '3': 'doubanLocation',
  '5': 'newsLocation',
  '9': 'newsLocation',
  '10': 'githubTrendingLocation',
};

export default {
  setup() {
    const previousRoute = ref("");
    const isPCRes = computed(() => isPC());
    const router = useRouter();
    const selectIndex = isPCRes.value ? ref("4") : ref("0");
    const menuList = [
      '热门资讯', '吾爱破解', '薅羊毛', '豆瓣电影', '导航专区',
      '技术论坛', 'Boss直聘', 'LeetCode', '面试题', '高级搜索', 'GitHubTrending'
    ];

    const menuItemRefs: any = ref([]);
    const lastClickTime: Ref<number> = ref(0);
    let clickTimer: ReturnType<typeof setTimeout>;
    const erudaInitialized = ref(false);

    const goBack = () => {
      const nowTime = new Date().getTime();
      if (nowTime - lastClickTime.value < 300) {
        lastClickTime.value = 0;
        clickTimer && clearTimeout(clickTimer);
        if (!erudaInitialized.value) {
          initEruda();
          erudaInitialized.value = true;
        }
      } else {
        lastClickTime.value = nowTime;
        clickTimer = setTimeout(() => {
          previousRoute.value ? router.back() : router.push("/");
        }, 400);
      }
    };

    const handleSelect = (key: any) => {
      const elComponent = menuItemRefs.value[Number(key)];
      document.title = elComponent?.$el?.innerText || '';
      selectIndex.value = key;
      const locationInfo = sessionStorage.getItem(`scrollInfoLocation${key}`);
      const container = document.querySelector(
        isPCRes.value ? ".scroll-home-container" : ".inner-container"
      );
      if (container) {
        container.scrollTo({
          top: locationInfo ? Number(JSON.parse(locationInfo)) : 0,
          behavior: "auto",
        });
      }
    };

    const gotoIssue = () => {
      const issueUrl = window.location.origin.includes("love-tff.gitee.io")
        ? "https://gitee.com/love-tff/love-tff/issues"
        : "https://github.com/LPTFF/lptff.github.io/issues";
      gotoOutPage(issueUrl);
    };

    onMounted(() => {
      previousRoute.value = window.history.state?.back ?? "";
    });

    const logoUrl = logoImageUrl;
    const contentLocation = ref(0);
    let currentScroll = 0;
    let previousScroll = 0;

    const handleScroll = (event: any) => {
      const { scrollTop, scrollHeight } = event.target;
      sessionStorage.setItem(`scrollInfoLocation${selectIndex.value}`, JSON.stringify(scrollTop));
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
    const currentComponent = computed(() => componentMap[selectIndex.value]);

    // 当前组件需要传入的 props（无 location prop 的组件传空对象）
    const currentComponentProps = computed(() => {
      const propName = propNameMap[selectIndex.value];
      return propName ? { [propName]: contentLocation.value } : {};
    });

    // 北京时间年份，静态值无需响应式
    const currentYear = new Date(
      Date.now() + (8 * 60 - new Date().getTimezoneOffset()) * 60000
    ).getFullYear();

    return {
      selectIndex,
      previousRoute,
      isPCRes,
      goBack,
      handleSelect,
      gotoIssue,
      logoUrl,
      handleScroll,
      containerStyle,
      contentLocation,
      currentYear,
      menuList,
      menuItemRefs,
      currentComponent,
      currentComponentProps,
    };
  },
  components: {
    ElMenu,
    ElMenuItem,
    ElHeader,
    ElFooter,
    ElMain,
  },
};
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
}

.footer {
  padding: 20px;
  text-align: center;
  background-color: rgb(255, 255, 255);
  position: fixed;
  bottom: 0px;
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
}
</style>
