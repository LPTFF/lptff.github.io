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
              <div class="welfare-week">{{ handleWeek(item) }}</div>
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
                />
                <el-icon
                  :size="32"
                  v-if="item.isTop && item.isTop == '1'"
                  style="color: red"
                  ><CircleCheck
                /></el-icon>
              </div>
            </div>
          </div>
          <div class="welfare-div-website" @click="gotoMainWebsite(item)">
            <img
              :src="handleWebsiteImg(item) ? handleWebsiteImg(item) : logoUrl"
              alt="网站"
              class="welfare-img-link"
            />
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
import oldSource from "../../../public/data/welfare.json";
import tuanSource from "../../../public/data/welfare/0818tuan.json";
import tuanTopSource from "../../../public/data/welfare/0818tuanTop.json";
import zhuanyesSource from "../../../public/data/welfare/zhuanyes.json";
import zhuanyesTopSource from "../../../public/data/welfare/zhuanyesTop.json";
import daydayzhuanSource from "../../../public/data/welfare/daydayzhuan.json";
import daydayzhuanTopSource from "../../../public/data/welfare/daydayzhuanTop.json";
import logoImageUrl from "../../../public/img/logo.jpg";
import tuanImage from "./img/0818tuan.png";
import mutouxbImage from "./img/mutouxb.png";
import yqhd8Image from "./img/yqhd8.png";
import hxm5Image from "./img/hxm5.png";
import zhuanyesImage from "./img/zhuanyes.png";
import daydayzhuanImage from "./img/daydayzhuan.png";
import { ElRow, ElCol, ElCard, ElIcon, ElDivider } from "element-plus";
let welfareInitSource: any[] = [];
let welfareTopSource: any[] = [];
let welfareSource: any[] = [];
welfareInitSource = [
  ...oldSource,
  ...tuanSource,
  ...zhuanyesSource,
  ...daydayzhuanSource,
];
welfareTopSource = [...tuanTopSource, ...zhuanyesTopSource, ...daydayzhuanTopSource];
welfareTopSource.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
welfareInitSource.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
welfareSource = [...welfareTopSource, ...welfareInitSource];
export default {
  props: {
    welfareLocation: [String, Number],
  },
  setup(props: any) {
    const logoUrl = ref(logoImageUrl);
    const handleWeek = (item: any) => {
      const date = new Date(item.timestamp);
      const dayOfWeek = date.getDay();
      const weekdays = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      const dayName = weekdays[dayOfWeek];
      return dayName;
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
    const getWebsiteInfo = (item: any): any => {
      let websiteInfo = {};
      switch (String(item.website)) {
        case "hxm5":
          websiteInfo = {
            websiteName: "线报引擎",
            mainWebsite: "https://www.hxm5.com/",
            websiteImg: hxm5Image,
          };
          break;
        case "mutouxb":
          websiteInfo = {
            websiteName: "86收线报网",
            mainWebsite: "http://www.mutouxb.com/",
            websiteImg: mutouxbImage,
          };
          break;
        case "yqhd8":
          websiteInfo = {
            websiteName: "实时线报",
            mainWebsite: "https://www.yqhd8.com/",
            websiteImg: yqhd8Image,
          };
          break;
        case "0818tuan":
          websiteInfo = {
            websiteName: "0818团",
            mainWebsite: "http://www.0818tuan.com/",
            websiteImg: tuanImage,
          };
          break;
        case "zhuanyes":
          websiteInfo = {
            websiteName: "好赚网",
            mainWebsite: "https://www.zhuanyes.com/",
            websiteImg: zhuanyesImage,
          };
          break;
        case "daydayzhuan":
          websiteInfo = {
            websiteName: "天天线报网",
            mainWebsite: "https://www.daydayzhuan.com/yangmao",
            websiteImg: daydayzhuanImage,
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
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const welfareLimited = computed(() => {
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
      return welfareTmpAll;
    });
    const gotoMainWebsite = (item: any) => {
      let websiteInfo = getWebsiteInfo(item);
      if (websiteInfo.mainWebsite) {
        gotoOutPage(websiteInfo.mainWebsite);
      }
    };
    return {
      logoUrl,
      handleWeek,
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
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
.welfare-img-link {
  height: 30px;
  width: 30px;
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
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
.welfare-week {
  color: #797979;
  font-weight: 600;
  font-size: 16px;
  margin-left: 5px;
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
</style>
