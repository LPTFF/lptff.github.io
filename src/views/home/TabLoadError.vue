<template>
  <section class="tab-load-error" role="alert">
    <h2>栏目暂时无法加载</h2>
    <p>网站可能已更新，或网络连接暂时中断。请检查网络后刷新，继续查看当前栏目。</p>
    <button type="button" @click="refresh">刷新当前栏目</button>
  </section>
</template>

<script setup lang="ts">
const refresh = () => window.location.reload();
</script>

<style scoped>
.tab-load-error {
  padding: 32px 20px;
  text-align: center;
  color: #606266;
}
h2 {
  font-size: 20px;
  color: #303133;
}
p {
  line-height: 1.7;
}
button {
  padding: 10px 18px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #409eff;
  color: white;
  cursor: pointer;
  font: inherit;
}
button:focus-visible {
  outline: 2px solid #303133;
  outline-offset: 3px;
}
</style>
