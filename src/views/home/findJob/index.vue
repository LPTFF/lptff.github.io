<template>
  <div>
    <!-- <div v-for="(knowledge, parentIndex) in knowledgeList" :key="parentIndex">
      <el-collapse v-model="activeKnowName" accordion>
        <el-collapse-item :title="knowledge.knowledgeType" :name="String(parentIndex)">
          <el-row>
            <el-col
              :span="24"
              :md="24"
              :lg="24"
              v-for="(item, sonIndex) in knowledge.list"
              :key="sonIndex"
            >
              <el-card
                shadow="hover"
                class="welfare-card"
                :style="`background-color:${knowledge.color}`"
              >
                <div class="welfare-date know-welfare">
                  <div class="welfare-link-title know-title">
                    {{ handleTitle(item, sonIndex) }}
                  </div>
                  <div class="welfare-div-link">
                    <el-button @click="getMarkDown(item)" type="primary">
                      记不住？点我一下
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div>
      <el-collapse v-model="activeKnowName" accordion>
        <el-collapse-item title="公司面试" name="100">
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
                  <div class="welfare-div-date">
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
                          <el-icon>
                            <Timer />
                          </el-icon>
                        </div>
                        <div>{{ handleHour(question) }}</div>
                      </div>
                      <div>
                        <div
                          v-html="formatRichText(item.desc)"
                          class="welfare-link-title"
                        ></div>
                        <div
                          v-html="formatRichText(item.answer)"
                          class="welfare-div-link"
                        ></div>
                      </div>
                    </div>
                    <div class="welfare-div-website">
                      <img
                        :src="question.companyLogo"
                        alt="网站"
                        class="welfare-img-link"
                      />
                      <div class="welfare-name-link">
                        {{ handleQuestionType(item) }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div> -->
    <div class="all-content">
      <AllQuestion></AllQuestion>
    </div>

    <!-- <el-dialog v-model="dialogGuideVisible" :title="dialogTitle" center id="dialogEl">
      <div class="dialog-content">
        <component :is="dynamicComponent" v-if="dynamicComponent" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogCancel">知道了</el-button>
          <el-button type="primary" @click="handleDialogConfirm"> 尝试一下 </el-button>
        </div>
      </template>
    </el-dialog> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, defineAsyncComponent, shallowRef } from "vue";
