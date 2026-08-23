<template>
  <div class="devtools-page">
    <nav class="devtools-nav">
      <RouterLink
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="devtools-nav-link"
        :class="{ active: route.path === tool.path }"
      >
        <span class="devtools-nav-name">{{ tool.name }}</span>
        <span class="devtools-nav-desc">{{ tool.description }}</span>
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";

/** 工具注册表：新增工具时在此追加一条，并在 router/index.js 注册对应子路由 */
const tools = [
  {
    path: "/devtools/text-compress",
    name: "文本压缩",
    description: "三算法无损压缩，三种编码输出，可反向解压",
  },
  {
    path: "/devtools/qr-code-gen",
    name: "文本转二维码",
    description: "文本 / git diff 生成二维码，超长自动分片",
  },
  {
    path: "/devtools/json-formatter",
    name: "JSON 格式化",
    description: "格式化 / 压缩 / 校验，错误定位到行列",
  },
];

const route = useRoute();
</script>

<style scoped>
.devtools-page {
  max-width: 1280px;
  margin: 0 auto;
}

.devtools-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.devtools-nav-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafbfc;
  color: #606266;
  text-decoration: none;
  transition: all 0.2s;
}

.devtools-nav-link:hover {
  border-color: #409eff;
}

.devtools-nav-link.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.devtools-nav-name {
  font-size: 14px;
  font-weight: 600;
}

.devtools-nav-link.active .devtools-nav-name {
  color: #409eff;
}

.devtools-nav-desc {
  font-size: 12px;
  color: #909399;
}
</style>
