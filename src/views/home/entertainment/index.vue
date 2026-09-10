<template>
  <section class="entertainment-section">
    <section class="entertainment-panel" aria-labelledby="entertainment-title">
      <header class="entertainment-overview">
        <div class="overview-copy">
          <h1 id="entertainment-title">娱乐专区</h1>
          <p class="section-intro">豆瓣动画与哔哩、抖音精选作者内容集中呈现；快手当前保留历史热度快照。</p>
        </div>
        <div class="overview-stats" aria-label="内容来源概览">
          <span><strong>{{ contentCount }}</strong> 条内容</span>
          <span><strong>{{ platformCount }}</strong> 个来源</span>
        </div>
      </header>

      <section class="entertainment-filters" aria-label="筛选娱乐内容">
        <div class="filter-row">
          <span class="filter-label">内容来源</span>
          <div class="platform-tabs" role="group" aria-label="选择内容来源">
            <button
              v-for="tab in platformTabs"
              :key="tab.key"
              class="platform-tab"
              :class="{ active: activePlatform === tab.key }"
              type="button"
              :aria-pressed="activePlatform === tab.key"
              @click="activePlatform = tab.key"
            >
              {{ tab.label }}
              <span>{{ tab.count }}</span>
            </button>
          </div>
          <span class="filter-result" role="status" aria-live="polite" aria-atomic="true">
            {{ filteredItems.length }} 条当前结果
          </span>
        </div>
      </section>

      <details class="source-details">
        <summary>更新范围与来源说明</summary>
        <p>豆瓣跟踪热门动画更新；哔哩视频跟踪百科老王、杨博士说AI；抖音跟踪李子栗、独孤十一；快手保留历史热度快照。</p>
      </details>
    </section>

    <div v-if="visibleItems.length" class="content-grid">
      <EntertainmentCard v-for="item in visibleItems" :key="item.key" :item="item" />
    </div>

    <p v-if="visibleItems.length < filteredItems.length" class="loading-hint">
      继续向下滚动，查看更多内容
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { isPC } from "../../../utils/utils";
import movieData from "../../../data/movie.json";
import kuaishouData from "../../../data/kuaishouData.json";
import douyinData from "../../../data/tiktok.json";
import bilibiliData from "../../../data/bilibili.json";
import EntertainmentCard, { type EntertainmentItem, type EntertainmentPlatform } from "./component/EntertainmentCard.vue";

type PlatformFilter = "all" | EntertainmentPlatform;

const props = defineProps<{
  entertainmentLocation?: string | number;
}>();

const activePlatform = ref<PlatformFilter>("all");

const toNumber = (value: unknown) => {
  const text = String(value ?? "").trim();
  const numeric = Number.parseFloat(text.replace(/[^\d.]/g, "")) || 0;
  return /万/.test(text) ? numeric * 10_000 : numeric;
};

const timestampOf = (value: unknown) => {
  const timestamp = toNumber(value);
  return timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
};

const movieBaseTime = 1788574763000; // 2026-09-05 10:19:23

const movieItems: EntertainmentItem[] = movieData
  .map((movie, index) => ({
    key: `movie-${movie.id}`,
    id: String(movie.id),
    platform: "movie" as const,
    title: movie.title,
    coverUrl: movie.cover,
    url: movie.url,
    actionLabel: "查看动画",
    primaryMetric: toNumber(movie.rate) ? `豆瓣 ${movie.rate}` : "暂无评分",
    secondaryMetric: movie.episodes_info || (movie.is_new ? "新上榜" : "动画热度"),
    qualityScore: toNumber(movie.rate),
    publishedAt: movieBaseTime - index * 1000,
    footerLabel: "豆瓣动画更新",
    isNew: movie.is_new,
  }))
  .slice(0, 50);

