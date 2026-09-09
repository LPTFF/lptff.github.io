import type {
  CareerProfile,
  CareerDirection,
  CareerBridgeStatus,
  MarketJobItem,
  UserPreferences,
} from "../types";

function requestId(): string {
  return `career-bridge:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

interface BridgeResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
  status?: CareerBridgeStatus;
  profile?: CareerProfile;
  directions?: CareerDirection[];
  saved?: {
    profile: CareerProfile | null;
    directions: CareerDirection[] | null;
  };
}

function safeClone<T>(val: T): T {
  if (val === undefined || val === null) return val;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (err) {
    console.warn("[career-bridge] safeClone fallback:", err);
    return val;
  }
}

function requestBridge<T>(
  type: string,
  responseType: string,
  payload: Record<string, unknown> = {},
  timeoutDuration = 90000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = requestId();
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("LPTFF 助手扩展未响应。请确认已在 Chrome 中加载扩展，并刷新当前求职机会发现页面"));
    }, timeoutDuration);

    function onMessage(event: MessageEvent) {
      if (
        event.source !== window ||
        event.origin !== location.origin ||
        event.data?.source !== "lptff-investment-assistant" ||
        event.data?.type !== responseType ||
        event.data?.requestId !== id
      ) {
        return;
      }

      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);

      const res = event.data.response as BridgeResponse<T>;
      if (!res) {
        reject(new Error("扩展返回空响应"));
        return;
      }
      if (!res.ok) {
        reject(new Error(res.error || "扩展任务执行失败"));
        return;
      }
      resolve(res as unknown as T);
    }

    window.addEventListener("message", onMessage);
    const cleanPayload = safeClone(payload);
    window.postMessage({ type, requestId: id, ...cleanPayload }, location.origin);
  });
}

/**
 * 检查扩展连接状态与 Gemini 配置状态
 */
export async function checkCareerStatus(): Promise<CareerBridgeStatus> {
  try {
    const res = await requestBridge<BridgeResponse>("LPTFF_CAREER_CHECK_STATUS", "LPTFF_CAREER_STATUS", {}, 5000);
    return (
      res.status || {
        connected: true,
        hasGeminiKey: false,
        model: "",
        currentProfileMeta: null,
      }
    );
  } catch {
    return {
      connected: false,
      hasGeminiKey: false,
      model: "",
      currentProfileMeta: null,
    };
  }
}

/**
 * 提取简历能力画像
 */
export async function extractCareerProfile(
  resumeText: string,
  meta: { fileName: string; fileSize: number; fingerprint: string }
): Promise<CareerProfile> {
  const res = await requestBridge<BridgeResponse<{ profile: CareerProfile }>>(
    "LPTFF_CAREER_EXTRACT_PROFILE",
    "LPTFF_CAREER_PROFILE_EXTRACTED",
    { resumeText, meta },
    120000
  );
  if (!res.profile) {
    throw new Error("未能获取提取的能力画像");
  }
  return res.profile;
}

/**
 * 匹配市场方向（双重匹配与引用校验）
 */
export async function matchCareerDirections(
  profile: CareerProfile,
  marketSnapshot: MarketJobItem[],
  preferences?: UserPreferences
): Promise<CareerDirection[]> {
  const res = await requestBridge<BridgeResponse<{ directions: CareerDirection[] }>>(
    "LPTFF_CAREER_MATCH_DIRECTIONS",
    "LPTFF_CAREER_DIRECTIONS_MATCHED",
    { profile, marketSnapshot, preferences },
    120000
  );
  return res.directions || [];
}

/**
 * 读取本地保存的画像与匹配结果
 */
export async function getSavedCareerData(): Promise<{
  profile: CareerProfile | null;
  directions: CareerDirection[] | null;
}> {
  const res = await requestBridge<BridgeResponse>(
    "LPTFF_CAREER_GET_SAVED",
    "LPTFF_CAREER_SAVED",
    {},
    8000
  );
  return (
    res.saved || {
      profile: null,
      directions: null,
    }
  );
}

/**
 * 清除本地扩展保存的简历与画像数据
 */
export async function clearCareerData(): Promise<void> {
  await requestBridge<BridgeResponse>("LPTFF_CAREER_CLEAR_DATA", "LPTFF_CAREER_DATA_CLEARED", {}, 8000);
}

/**
 * 受控同步沟通摘要到 BOSS 沟通助手
 */
export async function syncToBossAutopilot(snippet: string): Promise<boolean> {
  const res = await requestBridge<BridgeResponse>(
    "LPTFF_CAREER_SYNC_AUTOPILOT",
    "LPTFF_CAREER_AUTOPILOT_SYNCED",
    { snippet },
    8000
  );
  return res.ok === true;
}

/**
 * 读取 Gemini 配置（模型与是否有 Key）
 */
export async function getCareerGeminiConfig(): Promise<{ model: string; hasGeminiKey: boolean }> {
  const res = await requestBridge<BridgeResponse & { model?: string; hasGeminiKey?: boolean }>(
    "LPTFF_CAREER_GET_GEMINI_CONFIG",
    "LPTFF_CAREER_GEMINI_CONFIG",
    {},
    5000
  );
  return {
    model: res.model || "gemini-3.5-flash-lite",
    hasGeminiKey: Boolean(res.hasGeminiKey),
  };
}

/**
 * 明文读取已保存的 Gemini Key（供用户在输入框中查看与修改）
 */
export async function revealCareerGeminiKey(): Promise<string> {
  const res = await requestBridge<BridgeResponse & { geminiKey?: string }>(
    "LPTFF_CAREER_REVEAL_GEMINI_KEY",
    "LPTFF_CAREER_GEMINI_KEY_REVEALED",
    {},
    5000
  );
  return res.geminiKey || "";
}

/**
 * 保存 Gemini 配置（模型与可选的新 Key）
 */
export async function saveCareerGeminiConfig(config: {
  model?: string;
  geminiKey?: string;
}): Promise<{ model: string; hasGeminiKey: boolean }> {
  const res = await requestBridge<BridgeResponse & { model?: string; hasGeminiKey?: boolean }>(
    "LPTFF_CAREER_SAVE_GEMINI_CONFIG",
    "LPTFF_CAREER_GEMINI_CONFIG_SAVED",
    config,
    10000
  );
  return {
    model: res.model || "gemini-3.5-flash-lite",
    hasGeminiKey: Boolean(res.hasGeminiKey),
  };
}

/**
 * 测试 Gemini 连接
 */
export async function testCareerGemini(config?: {
  model?: string;
  geminiKey?: string;
}): Promise<{ ok: boolean; model: string; status: string; durationMs?: number }> {
  const res = await requestBridge<BridgeResponse & { model?: string; status?: string; durationMs?: number }>(
    "LPTFF_CAREER_TEST_GEMINI",
    "LPTFF_CAREER_GEMINI_TESTED",
    { config },
    35000
  );
  return {
    ok: true,
    model: res.model || "",
    status: res.status || "ok",
    durationMs: res.durationMs,
  };
}

/**
 * 清除已保存的 Gemini Key
 */
export async function clearCareerGeminiKey(): Promise<void> {
  await requestBridge<BridgeResponse>(
    "LPTFF_CAREER_CLEAR_GEMINI_KEY",
    "LPTFF_CAREER_GEMINI_KEY_CLEARED",
    {},
    5000
  );
}
