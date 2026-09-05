<template>
  <div class="">
    <section class="collector-panel" aria-labelledby="collector-title">
      <div class="collector-intro">
        <div>
          <div class="collector-eyebrow">后台采集器</div>
          <h2 id="collector-title">多路福利采集</h2>
          <p>
            定时从已配置的公开页面直接采集，同时用 Google 定向搜索扩展发现范围；
            两路候选都要通过规则与 Gemini 筛选才会进入列表。
          </p>
        </div>
        <div class="collector-total">{{ welfareSourceCount }} 条当前结果</div>
      </div>
      <div class="collector-lanes">
        <article class="collector-lane direct-lane">
          <div class="lane-heading">
            <div>
              <span class="lane-kicker">指定页面数据源</span>
              <h3>固定来源直接采集</h3>
            </div>
            <small>{{ directSourceCount }} 条</small>
          </div>
          <p>读取已配置的公开页面或接口，解析标题、链接和发布时间。</p>
          <div class="lane-sources">
            <span v-for="source in directCollectorSources" :key="source.id">
              {{ source.label }}
            </span>
          </div>
          <div class="collector-flow" aria-label="指定页面采集流程">
            <span>公开页面 / API</span><span class="flow-arrow">→</span>
            <span>结构解析</span><span class="flow-arrow">→</span>
            <span>规则 + Gemini</span><span class="flow-arrow">→</span>
            <span>福利列表</span>
          </div>
        </article>
        <article class="collector-lane search-lane">
          <div class="lane-heading">
            <div>
              <span class="lane-kicker">Google 定向发现</span>
              <h3><code>site:</code> 来源搜索</h3>
            </div>
            <small>{{ directedSourceCount }} 条</small>
          </div>
          <p>通过 Google 新闻 RSS 组合福利关键词与站点限定，补充固定页面之外的候选。</p>
          <div class="lane-sources search-source-list">
            <span v-for="source in collectorSources" :key="source.id">
              {{ source.label }} <code>site:{{ source.domain }}</code>
            </span>
          </div>
          <div class="collector-flow" aria-label="Google 定向采集流程">
            <span>Google RSS</span><span class="flow-arrow">→</span>
            <span><code>site:</code> 限定</span><span class="flow-arrow">→</span>
            <span>Gemini 筛选</span><span class="flow-arrow">→</span>
            <span>福利列表</span>
          </div>
        </article>
      </div>
      <div class="filter-heading">
        <strong>查看结果</strong>
        <span>可查看全部福利，或只看 Google 定向发现的来源</span>
      </div>
      <div class="source-filters" aria-label="选择采集源">
        <button
          type="button"
          class="source-filter"
          :class="{ active: selectedSource === 'all' }"
          @click="selectedSource = 'all'"
        >
          <strong>全部福利</strong>
          <small>{{ welfareSourceCount }} 条</small>
        </button>
        <button
          v-for="source in searchSources"
          :key="source.id"
          type="button"
          class="source-filter"
          :class="{ active: selectedSource === source.id }"
          @click="selectedSource = source.id"
        >
          <strong>{{ source.label }}</strong>
          <code>site:{{ source.domain }}</code>
          <small>{{ source.count }} 条已收录</small>
        </button>
      </div>
    </section>
    <div v-if="welfareLimited.length === 0" class="source-empty">
      <strong>{{ selectedSourceLabel }} 暂无通过筛选的福利</strong>
      <span>采集源仍在定时检索，只有具体、可参与的权益才会进入列表。</span>
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
];
welfareTopSource = [...zhuanyesTopSource, ...daydayzhuanTopSource];
welfareSource = [...welfareTopSource, ...welfareInitSource].sort(
  (a, b) => b.timestamp - a.timestamp
); // 合并全部来源后全局排序，保证默认展示真正最新的数据
const collectorSources = [
  { id: "github", label: "GitHub", domain: "github.com" },
  { id: "telegram", label: "Telegram", domain: "t.me" },
  { id: "bilibili", label: "Bilibili", domain: "bilibili.com" },
];
const directCollectorSources = [
  { id: "hxm5", label: "线报屋" },
  { id: "mutouxb", label: "86收线报网" },
  { id: "yqhd8", label: "实时线报" },
  { id: "0818tuan", label: "0818团" },
  { id: "zhuanyes", label: "好赚网" },
  { id: "daydayzhuan", label: "天天线报网" },
  { id: "zhujiceping", label: "国外主机测评" },
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
        count: welfareSource.filter(
          (item) => item.website === "keyword-search" && item.searchSourceId === source.id
        ).length,
      }))
    );
    const selectedSourceLabel = computed(
      () =>
        collectorSources.find((source) => source.id === selectedSource.value)?.label ||
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
          (item) => ["zhujiceping", "keyword-search"].includes(item.website)
        );
        const regularOffers = welfareTmpAll.filter(
          (item) => !["zhujiceping", "keyword-search"].includes(item.website)
        );
        visibleItems = [...aiOffers, ...regularOffers].sort(
          (a, b) => b.timestamp - a.timestamp
        );
      }
      if (selectedSource.value === "all") return visibleItems;
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
  margin-bottom: 18px;
  padding: 22px;
  overflow: hidden;
  border: 1px solid #d8e5f5;
  border-radius: 14px;
  background:
    radial-gradient(circle at 88% 8%, rgba(91, 143, 249, 0.17), transparent 32%),
    linear-gradient(135deg, #f8fbff 0%, #f3f8ff 52%, #fbfcff 100%);
}
.collector-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
}
.collector-eyebrow {
  margin-bottom: 4px;
  color: #3471c9;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.collector-panel h2 {
  margin: 0;
  color: #23354d;
  font-size: 24px;
}
.collector-panel p {
  max-width: 620px;
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}
.collector-total {
  flex-shrink: 0;
  margin-top: 8px;
  padding: 7px 11px;
  border: 1px solid #cbdcf1;
  border-radius: 999px;
  color: #315c94;
  background: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 700;
}
.collector-panel code {
  color: #315c94;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.collector-lanes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}
.collector-lane {
  min-width: 0;
  padding: 16px;
  border: 1px solid #d8e1ec;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
}
.direct-lane {
  border-top: 3px solid #5ad8a6;
}
.search-lane {
  border-top: 3px solid #5b8ff9;
}
.lane-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.lane-heading h3 {
  margin: 3px 0 0;
  color: #2c405a;
  font-size: 17px;
}
.lane-heading small {
  flex-shrink: 0;
  color: #66809f;
  font-weight: 700;
}
.lane-kicker {
  color: #71839a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.collector-lane p {
  min-height: 48px;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.55;
}
.lane-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
}
.lane-sources > span {
  padding: 5px 8px;
  border-radius: 7px;
  color: #3d5d54;
  background: #edf8f3;
  font-size: 11px;
  font-weight: 650;
}
.search-source-list > span {
  color: #385d8d;
  background: #edf4fd;
}
.collector-flow {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 14px;
  color: #49627f;
  font-size: 12px;
  font-weight: 650;
}
.flow-arrow {
  color: #91a5bd;
}
.filter-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 20px;
  color: #34475f;
}
.filter-heading span {
  color: #7c8b9d;
  font-size: 12px;
}
.source-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.source-filter {
  display: flex;
  min-width: 0;
  min-height: 72px;
  padding: 12px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  border: 1px solid #d8e1ec;
  border-radius: 10px;
  color: #334155;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.source-filter:hover {
  border-color: #8cb3ea;
  transform: translateY(-1px);
}
.source-filter.active {
  border-color: #5b8ff9;
  background: #fff;
  box-shadow: 0 5px 16px rgba(57, 104, 169, 0.13);
}
.source-filter strong {
  font-size: 14px;
}
.source-filter small {
  margin-top: auto;
  color: #8795a8;
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
    padding: 16px;
  }

  .collector-intro {
    display: block;
  }

  .collector-total {
    display: inline-flex;
    margin-top: 12px;
  }

  .collector-panel h2 {
    font-size: 21px;
  }

  .collector-lanes {
    grid-template-columns: 1fr;
  }

  .collector-lane p {
    min-height: 0;
  }

  .filter-heading {
    display: block;
  }

  .filter-heading span {
    display: block;
    margin-top: 4px;
  }

  .source-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .source-filter {
    min-height: 76px;
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
