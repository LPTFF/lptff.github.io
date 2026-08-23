<template>
  <div class="pending-feature">
    <h2 class="page-title">功能待完善</h2>
    <p class="page-desc">
      以下功能依赖平台登录态，纯脚本采集拿不到完整数据（实测无登录时接口返回受限或空数据），规划以浏览器插件方式在已登录页面配合采集（参照「基金复盘助手」扩展模式），当前暂未开放。
    </p>
    <div class="feature-list">
      <div v-for="feature in features" :key="feature.name" class="feature-card">
        <div class="feature-head">
          <span class="feature-name">{{ feature.name }}</span>
          <el-tag size="small" type="warning">待完善</el-tag>
        </div>
        <p class="feature-line">现状：{{ feature.status }}</p>
        <p class="feature-line">规划：{{ feature.plan }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElTag } from "element-plus";

const features = [
  {
    name: "快手",
    status: "个人主页视频需登录态，无 Cookie 时接口返回受限数据，历史快照停留在 2023 年",
    plan: "插件在已登录页面采集作品列表，替代手工维护 Cookie",
  },
  {
    name: "抖音",
    status: "依赖 selenium 无头浏览器与 Cookie 手工维护，链路脆弱",
    plan: "插件在已登录页面直接采集，去掉 selenium 与 Cookie 维护成本",
  },
];
</script>

<style scoped>
.pending-feature {
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 16px 40px;
}

.page-title {
  margin: 12px 0;
  font-size: 22px;
  font-weight: 600;
}

.page-desc {
  margin: 0 0 20px;
  color: #666;
  line-height: 1.7;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-card {
  padding: 16px 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background-color: var(--el-bg-color);
}

.feature-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.feature-name {
  font-size: 16px;
  font-weight: 600;
}

.feature-line {
  margin: 4px 0;
  color: #555;
  line-height: 1.6;
}
</style>
