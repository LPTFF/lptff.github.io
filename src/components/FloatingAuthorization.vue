<template>
  <button ref="launcher" class="authorization-float" :class="{ dragging }" :style="position ? { left: position.x + 'px', top: position.y + 'px', bottom: 'auto' } : undefined"
    type="button" aria-label="打开全站授权与 AI" title="点击打开，拖动调整位置"
    @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag" @lostpointercapture="endDrag" @click="activate">授权与 AI</button>
  <el-drawer v-model="open" title="平台授权与本机 AI" size="min(780px, 100vw)" destroy-on-close>
    <AuthorizedCollection />
  </el-drawer>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import AuthorizedCollection from "../views/home/entertainment/component/AuthorizedCollection.vue";
const open = ref(false);
const launcher = ref<HTMLButtonElement>();
const position = ref<{ x: number; y: number }>();
const dragging = ref(false);
const positionKey = "lptff-authorization-position-v1";
let pointer: { id: number; x: number; y: number; left: number; top: number } | undefined;
let suppressClick = false;
function clampPosition(x: number, y: number) {
  const rect = launcher.value?.getBoundingClientRect();
  return { x: Math.max(8, Math.min(x, window.innerWidth - (rect?.width || 100) - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - (rect?.height || 44) - 8)) };
}
function keepInViewport() {
  if (position.value) position.value = clampPosition(position.value.x, position.value.y);
}
function startDrag(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  const rect = launcher.value!.getBoundingClientRect();
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
  suppressClick = false;
  launcher.value!.setPointerCapture(event.pointerId);
}
function moveDrag(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  if (!dragging.value && Math.hypot(dx, dy) < 5) return;
  dragging.value = true;
  suppressClick = true;
  position.value = clampPosition(pointer.left + dx, pointer.top + dy);
}
function endDrag(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const id = pointer.id;
  pointer = undefined;
  if (dragging.value) {
    try { localStorage.setItem(positionKey, JSON.stringify(position.value)); } catch { /* Moving still works without storage. */ }
  }
  dragging.value = false;
  if (launcher.value?.hasPointerCapture(id)) launcher.value.releasePointerCapture(id);
}
function activate(event: MouseEvent) {
  if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
  open.value = true;
}
const show = () => { open.value = true; };
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || "null");
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) position.value = clampPosition(saved.x, saved.y);
  } catch { /* Fall back to the initial position. */ }
  window.addEventListener("resize", keepInViewport);
  window.addEventListener("lptff-open-authorization", show);
});
onUnmounted(() => {
  window.removeEventListener("resize", keepInViewport);
  window.removeEventListener("lptff-open-authorization", show);
});
</script>
<style scoped>
.authorization-float { position: fixed; left: 20px; bottom: 22px; z-index: 2000; border: 1px solid #cbded3; border-radius: 24px; padding: 12px 18px; color: #17624f; background: #fff; box-shadow: 0 4px 18px #17382a20; cursor: grab; touch-action: none; user-select: none; }
.authorization-float.dragging { cursor: grabbing; }
.authorization-float:focus-visible { outline: 2px solid #17624f; outline-offset: 3px; }
</style>
