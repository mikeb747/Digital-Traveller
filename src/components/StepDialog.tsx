import React, { useState, useEffect } from 'react';
import {
  LaserGratingCombination,
  LaserGratingFileResult,
  SystemFolderResult,
  WorkflowStep,
  StepStatus
} from '../types/traveller';
import { StorageService } from '../services/storageService';
import {
  LASER_GRATING_FILES_STEP_NAME,
  LASER_GRATING_SELECTION_STEP_NAME,
  RECORD_SYSTEM_DETAILS_STEP_NAME,
  SYSTEM_FOLDERS_STEP_NAME,
  validateLaserGratingCombinations
} from '../services/laserGratingWorkflow';
import { LaserGratingStepPanel } from './LaserGratingStepPanel';
import { 
  X, CheckCircle, Clock, RotateCcw, AlertTriangle, FileText, 
  CheckSquare, Square, Check, UserCheck, User, KeyRound, Briefcase, Tag, Hash 
} from 'lucide-react';

interface StepDialogProps {
  step: WorkflowStep | null;
  operatorName: string;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onOpenWireKey?: () => void;
  onOpenSystemDetails?: () => void;
  onUpdateStatus: (stepId: string, status: StepStatus, notes?: string, technician?: string) => void;
  onToggleChecklist: (stepId: string, checklistId: string) => void;
  onUpdateMeasurement: (stepId: string, paramIndex: number, value: string) => void;
  onUpdateDetails?: (details: {
    serialNumber: string;
    customerName: string;
    jobNumber: string;
    partNumber: string;
  }) => void;
  serialNumber: string;
  jobNumber: string;
  partNumber: string;
  customerName: string;
  saveLocation: string;
  laserGratingCombinations: LaserGratingCombination[];
  onUpdateLaserGratingCombinations: (combinations: LaserGratingCombination[]) => void;
  onCreateLaserGratingFiles: (overwrite: boolean) => Promise<LaserGratingFileResult>;
  onCreateSystemFolders: () => Promise<SystemFolderResult>;
}

