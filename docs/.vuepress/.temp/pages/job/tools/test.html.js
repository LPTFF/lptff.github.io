export const data = JSON.parse("{\"key\":\"v-e47a6330\",\"path\":\"/job/tools/test.html\",\"title\":\"测试\",\"lang\":\"zh-CN\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1683793317000,\"contributors\":[{\"name\":\"LPTFF\",\"email\":\"lptffhh@gmail.com\",\"commits\":4}]},\"filePathRelative\":\"job/tools/test.md\"}")

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
