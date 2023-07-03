<template>
  <div class="theme-container">
    <div class="my-button">
      <el-button type="primary" >饿了么组件按钮</el-button>
    </div>
    <div class="my-button">
      <el-button type="primary" @click="goToOtherPage">切换到产品页面</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
const routeSuffix = '.html';
export default{
  setup() {
    const route = useRouter();
    const goToOtherPage = () => {
      route.push({
        path: '/job/idea/products'+routeSuffix,
        query: {
          value: '233',
        },
      });
    };
    const goToHomePage = () => {
      route.push({
        path: '/develop',
        query: {
          value: '233',
        },
      });
    };
    function routePush(this: any, pageName: string) {
      let value = "0";
      this.goToOtherPage(pageName, value);
    }
    return { route, routePush, goToOtherPage,goToHomePage };
  }
}
</script>
<style scoped>
.my-button{
 margin-top: 40px;
}
</style>