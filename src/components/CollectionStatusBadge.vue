<template>
  <span v-if="status && status.state !== 'fresh'" class="collection-status-badge" :data-state="status.state" :title="status.label + '；点击来源查看更新操作'">
    <span aria-hidden="true">{{ icon }}</span>{{ label }}
  </span>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ status?: { state: string; label: string } }>();
const label = computed(() => ({ stale: "待更新", soon: "即将过期", unknown: "待确认", failed: "需重试", running: "采集中", ready: "可载入" }[props.status?.state || ""] || "待确认"));
const icon = computed(() => ({ running: "↻", ready: "↓" }[props.status?.state || ""] || "!"));
</script>
<style scoped>
.collection-status-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border: 1px solid #ebcc8c; border-radius: 5px; background: #fff4da; color: #855006; font-size: 11px; line-height: 1.4; white-space: nowrap; }
.collection-status-badge[data-state="failed"] { color: #a12d29; background: #fff0ee; border-color: #edb8b4; }
.collection-status-badge[data-state="running"], .collection-status-badge[data-state="ready"] { color: #245f9e; background: #edf5ff; border-color: #b4cfee; }
.collection-status-badge span { font-weight: 800; }
</style>
