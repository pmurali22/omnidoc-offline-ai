import * as pdfjsLib from 'pdfjs-dist';
import { chunkPageText } from '../utils/chunking';
import { DocumentChunk } from '../types';

// Configure PDF.js worker locally from bundled public asset
// ZERO CDN requests - 100% offline
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface ParsePdfRequest {
  type: 'PARSE_PDF';
  docId: string;
  fileName: string;
  fileSize: number;
  arrayBuffer: ArrayBuffer;
}

export interface ParseProgressMessage {
  type: 'PARSE_PROGRESS';
  docId: string;
  fileName: string;
  currentPage: number;
  totalPages: number;
  percent: number;
}

export interface ParseCompleteMessage {
  type: 'PARSE_COMPLETE';
  docId: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  chunks: DocumentChunk[];
}

export interface ParseErrorMessage {
  type: 'PARSE_ERROR';
  docId: string;
  fileName: string;
  error: string;
}

self.onmessage = async (event: MessageEvent<ParsePdfRequest>) => {
  const { type, docId, fileName, fileSize, arrayBuffer } = event.data;

  if (type !== 'PARSE_PDF') return;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const allChunks: DocumentChunk[] = [];
    let chunkCounter = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text items with proper spacing
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as { str: string; transform: number[] };
          const currentY = textItem.transform[5];

          if (lastY !== null && Math.abs(currentY - lastY) > 8) {
            pageText += '\n'; // newline for vertical shift
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }

          pageText += textItem.str;
          lastY = currentY;
        }
      }

      // Chunk the page text with word overlap
      const pageChunks = chunkPageText(
        pageText,
        pageNum,
        docId,
        fileName,
        chunkCounter,
        380, // target words
        50   // overlap words
      );

      chunkCounter += pageChunks.length;
      allChunks.push(...pageChunks);

      // Report progress
      const progressMsg: ParseProgressMessage = {
        type: 'PARSE_PROGRESS',
        docId,
        fileName,
        currentPage: pageNum,
        totalPages,
        percent: Math.round((pageNum / totalPages) * 100)
      };
      self.postMessage(progressMsg);
    }

    const completeMsg: ParseCompleteMessage = {
      type: 'PARSE_COMPLETE',
      docId,
      fileName,
      fileSize,
      pageCount: totalPages,
      chunks: allChunks
    };
    self.postMessage(completeMsg);

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errorMsg: ParseErrorMessage = {
      type: 'PARSE_ERROR',
      docId,
      fileName,
      error: errMsg || 'Failed to parse PDF document'
    };
    self.postMessage(errorMsg);
  }
};
