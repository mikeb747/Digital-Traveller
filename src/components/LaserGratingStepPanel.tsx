import React, { useState } from 'react';
import { LaserGratingCombination, LaserGratingFileResult } from '../types/traveller';
import {
  getLaserGratingFileName,
  validateLaserGratingCombinations
} from '../services/laserGratingWorkflow';
import { Plus, Trash2 } from 'lucide-react';

interface LaserGratingStepPanelProps {
  mode: 'selection' | 'files';
  serialNumber: string;
  combinations: LaserGratingCombination[];
  onChange: (combinations: LaserGratingCombination[]) => void;
  onCreateFiles: (overwrite: boolean) => Promise<LaserGratingFileResult>;
  onComplete: () => void;
}

export const LaserGratingStepPanel: React.FC<LaserGratingStepPanelProps> = ({
  mode,
  serialNumber,
  combinations,
  onChange,
  onCreateFiles,
  onComplete
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const validationError = validateLaserGratingCombinations(combinations);

  const updateRow = (
    index: number,
    field: keyof LaserGratingCombination,
    value: string
  ) => {
    const updated = combinations.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row
    );
    onChange(updated);
    setMessage(null);
  };

  const handleAddRow = () => {
    onChange([
      ...combinations,
      { wavelengthNm: '', gratingDensityLinesPerMm: '' }
    ]);
    setMessage(null);
  };

  const handleRemoveRow = (index: number) => {
    onChange(combinations.filter((_, rowIndex) => rowIndex !== index));
    setMessage(null);
  };

  const handleCreateFiles = async () => {
    if (!serialNumber.trim()) {
      setIsError(true);
      setMessage('Enter the traveller serial number before creating files.');
      return;
    }
    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setIsError(false);
    try {
      let result = await onCreateFiles(false);
      if (!result.success && 'conflicts' in result) {
        const conflicts = result.conflicts.map((file) => `• ${file}`).join('\n');
        const shouldOverwrite = window.confirm(
          `These files already exist:\n\n${conflicts}\n\nReplace the existing files?`
        );
        if (!shouldOverwrite) {
          setMessage('File creation cancelled. Existing files were not changed.');
          return;
        }
        result = await onCreateFiles(true);
      }

      if (!result.success) {
        setIsError(true);
        setMessage('error' in result ? result.error : 'File creation failed.');
        return;
      }

      setMessage(`Created ${result.files.length} blank file(s) in My Documents.`);
      onComplete();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'File creation failed.');
    } finally {
      setIsCreating(false);
    }
  };

  if (mode === 'selection') {
    return (
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-200">
          Laser and grating combinations
        </div>
        <div className="space-y-2">
          {combinations.map((combination, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
            >
              <label className="space-y-1 text-[11px] text-slate-400">
                <span>Laser wavelength (nm)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={combination.wavelengthNm}
                  onChange={(event) => updateRow(index, 'wavelengthNm', event.target.value)}
                  placeholder="532"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100"
                />
              </label>
              <label className="space-y-1 text-[11px] text-slate-400">
                <span>Grating density (lines/mm)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={combination.gratingDensityLinesPerMm}
                  onChange={(event) =>
                    updateRow(index, 'gratingDensityLinesPerMm', event.target.value)
                  }
                  placeholder="2400"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-100"
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemoveRow(index)}
                aria-label={`Delete combination row ${index + 1}`}
                className="mb-0.5 rounded border border-slate-700 p-2 text-slate-400 hover:border-rose-500 hover:text-rose-300 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {combinations.length === 0 && (
            <p className="text-xs text-slate-500">No combinations added yet.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 rounded border border-blue-700/70 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-950/50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add combination
        </button>
        {validationError && combinations.length > 0 && (
          <p className="text-xs text-amber-300">{validationError}</p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
      <div className="text-xs text-slate-300">
        Files will be created in{' '}
        <span className="font-mono text-blue-300">
          My Documents\{serialNumber || '[serial number]'}\Extra Data
        </span>
        .
      </div>
      {validationError ? (
        <p className="text-xs text-amber-300">{validationError}</p>
      ) : (
        <ul className="space-y-1 text-xs font-mono text-slate-300">
          {Array.from(new Set(combinations.map(getLaserGratingFileName))).map((fileName) => (
            <li key={fileName}>{fileName}</li>
          ))}
        </ul>
      )}
      {message && (
        <p className={`whitespace-pre-wrap text-xs ${isError ? 'text-rose-300' : 'text-emerald-300'}`}>
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={handleCreateFiles}
        disabled={isCreating || !!validationError}
        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? 'Creating files…' : 'Create blank .txt files'}
      </button>
    </section>
  );
};
