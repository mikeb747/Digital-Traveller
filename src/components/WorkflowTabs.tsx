import React, { useState, useRef, useEffect } from 'react';
import { WorkflowStage, TravellerRecord } from '../types/traveller';
import { WorkflowService } from '../services/workflowService';
import { Wrench, Compass, Award, CheckCircle, Plus, Layers, X } from 'lucide-react';

interface WorkflowTabsProps {
  currentStage: WorkflowStage;
  traveller: TravellerRecord;
  isAdmin?: boolean;
  theme?: 'dark' | 'light';
  onSelectStage: (stage: WorkflowStage) => void;
  onAddTab?: (tabName: string) => void;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({
  currentStage,
  traveller,
  isAdmin = false,
  theme = 'dark',
  onSelectStage,
  onAddTab
}) => {
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  // Compute unique stages from default, traveller.stages, and traveller.steps
  const defaultStages = ['Setup', 'Calibration', 'Final Test & Release'];
  const customStages = traveller.stages || [];
  const stepStages = Array.from(new Set(traveller.steps.map((s) => s.stage)));

  const allStageNames = Array.from(
    new Set([...defaultStages, ...customStages, ...stepStages])
  );

  useEffect(() => {
    if (isAddingTab && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTab]);

  const getStageIcon = (stageName: string) => {
    switch (stageName) {
      case 'Setup':
        return Wrench;
      case 'Calibration':
        return Compass;
      case 'Final Test & Release':
        return Award;
      default:
        return Layers;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTabName.trim();
    if (!trimmed || !onAddTab) return;

    if (!allStageNames.includes(trimmed)) {
      onAddTab(trimmed);
    } else {
      onSelectStage(trimmed);
    }
    setNewTabName('');
    setIsAddingTab(false);
  };

  return (
    <div
      className={`border-b px-4 pt-2 flex items-center space-x-2 overflow-x-auto flex-shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}
    >
      {allStageNames.map((stageName) => {
        const isSelected = currentStage === stageName;
        const stats = WorkflowService.getStageStats(traveller, stageName);
        const isAllDone = stats.total > 0 && stats.completed === stats.total;
        const Icon = getStageIcon(stageName);

        return (
          <button
            key={stageName}
            type="button"
            onClick={() => onSelectStage(stageName)}
            className={`group relative flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-t border-x cursor-pointer ${
              isSelected
                ? isDark
                  ? 'bg-slate-950 text-blue-400 border-slate-700/80 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]'
                  : 'bg-white text-blue-600 border-slate-300 shadow-xs'
                : isDark
                ? 'bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                : 'bg-slate-100 text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isSelected
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : isDark
                  ? 'text-slate-400 group-hover:text-slate-300'
                  : 'text-slate-500 group-hover:text-slate-700'
              }`}
            />

            <span className="tracking-tight whitespace-nowrap">{stageName}</span>

            {/* Stage Progress Pill */}
            <span
              className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                isAllDone
                  ? isDark
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isSelected
                  ? isDark
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isAllDone ? (
                <span className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>{stats.completed}/{stats.total}</span>
                </span>
              ) : (
                <span>
                  {stats.completed}/{stats.total}
                </span>
              )}
            </span>

            {/* Active tab bottom indicator overlay */}
            {isSelected && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-500 rounded-t-sm" />
            )}
          </button>
        );
      })}

      {/* + Add tab: Visible ONLY when user selects Admin */}
      {isAdmin && (
        <div className="flex items-center">
          {!isAddingTab ? (
            <button
              type="button"
              onClick={() => setIsAddingTab(true)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all mb-1 ${
                isDark
                  ? 'bg-slate-800/80 text-amber-300 border-amber-500/40 hover:bg-slate-700 hover:text-amber-200'
                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50 shadow-xs'
              }`}
              title="Admin: Create a new blank tab"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Add Tab</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="flex items-center space-x-1.5 mb-1 animate-in fade-in">
              <input
                ref={inputRef}
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="New tab name..."
                className={`px-2 py-1 text-xs rounded border focus:outline-none w-32 ${
                  isDark
                    ? 'bg-slate-950 border-amber-500 text-slate-100'
                    : 'bg-white border-amber-500 text-slate-900'
                }`}
              />
              <button
                type="submit"
                disabled={!newTabName.trim()}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTab(false);
                  setNewTabName('');
                }}
                className={`p-1 rounded ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
