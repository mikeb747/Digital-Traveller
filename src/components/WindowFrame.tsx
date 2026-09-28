import React from 'react';
import { Minus, Square, X, Cpu, Sun, Moon, Settings } from 'lucide-react';
import { SystemType } from '../types/traveller';

interface WindowFrameProps {
  system: SystemType;
  serialNumber: string;
  version?: string;
  theme: 'dark' | 'light';
  isAdmin?: boolean;
  children: React.ReactNode;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
  onOpenConfig?: () => void;
  onExportJson?: () => void;
  onImportJsonClick?: () => void;
  onNewTraveller?: () => void;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  system,
  serialNumber,
  version = 'v1.0.6',
  theme,
  isAdmin = false,
  children,
  onToggleTheme,
  onOpenSettings,
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
      {/* Modern Windows 11 Title Bar with integrated actions */}
      <header
        className={`h-10 backdrop-blur-md border-b flex items-center justify-between px-3 select-none flex-shrink-0 z-20 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-slate-200/90 border-slate-300 text-slate-800'
        }`}
      >
        {/* Left Section: App Icon, System Name, and Top Bar Actions (+New Traveller, Save, Open) */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          {/* App Icon */}
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
            <Cpu className="w-3.5 h-3.5 text-blue-100" />
          </div>

          <span className="text-xs font-medium tracking-tight whitespace-nowrap flex-shrink-0">
            Digital Traveller — <span className="font-semibold text-blue-500">{system}</span>{' '}
            <span className="font-mono text-slate-400">
              [{serialNumber ? serialNumber : 'Unassigned S/N'}]
            </span>
          </span>

          <div className={`h-4 w-px mx-1 flex-shrink-0 ${isDark ? 'bg-slate-700/70' : 'bg-slate-300'}`}></div>

          {/* Action Buttons moved up to top bar starting roughly where version number was */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              type="button"
              onClick={onNewTraveller}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                  : 'text-slate-700 hover:text-black hover:bg-slate-300/80'
              }`}
              title="Create new digital traveller"
            >
              <span>+ New Traveller</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-blue-300 hover:bg-slate-800/90'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-slate-300/80'
              }`}
              title="Save traveller JSON file"
            >
              <span>💾 Save</span>
            </button>

            <button
              type="button"
              onClick={onImportJsonClick}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-blue-300 hover:bg-slate-800/90'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-slate-300/80'
              }`}
              title="Open existing traveller JSON file"
            >
              <span>📂 Open</span>
            </button>

            {/* Configure Steps: Only visible to Admin user */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenConfig}
                className={`h-7 px-2.5 rounded text-xs font-medium flex items-center space-x-1 text-amber-500 hover:text-amber-400 transition-colors ${
                  isDark ? 'hover:bg-slate-800/90' : 'hover:bg-slate-300/80'
                }`}
                title="Admin: Configure workflow steps"
              >
                <span>⚙️ Configure Steps</span>
              </button>
            )}
          </div>
        </div>

        {/* Windows Standard Window Buttons & Theme Switch */}
        <div className="flex items-center -mr-3 h-full flex-shrink-0">
          {/* Settings button (Excel Hub & Network Shares, Workflows) */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={isAdmin ? "Settings & Excel Hub (Admin)" : "Settings & Network Share Excel Hub"}
            className={`h-10 px-2.5 transition-colors flex items-center justify-center ${
              isAdmin
                ? isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80'
                  : 'text-amber-600 hover:text-amber-800 hover:bg-slate-300/80'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/80'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Light and Dark Mode Switch */}
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

      {/* Main Content Area (Ribbon removed completely, shifting everything up) */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {children}

        {/* Version number positioned in bottom right - 35-40% larger (10px -> 14px) */}
        <div className={`absolute bottom-1.5 right-3 text-[14px] font-mono pointer-events-none select-none z-10 ${
          isDark ? 'text-slate-500/50' : 'text-slate-400/60'
        }`}>
          {version}
        </div>
      </main>
    </div>
  );
};
