<template>
  <div>
    <div>这是一个markdown测试</div>
    <div v-for="(question, parentIndex) in questionList" :key="parentIndex">
      <el-tag
        class="website-type"
        type="info"
        :style="`background-color:${question.color}`"
        >{{ question.companyName }}</el-tag
      >
      <el-row>
        <el-col
          :span="24"
          :md="24"
          :lg="24"
          v-for="(item, sonIndex) in question.list"
          :key="sonIndex"
        >
          <el-card
            shadow="hover"
            class="welfare-card"
            :style="`background-color:${question.color}`"
          >
            <div class="welfare-date">
              <div class="day-week-welfare">
                <div class="welfare-week">{{ handleWeek(question) }}</div>
                <div class="welfare-day">{{ handleDay(question) }}</div>
              </div>
              <div>
                <el-divider
                  direction="vertical"
                  color="#cccccc"
                  class="el-welfare-divider"
                />
              </div>
              <div class="welfare-hour">
                <div class="welfare-icon-hour">
                  <el-icon><Timer /></el-icon>
                </div>
                <div>{{ handleHour(question) }}</div>
              </div>
              <div>
                <div v-html="formatRichText(item.desc)" class="welfare-link-title"></div>
                <div v-html="formatRichText(item.answer)" class="welfare-div-link"></div>
                <!-- <div class="welfare-div-link">{{ item.answer }}</div> -->
              </div>
            </div>
            <div class="welfare-div-website">
              <img :src="question.companyLogo" alt="网站" class="welfare-img-link" />
              <div class="welfare-name-link">
                {{ handleQuestionType(item) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import logoImageUrl from "../../../public/img/logo.jpg";
import sourceList from "./questionList.json";
import { ElRow, ElCol, ElCard, ElIcon, ElTag, ElDivider } from "element-plus";

export default defineComponent({
  setup() {
    const logoUrl = ref(logoImageUrl);
    const questionList = ref(sourceList);
    console.log("questionList", questionList.value);
    const handleQuestionType = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let questionType = "";
      switch (String(item.questionType)) {
        case "1":
          questionType = "八股文";
          break;
        case "2":
          questionType = "项目经验";
          break;
        case "3":
          questionType = "在线编程";
          break;
        default:
          questionType = "八股文";
      }
      return questionType;
    };
    const handleWeek = (item: any) => {
      const date = new Date(item.timestamp);
      const dayOfWeek = date.getDay();
      const weekdays = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      const dayName = weekdays[dayOfWeek];
      return dayName;
    };
    const handleDay = (item: any) => {
      const date = new Date(item.timestamp);
      const day = date.getDate();
      const formattedDay = day < 10 ? "0" + day : day.toString();
      return formattedDay;
    };
    const handleHour = (item: any) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours.toString();
      const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
      const timeString = `${formattedHours}:${formattedMinutes}`;
      return timeString;
    };
    const formatRichText = (item: any) => {
      return item.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
    };
    return {
      logoUrl,
      questionList,
      handleQuestionType,
      handleWeek,
      handleDay,
      handleHour,
      formatRichText,
    };
  },
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElIcon,
    ElTag,
    ElDivider,
  },
});
</script>
<style scoped>
.website-type {
  margin-bottom: 10px;
}
.welfare-div-website {
  display: flex;
  margin: auto 0;
}
.welfare-name-link {
  margin-top: 4px;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-img-link {
  height: 30px;
  width: 30px;
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
  margin-right: 10px;
}
.welfare-link-title {
  display: block;
  color: #797979;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 40px;
  max-width: 700px;
}
.welfare-link-title :deep(p) {
  margin: 0px;
}
.day-week-welfare {
  margin: 0px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 水平居中对齐 */
  align-items: center; /* 垂直居中对齐 */
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
}
.welfare-week {
  color: #797979;
  font-weight: 600;
  font-size: 16px;
  margin-left: 5px;
}
.welfare-icon-hour {
  margin-right: 8px;
  margin-top: 2px;
}
.welfare-hour {
  margin: 0px 40px 0px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-div-link {
  max-width: 700px;
}
.welfare-div-link :deep(p) {
  margin: 0px;
}
.el-welfare-divider {
  height: 100%;
}
.welfare-date {
  margin-right: 20px;
  display: flex;
}
.welfare-title {
  height: 30px;
  width: 55px;
  margin-bottom: 10px;
  color: #5b5d5c;
  font-weight: 600;
  font-size: 21px;
}
.welfare-card {
  margin: 0px 0px 10px 0px;
  background-color: rgb(253, 226, 226);
}
:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
}
/* .el-card.is-hover-shadow:focus,
.el-card.is-hover-shadow:hover {
  background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
    linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
    linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
  background-size: 100% 100px;
  background-repeat: repeat-y;
} */
</style>
