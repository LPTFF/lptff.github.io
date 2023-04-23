<template>
  <div class="wrapper" @click="routePush('Life')">life</div>
  <div class="wrapper" @click="routePush('Job')">job</div>
</template>
<script >
import { useRouter } from "vue-router";
export default {
  data() {
    return {};
  },
  setup() {
    const route = useRouter();
    console.log("route", route);
    const goToOtherPage = (pageName, value) => {
      console.log("233", pageName, value);
      route.push({
        name: pageName,
        query: {
          value: value,
        },
      });
    };
    function routePush(pageName) {
      let value = "0";
      this.goToOtherPage(pageName, value);
    }
    return { route, routePush, goToOtherPage };
  },
};
</script>
<style scoped>
.wrapper {
  margin-top: 100px;
  font-size: 50px;
}
</style>
