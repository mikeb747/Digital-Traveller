import React from 'react';
import { Minus, Square, X, Cpu, ShieldCheck, Sun, Moon } from 'lucide-react';
import { SystemType } from '../types/traveller';

interface WindowFrameProps {
  system: SystemType;
  serialNumber: string;
  version?: string;
  theme: 'dark' | 'light';
  children: React.ReactNode;
  onToggleTheme: () => void;
  onOpenConfig?: () => void;
  onExportJson?: () => void;
  onImportJsonClick?: () => void;
  onNewTraveller?: () => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  system,
  serialNumber,
  version = 'v1.1.0',
  theme,
  children,
  onToggleTheme,
  onOpenConfig,
  onExportJson,
  onImportJsonClick,
  onNewTraveller
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col h-screen w-screen font-sans border rounded-lg shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100 border-slate-700/60' : 'bg-slate-100 text-slate-900 border-slate-300'
      }`}
    >
      {/* Modern Windows 11 Title Bar */}
      <header
        className={`h-10 backdrop-blur-md border-b flex items-center justify-between px-3 select-none flex-shrink-0 z-20 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-slate-200/90 border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center space-x-3">
          {/* App Icon */}
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-blue-100" />
          </div>
          <span className="text-xs font-medium tracking-tight">
            Digital Traveller — <span className="font-semibold text-blue-500">{system}</span> [{serialNumber}]
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              isDark ? 'bg-slate-800 text-slate-400 border-slate-700/60' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {version}
          </span>
        </div>

        {/* Windows Standard Window Buttons & Theme Switch */}
        <div className="flex items-center -mr-3 h-full">
          {/* Light and Dark Mode Switch Next to Minimize Window Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`h-10 px-3 transition-colors flex items-center justify-center ${
              isDark
                ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80'
                : 'text-indigo-600 hover:text-indigo-800 hover:bg-slate-300/80'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Minimize */}
          <button
            type="button"
            title="Minimize"
            className={`h-10 px-3.5 transition-colors flex items-center justify-center ${
              isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-black hover:bg-slate-300/80'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore */}
          <button
            type="button"
            title="Maximize / Restore"
            className={`h-10 px-3.5 transition-colors flex items-center justify-center ${
              isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-black hover:bg-slate-300/80'
            }`}
          >
            <Square className="w-3 h-3" />
          </button>

          {/* Close */}
          <button
            type="button"
            title="Close Application"
            className="h-10 px-4 text-slate-400 hover:text-white hover:bg-rose-600 transition-colors flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Modern Windows Ribbon / Action Subheader */}
      <nav
        className={`h-9 border-b px-3 flex items-center justify-between text-xs flex-shrink-0 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800/80 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onNewTraveller}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1 font-medium ${
              isDark ? 'hover:bg-slate-800 hover:text-white text-slate-300' : 'hover:bg-slate-200 hover:text-black text-slate-700'
            }`}
          >
            <span>+ New Traveller</span>
          </button>
          <div className={`h-3.5 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
          <button
            type="button"
            onClick={onExportJson}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 font-medium ${
              isDark ? 'hover:bg-slate-800 hover:text-blue-300' : 'hover:bg-slate-200 hover:text-blue-700'
            }`}
            title="Export full traveller record to JSON"
          >
            <span>💾 Save JSON</span>
          </button>
          <button
            type="button"
            onClick={onImportJsonClick}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 font-medium ${
              isDark ? 'hover:bg-slate-800 hover:text-blue-300' : 'hover:bg-slate-200 hover:text-blue-700'
            }`}
            title="Import existing traveller record from JSON"
          >
            <span>📂 Open JSON</span>
          </button>
          <div className={`h-3.5 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
          <button
            type="button"
            onClick={onOpenConfig}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 font-medium ${
              isDark ? 'hover:bg-slate-800 hover:text-indigo-300 text-slate-300' : 'hover:bg-slate-200 hover:text-indigo-700 text-slate-700'
            }`}
          >
            <span>⚙️ Configure Steps</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>ISO 9001 / Calibration Controlled</span>
        </div>
      </nav>

      {/* Main Content Area (Bottom Bar Removed completely) */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
