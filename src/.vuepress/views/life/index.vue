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
      <el-main class="main-content">
        <div>
          <div class="news-list" v-if="selectIndex == '1'">
            <el-card class="news-card" v-for="(item, index) in newsAll" :key="index">
              <div class="news-content" @click="gotoNewsWebsite(item)">
                <div class="news-details">
                  <h3 class="news-title">{{ item.title }}</h3>
                  <p class="news-summary">{{ item.desc ? item.desc : item.title }}</p>
                  <div class="news-bottom">
                    <img class="is-new" :src="getWebsiteLogo(item)" />
                    <div v-if="isPCRes" class="website-name">{{ getWebsiteName(item) }}</div>
                    <span class="news-date">{{ item.time }}</span>
                  </div>
                </div>
                <div class="news-div-img"><img class="img-news" :src="item.image ? item.image : getWebsiteLogo(item)" />
                </div>
              </div>
            </el-card>
          </div>
          <div class="movie-list" v-if="selectIndex == '2'">
            <el-row>
              <el-col :span="24" :md="8" :lg="6" v-for="(item, index) in moviesAll" :key="index">
                <el-card class="movie-item" shadow="hover" @click="gotoMovieWebsite(item)">
                  <img :src="`https://images.weserv.nl/?url=` + item.cover" alt="电影封面" class="movie-image" />
                  <div class="movie-content">
                    <div class="title-div">
                      <img v-if="item.is_new" class="is-new"
                        src="https://images.weserv.nl/?url=https://img1.doubanio.com/f/movie/caa8f80abecee1fc6f9d31924cef8dd9a24c7227/pics/movie/ic_new.png" />
                      <h3 class="title-movie">{{ item.title }}</h3>
                      <p class="rate-movie">{{ item.rate }}</p>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          <div class="news-list" v-if="selectIndex == '3'">
            <el-card class="news-card" v-for="news in otherList" :key="news.id">
              <div class="news-details">
                <h3 class="news-title">{{ news.title }}</h3>
                <p class="news-summary">{{ news.summary }}</p>
                <span class="news-date">{{ news.date }}</span>
              </div>
            </el-card>
          </div>
        </div>
      </el-main>
      <el-footer class="footer" @click="gotoIssue">
        <div class="footer-text">评论功能暂不支持，如有问题请提issue © 2023 </div>
      </el-footer>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import { isPC, gotoOutPage } from '../../utils/utils';
