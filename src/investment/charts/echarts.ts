/**
 * echarts 按需注册单例（investment-review.md 12.5）。
 *
 * 只注册本产品实际用到的图表与组件，控制包体；
 * 所有图表组件必须从这里取 echarts 实例，不得直接 import 全量包。
 */
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let registered = false;

/** 幂等注册；返回 echarts core 命名空间。 */
export function ensureEchartsRegistered(): typeof echarts {
  if (!registered) {
    echarts.use([
      BarChart,
      LineChart,
      PieChart,
      GridComponent,
      LegendComponent,
      TooltipComponent,
      MarkLineComponent,
      MarkAreaComponent,
      DataZoomComponent,
      CanvasRenderer,
    ]);
    registered = true;
  }
  return echarts;
}

export type { EChartsType } from "echarts/core";
