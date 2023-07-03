<template>
  <div class="blog">
    <header class="blog-header">
      <el-row class="header-row">
        <el-col :span="6">
          <div class="logo" @click="gotoHome">
            <img
              src="https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg"
              alt="Logo"
              class="logo-image"
            />
            <span class="logo-text">tangff</span>
          </div>
        </el-col>
        <el-col :span="12">
          <el-menu class="nav-menu" mode="horizontal">
            <el-menu-item v-for="category in categories" :key="category.id">
              {{ category.id }}
              <!-- <router-link :to="`/category/${category.id}`">{{ category.name }}</router-link> -->
            </el-menu-item>
          </el-menu>
        </el-col>
        <el-col :span="6">
          <div class="tag-cloud">
            <span class="tag-label">Tags:</span>
            <div class="tags">
              <!-- <router-link v-for="tag in tags" :key="tag.id" :to="`/tag/${tag.id}`" class="tag">{{ tag.name }}</router-link> -->
            </div>
          </div>
        </el-col>
      </el-row>
    </header>

    <div class="main-content">
      <el-main class="content">
        <div v-if="!selectedArticle">
          <h2>Recent Articles</h2>
          <ul class="article-list">
            <li
              v-for="article in articles"
              :key="article.id"
              class="article-item"
            >
              <h3>{{ article.title }}</h3>
              <p>{{ article.summary }}</p>
              <!-- <router-link
                  :to="{ name: 'article', params: { id: article.id } }"
                  class="read-more"
                  >Read More</router-link
                > -->
            </li>
          </ul>
        </div>
      </el-main>
    </div>

    <el-footer class="footer">
      <p>MIT Licensed | Copyright © 2023 tangff</p>
    </el-footer>
  </div>
</template>
  
  <script lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
export default {
  name: "Blog",
  components: {},
  data() {
    return {
      categories: [
        { id: 1, name: "Technology" },
        { id: 2, name: "Lifestyle" },
        { id: 3, name: "Travel" },
      ],
      tags: [
        { id: 1, name: "JavaScript" },
        { id: 2, name: "Vue.js" },
        { id: 3, name: "CSS" },
        { id: 4, name: "Responsive Design" },
      ],
    };
  },
  setup() {
    const state = reactive({
      activeMenu: "home",
      activeCategory: "",
      categories: [
        { id: "1", name: "Technology" },
        { id: "2", name: "Programming" },
        { id: "3", name: "Design" },
        { id: "4", name: "Lifestyle" },
      ],
      articles: [
        {
          id: "1",
          title: "Introduction to Vue.js",
          summary: "Learn the basics of Vue.js and its features.",
          content: "This is the content of the article.",
          categoryId: "1",
        },
        {
          id: "2",
          title: "Getting Started with Vite",
          summary: "Explore the Vite development server and its benefits.",
          content: "This is the content of the article.",
          categoryId: "1",
        },
        {
          id: "3",
          title: "Mastering CSS Grid Layout",
          summary:
            "Learn advanced techniques for working with CSS Grid Layout.",
          content: "This is the content of the article.",
          categoryId: "3",
        },
      ],
      selectedArticle: null,
    });

    const handleMenuSelect = (index: any) => {
      state.activeMenu = index;
    };

    const handleCategorySelect = (index: any) => {
      state.activeCategory = index;
      state.selectedArticle = null;
    };
    const router = useRouter();
    const gotoHome = () => {
      console.log("gotoHome");
      router.back(); // 使用获取到的 $router 对象返回上一个路由
    };

    return {
      ...state,
      handleMenuSelect,
      handleCategorySelect,
      gotoHome,
    };
  },
  methods: {},
};
</script>
  
  <style scoped>
.blog {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: #fff;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 90px;
}

.logo {
  font-size: 24px;
  color: #000;
  margin-right: 20px;
}

.nav {
  line-height: 64px;
}

.main-content {
  flex-grow: 1;
  display: flex;
  margin: 20px;
}

.sidebar {
  width: 20%;
  background-color: #f0f0f0;
  padding: 20px;
}

.sidebar-header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.category-menu {
  margin-top: 10px;
}

.content {
  flex-grow: 1;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.article-list {
  list-style-type: none;
  padding: 0;
}

.article-item {
  margin-bottom: 20px;
}

.article-item h3 {
  font-size: 18px;
  font-weight: bold;
}

.article-content {
  margin-top: 20px;
}

.footer {
  /* background-color: #f0f0f0; */
  padding: 10px;
  text-align: center;
}
.blog-header {
  /* background-color: #f5f5f5; */
  padding: 20px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-image {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.nav-menu {
  display: flex;
  justify-content: flex-end;
}

.tag-cloud {
  display: flex;
  align-items: center;
}

.tag-label {
  margin-right: 5px;
}

.tags {
  display: flex;
}

.tag {
  margin-right: 10px;
}
</style>
  