<template>
  <div class="home-head common-flex">
    <div class="common-evenly">
      <div class="title">tangff</div>
      <div class="options">
        <el-dropdown @command="handleCommand" @visible-change="handleClick">
          <span class="three-span-select">
            <div class="three-div-select">
              <div class="three-select">
                <el-icon color="#cccccc"><SemiSelect /></el-icon>
              </div>
              <div class="three-select">
                <el-icon color="#cccccc"><SemiSelect /></el-icon>
              </div>
              <div class="three-select">
                <el-icon color="#cccccc"><SemiSelect /></el-icon>
              </div>
            </div>
            <el-icon v-if="!selectIndex" color="#cccccc" class="caret-bottom"
              ><CaretRight
            /></el-icon>
            <el-icon v-if="selectIndex" color="#cccccc" class="caret-bottom"
              ><CaretBottom
            /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="a">求学笔记</el-dropdown-item>
              <el-dropdown-item command="b">学术网站</el-dropdown-item>
              <el-dropdown-item command="c">常用链接</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="vertical-line">
        <el-divider direction="vertical" color="#cccccc" />
      </div>
      <div class="el-search">
        <el-input
          v-model="input1"
          class="el-input-search"
          size="large"
          placeholder="Search article here..."
          :prefix-icon="Search"
        />
      </div>
    </div>
    <div class="common-flex">
      <div class="el-div-button">
        <el-button type="success" round>博客</el-button>
      </div>
      <div class="el-div-avatar">
        <el-avatar
          :size="50"
          src="https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg"
        />
      </div>
    </div>
  </div>
  <div class="body-content">
    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="首页" name="first">
        <div>
          <el-row>
            <el-col :span="24" :md="8" :lg="8" v-for="index in 13" :key="index">
              <el-card class="box-card" shadow="hover"> </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane label="电影" name="second">Config</el-tab-pane>
      <el-tab-pane label="题库" name="third">Role</el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
export default {
  data() {
    return {};
  },
  setup() {
    let selectIndex = ref(true);
    let input1 = ref("");
    const activeName = ref("first");
    const handleCommand = (command: string | number | object) => {
      ElMessage(`click on item ${command}`);
    };
    const handleClick = (type: any) => {
      selectIndex.value = type;
    };
    return {
      handleCommand,
      selectIndex,
      Plus,
      Search,
      input1,
      activeName,
      handleClick,
    };
  },
  components: {},
  methods: {},
};
</script>

<style scoped>
.el-right-card {
  margin-right: 64px;
}
.el-div-card {
  display: flex;
}
.box-card {
  /* width: 433px; */
  height: 482px;
  margin-bottom: 66px;
  border-radius: 4px;
  margin-right: 20px;
}
.home-head {
  height: 155px;
}
.common-flex {
  display: flex;
  justify-content: space-between;
}
.common-evenly {
  display: flex;
  justify-content: space-evenly;
}
.title {
  color: rgb(174, 209, 125);
  margin: 58px 0px 0px 247px;
  font-size: 30px;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  font-weight: 400;
  line-height: 21px;
}
.body-content {
  background: #f7f8fa;
  min-height: 800px;
}
.demo-tabs {
  padding: 77px 247px;
}
.options {
  margin: 60px 0px 0px 10px;
}
.three-select {
  height: 5px;
}
.three-span-select {
  display: flex;
}
.three-div-select {
  margin-top: -4px;
}
.caret-bottom {
  margin-left: 2px;
}
.vertical-line {
  margin: 50px 0 0 30px;
}
.el-search {
  margin: 49px 0px 0px 40px;
}
.el-input-search {
  width: 434px;
  height: 45px;
}
.el-div-button {
  margin: 53px 0px 0px 0px;
}
.el-div-avatar {
  margin: 40px 247px 0px 20px;
}
:deep(.el-input__wrapper) {
  border-radius: 30px;
}
:deep(.el-divider--vertical) {
  height: 3em;
}
:deep(.el-tabs__item) {
  color: #c8c9ca;
  font-size: 30px;
  margin-bottom: 20px;
  margin-right: 40px;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}
:deep(.el-tabs__item.is-active) {
  color: #454545;
}
:deep(.el-tabs__active-bar) {
  background-color: rgb(103, 194, 58);
}
</style>
;
