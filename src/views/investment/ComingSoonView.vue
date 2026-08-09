<template>
  <el-card shadow="never">
    <template #header>{{ title }}</template>
    <el-empty :description="description" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const title = computed(() => (route.meta.title as string) ?? "模块");
const description = computed(() => (route.meta.description as string) ?? "该模块即将上线。");
</script>
