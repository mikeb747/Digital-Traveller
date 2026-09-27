import React from 'react';
import { TravellerRecord, WorkflowStep } from '../types/traveller';
import { History, ArrowUpRight, Info, ExternalLink } from 'lucide-react';

interface TravellerSummaryProps {
  traveller: TravellerRecord;
  selectedStep: WorkflowStep | null;
  theme?: 'dark' | 'light';
  onOpenStepDialog: (step: WorkflowStep) => void;
}

export const TravellerSummary: React.FC<TravellerSummaryProps> = ({
  traveller,
  selectedStep,
  theme = 'dark',
  onOpenStepDialog
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-5 transition-colors ${
        isDark ? 'bg-slate-900/40' : 'bg-slate-100/60'
      }`}
    >
      {/* Selected Step Inspector Box (Clickable to open Step Dialog) */}
      {selectedStep ? (
        <div
          onClick={() => onOpenStepDialog(selectedStep)}
          className={`rounded-xl p-5 border shadow-xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.005] group ${
            isDark
              ? 'bg-slate-900/90 border-blue-500/40 hover:border-blue-400'
              : 'bg-white border-blue-300 hover:border-blue-500 shadow-md'
          }`}
          title="Click to open execution procedure and complete task"
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                Current Step ({selectedStep.stage})
              </span>
              <h3
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-100 group-hover:text-blue-300' : 'text-slate-800 group-hover:text-blue-600'
                }`}
              >
                <span>{selectedStep.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 opacity-70 group-hover:opacity-100" />
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2.5 py-1 rounded font-semibold ${
                  selectedStep.status === 'Complete'
                    ? isDark
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : selectedStep.status === 'In Progress'
                    ? isDark
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {selectedStep.status}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStepDialog(selectedStep);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow transition-all flex items-center space-x-1"
              >
                <span>Open Step Dialog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Instructions Summary */}
          <div className="mt-3 space-y-2">
            <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Instructions (click box to edit / execute):
            </h4>
            <ul
              className={`text-xs space-y-1 list-disc list-inside ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {selectedStep.instructions.map((inst, idx) => (
                <li key={idx} className="leading-relaxed">
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Step Details & Notes */}
          <div
            className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <div>
              <span>Completion Timestamp: </span>
              <strong className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {selectedStep.completedAt ? new Date(selectedStep.completedAt).toLocaleString() : 'Not completed'}
              </strong>
            </div>

            {selectedStep.technician && (
              <div>
                <span>Signed By: </span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  {selectedStep.technician}
                </strong>
              </div>
            )}

            {selectedStep.notes && (
              <div
                className={`w-full mt-2 p-2.5 rounded border text-[11px] ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-semibold">Notes:</span> {selectedStep.notes}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl p-8 border text-center flex flex-col items-center justify-center space-y-2 ${
            isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white border-slate-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Info className="w-5 h-5 text-blue-500" />
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Select any workflow step from the left panel
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm">
            Clicking a task on the left selects it. Click on the box here to open the execution dialog, view instructions, or record measurements.
          </p>
        </div>
      )}

      {/* Production Audit Trail / History */}
      <div
        className={`rounded-xl p-4 border shadow-md ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-500" />
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Calibration & Build Audit Trail
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {traveller.auditLog.length} events logged
          </span>
        </div>

        <div
          className={`mt-3 max-h-72 overflow-y-auto divide-y text-xs ${
            isDark ? 'divide-slate-800/60' : 'divide-slate-100'
          }`}
        >
          {traveller.auditLog.map((log, index) => (
            <div
              key={index}
              className={`py-2 px-1 flex items-start justify-between gap-3 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <div className={`font-medium text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {log.action}
                  </div>
                  <div className="text-[10px] text-slate-500">User: {log.user}</div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
