<template>
  <div class="community-page">
    <section class="community-intro">
      <div>
        <span class="eyebrow">公开社区观察</span>
        <h2>NodeSeek 与 LINUX DO 最新主题</h2>
        <p>仅汇总公开 RSS 中的标题、原帖链接、版块和发布时间，不采集正文、评论或账号信息。</p>
      </div>
      <div class="summary" aria-label="来源统计">
        <div v-for="source in sourceSummary" :key="source.name" class="summary-card">
          <span>{{ source.label }}</span>
          <strong>{{ source.count }}</strong>
        </div>
      </div>
    </section>

    <section class="filters" aria-label="主题筛选">
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索标题关键词"
        aria-label="搜索标题关键词"
      />
      <el-select v-model="sourceFilter" aria-label="按来源筛选">
        <el-option label="全部来源" value="all" />
        <el-option v-for="source in sourceSummary" :key="source.name" :label="source.label" :value="source.name" />
      </el-select>
      <el-select v-model="categoryFilter" filterable aria-label="按版块筛选">
        <el-option label="全部版块" value="all" />
        <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
      </el-select>
    </section>

    <div class="result-bar">
      <span>显示 {{ filteredItems.length }} / {{ items.length }} 条</span>
      <span v-if="latestTimestamp">最近主题：{{ formatTime(latestTimestamp) }}</span>
    </div>

    <section v-if="filteredItems.length" class="topic-list" aria-live="polite">
      <article v-for="item in filteredItems" :key="item.stableId || item.link" class="topic-card">
        <div class="topic-meta">
          <el-tag size="small" :type="item.website === 'nodeseek' ? 'success' : 'primary'" effect="plain">
            {{ sourceLabel(item.website) }}
          </el-tag>
          <el-tag size="small" type="info" effect="plain">{{ item.category || "未分类" }}</el-tag>
          <time :datetime="new Date(item.timestamp).toISOString()">{{ formatTime(item.timestamp) }}</time>
        </div>
        <a :href="item.link" target="_blank" rel="noopener noreferrer" class="topic-title">
          {{ item.title }}
        </a>
      </article>
    </section>

    <el-empty
      v-else
      :description="items.length ? '没有符合当前筛选条件的主题' : '公开数据尚未发布，请稍后再来看看'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElEmpty, ElInput, ElOption, ElSelect, ElTag } from "element-plus";
import nodeSeekData from "../../data/nodeseek.json";
import linuxDoData from "../../data/linuxdo.json";

interface CommunityItem {
  stableId?: string;
  title: string;
  link: string;
  category?: string;
  timestamp: number;
  website: "nodeseek" | "linuxdo";
}

const keyword = ref("");
const sourceFilter = ref("all");
const categoryFilter = ref("all");
const sourceNames = { nodeseek: "NodeSeek", linuxdo: "LINUX DO" } as const;

const items = ([...(nodeSeekData as CommunityItem[]), ...(linuxDoData as CommunityItem[])])
  .filter((item) => item.title && item.link && Number.isFinite(Number(item.timestamp)))
  .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

const sourceSummary = computed(() => Object.entries(sourceNames).map(([name, label]) => ({
  name,
  label,
  count: items.filter((item) => item.website === name).length,
})));

const categories = computed(() => Array.from(new Set(items.map((item) => item.category || "未分类")))
  .sort((a, b) => a.localeCompare(b, "zh-CN")));

const filteredItems = computed(() => {
  const query = keyword.value.trim().toLocaleLowerCase("zh-CN");
  return items.filter((item) => {
    if (sourceFilter.value !== "all" && item.website !== sourceFilter.value) return false;
    if (categoryFilter.value !== "all" && (item.category || "未分类") !== categoryFilter.value) return false;
    return !query || item.title.toLocaleLowerCase("zh-CN").includes(query);
  });
});

const latestTimestamp = computed(() => items[0]?.timestamp || 0);

function sourceLabel(source: CommunityItem["website"]) {
  return sourceNames[source] || source;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(Number(timestamp)));
}
</script>

<style scoped>
.community-page {
  width: min(960px, 100%);
  margin: 0 auto;
}

.community-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  align-items: end;
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f9ff, #fff);
}

.eyebrow {
  color: #409eff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
}

.community-intro h2 {
  margin: 8px 0;
  color: #1f2937;
  font-size: clamp(22px, 4vw, 32px);
}

.community-intro p {
  max-width: 640px;
  margin: 0;
  color: #606266;
  line-height: 1.7;
}

.summary {
  display: flex;
  gap: 10px;
}

.summary-card {
  min-width: 88px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 18px rgb(31 41 55 / 8%);
  text-align: center;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: #909399;
  font-size: 12px;
}

.summary-card strong {
  margin-top: 4px;
  color: #303133;
  font-size: 22px;
}

.filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 160px 180px;
  gap: 12px;
  margin: 22px 0 12px;
}

.result-bar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  color: #909399;
  font-size: 13px;
}

.topic-list {
  display: grid;
  gap: 10px;
}

.topic-card {
  padding: 15px 18px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
  transition: border-color .2s ease, box-shadow .2s ease;
}

.topic-card:hover {
  border-color: #a0cfff;
  box-shadow: 0 6px 18px rgb(64 158 255 / 8%);
}

.topic-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.topic-meta time {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.topic-title {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.55;
  text-decoration: none;
}

.topic-title:hover {
  color: #409eff;
}

@media (max-width: 720px) {
  .community-intro {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .summary {
    width: 100%;
  }

  .summary-card {
    flex: 1;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .result-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .topic-meta time {
    width: 100%;
    margin-left: 0;
  }
}
</style>
