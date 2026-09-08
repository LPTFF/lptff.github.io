<template>
  <span class="source-avatar">
    <img v-if="!failed" :src="src" :alt="alt" referrerpolicy="no-referrer" @error="failed = true" />
    <slot v-else />
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ src: string; alt: string; size?: number; fit?: string }>();
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>

<style scoped>
.source-avatar { display: inline-flex; overflow: hidden; vertical-align: middle; }
img { width: 100%; height: 100%; object-fit: contain; }
</style>
