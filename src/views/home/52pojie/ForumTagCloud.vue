<template>
  <section class="tag-cloud-card" aria-labelledby="forum-tag-cloud-title">
    <div class="tag-cloud-heading">
      <div>
        <h2 id="forum-tag-cloud-title">社区标签词云</h2>
        <p>汇总当前筛选结果中的生态主题、技术工具和细分标签；词越大，涉及的资源越多。</p>
      </div>
      <span v-if="allTags.length" class="tag-cloud-count">
        展示 {{ cloudTags.length }} / {{ allTags.length }} 个标签 · 覆盖 {{ analyzedResourceCount }} / {{ items.length }} 条资源
      </span>
    </div>

    <el-empty v-if="!allTags.length" description="当前筛选结果暂无服务器标签" :image-size="72" />
    <div v-else class="tag-cloud" aria-label="论坛社区热门标签">
      <button
        v-for="tag in cloudTags"
        :key="tag.name"
        type="button"
        class="tag-cloud-word"
        :class="`tag-cloud-word--${tag.kind}`"
        :style="{ fontSize: `${tagSize(tag.count)}px` }"
        :title="`${tag.name} · ${kindLabel(tag.kind)} · 涉及 ${tag.count} 条资源`"
        :aria-label="`${tag.name}，${kindLabel(tag.kind)}，涉及 ${tag.count} 条资源，查看对应数据`"
        @click="openTag(tag)"
      >
        {{ tag.name }}
      </button>
    </div>

    <div v-if="allTags.length" class="tag-cloud-legend" aria-label="标签类型说明">
      <span class="legend-topic"><i aria-hidden="true"></i>生态主题</span>
      <span class="legend-tool"><i aria-hidden="true"></i>技术工具</span>
      <span class="legend-signal"><i aria-hidden="true"></i>细分标签</span>
    </div>

    <el-drawer
      v-model="drawerOpen"
      :title="`标签资源 · ${selectedTag?.name || ''}`"
      size="min(580px, 100%)"
      destroy-on-close
    >
      <p v-if="selectedTag" class="drawer-summary">
        当前筛选范围内命中 {{ selectedTag.count }} 条资源，按发帖时间从新到旧展示。
      </p>
      <el-empty v-if="selectedTag && !selectedTag.items.length" description="没有找到对应资源" />
      <article v-for="item in selectedTag?.items || []" :key="resourceKey(item)" class="drawer-resource-card">
        <div class="drawer-resource-meta">
          <strong>{{ sourceName(item) }}</strong>
          <span>{{ formatTime(item.timestamp) }}</span>
        </div>
        <a :href="resourceUrl(item)" @click.prevent="openResource(item)">{{ item.title }}</a>
        <div v-if="item.ecosystem" class="drawer-score-row">
          <el-tag size="small">{{ item.ecosystem.category }}</el-tag>
          <el-tag size="small" type="success">社区价值 {{ item.ecosystem.ecosystemValue }}</el-tag>
          <el-tag size="small" type="info">内容深度 {{ item.ecosystem.technicalDepth }}</el-tag>
          <el-tag size="small" type="primary">趋势 {{ item.ecosystem.trendNovelty }}</el-tag>
        </div>
        <p v-if="item.ecosystem?.summary">{{ item.ecosystem.summary }}</p>
        <div v-if="relatedLabels(item).length" class="drawer-related-tags">
          <el-tag v-for="label in relatedLabels(item)" :key="label" size="small" type="info" effect="plain">
            {{ label }}
          </el-tag>
        </div>
      </article>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElDrawer, ElEmpty, ElTag } from "element-plus";
import { contentTags, normalizedTag } from "../../../utils/contentTagCounts";
import { gotoOutPage } from "../../../utils/utils";

type TagKind = "topic" | "tool" | "signal";
interface CloudTag {
  name: string;
  kind: TagKind;
  count: number;
  items: any[];
}

const props = defineProps<{ items: any[] }>();
const drawerOpen = ref(false);
const selectedTag = ref<CloudTag | null>(null);
const kindPriority: Record<TagKind, number> = { topic: 0, tool: 1, signal: 2 };
const placeholderTags = new Set(["其他社区话题", "社区讨论", "其他", "未分类"]);

const resourceKey = (item: any, index = 0) => String(item.stableId || item.url || item.link || `index:${index}`);

const itemTags = (item: any): Array<{ name: string; kind: TagKind }> => {
  const tags: Array<{ name: string; kind: TagKind }> = [];
  const category = normalizedTag(item.ecosystem?.category);
  if (category && !placeholderTags.has(category)) tags.push({ name: category, kind: "topic" });
  for (const tool of Array.isArray(item.ecosystem?.tools) ? item.ecosystem.tools : []) {
    const name = normalizedTag(tool);
    if (name && !placeholderTags.has(name)) tags.push({ name, kind: "tool" });
  }
  for (const signal of contentTags(item)) {
    if (!placeholderTags.has(signal)) tags.push({ name: signal, kind: "signal" });
  }
  return tags;
};

