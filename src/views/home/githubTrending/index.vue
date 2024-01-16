<template>
  <div>
    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in guideNewsLimited"
        :key="sonIndex"
      >
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div class="welfare-month" :style="`color:${handleYearColor(item)}`">
                <div class="welfare-icon-hour">
                  <el-icon :size="15"><Calendar /></el-icon>
                </div>
                {{ handleMonth(item) }}
              </div>
              <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                {{ handleDay(item) }}
              </div>
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
                <el-icon :size="16"><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div>
              <a
                class="welfare-link-title"
                :href="handleLinkUrl(item)"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="welfare-div-link">
                <div
                  v-if="item.website == 'weibo'"
                  class="weibo-img-link"
                  :style="`background:${item.image.small_icon_desc_color}`"
                >
                  {{ item.image.small_icon_desc }}
                </div>
                <img
                  :src="handleAuthorImg(item)"
                  alt="作者"
                  class="welfare-img-link"
                  @error="handleImageError"
                  referrerPolicy="no-referrer"
                  v-else
                />
              </div>
            </div>
          </div>
          <div class="welfare-div-website">
            <img :src="handleWebsiteImg(item)" alt="网站" class="welfare-img-link" />
            <div class="welfare-name-link">
              {{ handleWebsiteName(item) }}
            </div>
          </div>
          <div class="mobile-div">
            <div class="mobile-div-news">
              <div class="mobile-link-title">
                <div @click="gotoMobileWebsite(item)">
                  {{ handleMobileTitle(item) }}
                </div>
              </div>
              <div
                v-if="item.website == 'weibo'"
                class="weibo-img-link mobile-weibo-img"
                :style="`background:${item.image.small_icon_desc_color}`"
              >
                {{ item.image.small_icon_desc }}
              </div>
              <img
                :src="handleAuthorImg(item)"
                alt="作者"
                class="welfare-img-link mobile-img-link"
                @error="handleImageError"
                referrerPolicy="no-referrer"
                v-else
              />
            </div>
            <div class="mobile-click-show">
              <div>
                <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                  {{ handleDay(item) }}
                </div>
                <div class="welfare-month">
                  <div class="welfare-icon-hour">
                    <el-icon :size="15"><Calendar /></el-icon>
                  </div>
                  {{ handleMonth(item) }}
                </div>
              </div>

              <div class="welfare-hour welfare-mobile-hour">
                <div class="welfare-icon-hour">
                  <el-icon :size="16"><Timer /></el-icon>
                </div>
                <div>{{ handleHour(item) }}</div>
              </div>
              <div class="mobile-bt-detail">
                <img
                  :src="handleWebsiteImg(item)"
                  alt="网站"
                  class="welfare-img-link mobile-welfare-img"
                />
                <div>{{ handleWebsiteName(item) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog
      v-model="dialogGuideVisible"
      :title="dialogTitle"
      center
      :style="`margin-top:${dialogMarginTop}px`"
      id="dialogEl"
    >
      <div class="dialog-content">{{ handleDialogContent(dialogContent) }}</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogCancel">不感兴趣</el-button>
          <el-button type="primary" @click="handleDialogConfirm"> 前去看看 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ref, nextTick, watch, computed } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import githubNews from "../../../public/data/githubTrending.json";
import logoImageUrl from "../../../public/img/logo.jpg";
import {
  ElCol,
  ElRow,
  ElDialog,
  ElCard,
  ElButton,
  ElIcon,
  ElDivider,
} from "element-plus";
export default {
  props: {
    githubTrendingLocation: [String, Number],
  },
  components: {
    ElCol,
    ElRow,
    ElDialog,
    ElCard,
    ElButton,
    ElIcon,
    ElDivider,
  },
  setup(props: any) {
    const logoUrl = ref(logoImageUrl);
    let dialogGuideVisible = ref(false);
    let dialogTitle = ref("");
    let dialogContent = ref("");
    let dialogParam = ref("");
    let githubList = ref(githubNews);
    let newsGuide: any[] = [];
    newsGuide = githubList.value;
    newsGuide.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
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
    const handleAuthorImg = (item: any) => {
      let websiteLogo = "";
      switch (String(item.website)) {
        case "githubTrending":
          websiteLogo = item.image ? item.image : logoUrl.value;
          break;
        default:
          websiteLogo = logoUrl.value;
      }
      return websiteLogo;
    };
    const handleLinkUrl = (item: any) => {
      let websiteUrl = "";
      let data = isPC();
      switch (String(item.website)) {
        case "githubTrending":
          websiteUrl = item.url;
          break;
      }
      return websiteUrl;
    };
    const gotoWelfareWebsite = (item: any) => {
      let websiteUrl = handleLinkUrl(item);
      console.log(websiteUrl);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleWebsiteName = (item: any) => {
      let websiteName = "";
      switch (String(item.website)) {
        case "githubTrending":
          websiteName = "githubTrending";
          break;
        default:
          websiteName = "随风而逝";
      }
      return websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      let websiteImg = "";
      switch (String(item.website)) {
        case "githubTrending":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAb1BMVEX////4+Pi3ubtvcnZNUVU+Q0cpLjLr6+x3en0sMTYkKS59gIORk5aUl5n8/Pzw8PFTV1tbX2Pc3d5DSEzn5+g3PECLjpFKTlKFh4qxs7XCxMUwNTq/wcLh4uPV1tZzd3o/Q0jOz9CmqKpjZ2qfoaSrd37mAAABPUlEQVR4AW3TBZKEMBAF0B8GCHzcnbW5/xm30qEyknklcU/DgQpuYRTHUXgLFHw6SemkmcYrlcd8kRYlnlQ1PU0Fp434Qde75Qd+1FUQKiRZjyGfTGNjKhWMmSQXYO3Ibao3MlqBnSRzADhk/ycAdcqclSSHnEUD+KLt8KalMQMqpl3izU5jKxHQGCq8Ud80fq4VfuFZaIyQO4wVPEre5g+RrIAPJrkQSL8OPjv3htQmH8guU5uwgseeP7ITMYBnpdFgvlJPcx0zoLjjzS/FDrVRvH6xsqDYlLx29huRUaFx6YuI1mhKMbddf9trEzca7rmRk/FxpiRXiJO8FDBURyb4yfO7glC8TOpacmAc4ElMEWlc2oGckjwvYVFEB5wjouE6uLBwquypQym/scKrM4njElYaJy182q15aDj/oQMZkS8JH3IAAAAASUVORK5CYII=";
          break;
        default:
          websiteImg = "羊毛";
      }
      return websiteImg;
    };
    const handleMonth = (item: any) => {
      const date = new Date(item.timestamp);
      const month = date.getMonth() + 1;
      return month + "月";
    };
    const handleImageError = (event: any) => {
      event.target.src = logoUrl.value;
    };
    const handleYearColor = (item: any) => {
      const date = new Date(item.timestamp);
      // 获取对应的年份
      const year = date.getFullYear();
      // 获取当前系统时间的年份
      const currentYear = new Date().getFullYear();
      return year < currentYear ? `#e96a43` : "";
    };
    const handleMobileTitle = (item: any) => {
      const lengthControl = 40;
      return item.title.length < lengthControl
        ? item.title
        : item.title.slice(0, lengthControl) + "...";
    };
    const gotoMobileWebsite = (item: any) => {
      let websiteUrl = handleLinkUrl(item);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleDialogContent = (item: any) => {
      const lengthControl = 400;
      return item.length < lengthControl ? item : item.slice(0, lengthControl) + "...";
    };
    const dialogMarginTop = ref();
    watch(dialogGuideVisible, async (newValue) => {
      if (newValue) {
        await nextTick(); // 等待元素渲染完成
        const dialogData = document.getElementById("dialogEl");
        if (dialogData) {
          let dialogHeight = dialogData.clientHeight;
          let windowHeight = window.innerHeight;
          dialogMarginTop.value = (Number(windowHeight) - dialogHeight) / 2 + 58;
        }
      }
    });
    const handleDialogCancel = () => {
      dialogGuideVisible.value = false;
    };
    const handleDialogConfirm = () => {
      dialogGuideVisible.value = false;
      console.log("dialogParam.value", dialogParam.value);
      let websiteUrl = handleLinkUrl(dialogParam.value);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const divColor = ref(""); // 用于存储随机颜色的响应式变量

    // 生成随机颜色的方法
    const generateRandomColor = () => {
      const randomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };

      divColor.value = randomColor(); // 将随机颜色赋值给divColor
    };
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const guideNewsLimited = computed(() => {
      const length: number = Number(props.githubTrendingLocation); // 切割长度
      let initData = isPCRes.value ? 9 : 5;
      let guideTmpAll;
      maxLength < length ? (maxLength = length) : maxLength;
      let rate = isPCRes.value ? 2 : 1;
      guideTmpAll = newsGuide.slice(
        0,
        maxLength * rate + initData < newsGuide.length
          ? maxLength * rate + initData
          : newsGuide.length
      );
      return guideTmpAll;
    });
    return {
      logoUrl,
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
      newsGuide,
      handleAuthorImg,
      handleLinkUrl,
      handleMonth,
      handleYearColor,
      handleImageError,
      handleMobileTitle,
      gotoMobileWebsite,
      dialogGuideVisible,
      dialogTitle,
      dialogContent,
      handleDialogContent,
      dialogMarginTop,
      handleDialogCancel,
      handleDialogConfirm,
      divColor,
      generateRandomColor,
      guideNewsLimited,
    };
  },
};
</script>

<style scoped>
.dialog-content {
  padding: 0;
}
.dialog-footer {
  display: flex;
  justify-content: space-evenly;
}
.welfare-month {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 16px;
}
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
.weibo-img-link {
  color: rgb(255, 255, 255);
  height: 20px;
  width: 20px;
  border-radius: 4px;
  padding-left: 3px;
  padding-bottom: 3px;
}
.mobile-weibo-img {
  margin: 27px 18px 0px 0px;
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
  max-width: 600px;
}
.day-week-welfare {
  margin: 0px 20px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.welfare-card {
  margin: 0px 0px 10px 0px;
}

:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
}
.mobile-div {
  display: none;
}

.el-card.is-hover-shadow:focus,
.el-card.is-hover-shadow:hover {
  background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
    linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
    linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
  background-size: 100% 100px;
  background-repeat: repeat-y;
}
/* 响应式布局 */
@media screen and (max-width: 768px) {
  .welfare-div-website {
    display: none;
  }
  .welfare-date {
    display: none;
  }
  .welfare-card {
    margin: 0px 0px 10px 0px;
  }
  .mobile-div {
    display: block;
    width: 100%;
    background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
      linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
      linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
    background-size: 100% 100px;
    background-repeat: repeat-y;
  }
  .mobile-div:focus,
  .mobile-div:hover {
    background: #ffffff;
  }

  .mobile-div-news {
    display: flex;
    justify-content: space-between;
  }
  :deep(.el-card__body) {
    padding: 0;
  }
  .mobile-link-title {
    color: #797979;
    height: 80px;
    font-size: 18px;
    font-weight: 600;
    max-width: 250px;
    margin: 27px 0px 0px 18px;
  }
  .mobile-img-link {
    margin: 27px 18px 0px 0px;
  }
  .mobile-click-show {
    display: flex;
    justify-content: space-between;
    margin: 30px 18px 23px 18px;
  }
  .welfare-mobile-hour {
    margin: 0;
  }
  .mobile-bt-detail {
    margin: auto 0;
    display: flex;
  }
  .mobile-welfare-img {
    height: 20px !important;
    width: 20px !important;
  }

  :deep(.el-dialog) {
    --el-dialog-width: 86%;
    margin: auto;
  }
}
</style>
