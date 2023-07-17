<template>
  <div>
    <el-row>
      <el-col
        :span="24"
        :md="8"
        :lg="8"
        v-for="(parentItem, parentIndex) in zhipinData"
        :key="parentIndex"
      >
        <el-card
          shadow="hover"
          class="el-boss-card"
          :style="
            parentIndex == zhipinData.length - 1
              ? `background-image: url(${bossLogo}); background-size: cover;`
              : ''
          "
        >
          <div
            class="boss-head-div"
            :style="
              parentIndex == zhipinData.length - 1 ? `visibility: hidden` : ''
            "
            @click="gotoBossWebsite(parentIndex, parentItem)"
          >
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
                <div class="boss-title-info">前端开发工程师</div>
              </div>
            </div>
            <div class="boss-more-info">
              <el-icon :size="30" color="#4d4a4d"><MoreFilled /></el-icon>
            </div>
          </div>
          <div
            class="boss-job-info"
            :style="
              parentIndex == zhipinData.length - 1 ? `visibility: hidden` : ''
            "
          >
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
      :style="`margin-top:${dialogMarginTop}px`"
      id="dialogEl"
    >
      <div class="dialog-content">{{ handleDialogContent(dialogContent) }}</div>
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
import { ref, nextTick, watch, computed } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import zhipinSource from "../../../public/data/zhipin.json";
import logoImageUrl from "../../../public/img/logo.jpg";
export default {
  setup() {
    const logoUrl = ref(logoImageUrl);
    const bossLogo = ref(
      "https://img.bosszhipin.com/static/file/2022/wf8r5vlj1y1653961013785.png"
    );
    let zhipinData = ref(zhipinSource);
    const handleImageError = (event: any) => {
      event.target.src = logoUrl.value;
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
    const gotoBossWebsite = (index: any, item: any) => {
      console.log(index);
      console.log("item", item);
      dialogGuideVisible.value = true;
      dialogTitle.value = item.brandName;
      dialogContent.value = item.jobDesc;
      websiteUrl = item.job_detail;
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
    const dialogMarginTop = ref();
    watch(dialogGuideVisible, async (newValue) => {
      if (newValue) {
        await nextTick(); // 等待元素渲染完成
        const dialogData = document.getElementById("dialogEl");
        if (dialogData) {
          let dialogHeight = dialogData.clientHeight;
          let windowHeight = window.innerHeight;
          let initMargin = isPCRes.value ? 0 : 58;
          dialogMarginTop.value =
            (Number(windowHeight) - dialogHeight) / 2 + initMargin;
        }
      }
    });
    const handleDialogCancel = () => {
      dialogGuideVisible.value = false;
    };
    const handleDialogConfirm = () => {
      dialogGuideVisible.value = false;
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    return {
      logoUrl,
      zhipinData,
      handleImageError,
      handleJobSkills,
      bossLogo,
      gotoBossWebsite,
      dialogGuideVisible,
      dialogTitle,
      dialogContent,
      handleDialogContent,
      dialogMarginTop,
      handleDialogCancel,
      handleDialogConfirm,
    };
  },
  methods: {},
};
</script>
<style scoped>
.dialog-content {
  padding: 0;
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
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
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