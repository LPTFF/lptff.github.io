<template>
  <div class="wrapper" @click="routePush">life</div>
</template>
<script  lang="ts" >
import { useRouter } from "vue-router";
export default {
  data() {
    return {};
  },
  setup() {
    const route = useRouter();
    console.log("route", route);
    const goToOtherPage = (pageName: string, value: string) => {
      console.log("233");
      route.push({
        name: pageName,
        query: {
          value: value,
        },
      });
    };
    function routePush(this: any) {
      let pageName = "Job";
      let value = "0";
      this.goToOtherPage(pageName, value);
    }
    return { route, routePush, goToOtherPage };
  },
};
</script>
<style scoped>
.wrapper {
  font-size: 50px;
}
</style>
