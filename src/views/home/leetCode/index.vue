<template>
  <el-card
    v-for="(question, index) in questions"
    :key="index"
    class="question-card"
  >
    <div class="card-header">
      <span class="question-title">{{ question.problemsName }}</span>
      <span :class="[getDifficultyStyle(question), 'question-difficulty']"
        >{{ getProblemHard(question)
        }}<span class="pass-header-rate" v-if="isPCRes"
          >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;通过率{{
            question.passRate
          }}</span
        ></span
      >
    </div>
    <div class="card-body">
      <!-- 题目内容 -->
      <div
        v-if="!question.isPlus"
        v-html="question.problemsDesc"
        class="problems-card-desc"
      ></div>
      <div v-else class="problems-card-desc">
        <div class="problems-plus-desc">
          <el-button type="warning">该题目是 Plus 会员专享题</el-button>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <el-button @click="gotoLeetCode(question, '1')" type="primary"
        >开始答题</el-button
      >
      <el-button @click="gotoLeetCode(question, '2')" type="primary"
        >查看答案</el-button
      >
    </div>
  </el-card>
  <div class="update-question">
    <div class="update-icon-question">
      <el-icon><Refresh /></el-icon>
    </div>
    <div>
      <el-button type="success" @click="getRandomQuestion"
        >不满意？随机换一下</el-button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import leetCodeList from "../../../public/data/leetCode/leetCode_1.json";
import axios from "axios";
import { ElLoading, ElCard, ElButton, ElIcon } from "element-plus";
let leetCodeData = [] as any[];
const importLeetCodeData = async () => {
  const files = import.meta.glob(
    "../../../public/data/leetCode/leetCode_*.json"
  );
  for (const path in files) {
    if (Object.hasOwnProperty.call(files, path)) {
      const module: any = await files[path]();
      leetCodeData.push(module.default);
    }
  }
};

const getRandomProblems = (array: any, num: any) => {
  const result = [] as any[];
  const length = array.length;
  if (num >= length) {
    return array;
  }
  while (result.length < num) {
    const randomIndex = Math.floor(Math.random() * length);
    const randomProblem = array[randomIndex];
    if (!result.includes(randomProblem)) {
      result.push(randomProblem);
    }
  }
  return result;
};
let getLeetCodeCount = 0;
const getLeetCodeList = async () => {
  const loadingInstance = ElLoading.service({ fullscreen: true });
  try {
    let pageSize = Math.floor(Math.random() * 64) + 1;
    const cdnWebsite = "https://fastly.jsdelivr.net/gh/LPTFF/lptff.github.io@";
    const basUrl = `python-crawl/leetCode/leetCode_${pageSize}.json`;
    const response = await axios.get(cdnWebsite + basUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return leetCodeList;
  } finally {
    nextTick(() => {
      loadingInstance.close();
    });
  }
};
let questionsPre = "";
let questionsList = [] as any[];
export default {
  data() {
    return {
      dialogVisible: true,
    };
  },
  setup() {
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref("");
    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    const getProblemHard = (question: any) => {
      let hardRateName = "";
      switch (String(question.hardRate)) {
        case "EASY":
          hardRateName = "简单";
          break;
        case "MEDIUM":
          hardRateName = "中等";
          break;
        case "HARD":
          hardRateName = "困难";
          break;
        default:
          hardRateName = "简单";
      }
      return hardRateName;
    };
    const getDifficultyStyle = (question: any) => {
      let questionStyle = "";
      switch (String(question.hardRate)) {
        case "EASY":
          questionStyle = "question-easy";
          break;
        case "MEDIUM":
          questionStyle = "question-medium";
          break;
        case "HARD":
          questionStyle = "question-hard";
          break;
        default:
          questionStyle = "question-easy";
      }
      return questionStyle;
    };
    const questions = ref([
      {
        hardRate: "EASY",
        isPlus: false,
        passRate: "71.27%",
        problemsDesc: "<p>输入一个正整数 </p>",
        problemsUrl: "",
        solutionsUrl: "",
        problemsName: "",
      },
    ]);
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
      // await importLeetCodeData();
      // let randomDataIndex = Math.floor(Math.random() * leetCodeData.length);
      // let randomFileContent = leetCodeData[randomDataIndex];
      // let questionsList = ref(randomFileContent);
      // questions.value = getRandomProblems(questionsList.value, 1);
      let questionsList =
        questionsPre.length == 0 ? leetCodeList : questionsPre;
      questionsPre = getRandomProblems(questionsList, 1);
      questions.value = questionsPre
        ? JSON.parse(JSON.stringify(questionsPre))
        : questionsPre;
    });
    let dialogTop = ref("100px");
    let dialogLeft = ref("100px");
    const handleDialogDrag = (event: MouseEvent) => {
      // 更新悬浮窗的位置
      dialogTop.value = event.clientY + "px";
      dialogLeft.value = event.clientX + "px";
    };
    const getRandomQuestion = async () => {
      // let randomDataIndex = Math.floor(Math.random() * leetCodeData.length);
      // let randomFileContent = leetCodeData[randomDataIndex];
      // let questionsList = ref(randomFileContent);
      // questions.value = getRandomProblems(questionsList.value, 1);
      getLeetCodeCount++;

      if (getLeetCodeCount % 3 == 0) {
        questionsList = await getLeetCodeList();
        questionsPre = getRandomProblems(questionsList, 1);
      } else {
        questionsPre = getRandomProblems(leetCodeList, 1);
      }
      questions.value = questionsPre
        ? JSON.parse(JSON.stringify(questionsPre))
        : questionsPre;
    };
    const gotoLeetCode = (question: any, type: any) => {
      let url = type == "2" ? question.solutionsUrl : question.problemsUrl;
      question.problemsUrl ? gotoOutPage(url) : "";
    };
    return {
      callMethod,
      isPCRes,
      previousRoute,
      getProblemHard,
      getDifficultyStyle,
      questions,
      dialogTop,
      dialogLeft,
      handleDialogDrag,
      getRandomQuestion,
      gotoLeetCode,
    };
  },
  components: {
    ElCard,
    ElButton,
    ElIcon,
  },
};
</script>

