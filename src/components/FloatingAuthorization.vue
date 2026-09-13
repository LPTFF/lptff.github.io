<template>
  <button
    ref="launcher"
    class="authorization-float devtools-float"
    :class="{ dragging }"
    :style="position ? { left: position.x + 'px', top: position.y + 'px', bottom: 'auto' } : undefined"
    type="button"
    aria-label="打开开发者小工具"
    title="开发者小工具（点击打开，拖动调整位置）"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @lostpointercapture="endDrag"
    @click="activate"
  >
    <span class="float-icon">🛠️</span>
    <span class="float-text">开发者小工具</span>
  </button>

  <el-drawer
    v-model="open"
    size="min(800px, 100vw)"
    destroy-on-close
    class="devtools-drawer"
  >
    <template #header>
      <div class="devtools-drawer-header">
        <div class="header-title-box">
          <span class="header-icon">🛠️</span>
          <span class="header-title">开发者小工具</span>
          <el-tag size="small" type="primary" effect="plain" class="header-tag">DevTools</el-tag>
        </div>
        <div class="header-subtitle">全站功能开关 · 调试入口 · 授权采集与本机 AI</div>
      </div>
    </template>

    <el-tabs v-model="activeTab" class="devtools-tabs">
      <!-- Tab 1: 常用开关与调试 -->
      <el-tab-pane name="switches">
        <template #label>
          <span class="tab-label">
            <span class="tab-icon">⚙️</span>
            <span>常用开关与调试</span>
          </span>
        </template>

        <div class="switches-container">
          <div class="switches-hero-tip">
            快速控制全站特性组件，并提供核心能力与调试观察面板的一键直达入口。
          </div>

          <!-- 卡片 1：看板娘 -->
          <div class="devtools-switch-card">
            <div class="card-left">
              <div class="card-icon-wrap cat-icon">🐱</div>
              <div class="card-info">
                <div class="card-title-row">
                  <span class="card-title">看板娘 (Live2D)</span>
                  <el-tag :type="live2dActive ? 'success' : 'info'" size="small">
                    {{ live2dActive ? "常驻待命中" : "已休眠关闭" }}
                  </el-tag>
                </div>
                <div class="card-desc">
                  复刻自 Hexo 博客时代的 Live2D 互动挂件，开启后在全站右下角悬浮展示，支持点击随机互动与拖动调整位置。
                </div>
                <div class="card-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    @click="goToLive2dConfig"
                  >
                    🎨 前往模型库选角与预览 →
                  </el-button>
                </div>
              </div>
            </div>
            <div class="card-right">
              <el-switch
                :model-value="live2dActive"
                :loading="live2dSwitching"
                inline-prompt
                active-text="开"
                inactive-text="关"
                @change="handleLive2dToggle"
              />
            </div>
          </div>

          <!-- 卡片 2：我的空间 -->
          <div class="devtools-switch-card">
            <div class="card-left">
              <div class="card-icon-wrap space-icon">🏠</div>
              <div class="card-info">
                <div class="card-title-row">
                  <span class="card-title">我的空间</span>
                  <el-tag type="primary" size="small">快捷直达</el-tag>
                </div>
                <div class="card-desc">
                  个人专属数据与服务中心，快速直达网盘直链、服务器面板监控、青龙定时任务状态与专属工作台。
                </div>
              </div>
            </div>
            <div class="card-right">
              <el-button
                type="primary"
                @click="handleDirectOpenPortal"
              >
                🚀 立即打开我的空间
              </el-button>
            </div>
          </div>

          <!-- 卡片 3：功能使用观察 -->
          <div class="devtools-switch-card">
            <div class="card-left">
              <div class="card-icon-wrap obs-icon">📊</div>
              <div class="card-info">
                <div class="card-title-row">
                  <span class="card-title">功能使用观察</span>
                  <el-tag type="info" size="small">观测看板</el-tag>
                </div>
                <div class="card-desc">
                  收集与可视化展示全站功能交互埋点、耗时分布与离线审计日志，辅助全站性能与用户体验诊断。
                </div>
              </div>
            </div>
            <div class="card-right">
              <el-button
                type="info"
                plain
                @click="handleDirectOpenObservation"
              >
                🔍 立即查看功能观察面板
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 平台授权与本机 AI -->
      <el-tab-pane name="auth">
        <template #label>
          <span class="tab-label">
            <span class="tab-icon">🔑</span>
            <span>平台授权与本机 AI</span>
          </span>
        </template>
        <div class="auth-wrapper">
          <AuthorizedCollection />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  ElDrawer,
  ElTabs,
  ElTabPane,
  ElSwitch,
  ElButton,
  ElTag,
  ElMessage,
} from "element-plus";
import AuthorizedCollection from "../views/home/entertainment/component/AuthorizedCollection.vue";
import {
  live2dActive,
  live2dSwitching,
  toggleLive2d,
  openPortalModal,
  openObservationModal,
} from "../utils/devTools";

