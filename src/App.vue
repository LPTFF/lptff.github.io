<template>
  <img alt="Vue logo" src="./assets/logo.svg" class="logo-type" />
  <router-view />
</template>

<script>
export default {
  name: "App",
  components: {},
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
<style scoped>
.logo-type {
  margin: 50px auto;
  width: 200px;
  height: 200px;
}
</style>