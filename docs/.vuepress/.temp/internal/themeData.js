export const themeData = JSON.parse("{\"logo\":\"/img/vue.svg\",\"locales\":{\"/\":{\"navbar\":[{\"text\":\"短视频\",\"link\":\"/job/video/shortVideo.md\"},{\"text\":\"求学笔记\",\"children\":[{\"text\":\"2018\",\"link\":\"/study/notebook/2018/underwaterRobots01.md\"},{\"text\":\"2019\",\"link\":\"/study/notebook/2019/AI应用之水下机器人02.md\"}]},{\"text\":\"工具区\",\"link\":\"/job/tools/products.md\"},{\"text\":\"Github\",\"link\":\"https://github.com/LPTFF/lptff.github.io\"}],\"sidebar\":[{\"text\":\"求学笔记\",\"collapsible\":true,\"children\":[{\"text\":\"2018\",\"collapsible\":true,\"children\":[{\"text\":\"水下机器人研究01\",\"link\":\"/study/notebook/2018/underwaterRobots01.md\"},{\"text\":\"无人驾驶麻省理工01讲\",\"link\":\"/study/notebook/2018/autoDriveForMIT01.md\"},{\"text\":\"无人驾驶麻省理工02讲\",\"link\":\"/study/notebook/2018/autoDriveForMIT02.md\"},{\"text\":\"无人驾驶麻省理工03讲\",\"link\":\"/study/notebook/2018/autoDriveForMIT03.md\"}]},{\"text\":\"2019\",\"collapsible\":true,\"children\":[{\"text\":\"AI应用之水下机器人02\",\"link\":\"/study/notebook/2019/underwaterRobots02.md\"},{\"text\":\"无人驾驶麻省理工04讲\",\"link\":\"/study/notebook/2019/autoDriveForMIT04.md\"}]}]},{\"text\":\"短视频\",\"link\":\"/job/video/shortVideo.md\"},{\"text\":\"工具区\",\"children\":[{\"text\":\"产品\",\"link\":\"/job/tools/products.md\"},{\"text\":\"测试\",\"link\":\"/job/tools/test.md\"}]},{\"text\":\"12tall博客\",\"link\":\"https://12tall.cn/intro.html\"}],\"editLinkText\":\"在 GitHub 上编辑此页\",\"notFound\":[\"这里什么都没有\",\"我们怎么到这来了？\",\"这是一个 404 页面\",\"看起来我们进入了错误的链接\"],\"backToHome\":\"返回首页\",\"lastUpdatedText\":\"上次更新\",\"contributorsText\":\"贡献者\",\"toggleColorMode\":\"切换颜色模式\",\"toggleSidebar\":\"切换侧边栏\",\"selectLanguageName\":\"English\"}},\"colorMode\":\"auto\",\"colorModeSwitch\":true,\"navbar\":[],\"repo\":null,\"selectLanguageText\":\"Languages\",\"selectLanguageAriaLabel\":\"Select language\",\"sidebar\":\"auto\",\"sidebarDepth\":2,\"editLink\":true,\"editLinkText\":\"Edit this page\",\"lastUpdated\":true,\"lastUpdatedText\":\"Last Updated\",\"contributors\":true,\"contributorsText\":\"Contributors\",\"notFound\":[\"There's nothing here.\",\"How did we get here?\",\"That's a Four-Oh-Four.\",\"Looks like we've got some broken links.\"],\"backToHome\":\"Take me home\",\"openInNewWindow\":\"open in new window\",\"toggleColorMode\":\"toggle color mode\",\"toggleSidebar\":\"toggle sidebar\"}")

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
