import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  theme?: 'dark' | 'light';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm & Reset',
  cancelText = 'Cancel',
  isDestructive = true,
  theme = 'dark',
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={`w-6 h-6 rounded flex items-center justify-center ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-black hover:bg-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Warning: Workflow Will Be Reset
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {message}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-black'
              }`}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-1.5 rounded-lg text-white font-semibold text-xs shadow-md transition-colors ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/40'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
