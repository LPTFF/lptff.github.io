<template>
    <div class="theme-container">
      这是vue全局组件
      <div class="my-button">
        <el-button type="primary" >饿了么组件按钮1</el-button>
      </div>
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
  const routeSuffix = '.html';
  export default{
    setup() {
     console.log('233');
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