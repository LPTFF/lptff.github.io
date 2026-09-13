import { ref } from "vue";
import {
  isLive2dEnabled,
  enableLive2d,
  disableLive2d,
  LIVE2D_DISABLED_EVENT,
} from "./live2d";

export const PORTAL_OPEN_EVENT = "lptff-open-portal";
export const OBSERVATION_OPEN_EVENT = "lptff-open-observation";

// 全局响应式状态单例
export const live2dActive = ref<boolean>(typeof window !== "undefined" ? isLive2dEnabled() : false);
export const live2dSwitching = ref<boolean>(false);

export async function toggleLive2d(val: boolean): Promise<boolean> {
  live2dSwitching.value = true;
  try {
    if (val) {
      await enableLive2d();
      live2dActive.value = true;
      return true;
    } else {
      disableLive2d();
      live2dActive.value = false;
      return false;
    }
  } catch (error) {
    live2dActive.value = isLive2dEnabled();
    throw error;
  } finally {
    live2dSwitching.value = false;
  }
}

export function openPortalModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PORTAL_OPEN_EVENT));
  }
}

export function openObservationModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OBSERVATION_OPEN_EVENT));
  }
}

// 同步外部看板娘禁用事件（例如点击模型头部的关闭按钮）
if (typeof window !== "undefined") {
  window.addEventListener(LIVE2D_DISABLED_EVENT, () => {
    live2dActive.value = false;
  });
}

