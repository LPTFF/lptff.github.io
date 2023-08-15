<template>
  <div class="">
    <el-row>
      <el-col :span="24" :md="24" :lg="24" v-for="(item, sonIndex) in 10" :key="sonIndex">
        <el-card shadow="hover" class="welfare-card">
          <div>2333</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { gotoOutPage } from "../../../utils/utils";
import welfareSource from "../../../public/data/welfare.json";
import logoImageUrl from "../../../public/img/logo.jpg";
import { ElRow, ElCol, ElCard, ElIcon } from "element-plus";
export default {
  setup() {},
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElIcon,
  },
};
</script>
<style scoped>
.welfare-card {
  margin: 0px 0px 10px 0px;
}
</style>
