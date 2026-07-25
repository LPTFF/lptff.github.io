<template><div /></template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { articlesByLegacyPath, normalizeLegacyPath } from "./data/articles";
const route=useRoute();const router=useRouter();
onMounted(()=>{
  const path=normalizeLegacyPath(route.fullPath.split("?")[0]); const article=articlesByLegacyPath.get(path);
  if(article) router.replace(`/blog/articles/${article.slug}`); else router.replace("/blog");
});
</script>
