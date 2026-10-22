import React from 'react';
import { SystemType } from '../types/traveller';
import { SYSTEM_PROFILES } from '../services/defaultWorkflows';
import { SlidersHorizontal, User, Briefcase, Tag } from 'lucide-react';
import { TechSelector } from './TechSelector';

interface SystemSelectorProps {
  currentSystem: SystemType;
  serialNumber: string;
  customerName?: string;
  jobNumber?: string;
  partNumber?: string;
  workOrderNumber: string;
  operatorName: string;
  isAdmin: boolean;
  theme?: 'dark' | 'light';
  onChangeOperator: (name: string, isAdmin: boolean) => void;
}

export const SystemSelector: React.FC<SystemSelectorProps> = ({
  currentSystem,
  serialNumber,
  customerName,
  jobNumber,
  partNumber,
  workOrderNumber,
  operatorName,
  isAdmin,
  theme = 'dark',
  onChangeOperator
}) => {
  const profile = SYSTEM_PROFILES[currentSystem] || SYSTEM_PROFILES['inVia'];
  const isDark = theme === 'dark';

  return (
    <div
      className={`border-b p-3 sm:px-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 flex-shrink-0 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}
    >
      {/* Left: System Display (Read-only, only selected when clicking +New) */}
      <div className="flex items-center gap-2.5 flex-wrap select-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
          <span>System:</span>
        </span>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 shadow-xs ${
              isDark
                ? 'bg-blue-950/60 border-blue-500/40 text-blue-300 ring-1 ring-blue-500/20'
                : 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-200'
            }`}
          >
            <span>{currentSystem}</span>
          </span>

          <div className="flex flex-col">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {profile.displayName}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">{profile.tagline}</span>
          </div>
        </div>
      </div>

      {/* Right: System details summary and technician selector */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
        {/* System serial number summary */}
        <div
          className={`flex items-center rounded border px-2.5 py-1 transition-colors ${
            !serialNumber
              ? isDark
                ? 'bg-amber-950/20 border-amber-800/60'
                : 'bg-amber-50 border-amber-300'
              : isDark
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-white border-slate-300'
          }`}
          title="System serial number"
        >
          <span className="text-slate-400 text-[11px] mr-1.5 font-medium">S/N:</span>
          {serialNumber ? (
            <span className="font-mono font-semibold text-blue-500">{serialNumber}</span>
          ) : (
            <span className="font-mono text-[11px] text-slate-500 italic">Not recorded</span>
          )}
        </div>

        {/* Customer Name (if defined) */}
        {customerName && (
          <div
            className={`hidden md:flex items-center rounded border px-2.5 py-1 ${
              isDark
                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="Customer Name"
          >
            <User className="w-3 h-3 text-blue-500 mr-1.5" />
            <span className="text-[11px] max-w-[120px] truncate">{customerName}</span>
          </div>
        )}

        {/* Job Number (if defined) */}
        {jobNumber && (
          <div
            className={`hidden sm:flex items-center rounded border px-2.5 py-1 ${
              isDark
                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="Job Number"
          >
            <Briefcase className="w-3 h-3 text-blue-500 mr-1.5" />
            <span className="font-mono text-[11px]">{jobNumber}</span>
          </div>
        )}

        {/* Part Number (if defined) */}
        {partNumber && (
          <div
            className={`hidden lg:flex items-center rounded border px-2.5 py-1 ${
              isDark
                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="Part Number"
          >
            <Tag className="w-3 h-3 text-blue-500 mr-1.5" />
            <span className="font-mono text-[11px]">{partNumber}</span>
          </div>
        )}

        {/* Tech Selector Dropdown */}
        <TechSelector
          currentOperator={operatorName}
          isAdmin={isAdmin}
          theme={theme}
          onSelectOperator={onChangeOperator}
        />
      </div>
    </div>
  );
};
