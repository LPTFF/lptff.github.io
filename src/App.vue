<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";

onMounted(async () => {
  if (localStorage.getItem("live2d-widget-enabled") !== "1") return;
  const { setupLive2d } = await import("./utils/live2d");
  setupLive2d();
});
</script>

<style scoped>
.logo-type {
  margin: 50px auto;
  width: 200px;
  height: 200px;
}
</style>
