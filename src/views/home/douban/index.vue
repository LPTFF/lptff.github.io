<template>
  <el-row>
    <el-col :span="24" :md="8" :lg="6" v-for="(item, index) in moviesAllLimited" :key="index">
      <movieCard :moviesData="item" :index="index"></movieCard>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { computed } from "vue";
import { isPC } from "../../../utils/utils";
import crawlMovie from "../../../public/data/movie.json";
import movieCard from "./component/movieCard.vue";
import { ElCol, ElRow } from "element-plus";
export default {
  props: {
    doubanLocation: [String, Number],
  },
  setup(props: any) {
    const newMovie = crawlMovie.filter((item) => item.is_new === true)
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
    const oldMovie = crawlMovie.filter((item) => item.is_new === false)
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
    const moviesAll = [...newMovie, ...oldMovie];
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const moviesAllLimited = computed(() => {
      const length: number = Number(props.doubanLocation);
      let initData = isPCRes.value ? 9 : 2;
      let rate = isPCRes.value ? 2 : 1;
      maxLength < length ? (maxLength = length) : maxLength;
      return moviesAll.slice(
        0,
        maxLength * rate + initData < moviesAll.length
          ? maxLength * rate + initData
          : moviesAll.length
      );
    });
    return {
      moviesAllLimited,
    };
  },
  components: {
    movieCard,
    ElCol,
    ElRow,
  },
};
</script>

<style scoped></style>
