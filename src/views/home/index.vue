<template>
  <div :class="isPCRes ? '' : 'outer-container'">
    <div
      @scroll="handleScroll"
      :class="isPCRes ? 'scroll-home-container' : 'inner-container'"
      :style="containerStyle"
    >
      <div class="news-aggregator">
        <el-header class="header-el">
          <div class="common-flex">
            <div class="header-div" @click="goBack">
              <img :src="logoUrl" alt="作者" class="logo-img" />
              <div class="logo-title">tangff</div>
            </div>
            <div v-if="false">
              <el-button type="success" round @click="gotoJob">工作</el-button>
              <el-button type="success" round @click="gotoBlog">博客</el-button>
            </div>
          </div>
          <el-menu
            class="navigation"
            mode="horizontal"
            :default-active="selectIndex"
            @select="handleSelect"
          >
            <el-menu-item index="0">热门资讯</el-menu-item>
            <el-menu-item index="1">吾爱破解</el-menu-item>
            <el-menu-item index="2">薅羊毛</el-menu-item>
            <el-menu-item index="3">豆瓣电影</el-menu-item>
            <el-menu-item index="4">导航专区</el-menu-item>
            <el-menu-item index="5">技术论坛</el-menu-item>
            <el-menu-item index="6">Boss直聘</el-menu-item>
            <el-menu-item index="7">LeetCode</el-menu-item>
            <el-menu-item index="8">面试题</el-menu-item>
            <el-menu-item index="9">高级搜索</el-menu-item>
            <el-menu-item index="10">GitHubTrending</el-menu-item>
          </el-menu>
        </el-header>
        <el-main class="main-content">
          <div class="component-div" v-if="selectIndex === '0'">
            <guideComponent :guideLocation="contentLocation"></guideComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '1'">
            <pojieComponent :pojieLocation="contentLocation"></pojieComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '2'">
            <welfareComponent :welfareLocation="contentLocation"></welfareComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '3'">
            <doubanComponent :doubanLocation="contentLocation"></doubanComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '4'">
            <toolsComponent></toolsComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '5'">
            <newsComponent :newsLocation="contentLocation"></newsComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '6'">
            <bossZhipinComponent></bossZhipinComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '7'">
            <leetCodeComponent></leetCodeComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '8'">
            <findJobComponent></findJobComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '9'">
            <advancedSearchComponent
              :newsLocation="contentLocation"
            ></advancedSearchComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '10'">
            <githubTrendingComponent
              :githubTrendingLocation="contentLocation"
            ></githubTrendingComponent>
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
import { ref, onMounted, computed, Ref } from "vue";
import { isPC, gotoOutPage, initEruda } from "../../utils/utils";
import leetCodeComponent from "./leetCode/index.vue";
import doubanComponent from "./douban/index.vue";
import newsComponent from "./news/index.vue";
import toolsComponent from "./tools/index.vue";
import welfareComponent from "./welfare/index.vue";
import bossZhipinComponent from "./bossZhipin/index.vue";
import guideComponent from "./guide/index.vue";
import findJobComponent from "./findJob/index.vue";
import advancedSearchComponent from "./advancedSearch/index.vue";
import pojieComponent from "./52pojie/index.vue";
import githubTrendingComponent from "./githubTrending/index.vue";
import { useRouter } from "vue-router";
import logoImageUrl from "../../public/img/logo.jpg";
// import "element-plus/theme-chalk/index.css";
import {
  ElCol,
  ElMenu,
  ElMenuItem,
  ElHeader,
  ElFooter,
  ElMain,
  ElButton,
} from "element-plus";
export default {
  setup() {
    const previousRoute = ref("");
    const isPCRes = computed(() => isPC());
    const router = useRouter();
    const selectIndex = isPCRes.value ? ref("4") : ref("0"); //默认首页

    const callMethod = () => {
      // console.log('233');
    };
    const lastClickTime: Ref<number> = ref(0);
    let clickTimer: ReturnType<typeof setTimeout>;
    const erudaInitialized = ref(false);
    const goBack = () => {
      const nowTime = new Date().getTime();
      if (nowTime - lastClickTime.value < 300) {
        /**/
        lastClickTime.value = 0;
        clickTimer && clearTimeout(clickTimer);
        console.log("双击1");
        if (!erudaInitialized.value) {
          console.log("双击2");
          initEruda();
          erudaInitialized.value = true;
        }
      } else {
        /**/
        lastClickTime.value = nowTime;
        clickTimer = setTimeout(() => {
          console.log("单击");
          previousRoute.value ? router.back() : router.push("/");
        }, 400);
      }
    };
    const gotoJob = () => {
      let url = window.location.origin + "/job";
      window.open(url, "_blank");
    };
    const gotoBlog = () => {
      let url = window.location.origin + "/blog";
      window.open(url, "_blank");
    };

    const handleSelect = (key: any) => {
      selectIndex.value = key;
      let locationInfoInit = sessionStorage.getItem(`scrollInfoLocation${key}`);
      locationInfoInit = locationInfoInit
        ? JSON.parse(locationInfoInit)
        : locationInfoInit;
      const container = document.querySelector(
        isPCRes.value ? ".scroll-home-container" : ".inner-container"
      );
      if (container) {
        container.scrollTo({
          top: locationInfoInit ? Number(locationInfoInit) : 0,
          behavior: "auto",
        });
      }
    };

    const gotoIssue = () => {
      const pageUrl = window.location.origin;
      const issueUrl = pageUrl.includes("love-tff.gitee.io")
        ? "https://gitee.com/love-tff/love-tff/issues"
        : "https://github.com/LPTFF/lptff.github.io/issues";
      gotoOutPage(issueUrl);
    };

    onMounted(async () => {
      callMethod();
      previousRoute.value = window.history.state ? window.history.state.back : "";
    });
    const logoUrl = ref(logoImageUrl); // 图片路径变量
    let contentLocation = ref(0);
    let currentScroll = 0;
    let previousScroll = 0;
    const handleScroll = (event: any) => {
      let scrollLocation = event.target.scrollTop;
      sessionStorage.setItem(
        `scrollInfoLocation${selectIndex.value}`,
        JSON.stringify(scrollLocation)
      );
      currentScroll = event.target.scrollHeight - event.target.scrollTop;
      if (currentScroll - previousScroll < 0) {
        //向下滚动
        contentLocation.value = Math.floor(
          isPCRes.value ? event.target.scrollTop / 200 : event.target.scrollTop / 100
        );
      }
      previousScroll = currentScroll;
    };
    const containerStyle = computed(() => {
      return {
        height: isPCRes.value
          ? `${window.innerHeight - 16}px`
          : `${window.innerHeight - 16}px`,
      };
    });
    const getCurrentYear = () => {
      const currentDate = new Date();
      // 获取北京时间
      const beijingOffset = 8 * 60; // 北京时间是 UTC+8
      const currentBeijingTime = new Date(
        currentDate.getTime() + (beijingOffset - currentDate.getTimezoneOffset()) * 60000
      );
      return currentBeijingTime.getFullYear();
    };
    const currentYear = ref(getCurrentYear());
    return {
      selectIndex,
      previousRoute,
      isPCRes,
      goBack,
      handleSelect,
      gotoIssue,
      gotoJob,
      logoUrl,
      gotoBlog,
      handleScroll,
      containerStyle,
      contentLocation,
      currentYear,
    };
  },
  components: {
    leetCodeComponent,
    doubanComponent,
    newsComponent,
    toolsComponent,
    welfareComponent,
    bossZhipinComponent,
    guideComponent,
    ElCol,
    ElMenu,
    ElMenuItem,
    ElHeader,
    ElFooter,
    ElMain,
    findJobComponent,
    ElButton,
    advancedSearchComponent,
    pojieComponent,
    githubTrendingComponent,
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
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
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
  /* padding-top: 10px; */
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
