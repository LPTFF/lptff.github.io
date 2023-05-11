export const themeData = JSON.parse("{\"logo\":\"/img/myLogo.jpg\",\"locales\":{\"/\":{\"navbar\":[{\"text\":\"首页\",\"link\":\"/\"},{\"text\":\"工具区\",\"link\":\"/job/video/shortVideo.md\"},{\"text\":\"实验室\",\"link\":\"/job/tools/products.md\"},{\"text\":\"求学笔记\",\"children\":[{\"text\":\"2018\",\"link\":\"/study/notebook/2018/underwaterRobots01.md\"},{\"text\":\"2019\",\"link\":\"/study/notebook/2019/underwaterRobots02.md\"}]},{\"text\":\"Github\",\"link\":\"https://github.com/LPTFF/lptff.github.io\"}],\"sidebar\":{\"/study/\":[{\"text\":\"求学笔记\",\"collapsible\":true,\"children\":[{\"text\":\"2018\",\"collapsible\":true,\"children\":[\"/study/notebook/2018/underwaterRobots01.md\",\"/study/notebook/2018/autoDriveForMIT01.md\",\"/study/notebook/2018/autoDriveForMIT02.md\",\"/study/notebook/2018/autoDriveForMIT03.md\"]},{\"text\":\"2019\",\"collapsible\":true,\"children\":[\"/study/notebook/2019/underwaterRobots02.md\",\"/study/notebook/2019/autoDriveForMIT04.md\"]}]}],\"/job/\":[{\"text\":\"工具区\",\"children\":[\"/job/video/shortVideo.md\"]},{\"text\":\"实验室\",\"children\":[\"/job/tools/products.md\",\"/job/tools/test.md\",\"/job/tools/chatGPT.md\"]}]},\"editLinkText\":\"在 GitHub 上编辑此页\",\"notFound\":[\"这里什么都没有\",\"我们怎么到这来了？\",\"这是一个 404 页面\",\"看起来我们进入了错误的链接\"],\"backToHome\":\"返回首页\",\"lastUpdatedText\":\"上次更新\",\"contributorsText\":\"贡献者\",\"toggleColorMode\":\"切换颜色模式\",\"toggleSidebar\":\"切换侧边栏\",\"selectLanguageName\":\"English\"}},\"docsRepo\":\"https://github.com/LPTFF/lptff.github.io\",\"docsBranch\":\"master\",\"docsDir\":\"docs\",\"editLinkPattern\":\":repo/edit/:branch/:path\",\"colorMode\":\"auto\",\"colorModeSwitch\":true,\"navbar\":[],\"repo\":null,\"selectLanguageText\":\"Languages\",\"selectLanguageAriaLabel\":\"Select language\",\"sidebar\":\"auto\",\"sidebarDepth\":2,\"editLink\":true,\"editLinkText\":\"Edit this page\",\"lastUpdated\":true,\"lastUpdatedText\":\"Last Updated\",\"contributors\":true,\"contributorsText\":\"Contributors\",\"notFound\":[\"There's nothing here.\",\"How did we get here?\",\"That's a Four-Oh-Four.\",\"Looks like we've got some broken links.\"],\"backToHome\":\"Take me home\",\"openInNewWindow\":\"open in new window\",\"toggleColorMode\":\"toggle color mode\",\"toggleSidebar\":\"toggle sidebar\"}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateThemeData) {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ themeData }) => {
    __VUE_HMR_RUNTIME__.updateThemeData(themeData)
  })
}
