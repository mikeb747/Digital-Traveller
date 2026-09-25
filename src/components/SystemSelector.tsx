import React from 'react';
import { SystemType } from '../types/traveller';
import { SYSTEM_PROFILES } from '../services/defaultWorkflows';
import { QrCode, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface SystemSelectorProps {
  currentSystem: SystemType;
  serialNumber: string;
  workOrderNumber: string;
  operatorName: string;
  onSelectSystem: (system: SystemType) => void;
  onOpenBarcodeModal: () => void;
  onChangeOperator: (name: string) => void;
}

export const SystemSelector: React.FC<SystemSelectorProps> = ({
  currentSystem,
  serialNumber,
  workOrderNumber,
  operatorName,
  onSelectSystem,
  onOpenBarcodeModal,
  onChangeOperator
}) => {
  const profile = SYSTEM_PROFILES[currentSystem];
  const systems: SystemType[] = ['InVia', 'Virsa', 'inLux'];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
      {/* Left: System Selector Radio Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          <span>System:</span>
        </div>

        <div className="inline-flex rounded-lg bg-slate-950/80 p-1 border border-slate-800 shadow-inner">
          {systems.map(sys => {
            const isSelected = currentSystem === sys;
            return (
              <button
                key={sys}
                onClick={() => onSelectSystem(sys)}
                className={`relative px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{sys}</span>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex flex-col">
          <span className="text-xs text-slate-200 font-medium">{profile.displayName}</span>
          <span className="text-[11px] text-slate-400">{profile.tagline}</span>
        </div>
      </div>

      {/* Right: Hardware Identification & Operator Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {/* Serial Number & Barcode Scanner */}
        <div className="flex items-center rounded bg-slate-950/80 border border-slate-800 px-2.5 py-1">
          <span className="text-slate-400 text-[11px] mr-1.5">S/N:</span>
          <span className="font-mono font-semibold text-blue-300 mr-2">{serialNumber}</span>
          <button
            onClick={onOpenBarcodeModal}
            className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
            title="Scan or input barcode serial"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Work Order */}
        <div className="hidden sm:flex items-center rounded bg-slate-950/80 border border-slate-800 px-2.5 py-1">
          <span className="text-slate-400 text-[11px] mr-1.5">WO:</span>
          <span className="font-mono text-slate-200">{workOrderNumber}</span>
        </div>

        {/* Operator Badge */}
        <div className="flex items-center rounded bg-slate-950/80 border border-slate-800 px-2 py-0.5">
          <span className="text-slate-400 text-[11px] mr-1.5">Tech:</span>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => onChangeOperator(e.target.value)}
            className="bg-transparent border-0 text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 w-28 sm:w-36 text-xs"
            placeholder="Operator Name"
            title="Click to edit operator/technician name"
          />
        </div>
      </div>
    </div>
  );
};
