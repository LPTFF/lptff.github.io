<template>
  <div>
    <el-card class="movie-item" shadow="hover">
      <div>
        <img
          :src="
            posterMovie.length > 0
              ? posterMovie
              : `https://images.weserv.nl/?url=` + moviesData.cover
          "
          alt="电影封面"
          class="movie-image"
          @error="handleImageError"
        />
      </div>
      <div class="movie-content">
        <div class="title-div">
          <div v-if="moviesData.is_new" class="is-new">新</div>
          <a
            class="title-movie"
            @click.prevent="gotoMovieWebsite(moviesData)"
            :href="moviesData.url"
          >
            {{ moviesData.title }}
          </a>
          <p class="rate-movie">
            {{ moviesData.rate }}
          </p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
import { toRefs, ref, onMounted } from "vue";
import bgImageUrl from "../../../../public/img/bg.jpg";
import { gotoOutPage } from "../../../../utils/utils";
import axios from "axios";
import { ElCard } from "element-plus";
interface CacheDict {
  [key: string]: any;
}

const cache: CacheDict = {}; // 使用普通对象模拟缓存

const getMoviePost = async (baseUrl: string): Promise<any> => {
  if (cache[baseUrl]) {
    // 如果已经在缓存中，则直接返回缓存的数据
    return cache[baseUrl];
  }
  try {
    const cdnWebsite =
      "https://fastly.jsdelivr.net/gh/LPTFF/lptff.github.io@python-crawl";
    const response = await axios.get(cdnWebsite + baseUrl);
    const data = response.data;
    // 将获取到的数据缓存起来
    cache[baseUrl] = data;
    return data;
  } catch (error) {
    return "";
  } finally {
    // 可以在这里执行一些收尾工作，如果有需要的话
  }
};

export default {
  props: {
    moviesData: [String, Number, Object],
    index: [String, Number, Object],
  },
  setup(props: any) {
    const { moviesData, index } = toRefs(props);
    let posterMovie = ref(""); // 图片路径变量

    onMounted(async () => {
      if (Number(index.value) < 1000) {
        const basUrl = `/doubanImg/moviePoster_${moviesData.value.id}.json`;
        let postData = await getMoviePost(basUrl);
        if (postData.cover) {
          posterMovie.value = postData.cover;
        } else if (postData) {
          posterMovie.value = postData.startsWith("data:image/png;base64,")
            ? postData
            : "data:image/png;base64," + postData;
        }
      }
    });

    const bgUrl = ref(bgImageUrl); // 图片路径变量
    const handleImageError = (event: any) => {
      event.target.src = bgUrl.value;
    };
    const gotoMovieWebsite = (item: any) => {
      console.log(item);
      item.url ? gotoOutPage(item.url) : "";
    };
    return {
      handleImageError,
      gotoMovieWebsite,
      moviesData,
      index,
      posterMovie,
    };
  },
  components: {
    ElCard,
  },
};
</script>

<style scoped>
.movie-item {
  text-align: center;
  border-radius: 4px;
  margin-bottom: 20px;
  margin-right: 20px;
}

.title-div {
  display: flex;
  justify-content: center;
}

.movie-image {
  width: 100%;
  height: 308px;
  margin-bottom: 12px;
}

.is-new {
  padding: 2px 4px;
  margin-right: 5px;
  margin-left: 5px;
  height: 20px;
  background-color: rgb(0, 119, 34);
  color: #ffffff;
  border-radius: 4px;
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
  text-decoration: none;
}

.rate-movie {
  color: rgb(224, 144, 21);
  margin-top: 0px;
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