const kuaishouItems: EntertainmentItem[] = kuaishouData
  .map((video, index) => {
    const viewCount = toNumber(video.viewCount);
    const likeCount = toNumber(video.likeCount);
    const detailUrl = "detailUrl" in video ? String(video.detailUrl || "") : "";
    return {
      key: `kuaishou-${video.timestamp}-${index}`,
      platform: "kuaishou" as const,
      title: video.originCaption || "快手作品",
      coverUrl: video.captionUrl,
      url: detailUrl || "https://www.kuaishou.com/",
      actionLabel: detailUrl ? "查看作品" : "前往快手",
      primaryMetric: `${formatCompactNumber(viewCount)} 播放`,
      secondaryMetric: `${formatCompactNumber(likeCount)} 喜欢 · 历史快照`,
      qualityScore: viewCount + likeCount * 4,
      publishedAt: timestampOf(video.timestamp),
    };
  })
  .sort((left, right) => right.publishedAt - left.publishedAt)
  .slice(0, 18);

const douyinItems: EntertainmentItem[] = douyinData
  .map((video, index) => {
    const likeCount = toNumber("likeCount" in video ? video.likeCount : 0);
    const authorName = "authorName" in video ? String(video.authorName || "") : "关注作者";
    const detailUrl = "detailUrl" in video ? String(video.detailUrl || "") : "";
    return {
      key: `douyin-${video.timestamp}-${index}`,
      platform: "douyin" as const,
      title: video.desc || "抖音作者更新",
      coverUrl: video.captionUrl,
      url: detailUrl || ("authorPage" in video ? String(video.authorPage || "") : "https://www.douyin.com/"),
      actionLabel: detailUrl ? "查看更新" : "前往作者主页",
      primaryMetric: authorName,
      secondaryMetric: likeCount ? `${formatCompactNumber(likeCount)} 喜欢` : "作者更新",
      qualityScore: douyinData.length - index,
      publishedAt: timestampOf(video.timestamp),
      footerLabel: "作者主页更新",
    };
  })
  .sort((left, right) => right.publishedAt - left.publishedAt)
  .slice(0, 24);

const bilibiliItems: EntertainmentItem[] = (bilibiliData as Array<Record<string, unknown>>)
  .map((video, index) => {
    const likeCount = toNumber(video.likeCount);
    const authorName = String(video.authorName || "UP主");
    const playCount = String(video.playCount || "");
    const detailUrl = String(video.detailUrl || video.videoUrl || "");
    return {
      key: `bilibili-${video.bvid || video.timestamp}-${index}`,
      platform: "bilibili" as const,
      title: String(video.desc || "哔哩视频"),
      coverUrl: String(video.captionUrl || ""),
      url: detailUrl || "https://www.bilibili.com/",
      actionLabel: "查看视频",
      primaryMetric: authorName,
      secondaryMetric: playCount ? `${playCount} 播放${likeCount ? ` · ${formatCompactNumber(likeCount)} 点赞` : ""}` : "UP主更新",
      qualityScore: bilibiliData.length - index,
      publishedAt: timestampOf(video.timestamp),
      footerLabel: "UP主动态更新",
    };
  })
  .sort((left, right) => right.publishedAt - left.publishedAt)
  .slice(0, 30);

const itemsByPlatform: Record<EntertainmentPlatform, EntertainmentItem[]> = {
  movie: movieItems,
  kuaishou: kuaishouItems,
  douyin: douyinItems,
  bilibili: bilibiliItems,
};

const featuredItems = [...douyinItems, ...bilibiliItems, ...movieItems, ...kuaishouItems]
  .sort((left, right) => right.publishedAt - left.publishedAt);
const contentCount = movieItems.length + kuaishouItems.length + douyinItems.length + bilibiliItems.length;
const platformCount = Object.values(itemsByPlatform).filter((items) => items.length).length;

const platformTabs = computed(() => [
  { key: "all" as const, label: "全部", count: contentCount },
  { key: "movie" as const, label: "豆瓣动画", count: movieItems.length },
  { key: "kuaishou" as const, label: "快手", count: kuaishouItems.length },
  { key: "douyin" as const, label: "抖音", count: douyinItems.length },
  { key: "bilibili" as const, label: "哔哩视频", count: bilibiliItems.length },
]);

