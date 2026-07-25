<template>
  <div class="standalone-page">
    <header class="standalone-header">
      <RouterLink to="/" class="brand-link">
        <img :src="logoUrl" alt="作者" class="logo-img" />
        <span class="brand-title">tangff</span>
      </RouterLink>
      <div class="page-heading">
        <h1>{{ pageTitle }}</h1>
        <RouterLink to="/" class="back-link">返回首页</RouterLink>
      </div>
    </header>
    <main class="standalone-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import logoUrl from "../../public/img/logo.jpg";

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title || "独立功能"));

watchEffect(() => {
  document.title = `${pageTitle.value} · tangff`;
});
</script>

<style scoped>
.standalone-page {
  min-height: 100vh;
  background: #fff;
  color: rgb(44, 62, 80);
}

.standalone-header,
.standalone-content {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
}

.standalone-header {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-height: 80px;
  gap: 24px;
  padding: 11px 0;
  border-bottom: 1px solid #ebeef5;
  background-color: var(--el-menu-bg-color);
  transform: translateX(-50%);
}

.brand-link,
.back-link {
  color: inherit;
  text-decoration: none;
}

.brand-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.logo-img {
  width: 35px;
  height: 35px;
  margin-right: 10px;
  border-radius: 50%;
}

.brand-title {
  color: rgb(44, 62, 80);
  font-size: 21px;
  font-weight: 600;
}

.page-heading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-heading h1 {
  margin: 0;
  color: rgb(44, 62, 80);
  font-size: 20px;
  font-weight: 600;
}

.back-link {
  color: #409eff;
  white-space: nowrap;
}

.back-link:hover {
  color: #66b1ff;
}

.standalone-content {
  box-sizing: border-box;
  padding: 100px 0 40px;
}

@media screen and (max-width: 768px) {
  .standalone-header,
  .standalone-content {
    width: calc(100% - 24px);
  }

  .standalone-header {
    align-items: flex-start;
    min-height: 64px;
    padding: 12px 0;
  }

  .page-heading {
    align-items: flex-end;
    flex-direction: column;
    gap: 4px;
  }

  .page-heading h1 {
    font-size: 18px;
  }

  .standalone-content {
    padding-top: 84px;
  }
}
</style>
