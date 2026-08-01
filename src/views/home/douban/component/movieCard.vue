<template>
  <div>
    <el-card class="movie-item" shadow="hover">
      <div>
        <img
          :src="posterMovie || bgImageUrl"
          :data-poster-source="posterSource"
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
import { ElCard } from "element-plus";

const posterModules = import.meta.glob(
  "../../../../public/data/doubanImg/moviePoster_*.json",
  { import: "default" },
);

const normalizePoster = (value: unknown): string => {
  if (value && typeof value === "object" && "cover" in value) {
    return normalizePoster((value as { cover: unknown }).cover);
  }
  if (typeof value !== "string") {
    return "";
  }

  const content = value.trim();
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(content)) {
    return content;
  }

  const base64 = content.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return "";
  }

  const mimeType = base64.startsWith("/9j/")
    ? "image/jpeg"
    : base64.startsWith("iVBORw0KGgo")
      ? "image/png"
      : base64.startsWith("UklGR")
        ? "image/webp"
        : base64.startsWith("R0lGOD")
          ? "image/gif"
          : "";
  return mimeType ? `data:${mimeType};base64,${base64}` : "";
};

export default {
  props: {
    moviesData: [String, Number, Object],
    index: [String, Number, Object],
  },
  setup(props: any) {
    const { moviesData, index } = toRefs(props);
    const posterMovie = ref(bgImageUrl);
    const posterSource = ref("fallback");

    onMounted(async () => {
      if (Number(index.value) >= 1000) {
        return;
      }
      const modulePath = `../../../../public/data/doubanImg/moviePoster_${moviesData.value.id}.json`;
      const loadPoster = posterModules[modulePath];
      if (!loadPoster) {
        return;
      }
      const poster = normalizePoster(await loadPoster());
      if (poster) {
        posterMovie.value = poster;
        posterSource.value = "local";
      }
    });

    const handleImageError = () => {
      posterMovie.value = bgImageUrl;
      posterSource.value = "fallback";
    };
    const gotoMovieWebsite = (item: any) => {
      console.log(item);
      item.url ? gotoOutPage(item.url) : "";
    };
    return {
      bgImageUrl,
      handleImageError,
      gotoMovieWebsite,
      moviesData,
      index,
      posterMovie,
      posterSource,
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