export const StepDialog: React.FC<StepDialogProps> = ({
  step,
  operatorName,
  theme,
  isOpen,
  onClose,
  onOpenWireKey,
  onOpenSystemDetails,
  onUpdateStatus,
  onToggleChecklist,
  onUpdateMeasurement,
  onUpdateDetails,
  serialNumber,
  jobNumber,
  partNumber,
  customerName,
  saveLocation,
  laserGratingCombinations,
  onUpdateLaserGratingCombinations,
  onCreateLaserGratingFiles,
  onCreateSystemFolders
}) => {
  if (!isOpen || !step) return null;

  const [notes, setNotes] = useState(step.notes || '');
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCreatingSystemFolders, setIsCreatingSystemFolders] = useState(false);
  const [signoffTechnician, setSignoffTechnician] = useState(
    step.technician || operatorName || 'M. Brown'
  );
  const isLaserSelectionStep = step.name === LASER_GRATING_SELECTION_STEP_NAME;
  const isLaserFilesStep = step.name === LASER_GRATING_FILES_STEP_NAME;
  const isRecordSystemDetailsStep = step.name === RECORD_SYSTEM_DETAILS_STEP_NAME;
  const isSystemFoldersStep = step.name === SYSTEM_FOLDERS_STEP_NAME;

  // Local state for inline system details inputs on the Setup procedure page
  const [localSerial, setLocalSerial] = useState(serialNumber || '');
  const [localCustomer, setLocalCustomer] = useState(customerName || '');
  const [localJob, setLocalJob] = useState(jobNumber || '');
  const [localPart, setLocalPart] = useState(partNumber || '');

  // Keep notes, technician and details synchronized when step or props change
  useEffect(() => {
    setNotes(step.notes || '');
    setSignoffTechnician(step.technician || operatorName || 'M. Brown');
    setCompletionError(null);
  }, [step, operatorName]);

  useEffect(() => {
    setLocalSerial(serialNumber || '');
    setLocalCustomer(customerName || '');
    setLocalJob(jobNumber || '');
    setLocalPart(partNumber || '');
  }, [serialNumber, customerName, jobNumber, partNumber, isOpen]);

  const handleDetailChange = (field: 'serial' | 'customer' | 'job' | 'part', value: string) => {
    const s = field === 'serial' ? value : localSerial;
    const c = field === 'customer' ? value : localCustomer;
    const j = field === 'job' ? value : localJob;
    const p = field === 'part' ? value : localPart;

    if (field === 'serial') setLocalSerial(value);
    if (field === 'customer') setLocalCustomer(value);
    if (field === 'job') setLocalJob(value);
    if (field === 'part') setLocalPart(value);

    onUpdateDetails?.({
      serialNumber: s,
      customerName: c,
      jobNumber: j,
      partNumber: p
    });
  };

  // Press Escape on keyboard to close without completing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseWithoutCompleting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notes, step, signoffTechnician]);

  const handleMarkComplete = async () => {
    if (isRecordSystemDetailsStep) {
      if ([localSerial, localCustomer, localJob, localPart].some((value) => !value.trim())) {
        setCompletionError(
          'Enter the serial number, customer name, job number, and part number before completing this step.'
        );
        return;
      }
      onUpdateDetails?.({
        serialNumber: localSerial.trim(),
        customerName: localCustomer.trim(),
        jobNumber: localJob.trim(),
        partNumber: localPart.trim()
      });
    }
    if (isLaserSelectionStep) {
      const validationError = validateLaserGratingCombinations(laserGratingCombinations);
      if (validationError) {
        setCompletionError(validationError);
        return;
      }
    }
    if (isSystemFoldersStep) {
      setIsCreatingSystemFolders(true);
      try {
        const result = await onCreateSystemFolders();
        if (!result.success) {
          setCompletionError(result.error);
          return;
        }
      } catch (error) {
        setCompletionError(
          error instanceof Error ? error.message : 'Could not create system folders.'
        );
        return;
      } finally {
        setIsCreatingSystemFolders(false);
      }
    }
    setCompletionError(null);
    onUpdateStatus(step.id, 'Complete', notes, signoffTechnician);
    onClose();
  };

  const handleLaserFilesCreated = () => {
    onUpdateStatus(step.id, 'Complete', notes, signoffTechnician);
    onClose();
  };

  const handleMarkInProgress = () => {
    onUpdateStatus(step.id, 'In Progress', notes, signoffTechnician);
    onClose();
  };

  const handleReset = () => {
    onUpdateStatus(step.id, 'Not Started', notes, signoffTechnician);
    onClose();
  };

  const handleCloseWithoutCompleting = () => {
    // Preserve any notes changes without forcing completion
    if (notes !== step.notes) {
      onUpdateStatus(step.id, step.status, notes);
    }
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 ${theme === 'light' ? 'step-dialog-light' : ''}`}>
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Windows Fluent Style Modal Header */}
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">
                Procedure Instructions — {step.stage}
              </span>
              <h2 className="text-sm font-semibold text-slate-100">{step.name}</h2>
            </div>
          </div>

          <button
            onClick={handleCloseWithoutCompleting}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            title="Close Without Completing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Current Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  step.status === 'Complete'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : step.status === 'In Progress'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {step.status}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {step.completedAt ? (
                <span className="text-emerald-400">Done: {new Date(step.completedAt).toLocaleString()}</span>
              ) : step.startedAt ? (
                <span className="text-amber-400">Started: {new Date(step.startedAt).toLocaleString()}</span>
              ) : (
                <span className="text-slate-500">Not started yet</span>
              )}
            </div>
          </div>

          {/* Standard Operating Instructions */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Standard Operating Instructions</span>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3.5 border border-slate-800/80 space-y-2 leading-relaxed">
              {step.instructions && step.instructions.length > 0 ? (
                step.instructions.map((inst, i) => (
                  <div key={i} className="flex items-start space-x-2.5">
                    <span className="font-mono text-blue-400 font-bold text-[11px] mt-0.5">{i + 1}.</span>
                    <span className="text-slate-300">{inst}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No instructions specified for this workflow step.</p>
              )}
            </div>
          </div>

          {(isLaserSelectionStep || isLaserFilesStep) && (
            <LaserGratingStepPanel
              mode={isLaserSelectionStep ? 'selection' : 'files'}
              serialNumber={serialNumber}
              partNumber={partNumber}
              customerName={customerName}
              saveLocation={saveLocation}
              combinations={laserGratingCombinations}
              onChange={onUpdateLaserGratingCombinations}
              onCreateFiles={onCreateLaserGratingFiles}
              onComplete={handleLaserFilesCreated}
            />
          )}

          {isSystemFoldersStep && (
            <div className="rounded-lg border border-blue-800/70 bg-blue-950/30 p-3 text-xs text-slate-300">
              Completing this step creates the system folder and its standard Customer data and
              Internal data subfolders in the configured Save location.
            </div>
          )}

          {isRecordSystemDetailsStep && (
            <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Record System Numbers &amp; Details
                </span>
                {onOpenWireKey && (
                  <button
                    type="button"
                    onClick={onOpenWireKey}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Get WiRE Key
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Serial Number */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    <span>Serial Number (S/N)</span>
                  </label>
                  <input
                    type="text"
                    value={localSerial}
                    onChange={(e) => handleDetailChange('serial', e.target.value)}
                    placeholder="e.g. 12341234"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs font-semibold text-blue-400 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Customer Name */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Customer Name</span>
                  </label>
                  <input
                    type="text"
                    value={localCustomer}
                    onChange={(e) => handleDetailChange('customer', e.target.value)}
                    placeholder="e.g. Spunkt Team"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Job Number */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Job Number</span>
                  </label>
                  <input
                    type="text"
                    value={localJob}
                    onChange={(e) => handleDetailChange('job', e.target.value)}
                    placeholder="e.g. 123951829431"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Part Number */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span>Part Number</span>
                  </label>
                  <input
                    type="text"
                    value={localPart}
                    onChange={(e) => handleDetailChange('part', e.target.value)}
                    placeholder="e.g. INVIA LONG NUMBER"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          )}

          {completionError && (
            <p className="flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {completionError}
            </p>
          )}

          {/* Verification Checklist */}
          {step.checklist && step.checklist.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verification Checklist</span>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 divide-y divide-slate-800/60">
                {step.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleChecklist(step.id, item.id)}
                    className="w-full text-left py-2 px-2.5 flex items-center space-x-3 hover:bg-slate-800/40 rounded transition-colors group"
                  >
                    {item.done ? (
                      <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${item.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Measurements / Parameter Tolerances (if applicable) */}
          {step.measuredData && step.measuredData.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                Metrology & Parameter Verification
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/80 space-y-2">
                <div className="grid grid-cols-12 text-[10px] uppercase font-mono text-slate-500 font-semibold px-2">
                  <div className="col-span-5">Parameter</div>
                  <div className="col-span-4">Tolerance / Target</div>
                  <div className="col-span-3">Recorded Value</div>
                </div>
                {step.measuredData.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800">
                    <div className="col-span-5 font-medium text-slate-200">{item.parameter}</div>
                    <div className="col-span-4 font-mono text-slate-400 text-[11px]">{item.tolerance || 'N/A'}</div>
                    <div className="col-span-3 flex items-center space-x-1">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => onUpdateMeasurement(step.id, idx, e.target.value)}
                        placeholder="Value"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Technician Sign-off Selector */}
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Sign-off Test Technician
              </label>
              <p className="text-[11px] text-slate-400">
                Official technician identity stamped on procedure sign-off &amp; test sheet
              </p>
            </div>
            <select
              value={signoffTechnician}
              onChange={(e) => setSignoffTechnician(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-blue-300 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {StorageService.getTechnicians().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Notes & Observations */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-200 uppercase tracking-wide">
              Technician Notes / Non-Conformance Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter calibration observations, serial components, or remarks..."
              className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-950/90 px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Left Actions: Reset / Status transition */}
          <div className="flex items-center space-x-2">
            {step.status !== 'Not Started' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center space-x-1 transition-colors"
                title="Reset step to Not Started"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {step.status !== 'In Progress' && (
              <button
                type="button"
                onClick={handleMarkInProgress}
                className="px-3 py-1.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 flex items-center space-x-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark In Progress</span>
              </button>
            )}
          </div>

          {/* Right Actions: Close Without Completing & Mark Complete */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleCloseWithoutCompleting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
            >
              Close Without Completing
            </button>

            {!isLaserFilesStep && (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={isCreatingSystemFolders}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    {isCreatingSystemFolders
                      ? 'Creating folders…'
                      : isSystemFoldersStep
                      ? 'Create Folders & Mark Complete'
                      : 'Mark Complete'}
                  </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
