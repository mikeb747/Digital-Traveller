import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  Folder,
  HardDrive,
  Check,
  RotateCcw,
  Plus,
  Boxes,
  FileText
} from 'lucide-react';
import { SystemType, TravellerRecord, WorkflowStep } from '../types/traveller';
import { WorkflowTemplateService, WorkflowTemplate } from '../services/workflowTemplateService';
import {
  NetworkShareConfigService,
  NetworkShareLocation
} from '../services/networkShareConfigService';
import { SystemRegistryService } from '../services/systemRegistryService';
import { ExcelService } from '../services/excelService';

interface AdminSettingsModalProps {
  isOpen: boolean;
  system: SystemType;
  traveller: TravellerRecord;
  theme?: 'dark' | 'light';
  initialTab?: 'excel' | 'workflows' | 'systems';
  onClose: () => void;
  onApplyWorkflows: (newStages: string[], newSteps: WorkflowStep[]) => void;
  onUpdateTravellerFromExcel?: (updated: TravellerRecord, message: string) => void;
  onSystemAdded?: (newSystem: string) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  system,
  traveller,
  theme = 'dark',
  initialTab = 'excel',
  onClose,
  onApplyWorkflows,
  onUpdateTravellerFromExcel,
  onSystemAdded
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'excel' | 'workflows' | 'systems'>(initialTab);
  const [registeredSystems, setRegisteredSystems] = useState<string[]>(() =>
    SystemRegistryService.getSystems()
  );
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<SystemType>(system);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Network Share locations for all systems
  const [networkConfigs, setNetworkConfigs] = useState(NetworkShareConfigService.getAllConfigs);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    const locs = networkConfigs[system] || NetworkShareConfigService.getLocationsForSystem(system);
    return locs[0]?.id || 'loc-1';
  });

  const [isCopiedPath, setIsCopiedPath] = useState(false);
  const [newSystemInput, setNewSystemInput] = useState('');
  const [newSystemDesc, setNewSystemDesc] = useState('');

  const multiWorkflowFileInputRef = useRef<HTMLInputElement>(null);
  const excelSyncInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  // Active template from service for current or selected system
  const template = WorkflowTemplateService.getTemplate(system);
  const currentStages =
    traveller.stages && traveller.stages.length > 0 ? traveller.stages : template.stages;

  // Active selected location info
  const activeSystemLocations =
    networkConfigs[selectedSystemFilter] ||
    NetworkShareConfigService.getLocationsForSystem(selectedSystemFilter);

  const activeLocation =
    activeSystemLocations.find((loc) => loc.id === selectedLocationId) || activeSystemLocations[0];

  const suggestedFileName = `DigitalTraveller_${traveller.system}_${
    traveller.serialNumber ? traveller.serialNumber : 'Unassigned'
  }_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Update a specific network location path
  const handleUpdatePath = (sys: SystemType, index: 0 | 1 | 2, newPath: string) => {
    const updated = NetworkShareConfigService.updateLocation(sys, index, { path: newPath });
    setNetworkConfigs({ ...updated });
  };

  // Update a specific network location name / label
  const handleUpdateName = (sys: SystemType, index: 0 | 1 | 2, newName: string) => {
    const updated = NetworkShareConfigService.updateLocation(sys, index, { name: newName });
    setNetworkConfigs({ ...updated });
  };

  // Copy UNC path to clipboard
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setIsCopiedPath(true);
    setTimeout(() => setIsCopiedPath(false), 2000);
  };

  // Reset network shares to factory defaults
  const handleResetNetworkShares = () => {
    if (window.confirm('Reset network share locations to factory defaults?')) {
      const defs = NetworkShareConfigService.resetToDefaults();
      setNetworkConfigs(defs);
      setMessage({
        type: 'success',
        text: 'All network share paths reset to default Renishaw server directories.'
      });
      setTimeout(() => setMessage(null), 3500);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      ExcelService.exportTravellerToExcel(traveller, suggestedFileName);
      setMessage({
        type: 'success',
        text: `Exported "${suggestedFileName}". Copy this file directly to ${activeLocation.path}.`
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Excel export failed: ${err.message || 'Unknown error'}`
      });
    }
  };

  // Excel Import / Sync Handler
  const handleExcelSyncFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const { updatedRecord, logs } = ExcelService.parseExcelFile(buffer, traveller);
        if (onUpdateTravellerFromExcel) {
          onUpdateTravellerFromExcel(
            updatedRecord,
            `Spreadsheet synced: ${logs.join(' | ')}`
          );
        }
        setMessage({
          type: 'success',
          text: `Successfully synced "${file.name}" with traveler! (${logs.join(', ')})`
        });
        setTimeout(() => setMessage(null), 6000);
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: `Failed to read Excel file: ${err.message || 'Corrupt or unsupported format'}`
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelSyncInputRef.current) {
      excelSyncInputRef.current.value = '';
    }
  };

  // Handle Save Workflows for ALL SYSTEMS in 1 Unified JSON File
  const handleSaveAllWorkflows = () => {
    try {
      WorkflowTemplateService.exportAllSystemsBundle({
        system: traveller.system,
        stages: currentStages,
        steps: traveller.steps
      });

      setMessage({
        type: 'success',
        text: `Successfully saved and exported all workflows for all systems into 1 unified JSON file.`
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Failed to save workflows: ${err.message || 'Unknown error'}`
      });
    }
  };

  // Handle Load Workflows from Unified JSON File
  const handleLoadWorkflowsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = WorkflowTemplateService.importAllSystemsBundle(content);

        // Refresh registered systems list in state
        const updatedSystems = SystemRegistryService.getSystems();
        setRegisteredSystems(updatedSystems);

        // Reload network share configs if any new systems were created
        const updatedConfigs = NetworkShareConfigService.getAllConfigs();
        setNetworkConfigs(updatedConfigs);

        // If current active system was included, reload its template and update live steps
        if (result.importedSystems.includes(traveller.system)) {
          const freshTemplate = WorkflowTemplateService.getTemplate(traveller.system);
          const newWorkflowSteps: WorkflowStep[] = freshTemplate.steps.map((stepDef, idx) => ({
            name: stepDef.name,
            stage: stepDef.stage,
            instructions: Array.isArray(stepDef.instructions) ? [...stepDef.instructions] : [],
            checklist: stepDef.checklist ? stepDef.checklist.map((c) => ({ ...c, done: false })) : [],
            measuredData: stepDef.measuredData
              ? stepDef.measuredData.map((m) => ({ ...m, value: '' }))
              : [],
            id: `step-${traveller.system}-${idx + 1}-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .substring(2, 6)}`,
            status: 'Not Started',
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: ''
          }));
          onApplyWorkflows(freshTemplate.stages, newWorkflowSteps);
        }

        setMessage({
          type: 'success',
          text: `Loaded unified workflows bundle! Successfully updated ${result.importedSystems.length} system(s): [${result.importedSystems.join(
            ', '
          )}] (${result.totalStepsCount} total procedures).`
        });
        setTimeout(() => setMessage(null), 5000);
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: `Failed to load workflows bundle: ${err.message || 'Invalid JSON format'}`
        });
      }
    };
    reader.readAsText(file);
    if (multiWorkflowFileInputRef.current) {
      multiWorkflowFileInputRef.current.value = '';
    }
  };

  // Add New System Handler
  const handleAddNewSystem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSystemInput.trim();
    if (!name) return;

    if (registeredSystems.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setMessage({
        type: 'error',
        text: `System "${name}" already exists in the system registry.`
      });
      return;
    }

    // Register system
    const updated = SystemRegistryService.addSystem(name);
    setRegisteredSystems(updated);

    // Initialize template and network share locations
    WorkflowTemplateService.getTemplate(name);
    const updatedConfigs = NetworkShareConfigService.getAllConfigs();
    setNetworkConfigs(updatedConfigs);

    // Select the new system
    setSelectedSystemFilter(name);
    setSelectedLocationId(updatedConfigs[name][0].id);

    setNewSystemInput('');
    setNewSystemDesc('');

    if (onSystemAdded) {
      onSystemAdded(name);
    }

    setMessage({
      type: 'success',
      text: `Successfully added new system type "${name}". 3 Network Share locations and default workflow procedures have been initialized.`
    });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between select-none ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Settings &amp; Production Configuration
              </h3>
              <p className="text-[11px] text-slate-400">
                Network Share Spreadsheets &bull; Unified All-Systems Workflows &bull; System Types
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-black hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div
          className={`px-5 py-2 border-b flex items-center justify-between gap-2 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Hub &amp; Network Shares</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workflows')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                activeTab === 'workflows'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workflows (All Systems in 1 File)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('systems')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                activeTab === 'systems'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New System</span>
            </button>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
            Admin Controlled
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Status Message Notification */}
          {message && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center space-x-2 animate-in fade-in ${
                message.type === 'success'
                  ? isDark
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : isDark
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: EXCEL HUB & NETWORK SHARE LOCATIONS */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              {/* System Selector for 3 locations per instrument */}
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Select Instrument System Locations</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure UNC share paths (`\\renishaw.com\...`) for Master Test Sheets, Test Data Copies &amp; Deviation Records.
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  {registeredSystems.map((sys) => {
                    const isCurrent = sys === traveller.system;
                    const isSelected = sys === selectedSystemFilter;
                    return (
                      <button
                        key={sys}
                        type="button"
                        onClick={() => {
                          setSelectedSystemFilter(sys);
                          const locs =
                            networkConfigs[sys] ||
                            NetworkShareConfigService.getLocationsForSystem(sys);
                          setSelectedLocationId(locs[0]?.id || 'loc-1');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <span>{sys}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Network Locations Cards for the chosen system */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeSystemLocations.map((loc, idx) => {
                  const isSelected = loc.id === selectedLocationId;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
                            : 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                          : isDark
                          ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                            Location {idx + 1} of 3 ({selectedSystemFilter})
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {loc.category}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={loc.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateName(selectedSystemFilter, idx as 0 | 1 | 2, e.target.value)
                          }
                          className="font-semibold text-xs text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-emerald-500 focus:outline-hidden w-full"
                          title="Click to rename location"
                        />
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {loc.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span
                          className="text-[10px] text-slate-500 font-mono truncate max-w-[170px]"
                          title={loc.path}
                        >
                          {loc.path}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Network Share Path Editor */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Network Share UNC Path:{' '}
                        <span className="text-emerald-400">{activeLocation.name}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Target directory / spreadsheet path for {selectedSystemFilter}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPath(activeLocation.path)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      {isCopiedPath ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Folder className="w-3 h-3" />
                      )}
                      <span>{isCopiedPath ? 'Copied Path!' : 'Copy Path'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetNetworkShares}
                      className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Reset all locations to default Renishaw server paths"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Factory Paths</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeLocation.path}
                    onChange={(e) => {
                      const idx = activeSystemLocations.findIndex(
                        (l) => l.id === activeLocation.id
                      );
                      if (idx !== -1) {
                        handleUpdatePath(selectedSystemFilter, idx as 0 | 1 | 2, e.target.value);
                      }
                    }}
                    placeholder="\\renishaw.com\global\gb\PLC\..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons: Export to Excel and Sync from Excel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold mb-1 text-emerald-400">
                      <Download className="w-4 h-4" />
                      <span>Export Current Record to .xlsx</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Generates a workbook with Overview, Workflow Steps, Measurements with tolerances, Checklists, and Audit Trail.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/90 p-1.5 rounded border border-slate-800 truncate">
                      {suggestedFileName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate &amp; Save Excel (.xlsx)</span>
                  </button>
                </div>

                {/* Import / Sync Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold mb-1 text-blue-400">
                      <Upload className="w-4 h-4" />
                      <span>Sync Traveler from Network .xlsx</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Select any modified test sheet from your network share location to sync step statuses, measured values, and technician sign-offs.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={excelSyncInputRef}
                    onChange={handleExcelSyncFile}
                    accept=".xlsx, .xlsm, .xls"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (excelSyncInputRef.current) {
                        excelSyncInputRef.current.value = '';
                        excelSyncInputRef.current.click();
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Spreadsheet to Sync</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UNIFIED WORKFLOW TEMPLATES (ALL SYSTEMS IN 1 FILE) */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              {/* Unified All-Systems Notice */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div>
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-400" />
                    <span>Unified All-Systems Workflow Architecture</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Saving &amp; loading now bundles workflow templates for <strong>all systems ({registeredSystems.join(', ')})</strong> into <strong>1 single file</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {registeredSystems.length} Systems Bundled
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save All Workflows and Load Workflows Bundle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Save All Workflows in 1 File */}
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold mb-1 text-blue-400">
                      <Download className="w-4 h-4" />
                      <span>Save Workflows (All Systems in 1 File)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Exports complete tabs, workflow procedures, tolerances, and checklists for all {registeredSystems.length} systems into a single master JSON file.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAllWorkflows}
                    className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save All Workflows (1 File .json)</span>
                  </button>
                </div>

                {/* Load Workflows for All Systems */}
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold mb-1 text-emerald-400">
                      <Upload className="w-4 h-4" />
                      <span>Load Workflows (All Systems in 1 File)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Import a master workflow JSON file to update all systems simultaneously, or load custom systems automatically.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={multiWorkflowFileInputRef}
                    onChange={handleLoadWorkflowsFileChange}
                    accept=".json,application/json"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (multiWorkflowFileInputRef.current) {
                        multiWorkflowFileInputRef.current.value = '';
                        multiWorkflowFileInputRef.current.click();
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Load Workflows (1 File .json)</span>
                  </button>
                </div>
              </div>

              {/* System Breakdown List */}
              <div className="pt-2">
                <h4
                  className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Active System Workflows Summary
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {registeredSystems.map((sys) => {
                    const sysTemplate = WorkflowTemplateService.getTemplate(sys);
                    return (
                      <div
                        key={sys}
                        className={`p-3 rounded-lg border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-blue-400">{sys}</span>
                          <span className="text-[10px] text-slate-500">v{sysTemplate.version}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {sysTemplate.stages.length} Tabs &bull; {sysTemplate.steps.length} Procedures
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sysTemplate.stages.map((stg) => (
                            <span
                              key={stg}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono"
                            >
                              {stg}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADD NEW SYSTEM */}
          {activeTab === 'systems' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1">
                  <Plus className="w-4 h-4" />
                  <span>Register New Test System Type</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Add new instrument types for future usage as additional test lines are introduced.
                  The system will automatically initialize 3 dedicated network share paths, configurable workflow tabs, and include the new system in all 1-file master workflow exports.
                </p>

                <form onSubmit={handleAddNewSystem} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      System Model Name / Identifier:
                    </label>
                    <input
                      type="text"
                      value={newSystemInput}
                      onChange={(e) => setNewSystemInput(e.target.value)}
                      placeholder="e.g. inVia-Qontor, RA800, RA816, Virsa-R"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      System Description (Optional):
                    </label>
                    <input
                      type="text"
                      value={newSystemDesc}
                      onChange={(e) => setNewSystemDesc(e.target.value)}
                      placeholder="High-speed automated Raman biological inspection station"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newSystemInput.trim()}
                    className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register System &amp; Create Workflows</span>
                  </button>
                </form>
              </div>

              {/* List of currently registered systems */}
              <div className="pt-2">
                <h4
                  className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Currently Registered Systems ({registeredSystems.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {registeredSystems.map((sys) => {
                    const isBuiltIn = SystemRegistryService.isBuiltIn(sys);
                    return (
                      <div
                        key={sys}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Boxes className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-xs text-white">{sys}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isBuiltIn
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {isBuiltIn ? 'Built-in' : 'Custom'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Renishaw Production Engineering Configuration</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-slate-800 text-slate-200 hover:text-white'
                : 'bg-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
