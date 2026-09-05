<template>
  <section class="entertainment-section">
    <header class="section-header">
      <div>
        <p class="eyebrow">ENTERTAINMENT UPDATES</p>
        <h1>娱乐专区</h1>
        <p class="section-intro">豆瓣动画与关注作者的新作品集中呈现，打开清单就能看到最近值得追的内容。</p>
      </div>
      <div class="source-summary" aria-label="内容来源概览">
        <strong>{{ contentCount }}</strong>
        <span>部内容 · 3 个来源</span>
      </div>
    </header>

    <div class="snapshot-note">
      <span class="note-dot" aria-hidden="true"></span>
      豆瓣只跟踪首页“最近热门电视剧”中的动画更新；抖音优先跟踪李子栗、独孤十一，快手暂时保留历史热度快照。
    </div>

    <div class="toolbar">
      <div class="platform-tabs" role="tablist" aria-label="选择娱乐平台">
        <button
          v-for="tab in platformTabs"
          :key="tab.key"
          class="platform-tab"
          :class="{ active: activePlatform === tab.key }"
          type="button"
          role="tab"
          :aria-selected="activePlatform === tab.key"
          @click="activePlatform = tab.key"
        >
          {{ tab.label }}
          <span>{{ tab.count }}</span>
        </button>
      </div>

    </div>

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

const movieItems: EntertainmentItem[] = movieData
  .map((movie) => ({
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
    publishedAt: 0,
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
  .sort((left, right) => right.qualityScore - left.qualityScore)
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
  .slice(0, 24);

const itemsByPlatform: Record<EntertainmentPlatform, EntertainmentItem[]> = {
  movie: movieItems,
  kuaishou: kuaishouItems,
  douyin: douyinItems,
};

const featuredItems = interleave(douyinItems, movieItems, kuaishouItems);
const contentCount = movieItems.length + kuaishouItems.length + douyinItems.length;

const platformTabs = computed(() => [
  { key: "all" as const, label: "全部", count: contentCount },
  { key: "movie" as const, label: "豆瓣动画", count: movieItems.length },
  { key: "kuaishou" as const, label: "快手", count: kuaishouItems.length },
  { key: "douyin" as const, label: "抖音", count: douyinItems.length },
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

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 4px 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

h1 {
  margin: 0;
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.section-intro {
  max-width: 590px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.source-summary {
  min-width: 170px;
  padding: 16px 18px;
  border: 1px solid #ebe5dd;
  border-radius: 16px;
  background: #fffaf4;
}

.source-summary strong,
.source-summary span {
  display: block;
}

.source-summary strong {
  font-size: 26px;
}

.source-summary span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.snapshot-note {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border-radius: 10px;
  background: #f6f7f9;
  color: #666970;
  font-size: 13px;
  line-height: 1.5;
}

.note-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef8b4d;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 22px 0 18px;
}

.platform-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.platform-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  padding: 9px 13px;
  border: 1px solid #dedfe3;
  border-radius: 999px;
  background: #fff;
  color: #555961;
  cursor: pointer;
}

.platform-tab span {
  color: #989ba1;
  font-size: 11px;
}

.platform-tab.active {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}

.platform-tab.active span {
  color: #d6d7da;
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
  .section-header { align-items: flex-start; padding-top: 2px; }
  .source-summary { display: none; }
  .toolbar { align-items: flex-start; flex-direction: column; }
  .platform-tabs { width: 100%; }
  .content-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .snapshot-note { align-items: flex-start; }
  .note-dot { margin-top: 6px; }
}
</style>
