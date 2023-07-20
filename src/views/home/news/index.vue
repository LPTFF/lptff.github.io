<template>
  <el-row>
    <el-col
      :span="24"
      :md="8"
      :lg="8"
      v-for="(item, index) in newsAllLimited"
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
          <div class="background-container">
            <img
              class="news-img-inner"
              :src="handleCoverImg(item)"
              @error="handleImageError"
              referrerPolicy="no-referrer"
              alt="网站"
            />
          </div>
          <div class="line-split line-add-split"></div>
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
                isPCRes ? 230 : 180
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
import juejinNews from "../../../public/data/juejin.json";
import v2exNews from "../../../public/data/v2ex.json";
import logoImageUrl from "../../../public/img/logo.jpg";
import bgImageUrl from "../../../public/img/bg.jpg";
export default {
  props: {
    newsLocation: [String, Number],
  },
  setup(props: any) {
    let juejinList = ref(juejinNews);
    let v2exList = ref(v2exNews);
    let newsAll: any[] = [];
    newsAll = [...juejinList.value, ...v2exList.value];
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
          websiteLogo =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADg0lEQVR4AWKAgf///7NeuXJl47Fjx77t2bPn37Zt2/5t2bIF0HsZtcIWRmF4fgoREodSiogIIEq59lP8D3fuKeeOcTfDDSFNSSKKCwAAA77Tc/HsOs03xpGOenrX7LW+9a6997d3dvgJ6EVPeuOBV2LM3/b29q/l5eU8xf+DpaWlPJ7JmXOARDqdDkdHR+Hx8TG8v7+Hj48PAY+hxuqnvL290ZPeeCRD4J3ikmh+e3v7ZcNIXj6tx8Mh8E5xX/hxeHhIAdOG19dXMEaN1Sil6onxwAtPvFNsDn48PDwkxS8vL2CMRjEXr4/n8cALT7xT7naTFkM+n1eN1W/BWj18OlIEQAI0g+fnZ9VY/Tb66Jsy8ApoABMTE6G8vDxAWVmZapwo1NTUhKmpKdbHBjb2NscHgKenp4TKyspQUVEBxOqnTE9Puz6GeyI+AAmKeGahqqoqVFdXRyGnisdmZ2ftoxrjEb8CJIAd6oLa2tpvUV9fH+bn5+lhP9GncADvEwuERnV1dWCMRjFnfVNTU8hms/YSn4biA9zf3yc0NjYmNDQ0qMZqFHKtra1hdXWVXoJHfAB3KUV3d3dgcUkODg7C0NAQZ11AV1dXyOVy9i06AObAu9oBSr4HjNH9/f3Q29sbmpubC2C4q6sretsrPgC7lKKbmxswRo2jeYblKgwODoaWlpYCRkZGSg6AOdDwn9nZ2QljY2Ohra0tob29HeXsw9bWFnXh+vpan+IDUCQdHR2hs7MTjNEv09/fHzY3N7n/9iw9AJfK4u7ubjYRGKPGapS+vr6wsrLCo0dP8cVUOAAH4fLyMqGnp+fLsAFVzjyTyWhuP9AnPgALKLq4uAhAo4GBATBGjaN5WFhYoBc97GfM8fgAJFwkbKDh4WEwRqOYm5ubKzgROT8/16f4ABTJ5ORk4BGC0dFR1ThRGB8fDzMzM2w4zaIUHYCFJM7OzgqKv4rm9LCPamydvsm/ZLxMSJyenorHxMXFzDVxfRTqeCck/5ItLi4yQGByDGlycnICLFCN1Sil6umNB1544p3KZrOP/Njb2wskmY6zYMHx8bFqrEbzEqunp69tvPDEO7WxscGHCY8Oxb73o7BY/Q6sxQMvPNfX13+n+DzKZDJ5h9jd3XVaFvwIvFXpSW/N8Uw+UnO53C+H+B/ghWfKPz9SuSTcl3Q6/eOf52w4eq+trf31ef4H8lDJyDc4UgoAAAAASUVORK5CYII=";
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
    let maxLength = 0;
    const newsAllLimited = computed(() => {
      const length: number = Number(props.newsLocation); // 切割长度
      let initData = isPCRes.value ? 6 : 2;
      let newsTmpAll;
      let rate = isPCRes.value ? 2 : 1;
      maxLength < length ? (maxLength = length) : maxLength;
      newsTmpAll = newsAll.slice(
        0,
        maxLength * rate + initData < newsAll.length
          ? maxLength * rate + initData
          : newsAll.length
      );
      return newsTmpAll;
    });
    const handleCoverImg = (item: any) => {
      if (!item.image) {
        console.log("item", item);
      }
      return item.image ? item.image : bgUrl.value;
    };
    const handleImageError = (event: any) => {
      event.target.src = bgUrl.value;
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
      logoUrl,
      handleDescType,
      bgUrl,
      handleNewsDesc,
      newsAllLimited,
      handleCoverImg,
      handleImageError,
    };
  },
};
</script>

<style scoped>
.news-img-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 370px;
  object-fit: cover;
}
.background-container {
  position: relative;
}

.news-card {
  margin-bottom: 20px;
  height: 482px;
  margin-right: 20px;
}

.img-news {
  width: 40px;
  height: 40px;
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
.line-add-split {
  margin-top: 380px;
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

/* 响应式布局 */
@media screen and (max-width: 768px) {
}
</style>
