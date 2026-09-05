<template>
  <article class="entertainment-card">
    <a class="cover-link" :href="item.url" target="_blank" rel="noopener noreferrer">
      <img
        :src="resolvedCover"
        :alt="`${platformLabel}：${item.title}`"
        class="cover-image"
        loading="lazy"
        @error="handleImageError"
      />
      <span class="platform-badge" :class="`badge-${item.platform}`">{{ platformLabel }}</span>
      <span v-if="item.isNew" class="new-badge">新</span>
    </a>

    <div class="card-content">
      <a class="item-title" :href="item.url" target="_blank" rel="noopener noreferrer">
        {{ item.title }}
      </a>
      <div class="metrics">
        <strong>{{ item.primaryMetric }}</strong>
        <span>{{ item.secondaryMetric }}</span>
      </div>
      <div class="card-footer">
        <time v-if="item.publishedAt" :datetime="isoDate">{{ displayDate }}</time>
        <span v-else>{{ item.footerLabel || "内容更新" }}</span>
        <a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.actionLabel }} →</a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import fallbackImage from "../../../../assets/bg.jpg";

export type EntertainmentPlatform = "movie" | "kuaishou" | "douyin";

export interface EntertainmentItem {
  key: string;
  id?: string;
  platform: EntertainmentPlatform;
  title: string;
  coverUrl: string;
  url: string;
  actionLabel: string;
  primaryMetric: string;
  secondaryMetric: string;
  qualityScore: number;
  publishedAt: number;
  footerLabel?: string;
  isNew?: boolean;
}

const props = defineProps<{ item: EntertainmentItem }>();

const resolvedCover = ref(props.item.platform === "movie" ? fallbackImage : (props.item.coverUrl || fallbackImage));
const platformLabel = computed(() => ({
  movie: "豆瓣动画",
  kuaishou: "快手",
  douyin: "抖音",
}[props.item.platform]));

const date = computed(() => new Date(props.item.publishedAt));
const displayDate = computed(() => props.item.publishedAt
  ? `${date.value.getFullYear()}.${String(date.value.getMonth() + 1).padStart(2, "0")}.${String(date.value.getDate()).padStart(2, "0")}`
  : "");
const isoDate = computed(() => props.item.publishedAt ? date.value.toISOString() : "");

onMounted(async () => {
  if (props.item.platform !== "movie" || !props.item.id) return;
  try {
    const posterModule = await import("../../../../data/doubanPosters.json");
    const poster = (posterModule.default as Record<string, string>)[props.item.id];
    if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(poster || "")) {
      resolvedCover.value = poster;
    }
  } catch {
    resolvedCover.value = fallbackImage;
  }
});

const handleImageError = () => {
  resolvedCover.value = fallbackImage;
};
</script>

<style scoped>
.entertainment-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e7e5e1;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(34, 31, 27, 0.04);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.entertainment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(34, 31, 27, 0.1);
}

.cover-link {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  background: #f2f0ec;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.cover-link:hover .cover-image { transform: scale(1.025); }

.platform-badge,
.new-badge {
  position: absolute;
  top: 10px;
  padding: 5px 8px;
  border-radius: 7px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  backdrop-filter: blur(8px);
}

.platform-badge { left: 10px; }
.new-badge { right: 10px; background: rgba(20, 128, 76, 0.9); }
.badge-movie { background: rgba(24, 115, 73, 0.9); }
.badge-kuaishou { background: rgba(255, 73, 41, 0.9); }
.badge-douyin { background: rgba(28, 29, 34, 0.9); }

.card-content { padding: 13px 14px 14px; }

.item-title {
  display: -webkit-box;
  min-height: 44px;
  overflow: hidden;
  color: #25272d;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  text-decoration: none;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-title:hover { color: #e65036; }

.metrics {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 10px;
}

.metrics strong { color: #e45a36; font-size: 14px; }
.metrics span { color: #92959a; font-size: 12px; }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid #f0efec;
  color: #9a9ca1;
  font-size: 11px;
}

.card-footer a { color: #555960; font-weight: 600; text-decoration: none; }

@media (max-width: 768px) {
  .card-content { padding: 11px; }
  .item-title { min-height: 42px; font-size: 14px; }
  .metrics { align-items: flex-start; flex-direction: column; gap: 2px; }
  .card-footer a { max-width: 70px; text-align: right; }
}
</style>
