<template>
  <div>
    <div class="my-button">
      <el-button type="primary"  @click="$router.go(-1)">返回</el-button>
    </div>
    <div class="main-content">
      这是要开发的生活页面
    </div>
  </div>
</template>
<style scoped>
.my-button{
  margin: 40px 0px 0px 40px;
}
.main-content{
    text-align: center;
  }
</style>