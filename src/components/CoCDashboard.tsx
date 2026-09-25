import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { DigitalTraveller } from '../types';
import { PrintableRunSheetModal } from './PrintableRunSheetModal';
import { FileCheck2, Printer, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export const CoCDashboard: React.FC = () => {
  const { travellers } = useTraveller();
  const [selectedTraveller, setSelectedTraveller] = useState<DigitalTraveller | null>(null);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>Certificates of Conformance &amp; Traveler Archive</span>
          </h2>
          <p className="text-xs text-slate-400">
            Official quality acceptance documents, AS9100 customer release packages, and electronic run sheets
          </p>
        </div>
      </div>

      {/* Grid of Travellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {travellers.map((trav) => {
          const isComplete = trav.status === 'completed';
          const completedCount = trav.steps.filter((s) => s.status === 'passed').length;

          return (
            <div
              key={trav.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isComplete
                  ? 'bg-slate-900 border-emerald-900/60 shadow-emerald-950/10'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-blue-400">
                    {trav.workOrderNumber} • <span className="text-white">{trav.serialNumber}</span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                    isComplete
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isComplete ? 'CERTIFIED CONFORMING' : 'ROUTING IN PROGRESS'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">
                  {trav.partName}
                </h3>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Customer: <strong className="text-slate-300">{trav.customer}</strong></div>
                  <div>Part Number: <strong className="text-slate-300 font-mono">{trav.partNumber} ({trav.revision})</strong></div>
                  <div>Signed Milestones: <strong className="text-slate-300 font-mono">{completedCount} of {trav.steps.length} ops</strong></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {isComplete ? 'CoC Released' : 'Preliminary Run Sheet'}
                </span>

                <button
                  onClick={() => setSelectedTraveller(trav)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View &amp; Print CoC</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTraveller && (
        <PrintableRunSheetModal
          traveller={selectedTraveller}
          isOpen={Boolean(selectedTraveller)}
          onClose={() => setSelectedTraveller(null)}
        />
      )}
    </div>
  );
};
