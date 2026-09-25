import React from 'react';
import { WorkflowStep, WorkflowStage, StepStatus } from '../types/traveller';
import { CheckCircle2, Clock, CircleDashed, ChevronRight, PlusCircle } from 'lucide-react';

interface StepListProps {
  steps: WorkflowStep[];
  activeStage: WorkflowStage;
  selectedStepId: string | null;
  onSelectStep: (step: WorkflowStep) => void;
  onOpenAddStep?: () => void;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  activeStage,
  selectedStepId,
  onSelectStep,
  onOpenAddStep
}) => {
  const currentStageSteps = steps.filter(s => s.stage === activeStage);

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'Complete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Complete</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>In Progress</span>
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <CircleDashed className="w-3 h-3 text-slate-500" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return 'Pending execution';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 w-full md:w-96 lg:w-[420px] flex-shrink-0">
      {/* Header for Step List */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Workflow Steps — {activeStage}
          </h2>
          <p className="text-[11px] text-slate-500">
            {currentStageSteps.length} procedure{currentStageSteps.length === 1 ? '' : 's'} defined
          </p>
        </div>

        {onOpenAddStep && (
          <button
            onClick={onOpenAddStep}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center space-x-1 border border-slate-700/80 transition-colors"
            title="Add a custom step to this stage"
          >
            <PlusCircle className="w-3 h-3 text-blue-400" />
            <span>+ Add Step</span>
          </button>
        )}
      </div>

      {/* Steps List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {currentStageSteps.map((step, index) => {
          const isSelected = selectedStepId === step.id;
          const isComplete = step.status === 'Complete';

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-3 group ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                  : isComplete
                  ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {/* Step index badge */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5 flex-shrink-0 ${
                    isComplete
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      : isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                    {step.name}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(step.status)}
                  </div>

                  {/* Completion Timestamp */}
                  <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="text-slate-500">Completed:</span>
                    <span className={step.completedAt ? 'text-slate-300 font-medium' : 'text-slate-600 italic'}>
                      {formatTimestamp(step.completedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 mt-1 transition-transform flex-shrink-0 ${
                  isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                }`}
              />
            </button>
          );
        })}

        {currentStageSteps.length === 0 && (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            No steps registered for {activeStage}. Click "+ Add Step" to configure a workflow procedure.
          </div>
        )}
      </div>
    </div>
  );
};
