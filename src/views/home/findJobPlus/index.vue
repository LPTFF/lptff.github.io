<template>
  <div>
    <div v-loading="loading" class="all-content">
      <MarkdownRawContent v-if="chainMarkdown" :content="chainMarkdown" />
      <p v-else-if="!loading && !loadError" class="empty-tip">暂无内容</p>
    </div>
    <ElAlert
      v-if="loadError"
      type="error"
      :title="loadError"
      show-icon
      :closable="false"
      class="load-error"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { ElAlert, ElLoading } from "element-plus";
import MarkdownRawContent from "../findJob/MarkdownRawContent.vue";
import { SUMMARY_MD, fetchSummaryMarkdown } from "../findJob/loadSummaryMarkdown";

export default defineComponent({
  directives: {
    loading: ElLoading.directive,
  },
  components: {
    ElAlert,
    MarkdownRawContent,
  },
  setup() {
    const loading = ref(true);
    const loadError = ref("");
    const chainMarkdown = ref("");

    onMounted(async () => {
      try {
        chainMarkdown.value = await fetchSummaryMarkdown(SUMMARY_MD.chain);
      } catch (error) {
        loadError.value =
          error instanceof Error ? error.message : "八股文档加载失败";
      } finally {
        loading.value = false;
      }
    });

    return { loading, loadError, chainMarkdown };
  },
});
</script>

<style scoped>
.all-content {
  margin-bottom: 40px;
  min-height: 120px;
}

.load-error {
  margin-top: 12px;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 24px 0;
}
</style>
