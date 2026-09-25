import React from 'react';
import { useTraveller } from '../context/TravellerContext';
import {
  Search,
  Filter,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

interface TravellerListProps {
  onSelectTraveller: (id: string) => void;
  onOpenNewTraveller: () => void;
}

export const TravellerList: React.FC<TravellerListProps> = ({
  onSelectTraveller,
  onOpenNewTraveller,
}) => {
  const {
    travellers,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useTraveller();

  // Filtered list
  const filtered = travellers.filter((trav) => {
    const matchesSearch =
      trav.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trav.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trav.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trav.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trav.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || trav.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by WO#, Serial #, Part #, Customer, or Nomenclature..."
            className="w-full bg-slate-950 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'in_progress', 'quality_hold', 'ready', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewTraveller}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Traveler</span>
          </button>
        </div>
      </div>

      {/* Grid of Traveler Work Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((trav) => {
          const completedCount = trav.steps.filter((s) => s.status === 'passed').length;
          const progressPercent = Math.round((completedCount / trav.steps.length) * 100);
          const openNCRs = trav.ncrs.filter((n) => n.status === 'open' || n.status === 'under_review');

          return (
            <div
              key={trav.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row: WO, S/N, and status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-sm font-bold text-blue-400">{trav.workOrderNumber}</span>
                      <span className="text-xs text-slate-400 font-mono">•</span>
                      <span className="text-xs font-bold text-slate-200">{trav.serialNumber}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {trav.partNumber} ({trav.revision})
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                    trav.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : trav.status === 'quality_hold'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                      : trav.status === 'rework'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {trav.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Part title */}
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {trav.partName}
                </h3>

                {/* Customer and Program */}
                <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                  <span>Customer: <strong className="text-slate-300">{trav.customer}</strong></span>
                  <span>Program: <strong className="text-slate-300">{trav.program}</strong></span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Routing: Op {trav.currentStepIndex + 1} of {trav.steps.length}</span>
                    <span className="text-white font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Open NCR Alert tag if any */}
                {openNCRs.length > 0 && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300 flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{openNCRs.length} OPEN DISCREPANCY (HOLD ACTIVE)</span>
                  </div>
                )}
              </div>

              {/* Bottom footer button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Target: {trav.targetCompletionDate}
                </span>

                <button
                  onClick={() => onSelectTraveller(trav.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Open in Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
