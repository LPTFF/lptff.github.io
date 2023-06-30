<template>
  <el-card
    v-for="(question, index) in questions"
    :key="index"
    class="question-card"
  >
    <div class="card-header">
      <span class="question-title">{{ question.problemsName }}</span>
      <span :class="[getDifficultyStyle(question), 'question-difficulty']">{{
        getProblemHard(question)
      }}</span>
    </div>
    <div class="card-body">
      <!-- 题目内容 -->
      <p>
        Given an array of integers, find two numbers such that they add up to a
        specific target number.
      </p>
    </div>
    <div class="card-footer">
      <el-button @click="gotoLeetCode(question)" type="primary"
        >开始答题</el-button
      >
    </div>
  </el-card>
  <div class="update-question" @click="getRandomQuestion">
    <div class="update-icon-question">
      <el-icon><Refresh /></el-icon>
    </div>
    <div>
      <el-button type="success">不满意？随机换一下</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { isPC, gotoOutPage } from "../../../utils/utils";
import leetCodeList from "../../../public/data/leetCode.json";

const getRandomProblems = (array, num) => {
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
export default {
  data() {
    return {};
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
    const getProblemHard = (question) => {
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
    const getDifficultyStyle = (question) => {
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
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
    });
    let questionsList = ref(leetCodeList);
    console.log("questionsList", questionsList);
    let questions = ref(getRandomProblems(questionsList.value, 3));
    console.log("questions", questions);
    return {
      callMethod,
      isPCRes,
      previousRoute,
      getProblemHard,
      getDifficultyStyle,
      questions,
    };
  },
  components: {},
  methods: {
    gotoLeetCode(question) {
      console.log("question", question.problemsUrl);
      question.problemsUrl ? gotoOutPage(question.problemsUrl) : "";
    },
    getRandomQuestion() {
      // console.log("233", leetCodeList);
      this.questions = getRandomProblems(leetCodeList, 3);
      console.log("this.questions", this.questions);
    },
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
}

.question-difficulty {
  font-size: 14px;
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

.card-footer {
  margin-top: 20px;
  text-align: right;
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
