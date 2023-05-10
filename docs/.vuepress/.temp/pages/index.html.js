export const data = JSON.parse("{\"key\":\"v-8daa1a0e\",\"path\":\"/\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"heroImage\":\"/img/bg.jpg\",\"actions\":[{\"text\":\"求学笔记\",\"link\":\"/study/notebook/2018/underwaterRobots01.md\",\"type\":\"primary\"},{\"text\":\"短视频\",\"link\":\"/job/video/shortVideo.md\",\"type\":\"secondary\"},{\"text\":\"开发专区\",\"link\":\"/job/tools/test.md\",\"type\":\"secondary\"}],\"features\":[{\"title\":\"短视频\",\"details\":\"这里将是投放短视频的栏目。\"},{\"title\":\"求学笔记\",\"details\":\"一些求学生涯的笔记。\"},{\"title\":\"其他\",\"details\":\"杂七杂八的东西。\"}],\"footer\":\"MIT Licensed | Copyright © 2023 LPTFF\"},\"headers\":[],\"git\":{\"updatedTime\":1682408564000,\"contributors\":[{\"name\":\"LPTFF\",\"email\":\"lptffhh@gmail.com\",\"commits\":1}]},\"filePathRelative\":\"README.md\"}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
