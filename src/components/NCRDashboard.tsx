import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { NCRRecord } from '../types';
import { NCRModal } from './NCRModal';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';

interface NCRDashboardProps {
  onSelectTraveller: (id: string) => void;
}

export const NCRDashboard: React.FC<NCRDashboardProps> = ({ onSelectTraveller }) => {
  const { travellers } = useTraveller();
  const [selectedNCR, setSelectedNCR] = useState<NCRRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'dispositioned' | 'closed'>('all');

  // Flatten all NCRs from all travelers with traveler context
  const allNCRs = travellers.flatMap((trav) =>
    trav.ncrs.map((ncr) => ({
      ...ncr,
      travellerWO: trav.workOrderNumber,
      travellerSN: trav.serialNumber,
      travellerPartName: trav.partName,
    }))
  );

  const filtered = allNCRs.filter((ncr) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'open') return ncr.status === 'open' || ncr.status === 'under_review';
    return ncr.status === filterStatus;
  });

  const handleOpenDisposition = (ncr: NCRRecord) => {
    setSelectedNCR(ncr);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Top bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Non-Conformance &amp; Discrepancy Tracking (NCR)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit-logged defect records, Material Review Board (MRB) dispositions, and rework tickets
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['all', 'open', 'dispositioned', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${
                filterStatus === st
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* NCR Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          No Non-Conformance Reports found matching filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ncr) => (
            <div
              key={ncr.id}
              className={`p-4 rounded-xl border transition-all ${
                ncr.severity === 'critical' && ncr.status !== 'closed'
                  ? 'bg-rose-950/20 border-rose-800/80 shadow-rose-950/20'
                  : ncr.status === 'closed'
                  ? 'bg-slate-900/60 border-slate-800 opacity-80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-amber-400">{ncr.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-blue-400">{ncr.travellerWO}</span>
                    <span className="text-slate-400 font-bold">({ncr.travellerSN})</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">Step {ncr.stepOpCode}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{ncr.title}</h3>
                  <div className="text-xs text-slate-400">{ncr.travellerPartName}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                    ncr.severity === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : ncr.severity === 'major'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {ncr.severity}
                  </span>

                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                    ncr.status === 'closed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : ncr.status === 'dispositioned'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                  }`}>
                    {ncr.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Defect Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 mb-3">
                {ncr.description}
              </p>

              {/* Disposition Details if present */}
              {ncr.disposition && (
                <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs mb-3 space-y-1">
                  <div className="text-blue-300 font-mono font-bold">
                    DISPOSITION: <span className="uppercase text-white">{ncr.disposition.replace('_', ' ')}</span>
                  </div>
                  <div className="text-slate-300">{ncr.dispositionNotes}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Authorized by: {ncr.dispositionedBy} on {ncr.dispositionedAt?.slice(0, 10)}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 text-[11px] font-mono">
                  Opened by: <span className="text-slate-200">{ncr.openedBy}</span> on {ncr.openedAt.slice(0, 10)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTraveller(ncr.travellerId)}
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <span>Jump to Traveler</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {ncr.status !== 'closed' && (
                    <button
                      onClick={() => handleOpenDisposition(ncr)}
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
                    >
                      {ncr.status === 'dispositioned' ? 'Verify & Close' : 'Disposition NCR'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disposition Modal */}
      {selectedNCR && (
        <NCRModal
          existingNCR={selectedNCR}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNCR(null);
          }}
        />
      )}
    </div>
  );
};
