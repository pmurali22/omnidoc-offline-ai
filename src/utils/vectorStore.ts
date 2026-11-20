import { DocumentChunk, RetrievalResult } from '../types';

// Standard English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself'
]);

/**
 * Tokenize and normalize text into meaningful terms
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Cosine similarity between two float vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an in-memory bag-of-words / subword frequency embedding vector
 * (Used when neural embedding model is downloading or in fast mode)
 */
export function createFastTermVector(tokens: string[], vocabulary: Map<string, number>, vocabSize: number): number[] {
  const vec = new Array(vocabSize).fill(0);
  for (const token of tokens) {
    const idx = vocabulary.get(token);
    if (idx !== undefined && idx < vocabSize) {
      vec[idx] += 1;
    }
  }
  // Normalize L2
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  if (norm > 0) {
    const sqrtNorm = Math.sqrt(norm);
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= sqrtNorm;
    }
  }
  return vec;
}

/**
 * Unified In-Memory Vector & Hybrid RAG Store for Multiple PDF Documents
 */
export class MultiDocVectorStore {
  private chunks: DocumentChunk[] = [];
  private vocabulary: Map<string, number> = new Map();
  private docFreq: Map<string, number> = new Map();
  private termFreqs: Map<string, Map<string, number>> = new Map();
  private avgDocLength: number = 0;

  public clear(): void {
    this.chunks = [];
    this.vocabulary.clear();
    this.docFreq.clear();
    this.termFreqs.clear();
    this.avgDocLength = 0;
  }

  public addChunks(newChunks: DocumentChunk[]): void {
    for (const chunk of newChunks) {
      if (!this.chunks.some(c => c.id === chunk.id)) {
        this.chunks.push(chunk);
      }
    }
    this.rebuildIndex();
  }

  public removeChunksByDocId(docId: string): void {
    this.chunks = this.chunks.filter(c => c.docId !== docId);
    this.rebuildIndex();
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getAllChunks(activeDocIds?: Set<string>): DocumentChunk[] {
    if (!activeDocIds || activeDocIds.size === 0) {
      return this.chunks;
    }
    return this.chunks.filter(c => activeDocIds.has(c.docId));
  }

  private rebuildIndex(): void {
    this.vocabulary.clear();
    this.docFreq.clear();
    this.termFreqs.clear();
    let totalLength = 0;

    let vocabIdx = 0;
    for (const chunk of this.chunks) {
      const tokens = tokenize(chunk.text);
      totalLength += tokens.length;
      const seenInChunk = new Set<string>();
      const tfMap = new Map<string, number>();

      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
        if (!this.vocabulary.has(t)) {
          this.vocabulary.set(t, vocabIdx++);
        }
        if (!seenInChunk.has(t)) {
          seenInChunk.add(t);
          this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
        }
      }
      this.termFreqs.set(chunk.id, tfMap);
    }

    this.avgDocLength = this.chunks.length > 0 ? totalLength / this.chunks.length : 1;
  }

  /**
   * BM25 score calculation
   */
  private scoreBM25(queryTokens: string[], chunk: DocumentChunk): number {
    const k1 = 1.5;
    const b = 0.75;
    const N = this.chunks.length;
    const tfMap = this.termFreqs.get(chunk.id);
    if (!tfMap) return 0;

    const tokens = tokenize(chunk.text);
    const docLen = tokens.length;
    let score = 0;

    for (const q of queryTokens) {
      const tf = tfMap.get(q) || 0;
      const df = this.docFreq.get(q) || 0;
      if (df === 0) continue;

      // IDF with smoothing
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLen / (this.avgDocLength || 1)));
      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Diversity-aware Top-K Hybrid Retrieval across all active PDFs
   * Implements Maximal Marginal Relevance (MMR) & Document Diversity
   */
  public search(
    query: string,
    topK: number = 6,
    activeDocIds?: Set<string>,
    queryEmbedding?: number[]
  ): RetrievalResult[] {
    const activeChunks = this.getAllChunks(activeDocIds);
    if (activeChunks.length === 0) return [];

    const queryTokens = tokenize(query);

    // Score all candidate chunks
    const scoredCandidates: { chunk: DocumentChunk; score: number; method: 'semantic' | 'keyword' | 'hybrid' }[] = [];

    // Detect if dense neural embedding is available
    const hasDenseEmbedding = queryEmbedding && queryEmbedding.length > 0;

    // Vocab size for fallback fast vector
    const vocabSize = Math.min(this.vocabulary.size, 512);
    let queryFastVec: number[] | null = null;
    if (!hasDenseEmbedding && vocabSize > 0) {
      queryFastVec = createFastTermVector(queryTokens, this.vocabulary, vocabSize);
    }

    for (const chunk of activeChunks) {
      const bm25 = this.scoreBM25(queryTokens, chunk);
      let semanticScore = 0;

      if (hasDenseEmbedding && chunk.embedding && chunk.embedding.length === queryEmbedding.length) {
        semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      } else if (queryFastVec) {
        const chunkTokens = tokenize(chunk.text);
        const chunkVec = createFastTermVector(chunkTokens, this.vocabulary, vocabSize);
        semanticScore = cosineSimilarity(queryFastVec, chunkVec);
      }

      // Hybrid combination (normalized BM25 + semantic)
      // Normalize BM25 roughly into [0, 1] range for combination
      const normBM25 = bm25 / (bm25 + 5);
      const combinedScore = (normBM25 * 0.45) + (semanticScore * 0.55);

      scoredCandidates.push({
        chunk,
        score: combinedScore,
        method: hasDenseEmbedding ? 'hybrid' : (normBM25 > semanticScore ? 'keyword' : 'semantic')
      });
    }

    // Sort descending by initial relevance
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Apply Document-Diversity Aware Selection (MMR across documents)
    // Avoid picking 5 chunks from the exact same document when multiple documents are active!
    const selected: RetrievalResult[] = [];
    const docCounts: Map<string, number> = new Map();
    const maxPerDoc = Math.max(2, Math.ceil(topK / Math.max(1, activeDocIds?.size || 2)));

    // First pass: select highest scoring chunks while ensuring cross-document diversity
    for (const item of scoredCandidates) {
      if (selected.length >= topK) break;

      const currentDocCount = docCounts.get(item.chunk.docId) || 0;
      if (currentDocCount < maxPerDoc || activeDocIds?.size === 1) {
        selected.push({
          chunk: item.chunk,
          score: item.score,
          source: item.method
        });
        docCounts.set(item.chunk.docId, currentDocCount + 1);
      }
    }

    // If still have slots, backfill with remaining best candidates
    if (selected.length < topK) {
      for (const item of scoredCandidates) {
        if (selected.length >= topK) break;
        if (!selected.some(s => s.chunk.id === item.chunk.id)) {
          selected.push({
            chunk: item.chunk,
            score: item.score,
            source: item.method
          });
        }
      }
    }

    return selected;
  }
}
