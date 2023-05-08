export const themeData = JSON.parse("{\"locales\":{\"/\":{\"navbar\":[{\"text\":\"介绍\",\"link\":\"/document/introduction\"},{\"text\":\"求学笔记\",\"children\":[{\"text\":\"2018\",\"link\":\"/document/tips/1.md\"},{\"text\":\"2019\",\"link\":\"/document/tips/2.md\"}]},{\"text\":\"Github\",\"link\":\"https://github.com/LPTFF/lptff.github.io\"}],\"sidebar\":[{\"text\":\"Foo\",\"link\":\"/foo/\"}],\"editLinkText\":\"Edit this page on GitHub\",\"notFound\":[\"这里什么都没有\",\"我们怎么到这来了？\",\"这是一个 404 页面\",\"看起来我们进入了错误的链接\"],\"backToHome\":\"返回首页\",\"lastUpdatedText\":\"上次更新\",\"contributorsText\":\"贡献者\",\"toggleColorMode\":\"切换颜色模式\",\"toggleSidebar\":\"切换侧边栏\",\"selectLanguageName\":\"English\"}},\"colorMode\":\"auto\",\"colorModeSwitch\":true,\"navbar\":[],\"logo\":null,\"repo\":null,\"selectLanguageText\":\"Languages\",\"selectLanguageAriaLabel\":\"Select language\",\"sidebar\":\"auto\",\"sidebarDepth\":2,\"editLink\":true,\"editLinkText\":\"Edit this page\",\"lastUpdated\":true,\"lastUpdatedText\":\"Last Updated\",\"contributors\":true,\"contributorsText\":\"Contributors\",\"notFound\":[\"There's nothing here.\",\"How did we get here?\",\"That's a Four-Oh-Four.\",\"Looks like we've got some broken links.\"],\"backToHome\":\"Take me home\",\"openInNewWindow\":\"open in new window\",\"toggleColorMode\":\"toggle color mode\",\"toggleSidebar\":\"toggle sidebar\"}")

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
