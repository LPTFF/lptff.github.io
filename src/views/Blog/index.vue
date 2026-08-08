<template>
  <section>
    <div class="hero">
      <div>
        <p class="eyebrow">学习笔记 · 技术分享</p>
        <h1>把问题想清楚，再写下来。</h1>
        <p class="hero-copy">这里收录关于人工智能、自动驾驶和水下机器人的学习记录。</p>
      </div>
      <img :src="logoUrl" alt="tangff" class="hero-avatar" />
    </div>
    <div class="toolbar">
      <div class="filters">
        <el-button v-for="category in categories" :key="category"
          :type="selectedCategory === category ? 'success' : 'info'" plain size="small"
          @click="selectedCategory = selectedCategory === category ? '' : category">{{ category }}</el-button>
      </div>
      <span class="count">共 {{ filteredArticles.length }} 篇文章</span>
    </div>
    <el-row :gutter="18">
      <el-col v-for="article in filteredArticles" :key="article.slug" :xs="24" :sm="12" :lg="8" class="article-col">
        <RouterLink class="article-card" :to="`/blog/articles/${article.slug}`">
          <img :src="article.cover" :alt="article.title" class="cover" />
          <div class="card-body">
            <div class="meta"><span>{{ article.date }}</span><span>{{ article.category }}</span></div>
            <h2>{{ article.title }}</h2>
            <p>{{ article.summary }}</p>
            <div class="tags"><el-tag v-for="tag in article.tags" :key="tag" size="small" effect="plain">{{ tag
                }}</el-tag></div>
          </div>
        </RouterLink>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { articles } from "./data/articles";
import logoUrl from "../../assets/logo.jpg";

const selectedCategory = ref("");
const categories = [...new Set(articles.map((article) => article.category))];
const filteredArticles = computed(() => selectedCategory.value ? articles.filter((article) => article.category === selectedCategory.value) : articles);

onMounted(() => {
  document.title = "博客 · tangff";
});
</script>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 34px;
  margin-bottom: 28px;
  background: linear-gradient(135deg, #f0f9eb, #fff);
  border: 1px solid #e1f3d8;
  border-radius: 14px;
}

.eyebrow {
  color: #67c23a;
  font-size: 13px;
  letter-spacing: .08em;
}

h1 {
  margin: 10px 0;
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 650;
}

.hero-copy {
  margin: 0;
  color: #909399;
}

.hero-avatar {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 8px 22px #67c23a33;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.count {
  color: #909399;
  font-size: 13px;
}

.article-col {
  margin-bottom: 18px;
}

.article-card {
  display: block;
  height: 100%;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: transform .2s, box-shadow .2s;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px #30313314;
}

.cover {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: cover;
  background: #f0f9eb;
}

.card-body {
  padding: 18px;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #a8abb2;
  font-size: 12px;
}

h2 {
  margin: 12px 0 8px;
  font-size: 19px;
}

.card-body p {
  min-height: 42px;
  margin: 0 0 15px;
  color: #606266;
  line-height: 1.65;
  font-size: 14px;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

@media (max-width: 520px) {
  .hero {
    padding: 24px;
  }

  .hero-avatar {
    width: 62px;
    height: 62px;
  }

  .hero-copy {
    font-size: 13px;
  }
}
</style>
