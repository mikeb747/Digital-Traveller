import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { OperationStep, NCRRecord, NCRSeverity, NCRDisposition } from '../types';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface NCRModalProps {
  step?: OperationStep | null;
  existingNCR?: NCRRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NCRModal: React.FC<NCRModalProps> = ({
  step,
  existingNCR,
  isOpen,
  onClose,
}) => {
  const { raiseNCR, dispositionNCR, closeNCR, activeTechnician } = useTraveller();

  // Mode: raising a new NCR or dispositioning an existing one
  const isDispositionMode = Boolean(existingNCR);

  // Form states for new NCR
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<NCRSeverity>('major');

  // Form states for dispositioning
  const [disposition, setDisposition] = useState<NCRDisposition>(existingNCR?.disposition || 'rework');
  const [dispositionNotes, setDispositionNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDispositionMode && existingNCR) {
      if (!dispositionNotes.trim()) {
        alert('Please enter engineering justification or disposition notes.');
        return;
      }
      dispositionNCR(existingNCR.id, disposition, dispositionNotes);
      onClose();
    } else if (step) {
      if (!title.trim() || !description.trim()) {
        alert('Please provide both title and discrepancy description.');
        return;
      }
      raiseNCR({
        stepId: step.id,
        stepOpCode: step.opCode,
        title,
        description,
        severity,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          severity === 'critical' ? 'bg-rose-950/70 border-rose-800' : 'bg-amber-950/60 border-amber-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              <AlertTriangle className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isDispositionMode ? `Disposition NCR: ${existingNCR?.id}` : 'Raise Non-Conformance Report (NCR)'}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {isDispositionMode ? existingNCR?.title : `Step: ${step?.opCode} - ${step?.title}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isDispositionMode ? (
            <>
              {/* Severity Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discrepancy Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('minor')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      severity === 'minor'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    Minor (Cosmetic)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('major')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      severity === 'major'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    Major (Tolerance)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('critical')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      severity === 'critical'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    Critical (Safety/Stop)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discrepancy Summary / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Solder bridging on U2 pins 14-16 / Torque stripped boss"
                  className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Defect Findings &amp; Parametric Deviations
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise measurements, pin locations, failure modes, and observed anomalies..."
                  className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Filing an NCR will immediately place this traveler into <strong>Quality Hold</strong> and halt forward operation progression until formally dispositioned.
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Disposition Form */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="text-slate-400">Opened By: <span className="text-slate-200">{existingNCR?.openedBy}</span></div>
                <div className="text-slate-400">Severity: <span className="text-amber-300 uppercase font-bold">{existingNCR?.severity}</span></div>
                <div className="text-slate-400">Defect: <span className="text-slate-200">{existingNCR?.description}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Engineering / MRB Disposition
                </label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as NCRDisposition)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                >
                  <option value="rework">Rework to Drawing (Return to Tech Workbench)</option>
                  <option value="use_as_is">Use-As-Is (Engineering Concession Approved)</option>
                  <option value="scrap">Scrap Assembly (Non-recoverable)</option>
                  <option value="return_to_vendor">Return to Component Vendor (RTV)</option>
                  <option value="mrb_pending">Pending MRB Board Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disposition Justification &amp; Rework Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  placeholder="Specify authorized rework procedure, ECO #, or engineering rationale..."
                  className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {existingNCR?.status === 'dispositioned' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (existingNCR) {
                        closeNCR(existingNCR.id);
                        onClose();
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verify Rework Complete &amp; Close NCR
                  </button>
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-md transition-colors ${
                isDispositionMode
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : severity === 'critical'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {isDispositionMode ? 'Submit Disposition' : 'Authorize & Open NCR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
