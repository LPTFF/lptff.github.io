<template>
  <div>
    <ElTabs v-model="activeDoc" class="doc-tabs" @tab-change="handleTabChange">
      <ElTabPane label="全量知识树" name="full">
        <div v-loading="loading" class="all-content">
          <MarkdownRawContent v-if="fullMarkdown" :content="fullMarkdown" />
          <p v-else-if="!loading && !loadError" class="empty-tip">暂无内容</p>
        </div>
      </ElTabPane>
      <ElTabPane label="项目串联（Vue+React）" name="chain">
        <div v-loading="loading" class="all-content">
          <MarkdownRawContent v-if="chainMarkdown" :content="chainMarkdown" />
          <p v-else-if="!loading && !loadError" class="empty-tip">暂无内容</p>
        </div>
      </ElTabPane>
    </ElTabs>
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
import { ElTabs, ElTabPane, ElAlert, ElLoading } from "element-plus";
import MarkdownRawContent from "./MarkdownRawContent.vue";
import { SUMMARY_MD, fetchSummaryMarkdown } from "./loadSummaryMarkdown";

const DOC_TAB_STORAGE_KEY = "findJob-active-doc-tab";

export default defineComponent({
  directives: {
    loading: ElLoading.directive,
  },
  components: {
    ElTabs,
    ElTabPane,
    ElAlert,
    MarkdownRawContent,
  },
  setup() {
    const savedTab = sessionStorage.getItem(DOC_TAB_STORAGE_KEY);
    const activeDoc = ref(savedTab === "chain" || savedTab === "full" ? savedTab : "full");
    const loading = ref(true);
    const loadError = ref("");
    const fullMarkdown = ref("");
    const chainMarkdown = ref("");

    const handleTabChange = (name: string | number) => {
      if (name === "full" || name === "chain") {
        sessionStorage.setItem(DOC_TAB_STORAGE_KEY, String(name));
      }
    };

    onMounted(async () => {
      try {
        const [full, chain] = await Promise.all([
          fetchSummaryMarkdown(SUMMARY_MD.full),
          fetchSummaryMarkdown(SUMMARY_MD.chain),
        ]);
        fullMarkdown.value = full;
        chainMarkdown.value = chain;
      } catch (error) {
        loadError.value =
          error instanceof Error ? error.message : "八股文档加载失败";
      } finally {
        loading.value = false;
      }
    });

    return {
      activeDoc,
      handleTabChange,
      loading,
      loadError,
      fullMarkdown,
      chainMarkdown,
    };
  },
});
</script>

<style scoped>
.doc-tabs {
  margin-bottom: 8px;
}

.doc-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

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
