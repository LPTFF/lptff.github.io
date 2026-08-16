import { ElMessage, ElMessageBox } from "element-plus";
import { useInvestmentOS } from "./use-investment-os";

/**
 * 采集 / 导入按钮的统一反馈封装：即时 toast + 待导入数据阻塞重新采集时的丢弃确认。
 * 抽出自 DataView / ConsoleView 两处相同按钮，避免"点了没反应"和"待导入数据卡死重采"。
 */
export function useCollectionControl() {
  const { state, startCollection, syncFromExtension, discardStaging, refreshExtensionStatus } = useInvestmentOS();

  async function collect(): Promise<boolean> {
    if (state.syncing || state.collecting) return false;
    // 先刷新拿到最新 pending，区分"被待导入数据阻塞"与"真正启动失败"，再决定是否提示丢弃。
    await refreshExtensionStatus();
    if (state.extensionStatus?.pending) {
      try {
        await ElMessageBox.confirm(
          "插件中已有一批采集完成的数据等待导入。重新采集会丢弃这批待导入数据（不影响本地账本），然后开始新一轮采集。是否继续？",
          "重新采集",
          { type: "warning", confirmButtonText: "丢弃并重新采集", cancelButtonText: "取消" },
        );
      } catch {
        return false; // 用户取消
      }
      ElMessage.info("正在丢弃待导入数据并启动采集…");
      try {
        await discardStaging();
      } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "丢弃待导入数据失败");
        return false;
      }
    }
    ElMessage.info("正在启动采集，请等待插件完成…");
    const started = await startCollection();
    if (started) {
      ElMessage.success("采集完成，新批次等待导入");
    } else if (state.extensionStatus?.pending) {
      ElMessage.warning(state.syncMessage || "插件中仍有一批待导入数据，请先读取或丢弃");
    } else {
      ElMessage.error(state.error || state.syncMessage || "采集失败，请确认插件已安装并登录天天基金");
    }
    return started;
  }

  async function sync(): Promise<void> {
    if (state.syncing || state.collecting) return;
    ElMessage.info("正在读取插件待导入数据…");
    const result = await syncFromExtension();
    if (result?.outcome === "imported") {
      ElMessage.success("已导入插件数据，本地账本已更新");
    } else if (result?.outcome === "up-to-date") {
      ElMessage.info("插件与本地账本已同步，无新数据");
    } else if (result?.outcome === "not-collected") {
      ElMessage.warning("插件尚未生成待导入数据，请先开始采集");
    } else if (result?.outcome === "collecting") {
      ElMessage.info("插件正在采集，请等待完成后导入");
    } else {
      ElMessage.error(state.error || state.syncMessage || "读取插件数据失败");
    }
  }

  return { collect, sync };
}
