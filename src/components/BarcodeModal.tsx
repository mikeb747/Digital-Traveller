import React, { useState } from 'react';
import { X, QrCode, Scan, Check, Sparkles, RefreshCw } from 'lucide-react';
import { SystemType } from '../types/traveller';

interface BarcodeModalProps {
  isOpen: boolean;
  currentSerial: string;
  currentSystem: SystemType;
  onClose: () => void;
  onUpdateSerial: (newSerial: string) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  currentSerial,
  currentSystem,
  onClose,
  onUpdateSerial
}) => {
  if (!isOpen) return null;

  const [inputSerial, setInputSerial] = useState(currentSerial);
  const [isScanningSim, setIsScanningSim] = useState(false);

  const prefix = currentSystem.toUpperCase().slice(0, 3);
  const sampleSerials = [
    `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
    `${prefix}-782194`,
    `${prefix}-904812`,
    `${prefix}-315609`
  ];

  const handleSimulateScan = (serialToUse?: string) => {
    setIsScanningSim(true);
    setTimeout(() => {
      const generated = serialToUse || `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      setInputSerial(generated);
      setIsScanningSim(false);
    }, 700);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSerial.trim()) {
      onUpdateSerial(inputSerial.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Barcode / Serial Scanner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs text-slate-300">
          {/* Simulated Scanner Viewport */}
          <div className="relative bg-slate-950 rounded-lg p-6 border border-slate-800 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Visual Laser Line Animation */}
            <div className={`absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] transition-all duration-700 ${
              isScanningSim ? 'top-1/2 opacity-100 animate-pulse' : 'top-1/3 opacity-40'
            }`} />

            <Scan className={`w-12 h-12 text-slate-600 mb-2 ${isScanningSim ? 'animate-pulse text-red-400' : ''}`} />

            <div className="font-mono text-xs text-slate-400">
              {isScanningSim ? 'Reading Code 128 / DataMatrix...' : 'Optical Barcode Reader Active'}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              Supports 1D Barcode, Code 39, QR and DataMatrix
            </div>

            <button
              type="button"
              onClick={() => handleSimulateScan()}
              disabled={isScanningSim}
              className="mt-3 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3 h-3 ${isScanningSim ? 'animate-spin' : ''}`} />
              <span>Simulate Hardware Laser Scan</span>
            </button>
          </div>

          {/* Manual Entry or Scanned Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Scanned Instrument Serial Number
            </label>
            <input
              type="text"
              value={inputSerial}
              onChange={(e) => setInputSerial(e.target.value)}
              placeholder="e.g. INV-892401"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Preset Sample Barcodes */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Quick Production Tags:</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {sampleSerials.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSimulateScan(s)}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Serial Number</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
