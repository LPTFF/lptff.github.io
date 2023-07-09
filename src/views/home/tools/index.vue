<template>
  <div>
    <div v-for="(websites, parentIndex) in websiteSource" :key="parentIndex">
      <el-tag
        class="website-type"
        :type="websiteTransformType(websites.type)"
        >{{ websites.category }}</el-tag
      >
      <el-row>
        <el-col
          :span="24"
          :md="8"
          :lg="6"
          v-for="(item, sonIndex) in websites.list"
          :key="sonIndex"
        >
          <el-card
            :class="[
              'website-common-card',
              `website-background${parentIndex + 1}-card`,
            ]"
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
import { defineComponent } from "vue";
import { gotoOutPage } from "../../../utils/utils";
import websiteGroups from "./websiteGroups.json";
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
    const websiteSource = websiteGroups;
    const gotoNewsWebsite = (website: any) => {
      if (website.url) {
        gotoOutPage(website.url);
      }
    };
    const websiteTransformType = (type: any) => {
      switch (type) {
        case "success":
          return WebsiteType.Success;
        case "warning":
          return WebsiteType.Warning;
        case "danger":
          return WebsiteType.Danger;
        case "info":
          return WebsiteType.Info;
        default:
          return WebsiteType.Default; // 默认类型
      }
    };
    return {
      websiteSource,
      gotoNewsWebsite,
      websiteTransformType,
    };
  },
});
</script>
<style scoped>
.website-common-card {
  margin: 10px 20px 10px 0px;
}
.website-background1-card {
  background: rgb(217, 236, 255);
}
.website-background2-card {
  background: rgb(225, 243, 216);
}
.website-background3-card {
  background: rgb(250, 236, 216);
}
.website-background4-card {
  background: rgb(253, 226, 226);
}
.website-background5-card {
  background: rgb(233, 233, 235);
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
  