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
import { ref, onMounted, computed } from "vue";
import { isPC } from "../utils/utils.js";
import { ElButton } from "element-plus";

export default {
  setup() {
    const buttonPosition = ref({ x: 0, y: 0 });
    const dragOffset = ref({ x: 0, y: 0 });
    const isDragging = ref(false);

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
      previousRoute.value = window.history.state ? window.history.state.back : ""; //获取路由路径
    });

    const handleDialogDrag = () => {
      // 更新悬浮窗的位置
      console.log("handleDialogDrag 22333");
    };

    const startDrag = (event: MouseEvent) => {
      isDragging.value = true;
      console.log("startDrag event", event);
    };

    const drag = (event: MouseEvent) => {
      if (isDragging.value) {
        console.log("drag event", event);
      }
    };

    const endDrag = (event: MouseEvent) => {
      isDragging.value = false;
      console.log("endDrag event", event);
    };

    return {
      callMethod,
      isPCRes,
      previousRoute,
      buttonPosition,
      dragOffset,
      isDragging,
      handleDialogDrag,
      startDrag,
      drag,
      endDrag,
    };
  },
  components: {
    ElButton,
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
