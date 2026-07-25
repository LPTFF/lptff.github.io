<template>
  <section class="listing-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">ARCHIVE</p>
        <h1>{{ title }}</h1>
      </div><span>{{ filtered.length }} 篇文章</span>
    </div>
    <div v-for="group in groups" :key="group.year" class="year-group">
      <h2>{{ group.year }} <small>{{ group.items.length }} 篇</small></h2>
      <RouterLink v-for="article in group.items" :key="article.slug" class="archive-item"
        :to="`/blog/articles/${article.slug}`"><span>{{ article.title }}</span><time>{{ article.date }}</time>
      </RouterLink>
    </div>
    <el-empty v-if="!filtered.length" description="没有找到文章" />
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { articles } from "./data/articles";
const route = useRoute();
const filtered = computed(() => {
  const year = String(route.params.year || ""); const category = route.query.category ? String(route.query.category) : "";
  return articles.filter((article) => (!year || article.date.startsWith(year)) && (!category || article.category === category));
});
const title = computed(() => route.params.year ? `${route.params.year} 年归档` : route.query.category ? `${route.query.category} · 归档` : "文章归档");
const groups = computed(() => Object.entries(filtered.value.reduce<Record<string, typeof articles>>((result, article) => { const year = article.date.slice(0, 4); (result[year] ||= []).push(article); return result; }, {})).map(([year, items]) => ({ year, items })));
</script>
<style scoped>
.listing-page {
  /* max-width: 900px; */
  margin: 0 auto
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 30px
}

.page-heading h1 {
  margin: 5px 0;
  font-size: 34px
}

.page-heading>span,
.year-group small {
  color: #909399;
  font-size: 13px;
  font-weight: 400
}

.eyebrow {
  color: #67c23a;
  letter-spacing: .1em;
  font-size: 12px
}

.year-group {
  margin-bottom: 28px
}

.year-group h2 {
  font-size: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px
}

.archive-item {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 15px 18px;
  margin: 8px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-decoration: none;
  color: #303133
}

.archive-item:hover {
  border-color: #b3e19d;
  color: #67c23a
}

.archive-item time {
  color: #a8abb2;
  font-size: 13px;
  white-space: nowrap
}
</style>
