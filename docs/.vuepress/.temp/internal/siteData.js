export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"zh-CN\",\"title\":\"随风而逝\",\"description\":\"期待改变!\",\"head\":[[\"link\",{\"rel\":\"icon\",\"href\":\"https://cdn.jsdelivr.net/gh/LPTFF/lptff.github.io@gh-pages/img/logo.jpg\"}]],\"locales\":{}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
