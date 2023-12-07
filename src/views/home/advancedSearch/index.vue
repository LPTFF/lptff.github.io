<template>
  <div>
    <div class="search-common">
      <span class="search-title">Google </span>
      <el-input v-model="input" placeholder="你还什么都没输入哦" @keyup.enter="submit">
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="tips-common">
      <span class="tips-title">提示词</span>
      <el-tag v-for="(tag, index) in tags" :key="index" class="ml-2" :type="tag.type">{{
        tag.text
      }}</el-tag>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ElInput, ElIcon, ElTag } from "element-plus";
export default defineComponent({
  name: "App",
  setup() {
    const input = ref("");
    const submit = () => {
      const trimmedInput = input.value.trim();
      if (trimmedInput.length > 0) {
        console.log("2333", trimmedInput);
      } else {
        console.log("Input is empty");
        input.value = "";
      }
    };
    return {
      input,
      submit,
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
}
.search-title {
  /* color: rgb(44, 62, 80); */
  color: white;
  font-weight: 600;
  font-size: 21px;
  margin-right: 20px;
  margin-left: 20px;
  background: linear-gradient(to right, rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255));
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
