<template>
  <div>
    <el-button
      type="primary"
      class="float-button"
      @click="handleDialogDrag"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="endDrag"
      ref="buttonRef"
      >悬浮按钮</el-button
    >
  </div>
</template>
<script lang="ts">
import { ref, onMounted, computed, reactive, toRefs } from "vue";
import { isPC, gotoOutPage } from "../utils/utils";
export default {
  data() {
    return {
      buttonPosition: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      isDragging: false,
    };
  },
  setup() {
    const callMethod = () => {
      // console.log('233');
    };
    const previousRoute = ref("");
    // 创建计算属性
    const isPCRes = computed(() => {
      return isPC();
    });
    onMounted(async () => {
      callMethod(); // 在组件挂载后调用方法
      previousRoute.value = window.history.state
        ? window.history.state.back
        : ""; //获取路由路径
    });
    return {
      callMethod,
      isPCRes,
      previousRoute,
    };
  },
  components: {},
  methods: {
    handleDialogDrag() {
      // 更新悬浮窗的位置
      console.log("handleDialogDrag 22333");
    },
    startDrag(event) {
      this.isDragging = true;
      console.log("startDrag event", event);
    },
    drag(event) {
      if (this.isDragging) {
        console.log("drag event", event);
      }
    },
    endDrag(event) {
      this.isDragging = false;
      console.log("endDrag event", event);
    },
  },
};
</script>
<style>
.float-button {
  position: fixed;
  top: 200px;
  right: 20px;
}
</style>