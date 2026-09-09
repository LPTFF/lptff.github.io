/**
 * 计算文本或字节缓冲区的 SHA-256 十六进制摘要
 */
export async function sha256(content: string | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof content === "string") {
    buffer = new TextEncoder().encode(content).buffer;
  } else {
    buffer = content;
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
