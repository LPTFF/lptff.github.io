// live2d 看板娘管理：模型与运行方式复刻自 hexo-backup 分支的 live2dw（hijiki），
// 并扩展 live2d-widget 官方免费示例模型支持多选切换；
// 模型清单由 project-support/scripts/fetch-live2d-assets.js 拉取时生成的
// /live2dw/models/manifest.json 提供，内置列表仅作 manifest 不可用时的兜底。
// 运行方式：L2Dwidget（2018 年黑盒老库）整体隔离在 srcdoc iframe 中执行——
// 销毁重建 iframe 即获得全新库状态，切换模型无需刷新页面；
// 老库也不再有污染主文档全局 / 竞争首屏渲染的机会。
const ENABLED_KEY = "live2d-widget-enabled";
const MODEL_KEY = "live2d-widget-model";
const SCRIPT_URL = "/live2dw/lib/L2Dwidget.min.js";
const DEFAULT_MODEL_ID = "hijiki";
const MANIFEST_URL = "/live2dw/models/manifest.json";
const FRAME_ID = "live2d-widget-frame";

export interface Live2dModelOption {
  id: string;
  name: string;
  jsonPath: string;
  preview?: string;
}

// 内置兜底清单（旧站原版 4 款）：manifest 拉取失败时仍可展示
const BUILTIN_MODELS: Live2dModelOption[] = [
  {
    id: "hijiki",
    name: "hijiki 黑猫",
    jsonPath: "/live2dw/models/hijiki/hijiki.model.json",
    preview: "/live2dw/models/hijiki/moc/hijiki.2048/texture_00.png",
  },
  {
    id: "tororo",
    name: "tororo 白猫",
    jsonPath: "/live2dw/models/tororo/tororo.model.json",
    preview: "/live2dw/models/tororo/moc/tororo.2048/texture_00.png",
  },
  {
    id: "shizuku",
    name: "shizuku 看板娘",
    jsonPath: "/live2dw/models/shizuku/shizuku.model.json",
    preview: "/live2dw/models/shizuku/moc/shizuku.1024/texture_00.png",
  },
  {
    id: "wanko",
    name: "wanko 柴犬",
    jsonPath: "/live2dw/models/wanko/wanko.model.json",
    preview: "/live2dw/models/wanko/moc/wanko.1024/texture_00.png",
  },
];

let modelsCache: Live2dModelOption[] | null = null;

// 加载完整模型清单（构建时生成的 manifest），失败回退内置清单
export async function loadLive2dModels(): Promise<Live2dModelOption[]> {
  if (modelsCache) return modelsCache;
  try {
    const response = await fetch(MANIFEST_URL);
    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        modelsCache = list as Live2dModelOption[];
        return modelsCache;
      }
    }
  } catch {
    // manifest 不可用（如模型资产未拉取）时回退内置清单
  }
  modelsCache = BUILTIN_MODELS;
  return modelsCache;
}

export function isLive2dEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export async function getSelectedModelId(): Promise<string> {
  const models = await loadLive2dModels();
  const id = localStorage.getItem(MODEL_KEY);
  return models.some((model) => model.id === id) ? (id as string) : DEFAULT_MODEL_ID;
}

export function getWidgetFrame(): HTMLIFrameElement | null {
  return document.getElementById(FRAME_ID) as HTMLIFrameElement | null;
}

// iframe 文档：样式透底、库与初始化参数与旧站一致；
// srcdoc 继承父文档 base URL，根相对路径可正常解析
function buildFrameDoc(model: Live2dModelOption): string {
  const config = {
    pluginRootPath: "/live2dw/",
    pluginJsPath: "lib/",
    pluginModelPath: "models/",
    agMode: false,
    debug: false,
    model: { jsonPath: model.jsonPath },
    display: { position: "right", width: 150, height: 300 },
    mobile: { show: false },
    log: false,
    tagMode: false,
  };
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    "<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>",
    "</head><body>",
    `<script src="${SCRIPT_URL}"><\/script>`,
    `<script>L2Dwidget.init(${JSON.stringify(config)});<\/script>`,
    "</body></html>",
  ].join("");
}

function createWidgetFrame(model: Live2dModelOption): void {
  getWidgetFrame()?.remove();
  const frame = document.createElement("iframe");
  frame.id = FRAME_ID;
  frame.title = "live2d 看板娘";
  frame.srcdoc = buildFrameDoc(model);
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:150px;height:300px;border:0;background:transparent;z-index:998;";
  document.body.appendChild(frame);
}

async function initWidget(modelId: string): Promise<void> {
  const models = await loadLive2dModels();
  const model = models.find((item) => item.id === modelId) ?? models[0];
  createWidgetFrame(model);
}

// 移除 iframe 即销毁老库全部状态（全局对象、渲染循环、画布随之回收）
function resetWidgetState(): void {
  getWidgetFrame()?.remove();
}

export async function enableLive2d(): Promise<void> {
  localStorage.setItem(ENABLED_KEY, "1");
  const frame = getWidgetFrame();
  if (frame) {
    frame.style.display = "";
    return;
  }
  try {
    await initWidget(await getSelectedModelId());
  } catch {
    resetWidgetState();
    throw new Error("看板娘脚本加载失败");
  }
}

export function disableLive2d(): void {
  localStorage.setItem(ENABLED_KEY, "0");
  const frame = getWidgetFrame();
  if (frame) frame.style.display = "none";
}

export async function switchLive2dModel(modelId: string): Promise<void> {
  const models = await loadLive2dModels();
  if (!models.some((model) => model.id === modelId)) return;
  localStorage.setItem(MODEL_KEY, modelId);
  if (!isLive2dEnabled()) return;
  // iframe 隔离运行：销毁重建即全新库状态，切换模型不刷新页面
  await initWidget(modelId);
}

// 站点启动时按记忆状态与选中模型恢复看板娘。
// iframe 已隔离老库与主文档的相互影响，延迟到页面 load 后启动
// 仅为不与首屏争抢加载带宽；失败静默不影响主功能。
export function setupLive2d(): void {
  if (!isLive2dEnabled()) return;
  const start = () => {
    window.setTimeout(async () => {
      try {
        await initWidget(await getSelectedModelId());
      } catch {
        resetWidgetState();
      }
    }, 500);
  };
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
}
