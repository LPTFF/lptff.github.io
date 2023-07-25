<template>
  <div @click.stop="backToTop" class="float-button">
    <el-button :type="websiteTransformType(buttonColor)"
      >饿了么组件按钮</el-button
    >
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { ElButton } from "element-plus";
enum WebsiteType {
  Success = "success",
  Warning = "warning",
  Danger = "danger",
  Info = "info",
  Primary = "primary",
  Default = "",
}
export default {
  setup() {
    const buttonColor = ref("");
    const backToTop = async () => {
      const animateScroll = () => {
        const start = window.scrollY;
        console.log("backToTop start", start);
        let scrollDistance;
        if (start > 5000) {
          buttonColor.value = "danger"; // 设置按钮颜色为 danger
          scrollDistance = 1000;
        } else if (start > 1000) {
          buttonColor.value = "warning"; // 设置按钮颜色为 warning
          scrollDistance = 500;
        } else if (start > 200) {
          buttonColor.value = "success"; // 设置按钮颜色为 success
          scrollDistance = 100;
        } else if (start > 50) {
          buttonColor.value = "info"; // 设置按钮颜色为 info
          scrollDistance = 10;
        } else if (start > 0) {
          buttonColor.value = "primary"; // 设置按钮颜色为 primary
          scrollDistance = 5;
        } else {
          return 0;
        }
        window.scrollTo(0, start - scrollDistance);
        start > 0 ? requestAnimationFrame(animateScroll) : "";
      };
      window.scrollY > 0 ? requestAnimationFrame(animateScroll) : "";
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
        case "primary":
          return WebsiteType.Primary;
        default:
          return WebsiteType.Default; // 默认类型
      }
    };
    return {
      backToTop,
      buttonColor,
      websiteTransformType,
    };
  },
  components: {
    ElButton,
  },
};
</script>

<style scoped>
.float-button {
  position: fixed;
  bottom: 200px;
  right: 20px;
}
</style>
