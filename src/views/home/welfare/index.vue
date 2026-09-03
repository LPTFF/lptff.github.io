<template>
  <div class="">
    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in welfareLimited"
        :key="sonIndex"
      >
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div class="welfare-month">
                <div class="welfare-icon-month">
                  <el-icon :size="15"><Calendar /></el-icon>
                </div>
                {{ handleMonth(item) }}
              </div>
              <div class="welfare-day">{{ handleDay(item) }}</div>
            </div>
            <div>
              <el-divider
                direction="vertical"
                color="#cccccc"
                class="el-welfare-divider"
              />
            </div>
            <div class="welfare-hour">
              <div class="welfare-icon-hour">
                <el-icon><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div>
              <a
                class="welfare-link-title"
                :href="item.link"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="welfare-div-link">
                <img
                  :src="item.img_src ? item.img_src : logoUrl"
                  alt="作者"
                  class="welfare-img-link"
                  @error="handleImageError"
                />
              </div>
            </div>
          </div>
          <div class="welfare-div-website" @click="gotoMainWebsite(item)">
            <el-avatar
              :size="isPCRes ? 30 : 26"
              :src="handleWebsiteImg(item)"
              class="welfare-source-avatar"
            >
              <span
                class="website-icon-fallback"
                :style="{ backgroundColor: fallbackColor(handleWebsiteName(item)) }"
              >
                {{ fallbackChar(handleWebsiteName(item)) }}
              </span>
            </el-avatar>
            <div class="welfare-name-link">
              {{ handleWebsiteName(item) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { ref, computed } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import oldSource from "../../../data/welfare.json";
import tuanSource from "../../../data/welfare/0818tuan.json";
import zhuanyesSource from "../../../data/welfare/zhuanyes.json";
import zhuanyesTopSource from "../../../data/welfare/zhuanyesTop.json";
import daydayzhuanSource from "../../../data/welfare/daydayzhuan.json";
import daydayzhuanTopSource from "../../../data/welfare/daydayzhuanTop.json";
import zhujicepingSource from "../../../data/welfare/zhujiceping.json";
import logoImageUrl from "../../../assets/logo.jpg";
import { Calendar, Timer } from "@element-plus/icons-vue";
import { ElRow, ElCol, ElCard, ElIcon, ElDivider, ElAvatar } from "element-plus";
let welfareInitSource: any[] = [];
let welfareTopSource: any[] = [];
let welfareSource: any[] = [];
welfareInitSource = [
  ...oldSource,
  ...tuanSource,
  ...zhuanyesSource,
  ...daydayzhuanSource,
  ...zhujicepingSource,
];
welfareTopSource = [...zhuanyesTopSource, ...daydayzhuanTopSource];
welfareSource = [...welfareTopSource, ...welfareInitSource].sort(
  (a, b) => b.timestamp - a.timestamp
); // 合并全部来源后全局排序，保证默认展示真正最新的数据
export default {
  props: {
    welfareLocation: [String, Number],
  },
  setup(props: any) {
    const logoUrl = logoImageUrl;
    const handleMonth = (item: any) => {
      const date = new Date(item.timestamp);
      return `${date.getMonth() + 1}月`;
    };
    const handleDay = (item: any) => {
      const date = new Date(item.timestamp);
      const day = date.getDate();
      const formattedDay = day < 10 ? "0" + day : day.toString();
      return formattedDay;
    };
    const handleHour = (item: any) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours.toString();
      const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
      const timeString = `${formattedHours}:${formattedMinutes}`;
      return timeString;
    };
    const gotoWelfareWebsite = (item: any) => {
      if (item.link) {
        gotoOutPage(item.link);
      }
    };
    const handleImageError = (event: Event) => {
      const image = event.target as HTMLImageElement;
      if (image.src !== logoUrl) {
        image.src = logoUrl;
      }
    };
    const getWebsiteInfo = (item: any): any => {
      let websiteInfo = {};
      switch (String(item.website)) {
        case "hxm5":
          websiteInfo = {
            websiteName: "线报屋",
            mainWebsite: "https://www.hxm5.com/",
            websiteImg: "https://www.hxm5.com/favicon.ico",
          };
          break;
        case "mutouxb":
          websiteInfo = {
            websiteName: "86收线报网",
            mainWebsite: "http://www.mutouxb.com/",
            websiteImg: "",
          };
          break;
        case "yqhd8":
          websiteInfo = {
            websiteName: "实时线报",
            mainWebsite: "https://www.yqhd8.com/",
            websiteImg: "https://www.yqhd8.com/static/favicon.ico",
          };
          break;
        case "0818tuan":
          websiteInfo = {
            websiteName: "0818团",
            mainWebsite: "https://tophub.today/n/4MdAkn1oxD",
            websiteImg:
              "https://icons.duckduckgo.com/ip3/www.0818tuan.com.ico",
          };
          break;
        case "zhuanyes":
          websiteInfo = {
            websiteName: "好赚网",
            mainWebsite: "https://www.zhuanyes.com/",
            websiteImg: "https://www.zhuanyes.com/favicon.ico",
          };
          break;
        case "daydayzhuan":
          websiteInfo = {
            websiteName: "天天线报网",
            mainWebsite: "https://www.daydayzhuan.com/yangmao",
            websiteImg: "https://www.daydayzhuan.com/favicon.ico",
          };
          break;
        case "zhujiceping":
          websiteInfo = {
            websiteName: "国外主机测评",
            mainWebsite: "https://www.zhujiceping.com/",
            websiteImg: "https://www.zhujiceping.com/favicon.ico",
          };
          break;
        default:
          websiteInfo = {
            websiteName: "羊毛",
            mainWebsite: "https://lptff.github.io/",
            websiteImg: logoImageUrl,
          };
      }
      return websiteInfo;
    };
    const handleWebsiteName = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteInfo = getWebsiteInfo(item);
      return websiteInfo.websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteInfo = getWebsiteInfo(item);
      return websiteInfo.websiteImg;
    };
    const fallbackPalette = [
      "#5b8ff9",
      "#5ad8a6",
      "#f6bd16",
      "#e8684a",
      "#6dc8ec",
      "#9270ca",
    ];
    const fallbackChar = (name: string) => (name || "?").trim().charAt(0);
    const fallbackColor = (name: string) => {
      let hash = 0;
      for (const char of name || "") {
        hash = (hash * 31 + char.charCodeAt(0)) % 997;
      }
      return fallbackPalette[hash % fallbackPalette.length];
    };
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const welfareLimited = computed(() => {
      if (props.welfareLocation === undefined || props.welfareLocation === null) {
        return welfareSource;
      }
      const length: number = Number(props.welfareLocation); // 切割长度
      let initData = isPCRes.value ? 9 : 5;
      let welfareTmpAll;
      maxLength < length ? (maxLength = length) : maxLength;
      let rate = isPCRes.value ? 2 : 1;
      welfareTmpAll = welfareSource.slice(
        0,
        maxLength * rate + initData < welfareSource.length
          ? maxLength * rate + initData
          : welfareSource.length
      );
      const vpsOffers = welfareSource.filter(
        (item) => item.website === "zhujiceping"
      );
      const regularOffers = welfareTmpAll.filter(
        (item) => item.website !== "zhujiceping"
      );
      return [...vpsOffers, ...regularOffers].sort(
        (a, b) => b.timestamp - a.timestamp
      );
    });
    const gotoMainWebsite = (item: any) => {
      let websiteInfo = getWebsiteInfo(item);
      if (websiteInfo.mainWebsite) {
        gotoOutPage(websiteInfo.mainWebsite);
      }
    };
    return {
      logoUrl,
      handleMonth,
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleImageError,
      handleWebsiteName,
      handleWebsiteImg,
      fallbackChar,
      fallbackColor,
      isPCRes,
      welfareLimited,
      gotoMainWebsite,
    };
  },
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElIcon,
    ElDivider,
    ElAvatar,
    Calendar,
    Timer,
  },
};
</script>
<style scoped>
.welfare-div-website {
  display: flex;
  margin: auto 0;
}
.welfare-name-link {
  margin-top: 4px;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-source-avatar {
  flex-shrink: 0;
  margin-right: 10px;
}
.website-icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.welfare-img-link {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  margin-right: 10px;
}
.welfare-link-title {
  display: block;
  color: #797979;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
  max-width: 700px;
}
.day-week-welfare {
  margin: 0px 20px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
}
.welfare-month {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 16px;
}
.welfare-icon-month {
  display: flex;
  margin-right: 8px;
}
.welfare-icon-hour {
  margin-right: 8px;
  margin-top: 2px;
}
.welfare-hour {
  margin: 0px 40px 0px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-div-link {
  display: flex;
  /* margin-top: 27px; */
}
.el-welfare-divider {
  height: 100%;
}
.welfare-date {
  margin-right: 20px;
  display: flex;
}
.welfare-title {
  height: 30px;
  width: 55px;
  margin-bottom: 10px;
  color: #5b5d5c;
  font-weight: 600;
  font-size: 21px;
}
.welfare-card {
  margin: 0px 0px 10px 0px;
}
:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
}
.el-card.is-hover-shadow:focus,
.el-card.is-hover-shadow:hover {
  background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
    linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
    linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
  background-size: 100% 100px;
  background-repeat: repeat-y;
}

@media screen and (max-width: 768px) {
  :deep(.el-card__body) {
    display: block;
    padding: 14px;
  }

  .welfare-date {
    display: grid;
    grid-template-columns: 58px 1px 68px minmax(0, 1fr);
    gap: 8px;
    margin-right: 0;
    align-items: center;
  }

  .day-week-welfare {
    margin: 0;
    text-align: center;
  }

  .welfare-day {
    font-size: 38px;
  }

  .welfare-month {
    font-size: 14px;
  }

  .welfare-icon-month {
    margin-right: 5px;
  }

  .welfare-hour {
    margin: 0;
    font-size: 13px;
  }

  .welfare-date > div:last-child {
    min-width: 0;
  }

  .welfare-link-title {
    display: -webkit-box;
    height: auto;
    min-height: 42px;
    max-width: none;
    overflow: hidden;
    font-size: 15px;
    line-height: 21px;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .welfare-div-link {
    margin-top: 6px;
  }

  .welfare-img-link {
    width: 26px;
    height: 26px;
  }

  .welfare-div-website {
    justify-content: flex-end;
    margin-top: 10px;
  }

  .welfare-name-link {
    font-size: 12px;
  }
}
</style>
