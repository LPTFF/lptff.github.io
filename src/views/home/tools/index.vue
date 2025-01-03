<template>
  <div>
    <div v-for="(websites, parentIndex) in websiteSource" :key="parentIndex">
      <el-tag class="website-type" :type="websiteTransformType(parentIndex)">{{
        websites.category
      }}</el-tag>
      <el-row>
        <el-col
          :span="24"
          :md="8"
          :lg="6"
          v-for="(item, sonIndex) in websites.list"
          :key="sonIndex"
        >
          <el-card
            class="website-common-card"
            :style="`background-color:${getBackgroundColor(parentIndex)}`"
            shadow="hover"
          >
            <el-link
              :href="item.url"
              target="_blank"
              class="website-link"
              :underline="false"
              @click.prevent="gotoNewsWebsite(item)"
            >
              <el-avatar :size="50" class="log-website" :src="item.icon" />
              {{ item.name }}
            </el-link>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { gotoOutPage } from "../../../utils/utils";
import websiteGroups from "./websiteGroups.json";
import { ElRow, ElCol, ElCard, ElLink, ElAvatar, ElTag } from "element-plus";
enum WebsiteType {
  Success = "success",
  Warning = "warning",
  Danger = "danger",
  Info = "info",
  Default = "",
}
export default defineComponent({
  name: "App",
  setup() {
    const websiteSource = ref(websiteGroups);
    const gotoNewsWebsite = (website: any) => {
      if (website.url) {
        gotoOutPage(website.url);
      }
    };
    const websiteTransformType = (parentIndex: number) => {
      const types = [
        WebsiteType.Default,
        WebsiteType.Success,
        WebsiteType.Info,
        WebsiteType.Warning,
        WebsiteType.Danger,
      ];
      return types[parentIndex % 5]; // 循环使用 types 数组
    };
    const getBackgroundColor = (parentIndex: number) => {
      const colors = [
        "rgb(217, 236, 255)", // parentIndex 0
        "rgb(225, 243, 216)", // parentIndex 1
        "rgb(233, 233, 235)", // parentIndex 2
        "rgb(250, 236, 216)", // parentIndex 3
        "rgb(253, 226, 226)", // parentIndex 4
      ];
      return colors[parentIndex % 5]; // 每5次循环一次
    };
    return {
      websiteSource,
      gotoNewsWebsite,
      websiteTransformType,
      getBackgroundColor,
    };
  },
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElLink,
    ElAvatar,
    ElTag,
  },
});
</script>
<style scoped>
.website-common-card {
  margin: 10px 20px 10px 0px;
}

.log-website {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}
.website-link {
  margin: 10px;
}
</style>
