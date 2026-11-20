import { DocumentChunk } from '../types';

/**
 * Splits extracted text from PDF pages into overlapping ~350-400 word chunks,
 * strictly tagged with docId, fileName, pageNumber, and chunkIndex.
 */
export function chunkPageText(
  pageText: string,
  pageNumber: number,
  docId: string,
  fileName: string,
  startChunkIndex: number = 0,
  targetWords: number = 380,
  overlapWords: number = 50
): DocumentChunk[] {
  // Clean whitespace and normalize line breaks
  const cleanedText = pageText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .trim();

  if (!cleanedText) {
    return [];
  }

  // Split into paragraphs first to avoid cutting sentences awkwardly
  const paragraphs = cleanedText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const words: string[] = [];

  for (const p of paragraphs) {
    const pWords = p.split(/\s+/).filter(Boolean);
    if (words.length > 0 && pWords.length > 0) {
      words.push('\n\n'); // Paragraph marker
    }
    words.push(...pWords);
  }

  // If page text is within targetWords, create a single chunk
  const actualWordTokens = words.filter(w => w !== '\n\n');
  if (actualWordTokens.length <= targetWords) {
    return [{
      id: `${docId}-p${pageNumber}-c${startChunkIndex}`,
      docId,
      fileName,
      pageNumber,
      chunkIndex: startChunkIndex,
      text: cleanedText,
      wordCount: actualWordTokens.length
    }];
  }

  // Otherwise, slide a window with overlap
  const chunks: DocumentChunk[] = [];
  let chunkIdx = startChunkIndex;
  let wordPointer = 0;

  while (wordPointer < actualWordTokens.length) {
    const endPointer = Math.min(wordPointer + targetWords, actualWordTokens.length);
    const chunkWords = actualWordTokens.slice(wordPointer, endPointer);
    const textSnippet = chunkWords.join(' ');

    chunks.push({
      id: `${docId}-p${pageNumber}-c${chunkIdx}`,
      docId,
      fileName,
      pageNumber,
      chunkIndex: chunkIdx,
      text: textSnippet,
      wordCount: chunkWords.length
    });

    chunkIdx++;

    if (endPointer >= actualWordTokens.length) {
      break;
    }

    // Advance with overlap
    wordPointer += (targetWords - overlapWords);
  }

  return chunks;
}

/**
 * Extracts a concise snippet around matching keywords or beginning of chunk
 */
export function extractSnippet(text: string, queryWords: string[] = [], maxLength: number = 180): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  if (queryWords.length > 0) {
    const lower = clean.toLowerCase();
    for (const q of queryWords) {
      if (q.length < 3) continue;
      const idx = lower.indexOf(q.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(clean.length, idx + maxLength - 40);
        return (start > 0 ? '...' : '') + clean.substring(start, end).trim() + (end < clean.length ? '...' : '');
      }
    }
  }

  return clean.substring(0, maxLength).trim() + '...';
}
