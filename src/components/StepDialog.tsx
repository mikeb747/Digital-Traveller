import React, { useState, useEffect } from 'react';
import { WorkflowStep, StepStatus } from '../types/traveller';
import { 
  X, CheckCircle, Clock, RotateCcw, AlertTriangle, FileText, 
  CheckSquare, Square, Check, UserCheck
} from 'lucide-react';

interface StepDialogProps {
  step: WorkflowStep | null;
  operatorName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (stepId: string, status: StepStatus, notes?: string) => void;
  onToggleChecklist: (stepId: string, checklistId: string) => void;
  onUpdateMeasurement: (stepId: string, paramIndex: number, value: string) => void;
}

export const StepDialog: React.FC<StepDialogProps> = ({
  step,
  operatorName,
  isOpen,
  onClose,
  onUpdateStatus,
  onToggleChecklist,
  onUpdateMeasurement
}) => {
  if (!isOpen || !step) return null;

  const [notes, setNotes] = useState(step.notes || '');

  // Keep notes synchronized when step changes
  useEffect(() => {
    setNotes(step.notes || '');
  }, [step]);

  const handleMarkComplete = () => {
    onUpdateStatus(step.id, 'Complete', notes);
    onClose();
  };

  const handleMarkInProgress = () => {
    onUpdateStatus(step.id, 'In Progress', notes);
    onClose();
  };

  const handleReset = () => {
    onUpdateStatus(step.id, 'Not Started', notes);
    onClose();
  };

  const handleCloseWithoutCompleting = () => {
    // Preserve any notes changes without forcing completion
    if (notes !== step.notes) {
      onUpdateStatus(step.id, step.status, notes);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Windows Fluent Style Modal Header */}
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">
                Procedure Instructions — {step.stage}
              </span>
              <h2 className="text-sm font-semibold text-slate-100">{step.name}</h2>
            </div>
          </div>

          <button
            onClick={handleCloseWithoutCompleting}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            title="Close Without Completing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Current Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  step.status === 'Complete'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : step.status === 'In Progress'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {step.status}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {step.completedAt ? (
                <span className="text-emerald-400">Done: {new Date(step.completedAt).toLocaleString()}</span>
              ) : step.startedAt ? (
                <span className="text-amber-400">Started: {new Date(step.startedAt).toLocaleString()}</span>
              ) : (
                <span className="text-slate-500">Not started yet</span>
              )}
            </div>
          </div>

          {/* Standard Operating Instructions */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Standard Operating Instructions</span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3.5 border border-slate-800/80 space-y-2 leading-relaxed">
              {step.instructions && step.instructions.length > 0 ? (
                step.instructions.map((inst, i) => (
                  <div key={i} className="flex items-start space-x-2.5">
                    <span className="font-mono text-blue-400 font-bold text-[11px] mt-0.5">{i + 1}.</span>
                    <span className="text-slate-300">{inst}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No instructions specified for this workflow step.</p>
              )}
            </div>
          </div>

          {/* Verification Checklist */}
          {step.checklist && step.checklist.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verification Checklist</span>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 divide-y divide-slate-800/60">
                {step.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleChecklist(step.id, item.id)}
                    className="w-full text-left py-2 px-2.5 flex items-center space-x-3 hover:bg-slate-800/40 rounded transition-colors group"
                  >
                    {item.done ? (
                      <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${item.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Measurements / Parameter Tolerances (if applicable) */}
          {step.measuredData && step.measuredData.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                Metrology & Parameter Verification
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/80 space-y-2">
                <div className="grid grid-cols-12 text-[10px] uppercase font-mono text-slate-500 font-semibold px-2">
                  <div className="col-span-5">Parameter</div>
                  <div className="col-span-4">Tolerance / Target</div>
                  <div className="col-span-3">Recorded Value</div>
                </div>
                {step.measuredData.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800">
                    <div className="col-span-5 font-medium text-slate-200">{item.parameter}</div>
                    <div className="col-span-4 font-mono text-slate-400 text-[11px]">{item.tolerance || 'N/A'}</div>
                    <div className="col-span-3 flex items-center space-x-1">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => onUpdateMeasurement(step.id, idx, e.target.value)}
                        placeholder="Value"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Notes & Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase tracking-wide">
              Technician Notes / Non-Conformance Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter calibration observations, serial components, or remarks..."
              className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-950/90 px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Left Actions: Reset / Status transition */}
          <div className="flex items-center space-x-2">
            {step.status !== 'Not Started' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center space-x-1 transition-colors"
                title="Reset step to Not Started"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {step.status !== 'In Progress' && (
              <button
                type="button"
                onClick={handleMarkInProgress}
                className="px-3 py-1.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 flex items-center space-x-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark In Progress</span>
              </button>
            )}
          </div>

          {/* Right Actions: Close Without Completing & Mark Complete */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleCloseWithoutCompleting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
            >
              Close Without Completing
            </button>

            <button
              type="button"
              onClick={handleMarkComplete}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Complete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
