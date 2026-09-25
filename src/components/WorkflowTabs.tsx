import React from 'react';
import { WorkflowStage, TravellerRecord } from '../types/traveller';
import { WorkflowService } from '../services/workflowService';
import { Wrench, Compass, Award, CheckCircle } from 'lucide-react';

interface WorkflowTabsProps {
  currentStage: WorkflowStage;
  traveller: TravellerRecord;
  onSelectStage: (stage: WorkflowStage) => void;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({
  currentStage,
  traveller,
  onSelectStage
}) => {
  const stages: { id: WorkflowStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'Setup', label: 'Setup', icon: Wrench },
    { id: 'Calibration', label: 'Calibration', icon: Compass },
    { id: 'Final Test & Release', label: 'Final Test & Release', icon: Award }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 pt-2 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
      {stages.map(({ id, label, icon: Icon }) => {
        const isSelected = currentStage === id;
        const stats = WorkflowService.getStageStats(traveller, id);
        const isAllDone = stats.total > 0 && stats.completed === stats.total;

        return (
          <button
            key={id}
            onClick={() => onSelectStage(id)}
            className={`group relative flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
              isSelected
                ? 'bg-slate-950 text-blue-400 border-slate-700/80 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]'
                : 'bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
            
            <span className="tracking-tight">{label}</span>

            {/* Stage Progress Pill */}
            <span
              className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isAllDone
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : isSelected
                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isAllDone ? (
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>{stats.completed}/{stats.total}</span>
                </span>
              ) : (
                <span>{stats.completed}/{stats.total} ({stats.percent}%)</span>
              )}
            </span>

            {/* Active tab bottom indicator overlay */}
            {isSelected && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-500 rounded-t-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
};
