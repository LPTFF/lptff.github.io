import { ref } from "vue";

export interface PluginHint {
  type: "success" | "info" | "warning" | "error";
  title: string;
  desc: string;
}

const RELEASE_URL =
  "https://github.com/LPTFF/lptff.github.io/releases/latest/download/lptff-investment-assistant.zip";

export function usePluginGuide() {
  const pluginHint = ref<PluginHint | null>(null);

  async function downloadPlugin(): Promise<void> {
    if (import.meta.env.DEV) {
      pluginHint.value = {
        type: "info",
        title: "正在打包本地扩展源码",
        desc: "开发服务会生成当前版本的 lptff-investment-assistant.zip。",
      };
      try {
        const response = await fetch("/__extension_download__");
        if (!response.ok) throw new Error(`打包服务返回 ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "lptff-investment-assistant.zip";
        link.click();
        URL.revokeObjectURL(url);
        pluginHint.value = {
          type: "success",
          title: "插件下载已开始",
          desc: "解压 zip 后，在 chrome://extensions 中加载已解压的扩展程序。",
        };
      } catch (error) {
        pluginHint.value = {
          type: "error",
          title: "插件下载失败",
          desc: error instanceof Error ? error.message : "无法获取本地扩展压缩包",
        };
      }
      return;
    }

    pluginHint.value = {
      type: "info",
      title: "正在打开插件下载",
      desc: "线上版本从 GitHub Release 获取；下载后请解压并加载已解压的扩展程序。",
    };
    window.open(RELEASE_URL, "_blank", "noopener,noreferrer");
  }

  function openExtensionsPage(): void {
    window.open("chrome://extensions", "_blank", "noopener,noreferrer");
  }

  return { pluginHint, downloadPlugin, openExtensionsPage };
}
