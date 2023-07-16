<template>
  <div>
    <el-card class="movie-item" shadow="hover">
      <div v-if="(index + 1) % randomInt == 0">
        <img
          :src="`https://images.weserv.nl/?url=` + moviesData.cover"
          alt="电影封面"
          class="movie-image"
          @error="handleImageError"
        />
      </div>
      <div :style="divStyle" v-else>
        <img
          :src="`https://images.weserv.nl/?url=` + moviesData.cover"
          alt="电影封面"
          class="movie-image"
          :style="{ display: imageError ? 'none' : 'block' }"
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
import { toRefs, ref, computed } from "vue";
import bgImageUrl from "../../../../public/img/bg.jpg";
import { gotoOutPage } from "../../../../utils/utils";
export default {
  props: {
    moviesData: [String, Number, Object],
    index: [String, Number, Object],
  },
  setup(props: any) {
    const { moviesData, index } = toRefs(props);
    const bgUrl = ref(bgImageUrl); // 图片路径变量
    const imageBackgroundColor = ref<string>("#ffffff");
    const imageColorControl = ref(false);
    const imageError = ref(false);
    const handleImageError = (event: any) => {
      event.target.src = bgUrl.value;
      if (!imageColorControl.value) {
        imageColorControl.value = true;
        const randomColor =
          "#" + Math.floor(Math.random() * 16777215).toString(16);
        imageBackgroundColor.value = randomColor;
        imageError.value = true; // 设置 imageError 标志为 true
      }
    };
    const gotoMovieWebsite = (item: any) => {
      console.log(item);
      item.url ? gotoOutPage(item.url) : "";
    };
    const defaultBackground = `linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
                          linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
                          linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1)`;

    const divStyle = computed(() => {
      const isWhite = (color: string, threshold: number = 30) => {
        const [r, g, b] = color.match(/\w\w/g)!.map((x) => parseInt(x, 16));
        return (
          r > 255 - threshold && g > 255 - threshold && b > 255 - threshold
        );
      };
      if (imageColorControl.value) {
        // 生成随机颜色，并过滤掉白色和偏白色
        const randomColor = () =>
          "#" + Math.floor(Math.random() * 16777215).toString(16);
        const colors = new Set<string>();
        while (colors.size < 3) {
          const color = randomColor();
          if (!isWhite(color, 30)) {
            // 设置阈值为30，可以根据需要调整
            colors.add(color);
          }
        }
        if (colors.size < 3) {
          // 如果随机颜色集合不足3个，使用默认背景颜色
          return {
            background: defaultBackground,
            height: "308px",
            marginBottom: "12px",
          };
        }
        const [randomColor1, randomColor2, randomColor3] = Array.from(colors);
        // 创建斑马纹效果的linear-gradient
        return {
          backgroundImage: `linear-gradient(45deg, ${randomColor1}, ${randomColor1} 50%, ${randomColor2} 50%, ${randomColor2}), linear-gradient(45deg, ${randomColor2}, ${randomColor2} 50%, ${randomColor3} 50%, ${randomColor3}), linear-gradient(45deg, ${randomColor3}, ${randomColor3} 50%, ${randomColor1} 50%, ${randomColor1})`,
          backgroundSize: "100% 100px",
          backgroundRepeat: "repeat-y",
          height: "308px",
          marginBottom: "12px",
        };
      } else {
        return {
          background: defaultBackground, // 默认背景颜色
          height: "308px",
          marginBottom: "12px",
        };
      }
    });
    const randomInt = computed(() => {
      // 生成范围在2和8之间的随机整数
      return Math.floor(Math.random() * 7) + 2;
    });
    return {
      handleImageError,
      gotoMovieWebsite,
      divStyle,
      moviesData,
      imageError,
      index,
      randomInt,
    };
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
  width: 218px;
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