const allTags = computed<CloudTag[]>(() => {
  const grouped = new Map<string, { name: string; kind: TagKind; items: Map<string, any> }>();
  props.items.forEach((item, index) => {
    for (const tag of itemTags(item)) {
      const existing = grouped.get(tag.name) || { ...tag, items: new Map<string, any>() };
      if (kindPriority[tag.kind] < kindPriority[existing.kind]) existing.kind = tag.kind;
      existing.items.set(resourceKey(item, index), item);
      grouped.set(tag.name, existing);
    }
  });
  return [...grouped.values()]
    .map((tag) => ({ name: tag.name, kind: tag.kind, count: tag.items.size, items: [...tag.items.values()] }))
    .sort((a, b) => b.count - a.count || kindPriority[a.kind] - kindPriority[b.kind] || a.name.localeCompare(b.name, "zh-CN"));
});

const cloudTags = computed(() => allTags.value.slice(0, 36));
const analyzedResourceCount = computed(() => props.items.filter((item) => Boolean(item.ecosystem?.category)).length);
const maxTagCount = computed(() => Math.max(1, ...cloudTags.value.map((tag) => tag.count)));
const tagSize = (count: number) => Math.round(15 + (maxTagCount.value <= 1 ? 0.5 : Math.sqrt((count - 1) / (maxTagCount.value - 1))) * 17);
const kindLabel = (kind: TagKind) => ({ topic: "生态主题", tool: "技术工具", signal: "细分标签" })[kind];

const openTag = (tag: CloudTag) => {
  selectedTag.value = {
    ...tag,
    items: [...tag.items].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)),
  };
  drawerOpen.value = true;
};

const sourceName = (item: any) => ({
  "52pojie": "吾爱破解",
  kanxue: "看雪社区",
  bilibili: `bilibili · ${item.authorName || "UP主"}`,
  nodeseek: "NodeSeek",
  linuxdo: "LINUX DO",
  v2ex: "V2EX",
} as Record<string, string>)[String(item.website)] || "论坛社区";

const resourceUrl = (item: any) => String(item.url || item.link || "");
const openResource = (item: any) => {
  const url = resourceUrl(item);
  if (url) gotoOutPage(url);
};
const formatTime = (timestamp: unknown) => {
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? "时间未知" : date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
const relatedLabels = (item: any) => [
  ...(Array.isArray(item.ecosystem?.tools) ? item.ecosystem.tools.map(normalizedTag) : []),
  ...contentTags(item),
].filter(Boolean).slice(0, 8);
</script>

<style scoped>
.tag-cloud-card {
  margin-bottom: 14px;
  padding: 16px 18px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.tag-cloud-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}
.tag-cloud-heading h2 {
  margin: 0;
  color: #30486f;
  font-size: 17px;
}
.tag-cloud-heading p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}
.tag-cloud-count {
  flex: 0 0 auto;
  color: #4a74ad;
  font-size: 12px;
  font-weight: 600;
}
.tag-cloud {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 8px 18px;
  padding: 18px 8px 12px;
}
.tag-cloud-word {
  display: inline-block;
  max-width: 100%;
  padding: 2px 5px;
  overflow-wrap: anywhere;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  line-height: 1.3;
  transition: color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}
.tag-cloud-word:hover { background: #eff6ff; transform: scale(1.04); }
.tag-cloud-word:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.tag-cloud-word--topic, .legend-topic { color: #1d4ed8; }
.tag-cloud-word--tool, .legend-tool { color: #0f766e; }
.tag-cloud-word--signal, .legend-signal { color: #b45309; }
.tag-cloud-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: #64748b;
  font-size: 12px;
}
.tag-cloud-legend span { display: inline-flex; align-items: center; gap: 6px; }
.tag-cloud-legend i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.drawer-summary { margin: 0 0 14px; color: #64748b; font-size: 13px; }
.drawer-resource-card { padding: 15px 0; border-bottom: 1px solid #e2e8f0; }
.drawer-resource-card:first-of-type { padding-top: 0; }
.drawer-resource-meta { display: flex; justify-content: space-between; gap: 12px; color: #64748b; font-size: 12px; }
.drawer-resource-card > a { display: block; margin-top: 8px; color: #1d4ed8; font-size: 15px; font-weight: 700; line-height: 1.45; text-decoration: none; }
.drawer-resource-card > a:hover { text-decoration: underline; }
.drawer-score-row, .drawer-related-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.drawer-resource-card p { margin: 9px 0 0; color: #475569; font-size: 13px; line-height: 1.6; }

@media screen and (max-width: 768px) {
  .tag-cloud-card { padding: 14px 13px; }
  .tag-cloud-heading { flex-direction: column; gap: 7px; }
  .tag-cloud-count { white-space: normal; }
  .tag-cloud { justify-content: flex-start; gap: 7px 12px; padding: 15px 2px 10px; }
}
</style>
