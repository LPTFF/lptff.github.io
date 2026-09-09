import { parseDocx } from "./docx-parser";
import { parsePdf } from "./pdf-parser";
import { sha256 } from "../utils/crypto";

export interface ParsedResumeFile {
  text: string;
  fileName: string;
  fileSize: number;
  fingerprint: string;
}

/**
 * 统一简历解析入口
 * 接收 File 对象，返回提取的文字、文件元信息与内容 SHA-256 指纹
 */
export async function parseResumeFile(file: File): Promise<ParsedResumeFile> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  const arrayBuffer = await file.arrayBuffer();
  let text = "";

  if (lowerName.endsWith(".docx")) {
    text = await parseDocx(arrayBuffer);
  } else if (lowerName.endsWith(".pdf")) {
    text = await parsePdf(arrayBuffer);
  } else if (lowerName.endsWith(".doc")) {
    throw new Error("旧版 .doc 二进制格式暂不支持，请在 Word 或 WPS 中另存为 .docx 或 .pdf 后重新上传");
  } else {
    throw new Error(`不支持的文件格式（${fileName}），目前仅支持 DOCX 或 PDF 格式简历`);
  }

  const fingerprint = await sha256(text);

  return {
    text,
    fileName,
    fileSize: file.size,
    fingerprint,
  };
}
