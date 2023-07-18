<template>
  <el-row>
    <el-col
      :span="24"
      :md="8"
      :lg="6"
      v-for="(item, index) in moviesAllLimited"
      :key="index"
    >
      <movieCard :moviesData="item" :index="index"></movieCard>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { isPC } from "../../../utils/utils";
import crawlMovie from "../../../public/data/movie.json";
import bgImageUrl from "../../../public/img/bg.jpg";
import movieCard from "./component/movieCard.vue";
export default {
  props: {
    doubanLocation: [String, Number],
  },
  setup(props: any) {
    let moviesData = ref(crawlMovie);
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
    let maxLength = 0;
    const moviesAllLimited = computed(() => {
      const length: number = Number(props.doubanLocation); // 切割长度
      let initData = isPCRes.value ? 9 : 2;
      let moviesTmpAll;
      maxLength < length ? (maxLength = length) : maxLength;
      let rate = isPCRes.value ? 2 : 1;
      moviesTmpAll = moviesAll.slice(
        0,
        maxLength * rate + initData < moviesAll.length
          ? maxLength * rate + initData
          : moviesAll.length
      );
      return moviesTmpAll;
    });
    const bgUrl = ref(bgImageUrl); // 图片路径变量
    const handleImageError = (event: any) => {
      event.target.src = bgUrl.value;
    };
    return {
      callMethod,
      isPCRes,
      previousRoute,
      moviesAll,
      moviesAllLimited,
      handleImageError,
    };
  },
  components: {
    movieCard,
  },
};
</script>

<style scoped>
</style>
