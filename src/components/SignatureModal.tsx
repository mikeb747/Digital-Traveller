import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { OperationStep } from '../types';
import { CheckCircle2, ShieldCheck, X, FileSignature, AlertCircle } from 'lucide-react';

interface SignatureModalProps {
  step: OperationStep;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  step,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeTechnician, signOffStep } = useTraveller();
  const [notes, setNotes] = useState('');
  const [confirmedTruthful, setConfirmedTruthful] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!confirmedTruthful) {
      setErrorMessage('Please confirm that you have personally inspected and verified all requirements.');
      return;
    }

    const result = signOffStep(step.id, notes);
    if (!result.success) {
      setErrorMessage(result.message || 'Failed to sign off step');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Electronic Traveler Stamp</h3>
              <p className="text-xs text-slate-400 font-mono">{step.opCode}: {step.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSign} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Technician Stamp Preview Card */}
          <div className="p-4 rounded-lg bg-slate-950 border border-blue-900/50 relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              DIGITAL SEAL
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400">Technician: <strong className="text-white">{activeTechnician.name}</strong></div>
              <div className="text-slate-400">Badge ID: <strong className="text-blue-400">{activeTechnician.badgeId}</strong></div>
              <div className="text-slate-400">Station / Work Center: <strong className="text-slate-200">{step.workCenter}</strong></div>
              <div className="text-slate-400">Qualified Skill: <strong className="text-slate-200">{step.requiredSkill}</strong></div>
              <div className="text-slate-400">Timestamp: <strong className="text-slate-300">{new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</strong></div>
            </div>
          </div>

          {/* Optional Workbench Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Technician Notes / Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. All fasteners torqued with CAL-TQ-042; no anomalous resistance observed."
              rows={3}
              className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Compliance Confirmation */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedTruthful}
              onChange={(e) => setConfirmedTruthful(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I certify under penalty of internal audit that the step operations and data recorded above were executed in strict adherence to engineering drawing and quality requirements.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedTruthful}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Electronic Signature &amp; Stamp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
