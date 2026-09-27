import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Check, User, Shield, Lock, X } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface TechSelectorProps {
  currentOperator: string;
  isAdmin: boolean;
  onSelectOperator: (name: string, isAdmin: boolean) => void;
  theme?: 'dark' | 'light';
}

export const TechSelector: React.FC<TechSelectorProps> = ({
  currentOperator,
  isAdmin,
  onSelectOperator,
  theme = 'dark'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [techList, setTechList] = useState<string[]>(() => {
    const list = StorageService.getTechnicians();
    // Ensure Admin is always available in the list
    if (!list.includes('Admin')) {
      return ['Admin', ...list];
    }
    return list;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTechName, setNewTechName] = useState('');

  // Admin password verification modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewTechName('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus add input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [showPasswordModal]);

  // Ensure current operator is in techList
  useEffect(() => {
    if (currentOperator && !techList.includes(currentOperator)) {
      const updated = StorageService.addTechnician(currentOperator);
      setTechList(updated.includes('Admin') ? updated : ['Admin', ...updated]);
    }
  }, [currentOperator, techList]);

  const handleSelect = (tech: string) => {
    if (tech === 'Admin') {
      if (isAdmin) {
        // Already authenticated as Admin
        setIsOpen(false);
        return;
      }
      // Require password
      setIsOpen(false);
      setPasswordInput('');
      setPasswordError(false);
      setShowPasswordModal(true);
      return;
    }

    // Standard technician selected
    onSelectOperator(tech, false);
    StorageService.setLastActiveTechnician(tech);
    setIsOpen(false);
    setIsAdding(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '520Shift') {
      onSelectOperator('Admin', true);
      StorageService.setLastActiveTechnician('Admin');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTechName.trim();
    if (!trimmed) return;

    const updated = StorageService.addTechnician(trimmed);
    const withAdmin = updated.includes('Admin') ? updated : ['Admin', ...updated];
    setTechList(withAdmin);
    onSelectOperator(trimmed, false);
    StorageService.setLastActiveTechnician(trimmed);
    setNewTechName('');
    setIsAdding(false);
    setIsOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <div
          className={`flex items-center rounded border transition-colors ${
            isDark
              ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-300 hover:border-slate-400'
          }`}
        >
          <span className="text-[11px] pl-2.5 pr-1 select-none font-medium text-slate-400">
            Tech:
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center space-x-1.5 px-2 py-1 text-xs font-semibold transition-colors focus:outline-none ${
              isAdmin
                ? 'text-amber-400 font-bold'
                : isDark
                ? 'text-slate-200 hover:text-white'
                : 'text-slate-800 hover:text-black'
            }`}
            title="Select technician or switch to Admin"
          >
            {isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
            <span className="max-w-[140px] sm:max-w-[180px] truncate">{currentOperator || 'Select Tech'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {isOpen && (
          <div
            className={`absolute right-0 mt-1.5 w-60 rounded-lg border shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
            }`}
          >
            <div
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider border-b select-none flex items-center justify-between ${
                isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
              }`}
            >
              <span>Select Active Technician</span>
              <User className="w-3 h-3 text-blue-400" />
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              {techList.map((tech) => {
                const isSelected = tech === currentOperator;
                const isItemAdmin = tech === 'Admin';
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => handleSelect(tech)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-500'
                          : 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                        : isItemAdmin
                        ? isDark
                          ? 'text-amber-300 hover:bg-slate-800 font-medium'
                          : 'text-amber-700 hover:bg-slate-100 font-medium'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 truncate pr-2">
                      {isItemAdmin && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      <span>{tech}</span>
                      {isItemAdmin && !isAdmin && (
                        <span className="text-[10px] text-amber-500/80 font-mono">(Protected)</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Action: add user+ */}
            <div
              className={`border-t p-1.5 rounded-b-lg ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {!isAdding ? (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 flex items-center space-x-1.5 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-500" />
                  <span>add user+</span>
                </button>
              ) : (
                <form onSubmit={handleAddSubmit} className="space-y-1.5 p-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder="Enter technician name..."
                    className={`w-full border rounded px-2 py-1 text-xs focus:outline-none ${
                      isDark
                        ? 'bg-slate-900 border-blue-500 text-slate-100'
                        : 'bg-white border-blue-500 text-slate-900'
                    }`}
                  />
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewTechName('');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTechName.trim()}
                      className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Password Prompt Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
            }`}
          >
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}
                >
                  Admin Authentication
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(false);
                }}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-black hover:bg-slate-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-4 space-y-3 text-xs">
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Please enter the administrator password to unlock workflow modifications and ordering:
              </p>

              <div>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter Admin Password..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                    passwordError
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">
                    Incorrect password. Please try again.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-black'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
