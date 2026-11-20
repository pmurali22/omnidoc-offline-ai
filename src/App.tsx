import React, { useState, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { Header } from './components/Header';
import { ModelSetupBanner } from './components/ModelSetupBanner';
import { PdfDropzone } from './components/PdfDropzone';
import { PdfList } from './components/PdfList';
import { SynthesisView } from './components/SynthesisView';
import { ChatView } from './components/ChatView';
import { createSampleDocuments } from './utils/samplePdfs';
import { PdfDocument, ChatMessage, EngineType, PresetMode, Citation } from './types';
import { Layers, MessageSquare, Shield, Sparkles } from 'lucide-react';

const STORAGE_KEY_DOCS = 'omnidoc_stored_documents';
const STORAGE_KEY_CHAT = 'omnidoc_stored_chat';

export const App: React.FC = () => {
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'chat'>('synthesis');
  
  // Model state
  const [engineType, setEngineType] = useState<EngineType>('fast-client');
  const [modelId, setModelId] = useState<string>('fast-client-engine');
  const [modelName, setModelName] = useState<string>('Fast In-Browser Engine (0MB)');
  const [loadProgress, setLoadProgress] = useState<number>(100);
  const [statusText, setStatusText] = useState<string>('Fast In-Browser RAG Engine ready. 100% offline.');
  const [isModelReady, setIsModelReady] = useState<boolean>(true);
  const [showModelSetup, setShowModelSetup] = useState<boolean>(false);

  // Parsing state
  const [isProcessingPdfs, setIsProcessingPdfs] = useState<boolean>(false);
  const [parsingProgress, setParsingProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Synthesis state
  const [synthesisText, setSynthesisText] = useState<string>('');
  const [synthesisCitations, setSynthesisCitations] = useState<Citation[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatStreaming, setIsChatStreaming] = useState<boolean>(false);

  // Worker refs
  const pdfWorkerRef = useRef<Worker | null>(null);
  const aiWorkerRef = useRef<Worker | null>(null);

  // Initialize workers and load persisted data
  useEffect(() => {
    // 1. Initialize PDF Worker
    const pdfWorker = new Worker(
      new URL('./workers/pdfWorker.ts', import.meta.url),
      { type: 'module' }
    );
    pdfWorkerRef.current = pdfWorker;

    // 2. Initialize AI Worker
    const aiWorker = new Worker(
      new URL('./workers/aiWorker.ts', import.meta.url),
      { type: 'module' }
    );
    aiWorkerRef.current = aiWorker;

    // Listen to AI Worker messages
    aiWorker.onmessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'MODEL_PROGRESS') {
        setLoadProgress(msg.progress || 0);
        setStatusText(msg.text || '');
      } else if (msg.type === 'MODEL_READY') {
        setLoadProgress(100);
        setIsModelReady(true);
        setStatusText(msg.text || 'Engine ready.');
      } else if (msg.type === 'QUERY_CITATIONS') {
        if (msg.queryId === 'synthesis-run') {
          setSynthesisCitations(msg.citations || []);
        } else {
          setChatMessages(prev => prev.map(m => m.id === msg.queryId ? { ...m, citations: msg.citations } : m));
        }
      } else if (msg.type === 'STREAM_TOKEN') {
        const token = msg.token || '';
        if (msg.queryId === 'synthesis-run') {
          setSynthesisText(prev => prev + token);
        } else {
          setChatMessages(prev => prev.map(m => m.id === msg.queryId ? { ...m, content: m.content + token } : m));
        }
      } else if (msg.type === 'QUERY_COMPLETE') {
        if (msg.queryId === 'synthesis-run') {
          setIsSynthesizing(false);
        } else {
          setIsChatStreaming(false);
          setChatMessages(prev => prev.map(m => m.id === msg.queryId ? { ...m, isStreaming: false } : m));
        }
      }
    };

    // Load persisted documents from IndexedDB
    get(STORAGE_KEY_DOCS).then((savedDocs: PdfDocument[] | undefined) => {
      if (savedDocs && savedDocs.length > 0) {
        setDocuments(savedDocs);
        // Sync chunks with AI Worker
        const allChunks = savedDocs.flatMap(d => d.chunks);
        aiWorker.postMessage({
          type: 'SYNC_CHUNKS',
          chunks: allChunks
        });
      } else {
        // Load default realistic sample documents for instant testing!
        const samples = createSampleDocuments();
        setDocuments(samples);
        set(STORAGE_KEY_DOCS, samples);
        aiWorker.postMessage({
          type: 'SYNC_CHUNKS',
          chunks: samples.flatMap(s => s.chunks)
        });
      }
    }).catch(err => console.error('Failed to restore documents from IDB:', err));

    // Load persisted chat
    get(STORAGE_KEY_CHAT).then((savedChat: ChatMessage[] | undefined) => {
      if (savedChat && savedChat.length > 0) {
        setChatMessages(savedChat);
      }
    }).catch(() => {});

    return () => {
      pdfWorker.terminate();
      aiWorker.terminate();
    };
  }, []);

  // Save documents to IndexedDB whenever documents state changes
  useEffect(() => {
    if (documents.length > 0) {
      set(STORAGE_KEY_DOCS, documents);
    }
  }, [documents]);

  // Save chat to IndexedDB whenever chat changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      set(STORAGE_KEY_CHAT, chatMessages);
    }
  }, [chatMessages]);

  // Handle uploading multiple PDFs
  const handleFilesSelected = async (files: File[]) => {
    if (!pdfWorkerRef.current || files.length === 0) return;

    setIsProcessingPdfs(true);
    const worker = pdfWorkerRef.current;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      setParsingProgress({
        current: i + 1,
        total: files.length,
        name: file.name
      });

      try {
        const buffer = await file.arrayBuffer();

        await new Promise<void>((resolve, reject) => {
          const handleWorkerMessage = (e: MessageEvent) => {
            const data = e.data;
            if (data.docId !== docId) return;

            if (data.type === 'PARSE_COMPLETE') {
              worker.removeEventListener('message', handleWorkerMessage);

              const newDoc: PdfDocument = {
                id: docId,
                fileName: data.fileName,
                fileSize: data.fileSize,
                pageCount: data.pageCount,
                chunks: data.chunks,
                status: 'ready',
                active: true,
                addedAt: Date.now()
              };

              setDocuments(prev => [...prev, newDoc]);

              // Sync with AI worker vector store
              if (aiWorkerRef.current) {
                aiWorkerRef.current.postMessage({
                  type: 'SYNC_CHUNKS',
                  chunks: newDoc.chunks
                });
              }

              resolve();
            } else if (data.type === 'PARSE_ERROR') {
              worker.removeEventListener('message', handleWorkerMessage);
              console.error('PDF Parse Error:', data.error);
              resolve(); // continue with other files
            }
          };

          worker.addEventListener('message', handleWorkerMessage);

          worker.postMessage({
            type: 'PARSE_PDF',
            docId,
            fileName: file.name,
            fileSize: file.size,
            arrayBuffer: buffer
          }, [buffer]);
        });

      } catch (err) {
        console.error('Error reading PDF file:', err);
      }
    }

    setIsProcessingPdfs(false);
    setParsingProgress(null);
  };

  // Load sample PDFs
  const handleLoadSamples = () => {
    const samples = createSampleDocuments();
    setDocuments(prev => {
      const combined = [...prev];
      for (const s of samples) {
        if (!combined.some(c => c.id === s.id)) {
          combined.push(s);
        }
      }
      return combined;
    });

    if (aiWorkerRef.current) {
      aiWorkerRef.current.postMessage({
        type: 'SYNC_CHUNKS',
        chunks: samples.flatMap(s => s.chunks)
      });
    }
  };

  // Toggle active status for document
  const handleToggleActive = (id: string) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, active: !doc.active } : doc));
  };

  // Toggle all documents active/inactive
  const handleToggleAll = (selectAll: boolean) => {
    setDocuments(prev => prev.map(doc => ({ ...doc, active: selectAll })));
  };

  // Remove individual document without re-indexing others
  const handleRemoveDoc = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (aiWorkerRef.current) {
      aiWorkerRef.current.postMessage({
        type: 'REMOVE_DOC',
        docId: id
      });
    }
  };

  // Clear all documents
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all uploaded documents and vectors?')) {
      setDocuments([]);
      set(STORAGE_KEY_DOCS, []);
      if (aiWorkerRef.current) {
        aiWorkerRef.current.postMessage({
          type: 'CLEAR_ALL_DOCS'
        });
      }
      setSynthesisText('');
      setSynthesisCitations([]);
    }
  };

  // Change AI Engine
  const handleSelectEngine = (engine: EngineType, newModelId: string) => {
    setEngineType(engine);
    setModelId(newModelId);

    if (engine === 'webgpu') {
      setModelName(newModelId.includes('Llama') ? 'Llama 3.2 1B (WebGPU)' : 'Qwen 2.5 1.5B (WebGPU)');
      setIsModelReady(false);
      setLoadProgress(10);
      setStatusText('Initializing WebGPU Engine...');
    } else {
      setModelName('Fast In-Browser Engine (0MB)');
      setIsModelReady(true);
      setLoadProgress(100);
      setStatusText('Fast In-Browser RAG Engine ready. 100% offline.');
    }

    if (aiWorkerRef.current) {
      aiWorkerRef.current.postMessage({
        type: 'INIT_MODEL',
        engine,
        modelId: newModelId
      });
    }
  };

  // Run Mode 1: Combined Synthesis
  const handleRunSynthesis = (prompt: string, mode: PresetMode) => {
    if (!aiWorkerRef.current) return;

    const activeDocs = documents.filter(d => d.active);
    if (activeDocs.length === 0) return;

    setIsSynthesizing(true);
    setSynthesisText('');
    setSynthesisCitations([]);

    aiWorkerRef.current.postMessage({
      type: 'GENERATE_QUERY',
      queryId: 'synthesis-run',
      prompt,
      mode,
      activeDocIds: activeDocs.map(d => d.id)
    });
  };

  // Run Mode 2: Interactive Chat Q&A
  const handleSendMessage = (query: string) => {
    if (!aiWorkerRef.current) return;

    const activeDocs = documents.filter(d => d.active);
    if (activeDocs.length === 0) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-asst-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: Date.now(),
      activeDocCount: activeDocs.length
    };

    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsChatStreaming(true);

    aiWorkerRef.current.postMessage({
      type: 'GENERATE_QUERY',
      queryId: assistantMsgId,
      prompt: query,
      mode: 'qa',
      activeDocIds: activeDocs.map(d => d.id)
    });
  };

  const handleClearChat = () => {
    setChatMessages([]);
    set(STORAGE_KEY_CHAT, []);
  };

  const activeDocCount = documents.filter(d => d.active).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* App Header */}
      <Header
        engineType={engineType}
        modelName={modelName}
        isModelReady={isModelReady}
        totalDocs={documents.length}
        activeDocs={activeDocCount}
        onClearAll={handleClearAll}
        onOpenModelSetup={() => setShowModelSetup(!showModelSetup)}
      />

      {/* Persistent / Toggleable Model Setup Banner */}
      <ModelSetupBanner
        engineType={engineType}
        modelName={modelName}
        loadProgress={loadProgress}
        statusText={statusText}
        isReady={isModelReady}
        onSelectEngine={handleSelectEngine}
        onReloadModel={() => handleSelectEngine(engineType, modelId)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Parsing Progress Banner */}
        {isProcessingPdfs && parsingProgress && (
          <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex items-center space-x-3 text-indigo-200">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <div className="flex-1">
              <span className="text-xs font-bold">
                Extracting & Vectorizing Document {parsingProgress.current} of {parsingProgress.total}:
              </span>
              <span className="text-xs ml-1.5 text-white font-mono">{parsingProgress.name}</span>
            </div>
          </div>
        )}

        {/* Dropzone & Document Management */}
        <section className="space-y-4">
          <PdfDropzone
            onFilesSelected={handleFilesSelected}
            onLoadSamples={handleLoadSamples}
            isProcessing={isProcessingPdfs}
          />

          <PdfList
            documents={documents}
            onToggleActive={handleToggleActive}
            onToggleAll={handleToggleAll}
            onRemoveDoc={handleRemoveDoc}
          />
        </section>

        {/* Workflow Tabs: Mode 1 (Synthesis) vs Mode 2 (Chat Q&A) */}
        <section className="space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('synthesis')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'synthesis'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Mode 1: Combined Key Points & Synthesis</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mode 2: Ask Across All PDFs (Chat Q&A)</span>
                {chatMessages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] font-bold">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded in active vector chunks</span>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'synthesis' ? (
            <SynthesisView
              onRunSynthesis={handleRunSynthesis}
              isGenerating={isSynthesizing}
              generatedText={synthesisText}
              citations={synthesisCitations}
              activeDocCount={activeDocCount}
              totalDocCount={documents.length}
            />
          ) : (
            <ChatView
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              isStreaming={isChatStreaming}
              activeDocCount={activeDocCount}
            />
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>OmniDoc PWA • 100% In-Browser Privacy • Zero Server Ingestion</span>
          </div>
          <div>
            <span>WebAssembly • WebGPU • PDF.js • Transformers.js</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default App;
