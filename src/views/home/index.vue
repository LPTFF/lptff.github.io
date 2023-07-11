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
              <el-avatar :size="50" class="logo-img" :src="logoUrl" />
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
            <el-menu-item
              v-for="item in menuItems"
              :key="item.index"
              :index="item.index"
              >{{ item.text }}</el-menu-item
            >
            <el-menu-item index="4" v-if="isPCRes">常用工具</el-menu-item>
            <el-menu-item index="5" v-if="isPCRes">薅羊毛</el-menu-item>
          </el-menu>
        </el-header>
        <el-main class="main-content">
          <div class="component-div" v-show="selectIndex === '1'">
            <newsComponent :newsLocation="contentLocation"></newsComponent>
          </div>
          <div class="component-div" v-show="selectIndex === '2'">
            <doubanComponent
              :doubanLocation="contentLocation"
            ></doubanComponent>
          </div>
          <div class="component-div" v-show="selectIndex === '3'">
            <leetCodeComponent></leetCodeComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '4'">
            <toolsComponent></toolsComponent>
          </div>
          <div class="component-div" v-if="selectIndex === '5'">
            <welfareComponent></welfareComponent>
          </div>
        </el-main>
        <el-footer class="footer" @click="gotoIssue">
          <div class="footer-text">
            评论功能暂不支持，如有问题请提issue © 2023
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
import { useRouter } from "vue-router";
import logoImageUrl from "../../public/img/logo.jpg";
export default {
  setup() {
    const selectIndex = ref("1"); //默认首页
    const menuItems = [
      { index: "1", text: "首页" },
      { index: "2", text: "豆瓣电影" },
      { index: "3", text: "LeetCode" },
    ];
    const previousRoute = ref("");
    const isPCRes = computed(() => isPC());
    const router = useRouter();

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
      console.log("pageUrl", pageUrl);
      const issueUrl = pageUrl.includes("love-tff.gitee.io")
        ? "https://gitee.com/love-tff/love-tff/issues"
        : "https://github.com/LPTFF/lptff.github.io/issues";
      gotoOutPage(issueUrl);
    };

    onMounted(async () => {
      callMethod();
      previousRoute.value = window.history.state
        ? window.history.state.back
        : "";
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
          isPCRes.value
            ? event.target.scrollTop / 200
            : event.target.scrollTop / 100
        );
      }
      previousScroll = currentScroll;
    };
    const containerStyle = computed(() => {
      return {
        height: `${window.innerHeight - 16}px`,
      };
    });
    return {
      selectIndex,
      menuItems,
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
    };
  },
  components: {
    leetCodeComponent,
    doubanComponent,
    newsComponent,
    toolsComponent,
    welfareComponent,
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

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-el {
    position: fixed;
    z-index: 9999;
    width: 100%;
    background-color: var(--el-menu-bg-color);
    top: 0;
  }
  .main-content {
    padding-top: 115px;
  }
}
</style>
