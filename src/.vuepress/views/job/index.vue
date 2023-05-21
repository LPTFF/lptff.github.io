<template>
    <div>
      <div class="my-button">
        <el-button type="primary"  @click="goBack">返回</el-button>
      </div>
      <div class="main-content">
        <el-button type="primary"  @click="getRunHtml">菜鸟操作按钮</el-button>
        <el-button type="primary"  @click="getJueHtml">掘金操作按钮</el-button>
      </div>
    </div>
  </template>
 <script lang="ts">
 import axios from 'axios';
 export default{
   setup() {},
   methods: {
    goBack() {
      this.$router.back(); // 返回上一个路由
    },
    async getRequest(url){
      try {
        const response = await axios.get(url); // 发起 GET 请求
        const data = response.data; // 获取响应数据
        console.log('data',data);
        // 在这里可以对获取到的数据进行处理或使用
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    getRunHtml(){
      //https://www.runoob.com/try/ajax/json_demo.json
      this.getRequest('/Run/try/ajax/json_demo.json');
    },
    getJueHtml(){
      //https://api.juejin.cn/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20
      this.getRequest('/Jue/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20');
    }
  }
 }
</script>
  <style scoped>
  .my-button{
    margin: 40px 0px 0px 40px;
  }
  .main-content{
    text-align: center;
  }
  </style>