const filteredItems = computed(() => {
  return activePlatform.value === "all"
    ? featuredItems
    : itemsByPlatform[activePlatform.value];
});

const visibleItems = computed(() => {
  const scrollStep = Math.max(0, Number(props.entertainmentLocation) || 0);
  const initialCount = isPC() ? 12 : 6;
  const stepSize = isPC() ? 4 : 2;
  return filteredItems.value.slice(0, initialCount + scrollStep * stepSize);
});

function formatCompactNumber(value: number) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, "")}亿`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(Math.round(value));
}

function interleave(...groups: EntertainmentItem[][]) {
  const result: EntertainmentItem[] = [];
  const maxLength = Math.max(...groups.map((group) => group.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const group of groups) {
      if (group[index]) result.push(group[index]);
    }
  }
  return result;
}
</script>

<style scoped>
.entertainment-section {
  --ink: #1f2228;
  --muted: #6e7178;
  --accent: #ef5b3f;
  padding: 0 4px 36px;
  color: var(--ink);
}

.entertainment-panel {
  margin-bottom: 12px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid #d8e5f5;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%);
}

.entertainment-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 12px;
}

.overview-copy {
  min-width: 0;
  flex: 1;
}

.entertainment-overview h1 {
  margin: 0;
  color: #30486f;
  font-size: 20px;
  line-height: 1.3;
}

.section-intro {
  max-width: 720px;
  margin: 4px 0 0;
  color: #65738a;
  font-size: 13px;
  line-height: 1.55;
}

.overview-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  color: #607895;
  font-size: 12px;
}

.overview-stats span {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}

.overview-stats strong {
  color: #3471c9;
  font-size: 16px;
}

.entertainment-filters {
  margin-bottom: 7px;
  padding: 9px 12px;
  border: 1px solid #e4e9f2;
  border-radius: 9px;
  background: #fff;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  flex: 0 0 64px;
  color: #52657c;
  font-size: 12px;
  font-weight: 700;
}

.platform-tabs {
  display: flex;
  min-width: 0;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.platform-tabs::-webkit-scrollbar {
  display: none;
}

.platform-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  min-height: 26px;
  padding: 2px 9px;
  border: 1px solid #d8e0ec;
  border-radius: 999px;
  background: #f8fafc;
  color: #52647d;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.16s, color 0.16s, background 0.16s;
}

.platform-tab span {
  color: inherit;
  font-size: 11px;
  opacity: 0.82;
}

.platform-tab:hover {
  border-color: #8eb8ee;
  color: #337ecc;
}

.platform-tab:focus-visible {
  outline: 2px solid #8cb8f4;
  outline-offset: 2px;
}

.platform-tab.active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.platform-tab.active span {
  color: inherit;
}

.filter-result {
  margin-left: auto;
  flex-shrink: 0;
  color: #4a74ad;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.source-details {
  margin-bottom: 0;
  color: #60758e;
  font-size: 12px;
}

.source-details summary {
  width: max-content;
  cursor: pointer;
  color: #57708e;
  user-select: none;
}

.source-details[open] summary {
  color: #3471c9;
}

.source-details p {
  margin: 8px 0 0;
  padding: 9px 12px;
  border: 1px solid #e1e9f3;
  border-radius: 8px;
  color: #65738a;
  background: #f8fbff;
  line-height: 1.55;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.loading-hint {
  margin: 24px 0 0;
  color: #93969c;
  text-align: center;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .content-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .entertainment-panel {
    padding: 13px;
  }
  .entertainment-overview {
    display: block;
  }
  .entertainment-overview h1 { font-size: 19px; }
  .section-intro { font-size: 12px; }
  .overview-stats {
    gap: 7px 12px;
    margin-top: 8px;
    flex-wrap: wrap;
    font-size: 11px;
  }
  .overview-stats strong { font-size: 14px; }
  .entertainment-filters { padding: 8px 9px; }
  .filter-label { flex-basis: 60px; }
  .platform-tabs { flex: 1; }
  .platform-tab {
    min-height: 32px;
    padding: 4px 9px;
  }
  .filter-result { display: none; }
  .content-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
}
</style>
