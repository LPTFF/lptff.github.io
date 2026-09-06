<template>
  <div class="">
    <section class="collector-panel" aria-labelledby="collector-title">
      <div class="collector-intro">
        <div class="collector-copy">
          <div class="collector-eyebrow">后台采集器</div>
          <h2 id="collector-title">多路福利采集</h2>
          <p>
            固定来源采集银行优惠、低价 VPS 与闲鱼指定需求；Google RSS 定向发现基础设施和 AI 优惠。
          </p>
        </div>
        <div class="collector-stats" aria-label="采集结果统计">
          <span><strong>{{ welfareSourceCount }}</strong> 条结果</span>
          <span><strong>{{ directSourceCount }}</strong> 条固定来源</span>
          <span><strong>{{ directedSourceCount }}</strong> 条定向发现</span>
        </div>
      </div>
      <div class="collector-controls">
        <div class="filter-row" role="group" aria-label="按采集方式查看">
          <span class="filter-label">采集方式</span>
          <button
            v-for="mode in collectionModes"
            :key="mode.id"
            type="button"
            class="filter-chip"
            :class="{ active: selectedSource === mode.id }"
            :aria-pressed="selectedSource === mode.id"
            @click="selectedSource = mode.id"
          >
            {{ mode.label }} <small>{{ mode.count }}</small>
          </button>
          <span class="current-filter-count">{{ selectedSourceCount }} 条当前结果</span>
        </div>
        <div class="filter-row source-scroll-row" role="group" aria-label="按固定来源查看">
          <span class="filter-label">固定来源</span>
          <button
            v-for="source in directSources"
            :key="source.id"
            type="button"
            class="filter-chip direct-chip"
            :class="{ active: selectedSource === source.id }"
            :aria-pressed="selectedSource === source.id"
            title="固定来源直采"
            @click="selectedSource = source.id"
          >
            {{ source.label }} <small>{{ source.count }}</small>
          </button>
        </div>
        <div class="filter-row source-scroll-row" role="group" aria-label="按定向来源查看">
          <span class="filter-label">定向来源</span>
          <button
            v-for="source in searchSources"
            :key="source.id"
            type="button"
            class="filter-chip search-chip"
            :class="{ active: selectedSource === source.id }"
            :aria-pressed="selectedSource === source.id"
            :title="`Google RSS · site:${source.domain}`"
            @click="selectedSource = source.id"
          >
            {{ source.label }} <small>{{ source.count }}</small>
          </button>
        </div>
      </div>
      <details class="collector-details">
        <summary>采集范围与更新规则</summary>
        <div class="collector-detail-grid">
          <div>
            <strong>固定来源</strong>
            <p>线报站筛选银行优惠，主机站筛选年费不超过 20 美元的 VPS；闲鱼仅关注 115 网盘会员、迅雷会员和 QQ 阅读充值优惠。</p>
            <div class="detail-sources">
              <span v-for="source in directCollectorSources" :key="source.id">{{ source.label }}</span>
            </div>
          </div>
          <div>
            <strong>Google 定向发现</strong>
            <p>发现 VPS、域名、云服务额度，以及 AI 订阅促销和活动性额度重置。</p>
            <div class="detail-sources search-detail-sources">
              <span v-for="source in collectorSources" :key="source.id">
                {{ source.label }} <code>site:{{ source.domain }}</code>
              </span>
            </div>
          </div>
        </div>
        <p class="collector-note">旧结果会按当前范围重新筛选；来源暂不可用时保留已有结果。参与条件与有效期请查看原文。</p>
      </details>
    </section>
    <div v-if="welfareLimited.length === 0" class="source-empty">
      <strong>{{ selectedSourceLabel }} 暂无通过筛选的福利</strong>
      <span>没有符合当前范围的结果时显示 0 条；来源或分析服务暂不可用时，部分结果可能暂停更新。</span>
    </div>
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
                <span v-if="item.website === 'keyword-search'" class="discovery-badge">
                  Google RSS · site:{{ item.searchSourceDomain }}
                </span>
                <span v-else class="discovery-badge direct-badge">指定来源直采</span>
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
import keywordSearchSource from "../../../data/welfare/keyword-search.json";
import xianyuSource from "../../../data/welfare/xianyu.json";
import keywordSearchConfig from "../../../../project-support/crawl/welfare/keyword_search_config.json";
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
  ...keywordSearchSource,
  ...xianyuSource,
];
welfareTopSource = [...zhuanyesTopSource, ...daydayzhuanTopSource];
welfareSource = [...welfareTopSource, ...welfareInitSource].sort(
  (a, b) => b.timestamp - a.timestamp
); // 合并全部来源后全局排序，保证默认展示真正最新的数据
const collectorSources = keywordSearchConfig.searchSources;
const directCollectorSources = [
  { id: "hxm5", label: "线报屋" },
  { id: "mutouxb", label: "86收线报网" },
  { id: "yqhd8", label: "实时线报" },
  { id: "0818tuan", label: "0818团" },
  { id: "zhuanyes", label: "好赚网" },
  { id: "daydayzhuan", label: "天天线报网" },
  { id: "zhujiceping", label: "国外主机测评" },
  { id: "xianyu", label: "闲鱼" },
];
export default {
  props: {
    welfareLocation: [String, Number],
  },
  setup(props: any) {
    const logoUrl = logoImageUrl;
    const selectedSource = ref("all");
    const welfareSourceCount = welfareSource.length;
    const directSourceCount = welfareSource.filter(
      (item) => item.website !== "keyword-search"
    ).length;
    const directedSourceCount = welfareSourceCount - directSourceCount;
    const searchSources = computed(() =>
      collectorSources.map((source) => ({
        ...source,
        kind: "search",
        count: welfareSource.filter(
          (item) => item.website === "keyword-search" && item.searchSourceId === source.id
        ).length,
      }))
    );
    const directSources = computed(() =>
      directCollectorSources.map((source) => ({
        ...source,
        kind: "direct",
        domain: "",
        count: welfareSource.filter((item) => item.website === source.id).length,
      }))
    );
    const sourceFilters = computed(() => [...directSources.value, ...searchSources.value]);
    const collectionModes = computed(() => [
      { id: "all", label: "全部", count: welfareSourceCount },
      { id: "direct", label: "固定来源", count: directSourceCount },
      { id: "directed", label: "Google 定向", count: directedSourceCount },
    ]);
    const selectedSourceCount = computed(
      () =>
        [...collectionModes.value, ...sourceFilters.value].find(
          (source) => source.id === selectedSource.value
        )?.count || 0
    );
    const selectedSourceLabel = computed(
      () =>
        [...collectionModes.value, ...sourceFilters.value].find(
          (source) => source.id === selectedSource.value
        )?.label ||
        "当前来源"
    );
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
            mainWebsite: "http://www.0818tuan.com/list-1-0.html",
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
        case "xianyu":
          websiteInfo = {
            websiteName: "闲鱼",
            mainWebsite: "https://www.goofish.com/",
            websiteImg: "https://img.alicdn.com/tfs/TB19WObTNv1gK0jSZFFXXb0sXXa-144-144.png",
          };
          break;
        case "keyword-search":
          const sourceIcons: Record<string, string> = {
            github: "https://github.com/favicon.ico",
            telegram: "https://telegram.org/favicon.ico",
            bilibili: "https://www.bilibili.com/favicon.ico",
          };
          websiteInfo = {
            websiteName: item.searchSourceLabel
              ? `${item.searchSourceLabel}（Google 采集）`
              : item.sourceName || "Google 定向搜索",
            mainWebsite: item.searchSourceUrl || item.sourceUrl || "https://news.google.com/",
            websiteImg:
              sourceIcons[item.searchSourceId] || "https://news.google.com/favicon.ico",
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
      let visibleItems = welfareSource;
      if (props.welfareLocation !== undefined && props.welfareLocation !== null) {
        const length: number = Number(props.welfareLocation); // 切割长度
        const initData = isPCRes.value ? 9 : 5;
        maxLength < length ? (maxLength = length) : maxLength;
        const rate = isPCRes.value ? 2 : 1;
        const welfareTmpAll = welfareSource.slice(
          0,
          maxLength * rate + initData < welfareSource.length
            ? maxLength * rate + initData
            : welfareSource.length
        );
        const aiOffers = welfareSource.filter(
          (item) => ["zhujiceping", "keyword-search", "xianyu"].includes(item.website)
        );
        const regularOffers = welfareTmpAll.filter(
          (item) => !["zhujiceping", "keyword-search", "xianyu"].includes(item.website)
        );
        visibleItems = [...aiOffers, ...regularOffers].sort(
          (a, b) => b.timestamp - a.timestamp
        );
      }
      if (selectedSource.value === "all") return visibleItems;
      if (selectedSource.value === "direct") {
        return visibleItems.filter((item) => item.website !== "keyword-search");
      }
      if (selectedSource.value === "directed") {
        return visibleItems.filter((item) => item.website === "keyword-search");
      }
      if (directCollectorSources.some((source) => source.id === selectedSource.value)) {
        return visibleItems
          .filter((item) => item.website === selectedSource.value)
          .sort((a, b) => b.timestamp - a.timestamp);
      }
      return visibleItems.filter(
        (item) =>
          item.website === "keyword-search" && item.searchSourceId === selectedSource.value
      ).sort(
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
      selectedSource,
      searchSources,
      directSources,
      sourceFilters,
      collectionModes,
      selectedSourceCount,
      selectedSourceLabel,
      welfareSourceCount,
      directSourceCount,
      directedSourceCount,
      collectorSources,
      directCollectorSources,
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
.collector-panel {
  margin-bottom: 12px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid #d8e5f5;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%);
}
.collector-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.collector-copy {
  min-width: 0;
  flex: 1;
}
.collector-eyebrow {
  margin-bottom: 2px;
  color: #3471c9;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.collector-panel h2 {
  margin: 0;
  color: #23354d;
  font-size: 20px;
  line-height: 1.3;
}
.collector-panel p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.collector-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  color: #607895;
  font-size: 12px;
}
.collector-stats span {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}
.collector-stats strong {
  color: #3471c9;
  font-size: 16px;
}
.collector-panel code {
  color: #315c94;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.collector-controls {
  margin-top: 12px;
  padding: 9px 12px;
  border: 1px solid #dce6f2;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-row + .filter-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #edf1f6;
}
.filter-label {
  width: 64px;
  flex: 0 0 64px;
  color: #52657c;
  font-size: 12px;
  font-weight: 700;
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  padding: 2px 9px;
  border: 1px solid #cedbea;
  border-radius: 999px;
  color: #52657c;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.filter-chip:hover {
  border-color: #7eaaf0;
  color: #3471c9;
}
.filter-chip:focus-visible {
  outline: 2px solid #8cb8f4;
  outline-offset: 2px;
}
.filter-chip.active {
  border-color: #4b95f5;
  color: #fff;
  background: #4b95f5;
}
.filter-chip small {
  color: inherit;
  font-size: 11px;
  opacity: 0.85;
}
.current-filter-count {
  margin-left: auto;
  color: #3471c9;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.collector-details {
  margin-top: 7px;
  color: #60758e;
  font-size: 12px;
}
.collector-details summary {
  width: max-content;
  cursor: pointer;
  color: #57708e;
  user-select: none;
}
.collector-details[open] summary {
  color: #3471c9;
}
.collector-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid #e1e9f3;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}
.collector-detail-grid > div {
  min-width: 0;
}
.collector-detail-grid strong {
  color: #344b66;
}
.collector-detail-grid p {
  margin-top: 3px;
  font-size: 12px;
}
.detail-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}
.detail-sources span {
  padding: 2px 6px;
  border-radius: 5px;
  color: #3d5d54;
  background: #edf8f3;
  font-size: 10px;
}
.search-detail-sources span {
  color: #385d8d;
  background: #edf4fd;
}
.collector-panel .collector-note {
  margin-top: 6px;
  font-size: 11px;
}
.discovery-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  margin-top: 3px;
  padding: 0 9px;
  border-radius: 999px;
  color: #3c6598;
  background: #edf5ff;
  font-size: 11px;
  font-weight: 650;
}
.direct-badge {
  color: #34705d;
  background: #edf8f3;
}
.source-empty {
  display: flex;
  margin-bottom: 18px;
  padding: 34px 20px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px dashed #cdd8e6;
  border-radius: 12px;
  color: #52657c;
  background: #fbfcfe;
  text-align: center;
}
.source-empty span {
  color: #8a98aa;
  font-size: 13px;
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
  .collector-panel {
    padding: 13px;
  }

  .collector-intro {
    display: block;
  }

  .collector-panel h2 {
    font-size: 19px;
  }

  .collector-panel p {
    font-size: 12px;
  }

  .collector-stats {
    gap: 7px 12px;
    margin-top: 8px;
    flex-wrap: wrap;
    font-size: 11px;
  }

  .collector-stats strong {
    font-size: 14px;
  }

  .collector-controls {
    padding: 8px 9px;
  }

  .collector-controls .filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 1px;
    scrollbar-width: none;
  }

  .collector-controls .filter-row::-webkit-scrollbar {
    display: none;
  }

  .collector-controls .filter-label,
  .collector-controls .filter-chip {
    flex: 0 0 auto;
  }

  .collector-controls .filter-label {
    width: auto;
    min-width: 60px;
  }

  .current-filter-count {
    display: none;
  }

  .filter-chip {
    min-height: 32px;
    padding: 4px 9px;
  }

  .collector-detail-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

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