import logoImageUrl from "../../../public/img/logo.jpg";
// import sourceList from "./questionList.json";
// import knowList from "./knowledgeExperience.json";
// import { getComponents } from "./findJobUtils.js";
import AllQuestion from "./前端八股文汇总背诵版.md";
// import {
//   ElRow,
//   ElCol,
//   ElCard,
//   ElIcon,
//   ElTag,
//   ElDivider,
//   ElDialog,
//   ElButton,
//   ElCollapse,
//   ElCollapseItem,
// } from "element-plus";
// enum WebsiteType {
//   Success = "success",
//   Warning = "warning",
//   Danger = "danger",
//   Info = "info",
//   Default = "",
// }
export default defineComponent({
  setup() {
    // const logoUrl = ref(logoImageUrl);
    // const questionList = ref(sourceList);
    // const knowledgeList = ref(knowList);
    // const handleQuestionType = (item: any) => {
    //   // 根据 item 的属性动态计算图片的 src 值
    //   let questionType = "";
    //   switch (String(item.questionType)) {
    //     case "1":
    //       questionType = "八股文";
    //       break;
    //     case "2":
    //       questionType = "项目经验";
    //       break;
    //     case "3":
    //       questionType = "在线编程";
    //       break;
    //     default:
    //       questionType = "八股文";
    //   }
    //   return questionType;
    // };
    // const handleWeek = (item: any) => {
    //   const date = new Date(item.timestamp);
    //   const dayOfWeek = date.getDay();
    //   const weekdays = [
    //     "星期日",
    //     "星期一",
    //     "星期二",
    //     "星期三",
    //     "星期四",
    //     "星期五",
    //     "星期六",
    //   ];
    //   const dayName = weekdays[dayOfWeek];
    //   return dayName;
    // };
    // const handleDay = (item: any) => {
    //   const date = new Date(item.timestamp);
    //   const day = date.getDate();
    //   const formattedDay = day < 10 ? "0" + day : day.toString();
    //   return formattedDay;
    // };
    // const handleHour = (item: any) => {
    //   const date = new Date(item.timestamp);
    //   const hours = date.getHours();
    //   const minutes = date.getMinutes();
    //   const formattedHours = hours < 10 ? "0" + hours : hours.toString();
    //   const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
    //   const timeString = `${formattedHours}:${formattedMinutes}`;
    //   return timeString;
    // };
    // const formatRichText = (item: any) => {
    //   return item.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
    // };
    // let dialogGuideVisible = ref(false);
    // let dialogTitle = ref("");
    // const dynamicComponent = shallowRef(null);
    // const getMarkDown = async (item: any) => {
    //   // const files = import.meta.glob(
    //   //   "../../../public/data/findJobMarkDown/javaScript/*.md"
    //   // );
    //   // console.log("files", files);
    //   try {
    //     let dynamicComponentDefinition = await getComponents(item.markdownPath);
    //     dynamicComponent.value = dynamicComponentDefinition;
    //     dialogTitle.value = item.title;
    //     dialogGuideVisible.value = true;
    //   } catch (error) {
    //     console.error("加载并注册动态组件失败：", error);
    //     console.log("88888", item);
    //   }
    // };
    // const handleDialogCancel = () => {
    //   dialogGuideVisible.value = false;
    // };
    // const handleDialogConfirm = () => {
    //   dialogGuideVisible.value = false;
    // };
    // const websiteTransformType = (type: any) => {
    //   switch (type) {
    //     case "success":
    //       return WebsiteType.Success;
    //     case "warning":
    //       return WebsiteType.Warning;
    //     case "danger":
    //       return WebsiteType.Danger;
    //     case "info":
    //       return WebsiteType.Info;
    //     default:
    //       return WebsiteType.Default; // 默认类型
    //   }
    // };
    // const handleTitle = (item: any, index: any) => {
    //   return index + 1 + "、" + item.desc;
    // };
    // const activeKnowName = ref("");
    // return {
    //   logoUrl,
    //   questionList,
    //   handleQuestionType,
    //   handleWeek,
    //   handleDay,
    //   handleHour,
    //   formatRichText,
    //   getMarkDown,
    //   dialogGuideVisible,
    //   handleDialogCancel,
    //   handleDialogConfirm,
    //   dialogTitle,
    //   knowledgeList,
    //   websiteTransformType,
    //   dynamicComponent,
    //   handleTitle,
    //   activeKnowName,
    // };
  },
  components: {
    // ElRow,
    // ElCol,
    // ElCard,
    // ElIcon,
    // ElTag,
    // ElDivider,
    // ElDialog,
    // ElButton,
    // ElCollapse,
    // ElCollapseItem,
    AllQuestion,
  },
});
</script>
<style scoped>
.all-content {
  margin-bottom: 40px;
}
.dialog-footer {
  display: flex;
  justify-content: space-evenly;
}

.dialog-content {
  padding: 0px 10px 0px 0px;
  height: 400px;
  overflow: auto;
}

.dialog-content :deep(pre) {
  background: rgb(205, 214, 231);
  padding: 10px 0px 10px 5px !important;
}

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
.know-title {
  margin-bottom: 0px;
  max-width: 800px;
}

.welfare-link-title :deep(p) {
  margin: 0px;
}

.day-week-welfare {
  margin: 0px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* 水平居中对齐 */
  align-items: center;
  /* 垂直居中对齐 */
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
.welfare-div-date {
  display: flex;
  justify-content: space-between;
}
.know-welfare {
  margin-right: 0px;
  display: flex;
  justify-content: space-between;
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
</style>
