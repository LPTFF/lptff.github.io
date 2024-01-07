<template>
  <div>
    <div class="search-common" v-for="search in searches" :key="search.key">
      <span class="search-title">{{ search.title }}</span>
      <el-input
        v-model="search.model"
        :placeholder="search.placeholder"
        @keyup.enter="search.action"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="tips-common">
      <span class="tips-title">提示词</span>
      <el-tag
        v-for="(tag, index) in tags"
        :key="index"
        class="ml-2 tag-common"
        :type="websiteTransformType(tag.type)"
        >{{ tag.text }}</el-tag
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ElInput, ElIcon, ElTag } from "element-plus";
import { gotoOutPage } from "../../../utils/utils";
enum WebsiteType {
  Success = "success",
  Warning = "warning",
  Danger = "danger",
  Info = "info",
  Default = "",
}
export default defineComponent({
  name: "App",
  setup() {
    const websiteTransformType = (type: any) => {
      switch (type) {
        case "success":
          return WebsiteType.Success;
        case "warning":
          return WebsiteType.Warning;
        case "danger":
          return WebsiteType.Danger;
        case "info":
          return WebsiteType.Info;
        default:
          return WebsiteType.Default; // 默认类型
      }
    };
    const findKeyWords = ref("");
    const submitSearch = (baseUrl: any, siteQuery: any) => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("Search input:", trimmedInput);
        let url = `${baseUrl}${encodeURIComponent(trimmedInput)}${siteQuery}`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
    const baseUrl = "https://www.google.com/search?q=";
    const submitKey = () => {
      const submitKeyUrl = baseUrl + "%22";
      const siteQuery =
        "%22&newwindow=1&sca_esv=583929409&sxsrf=AM9HkKlIEElwoDCc5zwouV7Ze8BsbcrNpQ:1700474180556&source=lnt&tbs=qdr:m&sa=X&ved=2ahUKEwjK9-z7p9KCAxVfke4BHRhlAAMQpwV6BAgBEBA&biw=1920&bih=931&dpr=1";
      submitSearch(submitKeyUrl, siteQuery);
    };
    const submitTitle = () => {
      const submitTitleUrl = baseUrl + "intitle%3A";
      const siteQuery =
        "&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKm4zY2SZ2kSHrbu1kXJrWAYkJObTw%3A1700474237633&ei=fS1bZe-mJtPnkPIP_p61iAE&ved=0ahUKEwiv2YiXqNKCAxXTM0QIHX5PDREQ4dUDCBA&uact=5&oq=intitle%3A%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC&gs_lp=Egxnd3Mtd2l6LXNlcnAiFGludGl0bGU66Z2S6b6Z6ISa5pysSPteUMoHWNtYcAF4ApABAJgB1wKgAcQVqgEFMi05LjG4AQPIAQD4AQHCAgQQABhHwgIKECMYgAQYigUYJ8ICBBAjGCfCAgoQABiABBiKBRhDwgIFEAAYgATCAggQABiABBiiBOIDBBgAIEGIBgGQBgo&sclient=gws-wiz-serp";
      submitSearch(submitTitleUrl, siteQuery);
    };
    const submitContent = () => {
      const submitContentUrl = baseUrl + "intext%3A";
      const siteQuery =
        "&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKm4zY2SZ2kSHrbu1kXJrWAYkJObTw%3A1700474237633&ei=fS1bZe-mJtPnkPIP_p61iAE&ved=0ahUKEwiv2YiXqNKCAxXTM0QIHX5PDREQ4dUDCBA&uact=5&oq=intitle%3A%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC&gs_lp=Egxnd3Mtd2l6LXNlcnAiFGludGl0bGU66Z2S6b6Z6ISa5pysSPteUMoHWNtYcAF4ApABAJgB1wKgAcQVqgEFMi05LjG4AQPIAQD4AQHCAgQQABhHwgIKECMYgAQYigUYJ8ICBBAjGCfCAgoQABiABBiKBRhDwgIFEAAYgATCAggQABiABBiiBOIDBBgAIEGIBgGQBgo&sclient=gws-wiz-serp";
      submitSearch(submitContentUrl, siteQuery);
    };
    const submitTelegramKeyWordsWebsite = () => {
      const siteQuery =
        "+inurl%3At.me&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKlAXizX6rJ8BLAR3lQm4I4aOZbGnQ%3A1700740893045&ei=HT9fZe6tApuN4-EP8IGb8Ac&ved=0ahUKEwiusKPGidqCAxWbxjgGHfDABn4Q4dUDCBA&uact=5&oq=%E8%B4%A6%E5%8F%B7%E6%89%B9%E5%8F%91++inurl%3At.me&gs_lp=Egxnd3Mtd2l6LXNlcnAiGOi0puWPt-aJueWPkSAgaW51cmw6dC5tZUiSI1D7Dlj8GXABeAGQAQCYAZoBoAGZCqoBAzAuObgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const submitTelegramSourcesWebsite = () => {
      const siteQuery =
        "+site%3At.me&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKlAXizX6rJ8BLAR3lQm4I4aOZbGnQ%3A1700740893045&ei=HT9fZe6tApuN4-EP8IGb8Ac&ved=0ahUKEwiusKPGidqCAxWbxjgGHfDABn4Q4dUDCBA&uact=5&oq=%E8%B4%A6%E5%8F%B7%E6%89%B9%E5%8F%91++inurl%3At.me&gs_lp=Egxnd3Mtd2l6LXNlcnAiGOi0puWPt-aJueWPkSAgaW51cmw6dC5tZUiSI1D7Dlj8GXABeAGQAQCYAZoBoAGZCqoBAzAuObgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const submitV2exKeyWordsWebsite = () => {
      const siteQuery =
        "+inurl%3Av2ex.com&newwindow=1&sca_esv=581914905&sxsrf=AM9HkKmHk76oMnT8-gIP_y88N0m2pplZPQ:1699882201083&source=lnt&tbs=qdr:m&sa=X&ved=2ahUKEwiwrYXWisGCAxVbLTQIHdktAEsQpwV6BAgBEBA&biw=1920&bih=931&dpr=1";
      submitSearch(baseUrl, siteQuery);
    };
    const submitV2exSourceWebsite = () => {
      const siteQuery =
        "+site%3Av2ex.com&newwindow=1&sca_esv=581914905&sxsrf=AM9HkKmHk76oMnT8-gIP_y88N0m2pplZPQ:1699882201083&source=lnt&tbs=qdr:m&sa=X&ved=2ahUKEwiwrYXWisGCAxVbLTQIHdktAEsQpwV6BAgBEBA&biw=1920&bih=931&dpr=1";
      submitSearch(baseUrl, siteQuery);
    };
    const submitGitHubKeyWordsWebsite = () => {
      const siteQuery =
        "+inurl%3Agithub.com&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKkO7V2IJ5Ozp4j5EDuyuzBwn-ZMUA%3A1700478902629&ei=tj9bZaiBJrihkPIP9KiF4As&ved=0ahUKEwiotMHHudKCAxW4EEQIHXRUAbwQ4dUDCBA&uact=5&oq=%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC+site%3Agithub.com&gs_lp=Egxnd3Mtd2l6LXNlcnAiHOmdkum-meiEmuacrCBzaXRlOmdpdGh1Yi5jb21IxlxQpxFY6VZwAngBkAEAmAHAAqAB_RSqAQUyLTQuNbgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const submitGitHubSourceWebsite = () => {
      const siteQuery =
        "+site%3Agithub.com&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKkO7V2IJ5Ozp4j5EDuyuzBwn-ZMUA%3A1700478902629&ei=tj9bZaiBJrihkPIP9KiF4As&ved=0ahUKEwiotMHHudKCAxW4EEQIHXRUAbwQ4dUDCBA&uact=5&oq=%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC+site%3Agithub.com&gs_lp=Egxnd3Mtd2l6LXNlcnAiHOmdkum-meiEmuacrCBzaXRlOmdpdGh1Yi5jb21IxlxQpxFY6VZwAngBkAEAmAHAAqAB_RSqAQUyLTQuNbgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const submitZhihuKeyWordsWebsite = () => {
      const siteQuery =
        "+inurl%3Azhihu.com&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKkO7V2IJ5Ozp4j5EDuyuzBwn-ZMUA%3A1700478902629&ei=tj9bZaiBJrihkPIP9KiF4As&ved=0ahUKEwiotMHHudKCAxW4EEQIHXRUAbwQ4dUDCBA&uact=5&oq=%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC+site%3Agithub.com&gs_lp=Egxnd3Mtd2l6LXNlcnAiHOmdkum-meiEmuacrCBzaXRlOmdpdGh1Yi5jb21IxlxQpxFY6VZwAngBkAEAmAHAAqAB_RSqAQUyLTQuNbgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const submitZhihuSourceWebsite = () => {
      const siteQuery =
        "+site%3Azhihu.com&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKkO7V2IJ5Ozp4j5EDuyuzBwn-ZMUA%3A1700478902629&ei=tj9bZaiBJrihkPIP9KiF4As&ved=0ahUKEwiotMHHudKCAxW4EEQIHXRUAbwQ4dUDCBA&uact=5&oq=%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC+site%3Agithub.com&gs_lp=Egxnd3Mtd2l6LXNlcnAiHOmdkum-meiEmuacrCBzaXRlOmdpdGh1Yi5jb21IxlxQpxFY6VZwAngBkAEAmAHAAqAB_RSqAQUyLTQuNbgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp";
      submitSearch(baseUrl, siteQuery);
    };
    const searches = ref([
      {
        key: "keyword",
        title: "限定关键词",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitKey,
      },
      {
        key: "title",
        title: "限定标题",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitTitle,
      },
      {
        key: "content",
        title: "限定内容关键字",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitContent,
      },
      {
        key: "telegram",
        title: "限定telegram关键词",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitTelegramKeyWordsWebsite,
      },
      {
        key: "telegram",
        title: "限定telegram来源",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitTelegramSourcesWebsite,
      },
      {
        key: "v2ex",
        title: "限定v2ex关键词",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitV2exKeyWordsWebsite,
      },
      {
        key: "v2ex",
        title: "限定v2ex来源",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitV2exSourceWebsite,
      },
      {
        key: "GitHub",
        title: "限定GitHub关键词",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitGitHubKeyWordsWebsite,
      },
      {
        key: "GitHub",
        title: "限定GitHub来源",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitGitHubSourceWebsite,
      },
      {
        key: "Zhihu",
        title: "限定知乎关键词",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitZhihuKeyWordsWebsite,
      },
      {
        key: "GitHub",
        title: "限定知乎来源",
        model: findKeyWords,
        placeholder: "你还什么都没输入哦",
        action: submitZhihuSourceWebsite,
      },
    ]);
    return {
      findKeyWords,
      submitKey,
      submitTitle,
      submitContent,
      submitTelegramKeyWordsWebsite,
      submitV2exSourceWebsite,
      submitGitHubSourceWebsite,
      tags: [
        { text: "青龙", type: "success" },
        { text: "微信账号", type: "info" },
        { text: "基金", type: "warning" },
        { text: "安卓逆向", type: "danger" },
        { text: "web逆向", type: "success" },
        { text: "安卓root", type: "info" },
        { text: "抓包", type: "warning" },
        { text: "代理人抓包", type: "danger" },
        { text: "微信账号批发", type: "info" },
        { text: "青龙脚本", type: "warning" },
        { text: "JS逆向", type: "danger" },
        { text: "黑产大数据", type: "info" },
        { text: "黑客新闻", type: "warning" },
        { text: "加密", type: "danger" },
        { text: "安卓app脱壳", type: "success" },
        { text: "jadx-gui工具", type: "info" },
        { text: "apktool工具", type: "warning" },
        { text: "android sdk工具", type: "danger" },
        { text: "小肩膀零基础一站式安卓逆向教程", type: "success" },
        { text: "41期科锐逆向", type: "info" },
        { text: "滴水逆向", type: "warning" },
      ],
      websiteTransformType,
      searches,
    };
  },
  components: {
    ElInput,
    ElIcon,
    ElTag,
  },
});
</script>
<style scoped>
.search-common {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.search-title {
  /* color: rgb(44, 62, 80); */
  color: white;
  font-weight: 600;
  font-size: 21px;
  margin-right: 20px;
  margin-left: 20px;
  background: linear-gradient(to right, rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255));
  min-width: 250px;
}
.ml-2 {
  margin: 0 10px;
}
.tips-common {
  margin-left: 20px;
  margin-top: 10px;
}
.tips-title {
  /* margin-right: 40px; */
  margin-right: 24px;
  color: rgb(44, 62, 80);
  font-weight: 600;
  font-size: 21px;
}
.tag-common {
  margin-bottom: 10px;
}
</style>
