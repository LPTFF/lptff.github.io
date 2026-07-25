<template>
  <div class="blog-shell">
    <header class="blog-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/blog">tangff <span>博客</span></RouterLink>
        <nav class="desktop-nav">
          <RouterLink to="/blog">文章</RouterLink>
          <RouterLink to="/blog/archives">归档</RouterLink>
          <RouterLink to="/blog/reading">阅读</RouterLink>
          <RouterLink to="/blog/about">关于</RouterLink>
        </nav>
        <div class="header-actions">
          <el-input v-model="query" clearable placeholder="搜索文章" :prefix-icon="Search" @keyup.enter="search"
            @clear="search" />
          <el-button class="mobile-menu" circle :icon="Menu" @click="menuOpen = !menuOpen" />
        </div>
      </div>
      <nav v-if="menuOpen" class="mobile-nav">
        <RouterLink to="/blog" @click="menuOpen = false">文章</RouterLink>
        <RouterLink to="/blog/archives" @click="menuOpen = false">归档</RouterLink>
        <RouterLink to="/blog/reading" @click="menuOpen = false">阅读</RouterLink>
        <RouterLink to="/blog/about" @click="menuOpen = false">关于</RouterLink>
      </nav>
    </header>
    <main class="blog-main">
      <RouterView />
    </main>
    <footer class="blog-footer">记录学习，分享思考 · tangff</footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Menu, Search } from "@element-plus/icons-vue";

const router = useRouter();
const query = ref("");
const menuOpen = ref(false);
const search = () => {
  router.push({ path: "/blog/search", query: query.value.trim() ? { q: query.value.trim() } : undefined });
};
</script>

<style>
:root {
  --blog-green: #67c23a;
  --blog-bg: #f7f8fa;
  --blog-text: #303133;
}

.blog-shell {
  min-height: 100vh;
  background: var(--blog-bg);
  color: var(--blog-text);
}

.blog-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, .95);
  border-bottom: 1px solid #ebeef5;
  backdrop-filter: blur(12px);
}

.header-inner {
  width: min(1160px, calc(100% - 40px));
  min-height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 38px;
}

.brand {
  color: var(--blog-green);
  font-size: 24px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  margin-top: -8px;
}

.brand span {
  color: #909399;
  font-size: 13px;
  font-weight: 400;
  margin-left: 6px;

}

.desktop-nav {
  display: flex;
  gap: 26px;
  flex: 1;
}

.desktop-nav a,
.mobile-nav a {
  color: #606266;
  text-decoration: none;
  font-size: 14px;
}

.desktop-nav a.router-link-active,
.desktop-nav a:hover,
.mobile-nav a:hover {
  color: var(--blog-green);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions .el-input {
  width: 210px;
}

.mobile-menu,
.mobile-nav {
  display: none;
}

.blog-main {
  width: calc(100% - 200px);
  margin: 0 auto;
  padding: 38px 0 70px;
}

.blog-footer {
  padding: 24px;
  text-align: center;
  color: #a8abb2;
  font-size: 13px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

@media (max-width: 700px) {

  .header-inner,
  .blog-main {
    width: calc(100% - 24px);
  }

  .desktop-nav {
    display: none;
  }

  .header-actions {
    margin-left: auto;
  }

  .header-actions .el-input {
    width: 145px;
  }

  .mobile-menu {
    display: inline-flex;
  }

  .mobile-nav {
    display: flex;
    gap: 22px;
    padding: 0 12px 14px;
    justify-content: center;
  }
}
</style>
