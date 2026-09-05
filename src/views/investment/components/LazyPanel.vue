<template>
  <slot v-if="hasOpened" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ active: boolean }>();
const hasOpened = ref(props.active);

// 首次展开才创建折叠内容；之后由外层折叠控制显示，保留表单、筛选与表格实例。
watch(() => props.active, (active) => {
  if (active) hasOpened.value = true;
}, { flush: "sync" });
</script>
