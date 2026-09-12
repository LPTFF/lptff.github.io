<template>
  <button class="authorization-float" type="button" aria-label="打开全站授权与 AI" @click="open = true">授权与 AI</button>
  <el-drawer v-model="open" title="平台授权与本机 AI" size="min(780px, 100vw)" destroy-on-close>
    <AuthorizedCollection />
  </el-drawer>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import AuthorizedCollection from "../views/home/entertainment/component/AuthorizedCollection.vue";
const open = ref(false);
const show = () => { open.value = true; };
onMounted(() => window.addEventListener("lptff-open-authorization", show));
onUnmounted(() => window.removeEventListener("lptff-open-authorization", show));
</script>
<style scoped>
.authorization-float { position: fixed; left: 20px; bottom: 22px; z-index: 2000; border: 1px solid #cbded3; border-radius: 24px; padding: 12px 18px; color: #17624f; background: #fff; box-shadow: 0 4px 18px #17382a20; cursor: pointer; }
.authorization-float:focus-visible { outline: 2px solid #17624f; outline-offset: 3px; }
</style>
