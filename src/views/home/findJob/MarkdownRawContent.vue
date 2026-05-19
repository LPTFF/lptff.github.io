<template>
  <div class="markdown-body" v-html="html"></div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export default defineComponent({
  name: "MarkdownRawContent",
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const html = computed(() => marked.parse(props.content) as string);
    return { html };
  },
});
</script>

<style scoped>
.markdown-body {
  line-height: 1.65;
  color: #303133;
  word-break: break-word;
}

.markdown-body :deep(h1) {
  font-size: 1.75rem;
  margin: 1.25rem 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #ebeef5;
}

.markdown-body :deep(h2) {
  font-size: 1.35rem;
  margin: 1.1rem 0 0.6rem;
}

.markdown-body :deep(h3) {
  font-size: 1.15rem;
  margin: 0.9rem 0 0.5rem;
}

.markdown-body :deep(p),
.markdown-body :deep(li) {
  margin: 0.35rem 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
}

.markdown-body :deep(pre) {
  background: rgb(205, 214, 231);
  padding: 10px 12px;
  overflow: auto;
  border-radius: 4px;
  margin: 0.75rem 0;
}

.markdown-body :deep(code) {
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 0.9em;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(:not(pre) > code) {
  background: #f4f4f5;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
}

.markdown-body :deep(blockquote) {
  margin: 0.75rem 0;
  padding-left: 12px;
  border-left: 4px solid #dcdfe6;
  color: #606266;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #ebeef5;
  margin: 1rem 0;
}
</style>
