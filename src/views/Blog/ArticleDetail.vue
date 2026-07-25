<template>
  <article v-if="article" class="article-page">
    <el-breadcrumb class="breadcrumb"><el-breadcrumb-item
        :to="{ path: '/blog' }">博客</el-breadcrumb-item><el-breadcrumb-item>{{ article.category
        }}</el-breadcrumb-item><el-breadcrumb-item>{{ article.title }}</el-breadcrumb-item></el-breadcrumb>
    <div class="article-grid">
      <div>
        <header class="article-header">
          <div class="meta">{{ article.date }} · {{ article.category }}</div>
          <h1>{{ article.title }}</h1>
          <p>{{ article.summary }}</p>
          <div class="tags"><el-tag v-for="tag in article.tags" :key="tag" size="small" effect="plain">{{ tag
          }}</el-tag></div>
        </header>
        <div ref="contentRef" class="markdown-body">
          <component :is="article.component" />
        </div>
        <footer class="article-footer">
          <RouterLink v-if="previous" :to="`/blog/articles/${previous.slug}`">← {{ previous.title }}</RouterLink>
          <RouterLink to="/blog">返回文章列表</RouterLink>
          <RouterLink v-if="next" :to="`/blog/articles/${next.slug}`">{{ next.title }} →</RouterLink>
        </footer>
      </div>
      <aside v-if="toc.length" class="toc"><strong>文章目录</strong><a v-for="item in toc" :key="item.id"
          :class="{ active: activeHeading === item.id }" :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
          :href="`#${item.id}`">{{ item.text }}</a></aside>
    </div>
  </article>
  <el-empty v-else description="文章不存在">
    <RouterLink to="/blog"><el-button type="success">返回博客</el-button></RouterLink>
  </el-empty>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { articles, getArticle } from "./data/articles";
import type { TocItem } from "./data/types";

const route = useRoute();
const article = computed(() => {
  const value = getArticle(String(route.params.slug));
  return value ? { ...value, component: defineAsyncComponent(value.component as () => Promise<any>) } : undefined;
});
const previous = computed(() => { const index = articles.findIndex((item) => item.slug === article.value?.slug); return index >= 0 ? articles[index + 1] : undefined; });
const next = computed(() => { const index = articles.findIndex((item) => item.slug === article.value?.slug); return index > 0 ? articles[index - 1] : undefined; });
const contentRef = ref<HTMLElement>();
const toc = ref<TocItem[]>([]);
const activeHeading = ref("");
let observer: IntersectionObserver | undefined;

function slugify(text: string, used: Set<string>) { let id = text.toLocaleLowerCase().replace(/[^\p{Letter}\p{Number}一-鿿]+/gu, "-").replace(/^-|-$/g, "") || "section"; let base = id; let index = 1; while (used.has(id)) id = `${base}-${index++}`; used.add(id); return id; }
async function enhance() {
  await nextTick();
  if (!contentRef.value) return;
  observer?.disconnect();
  const used = new Set<string>();
  const items: TocItem[] = [];
  contentRef.value.querySelectorAll("h2, h3, h4").forEach((heading) => {
    const element = heading as HTMLElement; const text = element.textContent?.trim() || ""; const id = element.id || slugify(text, used); element.id = id; used.add(id); items.push({ id, text, level: Number(element.tagName.slice(1)) - 1 });
  });
  toc.value = items;
  observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) activeHeading.value = (entry.target as HTMLElement).id; }), { rootMargin: "-80px 0px -65%" });
  contentRef.value.querySelectorAll("h2, h3, h4").forEach((heading) => observer?.observe(heading));
  contentRef.value.querySelectorAll("a").forEach((link) => { if (link.hostname && link.hostname !== window.location.hostname) { link.target = "_blank"; link.rel = "noopener noreferrer"; } });
  if (route.hash) setTimeout(() => document.querySelector(route.hash)?.scrollIntoView({ behavior: "smooth" }), 0);
  document.title = `${article.value?.title || "博客"} · tangff`;
}
watch(() => article.value?.slug, enhance, { immediate: true });
onMounted(enhance);
onBeforeUnmount(() => observer?.disconnect());
</script>

<style>
.article-page {
  width: calc(100% - 100px);
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 22px;
}

.article-grid {
  width: 100%;
  margin: 0 auto;
  /* display: grid; */
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 28px;
  align-items: start;
}

.article-header,
.markdown-body {
  padding: 28px clamp(20px, 4vw, 46px);
  background: #fff;
  border: 1px solid #ebeef5;
}

.article-header {
  border-radius: 12px 12px 0 0;
  border-bottom: 0;
}

.article-header h1 {
  margin: 10px 0;
  font-size: clamp(26px, 4vw, 38px);
}

.article-header p {
  color: #606266;
  line-height: 1.7;
}

.meta {
  color: #67c23a;
  font-size: 13px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.markdown-body {
  border-radius: 0 0 12px 12px;
  line-height: 1.85;
  overflow: hidden;
}

.markdown-body :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 18px auto;
  border-radius: 8px;
  cursor: zoom-in;
}

.markdown-body :deep(pre) {
  overflow: auto;
  padding: 16px;
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 8px;
}

.markdown-body :deep(code) {
  font-family: Consolas, monospace;
}

.markdown-body :deep(table) {
  display: block;
  overflow: auto;
  border-collapse: collapse;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 7px 12px;
  border: 1px solid #dcdfe6;
}

.markdown-body :deep(blockquote) {
  margin-left: 0;
  padding-left: 16px;
  border-left: 4px solid #b3e19d;
  color: #606266;
}

.toc {
  position: sticky;
  top: 98px;
  padding: 18px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 120px);
  overflow: auto;
}

.toc a {
  color: #909399;
  font-size: 13px;
  text-decoration: none;
  line-height: 1.4;
}

.toc a.active,
.toc a:hover {
  color: #67c23a;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-top: 20px;
  padding: 18px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

.article-footer a {
  color: #67c23a;
  text-decoration: none;
  font-size: 13px;
}

@media(max-width:800px) {
  .article-page {
    width: calc(100% - 24px);
    margin: 0 auto;
  }

  .article-grid {
    display: block
  }

  .toc {
    position: static;
    margin-top: 18px;
    max-height: 220px
  }

  .article-footer {
    flex-wrap: wrap
  }

  .article-footer a:nth-child(2) {
    order: -1;
    width: 100%;
    text-align: center
  }
}
</style>
