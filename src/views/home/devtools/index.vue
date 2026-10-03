<template>
  <div class="devtools-page">
    <nav class="devtools-nav" aria-label="开发工具">
      <el-tabs :model-value="route.path" class="devtools-tabs" @tab-change="navigateToTool">
        <el-tab-pane v-for="tool in tools" :key="tool.path" :name="tool.path" :label="tool.name" />
      </el-tabs>
      <p class="devtools-current-desc">{{ currentTool?.description }}</p>
    </nav>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

/** 工具注册表：新增工具时在此追加一条，并在 router/index.js 注册对应子路由 */
const tools = [
  {
    path: "/devtools/text-compress",
    name: "文本压缩",
    description: "三算法无损压缩，三种编码输出，可反向解压",
  },
  {
    path: "/devtools/video-download",
    name: "视频下载",
    description: "与本地 Chrome 扩展配合，发现并保存网页媒体",
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
  {
    path: "/devtools/research-bookmarks",
    name: "研究资料",
    description: "导入浏览器书签，复制格式后到 Issue 补充",
  },
  {
    path: "/devtools/private-bookmarks",
    name: "私密书签",
    description: "通过插件查看、整理并手动备份到 GitHub 私人仓库",
  },
];

const route = useRoute();
const router = useRouter();
const currentTool = computed(() => tools.find((tool) => tool.path === route.path));

function navigateToTool(path: string | number): void {
  if (path !== route.path) void router.push(String(path));
}
</script>

<style scoped>
.devtools-page {
  max-width: 1280px;
  margin: 0 auto;
}

.devtools-nav {
  min-width: 0;
  margin-bottom: 16px;
}

.devtools-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.devtools-tabs :deep(.el-tabs__content) {
  display: none;
}

.devtools-current-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>
