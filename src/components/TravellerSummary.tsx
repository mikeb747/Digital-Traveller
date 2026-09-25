import React from 'react';
import { TravellerRecord, WorkflowStep } from '../types/traveller';
import { WorkflowService } from '../services/workflowService';
import { SYSTEM_PROFILES } from '../services/defaultWorkflows';
import { 
  FileCheck, Shield, History, ArrowUpRight, Cpu, 
  Clock, CheckCircle, Info, Sparkles, AlertCircle
} from 'lucide-react';

interface TravellerSummaryProps {
  traveller: TravellerRecord;
  selectedStep: WorkflowStep | null;
  onOpenStepDialog: (step: WorkflowStep) => void;
  onExportJson: () => void;
}

export const TravellerSummary: React.FC<TravellerSummaryProps> = ({
  traveller,
  selectedStep,
  onOpenStepDialog,
  onExportJson
}) => {
  const profile = SYSTEM_PROFILES[traveller.system];
  const overallStats = WorkflowService.getOverallStats(traveller);
  const isComplete = overallStats.total > 0 && overallStats.completed === overallStats.total;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner: Instrument Identity & Completion Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instrument Card */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-900/60 text-blue-300 border border-blue-700/60">
                  {traveller.system} Series
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  WO: {traveller.workOrderNumber}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-1">{profile.displayName}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{profile.description}</p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-2 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspector: <strong className="text-slate-100">{traveller.operatorName}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
              <span>Created: {new Date(traveller.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Progress Metric Card */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Overall Progress
              </span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                isComplete 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}>
                {overallStats.percent}%
              </span>
            </div>

            <div className="mt-3">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                  }`}
                  style={{ width: `${overallStats.percent}%` }}
                />
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
              <span>{overallStats.completed} of {overallStats.total} Steps Complete</span>
              <span>{overallStats.inProgress} In Progress</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onExportJson}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium transition-colors"
            >
              <span>Download Signed JSON Record</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Step Inspector Box or General Guidance */}
      {selectedStep ? (
        <div className="bg-slate-900/90 rounded-xl p-5 border border-blue-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                Selected Step ({selectedStep.stage})
              </span>
              <h3 className="text-sm font-bold text-slate-100">{selectedStep.name}</h3>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2.5 py-1 rounded font-semibold ${
                  selectedStep.status === 'Complete'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : selectedStep.status === 'In Progress'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {selectedStep.status}
              </span>

              <button
                onClick={() => onOpenStepDialog(selectedStep)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow transition-all flex items-center space-x-1"
              >
                <span>Open Step Dialog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Instructions Summary */}
          <div className="mt-3 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Instructions:</h4>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              {selectedStep.instructions.map((inst, idx) => (
                <li key={idx} className="leading-relaxed">{inst}</li>
              ))}
            </ul>
          </div>

          {/* Step Details & Notes */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              <span>Completion Timestamp: </span>
              <strong className="font-mono text-slate-200">
                {selectedStep.completedAt ? new Date(selectedStep.completedAt).toLocaleString() : 'Not completed'}
              </strong>
            </div>

            {selectedStep.notes && (
              <div className="w-full mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                <span className="font-semibold text-slate-400">Notes:</span> {selectedStep.notes}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-xs font-medium text-slate-300">Select any workflow step from the left panel</p>
          <p className="text-[11px] text-slate-500 max-w-sm">
            Click any step in the list to open its execution dialog, view instructions, record calibration measurements, or mark complete.
          </p>
        </div>
      )}

      {/* Production Audit Trail / History */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Calibration & Build Audit Trail
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {traveller.auditLog.length} events logged
          </span>
        </div>

        <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-slate-800/60 text-xs">
          {traveller.auditLog.map((log, index) => (
            <div key={index} className="py-2 px-1 flex items-start justify-between gap-3 text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-200 text-xs">{log.action}</div>
                  <div className="text-[10px] text-slate-500">User: {log.user}</div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
