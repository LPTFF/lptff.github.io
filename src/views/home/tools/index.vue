<template>
  <div>
    <div v-for="(websites, parentIndex) in websiteSource" :key="parentIndex">
      <el-tag class="website-type" :type="websiteTransformType(parentIndex)">{{
        websites.category
      }}</el-tag>
      <el-row>
        <el-col :span="24" :md="8" :lg="6" v-for="(item, sonIndex) in websites.list" :key="sonIndex">
          <el-card class="website-common-card" :style="`background-color:${getBackgroundColor(parentIndex)}`"
            shadow="hover">
            <el-link :href="item.url" target="_blank" class="website-link" :underline="false"
              @click.prevent="gotoNewsWebsite(item)">
              <el-avatar :size="50" class="log-website" :src="resolveIcon(item.icon)" />
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
import logoImageUrl from "../../../public/img/logo.jpg";
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
    const loadFrequentWebsites = () => {
      const clickData = JSON.parse(localStorage.getItem("frequentWebsites") || "{}");
      const list = Object.values(clickData)
        .sort((a: any, b: any) => b.count - a.count) // 按点击次数降序排序
        .slice(0, 12); // 最多显示12个常用网站
      if (list.length > 0) {
        return [{
          category: "常用",
          list,
        }];
      }
      return [];
    };
    // 加载缓存并打印
    const frequentGroup = loadFrequentWebsites();
    // 打印整理后的分组数据
    console.info("frequentGroup for websiteSource:", frequentGroup);
    console.info('websiteGroups', websiteGroups)
    const websiteSource: any = ref([
      ...loadFrequentWebsites(),
      ...websiteGroups
    ]);
    const gotoNewsWebsite = (website: any) => {
      if (website.url) {
        const clickData = JSON.parse(localStorage.getItem("frequentWebsites") || "{}");
        console.info('clickData', clickData)
        const key = website.url;
        if (!clickData[key]) {
          clickData[key] = { ...website, count: 1 };
        } else {
          clickData[key].count += 1;
        }
        localStorage.setItem("frequentWebsites", JSON.stringify(clickData));
        const isInternal = website.url.startsWith("/") && !/^https?:\/\//.test(website.url);
        const targetUrl = isInternal ? window.location.origin + website.url : website.url;
        gotoOutPage(targetUrl);
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
    const resolveIcon = (icon: string) => {
      if (icon === "InternalWebsite") {
        return logoImageUrl; // 替换为实际路径
      }
      return icon;
    };
    return {
      websiteSource,
      gotoNewsWebsite,
      websiteTransformType,
      getBackgroundColor,
      resolveIcon
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
