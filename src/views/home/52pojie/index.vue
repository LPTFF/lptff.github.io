<template>
  <div>
    <section class="ecosystem-radar">
      <div>
        <div class="radar-title">吾爱破解生态雷达</div>
        <div class="radar-description">
          保留全部近期资讯，观察真实需求、工具链与攻防热点，不以“学术深度”删帖。
        </div>
      </div>
      <div class="radar-stats">
        <span>{{ newsGuide.length }} 条资讯</span>
        <span>{{ analyzedCount }} 条已分析</span>
        <span>{{ categoryCount }} 个生态主题</span>
      </div>
    </section>
    <section class="radar-filters" v-if="analyzedCount">
      <div class="filter-row">
        <span class="filter-label">生态主题</span>
        <button
          type="button"
          class="filter-tag"
          :class="{ active: selectedCategory === 'all' }"
          :aria-pressed="selectedCategory === 'all'"
          @click="selectedCategory = 'all'"
        >
          全部 {{ analyzedCount }}
        </button>
        <button
          v-for="category in categoryOptions"
          :key="category.name"
          type="button"
          class="filter-tag"
          :class="{ active: selectedCategory === category.name }"
          :aria-pressed="selectedCategory === category.name"
          @click="selectedCategory = category.name"
        >
          {{ category.name }} {{ category.count }}
        </button>
      </div>
      <div class="filter-row">
        <span class="filter-label">观察视角</span>
        <button
          v-for="focus in focusOptions"
          :key="focus.key"
          type="button"
          class="filter-tag focus-tag"
          :class="{ active: selectedFocus === focus.key }"
          :aria-pressed="selectedFocus === focus.key"
          @click="selectedFocus = focus.key"
        >
          {{ focus.label }}
        </button>
        <span class="filter-result">{{ filteredNews.length }} 条当前结果</span>
      </div>
    </section>
    <div class="filter-empty" v-if="analyzedCount && filteredNews.length === 0">
      当前标签组合暂无资讯，可切换主题或观察视角。
    </div>
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
              <div class="ecosystem-tags" v-if="item.ecosystem">
                <el-tag size="small">{{ item.ecosystem.category }}</el-tag>
                <el-tag size="small" type="success">
                  生态 {{ item.ecosystem.ecosystemValue }}
                </el-tag>
                <el-tag size="small" type="info">
                  技术 {{ item.ecosystem.technicalDepth }}
                </el-tag>
                <el-tag size="small" type="primary">
                  趋势 {{ item.ecosystem.trendNovelty }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="item.ecosystem.duplicateGroup">
                  主题演化
                </el-tag>
              </div>
              <div class="ecosystem-tags" v-else>
                <el-tag size="small" type="info">生态信号待分析</el-tag>
              </div>
              <div class="ecosystem-summary" v-if="item.ecosystem">
                {{ item.ecosystem.summary }}
              </div>
              <div
                class="ecosystem-evolution"
                v-if="item.ecosystem?.duplicateGroup && item.ecosystem.evolutionNote"
              >
                演化：{{ item.ecosystem.evolutionNote }}
              </div>
              <div class="welfare-div-link">
                <div
                  v-if="item.website == 'weibo'"
                  class="weibo-img-link"
                  :style="`background:${handleWeiboIconColor(item)}`"
                >
                  {{ handleWeiboIconDesc(item) }}
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
                <div class="mobile-ecosystem-signal">
                  <span>{{ item.ecosystem?.category || "生态信号待分析" }}</span>
                  <span v-if="item.ecosystem">生态 {{ item.ecosystem.ecosystemValue }}</span>
                </div>
              </div>
              <div
                v-if="item.website == 'weibo'"
                class="weibo-img-link mobile-weibo-img"
                :style="`background:${handleWeiboIconColor(item)}`"
              >
                {{ handleWeiboIconDesc(item) }}
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
import { Calendar, Timer } from "@element-plus/icons-vue";
import pojieNews from "../../../data/52pojie.json";
import ecosystemRadar from "../../../data/52pojie-ecosystem.json";
import logoImageUrl from "../../../assets/logo.jpg";
import {
  ElCol,
  ElRow,
  ElDialog,
  ElCard,
  ElButton,
  ElIcon,
  ElDivider,
  ElTag,
} from "element-plus";
export default {
  props: {
    pojieLocation: [String, Number],
  },
  components: {
    ElCol,
    ElRow,
    ElDialog,
    ElCard,
    ElButton,
    ElIcon,
    ElDivider,
    ElTag,
    Calendar,
    Timer,
  },
  setup(props: any) {
    const logoUrl = logoImageUrl;
    let dialogGuideVisible = ref(false);
    let dialogTitle = ref("");
    let dialogContent = ref("");
    let dialogParam = ref("");
    const ecosystemByUrl = new Map(
      ecosystemRadar.items.map((item: any) => [item.url, item])
    );
    const newsGuide = [...pojieNews]
      .map((item: any) => ({ ...item, ecosystem: ecosystemByUrl.get(item.url) }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    const analyzedCount = computed(
      () => newsGuide.filter((item: any) => item.ecosystem).length
    );
    const categoryCount = computed(
      () => new Set(newsGuide.map((item: any) => item.ecosystem?.category).filter(Boolean)).size
    );
    const selectedCategory = ref("all");
    const selectedFocus = ref("all");
    const categoryOptions = computed(() => {
      const counts = new Map<string, number>();
      newsGuide.forEach((item: any) => {
        if (item.ecosystem?.category) {
          counts.set(item.ecosystem.category, (counts.get(item.ecosystem.category) || 0) + 1);
        }
      });
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
    });
    const focusOptions = [
      { key: "all", label: "全部视角" },
      { key: "high", label: "高生态信号" },
      { key: "evolution", label: "主题演化" },
      { key: "gray", label: "灰色用途" },
      { key: "beginner", label: "入门生态" },
    ];
    const filteredNews = computed(() =>
      newsGuide.filter((item: any) => {
        const ecosystem = item.ecosystem;
        if (!ecosystem) return selectedCategory.value === "all" && selectedFocus.value === "all";
        if (
          selectedCategory.value !== "all" &&
          ecosystem.category !== selectedCategory.value
        ) {
          return false;
        }
        switch (selectedFocus.value) {
          case "high":
            return ecosystem.ecosystemValue >= 85;
          case "evolution":
            return Boolean(ecosystem.duplicateGroup);
          case "gray":
            return ecosystem.riskType === "gray_abuse";
          case "beginner":
            return ecosystem.technicalDepth <= 50;
          default:
            return true;
        }
      })
    );
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
        case "juejin":
        case "infzm":
        case "v2ex":
        case "githubTrending":
          websiteLogo = item.image ? item.image : logoUrl;
          break;
        case "hxm5":
        case "mutouxb":
          websiteLogo = item.img_src ? item.img_src : logoUrl;
          break;
        default:
          websiteLogo = logoUrl;
      }
      return websiteLogo;
    };
    const handleLinkUrl = (item: any) => {
      let websiteUrl = "";
      switch (String(item.website)) {
        case "52pojie":
          websiteUrl = item.url;
          break;
      }
      return websiteUrl;
    };
    const gotoWelfareWebsite = (item: any) => {
      let websiteUrl = handleLinkUrl(item);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleWebsiteName = (item: any) => {
      let websiteName = "";
      switch (String(item.website)) {
        case "52pojie":
          websiteName = "吾爱破解";
          break;
        default:
          websiteName = "随风而逝";
      }
      return websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      let websiteImg = "";
      switch (String(item.website)) {
        case "52pojie":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAkFBMVEX////87OzsYmL5zc3509P+9/fzoaH62tr1r6/3vLzylZXwgYHmMzPudHT99PTqUlL85+f1qqrtamr74uLznp7fAADhBwflJyfgAADpRETjFxfiDw/iCwvhAADkHBzmLi7rWVniEBDpSEjqT0/oPz/4xsbdAADyl5fvfHz3wsLjERHxjIzkICD2tbXtbW3wh4dkMKV5AAACuUlEQVR4ATWNBwKrKBRFr11jiUbBGwEV0zFl/7sbZub/A683IAijOEmzvDiUWVXnzbHtTuUxiOq+H8oWgJAjKenlPCltfCBmsQhvlCKBVSotJyW1nCGordbVdj5vl8vluPkSUBs9btfzNo8ndOmiLW/woG/blooRMLFOEKDxEgYFJz3rpT3d73dBZRkjphVpKsSjERCo5OwvjrhlCPy2yaR4Tj6+C9G9iLuUTjk2QPF4Rjm15Y6Con21OKfpESikmo3glNzFvXvotzIPBOIU4Fq2XdysFVapOwT4C82AfbmeIMYmugoxYZN6rJb3tFRhNY/LxAHPt7kmIoz7d384gcpppm0LTzBJRaClmvDAmswENjr1FujOM0kMRk3+IJW8flbiXcDvk7oSmIUhJXZa7uhpnTRmwfdlxVbzrPnBoS47JFbrLUdEO1n1nmtJraR0Wlle0lsxHKmtZYivVNZpX1PKqVE5j5okOemLdhPx3wn9fvuOiaT1daulJKmp/IYChVbaIBXc9u5VG+usdFX4LFpg1I4vnKQTPbrP8dXgi6d03IEcpV4LYZUABr6bOA+z5p797sONTmsJpuEVp8Wo+YSQaqeoIUfwHqVGuZq3Vwb0PX5yKtEuzHyI52ffAKctgSDCKIXwDaYEJPtleC64rtWF0jmz3+5FetfjikWbBwrLbI+xJs8uf82zsnJPf2gAJK1v6AHJ+BVHFwQJgFI6+vqhOtZ7SKkMEJF9npcjRvFL77TOcUKAtng0DzPJDbkRUdJjSNZv0WYdnRXxfn19hUq+0vKFWi5ZeKjXYEij6OiUkxWk2ACUYlZmwEUzewzlIRKiy4VyljgsAeL6hZ+ZmMMvNcZQamUNrXNWh24ONclldUrcAKklPcaLR9J4JbwlBUUHz+viJX90fRx8fnVWdN2KwykuGvQR8A+lNlPn0UGdyAAAAABJRU5ErkJggg==";
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
      event.target.src = logoUrl;
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
      let websiteUrl = handleLinkUrl(dialogParam.value);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleWeiboIconColor = (item: any) => {
      return (item.image as any)?.small_icon_desc_color ?? "";
    };
    const handleWeiboIconDesc = (item: any) => {
      return (item.image as any)?.small_icon_desc ?? "";
    };
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const guideNewsLimited = computed(() => {
      const length: number = Number(props.pojieLocation); // 切割长度
      let initData = isPCRes.value ? 9 : 5;
      let guideTmpAll;
      maxLength < length ? (maxLength = length) : maxLength;
      let rate = isPCRes.value ? 2 : 1;
      guideTmpAll = filteredNews.value.slice(
        0,
        maxLength * rate + initData < filteredNews.value.length
          ? maxLength * rate + initData
          : filteredNews.value.length
      );
      return guideTmpAll;
    });
    return {
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
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
      guideNewsLimited,
      handleWeiboIconColor,
      handleWeiboIconDesc,
      newsGuide,
      analyzedCount,
      categoryCount,
      selectedCategory,
      selectedFocus,
      categoryOptions,
      focusOptions,
      filteredNews,
    };
  },
};
</script>

<style scoped>
.ecosystem-radar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 14px;
  padding: 18px 20px;
  border: 1px solid #d9e7ff;
  border-radius: 8px;
  background: linear-gradient(135deg, #f7faff, #eef5ff);
}
.radar-title {
  color: #30486f;
  font-size: 19px;
  font-weight: 700;
}
.radar-description {
  max-width: 700px;
  margin-top: 6px;
  color: #65738a;
  font-size: 13px;
  line-height: 1.6;
}
.radar-stats {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
  color: #4a74ad;
  font-size: 13px;
  font-weight: 600;
}
.radar-filters {
  margin-bottom: 14px;
  padding: 13px 16px;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  background: #fff;
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-row + .filter-row {
  margin-top: 10px;
}
.filter-label {
  min-width: 60px;
  color: #65738a;
  font-size: 12px;
  font-weight: 700;
}
.filter-tag {
  padding: 4px 9px;
  border: 1px solid #d8e0ec;
  border-radius: 999px;
  background: #f8fafc;
  color: #52647d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 1.2;
  transition: 0.16s ease;
}
.filter-tag:hover {
  border-color: #8eb8ee;
  color: #337ecc;
}
.filter-tag.active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}
.focus-tag.active {
  border-color: #7c65c1;
  background: #7c65c1;
}
.filter-result {
  margin-left: auto;
  color: #4a74ad;
  font-size: 12px;
  font-weight: 600;
}
.filter-empty {
  margin-bottom: 14px;
  padding: 28px;
  border: 1px dashed #c9d5e6;
  border-radius: 8px;
  color: #65738a;
  text-align: center;
}
.ecosystem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 7px;
}
.ecosystem-summary {
  max-width: 680px;
  margin-bottom: 9px;
  color: #65738a;
  font-size: 13px;
  line-height: 1.45;
}
.ecosystem-evolution {
  max-width: 680px;
  margin: -3px 0 9px;
  color: #a06a28;
  font-size: 12px;
  line-height: 1.4;
}
.mobile-ecosystem-signal {
  display: flex;
  gap: 8px;
  margin-top: 7px;
  color: #4a74ad;
  font-size: 12px;
}
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
  border-radius: 50%;
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
  min-height: 30px;
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
  .ecosystem-radar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }
  .radar-stats {
    flex-wrap: wrap;
    gap: 8px 14px;
  }
  .radar-filters {
    padding: 12px;
  }
  .filter-label {
    flex-basis: 100%;
  }
  .filter-result {
    flex-basis: 100%;
    margin: 2px 0 0;
  }
  .ecosystem-tags,
  .ecosystem-summary,
  .ecosystem-evolution {
    display: none;
  }
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
    min-height: 80px;
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
