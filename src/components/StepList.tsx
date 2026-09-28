import React, { useState } from 'react';
import { WorkflowStep, WorkflowStage, StepStatus } from '../types/traveller';
import { CheckCircle2, Clock, CircleDashed, PlusCircle, GripVertical, ArrowDown, ArrowUp } from 'lucide-react';

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
  const [dropTarget, setDropTarget] = useState<{ stepId: string; position: 'before' | 'after' } | null>(null);

  const isDark = theme === 'dark';
  const draggedStep = steps.find((s) => s.id === draggedStepId);

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

  // Drag and drop handlers with custom drag preview image and target line
  const handleDragStart = (e: React.DragEvent, step: WorkflowStep, index: number) => {
    if (!isAdmin) return;
    setDraggedStepId(step.id);
    e.dataTransfer.setData('text/plain', step.id);
    e.dataTransfer.effectAllowed = 'move';

    // Create a custom drag ghost element
    const dragGhost = document.createElement('div');
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-9999px';
    dragGhost.style.left = '-9999px';
    dragGhost.style.padding = '8px 12px';
    dragGhost.style.borderRadius = '8px';
    dragGhost.style.background = isDark ? '#0f172a' : '#ffffff';
    dragGhost.style.border = '2px solid #3b82f6';
    dragGhost.style.color = isDark ? '#f8fafc' : '#0f172a';
    dragGhost.style.fontSize = '12px';
    dragGhost.style.fontWeight = '600';
    dragGhost.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.45)';
    dragGhost.style.display = 'flex';
    dragGhost.style.alignItems = 'center';
    dragGhost.style.gap = '8px';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '99999';

    const indexBadge = document.createElement('span');
    indexBadge.style.background = '#2563eb';
    indexBadge.style.color = '#ffffff';
    indexBadge.style.borderRadius = '9999px';
    indexBadge.style.width = '20px';
    indexBadge.style.height = '20px';
    indexBadge.style.display = 'inline-flex';
    indexBadge.style.alignItems = 'center';
    indexBadge.style.justifyContent = 'center';
    indexBadge.style.fontSize = '10px';
    indexBadge.style.fontWeight = 'bold';
    indexBadge.innerText = String(index + 1);

    const textSpan = document.createElement('span');
    textSpan.innerText = `Moving: ${step.name}`;

    dragGhost.appendChild(indexBadge);
    dragGhost.appendChild(textSpan);
    document.body.appendChild(dragGhost);

    e.dataTransfer.setDragImage(dragGhost, 25, 20);

    setTimeout(() => {
      if (document.body.contains(dragGhost)) {
        document.body.removeChild(dragGhost);
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stepId: string) => {
    if (!isAdmin || !draggedStepId || draggedStepId === stepId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    if (!dropTarget || dropTarget.stepId !== stepId || dropTarget.position !== position) {
      setDropTarget({ stepId, position });
    }
  };

  const handleDragEnd = () => {
    setDraggedStepId(null);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetStepId: string) => {
    if (!isAdmin || !draggedStepId || !onReorderSteps) {
      setDraggedStepId(null);
      setDropTarget(null);
      return;
    }
    e.preventDefault();

    const fromIdx = currentStageSteps.findIndex((s) => s.id === draggedStepId);
    let toIdx = currentStageSteps.findIndex((s) => s.id === targetStepId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const position = dropTarget?.position || 'before';
      const reordered = [...currentStageSteps];
      const [moved] = reordered.splice(fromIdx, 1);

      // Re-calculate target index after removal
      toIdx = reordered.findIndex((s) => s.id === targetStepId);
      const insertIdx = position === 'after' ? toIdx + 1 : toIdx;
      reordered.splice(insertIdx, 0, moved);

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
    setDropTarget(null);
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
          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-[#f8fafc] border-slate-200'
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

      {/* Reordering Banner Indicator when Dragging */}
      {isAdmin && draggedStep && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-400">
          <span className="truncate">
            Reordering: <strong>{draggedStep.name}</strong>
          </span>
          <span className="text-[10px] text-amber-500 font-mono">Drag above/below any step</span>
        </div>
      )}

      {/* Steps List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {currentStageSteps.map((step, index) => {
          const isSelected = selectedStepId === step.id;
          const isComplete = step.status === 'Complete';
          const isDragged = draggedStepId === step.id;
          const isDropBefore = dropTarget?.stepId === step.id && dropTarget?.position === 'before';
          const isDropAfter = dropTarget?.stepId === step.id && dropTarget?.position === 'after';

          return (
            <React.Fragment key={step.id}>
              {/* Drop Insertion Line Before */}
              {isDropBefore && (
                <div className="h-2 flex items-center px-2 py-0.5 animate-in fade-in duration-75">
                  <div className="h-0.5 w-full bg-blue-500 shadow-[0_0_8px_#3b82f6] rounded flex items-center justify-between">
                    <span className="w-2 h-2 rounded-full bg-blue-500 -ml-1"></span>
                    <span className="text-[9px] font-mono font-bold text-blue-400 bg-slate-900 px-1 rounded">
                      Insert Here
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 -mr-1"></span>
                  </div>
                </div>
              )}

              <div
                draggable={isAdmin}
                onDragStart={(e) => handleDragStart(e, step, index)}
                onDragOver={(e) => handleDragOver(e, step.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, step.id)}
                onClick={() => onSelectStep(step)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2.5 group cursor-pointer ${
                  isDragged ? 'opacity-30 border-dashed border-amber-400 scale-[0.98]' : ''
                } ${
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
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-amber-400 p-0.5 mt-0.5 flex-shrink-0"
                      title="Click and drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
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

              {/* Drop Insertion Line After */}
              {isDropAfter && (
                <div className="h-2 flex items-center px-2 py-0.5 animate-in fade-in duration-75">
                  <div className="h-0.5 w-full bg-blue-500 shadow-[0_0_8px_#3b82f6] rounded flex items-center justify-between">
                    <span className="w-2 h-2 rounded-full bg-blue-500 -ml-1"></span>
                    <span className="text-[9px] font-mono font-bold text-blue-400 bg-slate-900 px-1 rounded">
                      Insert Here
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 -mr-1"></span>
                  </div>
                </div>
              )}
            </React.Fragment>
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
