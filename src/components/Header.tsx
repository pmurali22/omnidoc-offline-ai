import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, WifiOff, Cpu, Zap, Trash2, DownloadCloud } from 'lucide-react';
import { EngineType } from '../types';

interface HeaderProps {
  engineType: EngineType;
  modelName: string;
  isModelReady: boolean;
  totalDocs: number;
  activeDocs: number;
  onClearAll: () => void;
  onOpenModelSetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  engineType,
  modelName,
  isModelReady,
  totalDocs,
  activeDocs,
  onClearAll,
  onOpenModelSetup
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* App Title & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">OmniDoc AI</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                PWA v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">100% In-Browser Multi-PDF Intelligence • Zero Server Calls</p>
          </div>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Online/Offline Status Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            !isOnline
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
              : 'bg-slate-800/80 text-slate-300 border-slate-700'
          }`}>
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden md:inline">Offline Mode Active</span>
                <span className="md:hidden">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Offline Ready • Cached</span>
                <span className="md:hidden">Ready</span>
              </>
            )}
          </div>

          {/* Engine & Hardware Acceleration Pill */}
          <button
            onClick={onOpenModelSetup}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 transition-all cursor-pointer"
            title="Click to configure AI Engine & Models"
          >
            {engineType === 'webgpu' ? (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="hidden lg:inline">{modelName}</span>
            <span className="lg:hidden">{engineType === 'webgpu' ? 'WebGPU' : 'Fast AI'}</span>
          </button>

          {/* Install PWA Button if prompt available */}
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Clear All Docs Button */}
          {totalDocs > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Clear all uploaded documents"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