import crawlMovie from '../../public/data/movie.json';
import infzmNews from '../../public/data/newsHandle.json';
import juejinNews from '../../public/data/juejin.json'
export default {
  data() {
    return {
      otherList: [
        {
          id: 1,
          title: "其他标题 1",
          summary: "新闻摘要111111111111111111111111111111111111111111111111111111111",
          thumbnail: "https://source.unsplash.com/1280x720/?news1",
          date: "2023-05-22",
        }
      ]
    };
  },
  setup() {
    let selectIndex = ref('1');
    let moviesData = ref(crawlMovie.subjects);
    let moviesValue = moviesData.value;
    const newMovie = moviesValue.filter(item => item.is_new === true);
    newMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));//按评分高分排序
    const oldMovie = moviesValue.filter(item => item.is_new === false);
    oldMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));//按评分高分排序
    let moviesAll= [...newMovie, ...oldMovie];
    let infzmList = ref(infzmNews);
    let juejinList = ref(juejinNews);
    let newsAll: any[]=[];
    newsAll = [...infzmList.value, ...juejinList.value];
    newsAll.sort((a, b) => b.timestamp - a.timestamp);//按时间最新的靠前排序
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref('');

    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    const getWebsiteLogo = (item) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteLogo='';
      switch (String(item.website)) {
        case 'juejin':
          websiteLogo='https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/6c61ae65d1c41ae8221a670fa32d05aa.svg';
          break;
        case 'infzm':
          websiteLogo='http://www.infzm.com/web/images/infzm-meta-icon.png?f25705e975f00770a3e8a74f1a08a170';
          break;
        default:
          // 当 expression 的值与所有的 case 不匹配时执行的代码块
          websiteLogo='https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg';
      }
      return websiteLogo;
    };
    const getWebsiteName = (item) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteName='';
      switch (String(item.website)) {
        case 'juejin':
          websiteName='掘金';
          break;
        case 'infzm':
          websiteName='南方周末';
          break;
        default:
          websiteName='随风而逝';
      }
      return websiteName;
    };
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state ? window.history.state.back : '';//获取路由路径
    });
    return {
      callMethod, selectIndex, isPCRes, previousRoute,newsAll,getWebsiteLogo,getWebsiteName,moviesAll
    };
  },
  methods: {
    goBack() {
      this.previousRoute ? this.$router.back() : this.$router.push('/');; // 返回上一个路由，兜底返回主页
    },
    async handleSelect(key) {
      console.log(key);
      this.selectIndex = key;
      if (key == '1' && !this.newsAll) {
        this.newsAll = [...infzmNews, ...juejinNews];
        this.newsAll.sort((a, b) => b.timestamp - a.timestamp);//按时间最新的靠前排序
      } else if (key == '2' && !this.moviesAll) {
        let moviesData = crawlMovie.subjects;
        const newMovie = moviesData.filter(item => item.is_new === true);
        newMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));//按评分高分排序
        const oldMovie = moviesData.filter(item => item.is_new === false);
        oldMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));//按评分高分排序
        this.moviesAll= [...newMovie, ...oldMovie];
      } else if (key == '3') {
        this.otherList = [
          {
            id: 1,
            title: "其他标题 1",
            summary: "新闻摘要111111111111111111111111111111111111111111111111111111111",
            thumbnail: "https://source.unsplash.com/1280x720/?news1",
            date: "2023-05-22",
          },
          {
            id: 2,
            title: "其他标题 2",
            summary: "新闻摘要22222222222222222222222222222222222222222222222222222222222",
            thumbnail: "https://source.unsplash.com/1280x720/?news2",
            date: "2023-05-21",
          },
          // 添加更多新闻项
        ];
      } else {
        console.log('handleSelect 233');  
      }
    },
    gotoMovieWebsite(item) {
      console.log(item);
      item.url ? gotoOutPage(item.url) : '';
    },
    gotoIssue() {
      let pageUrl = window.location.origin;
      console.log('pageUrl', pageUrl);
      if (pageUrl.includes('love-tff.gitee.io')) {
        gotoOutPage('https://gitee.com/love-tff/love-tff/issues')
      } else {
        gotoOutPage('https://github.com/LPTFF/lptff.github.io/issues')
      }
    },
    gotoNewsWebsite(item) {
      console.log(item);
      let data = isPC();
      console.log(data);
      if (item.website == 'infzm') {
        // https://www.infzm.com/contents/249870
        // https://www.infzm.com/wap/#/content/249908?source=133&source_1=1
        let handleUrl = '';
        if (item.url) {
          data ? handleUrl = `https://www.infzm.com/contents/${item.url}` : handleUrl = `https://www.infzm.com/wap/#/content/${item.url}?source=133&source_1=1`;
          gotoOutPage(handleUrl)
        } else {
          console.log('infzm 233');
        }
      } else if(item.website == 'juejin'){
        item.url?gotoOutPage(item.url):console.log('juejin 233');
      } else {
        console.log('233')
      }
    },
  },
};
</script>

<style scoped>
.header-el {
  height: fit-content;
}

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

.news-list {
  margin-right: 20px;
  margin-top: 10px;
  margin-bottom: 70px;
}

.news-card {
  margin-bottom: 20px;
}

.news-content {
  display: flex;
  justify-content: space-between;
}

.news-div-img {
  margin: auto;
}

.img-news {
  width: 200px;
  height: 200px;
}

.news-details {
  padding: 20px;
  width: 900px;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  height: 100%;
}

.news-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.news-summary {
  color: #666;
  margin-bottom: 10px;
  height: 100px;
  width: 800px;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
}

.news-date {
  color: #999;
}

.website-name {
  margin: 0 10px 0 5px;
}

.news-bottom {
  display: flex;
}

.footer {
  padding: 20px;
  text-align: center;
  background-color: rgb(255, 255, 255);
  ;
  position: fixed;
  bottom: 0px;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
}

.footer-text {
  margin-bottom: 10px;
  color: #666;
}

.movie-list {
  max-width: 1200px;
  margin: 0 auto;
  /* padding: 20px; */
  padding-top: 10px;
  margin-bottom: 40px;
}

.movie-item {
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
  margin-right: 20px;
}

.title-div {
  display: flex;
  justify-content: center;
}

.movie-image {
  width: 218px;
  height: 308px;
  margin-bottom: 12px;
}

.is-new {
  margin: 5px 5px;
  width: 16px;
  height: 16px;
}

.title-movie {
  color: rgb(51, 119, 170);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: -2px;
  margin-bottom: 10px;
}

.rate-movie {
  color: rgb(224, 144, 21);
  margin-top: -5px;
  font-size: 20px;
  margin-bottom: 0px;
  margin-left: 10px;
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
    margin-top: 0px;
  }


  .main-content {
    padding-top: 115px;
  }

  .news-summary {
    color: #666;
    margin-bottom: 10px;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }

  .img-news {
    width: 100px;
    height: 100px;
  }

  .news-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 0px;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }

  .news-bottom {
    display: flex;
    max-width: 150px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }
}
</style>
