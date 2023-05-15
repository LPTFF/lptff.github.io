<template>
  <div class="theme-container">
    <div class="my-button">
      <el-button type="primary" @click="goToOtherPage">去往生活页面</el-button>
    </div>
    <div class="my-button">
      <el-button type="primary" @click="goToHomePage">去往工作页面</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
export default{
  setup() {
    const route = useRouter();
    const goToOtherPage = () => {
      route.push({
        path: '/Life',
        query: {
          value: '233',
        },
      });
    };
    const goToHomePage = () => {
      route.push({
        path: '/Job',
        query: {
          value: '233',
        },
      });
    };
    const goToBack = () => {
      route.push({
        path: '/Job',
        query: {
          value: '233',
        },
      });
    };
    return { route, goToOtherPage,goToHomePage,goToBack };
  }
}
</script>
<style scoped>
.my-button{
 margin-top: 80px;
}
.page .theme-default-content{
  max-width:none !important
}
</style>