const router = useRouter();

const open = ref(false);
const activeTab = ref<"switches" | "auth">("switches");
const launcher = ref<HTMLButtonElement>();
const position = ref<{ x: number; y: number }>();
const dragging = ref(false);
const positionKey = "lptff-devtools-position-v1";
const legacyPositionKey = "lptff-authorization-position-v1";

let pointer: { id: number; x: number; y: number; left: number; top: number } | undefined;
let suppressClick = false;

function clampPosition(x: number, y: number) {
  const rect = launcher.value?.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(x, window.innerWidth - (rect?.width || 120) - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - (rect?.height || 44) - 8)),
  };
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
    try {
      localStorage.setItem(positionKey, JSON.stringify(position.value));
    } catch {
      /* 存储失败降级 */
    }
  }
  dragging.value = false;
  if (launcher.value?.hasPointerCapture(id)) launcher.value.releasePointerCapture(id);
}

function activate(event: MouseEvent) {
  if (suppressClick && event.detail !== 0) {
    suppressClick = false;
    return;
  }
  open.value = true;
}

async function handleLive2dToggle(val: string | number | boolean) {
  const enabled = Boolean(val);
  try {
    await toggleLive2d(enabled);
    if (enabled) {
      ElMessage.success("看板娘已常驻运行，已挂载至右下角");
    } else {
      ElMessage.info("看板娘已休眠");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "看板娘状态切换失败");
  }
}

function handleDirectOpenPortal() {
  openPortalModal();
  open.value = false;
}

function handleDirectOpenObservation() {
  openObservationModal();
  open.value = false;
}

function goToLive2dConfig() {
  open.value = false;
  router.push("/live2d");
}

// 供外部事件直接唤起（例如全站授权或特定模块触发）
const show = () => {
  activeTab.value = "auth";
  open.value = true;
};

const showDevTools = () => {
  activeTab.value = "switches";
  open.value = true;
};

onMounted(() => {
  try {
    const raw = localStorage.getItem(positionKey) || localStorage.getItem(legacyPositionKey) || "null";
    const saved = JSON.parse(raw);
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position.value = clampPosition(saved.x, saved.y);
    }
  } catch {
    /* 忽略位置解析异常 */
  }
  window.addEventListener("resize", keepInViewport);
  window.addEventListener("lptff-open-authorization", show);
  window.addEventListener("lptff-open-devtools", showDevTools);
});

onUnmounted(() => {
  window.removeEventListener("resize", keepInViewport);
  window.removeEventListener("lptff-open-authorization", show);
  window.removeEventListener("lptff-open-devtools", showDevTools);
});
</script>

<style scoped>
.authorization-float {
  position: fixed;
  left: 20px;
  bottom: 22px;
  z-index: 2000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #cbded3;
  border-radius: 24px;
  padding: 10px 18px;
  color: #17624f;
  background: #ffffff;
  box-shadow: 0 4px 18px rgba(23, 56, 42, 0.16);
  cursor: grab;
  touch-action: none;
  user-select: none;
  font-size: 14px;
  font-weight: 600;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.1s;
}

.authorization-float:hover {
  border-color: #17624f;
  box-shadow: 0 6px 22px rgba(23, 56, 42, 0.24);
}

.authorization-float.dragging {
  cursor: grabbing;
  box-shadow: 0 8px 26px rgba(23, 56, 42, 0.32);
}

.authorization-float:focus-visible {
  outline: 2px solid #17624f;
  outline-offset: 3px;
}

.float-icon {
  font-size: 16px;
  line-height: 1;
}

.float-text {
  letter-spacing: 0.2px;
}

/* 抽屉头部 */
.devtools-drawer-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.header-tag {
  font-weight: 600;
}

.header-subtitle {
  font-size: 13px;
  color: #64748b;
}

/* Tab 样式 */
.devtools-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
}

/* 常用开关卡片样式 */
.switches-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.switches-hero-tip {
  background: #f1f5f9;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.devtools-switch-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.devtools-switch-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.card-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.cat-icon {
  background: #fdf2f8;
  border: 1px solid #fbcfe8;
}

.space-icon {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.obs-icon {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.card-actions {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-right {
  display: flex;
  align-items: center;
  padding-top: 4px;
  flex-shrink: 0;
}

.auth-wrapper {
  margin-top: 4px;
}

@media (max-width: 640px) {
  .devtools-switch-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .card-right {
    justify-content: flex-end;
    padding-top: 6px;
    border-top: 1px dashed #f1f5f9;
  }
}
</style>
