<template>
  <el-card class="news-card" v-for="(item, index) in newsAll" :key="index">
    <div class="news-content">
      <div class="news-details">
        <a
          class="news-title"
          :href="handleNewsUrl(item)"
          @click.prevent="gotoNewsWebsite(item)"
        >
          {{ item.title }}
        </a>
        <p class="news-summary">
          {{ item.desc ? item.desc : item.title }}
        </p>
        <div class="news-bottom">
          <img class="is-new" :src="getWebsiteLogo(item)" />
          <div v-if="isPCRes" class="website-name">
            {{ getWebsiteName(item) }}
          </div>
          <span class="news-date">{{ item.time }}</span>
        </div>
      </div>
      <div class="news-div-img">
        <img
          class="img-news"
          :src="item.image ? item.image : getWebsiteLogo(item)"
        />
      </div>
    </div>
  </el-card>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import infzmNews from "../../../public/data/newsHandle.json";
import juejinNews from "../../../public/data/juejin.json";
import v2exNews from "../../../public/data/v2ex.json";
export default {
  data() {
    return {};
  },
  setup() {
    let infzmList = ref(infzmNews);
    let juejinList = ref(juejinNews);
    let v2exList = ref(v2exNews);
    let newsAll: any[] = [];
    newsAll = [...infzmList.value, ...juejinList.value, ...v2exList.value];
    newsAll.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref("");
    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    const getWebsiteLogo = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteLogo = "";
      switch (String(item.website)) {
        case "juejin":
          websiteLogo =
            "https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/6c61ae65d1c41ae8221a670fa32d05aa.svg";
          break;
        case "infzm":
          websiteLogo =
            "http://www.infzm.com/web/images/infzm-meta-icon.png?f25705e975f00770a3e8a74f1a08a170";
          break;
        case "v2ex":
          websiteLogo = "https://www.v2ex.com/static/icon-192.png";
          break;
        default:
          // 当 expression 的值与所有的 case 不匹配时执行的代码块
          websiteLogo =
            "https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg";
      }
      return websiteLogo;
    };
    const getWebsiteName = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteName = "";
      switch (String(item.website)) {
        case "juejin":
          websiteName = "掘金";
          break;
        case "infzm":
          websiteName = "南方周末";
          break;
        case "v2ex":
          websiteName = "V2EX";
          break;
        default:
          websiteName = "随风而逝";
      }
      return websiteName;
    };
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
    });
    const handleNewsUrl = (item: any) => {
      let data = isPC();
      let handleUrl = "";
      switch (item.website) {
        case "infzm":
          handleUrl = data
            ? `https://www.infzm.com/contents/${item.url}`
            : `https://www.infzm.com/wap/#/content/${item.url}?source=133&source_1=1`;
          break;
        case "juejin":
        case "v2ex":
          handleUrl = item.url;
          break;
        default:
          break;
      }
      return handleUrl || ""; // 返回空字符串表示无效的URL
    };
    const gotoNewsWebsite = (item: any) => {
      console.log(item);
      const url = handleNewsUrl(item);
      if (url) {
        gotoOutPage(url);
      }
    };
    return {
      callMethod,
      isPCRes,
      previousRoute,
      newsAll,
      getWebsiteLogo,
      getWebsiteName,
      handleNewsUrl,
      gotoNewsWebsite,
    };
  },
  methods: {},
};
</script>

<style scoped>
.news-card {
  margin-bottom: 20px;
}

.news-content {
  display: flex;
  justify-content: space-between;
}

.news-div-img {
  margin: auto;
}

.img-news {
  width: 200px;
  height: 200px;
}

.news-details {
  padding: 20px;
  width: 900px;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  height: 100%;
}

.news-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: rgb(48, 49, 51) !important;
}

.news-summary {
  color: #666;
  margin-bottom: 10px;
  height: 100px;
  width: 800px;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
}

.news-date {
  color: #999;
}

.website-name {
  margin: 0 10px 0 5px;
}

.news-bottom {
  display: flex;
}

.is-new {
  margin: 5px 5px;
  width: 16px;
  height: 16px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .news-summary {
    color: #666;
    margin-bottom: 10px;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }

  .img-news {
    width: 100px;
    height: 100px;
  }

  .news-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0px;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }

  .news-bottom {
    display: flex;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }
}
</style>
