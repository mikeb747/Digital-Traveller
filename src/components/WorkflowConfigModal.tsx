import React, { useState } from 'react';
import { WorkflowStage, TravellerRecord } from '../types/traveller';
import { X, Plus, Trash2, Settings2, CheckCircle2 } from 'lucide-react';

interface WorkflowConfigModalProps {
  isOpen: boolean;
  traveller: TravellerRecord;
  onClose: () => void;
  onAddStep: (stage: WorkflowStage, stepName: string, instructions: string) => void;
}

export const WorkflowConfigModal: React.FC<WorkflowConfigModalProps> = ({
  isOpen,
  traveller,
  onClose,
  onAddStep
}) => {
  if (!isOpen) return null;

  const [targetStage, setTargetStage] = useState<WorkflowStage>('Setup');
  const [stepName, setStepName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepName.trim()) return;

    onAddStep(targetStage, stepName.trim(), instructions.trim());
    setFeedback(`Step "${stepName}" added successfully to ${targetStage}!`);
    setStepName('');
    setInstructions('');

    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const stages: WorkflowStage[] = ['Setup', 'Calibration', 'Final Test & Release'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Workflow Configuration Editor
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Define custom manufacturing, inspection, or quality validation procedures for the current active traveller. All new steps will be tracked in the JSON data model and audit history.
          </div>

          {feedback && (
            <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Target Workflow Stage
              </label>
              <div className="grid grid-cols-3 gap-2">
                {stages.map((stage) => (
                  <button
                    type="button"
                    key={stage}
                    onClick={() => setTargetStage(stage)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      targetStage === stage
                        ? 'bg-blue-600 text-white border-blue-500 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Step Procedure Name
              </label>
              <input
                type="text"
                required
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="e.g. Polarizer Extinction Ratio Verification"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Step Instructions (One instruction per line)
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Install cross-polarizer filter pack&#10;Verify optical attenuation > 10,000:1&#10;Record baseline extinction in dB"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Step to {targetStage}</span>
              </button>
            </div>
          </form>

          {/* Current Stage Steps Overview */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Existing Steps in {targetStage} ({traveller.steps.filter(s => s.stage === targetStage).length})
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {traveller.steps
                .filter(s => s.stage === targetStage)
                .map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300">
                      <strong className="text-blue-400 font-mono mr-1.5">{idx + 1}.</strong>
                      {step.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
                      {step.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
