/**
 * 图表实例生命周期 composable：init / setOption / ResizeObserver / dispose 统一管理。
 * 投资图表组件共用；数据更新用 replaceMerge:["series"]——series 按序差分更新（走 animationDurationUpdate
 * 平滑过渡，不重播入场动画，避免逐期回放闪烁），变少时正确移除，其余组件 merge 不重建。
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { ensureEchartsRegistered, type EChartsType } from "./echarts";
import type { EChartsCoreOption } from "echarts/core";

export function useChart(buildOption: () => EChartsCoreOption) {
  const container = ref<HTMLDivElement | null>(null);
  const chart = shallowRef<EChartsType | null>(null);
  let observer: ResizeObserver | null = null;

  /** 折叠面板/展开动画中的容器可能暂时 0 宽：延迟到首次有宽再 init，避免 0 宽坐标系崩溃。 */
  function initChart(): void {
    if (chart.value || !container.value) return;
    const el = container.value as unknown as HTMLElement;
    if (el.clientWidth === 0 || el.clientHeight === 0) return;
    const echarts = ensureEchartsRegistered();
    chart.value = echarts.init(el);
    applyOption(buildOption());
  }

  /** echarts 缓存尺寸与容器实际尺寸不一致时（如展开动画中间态 init）resize 自愈。
 * 注：zrender 写内联尺寸的是它内部自建的 div，不会锁死外层容器，resize 即可正确重读布局。 */
  function syncSize(el: HTMLElement): void {
    if (!chart.value) return;
    if (chart.value.getWidth() !== el.clientWidth || chart.value.getHeight() !== el.clientHeight) {
      chart.value.resize();
    }
  }

  function applyOption(option: EChartsCoreOption): void {
    // 容器暂不可用时部分组件（markArea 等）可能抛错；吞掉防打断 Vue render effect，待下次更新重试。
    try {
      if (chart.value && container.value) syncSize(container.value as unknown as HTMLElement);
      // notMerge 会丢弃旧模型全新重建 series，导致入场动画（animationDuration）每次更新重播——
      // 逐期回放时表现为曲线反复闪现；replaceMerge 只替换 series 组件且按序差分，其余组件 merge。
      chart.value?.setOption(option, { replaceMerge: ["series"] });
    } catch {
      /* 跳过本帧 */
    }
  }

  onMounted(() => {
    if (!container.value) return;
    // 项目类型环境存在双份 DOM lib 声明，模板 ref 类型与 echarts 入参不兼容，此处显式收窄。
    const el = container.value as unknown as HTMLElement;
    initChart();
    observer = new ResizeObserver(() => {
      if (!chart.value) {
        initChart();
        return;
      }
      chart.value.resize();
    });
    observer.observe(el);
  });

  watch(buildOption, (option) => applyOption(option));

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
    chart.value?.dispose();
    chart.value = null;
  });

  return { container, chart };
}

/** 读取 Element Plus CSS 变量色（跟随站点主题），读不到时回退默认值。 */
export function epColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
