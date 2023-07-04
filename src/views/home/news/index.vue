<template>
  <el-row>
    <el-col
      :span="24"
      :md="8"
      :lg="8"
      v-for="(item, index) in newsAll"
      :key="index"
    >
      <el-card class="news-card" shadow="hover">
        <a
          class="news-title"
          :href="handleNewsUrl(item)"
          @click.prevent="gotoNewsWebsite(item)"
        >
          {{ item.title }}
        </a>
        <div class="news-source">
          <el-avatar
            :size="50"
            class="img-news"
            :src="item.image ? item.image : logoUrl"
          />
          <div class="news-date">{{ item.time }}</div>
        </div>
        <div class="news-summary">
          {{ item.desc ? item.desc : item.title }}
        </div>
        <div class="line-split"></div>
        <div class="news-bottom common-flex">
          <div class="news-bottom">
            <el-avatar :size="50" class="is-new" :src="getWebsiteLogo(item)" />
            <span class="website-name">
              {{ getWebsiteName(item) }}
            </span>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import infzmNews from "../../../public/data/newsHandle.json";
import juejinNews from "../../../public/data/juejin.json";
import v2exNews from "../../../public/data/v2ex.json";
import logoImageUrl from "../../../public/img/logo.jpg";
export default {
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
    const logoUrl = ref(logoImageUrl); // 图片路径变量
    return {
      callMethod,
      isPCRes,
      previousRoute,
      newsAll,
      getWebsiteLogo,
      getWebsiteName,
      handleNewsUrl,
      gotoNewsWebsite,
      logoUrl,
    };
  },
  methods: {},
};
</script>

<style scoped>
.news-card {
  margin-bottom: 20px;
  height: 482px;
  margin-right: 20px;
}

.news-content {
  display: flex;
  justify-content: space-between;
}

.news-div-img {
  margin: auto;
}

.img-news {
  width: 40px;
  height: 40px;
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
  display: block;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: rgb(48, 49, 51) !important;
  text-decoration: none;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
  max-width: 300px;
}

.news-summary {
  display: block;
  margin: 0;
  height: 320px;
  font-size: 18px;
  font-family: Arial;
  overflow: hidden; /* 隐藏溢出部分 */
  text-overflow: ellipsis; /* 显示省略号 */
}

.news-date {
  color: #999;
  margin: auto 10px;
}

.website-name {
  margin: auto 10px;
  font-size: 18px;
  font-weight: 600;
  color: #459cd8;
}

.line-split {
  width: 100%;
  height: 1px;
  background-color: #f9f9f9;
  margin-bottom: 5px;
}
.news-bottom {
  display: flex;
}
.el-div-icon {
}
.common-flex {
  justify-content: space-between;
}
.is-new {
  margin: 5px 5px;
  width: 40px;
  height: 40px;
}
.news-source {
  display: flex;
  margin: 10px 0px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
}
</style>
