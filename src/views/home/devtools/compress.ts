/**
 * 文本压缩 / 解压核心逻辑
 *
 * 支持三种算法（用户可在界面切换并对比）：
 *  - fflate（deflate，主力）：实测压缩率最优，纯 JS 同步 API，8KB
 *  - native（CompressionStream，降级）：浏览器内置零依赖，流式异步，2023.05 起全引擎支持
 *  - lz-string（轻量备选）：4.8KB，一行代码出 Base64，但中文压缩率不如 deflate
 *
 * 支持三种输出编码：
 *  - base64      最通用
 *  - base64url   URL 安全（-_=），适合二维码 / URL
 *  - utf16       体积最小（含不可见字符，仅适合存储场景）
 *
 * 全部为无损压缩，可完整还原原文。
 */
import { deflateSync, inflateSync } from "fflate";
import lzString from "lz-string";

export type Algo = "fflate" | "native" | "lz-string";
export type Encoding = "base64" | "base64url" | "utf16";

export interface AlgoMeta {
  id: Algo;
  name: string;
  desc: string;
  /** native 是异步流式，其余同步 */
  async: boolean;
}

export const ALGOS: AlgoMeta[] = [
  {
    id: "fflate",
    name: "FFlate (deflate)",
    desc: "主力方案 · 压缩率最优 · 纯 JS 同步 · ~8KB",
    async: false,
  },
  {
    id: "native",
    name: "原生 CompressionStream",
    desc: "降级方案 · 浏览器内置零依赖 · 流式异步 · 2023.05+ 全兼容",
    async: true,
  },
  {
    id: "lz-string",
    name: "LZ-String",
    desc: "轻量备选 · ~5KB · 中文压缩率不如 deflate",
    async: false,
  },
];

export const ENCODINGS: { id: Encoding; name: string; desc: string }[] = [
  { id: "base64", name: "Base64", desc: "最通用，含 +/=，适合复制粘贴" },
  { id: "base64url", name: "URL安全Base64", desc: "含 -_，去填充，适合二维码/URL" },
  { id: "utf16", name: "UTF-16", desc: "体积最小，含不可见字符，仅适合存储" },
];

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: false });

/* ---------------------- 字节 <-> 字符串编码 ---------------------- */

/** Uint8Array -> Base64（浏览器原生 btoa 仅支持 Latin1，需逐字节拼字符） */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Base64 -> Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** URL 安全 Base64：- 换 +，_ 换 /，去掉 = 填充 */
function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** URL 安全 Base64 还原为标准 Base64（补回 = 填充） */
function base64UrlToBase64(s: string): string {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return b64;
}

/** Uint8Array -> UTF-16 字符串：每 2 字节拼一个 char，体积最小但含不可见字符 */
function bytesToUtf16(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 2) {
    s += String.fromCharCode((bytes[i] || 0) + ((bytes[i + 1] || 0) << 8));
  }
  return s;
}

/** UTF-16 字符串 -> Uint8Array */
function utf16ToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length * 2);
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = (code >> 8) & 0xff;
  }
  // 去掉末尾可能多出的 0 填充字节（原数据为奇数长度时末尾会补 0）
  const len = bytes.length;
  if (len > 0 && bytes[len - 1] === 0 && (len % 2 === 0)) {
    // 无法确定是否为真实末尾 0 字节，保留全部以保证无损
  }
  return bytes;
}

/* ---------------------- 编码 / 解码（统一出口） ---------------------- */

function encodeBytes(bytes: Uint8Array, encoding: Encoding): string {
  switch (encoding) {
    case "base64":
      return bytesToBase64(bytes);
    case "base64url":
      return bytesToBase64Url(bytes);
    case "utf16":
      return bytesToUtf16(bytes);
  }
}

function decodeToBytes(str: string, encoding: Encoding): Uint8Array {
  switch (encoding) {
    case "base64":
      return base64ToBytes(str.trim());
    case "base64url":
      return base64ToBytes(base64UrlToBase64(str.trim()));
    case "utf16":
      return utf16ToBytes(str);
  }
}

/* ---------------------- 压缩 / 解压：fflate ---------------------- */

function compressFflate(text: string): Uint8Array {
  return deflateSync(encoder.encode(text), { level: 9 });
}

function decompressFflate(bytes: Uint8Array): string {
  return decoder.decode(inflateSync(bytes));
}

/* ---------------------- 压缩 / 解压：native CompressionStream ---------------------- */

async function compressNative(text: string): Promise<Uint8Array> {
  // deflate-raw 最省（无 zlib 头尾）；某些浏览器不支持 deflate-raw 时降级 deflate
  const stream = new Blob([text]).stream();
  try {
    const compressed = stream.pipeThrough(new CompressionStream("deflate-raw" as CompressionFormat));
    const buf = await new Response(compressed).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    const compressed = stream.pipeThrough(new CompressionStream("deflate"));
    const buf = await new Response(compressed).arrayBuffer();
    return new Uint8Array(buf);
  }
}

