import React, { useRef, useState } from 'react';
import { X, Settings, Download, Upload, CheckCircle2, AlertCircle, Layers, FileCode } from 'lucide-react';
import { SystemType, TravellerRecord, WorkflowStep } from '../types/traveller';
import { WorkflowTemplateService, WorkflowTemplate } from '../services/workflowTemplateService';

interface AdminSettingsModalProps {
  isOpen: boolean;
  system: SystemType;
  traveller: TravellerRecord;
  theme?: 'dark' | 'light';
  onClose: () => void;
  onApplyWorkflows: (newStages: string[], newSteps: WorkflowStep[]) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  system,
  traveller,
  theme = 'dark',
  onClose,
  onApplyWorkflows
}) => {
  if (!isOpen) return null;

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  // Get active template from service
  const template = WorkflowTemplateService.getTemplate(system);
  const currentStages = traveller.stages && traveller.stages.length > 0 ? traveller.stages : template.stages;

  // Handle Save Workflows (Export JSON)
  const handleSaveWorkflows = () => {
    try {
      // Build current workflow template snapshot from active traveller
      const templateToSave: WorkflowTemplate = {
        system,
        stages: [...currentStages],
        steps: traveller.steps.map((s) => ({
          name: s.name,
          stage: s.stage,
          instructions: [...s.instructions],
          checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
          measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
        })),
        version: '1.2.0',
        lastUpdated: new Date().toISOString()
      };

      WorkflowTemplateService.saveTemplate(templateToSave);

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templateToSave, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Workflows_${system}_Template.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setMessage({
        type: 'success',
        text: `Workflows for ${system} saved and exported successfully.`
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Failed to save workflows: ${err.message || 'Unknown error'}`
      });
    }
  };

  // Handle Load Workflows (Import JSON)
  const handleLoadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed.stages) || !Array.isArray(parsed.steps)) {
          throw new Error('Invalid workflow file: Must contain "stages" and "steps" arrays.');
        }

        // Save imported template
        const importedTemplate: WorkflowTemplate = {
          system,
          stages: parsed.stages,
          steps: parsed.steps,
          version: parsed.version || '1.2.0',
          lastUpdated: new Date().toISOString()
        };

        WorkflowTemplateService.saveTemplate(importedTemplate);

        // Map to active traveller steps
        const newWorkflowSteps: WorkflowStep[] = importedTemplate.steps.map((stepDef, idx) => ({
          name: stepDef.name,
          stage: stepDef.stage,
          instructions: Array.isArray(stepDef.instructions) ? [...stepDef.instructions] : [],
          checklist: stepDef.checklist ? stepDef.checklist.map((c) => ({ ...c, done: false })) : [],
          measuredData: stepDef.measuredData ? stepDef.measuredData.map((m) => ({ ...m, value: '' })) : [],
          id: `step-${system}-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          status: 'Not Started',
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: ''
        }));

        onApplyWorkflows(importedTemplate.stages, newWorkflowSteps);

        setMessage({
          type: 'success',
          text: `Successfully loaded ${newWorkflowSteps.length} workflow steps across ${importedTemplate.stages.length} tabs for ${system}.`
        });
        setTimeout(() => setMessage(null), 4000);
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: `Failed to load workflow file: ${err.message || 'Invalid JSON format'}`
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between select-none ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Settings className="w-4 h-4 text-amber-400" />
            <div>
              <h3
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                Workflow Settings — {system}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-black hover:bg-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Status Message */}
          {message && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center space-x-2 animate-in fade-in ${
                message.type === 'success'
                  ? isDark
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : isDark
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* System Info Box */}
          <div
            className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Current Instrument: <strong>{system}</strong></span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentStages.length} Tabs defined &bull; {traveller.steps.length} Workflow Procedures
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Admin Mode
              </span>
            </div>
          </div>

          {/* Action Buttons: Save Workflows and Load Workflows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Save Workflows */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold mb-1">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Save Workflows</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export the active system's tabs, workflow steps, and verification instructions as a JSON template file.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveWorkflows}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Workflows (.json)</span>
              </button>
            </div>

            {/* Load Workflows */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold mb-1">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Load Workflows</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Load an external workflow JSON template file into this system, replacing or updating tabs and steps.
                </p>
              </div>

              {/* Hidden file input for loading workflows */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLoadFileChange}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load Workflows (.json)</span>
              </button>
            </div>
          </div>

          {/* Current Workflow Overview */}
          <div className="pt-2">
            <h4
              className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Active Tabs & Procedures
            </h4>

            <div
              className={`max-h-48 overflow-y-auto rounded-lg border divide-y ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800 divide-slate-800/60 text-slate-300'
                  : 'bg-slate-50 border-slate-200 divide-slate-200 text-slate-700'
              }`}
            >
              {currentStages.map((stage) => {
                const stageSteps = traveller.steps.filter((s) => s.stage === stage);
                return (
                  <div key={stage} className="p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-blue-500">{stage}</span>
                      <span className="text-[10px] text-slate-500">
                        {stageSteps.length} step{stageSteps.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    {stageSteps.length > 0 ? (
                      <div className="space-y-1 pl-2">
                        {stageSteps.map((step, idx) => (
                          <div key={step.id} className="text-[11px] text-slate-400 truncate">
                            <span className="font-mono text-slate-500 mr-1">{idx + 1}.</span>
                            <span>{step.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic pl-2">No steps in this tab</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3 border-t flex justify-end ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isDark ? 'bg-slate-800 text-slate-200 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
