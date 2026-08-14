<template>
  <el-tag :type="tagType" effect="plain" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { JudgmentStatus } from "../../../../investment/domain";

const props = defineProps<{ status: JudgmentStatus }>();

const MAP: Record<JudgmentStatus, { type: "success" | "warning" | "info" | "danger"; label: string }> = {
  VALID: { type: "success", label: "已判定" },
  PARTIAL: { type: "warning", label: "部分" },
  STALE: { type: "info", label: "陈旧" },
  INSUFFICIENT_DATA: { type: "warning", label: "证据不足" },
  FAILED: { type: "danger", label: "失败" },
  UNKNOWN: { type: "info", label: "未知" },
};

const tagType = computed(() => MAP[props.status]?.type ?? "info");
const label = computed(() => MAP[props.status]?.label ?? props.status);
</script>