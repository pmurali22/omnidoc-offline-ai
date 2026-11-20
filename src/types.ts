export interface DocumentChunk {
  id: string;
  docId: string;
  fileName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  wordCount: number;
  embedding?: number[];
}

export interface PdfDocument {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  chunks: DocumentChunk[];
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  active: boolean; // whether to include in cross-doc synthesis and Q&A
  addedAt: number;
  isSample?: boolean;
}

export interface Citation {
  fileName: string;
  pageNumber: number;
  snippet: string;
  docId: string;
  chunkIndex: number;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  source: 'semantic' | 'keyword' | 'hybrid';
}

export type PresetMode = 'summary' | 'compare' | 'takeaways' | 'actions';

export interface PresetChip {
  id: PresetMode;
  label: string;
  icon: string;
  prompt: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: number;
  isStreaming?: boolean;
  modelUsed?: string;
  latencyMs?: number;
  activeDocCount?: number;
}

export type EngineType = 'webgpu' | 'wasm' | 'fast-client';

export interface ModelConfig {
  id: string;
  name: string;
  engine: EngineType;
  modelFamily: string;
  sizeLabel: string;
  contextWindow: number;
  description: string;
  isAvailable: boolean;
  isLoaded: boolean;
  loadProgress: number; // 0 - 100
  statusText: string;
}

export interface ModelProgressReport {
  type: 'progress' | 'ready' | 'error' | 'token' | 'complete';
  modelId?: string;
  progress?: number;
  text?: string;
  error?: string;
  token?: string;
  citations?: Citation[];
  stats?: {
    tokensPerSecond?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTimeMs?: number;
  };
}
