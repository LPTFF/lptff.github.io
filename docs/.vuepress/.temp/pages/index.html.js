export const data = JSON.parse("{\"key\":\"v-8daa1a0e\",\"path\":\"/\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"heroImage\":\"/img/vue.svg\",\"actionText\":\"快速上手weqw\",\"actionLink\":\"/zh/`guide/\",\"features\":[{\"title\":\"短视频\",\"details\":\"这里将是投放短视频的栏目。\"},{\"title\":\"求学笔记\",\"details\":\"一些求学生涯的笔记。\"},{\"title\":\"其他\",\"details\":\"杂七杂八的东西。\"}],\"footer\":\"MIT Licensed | Copyright © 2023 LPTFF\"},\"headers\":[],\"git\":{\"updatedTime\":null,\"contributors\":[]},\"filePathRelative\":\"README.md\"}")

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
