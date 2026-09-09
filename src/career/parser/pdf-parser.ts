import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * 浏览器端 PDF 简历纯文本提取器
 * 支持逐页读取文本，并对扫描件或空文档严格拦截
 */
export async function parsePdf(arrayBuffer: ArrayBuffer): Promise<string> {
  let pdfDocument;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    throw new Error(`PDF 文件加载失败，文件可能受损或密码保护：${error instanceof Error ? error.message : String(error)}`);
  }

  const numPages = pdfDocument.numPages;
  if (numPages === 0) {
    throw new Error("PDF 文件页数为 0，无法读取内容");
  }

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings: string[] = [];

      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string") {
          pageStrings.push(item.str);
        }
      }

      const pageJoined = pageStrings.join(" ").replace(/\s{2,}/g, " ").trim();
      if (pageJoined) {
        pageTexts.push(pageJoined);
      }
    } catch (pageError) {
      console.warn(`[Career PDF] 第 ${pageNum} 页提取异常:`, pageError);
    }
  }

  const fullText = pageTexts.join("\n\n").trim();

  // 严格拦截扫描件或空白 PDF
  if (!fullText || fullText.length < 50) {
    throw new Error(
      "该 PDF 简历未能提取到有效文字内容（有效字数不足 50），很可能是纯图片扫描件。第一版暂不支持图片 OCR，请上传包含文本图层的 PDF 或 DOCX 简历。"
    );
  }

  return fullText;
}
