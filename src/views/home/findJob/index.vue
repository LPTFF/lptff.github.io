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
import { defineComponent } from "vue";
import AllQuestion from "./前端八股文汇总背诵版.md";
export default defineComponent({
  setup() {},
  components: {
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
