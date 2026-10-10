<template>
  <section class="tag-cloud-card" :class="{ compact: modelValue }" aria-labelledby="forum-tag-cloud-title">
    <div class="tag-cloud-heading">
      <div>
        <h2 id="forum-tag-cloud-title">社区标签词云</h2>
        <p v-if="!modelValue">汇总当前筛选结果中的生态主题、技术工具和细分标签；点击词语筛选下方资讯，再次点击取消。</p>
      </div>
      <span v-if="allTags.length && !modelValue" class="tag-cloud-count">
        展示 {{ cloudTags.length }} / {{ allTags.length }} 个标签 · 覆盖 {{ analyzedResourceCount }} / {{ items.length }} 条资源
      </span>
    </div>

    <div v-if="modelValue" class="active-filter" role="status">
      <span>正在筛选 <strong>{{ modelValue.name }}</strong> · {{ modelValue.count }} 条资源</span>
      <button type="button" @click="clearSelection">取消筛选并展开词云</button>
    </div>
    <el-empty v-else-if="!allTags.length" description="当前筛选结果暂无服务器标签" :image-size="72" />
    <div v-else class="tag-cloud" aria-label="论坛社区热门标签">
      <button
        v-for="tag in cloudTags"
        :key="tag.name"
        type="button"
        class="tag-cloud-word"
        :class="[`tag-cloud-word--${tag.kind}`, { active: isSelected(tag) }]"
        :style="{ fontSize: `${tagSize(tag.count)}px` }"
        :title="`${tag.name} · ${kindLabel(tag.kind)} · 涉及 ${tag.count} 条资源`"
        :aria-label="`${tag.name}，${kindLabel(tag.kind)}，涉及 ${tag.count} 条资源，${isSelected(tag) ? '取消筛选' : '筛选下方资讯'}`"
        :aria-pressed="isSelected(tag)"
        @click="selectTag(tag)"
      >
        {{ tag.name }}
      </button>
    </div>

    <div v-if="allTags.length && !modelValue" class="tag-cloud-legend" aria-label="标签类型说明">
      <span class="legend-topic"><i aria-hidden="true"></i>生态主题</span>
      <span class="legend-tool"><i aria-hidden="true"></i>技术工具</span>
      <span class="legend-signal"><i aria-hidden="true"></i>细分标签</span>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElEmpty } from "element-plus";
import { contentTags, normalizedTag } from "../../../utils/contentTagCounts";

type TagKind = "topic" | "tool" | "signal";
interface CloudTag {
  name: string;
  kind: TagKind;
  count: number;
  items: any[];
}

const props = defineProps<{ items: any[]; modelValue: CloudTag | null }>();
const emit = defineEmits<{ (event: "update:modelValue", value: CloudTag | null): void }>();
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

const isSelected = (tag: CloudTag) => props.modelValue?.name === tag.name && props.modelValue?.kind === tag.kind;
const selectTag = (tag: CloudTag) => emit("update:modelValue", isSelected(tag) ? null : tag);
const clearSelection = () => emit("update:modelValue", null);
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
.tag-cloud-card.compact { padding-top: 12px; padding-bottom: 12px; }
.tag-cloud-card.compact .tag-cloud-heading h2 { font-size: 14px; }
.active-filter { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; color: #475569; font-size: 13px; }
.active-filter strong { color: #1d4ed8; font-size: 15px; }
.active-filter button { flex: 0 0 auto; padding: 5px 10px; border: 1px solid #bfdbfe; border-radius: 999px; color: #1d4ed8; background: #eff6ff; cursor: pointer; font-size: 12px; }
.active-filter button:hover { border-color: #93c5fd; background: #dbeafe; }
.active-filter button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
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
.tag-cloud-word.active { color: #fff; background: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.24); }
.tag-cloud-word.active:hover { background: #1d4ed8; }
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
@media screen and (max-width: 768px) {
  .tag-cloud-card { padding: 14px 13px; }
  .tag-cloud-heading { flex-direction: column; gap: 7px; }
  .tag-cloud-count { white-space: normal; }
  .tag-cloud { justify-content: flex-start; gap: 7px 12px; padding: 15px 2px 10px; }
  .active-filter { align-items: flex-start; flex-direction: column; gap: 7px; }
}
</style>
