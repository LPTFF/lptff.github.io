<template>
  <div>
    <el-alert
      title="Boss 直聘职位"
      :description="dataStatusText"
      :type="dataStatusType"
      :closable="false"
      show-icon
      class="boss-data-status"
    />
    <el-row>
      <el-col
        :span="24"
        :md="8"
        :lg="8"
        v-for="parentItem in zhipinData"
        :key="parentItem.job_detail"
      >
        <el-card
          shadow="hover"
          class="el-boss-card"
          @click="showJobDetail(parentItem)"
        >
          <div class="boss-head-div">
            <div class="boss-info">
              <img
                :src="parentItem.brandLogo ? parentItem.brandLogo : logoUrl"
                alt="公司logo"
                class="boss-img-info"
                @error="handleImageError"
              />
              <div class="boss-name-info">{{ parentItem.brandName }}</div>
              <div class="flex-common">
                <el-icon color="#7e8895" :size="20" class="boss-logo-title"
                  ><Suitcase
                /></el-icon>
                <div class="boss-title-info">{{ parentItem.bossTitle }}</div>
              </div>
            </div>
            <div class="boss-more-info">
              <el-icon :size="30" color="#4d4a4d"><MoreFilled /></el-icon>
            </div>
          </div>
          <div class="boss-job-info">
            <div class="boss-head-div">
              <div class="boss-industry-info">
                <div class="boss-detail-industry">所属行业</div>
                <div class="boss-name-industry">
                  {{ parentItem.brandIndustry }}
                </div>
              </div>
              <div class="boss-salary-div">
                <div class="boss-detail-industry">薪资</div>
                <div class="boss-name-industry boss-desc-salary">
                  {{ parentItem.salaryDesc }}
                </div>
              </div>
            </div>
            <div class="flex-common boss-skills-div">
              <div class="skills-logo">
                <el-icon color="#7e8895" :size="20"><Opportunity /></el-icon>
              </div>
              <div class="skills-desc">
                {{ handleJobSkills(parentItem.skills) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog
      v-model="dialogGuideVisible"
      :title="dialogTitle"
      center
      top="5vh"
      :width="isPCRes ? '50%' : '92%'"
      id="dialogEl"
    >
      <div
        class="dialog-content"
        :style="dialogContent ? '' : 'text-align: center;'"
      >
        {{
          handleDialogContent(dialogContent)
            ? handleDialogContent(dialogContent)
            : "这里什么都没有"
        }}
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogCancel">不感兴趣</el-button>
          <el-button type="primary" @click="handleDialogConfirm">
            前去看看
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ref, computed } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import zhipinSource from "../../../public/data/zhipin.json";
import logoImageUrl from "../../../public/img/logo.jpg";
import { Suitcase, MoreFilled, Opportunity } from "@element-plus/icons-vue";
import { ElRow, ElCol, ElCard, ElIcon, ElDialog, ElButton, ElAlert } from "element-plus";
export default {
  setup() {
    const logoUrl = logoImageUrl;
    const zhipinData = zhipinSource;
    const latestTimestamp = Math.max(
      0,
      ...zhipinData.map((item: any) => Number(item.timestamp) || 0)
    );
    const isBossSnapshot = zhipinData.length > 0 && zhipinData.every(
      (item: any) => item.website === "zhipin" &&
        new URL(item.job_detail).hostname === "www.zhipin.com"
    );
    const dataStatusType: "success" | "warning" = isBossSnapshot ? "success" : "warning";
    const dataStatusText = isBossSnapshot && latestTimestamp
      ? `数据来自 Boss 直聘公开城市页，页面最近更新时间：${new Date(latestTimestamp).toLocaleString("zh-CN")}；职位详情如触发登录或安全验证，请停止访问并稍后在 Boss 直聘确认。`
      : "Boss 公开页面当前无法生成合格的新快照；保留产品入口，但不展示第三方招聘数据。";
    const handleImageError = (event: any) => {
      event.target.src = logoUrl;
    };
    const handleJobSkills = (skills: any) => {
      let result = "";
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        // 过滤掉空元素
        if (!skill) {
          continue;
        }
        const newResult = result + skill + " | ";
        if (newResult.length <= 80) {
          result = newResult;
        } else {
          break;
        }
      }
      // 去除末尾的 "|"
      result = result.slice(0, result.length - 3);
      return result;
    };
    const isPCRes = computed(() => isPC());
    const showJobDetail = (item: any) => {
      dialogGuideVisible.value = true;
      dialogTitle.value = `${item.brandName} · ${item.bossTitle}`;
      dialogContent.value = item.jobDesc ? item.jobDesc : "";
      websiteUrl.value = item.job_detail;
    };
    let dialogGuideVisible = ref(false);
    let dialogTitle = ref("");
    let dialogContent = ref("");
    let websiteUrl = ref("");
    const handleDialogContent = (item: any) => {
      const lengthControl = 400;
      return item.length < lengthControl || isPCRes.value
        ? item
        : item.slice(0, lengthControl) + "...";
    };
    const handleDialogCancel = () => {
      dialogGuideVisible.value = false;
    };
    const handleDialogConfirm = () => {
      dialogGuideVisible.value = false;
      if (websiteUrl.value) {
        gotoOutPage(websiteUrl.value);
      }
    };
    return {
      logoUrl,
      dataStatusText,
      dataStatusType,
      zhipinData,
      handleImageError,
      handleJobSkills,
      showJobDetail,
      dialogGuideVisible,
      dialogTitle,
      dialogContent,
      handleDialogContent,
      isPCRes,
      handleDialogCancel,
      handleDialogConfirm,
    };
  },
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElIcon,
    ElDialog,
    ElButton,
    ElAlert,
    Suitcase,
    MoreFilled,
    Opportunity,
  },
};
</script>
<style scoped>
.boss-data-status {
  margin-bottom: 16px;
}
.dialog-content {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dialog-footer {
  display: flex;
  justify-content: space-evenly;
}
.boss-logo-title {
  margin: 10px 10px 0px 0px;
}
.skills-desc {
  color: #7e8790;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 5px;
  margin-right: 25px;
}
.skills-logo {
  margin: 2px 10px 0px 25px;
}
.flex-common {
  display: flex;
}
.boss-skills-div {
  padding: 20px 0px;
  height: 40px;
}
.boss-desc-salary {
  color: #fe574a !important;
}
.boss-salary-div {
  margin: 25px 25px 0px 0px;
}
.boss-name-industry {
  margin-top: 10px;
  color: #7e8790;
  font-weight: 600;
  font-size: 16px;
}
.boss-detail-industry {
  color: #b0b3ba;
}
.boss-industry-info {
  margin: 25px 0px 0px 25px;
}
.boss-job-info {
  margin: 15px;
  background: #f8fafb;
  border-radius: 5px;
}
.boss-more-info {
  margin: 46px 30px 0px 0px;
}
.boss-title-info {
  margin-top: 10px;
  color: #b0b3ba;
}
.boss-name-info {
  margin-top: 10px;
  color: #7e8790;
  font-weight: 600;
  font-size: 21px;
}
.boss-img-info {
  height: 70px;
  width: 70px;
  border-radius: 50%;
}
.boss-info {
  margin-top: 26px;
  margin-left: 32px;
}
.boss-head-div {
  display: flex;
  justify-content: space-between;
}
.el-boss-card {
  margin-right: 20px;
  margin-bottom: 20px;
  background: #ffffff;
}
.el-more-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 355px;
  text-align: center;
  color: #7e8790;
  font-weight: 600;
  font-size: 21px;
}
:deep(.el-card__body) {
  padding: 0;
}
</style>