<style scoped>
.update-question {
  text-align: center;
  padding: 10px 0;
  color: rgb(45, 181, 93);
  font-size: 25px;
  display: flex;
  justify-content: center;
}
.update-icon-question {
  margin: 4px 10px 0px 0px;
}

.question-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
}

.question-title {
  font-size: 18px;
  color: rgb(44, 62, 80);
  font-weight: 600;
}
.pass-header-rate {
  color: rgb(48, 49, 51);
}

.question-difficulty {
  font-size: 14px;
  align-items: center;
  margin-top: 3px;
}
.question-easy {
  color: rgb(0, 175, 155);
}
.question-medium {
  color: rgb(255, 184, 0);
}
.question-hard {
  color: rgb(255, 45, 85);
}
.card-body {
  margin-top: 10px;
}
.problems-card-desc {
  word-wrap: break-word;
  overflow-wrap: break-word;
  text-overflow: ellipsis;
  overflow: hidden;
}
.problems-card-desc :deep(img) {
  max-width: 100%;
  height: auto !important;
}
.problems-card-desc :deep(pre) {
  text-wrap: wrap !important;
}
.problems-plus-desc {
  height: 400px;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
.card-footer {
  margin-top: 20px;
  text-align: right;
}
.float-button {
  position: fixed;
  top: 20px;
  right: 20px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .header-el {
    position: fixed;
    z-index: 9999;
    width: 100%;
    background-color: var(--el-menu-bg-color);
  }

  .main-content {
    padding-top: 115px;
  }
  .question-title {
    max-width: 200px;
    white-space: nowrap;
    /* 防止换行 */
    overflow: hidden;
    /* 超出部分隐藏 */
    text-overflow: ellipsis;
    /* 超出部分省略号显示 */
    height: 100%;
  }
  .problems-plus-desc {
    height: 200px;
    display: flex;
    justify-content: center; /* 水平居中 */
    align-items: center; /* 垂直居中 */
  }
}
</style>
