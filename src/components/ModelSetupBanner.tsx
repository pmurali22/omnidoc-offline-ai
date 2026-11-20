import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, HardDrive, Cpu, Zap, RefreshCw } from 'lucide-react';
import { EngineType } from '../types';

interface ModelSetupBannerProps {
  engineType: EngineType;
  modelName: string;
  loadProgress: number;
  statusText: string;
  isReady: boolean;
  onSelectEngine: (engine: EngineType, modelId: string) => void;
  onReloadModel: () => void;
}

export const ModelSetupBanner: React.FC<ModelSetupBannerProps> = ({
  engineType,
  modelName,
  loadProgress,
  statusText,
  isReady,
  onSelectEngine,
  onReloadModel
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-slate-900 border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status info */}
          <div className="flex items-start sm:items-center space-x-3">
            <div className={`p-2 rounded-lg ${isReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400 animate-pulse'}`}>
              {isReady ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-200">
                  {isReady ? 'Local AI Engine Active' : 'Initializing In-Browser Engine...'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {modelName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{statusText}</p>
            </div>
          </div>

          {/* Progress or Actions */}
          <div className="flex items-center space-x-3 self-end md:self-center w-full md:w-auto">
            {loadProgress < 100 && (
              <div className="flex-1 md:w-48 flex flex-col space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Downloading weights</span>
                  <span>{loadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <span>Engines & Weights</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Engine Selection Drawer */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Option 1: Fast In-Browser Engine */}
            <div
              onClick={() => onSelectEngine('fast-client', 'fast-client-engine')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                engineType === 'fast-client'
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Fast In-Browser Engine</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                  Instant • 0 MB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hybrid BM25 + sub-word semantic RAG and hierarchical map-reduce. Instant zero-download synthesis on all devices.
              </p>
            </div>

            {/* Option 2: WebLLM WebGPU */}
            <div
              onClick={() => onSelectEngine('webgpu', 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                engineType === 'webgpu'
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Qwen 2.5 1.5B (WebGPU)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                  WebGPU • ~900 MB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Full neural generative LLM running on your device GPU via MLC WebLLM. Cached permanently in browser for offline reloads.
              </p>
            </div>

            {/* Option 3: Llama 3.2 1B */}
            <div
              onClick={() => onSelectEngine('webgpu', 'Llama-3.2-1B-Instruct-q4f16_1-MLC')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                modelName.includes('Llama')
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">Llama 3.2 1B (WebGPU)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold">
                  WebGPU • ~800 MB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Meta Llama 3.2 1-Billion instruction model. High quality cross-document synthesis with hardware acceleration.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
