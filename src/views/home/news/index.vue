<template>
  <el-alert
    v-if="v2exSnapshotPreserved"
    class="snapshot-alert"
    :title="`V2EX 当前展示保留快照，最近数据时间 ${v2exLatestTime}，不代表当前热点。`"
    type="warning"
    :closable="false"
    show-icon
  />
  <el-row>
    <el-col :span="24" :md="8" :lg="8" v-for="(item, index) in newsAllLimited" :key="index">
      <el-card class="news-card" shadow="hover">
        <div v-if="handleDescType(item) == '1'">
          <a class="news-title" :href="handleNewsUrl(item)" @click.prevent="gotoNewsWebsite(item)">
            {{ item.title }}
          </a>
          <div class="background-container">
            <img class="news-img-inner" :src="handleCoverImg(item)" @error="handleImageError"
              referrerPolicy="no-referrer" alt="网站" />
          </div>
          <div class="line-split line-add-split"></div>
          <div class="news-bottom common-flex">
            <div class="news-bottom" @click="gotoMainWebsite(item)">
              <el-avatar :size="50" class="is-new" :src="getWebsiteLogo(item)" />
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
          <a class="news-title" :href="handleNewsUrl(item)" @click.prevent="gotoNewsWebsite(item)">
            {{ item.title }}
          </a>
          <div class="news-source">
            <el-avatar :size="50" class="img-news" :src="getWebsiteLogo(item)" />
            <div class="news-date">{{ item.time }}</div>
          </div>
          <div class="news-summary">
            {{ handleNewsDesc(item.desc ? item.desc : item.title, isPCRes ? 230 : 180) }}
          </div>
          <div class="line-split"></div>
          <div class="news-bottom common-flex">
            <div class="news-bottom" @click="gotoMainWebsite(item)">
              <el-avatar :size="50" class="is-new" :src="getWebsiteLogo(item)" />
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
import { ref, computed } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import juejinNews from "../../../public/data/juejin.json";
import meituanNews from "../../../public/data/techForum/meituanTech.json";
import v2exNews from "../../../public/data/v2ex.json";
import bgImageUrl from "../../../public/img/bg.jpg";
import { ElRow, ElCol, ElCard, ElAvatar, ElAlert } from "element-plus";
export default {
  props: {
    newsLocation: [String, Number],
  },
  setup(props: any) {
    const newsAll = [...juejinNews, ...meituanNews, ...v2exNews].sort((a: any, b: any) => b.timestamp - a.timestamp);
    const v2exLatestTimestamp = Math.max(...v2exNews.map((item: any) => Number(item.timestamp) || 0));
    const v2exLatestTime = v2exNews.find((item: any) => item.timestamp === v2exLatestTimestamp)?.time || "未知";
    const v2exSnapshotPreserved = v2exLatestTimestamp < Date.now() - 30 * 24 * 60 * 60 * 1000;
    const isPCRes = computed(() => isPC());
    const getWebsiteInfo = (item: any): any => {
      let websiteInfo = {};
      switch (String(item.website)) {
        case "juejin":
          websiteInfo = {
            name: "掘金",
            mainWebsite: "https://juejin.cn/",
            logo:
              "https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/6c61ae65d1c41ae8221a670fa32d05aa.svg",
          };
          break;
        case "infzm":
          websiteInfo = {
            name: "南方周末",
            mainWebsite: "https://www.infzm.com/",
            logo:
              "http://www.infzm.com/web/images/infzm-meta-icon.png?f25705e975f00770a3e8a74f1a08a170",
          };
          break;
        case "meituan":
          websiteInfo = {
            name: "美团科技",
            mainWebsite: "https://tech.meituan.com/",
            logo:
              "https://s3plus.meituan.net/v1/mss_e2821d7f0cfe4ac1bf9202ecf9590e67/cdn-prod/file:1040877d/favicon-mt.ico",
          };
          break;
        case "v2ex":
          websiteInfo = {
            name: v2exSnapshotPreserved ? "V2EX（保留快照）" : "V2EX",
            mainWebsite: "https://www.v2ex.com/",
            logo: "https://www.v2ex.com/static/icon-192.png",
          };
          break;
        default:
          websiteInfo = {
            name: "随风而逝",
            mainWebsite: "https://lptff.github.io/",
            logo:
              "https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@master/src/public/img/logo.jpg",
          };
      }
      return websiteInfo;
    };
    const getWebsiteLogo = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteInfo = getWebsiteInfo(item);
      return websiteInfo.logo;
    };
    const getWebsiteName = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteInfo = getWebsiteInfo(item);
      return websiteInfo.name;
    };
    const bgUrl = bgImageUrl;
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
        case "meituan":
        case "v2ex":
          handleUrl = item.url;
          break;
        default:
          break;
      }
      return handleUrl || ""; // 返回空字符串表示无效的URL
    };
    const gotoNewsWebsite = (item: any) => {
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
    let maxLength = 0;
    const newsAllLimited = computed(() => {
      if (props.newsLocation === undefined || props.newsLocation === null) {
        return newsAll;
      }
      const length: number = Number(props.newsLocation);
      let initData = isPCRes.value ? 6 : 2;
      let rate = isPCRes.value ? 2 : 1;
      maxLength < length ? (maxLength = length) : maxLength;
      return newsAll.slice(
        0,
        maxLength * rate + initData < newsAll.length
          ? maxLength * rate + initData
          : newsAll.length
      );
    });
    const handleCoverImg = (item: any) => {
      return item.image ? item.image : bgUrl;
    };
    const handleImageError = (event: any) => {
      event.target.src = bgUrl;
    };
    const gotoMainWebsite = (item: any) => {
      let websiteInfo = getWebsiteInfo(item);
      if (websiteInfo.mainWebsite) {
        gotoOutPage(websiteInfo.mainWebsite);
      }
    };
    return {
      isPCRes,
      getWebsiteLogo,
      getWebsiteName,
      handleNewsUrl,
      gotoNewsWebsite,
      handleDescType,
      bgUrl,
      handleNewsDesc,
      newsAllLimited,
      handleCoverImg,
      handleImageError,
      gotoMainWebsite,
      v2exLatestTime,
      v2exSnapshotPreserved,
    };
  },
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElAvatar,
    ElAlert,
  },
};
</script>

<style scoped>
.snapshot-alert {
  margin-bottom: 20px;
}

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
  overflow: hidden;
}

.news-card :deep(.el-card__body) {
  overflow: hidden;
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
  white-space: nowrap;
  /* 防止内容换行 */
  overflow: hidden;
  /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis;
  /* 使用省略号表示被截断的文本 */
  max-width: 300px;
}

.news-summary {
  display: block;
  margin: 0;
  height: 320px;
  font-size: 18px;
  font-family: Arial;
  overflow: hidden;
  /* 隐藏溢出部分 */
  text-overflow: ellipsis;
  /* 显示省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 10;
  line-clamp: 10;
  -webkit-box-orient: vertical;
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
  /* margin-bottom: 5px; */
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
@media screen and (max-width: 768px) {}
</style>
