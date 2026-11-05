import { ref, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { CareerBridgeStatus } from "../types";
import { revealCareerGeminiKey, saveCareerGeminiConfig, testCareerGemini, clearCareerGeminiKey } from "../sync/career-bridge";

const defaultApi = { revealCareerGeminiKey, saveCareerGeminiConfig, testCareerGemini, clearCareerGeminiKey };

export function useGeminiConfig(
  bridgeStatus: Ref<CareerBridgeStatus>,
  api = defaultApi,
  ui = { message: ElMessage, confirm: ElMessageBox.confirm },
) {
  const { message: notify, confirm } = ui;
  const { revealCareerGeminiKey, saveCareerGeminiConfig, testCareerGemini, clearCareerGeminiKey } = api;
  // 可编辑 Gemini 配置状态
  const showGeminiConfig = ref(false);
  const geminiForm = ref({
    model: "gemini-3.5-flash-lite",
    key: "",
  });
  const isKeyRevealed = ref(false);
  const revealingKey = ref(false);
  const savingGemini = ref(false);
  const testingGemini = ref(false);
  const clearingGemini = ref(false);
  const geminiTestFeedback = ref("");
  const geminiTestSuccess = ref(false);

  const loadSavedGeminiKey = async () => {
    if (!bridgeStatus.value.hasGeminiKey) return;
    try {
      const rawKey = await revealCareerGeminiKey();
      if (rawKey) {
        geminiForm.value.key = rawKey;
        isKeyRevealed.value = false;
      }
    } catch (err) {
      console.warn("读取已保存 Gemini Key 失败:", err);
    }
  };

  const toggleGeminiConfig = async () => {
    showGeminiConfig.value = !showGeminiConfig.value;
    if (showGeminiConfig.value) {
      geminiForm.value.model = bridgeStatus.value.model || "gemini-3.5-flash-lite";
      geminiTestFeedback.value = "";
      if (bridgeStatus.value.hasGeminiKey && !geminiForm.value.key) {
        await loadSavedGeminiKey();
      }
    }
  };

  const handleToggleRevealKey = async () => {
    if (isKeyRevealed.value) {
      isKeyRevealed.value = false;
      return;
    }
    if (!geminiForm.value.key && bridgeStatus.value.hasGeminiKey) {
      revealingKey.value = true;
      try {
        const rawKey = await revealCareerGeminiKey();
        if (rawKey) {
          geminiForm.value.key = rawKey;
        }
      } catch (err) {
        notify.error(`读取 Key 失败: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        revealingKey.value = false;
      }
    }
    isKeyRevealed.value = true;
  };

  const handleSaveGeminiOnly = async () => {
    savingGemini.value = true;
    geminiTestFeedback.value = "";
    try {
      const payload: { model: string; geminiKey?: string } = {
        model: geminiForm.value.model,
      };
      if (geminiForm.value.key && geminiForm.value.key.trim()) {
        payload.geminiKey = geminiForm.value.key.trim();
      }
      const updated = await saveCareerGeminiConfig(payload);
      bridgeStatus.value.model = updated.model;
      bridgeStatus.value.hasGeminiKey = updated.hasGeminiKey;
      isKeyRevealed.value = false;
      geminiTestSuccess.value = true;
      geminiTestFeedback.value = `✓ 配置已保存 (模型: ${updated.model})`;
      notify.success("Gemini 配置已更新，与 AI 沟通小助手保持一致");
    } catch (err) {
      geminiTestSuccess.value = false;
      geminiTestFeedback.value = `保存失败: ${err instanceof Error ? err.message : String(err)}`;
      notify.error(geminiTestFeedback.value);
    } finally {
      savingGemini.value = false;
    }
  };

  const handleSaveAndTestGemini = async () => {
    testingGemini.value = true;
    geminiTestFeedback.value = "正在连接 Google Gemini API 进行测试...";
    geminiTestSuccess.value = false;
    try {
      const payload: { model: string; geminiKey?: string } = {
        model: geminiForm.value.model,
      };
      if (geminiForm.value.key && geminiForm.value.key.trim()) {
        payload.geminiKey = geminiForm.value.key.trim();
      }
      const testResult = await testCareerGemini(payload);
      bridgeStatus.value.model = testResult.model || geminiForm.value.model;
      bridgeStatus.value.hasGeminiKey = true;
      isKeyRevealed.value = false;
      geminiTestSuccess.value = true;
      const latency = testResult.durationMs ? `${testResult.durationMs}ms` : "响应正常";
      geminiTestFeedback.value = `✓ 连接成功！模型: ${testResult.model} (${latency})`;
      notify.success(`Gemini 连接测试成功 (${latency})，与 AI 沟通小助手保持一致`);
    } catch (err) {
      geminiTestSuccess.value = false;
      geminiTestFeedback.value = `✗ 测试失败: ${err instanceof Error ? err.message : String(err)}`;
      notify.error(geminiTestFeedback.value);
    } finally {
      testingGemini.value = false;
    }
  };

  const handleClearGeminiKey = async () => {
    try {
      await confirm(
        "确定要清除 Chrome 扩展中保存的 Gemini API Key 吗？清除后将无法进行简历分析与 BOSS AI 自动沟通，直至重新配置。",
        "清除 Gemini Key",
        {
          confirmButtonText: "确定清除",
          cancelButtonText: "取消",
          type: "warning",
        }
      );
      clearingGemini.value = true;
      await clearCareerGeminiKey();
      bridgeStatus.value.hasGeminiKey = false;
      geminiForm.value.key = "";
      isKeyRevealed.value = false;
      geminiTestFeedback.value = "已清除 Gemini Key";
      geminiTestSuccess.value = false;
      notify.success("已清除 Gemini Key");
    } catch (err) {
      if (err !== "cancel") {
        notify.error(`清除失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      clearingGemini.value = false;
    }
  };


  return {
    showGeminiConfig,
    geminiForm,
    isKeyRevealed,
    revealingKey,
    savingGemini,
    testingGemini,
    clearingGemini,
    geminiTestFeedback,
    geminiTestSuccess,
    loadSavedGeminiKey,
    toggleGeminiConfig,
    handleToggleRevealKey,
    handleSaveGeminiOnly,
    handleSaveAndTestGemini,
    handleClearGeminiKey,
  };
}
