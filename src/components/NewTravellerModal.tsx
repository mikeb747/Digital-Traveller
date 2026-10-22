import React, { useState, useEffect } from 'react';
import { SystemType } from '../types/traveller';
import { SYSTEM_PROFILES } from '../services/defaultWorkflows';
import { SystemRegistryService } from '../services/systemRegistryService';
import { X, SlidersHorizontal, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface NewTravellerModalProps {
  isOpen: boolean;
  currentSystem: SystemType;
  theme?: 'dark' | 'light';
  onConfirm: (selectedSystem: SystemType) => void;
  onCancel: () => void;
}

export const NewTravellerModal: React.FC<NewTravellerModalProps> = ({
  isOpen,
  currentSystem,
  theme = 'dark',
  onConfirm,
  onCancel
}) => {
  const [selectedSystem, setSelectedSystem] = useState<SystemType>(currentSystem);
  const isDark = theme === 'dark';

  // Available systems from registry
  const systems: SystemType[] = SystemRegistryService.getSystems();

  // Reset selected system when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSystem(currentSystem);
    }
  }, [isOpen, currentSystem]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-traveller-title"
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between select-none ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="new-traveller-title"
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Start New Digital Traveller
              </h3>
              <p className="text-[11px] text-slate-400">
                Select the instrument system for this manufacturing traveller
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-black hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
              Select Instrument System
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {systems.map((sys) => {
                const profile = SYSTEM_PROFILES[sys] || {
                  displayName: sys,
                  tagline: 'Renishaw Spectroscopy System'
                };
                const isSelected = selectedSystem === sys;

                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setSelectedSystem(sys)}
                    className={`p-3.5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-950/50 border-blue-500 text-white shadow-md ring-2 ring-blue-500/40'
                          : 'bg-blue-50 border-blue-500 text-slate-900 shadow-md ring-2 ring-blue-400/40'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm tracking-wide text-blue-400">
                        {sys}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border ${
                            isDark ? 'border-slate-700' : 'border-slate-300'
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium line-clamp-1 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {profile.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {profile.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Warning Notice */}
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              isDark
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-xs">A new workflow will be initialized</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Starting a new traveller will set up a fresh checklist and procedures for{' '}
                <strong>{selectedSystem}</strong>. The active traveller’s completion records and measurements will be reset.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-end space-x-2.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedSystem)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create {selectedSystem} Traveller</span>
          </button>
        </div>
      </div>
    </div>
  );
};
