<template>
  <div>
    <div class="news-aggregator">
      <el-header class="header-el">
        <div class="header-div" @click="goBack">
          <img class="logo-img" src="https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg" />
          <div class="logo-title">tangff</div>
        </div>
        <el-menu class="navigation" mode="horizontal" :default-active="selectIndex" @select="handleSelect">
          <el-menu-item index="1">首页</el-menu-item>
          <el-menu-item index="2">豆瓣电影</el-menu-item>
          <el-menu-item index="3">其他</el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <div class="main-content">
          <div class="news-list" v-if="selectIndex == '1'">
            <el-card class="news-card" v-for="news in newsList" :key="news.id">
              <div class="news-details">
                <h3 class="news-title">{{ news.title }}</h3>
                <p class="news-summary">{{ news.summary }}</p>
                <span class="news-date">{{ news.date }}</span>
              </div>
            </el-card>
          </div>
          <div class="movie-list" v-if="selectIndex == '2'">
            <el-row>
              <el-col :span="24" :md="12" :lg="8" v-for="(item, index) in movies" :key="index">
                <el-card class="movie-item" shadow="hover" @click="handleJump(item)">
                  <img :src="`https://images.weserv.nl/?url=` + item.cover" alt="电影封面" class="movie-image" />
                  <div class="movie-content">
                    <div class="title-div">
                      <img v-if="item.is_new" class="is-new"
                        src="https://images.weserv.nl/?url=https://img1.doubanio.com/f/movie/caa8f80abecee1fc6f9d31924cef8dd9a24c7227/pics/movie/ic_new.png" />
                      <h3 class="title-movie">{{ item.title }}</h3>
                    </div>
                    <p class="rate-movie">{{ item.rate }}</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div class="news-list" v-if="selectIndex == '3'">
            <el-card class="news-card" v-for="news in newsList" :key="news.id">
              <div class="news-details">
                <h3 class="news-title">{{ news.title }}</h3>
                <p class="news-summary">{{ news.summary }}</p>
                <span class="news-date">{{ news.date }}</span>
              </div>
            </el-card>
          </div>
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
  </div>
</template>

<script lang="ts">
import { ref, onMounted, toRefs } from 'vue';
import { getRequestGet, getRequestPost, getRequestHead, isPC, gotoOutPage } from '../../utils/utils';
import localMovie from './data.json';
// import { saveAs } from 'file-saver';
export default {
  data() {
    return {};
  },
  setup() {
    let selectIndex = ref('2');
    let movies = ref(localMovie.subjects);
    let newsList = ref([
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
      }
    ]);
    let isPCRes = ref(isPC());
    const callMethod = () => {
      console.log('233');

    };
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
    });
    return {
      callMethod, selectIndex, movies, newsList, isPCRes
    };
  },
  methods: {
    goBack() {
      this.$router.back(); // 返回上一个路由
    },
    async handleSelect(key) {
      console.log(key);
      this.selectIndex = key;
      if (key == '2') {
        //https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0
        this.movies = localMovie.subjects;
        // let url = '/douban/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0';
        // let data = await getRequestGet(url);
        // console.log('1', data.subjects);
        // this.movies = data.subjects;
        // const jsonData = JSON.stringify(data);
        // const blob = new Blob([jsonData], { type: 'application/json' });
        // saveAs(blob, 'data.json');
      } else if (key == '3') {
        this.newsList = [
          {
            id: 1,
            title: "其他标题 1",
            summary: "新闻摘要",
            thumbnail: "https://source.unsplash.com/1280x720/?news1",
            date: "2023-05-22",
          },
          {
            id: 2,
            title: "其他标题 2",
            summary: "新闻摘要",
            thumbnail: "https://source.unsplash.com/1280x720/?news2",
            date: "2023-05-21",
          },
          // 添加更多新闻项
        ];
      } else {
        this.newsList = [
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
          }
        ];
      }
    },
    handleJump(item) {
      console.log(item);
      let data = isPC();
      console.log(data);
      item.url ? gotoOutPage(item.url) : '';
    }
  },
};
</script>

<style scoped>
.logo-title {
  margin: auto 0;
  color: rgb(44, 62, 80);
  font-weight: 600;
  font-size: 21px;
}

.header-div {
  padding: 11px 0px;
  display: flex;
}

.logo-img {
  width: 35px;
  height: 35px;
  margin-right: 10px;
}

.news-aggregator {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}


.navigation {
  line-height: 80px;
}

.main-content {
  display: flex;
}

.news-list {
  flex: 2;
  margin-right: 20px;
  margin-top: 50px;
}

.news-card {
  margin-bottom: 20px;
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

.footer {
  padding: 20px;
  text-align: center;
  background-color: #f5f5f5;
}

.footer-text {
  margin-bottom: 10px;
  color: #666;
}

.movie-list {
  max-width: 1200px;
  margin: 30px auto;
  padding: 20px;
}

.movie-item {
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.title-div {
  display: flex;
  justify-content: center;
}

.movie-image {
  width: 100%;
  height: auto;
  margin-bottom: 12px;
}

.is-new {
  margin: auto 5px;
  width: 16px;
  height: 16px;
}

.title-movie {
  color: rgb(51, 119, 170);
}

.rate-movie {
  color: rgb(224, 144, 21);
}

.movie-content {
  font-size: 14px;
  color: #909399;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-el {
    position: fixed;
    z-index: 9999;
    width: 100%;
    background-color: var(--el-menu-bg-color);
  }

  .news-list {
    margin-right: 0;
  }

  .movie-list {
    margin-top: 95px;
  }

  .news-list {
    margin-top: 115px;
  }
}
</style>
