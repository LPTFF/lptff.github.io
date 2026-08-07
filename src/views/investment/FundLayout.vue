<template>
  <div class="fund-layout">
    <el-menu :default-active="activeIndex" mode="horizontal" router class="fund-menu">
      <el-menu-item index="/investment">资产总览</el-menu-item>
      <el-menu-item index="/investment/holding">持仓明细</el-menu-item>
      <el-menu-item index="/investment/performance">收益分析</el-menu-item>
      <el-menu-item index="/investment/transaction">交易流水</el-menu-item>
      <el-menu-item index="/investment/review">投资复盘</el-menu-item>
      <el-menu-item index="/investment/import">导入数据</el-menu-item>
    </el-menu>
    <div v-if="hasData" class="fund-meta">
      <el-tag type="info" effect="plain">更新时间：{{ data?.updateTime || "—" }}</el-tag>
      <el-button text type="primary" @click="goImport">重新导入</el-button>
      <el-button text type="danger" @click="onClear">清空数据</el-button>
    </div>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { RouterView, useRouter, useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { clearFundData, loadFundData } from "../../utils/fund/fund-storage";

const route = useRoute();
const router = useRouter();
const data = ref(loadFundData());
const hasData = computed(() => !!data.value);
const activeIndex = computed(() => route.path);

function refresh() {
  data.value = loadFundData();
}
watch(() => route.path, refresh);

// V2：扩展同步写入 localStorage 后会派发 lptff-fund-data-updated 事件。
// 收到后刷新数据；若用户停在导入页，自动跳到资产总览立即展示同步结果。
function onSynced() {
  refresh();
  if (route.path === "/investment/import") {
    router.push("/investment");
  }
}
onMounted(() => window.addEventListener("lptff-fund-data-updated", onSynced));
onUnmounted(() => window.removeEventListener("lptff-fund-data-updated", onSynced));

function goImport() {
  router.push("/investment/import");
}

async function onClear() {
  try {
    await ElMessageBox.confirm("确定要清空本地保存的基金数据吗？此操作不可恢复。", "清空确认", {
      type: "warning",
    });
    clearFundData();
    refresh();
    ElMessage.success("已清空");
    router.push("/investment/import");
  } catch {
    // 用户取消
  }
}

defineExpose({ refresh });
</script>

<style scoped>
.fund-layout {
  padding: 8px 0 32px;
}
.fund-menu {
  border-bottom: 1px solid var(--el-border-color);
}
.fund-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

@media screen and (max-width: 768px) {
  .fund-meta {
    flex-wrap: wrap;
  }
}
</style>