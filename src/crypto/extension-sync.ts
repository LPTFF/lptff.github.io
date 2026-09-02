import type { BinanceSourceCapture } from "./domain";

interface BridgeResponse<T = unknown> {
  ok: boolean;
  staging?: { capture?: BinanceSourceCapture } | null;
  status?: T;
  error?: string;
  alreadyRunning?: boolean;
  alreadyFinishing?: boolean;
}

function bridge<T>(type: string, responseType: string, timeoutMs = 8000): Promise<BridgeResponse<T>> {
  return new Promise((resolve, reject) => {
    const requestId = `binance:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", receive);
      reject(new Error("采集插件未响应，请重新加载扩展并刷新本页"));
    }, timeoutMs);
    function receive(event: MessageEvent) {
      if (event.source !== window || event.origin !== location.origin || event.data?.source !== "lptff-investment-assistant" || event.data?.type !== responseType || event.data?.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      resolve(event.data.response as BridgeResponse<T>);
    }
    window.addEventListener("message", receive);
    window.postMessage({ type, requestId }, location.origin);
  });
}

export const getBinanceStaging = () => bridge("LPTFF_BINANCE_GET_STAGING", "LPTFF_BINANCE_STAGING");
export const getBinanceStatus = <T>() => bridge<T>("LPTFF_BINANCE_GET_STATUS", "LPTFF_BINANCE_STATUS");
export const acknowledgeBinanceStaging = () => bridge("LPTFF_BINANCE_ACK_STAGING", "LPTFF_BINANCE_STAGING_ACKNOWLEDGED");
export const discardBinanceStaging = () => bridge("LPTFF_BINANCE_DISCARD_STAGING", "LPTFF_BINANCE_STAGING_DISCARDED");
export const startBinanceCollection = () => bridge("LPTFF_BINANCE_START_COLLECTION", "LPTFF_BINANCE_COLLECTION_STARTED", 15000);
export const stopBinanceCollection = () => bridge("LPTFF_BINANCE_STOP_COLLECTION", "LPTFF_BINANCE_COLLECTION_STOPPED", 150000);
