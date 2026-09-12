<template>
  <div>
    <section class="ecosystem-panel" aria-labelledby="welfare-radar-title">
      <div class="ecosystem-radar">
        <div>
          <div class="radar-title" id="welfare-radar-title">薅羊毛福利雷达</div>
        </div>
        <div class="radar-stats" aria-label="福利数据统计">
          <span><strong>{{ welfareSourceCount }}</strong> 条线报资讯</span>
          <span><strong>{{ directSourceCount }}</strong> 条固定来源</span>
          <span><strong>{{ directedSourceCount }}</strong> 条定向发现</span>
          <span :title="'统计全部资讯的细分标签，本机和定时采集共同计入'"><strong>{{ tagCounts.size }}</strong> 个细分标签</span>
        </div>
      </div>

      <div class="radar-filters">
        <!-- 核心分类 (生态雷达) -->
        <TagCategoryPicker domain="welfare" :options="categoryOptions" :total="welfareSourceCount" v-model="selectedCategory" />

        <!-- 观察视角 -->
        <div class="filter-row" role="group" aria-label="按观察视角筛选">
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
        </div>

        <!-- 采集方式 -->
        <div class="filter-row" role="group" aria-label="按采集方式筛选">
          <span class="filter-label">采集方式</span>
          <button
            v-for="mode in collectionModes"
            :key="mode.id"
            type="button"
            class="filter-tag mode-tag"
            :class="{ active: selectedSource === mode.id || (mode.id !== 'all' && selectedSource.startsWith(`${mode.id}:`)) }"
            :aria-pressed="selectedSource === mode.id || (mode.id !== 'all' && selectedSource.startsWith(`${mode.id}:`))"
            @click="selectedSource = mode.id"
          >
            {{ mode.label }} <small>{{ mode.count }}</small>
          </button>
          <span class="filter-result">{{ filteredWelfare.length }} 条当前结果</span>
        </div>

        <!-- 固定来源 -->
        <div class="filter-row source-scroll-row" role="group" aria-label="按固定来源筛选">
          <span class="filter-label">固定来源</span>
          <button
            v-for="source in directSources"
            :key="source.id"
            type="button"
            class="filter-tag direct-chip"
            :class="{ active: selectedSource === source.id }"
            :aria-pressed="selectedSource === source.id"
            title="固定来源直采"
            @click="selectedSource = source.id"
          >
            {{ source.label }} <small>{{ source.count }}</small>
          </button>
        </div>

        <!-- 定向来源 -->
        <div class="filter-row source-scroll-row" role="group" aria-label="按定向来源筛选">
          <span class="filter-label">定向发现</span>
          <button
            v-for="source in searchSources"
            :key="source.id"
            type="button"
            class="filter-tag search-chip"
            :class="{ active: selectedSource === source.id }"
            :aria-pressed="selectedSource === source.id"
            :title="`Google RSS · site:${source.domain}`"
            @click="selectedSource = source.id"
          >
            {{ source.label }} <small>{{ source.count }}</small>
          </button>
        </div>
      </div>

      <!-- 采集规则说明展开 -->
      <details class="collector-details">
        <summary>采集范围与更新规则</summary>
        <p>顶部统计为去重后的全部资讯；来源按钮数量按当前标签和观察视角统计，当前结果再叠加所选来源。固定来源与 Google 定向发现分别计数，同一平台的两种采集方式独立筛选。</p>
        <p>保留全部多路采集源资讯，由 Gemini 智能标注权益类型与福利信号；涵盖固定线报直采与 Google 定向发现。</p>
        <CollectionFreshness tab="welfare" />
        <ContentAnalysis domain="welfare" :items="welfareSource" @analyzed="applyAnalysis" />
        <p>插件采集按每位作者上次成功检查的时间提醒：45 分钟后即将过期，1 小时后建议手动刷新。这里指采集记录的新鲜度，不代表福利活动或登录状态的有效期；失败保留原内容。</p>
        <div class="collector-detail-grid">
          <div>
            <strong>固定来源</strong>
            <p>
              线报站筛选银行优惠与各类高优福利，主机站筛选年费不超过 20 美元的 VPS；闲鱼仅关注 115 网盘会员、迅雷会员和 QQ 阅读充值优惠。
            </p>
            <div class="detail-sources">
              <span v-for="source in directCollectorSources" :key="source.id">{{ source.label }}</span>
            </div>
          </div>
          <div>
            <strong>Google 定向发现</strong>
            <p>
              发现 VPS、域名、云服务额度，以及 AI 订阅促销和活动性额度重置。
            </p>
            <div class="detail-sources search-detail-sources">
              <span v-for="source in collectorSources" :key="source.id">
                {{ source.label }} <code>site:{{ source.domain }}</code>
              </span>
            </div>
          </div>
        </div>
        <p class="collector-note">
          保留全部采集源资讯并由 Gemini 智能标注；来源暂不可用时保留已有快照。参与条件与有效期请以原文为准。
        </p>
      </details>
    </section>

    <div v-if="filteredWelfare.length === 0" class="filter-empty">
      <strong>{{ selectedFilterLabel }} 暂无通过筛选的福利</strong>
      <p style="margin-top: 6px; font-size: 12px; color: #8a98aa;">
        当前标签组合暂无福利资讯，可切换福利分类、观察视角或资讯来源。
      </p>
    </div>

    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in welfareLimited"
        :key="item.link || sonIndex"
      >
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div class="welfare-month" :style="`color:${handleYearColor(item)}`">
                <div class="welfare-icon-month">
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
                <el-icon><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div class="welfare-content-body">
              <a
                class="welfare-link-title"
                :href="item.link"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="ecosystem-tags" v-if="item.ecosystem">
                <el-tag size="small">{{ item.ecosystem.category }}</el-tag>
                <el-tag size="small" type="success">
                  福利 {{ item.ecosystem.welfareValue }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="item.ecosystem.isBankOffer">
                  银行官方
                </el-tag>
                <el-tag
                  size="small"
                  type="info"
                  v-for="sig in contentTags(item)"
                  :title="`全部资讯中有 ${tagCounts.get(sig) || 0} 条包含此标签（含本机分析）`"
                  :key="sig"
                >
                  {{ sig }} · {{ tagCounts.get(sig) || 0 }} 条
                </el-tag>
              </div>
              <div class="ecosystem-tags" v-else>
                <el-tag size="small" type="info">福利待标注</el-tag>
              </div>
              <div class="ecosystem-summary" v-if="item.ecosystem && item.ecosystem.summary">
                {{ item.ecosystem.summary }}
              </div>
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
                <span v-else class="discovery-badge direct-badge">{{ handleWebsiteName(item) }}</span>
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
import { ref, computed, reactive } from "vue";
import TagCategoryPicker from "../../../components/TagCategoryPicker.vue";
import ContentAnalysis from "../../../components/ContentAnalysis.vue";
import CollectionFreshness from "../../../components/CollectionFreshness.vue";
import { contentTags, countContentTags, allContentCategories } from "../../../utils/contentTagCounts";
import { analysisFor } from "../../../utils/contentAnalysis";
import { gotoOutPage, isPC } from "../../../utils/utils";
import oldSource from "../../../data/welfare.json";
import { bilibiliItemsFor } from "../../../utils/bilibiliSources";
import tuanSource from "../../../data/welfare/0818tuan.json";
import tuanTopSource from "../../../data/welfare/0818tuanTop.json";
import zhuanyesSource from "../../../data/welfare/zhuanyes.json";
import zhuanyesTopSource from "../../../data/welfare/zhuanyesTop.json";
import daydayzhuanSource from "../../../data/welfare/daydayzhuan.json";
import daydayzhuanTopSource from "../../../data/welfare/daydayzhuanTop.json";
import zhujicepingSource from "../../../data/welfare/zhujiceping.json";
import keywordSearchSource from "../../../data/welfare/keyword-search.json";
import keywordSearchConfig from "../../../../project-support/crawl/welfare/keyword_search_config.json";
import welfareRadar from "../../../data/welfare-ecosystem.json";
import logoImageUrl from "../../../assets/logo.jpg";
import { Calendar, Timer } from "@element-plus/icons-vue";
import {
  ElRow,
  ElCol,
  ElCard,
  ElIcon,
  ElDivider,
  ElAvatar,
  ElTag,
} from "element-plus";

// 定向发现来源配置
const collectorSources = keywordSearchConfig.searchSources;

// 固定直采来源配置
const directCollectorSources = [
  { id: "bilibili", label: "bilibili · 百科老王 / 国外主机测评" },
  { id: "hxm5", label: "线报屋" },
  { id: "yqhd8", label: "实时线报" },
  { id: "0818tuan", label: "0818团" },
  { id: "zhuanyes", label: "好赚网" },
  { id: "daydayzhuan", label: "天天线报网" },
  { id: "zhujiceping", label: "国外主机测评" },
];

const ecosystemByLink = new Map(
  ((welfareRadar as any).items || []).map((item: any) => [item.link, item])
);

const rawInitSource = [
  ...bilibiliItemsFor("welfare"),
  ...oldSource,
  ...tuanSource,
  ...zhuanyesSource,
  ...daydayzhuanSource,
  ...zhujicepingSource,
  ...keywordSearchSource,
];
const rawTopSource = [
  ...tuanTopSource,
  ...zhuanyesTopSource,
  ...daydayzhuanTopSource,
];

// 去重合并并注入生态标注数据
const seenLinks = new Set<string>();
const uniqueWelfare: any[] = [];
for (const item of [...rawTopSource, ...rawInitSource]) {
  const link = (item as any).link || (item as any).url;
  if (!link || seenLinks.has(link)) continue;
  seenLinks.add(link);
  uniqueWelfare.push({
    ...item,
    link,
    ecosystem: analysisFor("welfare", link, item.title || "") || ecosystemByLink.get(link),
  });
}
const welfareSource = reactive(uniqueWelfare.sort((a, b) => b.timestamp - a.timestamp));

export default {
  props: {
    welfareLocation: [String, Number],
  },
  setup(props: any) {
    const applyAnalysis = (results: any[]) => {
      for (const result of results) for (const item of welfareSource) {
        if (item.link === result.url) item.ecosystem = result.analysis;
      }
    };
    const logoUrl = logoImageUrl;

    const welfareSourceCount = computed(() => welfareSource.length);
    const directSourceCount = computed(
      () => welfareSource.filter((item) => item.website !== "keyword-search").length
    );
    const directedSourceCount = computed(
      () => welfareSource.filter((item) => item.website === "keyword-search").length
    );

    const tagCounts = computed(() => countContentTags(welfareSource));
    const analyzedCount = computed(
      () => welfareSource.filter((item: any) => item.ecosystem).length
    );

    const selectedCategory = ref("all");
    const selectedFocus = ref("all");
    const selectedSource = ref("all");
    const categoryOptions = computed(() => [...countContentTags(welfareSource, true).entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN")));

    const focusOptions = [
      { key: "all", label: "全部视角" },
      { key: "high", label: "高价值福利" },
      { key: "instant", label: "零门槛秒到" },
      { key: "bank", label: "银行专享" },
      { key: "lottery", label: "抽奖红包" },
      { key: "discount", label: "立减返现" },
    ];

    const collectionModes = computed(() => [
      { id: "all", label: "全部", count: matchingWelfare.value.length },
      { id: "direct", label: "固定来源", count: matchingWelfare.value.filter((item) => item.website !== "keyword-search").length },
      { id: "directed", label: "定向发现", count: matchingWelfare.value.filter((item) => item.website === "keyword-search").length },
    ]);

    const directSources = computed(() =>
      directCollectorSources.map((source) => ({
        ...source,
        id: `direct:${source.id}`,
        kind: "direct",
        count: matchingWelfare.value.filter((item) => item.website === source.id).length,
      }))
    );

    const searchSources = computed(() =>
      collectorSources.map((source) => ({
        ...source,
        id: `directed:${source.id}`,
        kind: "search",
        count: matchingWelfare.value.filter(
          (item) => item.website === "keyword-search" && item.searchSourceId === source.id
        ).length,
      }))
    );

    const selectedFilterLabel = computed(() => {
      const allSources = [
        ...collectionModes.value,
        ...directSources.value,
        ...searchSources.value,
      ];
      return allSources.find((s) => s.id === selectedSource.value)?.label || "当前来源";
    });

    const matchingWelfare = computed(() =>
      welfareSource.filter((item: any) => {
        const ecosystem = item.ecosystem;

        // 2. 分类筛选
        if (selectedCategory.value !== "all") {
          if (!ecosystem || !allContentCategories(item).includes(selectedCategory.value)) {
            return false;
          }
        }

        // 3. 观察视角筛选
        if (selectedFocus.value === "all") return true;
        if (!ecosystem) return false;

        switch (selectedFocus.value) {
          case "high":
            return ecosystem.welfareValue >= 80;
          case "instant":
            return (
              ecosystem.difficulty <= 25 ||
              (ecosystem.signals || []).some((s: string) =>
                /秒到|直接领|无门槛|必中/.test(s)
              ) ||
              /秒到|直接领|无门槛/.test(item.title)
            );
          case "bank":
            return Boolean(ecosystem.isBankOffer);
          case "lottery":
            return (
              ecosystem.category === "抽奖签到" ||
              (ecosystem.signals || []).some((s: string) => /抽奖|红包|转盘/.test(s)) ||
              /抽奖|红包|转盘/.test(item.title)
            );
          case "discount":
            return (
              ecosystem.category === "支付立减" ||
              (ecosystem.signals || []).some((s: string) => /立减|返现/.test(s)) ||
              /立减|返现/.test(item.title)
            );
          default:
            return true;
        }
      })
    );

    const filteredWelfare = computed(() => matchingWelfare.value.filter((item: any) => {
      const source = selectedSource.value;
      const directed = item.website === "keyword-search";
      if (source === "all") return true;
      if (source === "direct") return !directed;
      if (source === "directed") return directed;
      return source === `${directed ? "directed" : "direct"}:${directed ? item.searchSourceId : item.website}`;
    }));

    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const welfareLimited = computed(() => {
      const length: number = Number(props.welfareLocation);
      const initData = isPCRes.value ? 20 : 12;
      maxLength < length ? (maxLength = length) : maxLength;
      const rate = isPCRes.value ? 4 : 2;

      let visibleItems = filteredWelfare.value;
      // 当处于全局/大类模式时，将主机测评与定向发现等稀缺源条目置前，避免被普通海量资讯挤出首屏
      if (["all", "direct", "directed"].includes(selectedSource.value)) {
        const specialOffers = visibleItems.filter((item: any) =>
          ["zhujiceping", "keyword-search"].includes(item.website)
        );
        const regularOffers = visibleItems.filter(
          (item: any) => !["zhujiceping", "keyword-search"].includes(item.website)
        );
        visibleItems = [...specialOffers, ...regularOffers].sort(
          (a: any, b: any) => b.timestamp - a.timestamp
        );
      }

      return visibleItems.slice(
        0,
        maxLength * rate + initData < visibleItems.length
          ? maxLength * rate + initData
          : visibleItems.length
      );
    });

    const handleMonth = (item: any) => {
      const date = new Date(item.timestamp);
      return `${date.getMonth() + 1}月`;
    };

    const handleDay = (item: any) => {
      const date = new Date(item.timestamp);
      const day = date.getDate();
      return day < 10 ? "0" + day : day.toString();
    };

    const handleHour = (item: any) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours.toString();
      const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
      return `${formattedHours}:${formattedMinutes}`;
    };

    const handleYearColor = (item: any) => {
      const date = new Date(item.timestamp);
      const year = date.getFullYear();
      const currentYear = new Date().getFullYear();
      return year < currentYear ? "#e96a43" : "";
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
        case "bilibili":
          websiteInfo = {
            websiteName: `bilibili · ${item.authorName || "UP主"}`,
            mainWebsite: item.authorPage,
            websiteImg: "https://www.bilibili.com/favicon.ico",
          };
          break;
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
            websiteImg: "https://icons.duckduckgo.com/ip3/www.0818tuan.com.ico",
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
        case "keyword-search": {
          const sourceIcons: Record<string, string> = {
            github: "https://github.com/favicon.ico",
            telegram: "https://telegram.org/favicon.ico",
            bilibili: "https://www.bilibili.com/favicon.ico",
            xianyu: "https://img.alicdn.com/tfs/TB19WObTNv1gK0jSZFFXXb0sXXa-144-144.png",
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
        }
        default:
          websiteInfo = {
            websiteName: "福利资讯",
            mainWebsite: "https://lptff.github.io/",
            websiteImg: logoImageUrl,
          };
      }
      return websiteInfo;
    };

    const handleWebsiteName = (item: any) => {
      let websiteInfo = getWebsiteInfo(item);
      return websiteInfo.websiteName;
    };

    const handleWebsiteImg = (item: any) => {
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

    const gotoMainWebsite = (item: any) => {
      let websiteInfo = getWebsiteInfo(item);
      if (websiteInfo.mainWebsite) {
        gotoOutPage(websiteInfo.mainWebsite);
      }
    };

    return {
      applyAnalysis,
      contentTags,
      tagCounts,
      searchSources,
      directSources,
      collectionModes,
      focusOptions,
      categoryOptions,
      selectedFocus,
      selectedCategory,
      logoUrl,
      selectedSource,
      welfareSource,
      welfareSourceCount,
      directSourceCount,
      directedSourceCount,
      analyzedCount,
      selectedFilterLabel,
      directCollectorSources,
      collectorSources,
      filteredWelfare,
      isPCRes,
      welfareLimited,
      handleMonth,
      handleDay,
      handleHour,
      handleYearColor,
      gotoWelfareWebsite,
      handleImageError,
      handleWebsiteName,
      handleWebsiteImg,
      fallbackChar,
      fallbackColor,
      gotoMainWebsite,
    };
  },
  components: {
    CollectionFreshness,
    ContentAnalysis,
    TagCategoryPicker,
    ElRow,
    ElCol,
    ElCard,
    ElIcon,
    ElDivider,
    ElAvatar,
    ElTag,
    Calendar,
    Timer,
  },
};
</script>

<style scoped>
.ecosystem-panel {
  margin-bottom: 14px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid #d8e5f5;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%);
}
.ecosystem-radar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.ecosystem-radar > div:first-child {
  min-width: 0;
  flex: 1;
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
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  color: #4a74ad;
  font-size: 13px;
  font-weight: 600;
}
.radar-stats strong {
  color: #3471c9;
  font-size: 16px;
}
.radar-filters {
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
  white-space: nowrap;
  transition: 0.16s ease;
}
.filter-tag small {
  margin-left: 2px;
  font-size: 11px;
  opacity: 0.85;
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
  color: #fff;
}
.mode-tag.active {
  border-color: #337ecc;
  background: #337ecc;
  color: #fff;
}
.direct-chip.active {
  border-color: #2e8b57;
  background: #2e8b57;
  color: #fff;
}
.search-chip.active {
  border-color: #3471c9;
  background: #3471c9;
  color: #fff;
}
.filter-result {
  margin-left: auto;
  color: #4a74ad;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.collector-details {
  margin-top: 10px;
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
  line-height: 1.5;
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
.collector-note {
  margin-top: 6px;
  font-size: 11px;
}
.filter-empty {
  margin-bottom: 14px;
  padding: 28px;
  border: 1px dashed #c9d5e6;
  border-radius: 8px;
  color: #65738a;
  text-align: center;
  background: #fbfcfe;
}
.ecosystem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 6px;
}
.ecosystem-summary {
  max-width: 700px;
  margin-bottom: 8px;
  color: #65738a;
  font-size: 13px;
  line-height: 1.45;
}
.discovery-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  margin-top: 4px;
  padding: 0 8px;
  border-radius: 999px;
  color: #3c6598;
  background: #edf5ff;
  font-size: 11px;
  font-weight: 600;
}
.direct-badge {
  color: #34705d;
  background: #edf8f3;
}
.welfare-content-body {
  flex: 1;
  min-width: 0;
}
.welfare-div-website {
  display: flex;
  align-items: center;
  margin: auto 0;
  cursor: pointer;
}
.welfare-name-link {
  margin-top: 2px;
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
  height: 26px;
  width: 26px;
  border-radius: 50%;
  margin-right: 8px;
}
.welfare-link-title {
  display: block;
  color: #303133;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 700px;
  transition: color 0.15s;
}
.welfare-link-title:hover {
  color: #409eff;
}
.day-week-welfare {
  margin: 0px 18px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
  line-height: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-month {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
}
.welfare-icon-month {
  display: flex;
  margin-right: 4px;
}
.welfare-icon-hour {
  margin-right: 6px;
  margin-top: 2px;
}
.welfare-hour {
  margin: 0px 30px 0px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-weight: 600;
  font-size: 14px;
}
.welfare-div-link {
  display: flex;
  align-items: center;
}
.el-welfare-divider {
  height: 100%;
}
.welfare-date {
  margin-right: 20px;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.welfare-card {
  margin-bottom: 10px;
  transition: box-shadow 0.15s;
}
:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
  padding: 16px 20px;
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
  .ecosystem-panel {
    padding: 13px;
  }
  .ecosystem-radar {
    display: block;
  }
  .radar-stats {
    gap: 7px 12px;
    margin-top: 8px;
    flex-wrap: wrap;
    font-size: 11px;
  }
  .radar-stats strong {
    font-size: 14px;
  }
  .radar-filters {
    padding: 8px 9px;
  }
  .radar-filters .filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }
  .radar-filters .filter-row::-webkit-scrollbar {
    display: none;
  }
  .radar-filters .filter-label,
  .radar-filters .filter-tag {
    flex: 0 0 auto;
  }
  .filter-result {
    display: none;
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
    gap: 0;
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
  .welfare-hour {
    margin: 0;
  }
  .welfare-link-title {
    max-width: 100%;
    font-size: 15px;
  }
  .welfare-div-website {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #eee;
  }
}
</style>
