<template>
  <div>
    <div class="test">
      <el-button @click="handleDialogCancel">点击我测试</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import axios from "axios";
import { ElButton } from "element-plus";
export default {
  setup() {
    const handleDialogCancel = async () => {
      console.log(233);
      try {
        const response = await axios.get(
          "https://gcore.jsdelivr.net/gh/LPTFF/lptff.github.io@python-crawl/v2ex.json"
        );
        console.log("response.data;", response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    return {
      handleDialogCancel,
    };
  },
  components: {
    ElButton,
  },
};
</script>
<style scoped>
.test {
  text-align: center;
  margin-top: 200px;
}
</style>