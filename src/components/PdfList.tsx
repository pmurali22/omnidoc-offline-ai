import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, Trash2, Eye, CheckSquare, Square, X } from 'lucide-react';
import { PdfDocument } from '../types';

interface PdfListProps {
  documents: PdfDocument[];
  onToggleActive: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onRemoveDoc: (id: string) => void;
}

export const PdfList: React.FC<PdfListProps> = ({
  documents,
  onToggleActive,
  onToggleAll,
  onRemoveDoc
}) => {
  const [previewDoc, setPreviewDoc] = useState<PdfDocument | null>(null);

  if (documents.length === 0) {
    return null;
  }

  const allActive = documents.every(d => d.active);
  const activeCount = documents.filter(d => d.active).length;
  const totalChunks = documents.filter(d => d.active).reduce((sum, d) => sum + d.chunks.length, 0);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
      {/* Header with bulk toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Uploaded Documents ({documents.length})
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            {activeCount} Active in Query Scope ({totalChunks} chunks)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleAll(!allActive)}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {allActive ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>{allActive ? 'Deselect All' : 'Select All Combined'}</span>
          </button>
        </div>
      </div>

      {/* Document Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
              doc.active
                ? 'bg-slate-850/90 border-slate-700/80 shadow-sm'
                : 'bg-slate-900/50 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={doc.active}
                  onChange={() => onToggleActive(doc.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                  title="Include in cross-document query"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate" title={doc.fileName}>
                    {doc.fileName}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{doc.chunks.length} chunks</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                  title="Inspect extracted text & chunks"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemoveDoc(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Status pill */}
            <div className="mt-2.5 flex items-center justify-between text-[10px]">
              <div className="flex items-center space-x-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Indexed in Vector Store</span>
              </div>
              {doc.isSample && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-medium">
                  Sample
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>{previewDoc.fileName}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {previewDoc.pageCount} pages • {previewDoc.chunks.length} vectorized chunks
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {previewDoc.chunks.map((chunk, idx) => (
                <div key={chunk.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400 pb-1 mb-1.5 border-b border-slate-800/50">
                    <span>Chunk #{idx + 1} (Page {chunk.pageNumber})</span>
                    <span className="text-slate-400">{chunk.wordCount} words</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