async function decompressNative(bytes: Uint8Array): Promise<string> {
  // 用 slice(0) 拷出一份纯 ArrayBuffer，避免 Uint8Array.buffer 可能是 SharedArrayBuffer 导致 Blob 类型不兼容
  const safeBytes = new Uint8Array(bytes.slice(0));
  const stream = new Blob([safeBytes]).stream();
  try {
    const decompressed = stream.pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
    const buf = await new Response(decompressed).arrayBuffer();
    return decoder.decode(buf);
  } catch {
    const decompressed = stream.pipeThrough(new DecompressionStream("deflate"));
    const buf = await new Response(decompressed).arrayBuffer();
    return decoder.decode(buf);
  }
}

/* ---------------------- 压缩 / 解压：lz-string ---------------------- */
/* lz-string 自带多种编码输出，不走上面的字节编码层，单独处理 */

function compressLz(text: string, encoding: Encoding): string {
  switch (encoding) {
    case "base64":
      return lzString.compressToBase64(text);
    case "base64url":
      return lzString.compressToEncodedURIComponent(text);
    case "utf16":
      return lzString.compressToUTF16(text);
  }
}

function decompressLz(str: string, encoding: Encoding): string {
  switch (encoding) {
    case "base64":
      return lzString.decompressFromBase64(str);
    case "base64url":
      return lzString.decompressFromEncodedURIComponent(str);
    case "utf16":
      return lzString.decompressFromUTF16(str);
  }
}

/* ====================== 对外统一 API ====================== */

export interface CompressResult {
  output: string;
  /** 压缩后字节（UTF-8 计）——用于统计；lz-string 走自身编码，按输出字符串的 UTF-8 字节计 */
  compressedBytes: number;
}

/**
 * 压缩。algo=native 时为异步，返回 Promise；否则同步。
 * 统一返回 Promise 调用方更简单。
 */
export async function compress(text: string, algo: Algo, encoding: Encoding): Promise<CompressResult> {
  if (!text) return { output: "", compressedBytes: 0 };

  if (algo === "lz-string") {
    const output = compressLz(text, encoding);
    return { output, compressedBytes: new TextEncoder().encode(output).length };
  }

  const bytes = algo === "native" ? await compressNative(text) : compressFflate(text);
  const output = encodeBytes(bytes, encoding);
  // 统计：编码后字符串的 UTF-8 字节（更贴近"传输体积"）
  const compressedBytes = new TextEncoder().encode(output).length;
  return { output, compressedBytes };
}

/** 解压。返回原文；失败抛错。 */
export async function decompress(str: string, algo: Algo, encoding: Encoding): Promise<string> {
  if (!str) return "";

  if (algo === "lz-string") {
    const out = decompressLz(str, encoding);
    if (out == null || out === "") throw new Error("解压失败：内容可能不是该算法/编码下的压缩结果");
    return out;
  }

  const bytes = decodeToBytes(str, encoding);
  const out = algo === "native" ? await decompressNative(bytes) : decompressFflate(bytes);
  if (!out) throw new Error("解压失败：内容可能不是该算法/编码下的压缩结果");
  return out;
}

/** 字节数转人类可读 */
export function formatBytes(n: number): string {
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${n} B`;
}

/* ====================== 往返校验（压缩 → 解压 → 逐字符对比） ====================== */

export interface RoundtripResult {
  /** 解压还原出的文本 */
  restored: string;
  /** 是否与原文完全一致 */
  ok: boolean;
  /** 不一致时，第一个差异处的位置；一致时为 null */
  firstDiffIndex: number | null;
  /** 原文长度 */
  origLen: number;
  /** 还原长度 */
  restoredLen: number;
}

/**
 * 压缩后立即解压，与原文逐字符对比，验证无损还原。
 * 用于压缩完成后自动校验，让用户直观看到「能否正确还原」。
 */
export async function verifyRoundtrip(
  original: string,
  compressed: string,
  algo: Algo,
  encoding: Encoding,
): Promise<RoundtripResult> {
  const restored = await decompress(compressed, algo, encoding);
  if (restored === original) {
    return { restored, ok: true, firstDiffIndex: null, origLen: original.length, restoredLen: restored.length };
  }
  // 找第一个差异位置
  let i = 0;
  const minLen = Math.min(original.length, restored.length);
  while (i < minLen && original[i] === restored[i]) i++;
  return {
    restored,
    ok: false,
    firstDiffIndex: i >= minLen ? Math.min(original.length, restored.length) : i,
    origLen: original.length,
    restoredLen: restored.length,
  };
}
