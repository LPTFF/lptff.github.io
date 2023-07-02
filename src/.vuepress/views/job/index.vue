<template>
  <div class="page">
    <div class="group">
      <div class="block">
        <img class="vertical-line" src="./images/img_0.png" />
        <div class="container">
          <span class="works">WORKS</span>
          <div class="wrapper">
            <div class="empty"></div>
            <div class="group-1">
              <img class="vertical-line-1" src="./images/img_1.png" />
              <span class="about">ABOUT</span>
            </div>
          </div>
        </div>
        <div class="container-item-0">
          <img class="vertical-line-2" src="./images/img_2.png" />
        </div>
        <div class="container-item-1">
          <img class="vertical-line-3" src="./images/img_3.png" />
        </div>
        <div class="container-1">
          <img class="vertical-line-4" src="./images/img_4.png" />
          <div class="wrapper-1">
            <div class="group-2">
              <div class="view">
                <img class="icon" src="./images/img_5.png" />
              </div>
            </div>
            <span class="title">ce</span>
          </div>
        </div>
        <div class="container-item-2">
          <img class="vertical-line-5" src="./images/img_6.png" />
        </div>
        <span class="info">Personal web design exercises</span>
        <div class="container-item-3">
          <img class="vertical-line-6" src="./images/img_7.png" />
        </div>
        <span class="caption">设计师个人博客</span>
        <div class="container-2">
          <img class="vertical-line-7" src="./images/img_8.png" />
          <span class="web">WEB</span>
        </div>
        <span class="info-1">for your referen</span>
        <div class="container-3">
          <img class="vertical-line-8" src="./images/img_9.png" />
          <div class="wrapper-2">
            <span class="desig">DESIG</span>
            <span class="tag">N</span>
          </div>
        </div>
      </div>
      <img class="vertical-line-9" src="./images/img_10.png" />
      <div class="long-banner">
        <!-- <components></components> -->
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import components from "./components/index.vue";
export default {
  data() {
    return {};
  },
  setup() {},
  components: {
    components,
  },
  methods: {},
};
</script>

<style scoped>
.page {
  width: 1120px;
  height: 760px;
  font-family: HarmonyOS_Sans_SC_Bold;
}
.page .group {
  display: flex;
  position: relative;
  align-items: center;
  background-color: #f5f5f5;
  width: 1120px;
  height: 760px;
}
.page .block {
  display: flex;
  position: absolute;
  top: -10px;
  left: 59px;
  align-items: center;
}
.page .vertical-line {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 1px;
  height: 781px;
}
.page .container {
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  margin-right: 1px;
  width: 225px;
}
.page .works {
  margin-top: 63px;
  margin-right: 23px;
  letter-spacing: 3px;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
}
.page .wrapper {
  display: flex;
  align-items: center;
}
.page .empty {
  margin-right: 1px;
  width: 0px;
  height: 781px;
}
.page .group-1 {
  display: flex;
  align-items: flex-start;
}
.page .vertical-line-1 {
  margin-right: 17px;
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .about {
  margin-top: 63px;
  line-height: 20px;
  letter-spacing: 3px;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
}
.page .container-item-0 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-2 {
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .container-item-1 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-3 {
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .container-1 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-4 {
  margin-right: 21px;
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .wrapper-1 {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-top: 73px;
}
.page .group-2 {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  border-radius: 16.64px;
  background-color: #1a1919;
  width: 64px;
  height: 64px;
}
.page .view {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: -1px;
  width: 32px;
}
.page .icon {
  margin-top: 1px;
  width: 31px;
  height: 26px;
}
.page .title {
  position: relative;
  margin-top: 181px;
  max-width: 52px;
  height: 33px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 33px;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.5);
  font-family: HarmonyOS_Sans_SC;
  font-size: 28px;
}
.page .container-item-2 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-5 {
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .info {
  position: absolute;
  top: 285px;
  left: 193px;
  line-height: 33px;
  white-space: pre;
  color: rgba(0, 0, 0, 0.5);
  font-family: HarmonyOS_Sans_SC;
  font-size: 28px;
}
.page .container-item-3 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-6 {
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .caption {
  position: absolute;
  top: 153px;
  left: 221px;
  line-height: 116px;
  white-space: nowrap;
  color: #000000;
  font-family: SourceHanSansCN-Heavy;
  font-size: 80px;
}
.page .container-2 {
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-right: 1px;
  width: 110px;
}
.page .vertical-line-7 {
  margin-right: 34px;
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .web {
  margin-top: 63px;
  line-height: 20px;
  letter-spacing: 3px;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
}
.page .info-1 {
  position: absolute;
  top: 285px;
  right: 193px;
  line-height: 33px;
  white-space: pre;
  color: rgba(0, 0, 0, 0.5);
  font-family: HarmonyOS_Sans_SC;
  font-size: 28px;
}
.page .container-3 {
  display: flex;
  position: relative;
  align-items: flex-start;
  width: 110px;
}
.page .vertical-line-8 {
  margin-right: 23px;
  margin-left: -1px;
  width: 1px;
  height: 781px;
}
.page .wrapper-2 {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-top: 63px;
  line-height: 20px;
  white-space: nowrap;
}
.page .desig {
  position: relative;
  letter-spacing: 3px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
}
.page .tag {
  position: relative;
  max-width: 49px;
  height: 19px;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 3px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 16px;
}
.page .vertical-line-9 {
  position: absolute;
  top: -10px;
  right: 58px;
  width: 1px;
  height: 782px;
}
.page .long-banner {
  position: absolute;
  top: 364px;
  left: 70px;
  width: 980px;
  height: 2357px;
}
</style>
;
