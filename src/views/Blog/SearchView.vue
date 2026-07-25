<template>
  <section class="listing-page"><div class="page-heading"><div><p class="eyebrow">SEARCH</p><h1>搜索文章</h1></div><span>{{ results.length }} 个结果</span></div><el-input v-model="query" size="large" clearable placeholder="输入关键词，例如：卷积、机器人" :prefix-icon="Search" @keyup.enter="updateQuery" /><div class="results"><RouterLink v-for="result in results" :key="result.article.slug" class="result" :to="`/blog/articles/${result.article.slug}`"><div class="meta">{{ result.article.date }} · {{ result.article.category }}</div><h2>{{ result.article.title }}</h2><p>{{ result.snippet }}</p></RouterLink><el-empty v-if="!results.length" description="没有匹配的文章" /></div></section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import { articles } from "./data/articles";
import { searchArticles } from "./data/search";
const route=useRoute();const router=useRouter();const query=ref(String(route.query.q||""));
const results=computed(()=>searchArticles(articles,query.value));
const updateQuery=()=>router.replace({path:"/blog/search",query:query.value.trim()?{q:query.value.trim()}:undefined});
watch(()=>route.query.q,(value)=>{query.value=String(value||"")});
</script>
<style scoped>
.listing-page{max-width:900px;margin:0 auto}.page-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}.page-heading h1{margin:5px 0;font-size:34px}.page-heading>span{color:#909399;font-size:13px}.eyebrow{color:#67c23a;letter-spacing:.1em;font-size:12px}.results{margin-top:20px}.result{display:block;margin:10px 0;padding:20px;background:#fff;border:1px solid #ebeef5;border-radius:10px;text-decoration:none;color:#303133}.result:hover{border-color:#b3e19d}.result h2{margin:8px 0;font-size:19px}.result p{margin:0;color:#606266;line-height:1.7}.meta{font-size:12px;color:#67c23a}
</style>
