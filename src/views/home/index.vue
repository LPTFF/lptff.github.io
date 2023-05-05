<template>
  <div class="theme-container">
    <slot name="navbar">
      <Navbar >
        <template #before>
          <slot name="navbar-before" />
        </template>
        <template #after>
          <slot name="navbar-after" />
        </template>
      </Navbar>
    </slot>
  </div>
</template>
<script lang="ts" >
import { useRouter } from "vue-router";
import Navbar from '../blobTheme/Navbar.vue'
export default {
  data() {
    return {
      sites: [{ text: "Google" }, { text: "Runoob" }, { text: "Taobao" }],
    };
  },
  components: {Navbar},
  setup() {
    const route = useRouter();
    console.log("route", route);
    const goToOtherPage = (pageName: string, value: string) => {
      console.log("233", pageName, value);
      route.push({
        name: pageName,
        query: {
          value: value,
        },
      });
    };
    function routePush(this: any, pageName: string) {
      let value = "0";
      this.goToOtherPage(pageName, value);
    }
    return { route, routePush, goToOtherPage };
  },
};
</script>
<style scoped>
.header-bg {
  background: linear-gradient(
    to right,
    rgb(83, 168, 255),
    rgb(217, 236, 255)
  ) !important;
  font-family: PingFang SC;
  color: #fff !important;
  font-size: 3vw;
}
.icon-div {
  width: 20px;
  height: 20px;
  margin: auto;
}
.aside-list {
  display: flex;
  justify-content: space-between;
}
.aside-div {
  width: 100px !important;
}
.aside-des {
  margin: 0px 10px;
}
</style>
<style scoped>
.el-header,
.el-footer {
  background-color: #b3c0d1;
  color: #333;
  text-align: center;
  line-height: 60px;
}
.el-aside {
  background-color: #d3dce6;
  color: #333;
  text-align: center;
  line-height: 200px;
}
.el-main {
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  line-height: 160px;
}
body > .el-container {
  margin-bottom: 40px;
}
.el-container:nth-child(5) .el-aside,
.el-container:nth-child(6) .el-aside {
  line-height: 260px;
}
.el-container:nth-child(7) .el-aside {
  line-height: 320px;
}
</style>
