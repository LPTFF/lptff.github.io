/**
 * 图表实例生命周期 composable：init / setOption / ResizeObserver / dispose 统一管理。
 * 投资图表组件共用；数据更新用 replaceMerge:["series"]——series 按序差分更新（走 animationDurationUpdate
 * 平滑过渡，不重播入场动画，避免逐期回放闪烁），变少时正确移除，其余组件 merge 不重建。
 */
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch } from "vue";
import { ensureEchartsRegistered, type EChartsType } from "./echarts";
import type { EChartsCoreOption } from "echarts/core";

export function useChart(buildOption: () => EChartsCoreOption) {
  const container = ref<HTMLDivElement | null>(null);
  const chart = shallowRef<EChartsType | null>(null);
  const active = ref(true);
  const visible = ref(false);
  const option = computed(buildOption);
  let observer: ResizeObserver | null = null;
  let frame = 0;
  let appliedOption: EChartsCoreOption | undefined;

  // 折叠或缓存的页面不构造选项、不读取零尺寸；返回时复用实例与未变化的选项。
  function render(): void {
    frame = 0;
    const el = container.value as unknown as HTMLElement | null;
    if (!active.value || !el?.isConnected) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    visible.value = width > 0 && height > 0;
    if (!visible.value) return;
    try {
      if (!chart.value) chart.value = ensureEchartsRegistered().init(el);
      else if (chart.value.getWidth() !== width || chart.value.getHeight() !== height) {
        chart.value.resize({ width, height });
      }
      if (appliedOption !== option.value) {
        chart.value.setOption(option.value, { replaceMerge: ["series"] });
        appliedOption = option.value;
      }
    } catch {
      // 展开动画中的暂态失败留到下次尺寸/数据变化重试。
    }
  }

  function scheduleRender(): void {
    if (active.value && !frame) frame = requestAnimationFrame(render);
  }

  function resume(): void {
    active.value = true;
    if (!container.value) return;
    observer ??= new ResizeObserver(scheduleRender);
    observer.observe(container.value as unknown as HTMLElement);
    scheduleRender();
  }

  function pause(): void {
    active.value = false;
    visible.value = false;
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    chart.value?.dispatchAction({ type: "hideTip" });
  }

  watch(() => active.value && visible.value ? option.value : undefined, (value) => {
    if (value) scheduleRender();
  }, { flush: "post" });

  onMounted(resume);
  onActivated(resume);
  onDeactivated(pause);

  onBeforeUnmount(() => {
    pause();
    observer = null;
    chart.value?.dispose();
    chart.value = null;
    appliedOption = undefined;
  });

  return { container, chart };
}

/** 读取 Element Plus CSS 变量色（跟随站点主题），读不到时回退默认值。 */
export function epColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
