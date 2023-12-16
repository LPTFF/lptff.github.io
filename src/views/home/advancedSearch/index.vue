<template>
  <div>
    <div class="search-common">
      <span class="search-title">限定关键词</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitKey"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-common">
      <span class="search-title">限定标题</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitTitle"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-common">
      <span class="search-title">限定内容关键字</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitContent"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-common">
      <span class="search-title">限定telegram关键词</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitTelegramKeyWordsWebsite"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-common">
      <span class="search-title">限定v2ex来源</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitV2exSourceWebsite"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-common">
      <span class="search-title">限定GitHub来源</span>
      <el-input
        v-model="findKeyWords"
        placeholder="你还什么都没输入哦"
        @keyup.enter="submitGitHubSourceWebsite"
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
        class="ml-2"
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
    const findKeyWords = ref("");
    const submitKey = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("submitKey", trimmedInput);
        let url = `https://www.google.com/search?q=%22${encodeURIComponent(
          trimmedInput
        )}%22&newwindow=1&sca_esv=583929409&sxsrf=AM9HkKlIEElwoDCc5zwouV7Ze8BsbcrNpQ:1700474180556&source=lnt&tbs=qdr:m&sa=X&ved=2ahUKEwjK9-z7p9KCAxVfke4BHRhlAAMQpwV6BAgBEBA&biw=1920&bih=931&dpr=1`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
    const submitTitle = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("submitTitle", trimmedInput);
        let url = `https://www.google.com/search?q=intitle%3A${encodeURIComponent(
          trimmedInput
        )}&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKm4zY2SZ2kSHrbu1kXJrWAYkJObTw%3A1700474237633&ei=fS1bZe-mJtPnkPIP_p61iAE&ved=0ahUKEwiv2YiXqNKCAxXTM0QIHX5PDREQ4dUDCBA&uact=5&oq=intitle%3A%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC&gs_lp=Egxnd3Mtd2l6LXNlcnAiFGludGl0bGU66Z2S6b6Z6ISa5pysSPteUMoHWNtYcAF4ApABAJgB1wKgAcQVqgEFMi05LjG4AQPIAQD4AQHCAgQQABhHwgIKECMYgAQYigUYJ8ICBBAjGCfCAgoQABiABBiKBRhDwgIFEAAYgATCAggQABiABBiiBOIDBBgAIEGIBgGQBgo&sclient=gws-wiz-serp`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };

    const submitContent = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("2333", trimmedInput);
        let url = `https://www.google.com/search?q=intext%3A${encodeURIComponent(
          trimmedInput
        )}&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKm4zY2SZ2kSHrbu1kXJrWAYkJObTw%3A1700474237633&ei=fS1bZe-mJtPnkPIP_p61iAE&ved=0ahUKEwiv2YiXqNKCAxXTM0QIHX5PDREQ4dUDCBA&uact=5&oq=intitle%3A%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC&gs_lp=Egxnd3Mtd2l6LXNlcnAiFGludGl0bGU66Z2S6b6Z6ISa5pysSPteUMoHWNtYcAF4ApABAJgB1wKgAcQVqgEFMi05LjG4AQPIAQD4AQHCAgQQABhHwgIKECMYgAQYigUYJ8ICBBAjGCfCAgoQABiABBiKBRhDwgIFEAAYgATCAggQABiABBiiBOIDBBgAIEGIBgGQBgo&sclient=gws-wiz-serp`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
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
    const submitTelegramKeyWordsWebsite = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("2333", trimmedInput);

        let url = `https://www.google.com/search?q=${encodeURIComponent(
          trimmedInput
        )}++inurl%3At.me&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKlAXizX6rJ8BLAR3lQm4I4aOZbGnQ%3A1700740893045&ei=HT9fZe6tApuN4-EP8IGb8Ac&ved=0ahUKEwiusKPGidqCAxWbxjgGHfDABn4Q4dUDCBA&uact=5&oq=%E8%B4%A6%E5%8F%B7%E6%89%B9%E5%8F%91++inurl%3At.me&gs_lp=Egxnd3Mtd2l6LXNlcnAiGOi0puWPt-aJueWPkSAgaW51cmw6dC5tZUiSI1D7Dlj8GXABeAGQAQCYAZoBoAGZCqoBAzAuObgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
    const submitV2exSourceWebsite = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("2333", trimmedInput);
        let url = `https://www.google.com/search?q=site:v2ex.com/t+${encodeURIComponent(
          trimmedInput
        )}&newwindow=1&sca_esv=581914905&sxsrf=AM9HkKmHk76oMnT8-gIP_y88N0m2pplZPQ:1699882201083&source=lnt&tbs=qdr:m&sa=X&ved=2ahUKEwiwrYXWisGCAxVbLTQIHdktAEsQpwV6BAgBEBA&biw=1920&bih=931&dpr=1`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
    const submitGitHubSourceWebsite = () => {
      const trimmedInput = findKeyWords.value.trim();
      if (trimmedInput.length > 0) {
        console.log("submitGitHubWebsite", trimmedInput);
        let url = `https://www.google.com/search?q=${encodeURIComponent(
          trimmedInput
        )}+site%3Agithub.com&newwindow=1&sca_esv=583929409&biw=1920&bih=931&tbs=qdr%3Am&sxsrf=AM9HkKkO7V2IJ5Ozp4j5EDuyuzBwn-ZMUA%3A1700478902629&ei=tj9bZaiBJrihkPIP9KiF4As&ved=0ahUKEwiotMHHudKCAxW4EEQIHXRUAbwQ4dUDCBA&uact=5&oq=%E9%9D%92%E9%BE%99%E8%84%9A%E6%9C%AC+site%3Agithub.com&gs_lp=Egxnd3Mtd2l6LXNlcnAiHOmdkum-meiEmuacrCBzaXRlOmdpdGh1Yi5jb21IxlxQpxFY6VZwAngBkAEAmAHAAqAB_RSqAQUyLTQuNbgBA8gBAPgBAcICChAAGEcY1gQYsAPiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp`;
        gotoOutPage(url);
      } else {
        console.log("Input is empty");
        findKeyWords.value = "";
      }
    };
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
      ],
      websiteTransformType,
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
</style>
