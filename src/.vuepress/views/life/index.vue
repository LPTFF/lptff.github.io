<template>
  <div class="news-aggregator">
    <el-header>
      <div class="header-div" @click="goBack">
        <img class="logo-img" src="https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg"/>
        <div class="logo-title">tangff</div>
      </div>
      <el-menu class="navigation" mode="horizontal" :collapse="isCollapsed">
        <el-menu-item index="1">首页</el-menu-item>
        <el-menu-item index="2">豆瓣电影</el-menu-item>
        <el-menu-item index="3">其他</el-menu-item>
        <!-- 添加其他菜单项 -->
      </el-menu>
    </el-header>
    <el-main>
      <div class="main-content">
        <div class="news-list">
          <el-card class="news-card" v-for="news in newsList" :key="news.id">
            <!-- <img :src="news.thumbnail" alt="News Thumbnail" class="news-thumbnail" /> -->
            <div class="news-details">
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-summary">{{ news.summary }}</p>
              <span class="news-date">{{ news.date }}</span>
            </div>
          </el-card>
        </div>
        <!-- <el-aside class="sidebar">
          <el-menu class="sidebar-menu" default-active="1" :collapse="isCollapsed">
            <el-submenu index="1">
              <el-menu-item index="1-1">科技</el-menu-item>
              <el-menu-item index="1-2">娱乐</el-menu-item>
              <el-menu-item index="1-3">体育</el-menu-item>
            </el-submenu>
          </el-menu>
        </el-aside> -->
      </div>
    </el-main>
    <el-footer class="footer">
      <div class="footer-text">版权信息 © 2023 </div>
      <!-- <div class="footer-links">
        <a href="#">关于我们</a>
        <a href="#">联系我们</a>
      </div> -->
    </el-footer>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      newsList: [
        {
          id: 1,
          title: "新闻标题 1",
          summary: "新闻摘要",
          thumbnail: "https://source.unsplash.com/1280x720/?news1",
          date: "2023-05-22",
        },
        {
          id: 2,
          title: "新闻标题 2",
          summary: "新闻摘要",
          thumbnail: "https://source.unsplash.com/1280x720/?news2",
          date: "2023-05-21",
        },
        // 添加更多新闻项
      ],
      isCollapsed: false,
      logoFor:'../../public/img/logo.jpg'
    };
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    goBack(){
      this.$router.back(); // 返回上一个路由
    }
  },
};
</script>

<style scoped>
.logo-title{
  margin: auto 0;
  color: rgb(44, 62, 80);
  font-weight: 600;
}
.header-div{
  padding: 11px 0px;
  display: flex;
}
.logo-img{
 width: 30px;
 height: 30px;
 margin-right: 10px;
}
.news-aggregator {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-right: 20px;
}

.navigation {
  line-height: 80px;
}

.search-input {
  width: 200px;
  margin-left: 20px;
}

.collapse-button {
  margin-left: 20px;
}

.main-content {
  display: flex;
}

.news-list {
  flex: 2;
  margin-right: 20px;
}

.news-card {
  margin-bottom: 20px;
}

.news-thumbnail {
  width: 100%;
}

.news-details {
  padding: 20px;
}

.news-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.news-summary {
  color: #666;
  margin-bottom: 10px;
}

.news-date {
  color: #999;
}

.sidebar {
  flex: 1;
}

.sidebar-menu {
  width: 200px;
}

.footer {
  padding: 20px;
  text-align: center;
  background-color: #f5f5f5;
}

.footer-text {
  margin-bottom: 10px;
  color: #666;
}

.footer-links {
  display: flex;
  justify-content: center;
}

.footer-links a {
  margin: 0 10px;
  color: #666;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .logo {
    font-size: 20px;
  }
  .navigation {
    display: none;
  }
  .search-input {
    width: 150px;
  }
  .collapse-button {
    display: inline-block;
  }
  .news-list {
    margin-right: 0;
  }
  .sidebar {
    display: none;
  }
}
</style>
