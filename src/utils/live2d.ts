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
const WIDGET_ID = "live2d-widget";
const POSITION_KEY = "live2d-widget-position";
const WIDGET_WIDTH = 150;
const WIDGET_HEIGHT = 300;
export const LIVE2D_DISABLED_EVENT = "live2d-widget-disabled";

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

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

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

function getWidget(): HTMLDivElement | null {
  return document.getElementById(WIDGET_ID) as HTMLDivElement | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function setWidgetPosition(widget: HTMLDivElement, left: number, top: number): void {
  widget.style.right = "auto";
  widget.style.bottom = "auto";
  widget.style.left = `${clamp(left, 0, window.innerWidth - WIDGET_WIDTH)}px`;
  widget.style.top = `${clamp(top, 0, window.innerHeight - WIDGET_HEIGHT)}px`;
}

function restoreWidgetPosition(widget: HTMLDivElement): void {
  try {
    const position = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
    if (Number.isFinite(position?.left) && Number.isFinite(position?.top)) {
      setWidgetPosition(widget, position.left, position.top);
    }
  } catch {
    localStorage.removeItem(POSITION_KEY);
  }
}

function makeWidgetDraggable(widget: HTMLDivElement, frame: HTMLIFrameElement): () => void {
  let detachFrameEvents = () => {};

  const attachFrameEvents = () => {
    detachFrameEvents();
    const frameDocument = frame.contentDocument;
    if (!frameDocument) return;

    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;
    let suppressClick = false;

    frameDocument.documentElement.style.cursor = "grab";
    frameDocument.documentElement.style.touchAction = "none";

    const getPointerPosition = (event: PointerEvent) => {
      const eventDocument = (event.target as Node | null)?.ownerDocument;
      if (eventDocument === frameDocument) {
        const frameRect = frame.getBoundingClientRect();
        return { x: frameRect.left + event.clientX, y: frameRect.top + event.clientY };
      }
      return { x: event.clientX, y: event.clientY };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = widget.getBoundingClientRect();
      const pointer = getPointerPosition(event);
      startX = pointer.x;
      startY = pointer.y;
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      moved = false;
      const target = event.target as Element | null;
      target?.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const pointer = getPointerPosition(event);
      const offsetX = pointer.x - startX;
      const offsetY = pointer.y - startY;
      if (!moved && Math.hypot(offsetX, offsetY) < 4) return;
      moved = true;
      frameDocument.documentElement.style.cursor = "grabbing";
      setWidgetPosition(widget, startLeft + offsetX, startTop + offsetY);
      event.preventDefault();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      frameDocument.documentElement.style.cursor = "grab";
      const target = event.target as Element | null;
      if (target?.hasPointerCapture?.(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      if (!moved) return;
      suppressClick = true;
      const rect = widget.getBoundingClientRect();
      localStorage.setItem(POSITION_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    };

    const handleClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    frameDocument.addEventListener("pointerdown", handlePointerDown, true);
    frameDocument.addEventListener("pointermove", handlePointerMove, true);
    frameDocument.addEventListener("pointerup", handlePointerUp, true);
    frameDocument.addEventListener("pointercancel", handlePointerUp, true);
    frameDocument.addEventListener("click", handleClick, true);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    detachFrameEvents = () => {
      frameDocument.removeEventListener("pointerdown", handlePointerDown, true);
      frameDocument.removeEventListener("pointermove", handlePointerMove, true);
      frameDocument.removeEventListener("pointerup", handlePointerUp, true);
      frameDocument.removeEventListener("pointercancel", handlePointerUp, true);
      frameDocument.removeEventListener("click", handleClick, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  };

  const handleResize = () => {
    const rect = widget.getBoundingClientRect();
    setWidgetPosition(widget, rect.left, rect.top);
  };

  frame.addEventListener("load", attachFrameEvents);
  if (frame.contentDocument?.readyState === "complete") attachFrameEvents();
  window.addEventListener("resize", handleResize);

  return () => {
    detachFrameEvents();
    frame.removeEventListener("load", attachFrameEvents);
    window.removeEventListener("resize", handleResize);
  };
}

let cleanupWidgetDrag: (() => void) | null = null;

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
  resetWidgetState();
  const widget = document.createElement("div");
  widget.id = WIDGET_ID;
  widget.style.cssText =
    "position:fixed;right:0;bottom:72px;width:150px;height:300px;z-index:998;";

  const frame = document.createElement("iframe");
  frame.id = FRAME_ID;
  frame.title = "live2d 看板娘";
  frame.srcdoc = buildFrameDoc(model);
  frame.style.cssText =
    "position:absolute;right:0;bottom:0;width:150px;height:300px;border:0;background:transparent;";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.title = "关闭看板娘";
  closeButton.setAttribute("aria-label", "关闭看板娘");
  closeButton.textContent = "×";
  closeButton.style.cssText =
    "position:absolute;z-index:2;top:72px;right:4px;width:26px;height:26px;padding:0;border:1px solid rgba(144,147,153,.35);border-radius:50%;background:rgba(255,255,255,.9);color:#606266;font:18px/24px sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.1);";
  closeButton.addEventListener("click", disableLive2d);

  widget.append(frame, closeButton);
  document.body.appendChild(widget);
  widget.style.display = isMobileDevice() ? "none" : "";
  restoreWidgetPosition(widget);
  cleanupWidgetDrag = makeWidgetDraggable(widget, frame);
}

async function initWidget(modelId: string): Promise<void> {
  const models = await loadLive2dModels();
  const model = models.find((item) => item.id === modelId) ?? models[0];
  createWidgetFrame(model);
}

// 移除 iframe 即销毁老库全部状态（全局对象、渲染循环、画布随之回收）
function resetWidgetState(): void {
  cleanupWidgetDrag?.();
  cleanupWidgetDrag = null;
  getWidget()?.remove();
}

export async function enableLive2d(): Promise<void> {
  localStorage.setItem(ENABLED_KEY, "1");
  const frame = getWidgetFrame();
  if (frame) {
    const widget = getWidget();
    if (widget) widget.style.display = isMobileDevice() ? "none" : "";
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
  const widget = getWidget();
  if (widget) widget.style.display = "none";
  window.dispatchEvent(new CustomEvent(LIVE2D_DISABLED_EVENT));
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
