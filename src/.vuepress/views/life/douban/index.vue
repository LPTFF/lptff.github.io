<template>
  <el-row>
    <el-col
      :span="24"
      :md="8"
      :lg="6"
      v-for="(item, index) in moviesAll"
      :key="index"
    >
      <el-card class="movie-item" shadow="hover">
        <img
          :src="`https://images.weserv.nl/?url=` + item.cover"
          alt="电影封面"
          class="movie-image"
        />
        <div class="movie-content">
          <div class="title-div">
            <img
              v-if="item.is_new"
              class="is-new"
              src="https://images.weserv.nl/?url=https://img1.doubanio.com/f/movie/caa8f80abecee1fc6f9d31924cef8dd9a24c7227/pics/movie/ic_new.png"
            />
            <a class="title-movie" @click="gotoMovieWebsite(item)" href="#">
              {{ item.title }}
            </a>
            <p class="rate-movie">{{ item.rate }}</p>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import crawlMovie from "../../../public/data/movie.json";
export default {
  data() {
    return {};
  },
  setup() {
    let moviesData = ref(crawlMovie.subjects);
    let moviesValue = moviesData.value;
    const newMovie = moviesValue.filter((item) => item.is_new === true);
    newMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate)); //按评分高分排序
    const oldMovie = moviesValue.filter((item) => item.is_new === false);
    oldMovie.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate)); //按评分高分排序
    let moviesAll = [...newMovie, ...oldMovie];
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref("");
    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
    });
    return {
      callMethod,
      isPCRes,
      previousRoute,
      moviesAll,
    };
  },
  components: {},
  methods: {
    gotoMovieWebsite(item) {
      console.log(item);
      item.url ? gotoOutPage(item.url) : "";
    },
  },
};
</script>

<style scoped>
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
  font-size: 21.6px;
  font-weight: 600;
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
}
</style>
