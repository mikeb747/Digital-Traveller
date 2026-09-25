import React from 'react';
import { Minus, Square, X, Layers, Cpu, ShieldCheck } from 'lucide-react';
import { SystemType } from '../types/traveller';

interface WindowFrameProps {
  system: SystemType;
  serialNumber: string;
  version?: string;
  children: React.ReactNode;
  onOpenConfig?: () => void;
  onOpenBarcode?: () => void;
  onExportJson?: () => void;
  onImportJsonClick?: () => void;
  onNewTraveller?: () => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  system,
  serialNumber,
  version = 'v1.1.0',
  children,
  onOpenConfig,
  onOpenBarcode,
  onExportJson,
  onImportJsonClick,
  onNewTraveller
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans border border-slate-700/60 rounded-lg shadow-2xl overflow-hidden">
      {/* Modern Windows 11 Title Bar */}
      <header className="h-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-3 select-none flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          {/* App Icon */}
          <div className="w-5 h-5 rounded bg-blue-600/90 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-blue-100" />
          </div>
          <span className="text-xs font-medium tracking-tight text-slate-200">
            Digital Traveller — <span className="font-semibold text-blue-400">{system}</span> [{serialNumber}]
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
            {version}
          </span>
          <span className="hidden md:inline-flex items-center space-x-1 text-[11px] text-emerald-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online Mode</span>
          </span>
        </div>

        {/* Windows Standard Window Buttons */}
        <div className="flex items-center -mr-3 h-full">
          <button 
            title="Minimize"
            className="h-10 px-3.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Maximize / Restore"
            className="h-10 px-3.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors flex items-center justify-center"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            title="Close Application"
            className="h-10 px-4 text-slate-400 hover:text-white hover:bg-rose-600 transition-colors flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Modern Windows Ribbon / Action Subheader */}
      <nav className="h-9 bg-slate-900 border-b border-slate-800/80 px-3 flex items-center justify-between text-xs text-slate-300 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={onNewTraveller}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center space-x-1 text-slate-300"
          >
            <span>+ New Traveller</span>
          </button>
          <div className="h-3.5 w-px bg-slate-800 mx-1"></div>
          <button
            onClick={onExportJson}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-blue-300 transition-colors flex items-center space-x-1.5"
            title="Export full traveller record to JSON"
          >
            <span>💾 Save JSON</span>
          </button>
          <button
            onClick={onImportJsonClick}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-blue-300 transition-colors flex items-center space-x-1.5"
            title="Import existing traveller record from JSON"
          >
            <span>📂 Open JSON</span>
          </button>
          <div className="h-3.5 w-px bg-slate-800 mx-1"></div>
          <button
            onClick={onOpenBarcode}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-amber-300 transition-colors flex items-center space-x-1.5 text-slate-300"
          >
            <span>🏷️ Scan Barcode</span>
          </button>
          <button
            onClick={onOpenConfig}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors flex items-center space-x-1.5 text-slate-300"
          >
            <span>⚙️ Configure Steps</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>ISO 9001 / Calibration Controlled</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
        {children}
      </main>

      {/* Windows Status Bar */}
      <footer className="h-6 bg-slate-900 border-t border-slate-800/90 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Spectrometer: <strong className="text-slate-200">{system}</strong></span>
          </span>
          <span className="border-l border-slate-800 pl-3">SN: <strong className="font-mono text-slate-200">{serialNumber}</strong></span>
          <span className="hidden sm:inline border-l border-slate-800 pl-3">Format: JSON v2.0</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[10px] text-slate-400">
          <span>Storage: Local & File Encoded</span>
          <span className="border-l border-slate-800 pl-3">Ready</span>
        </div>
      </footer>
    </div>
  );
};
