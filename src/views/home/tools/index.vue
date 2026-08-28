<template>
  <div>
    <div v-for="(websites, parentIndex) in websiteSource" :key="parentIndex">
      <el-tag class="website-type" :type="websiteTransformType(parentIndex as number)">{{
        websites.category
      }}</el-tag>
      <el-row>
        <el-col :span="24" :md="8" :lg="6" v-for="(item, sonIndex) in websites.list" :key="sonIndex">
          <el-card class="website-common-card" :style="`background-color:${getBackgroundColor(parentIndex as number)}`"
            shadow="hover">
            <el-link :href="item.url" target="_blank" class="website-link" underline="never"
              @click.prevent="gotoNewsWebsite(item)">
              <el-avatar :size="50" class="log-website" :src="resolveIcon(item.icon)">
                <span class="icon-fallback" :style="{ backgroundColor: fallbackColor(item.name) }">{{ fallbackChar(item.name) }}</span>
              </el-avatar>
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
import { useRouter } from "vue-router";
import { gotoOutPage } from "../../../utils/utils";
import websiteGroups from "./websiteGroups.json";
import logoImageUrl from "../../../assets/logo.jpg";
import { ElRow, ElCol, ElCard, ElLink, ElAvatar, ElTag } from "element-plus";
enum WebsiteType {
  Success = "success",
  Warning = "warning",
  Danger = "danger",
  Info = "info",
  Default = "primary",
}

export default defineComponent({
  name: "App",
  setup() {
    const router = useRouter();
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
    const websiteSource: any = ref([
      ...loadFrequentWebsites(),
      ...websiteGroups
    ]);
    const gotoNewsWebsite = (website: any) => {
      if (website.url) {
        const clickData = JSON.parse(localStorage.getItem("frequentWebsites") || "{}");
        const key = website.url;
        if (!clickData[key]) {
          clickData[key] = { ...website, count: 1 };
        } else {
          clickData[key].count += 1;
        }
        localStorage.setItem("frequentWebsites", JSON.stringify(clickData));
        const isInternal = website.url.startsWith("/") && !/^https?:\/\//.test(website.url);
        if (isInternal) {
          router.push(website.url);
        } else {
          gotoOutPage(website.url);
        }
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
    // 图标地址在 websiteGroups.json 中显式指向目标站点的官方 favicon 或官方 CDN；
    // 官方资源失败时由 el-avatar 默认 slot 显示首字符色块
    const resolveIcon = (icon: string) => {
      if (icon === "InternalWebsite") {
        return logoImageUrl; // 替换为实际路径
      }
      return icon;
    };
    const fallbackPalette = ["#5b8ff9", "#5ad8a6", "#f6bd16", "#e8684a", "#6dc8ec", "#9270ca"];
    const fallbackChar = (name: string) => (name || "?").trim().charAt(0);
    const fallbackColor = (name: string) => {
      let hash = 0;
      for (const char of name || "") hash = (hash * 31 + char.charCodeAt(0)) % 997;
      return fallbackPalette[hash % fallbackPalette.length];
    };
    return {
      websiteSource,
      gotoNewsWebsite,
      websiteTransformType,
      getBackgroundColor,
      resolveIcon,
      fallbackChar,
      fallbackColor
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

.icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}
</style>
