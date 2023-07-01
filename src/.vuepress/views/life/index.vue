<template>
  <div>
    <div class="news-aggregator">
      <el-header class="header-el">
        <div class="header-div" @click="goBack">
          <img
            class="logo-img"
            src="https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg"
          />
          <div class="logo-title">tangff</div>
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
        </el-menu>
      </el-header>
      <el-main class="main-content">
        <div class="leet-code" v-show="selectIndex === '1'">
          <newsComponent></newsComponent>
        </div>
        <div class="leet-code" v-show="selectIndex === '2'">
          <doubanComponent></doubanComponent>
        </div>
        <div class="leet-code" v-show="selectIndex === '3'">
          <leetCodeComponent></leetCodeComponent>
        </div>
      </el-main>
      <el-footer class="footer" @click="gotoIssue">
        <div class="footer-text">
          评论功能暂不支持，如有问题请提issue © 2023
        </div>
      </el-footer>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed, Teleport } from "vue";
import { isPC, gotoOutPage } from "../../utils/utils";
import leetCodeComponent from "./leetCode/index.vue";
import doubanComponent from "./douban/index.vue";
import newsComponent from "./news/index.vue";
export default {
  data() {
    return {};
  },
  setup() {
    let selectIndex = ref("1");
    const menuItems = [
      { index: "1", text: "首页" },
      { index: "2", text: "豆瓣电影" },
      { index: "3", text: "LeetCode" },
    ];
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref("");

    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
    });
    return {
      callMethod,
      selectIndex,
      isPCRes,
      previousRoute,
      menuItems,
    };
  },
  components: {
    leetCodeComponent,
    doubanComponent,
    newsComponent,
  },
  methods: {
    goBack() {
      this.previousRoute ? this.$router.back() : this.$router.push("/"); // 返回上一个路由，兜底返回主页
    },
    async handleSelect(key) {
      console.log(key);
      this.selectIndex = key;
    },
    gotoIssue() {
      let pageUrl = window.location.origin;
      console.log("pageUrl", pageUrl);
      if (pageUrl.includes("love-tff.gitee.io")) {
        gotoOutPage("https://gitee.com/love-tff/love-tff/issues");
      } else {
        gotoOutPage("https://github.com/LPTFF/lptff.github.io/issues");
      }
    },
  },
};
</script>

<style scoped>
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
.leet-code {
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
  }
  .main-content {
    padding-top: 115px;
  }
}
</style>
