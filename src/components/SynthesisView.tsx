import React, { useState } from 'react';
import { Layers, FileSpreadsheet, ListChecks, CheckCircle, ArrowRight, Loader2, Sparkles, Download, AlertTriangle } from 'lucide-react';
import { PresetMode, PresetChip, Citation } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SynthesisViewProps {
  onRunSynthesis: (prompt: string, mode: PresetMode) => void;
  isGenerating: boolean;
  generatedText: string;
  citations: Citation[];
  activeDocCount: number;
  totalDocCount: number;
}

const PRESET_CHIPS: PresetChip[] = [
  {
    id: 'summary',
    label: 'Combined Summary',
    icon: 'Layers',
    prompt: 'Synthesize a unified executive summary combining key points, core themes, and section highlights across all active documents.',
    description: 'Synthesize unified core themes & takeaways across all PDFs'
  },
  {
    id: 'compare',
    label: 'Compare & Contrast',
    icon: 'FileSpreadsheet',
    prompt: 'Generate a structured comparison matrix contrasting provisions, agreements, differences, and unique requirements between these documents.',
    description: 'Compare agreements, differences, and conflicts side-by-side'
  },
  {
    id: 'takeaways',
    label: 'Key Takeaways',
    icon: 'ListChecks',
    prompt: 'Extract the top high-priority takeaways, core conclusions, and critical findings across all uploaded files.',
    description: 'Extract prioritized insights with page references'
  },
  {
    id: 'actions',
    label: 'Action Items & Deadlines',
    icon: 'CheckCircle',
    prompt: 'Extract all explicit action items, deadlines, obligations, compliance milestones, and operational next steps across all uploaded files.',
    description: 'List obligations, compliance dates & deliverables'
  }
];

export const SynthesisView: React.FC<SynthesisViewProps> = ({
  onRunSynthesis,
  isGenerating,
  generatedText,
  citations,
  activeDocCount,
  totalDocCount
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetMode>('summary');
  const [customPrompt, setCustomPrompt] = useState<string>(PRESET_CHIPS[0].prompt);
  const [selectedCitationSnippet, setSelectedCitationSnippet] = useState<string | null>(null);

  const handleSelectPreset = (preset: PresetChip) => {
    setSelectedPreset(preset.id);
    setCustomPrompt(preset.prompt);
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeDocCount === 0 || !customPrompt.trim() || isGenerating) return;
    onRunSynthesis(customPrompt, selectedPreset);
  };

  const handleDownloadMarkdown = () => {
    if (!generatedText) return;
    const blob = new Blob([generatedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniDoc-Synthesis-${selectedPreset}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Scope Alert if no docs active */}
      {activeDocCount === 0 && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>No documents are currently toggled active. Please check at least one document in the list above to synthesize.</span>
        </div>
      )}

      {/* Mode & Prompt Controls Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
        
        {/* Preset Chips */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Quick Analysis Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_CHIPS.map((chip) => {
              const isSelected = selectedPreset === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSelectPreset(chip)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    {chip.id === 'summary' && <Layers className="w-3.5 h-3.5 text-indigo-400" />}
                    {chip.id === 'compare' && <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />}
                    {chip.id === 'takeaways' && <ListChecks className="w-3.5 h-3.5 text-emerald-400" />}
                    {chip.id === 'actions' && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="text-xs font-semibold">{chip.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{chip.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input box */}
        <form onSubmit={handleExecute} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Synthesis Requirement / Custom Instructions
            </label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Combine key takeaways across all files, compare SLA terms, or extract deadlines..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Querying <strong className="text-indigo-400 font-semibold">{activeDocCount}</strong> of {totalDocCount} documents combined
            </span>

            <button
              type="submit"
              disabled={isGenerating || activeDocCount === 0 || !customPrompt.trim()}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Synthesize Across All Active PDFs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Citations Ribbon if available */}
      {citations.length > 0 && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Source Citations Retrieved ({citations.length} sections)
            </span>
            <span className="text-[10px] text-slate-400">Click any badge to view extracted snippet</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedCitationSnippet(`[${c.fileName} • Page ${c.pageNumber}]: "${c.snippet}"`)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-300 text-[11px] flex items-center space-x-1 transition-colors"
              >
                <span>{c.fileName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-200 font-semibold">P.{c.pageNumber}</span>
              </button>
            ))}
          </div>

          {selectedCitationSnippet && (
            <div className="mt-2.5 p-2 bg-slate-950 rounded-lg border border-indigo-500/30 text-xs text-slate-300 italic flex items-center justify-between">
              <span>{selectedCitationSnippet}</span>
              <button
                onClick={() => setSelectedCitationSnippet(null)}
                className="ml-2 text-slate-400 hover:text-white text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Output Viewer */}
      {(generatedText.length > 0 || isGenerating) && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isGenerating ? 'Streaming Token-by-Token from Worker...' : 'Synthesized Analysis'}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              {generatedText.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-colors"
                  title="Download report as .md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              )}
            </div>
          </div>

          <div className="min-h-[200px] text-slate-200">
            <MarkdownRenderer
              content={generatedText}
              onCitationClick={(citation) => setSelectedCitationSnippet(`Source Reference: ${citation}`)}
            />
            {isGenerating && (
              <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
