import { unzipSync } from "fflate";

/**
 * 浏览器端从 DOCX 文件提取纯文本与段落结构
 * 基于 fflate 解压与原生 DOMParser 解析 word/document.xml
 */
export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(uint8Array);
  } catch (error) {
    throw new Error(`DOCX 文件解压失败，文件可能损坏：${error instanceof Error ? error.message : String(error)}`);
  }

  const documentXmlBytes = unzipped["word/document.xml"];
  if (!documentXmlBytes) {
    throw new Error("无效的 DOCX 文件：缺少 word/document.xml 核心文档节点");
  }

  const xmlString = new TextDecoder("utf-8").decode(documentXmlBytes);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`DOCX XML 解析错误: ${parseError.textContent || "未知 XML 格式异常"}`);
  }

  const paragraphs: string[] = [];

  // 获取所有段落与表格行
  const body = xmlDoc.getElementsByTagName("w:body")[0];
  if (!body) {
    throw new Error("无效的 DOCX 文件：缺少 w:body 节点");
  }

  // 递归处理子元素以保持顺序
  function processNode(node: Node): string {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      if (tagName === "w:t") {
        return el.textContent || "";
      }
      if (tagName === "w:tab") {
        return "\t";
      }
      if (tagName === "w:br") {
        return "\n";
      }
      if (tagName === "w:p") {
        const parts: string[] = [];
        for (let i = 0; i < el.childNodes.length; i++) {
          parts.push(processNode(el.childNodes[i]));
        }
        const text = parts.join("").trim();
        return text ? text + "\n" : "";
      }
      if (tagName === "w:tc") {
        // 表格单元格
        const parts: string[] = [];
        for (let i = 0; i < el.childNodes.length; i++) {
          parts.push(processNode(el.childNodes[i]));
        }
        return parts.join("").trim() + " | ";
      }
      if (tagName === "w:tr") {
        // 表格行
        const parts: string[] = [];
        for (let i = 0; i < el.childNodes.length; i++) {
          parts.push(processNode(el.childNodes[i]));
        }
        const text = parts.join("").trim();
        return text ? text + "\n" : "";
      }

      const parts: string[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        parts.push(processNode(el.childNodes[i]));
      }
      return parts.join("");
    }
    return "";
  }

  const fullText = processNode(body).replace(/\n{3,}/g, "\n\n").trim();
  if (!fullText || fullText.length < 20) {
    throw new Error("DOCX 简历未能提取到有效文字内容，文件内容可能为空或格式异常");
  }

  return fullText;
}
