import React, { useState, useEffect } from 'react';
import { useTraveller } from '../context/TravellerContext';
import {
  Wrench,
  ShieldCheck,
  UserCheck,
  QrCode,
  RotateCcw,
  Clock,
  Layers,
  AlertTriangle,
  FileCheck2,
  Gauge
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'workbench' | 'travellers' | 'ncrs' | 'tools' | 'coc';
  setCurrentTab: (tab: 'workbench' | 'travellers' | 'ncrs' | 'tools' | 'coc') => void;
  onOpenScanner: () => void;
  onOpenNewTraveller: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenScanner,
  onOpenNewTraveller,
}) => {
  const {
    activeTechnician,
    setActiveTechnician,
    technicians,
    activeTraveller,
    travellers,
    resetToFactoryDefaults
  } = useTraveller();

  // Current live time
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Total open NCRs count
  const totalOpenNCRs = travellers.reduce(
    (acc, t) => acc + t.ncrs.filter((n) => n.status === 'open' || n.status === 'under_review').length,
    0
  );

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* Top Banner: Workbench Station Info & Operator */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-inner">
            <Wrench className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                DIGITAL TRAVELLER
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Workbench Live
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Station: <strong className="text-slate-200">{activeTechnician.station}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Shop Floor Cell #4</span>
            </div>
          </div>
        </div>

        {/* Right side: Time, Barcode Scan, Technician Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{time} UTC</span>
          </div>

          {/* Quick Scan Barcode Button */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
            title="Scan traveler routing barcode or serialized part tag"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Scan Traveler / S/N</span>
          </button>

          {/* Active Technician Selector */}
          <div className="relative flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1 text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px]">
              {activeTechnician.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col text-left">
              <label htmlFor="tech-select" className="sr-only">Active Operator</label>
              <select
                id="tech-select"
                value={activeTechnician.id}
                onChange={(e) => {
                  const found = technicians.find((t) => t.id === e.target.value);
                  if (found) setActiveTechnician(found);
                }}
                className="bg-transparent text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs pr-2"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.name} ({t.badgeId}) - {t.role.split(' ')[0]}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {activeTechnician.certifications[0]}
              </span>
            </div>
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('Reset Digital Traveller workbench to default demo state?')) {
                resetToFactoryDefaults();
              }
            }}
            className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset workbench data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5" aria-label="Tabs">
          <button
            onClick={() => setCurrentTab('workbench')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'workbench'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Active Workbench</span>
            {activeTraveller && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded bg-black/30 font-mono hidden md:inline">
                {activeTraveller.workOrderNumber}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('travellers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'travellers'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Travelers</span>
            <span className="ml-0.5 text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {travellers.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('ncrs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'ncrs'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${totalOpenNCRs > 0 ? 'text-amber-400' : ''}`} />
            <span>NCR Discrepancies</span>
            {totalOpenNCRs > 0 && (
              <span className="ml-0.5 text-[11px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold font-mono">
                {totalOpenNCRs} OPEN
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('tools')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'tools'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Calibrated Tools</span>
          </button>

          <button
            onClick={() => setCurrentTab('coc')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentTab === 'coc'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Cert of Conformance</span>
          </button>
        </nav>

        {/* Create Work Order Button */}
        <button
          onClick={onOpenNewTraveller}
          className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <span>+ New Traveler</span>
        </button>
      </div>
    </header>
  );
};
