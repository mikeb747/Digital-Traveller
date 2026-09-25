import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { QrCode, X, Search, Check, ArrowRight } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode?: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectCode,
}) => {
  const { travellers, setActiveTravellerId } = useTraveller();
  const [scanInput, setScanInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    if (onSelectCode) {
      onSelectCode(clean);
      onClose();
      return;
    }

    // Try finding traveler by work order, serial number, or part number
    const found = travellers.find(
      (t) =>
        t.workOrderNumber.toLowerCase() === clean.toLowerCase() ||
        t.serialNumber.toLowerCase() === clean.toLowerCase() ||
        t.partNumber.toLowerCase() === clean.toLowerCase()
    );

    if (found) {
      setActiveTravellerId(found.id);
      setFeedback(`Found Traveler: ${found.workOrderNumber} (${found.partName})`);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback(`No traveler found matching code "${clean}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Shop Floor Barcode Scanner</h3>
              <p className="text-[11px] text-slate-400">Scan or simulate 1D/2D Serialized Unit &amp; Routing Tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Scanner Optical Reticle Simulation */}
          <div className="relative h-32 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"></div>
            <div className="text-center z-10 space-y-1">
              <QrCode className="w-8 h-8 text-slate-600 mx-auto opacity-70" />
              <p className="text-[11px] text-slate-400 font-mono">OPTICAL SENSOR READY</p>
            </div>
          </div>

          {/* Manual Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(scanInput);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              autoFocus
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan barcode or type S/N (e.g. SN-AVC-990142)..."
              className="flex-1 bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Scan
            </button>
          </form>

          {feedback && (
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Quick Click Samples */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Quick Barcode Presets:
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {travellers.map((trav) => (
                <button
                  key={trav.id}
                  onClick={() => handleLookup(trav.serialNumber)}
                  className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between text-xs group"
                >
                  <div>
                    <span className="font-mono text-blue-400 font-semibold">{trav.serialNumber}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">[{trav.workOrderNumber}]</span>
                    <div className="text-[10px] text-slate-400 truncate max-w-[260px]">{trav.partName}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
