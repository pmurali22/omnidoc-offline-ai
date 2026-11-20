import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface PdfDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  isProcessing
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (selected.length > 0) {
        onFilesSelected(selected);
      }
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all p-6 text-center ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-200">
            Drop multiple PDF documents here
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Upload multiple contracts, research papers, reports, or manuals. Extracted & vectorized 100% locally in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Select PDF Files</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onLoadSamples}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load 3 Sample PDFs</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Zero Server Calls • 100% In-Browser Privacy • SharedArrayBuffer Multi-threading</span>
        </div>
      </div>
    </div>
  );
};
