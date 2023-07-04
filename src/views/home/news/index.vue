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
        <div v-if="handleDescType(item) == '1'">
          <a
            class="news-title"
            :href="handleNewsUrl(item)"
            @click.prevent="gotoNewsWebsite(item)"
          >
            {{ item.title }}
          </a>
          <div
            class="news-plus-summary hight-news"
            :style="`background-image: url(${
              item.image ? item.image : bgUrl
            }); background-size: cover;`"
          >
            <div class="news-inner-summary">
              {{
                handleNewsDesc(
                  item.desc ? item.desc : item.title,
                  isPCRes ? 30 : 20
                )
              }}
            </div>
          </div>
          <div class="line-split"></div>
          <div class="news-bottom common-flex">
            <div class="news-bottom">
              <el-avatar
                :size="50"
                class="is-new"
                :src="getWebsiteLogo(item)"
              />
              <span class="website-name">
                {{ getWebsiteName(item) }}
              </span>
            </div>
            <div class="news-source">
              <div class="news-date">
                {{ isPCRes ? item.time : item.time.substring(0, 10) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else>
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
            {{
              handleNewsDesc(
                item.desc ? item.desc : item.title,
                isPCRes ? 240 : 180
              )
            }}
          </div>
          <div class="line-split"></div>
          <div class="news-bottom common-flex">
            <div class="news-bottom">
              <el-avatar
                :size="50"
                class="is-new"
                :src="getWebsiteLogo(item)"
              />
              <span class="website-name">
                {{ getWebsiteName(item) }}
              </span>
            </div>
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
import bgImageUrl from "../../../public/img/bg.jpg";
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
    const handleDescType = (item: any) => {
      return item.desc.length < 130 ? "1" : "2";
    };
    const handleNewsDesc = (item: any, length: any) => {
      return item.substring(0, length) + "...";
    };
    const logoUrl = ref(logoImageUrl); // 图片路径变量
    const bgUrl = ref(bgImageUrl); // 图片路径变量
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
      handleDescType,
      bgUrl,
      handleNewsDesc,
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
.news-plus-title {
  margin-left: 10px;
  margin-bottom: 0px !important;
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
.news-plus-summary {
  display: block;
  height: 320px;
  font-size: 18px;
  font-family: Arial;
  padding-top: 20px;
  padding-bottom: 30px;
}
.news-inner-summary {
  margin-left: 10px;
  margin-top: 290px;
}
.hight-news {
  color: #f9f9f9 !important;
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
  height: 40px;
}
.news-plus-source {
  margin: 0 !important;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
}
</style>
