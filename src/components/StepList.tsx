import React, { useState } from 'react';
import { WorkflowStep, WorkflowStage, StepStatus } from '../types/traveller';
import { CheckCircle2, Clock, CircleDashed, PlusCircle, GripVertical } from 'lucide-react';

interface StepListProps {
  steps: WorkflowStep[];
  activeStage: WorkflowStage;
  selectedStepId: string | null;
  isAdmin?: boolean;
  theme?: 'dark' | 'light';
  onSelectStep: (step: WorkflowStep) => void;
  onOpenAddStep?: () => void;
  onReorderSteps?: (reorderedSteps: WorkflowStep[]) => void;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  activeStage,
  selectedStepId,
  isAdmin = false,
  theme = 'dark',
  onSelectStep,
  onOpenAddStep,
  onReorderSteps
}) => {
  const currentStageSteps = steps.filter((s) => s.stage === activeStage);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'Complete':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isDark
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Complete</span>
          </span>
        );
      case 'In Progress':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isDark
                ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>In Progress</span>
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isDark
                ? 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <CircleDashed className="w-3 h-3 text-slate-400" />
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

  // Drag and drop handlers for Admin reordering
  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    if (!isAdmin) return;
    setDraggedStepId(stepId);
    e.dataTransfer.setData('text/plain', stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stepId: string) => {
    if (!isAdmin || !draggedStepId || draggedStepId === stepId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStepId(stepId);
  };

  const handleDragLeave = () => {
    setDragOverStepId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStepId: string) => {
    if (!isAdmin || !draggedStepId || draggedStepId === targetStepId || !onReorderSteps) {
      setDraggedStepId(null);
      setDragOverStepId(null);
      return;
    }
    e.preventDefault();

    const fromIdx = currentStageSteps.findIndex((s) => s.id === draggedStepId);
    const toIdx = currentStageSteps.findIndex((s) => s.id === targetStepId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const reordered = [...currentStageSteps];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);

      // Merge back into full steps list while preserving positions of other stages
      let stageIndex = 0;
      const newFullSteps = steps.map((s) => {
        if (s.stage === activeStage) {
          const replacement = reordered[stageIndex];
          stageIndex++;
          return replacement;
        }
        return s;
      });

      onReorderSteps(newFullSteps);
    }

    setDraggedStepId(null);
    setDragOverStepId(null);
  };

  return (
    <div
      className={`flex flex-col h-full border-r w-full md:w-96 lg:w-[420px] flex-shrink-0 transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Header for Step List */}
      <div
        className={`p-3 border-b flex items-center justify-between transition-colors ${
          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Workflow Steps — {activeStage}
          </h2>
          <p className="text-[11px] text-slate-500">
            {currentStageSteps.length} procedure{currentStageSteps.length === 1 ? '' : 's'} defined
            {isAdmin && <span className="ml-1 text-amber-500 font-medium">(Admin: Drag to reorder)</span>}
          </p>
        </div>

        {/* + Add Step: Visible ONLY when user selects Admin */}
        {isAdmin && onOpenAddStep && (
          <button
            type="button"
            onClick={onOpenAddStep}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center space-x-1 shadow transition-colors"
            title="Admin: Add a custom step to this stage"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-100" />
            <span>+ Add Step</span>
          </button>
        )}
      </div>

      {/* Steps List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {currentStageSteps.map((step, index) => {
          const isSelected = selectedStepId === step.id;
          const isComplete = step.status === 'Complete';
          const isDragged = draggedStepId === step.id;
          const isOver = dragOverStepId === step.id;

          return (
            <div
              key={step.id}
              draggable={isAdmin}
              onDragStart={(e) => handleDragStart(e, step.id)}
              onDragOver={(e) => handleDragOver(e, step.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, step.id)}
              onClick={() => onSelectStep(step)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2.5 group cursor-pointer ${
                isDragged ? 'opacity-40 scale-98' : ''
              } ${isOver ? 'border-amber-400 border-2' : ''} ${
                isSelected
                  ? isDark
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400/40'
                  : isComplete
                  ? isDark
                    ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:bg-slate-100/60'
                  : isDark
                  ? 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {/* Admin drag grip handle */}
                {isAdmin && (
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-amber-400 p-0.5 mt-0.5"
                    title="Click and drag to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Step index badge */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5 flex-shrink-0 ${
                    isComplete
                      ? isDark
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isSelected
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-semibold transition-colors truncate ${
                      isDark
                        ? 'text-slate-200 group-hover:text-blue-300'
                        : 'text-slate-800 group-hover:text-blue-600'
                    }`}
                  >
                    {step.name}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(step.status)}
                  </div>

                  {/* Completion Timestamp */}
                  <div className="mt-1.5 text-[10px] font-mono flex items-center gap-1 text-slate-500">
                    <span>Completed:</span>
                    <span
                      className={
                        step.completedAt
                          ? isDark
                            ? 'text-slate-300 font-medium'
                            : 'text-slate-700 font-medium'
                          : 'text-slate-400 italic'
                      }
                    >
                      {formatTimestamp(step.completedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {currentStageSteps.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500">
            No steps defined in this tab yet.
            {isAdmin && ' Click "+ Add Step" above to add procedures.'}
          </div>
        )}
      </div>
    </div>
  );
};
