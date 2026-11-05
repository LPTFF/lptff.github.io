import { ref, computed, onMounted, toRaw, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { recordFeatureView, startTask, recordOutboundOpen } from "../../utils/observation";
import type {
  CareerProfile,
  CareerDirection,
  CareerBridgeStatus,
  MarketJobItem,
  UserPreferences,
  EvidenceType,
} from "../types";
import {
  checkCareerStatus,
  extractCareerProfile,
  matchCareerDirections,
  getSavedCareerData,
  clearCareerData,
  syncToBossAutopilot,
} from "../sync/career-bridge";
import { parseResumeFile } from "../parser";
import { useGeminiConfig } from "./use-gemini-config";


export function useCareerWorkflow(publicJobs: Ref<MarketJobItem[]>) {
  // 状态感知
  const checkingStatus = ref(false);
  const bridgeStatus = ref<CareerBridgeStatus>({
    connected: false,
    hasGeminiKey: false,
    model: "",
    currentProfileMeta: null,
  });

  const geminiConfig = useGeminiConfig(bridgeStatus);
  const { showGeminiConfig, geminiForm, isKeyRevealed, revealingKey, savingGemini, testingGemini, clearingGemini, geminiTestFeedback, geminiTestSuccess, loadSavedGeminiKey, toggleGeminiConfig, handleToggleRevealKey, handleSaveGeminiOnly, handleSaveAndTestGemini, handleClearGeminiKey } = geminiConfig;

  // 分析状态
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const isDragOver = ref(false);
  const isProcessing = ref(false);
  const processStep = ref(0);
  const processMessage = ref("");
  const processError = ref("");
  const lastUploadedFile = ref<File | null>(null);

  // 画像与推荐
  const profile = ref<CareerProfile | null>(null);
  const directions = ref<CareerDirection[]>([]);
  const directionFilter = ref<"all" | "market" | "adjacent">("all");
  const activeCollapsePanels = ref<string[]>(["capabilities", "experiences"]);

  // 偏好设置
  const preferences = ref<UserPreferences>({
    city: "",
    salaryExpectation: "",
  });

  // 模块 1：简历上传展开与意向偏好折叠控制
  const showUploadDropzone = ref(false);
  const showPreferenceEdit = ref(false);

  // 模块 2：推荐方向展开证据与市场岗位控制
  const expandedDirectionEvidence = ref<Record<string, boolean>>({});
  const toggleDirectionEvidence = (dirId: string) => {
    expandedDirectionEvidence.value[dirId] = !expandedDirectionEvidence.value[dirId];
  };

  // 模块 3：能力画像分层标签页与技能实证控制
  const activeEvidenceTab = ref<"capabilities" | "experiences" | "unknowns">("capabilities");
  const projectProvenCaps = computed(() =>
    profile.value?.capabilities.filter((c) => c.evidenceType === "projectProven") || []
  );
  const selfStatedCaps = computed(() =>
    profile.value?.capabilities.filter((c) => c.evidenceType !== "projectProven") || []
  );

  const marketSupportedCount = computed(
    () => directions.value.filter((d) => !d.isAdjacent).length
  );
  const adjacentCount = computed(
    () => directions.value.filter((d) => d.isAdjacent).length
  );

  const filteredDirections = computed(() => {
    if (directionFilter.value === "market") {
      return directions.value.filter((d) => !d.isAdjacent);
    }
    if (directionFilter.value === "adjacent") {
      return directions.value.filter((d) => d.isAdjacent);
    }
    return directions.value;
  });

  const refreshBridgeStatus = async () => {
    checkingStatus.value = true;
    try {
      bridgeStatus.value = await checkCareerStatus();
      if (bridgeStatus.value.connected) {
        if (bridgeStatus.value.model) {
          geminiForm.value.model = bridgeStatus.value.model;
        }
        if (bridgeStatus.value.hasGeminiKey) {
          await loadSavedGeminiKey();
        }
        await loadSavedData();
      }
    } finally {
      checkingStatus.value = false;
    }
  };

  const loadSavedData = async () => {
    try {
      const saved = await getSavedCareerData();
      if (saved.profile) {
        profile.value = saved.profile;
      }
      if (saved.directions && saved.directions.length) {
        directions.value = saved.directions;
      }
    } catch (error) {
      console.warn("读取本地缓存画像失败:", error);
    }
  };

  const triggerFileInput = () => {
    if (isProcessing.value) return;
    fileInputRef.value?.click();
  };

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      startProcessFile(file);
    }
    target.value = "";
  };

  const handleFileDrop = (event: DragEvent) => {
    isDragOver.value = false;
    if (isProcessing.value) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      startProcessFile(file);
    }
  };

  const startProcessFile = async (file: File) => {
    if (!bridgeStatus.value.connected) {
      ElMessage.warning("请先加载并连接 LPTFF 助手扩展后再分析简历");
      return;
    }
    if (!bridgeStatus.value.hasGeminiKey) {
      showGeminiConfig.value = true;
      ElMessage.warning("尚未配置 Gemini Key，请在上方“配置 Gemini”面板中录入后重试");
      return;
    }

    lastUploadedFile.value = file;
    processError.value = "";
    isProcessing.value = true;
    processStep.value = 1;
    processMessage.value = `正在解析 ${file.name} 文本内容...`;

    try {
      // 1. 浏览器解析文本
      const parsed = await parseResumeFile(file);
      processStep.value = 2;
      processMessage.value = "Gemini 正在提取能力画像与原文佐证（严谨校验经历与技能）...";

      // 2. 提交扩展提取画像
      const extractedProfile = await extractCareerProfile(parsed.text, {
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        fingerprint: parsed.fingerprint,
      });
      profile.value = extractedProfile;

      // 3. 市场方向匹配
      processStep.value = 3;
      processMessage.value = "正在对照公开招聘需求快照匹配搜索方向并校验原文引用...";

      const dirTask = startTask("career", "generate_directions");
      let matchedDirections: CareerDirection[] = [];
      try {
        matchedDirections = await matchCareerDirections(
          toRaw(extractedProfile) || extractedProfile,
          toRaw(publicJobs.value),
          toRaw(preferences.value)
        );
        if (matchedDirections && matchedDirections.length > 0) {
          dirTask.finish("success");
        } else {
          dirTask.finish("empty");
        }
      } catch (e) {
        dirTask.finish("failure", "runtime_error");
        throw e;
      }
      directions.value = matchedDirections;

      processStep.value = 4;
      processMessage.value = "分析与匹配完成！可查阅推荐方向并直接前往 BOSS 直聘精准搜索。";
      ElMessage.success("简历画像与推荐方向更新成功");
    } catch (error) {
      processError.value = error instanceof Error ? error.message : String(error);
      processMessage.value = `处理失败：${processError.value}`;
    } finally {
      isProcessing.value = false;
    }
  };

  const retryCurrentTask = () => {
    if (lastUploadedFile.value) {
      startProcessFile(lastUploadedFile.value);
    } else if (profile.value) {
      handlePreferencesChange();
    }
  };

  const handlePreferencesChange = async () => {
    if (!profile.value || !bridgeStatus.value.connected) return;
    isProcessing.value = true;
    processMessage.value = "偏好已调整，正在重新计算推荐方向...";
    const dirTask = startTask("career", "generate_directions");
    try {
      const res = await matchCareerDirections(
        toRaw(profile.value) || profile.value,
        toRaw(publicJobs.value),
        toRaw(preferences.value)
      );
      directions.value = res;
      if (res && res.length > 0) {
        dirTask.finish("success");
      } else {
        dirTask.finish("empty");
      }
      processMessage.value = "推荐方向已重新计算";
      ElMessage.success("推荐方向已根据新偏好更新");
    } catch (error) {
      dirTask.finish("failure", "runtime_error");
      processError.value = error instanceof Error ? error.message : String(error);
    } finally {
      isProcessing.value = false;
    }
  };

  const handleJumpToBoss = (keyword: string) => {
    void recordOutboundOpen("career", "open_platform", "job_platform");
    const cleanKeyword = encodeURIComponent(keyword.trim());
    let targetUrl = `https://www.zhipin.com/web/geek/job?query=${cleanKeyword}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleSyncAutopilot = async () => {
    if (!profile.value?.communicationProfileSnippet) {
      ElMessage.warning("当前画像未生成沟通摘要");
      return;
    }
    try {
      await syncToBossAutopilot(profile.value.communicationProfileSnippet);
      ElMessage.success("已将最新技术经历摘要同步至 BOSS 自动沟通助手参考画像");
    } catch (error) {
      ElMessage.error(`同步失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleClearData = async () => {
    try {
      await ElMessageBox.confirm(
        "确定要清空本地保存的简历、能力画像与匹配缓存吗？此操作无法撤销。",
        "清空本地求职数据",
        {
          confirmButtonText: "确定清空",
          cancelButtonText: "取消",
          type: "warning",
        }
      );
      await clearCareerData();
      profile.value = null;
      directions.value = [];
      processStep.value = 0;
      processMessage.value = "";
      showUploadDropzone.value = false;
      showPreferenceEdit.value = false;
      expandedDirectionEvidence.value = {};
      ElMessage.success("本地求职数据已安全清除");
    } catch {
      // cancelled
    }
  };

  const evidenceLabel = (type: EvidenceType) => {
    if (type === "projectProven") return "项目实证";
    if (type === "selfStated") return "简历自述";
    return "待核实";
  };

  const evidenceTagType = (type: EvidenceType) => {
    if (type === "projectProven") return "success";
    if (type === "selfStated") return "info";
    return "warning";
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return isoStr;
    }
  };

  const scrollToStep = (stepId: string) => {
    const el = document.getElementById(stepId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("highlight-pulse");
      setTimeout(() => {
        el.classList.remove("highlight-pulse");
      }, 1200);
    }
  };

  onMounted(() => {
    void recordFeatureView("career");
    refreshBridgeStatus();
  });


  return {
    ...geminiConfig,
    checkingStatus,
    bridgeStatus,
    fileInputRef,
    isDragOver,
    isProcessing,
    processStep,
    processMessage,
    processError,
    lastUploadedFile,
    profile,
    directions,
    directionFilter,
    activeCollapsePanels,
    preferences,
    showUploadDropzone,
    showPreferenceEdit,
    expandedDirectionEvidence,
    toggleDirectionEvidence,
    activeEvidenceTab,
    projectProvenCaps,
    selfStatedCaps,
    marketSupportedCount,
    adjacentCount,
    filteredDirections,
    refreshBridgeStatus,
    loadSavedData,
    triggerFileInput,
    handleFileSelect,
    handleFileDrop,
    startProcessFile,
    retryCurrentTask,
    handlePreferencesChange,
    handleJumpToBoss,
    handleSyncAutopilot,
    handleClearData,
    evidenceLabel,
    evidenceTagType,
    formatDate,
    scrollToStep,
  };
}
