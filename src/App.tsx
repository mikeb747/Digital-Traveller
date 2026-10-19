import React, { useState, useEffect, useRef } from 'react';
import {
  LaserGratingCombination,
  LaserGratingFileResult,
  TravellerRecord,
  WorkflowStep,
  SystemType,
  WorkflowStage,
  StepStatus,
  SystemFolderResult
} from './types/traveller';
import { StorageService } from './services/storageService';
import { WorkflowService } from './services/workflowService';
import { WindowFrame } from './components/WindowFrame';
import { SystemSelector } from './components/SystemSelector';
import { WorkflowTabs } from './components/WorkflowTabs';
import { StepList } from './components/StepList';
import { StepDialog } from './components/StepDialog';
import { TravellerSummary } from './components/TravellerSummary';
import { BarcodeModal } from './components/BarcodeModal';
import { WorkflowConfigModal } from './components/WorkflowConfigModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { WorkflowTemplateService } from './services/workflowTemplateService';
import { WireKeyModal } from './components/WireKeyModal';
import {
  RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS,
  RECORD_SYSTEM_DETAILS_STEP_NAME,
  SYSTEM_UNBOXING_STEP_INSTRUCTIONS,
  SYSTEM_UNBOXING_STEP_NAME,
  SYSTEM_FOLDERS_STEP_NAME,
  SYSTEM_FOLDERS_STEP_INSTRUCTIONS
} from './services/laserGratingWorkflow';

export const App: React.FC = () => {
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('digital_traveller_theme') as 'dark' | 'light') || 'dark';
  });

  // Admin state (unlocked by selecting 'Admin' with password '520Shift')
  const [isAdmin, setIsAdmin] = useState(false);

  // Load initial traveller from localStorage or initialize defaults
  const [traveller, setTraveller] = useState<TravellerRecord>(() => {
    return StorageService.loadCurrentTraveller();
  });

  const [activeStage, setActiveStage] = useState<WorkflowStage>(() => {
    return traveller.activeStage || 'Setup';
  });

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [isWireKeyModalOpen, setIsWireKeyModalOpen] = useState(false);
  const [wireKeySerial, setWireKeySerial] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Confirmation modals state
  const [isNewTravellerConfirmOpen, setIsNewTravellerConfirmOpen] = useState(false);
  const [pendingSystemSwitch, setPendingSystemSwitch] = useState<SystemType | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state changes to storage
  useEffect(() => {
    StorageService.saveTraveller(traveller);
  }, [traveller]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem('digital_traveller_theme', theme);
  }, [theme]);

  // Auto clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Find currently active step
  const selectedStep = traveller.steps.find((s) => s.id === selectedStepId) || null;

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handle stage selection
  const handleSelectStage = (stage: WorkflowStage) => {
    setActiveStage(stage);
    setTraveller((prev) => ({
      ...prev,
      activeStage: stage,
      updatedAt: new Date().toISOString()
    }));
  };

  // Admin feature: Add a new blank tab
  const handleAddTab = (tabName: string) => {
    // Persist to template file store
    WorkflowTemplateService.addTabToTemplate(traveller.system, tabName);

    const existingStages = traveller.stages || ['Setup', 'Calibration', 'Final Test & Release'];
    if (!existingStages.includes(tabName)) {
      setTraveller((prev) => ({
        ...prev,
        stages: [...(prev.stages || ['Setup', 'Calibration', 'Final Test & Release']), tabName],
        activeStage: tabName,
        updatedAt: new Date().toISOString(),
        auditLog: [
          {
            timestamp: new Date().toISOString(),
            action: `Admin created new tab "${tabName}" (Saved to template)`,
            user: prev.operatorName
          },
          ...prev.auditLog
        ]
      }));
      setActiveStage(tabName);
      setSelectedStepId(null);
      setNotification(`Created tab "${tabName}" (Persisted)`);
    } else {
      setActiveStage(tabName);
    }
  };

  // Request system switch: opens confirmation box with reset warning
  const handleRequestSystemSwitch = (newSystem: SystemType) => {
    if (newSystem === traveller.system) return;
    setPendingSystemSwitch(newSystem);
  };

  // Confirm system switch: resets workflow for the selected system
  const handleConfirmSystemSwitch = () => {
    if (!pendingSystemSwitch) return;

    const newSystem = pendingSystemSwitch;
    // Create new traveller with reset workflow and blank serial
    const newRec = StorageService.createNewTraveller(
      newSystem,
      '',
      traveller.customerName,
      traveller.jobNumber,
      traveller.partNumber,
      traveller.operatorName
    );

    StorageService.saveTraveller(newRec);
    setTraveller(newRec);
    setActiveStage(newRec.activeStage || 'Setup');
    setSelectedStepId(null);
    setIsStepDialogOpen(false);
    setPendingSystemSwitch(null);
    setNotification(`Switched to ${newSystem}. Workflow reset.`);
  };

  // Handle step selection from list: ONLY select the step, DO NOT open dialog
  const handleSelectStep = (step: WorkflowStep) => {
    setSelectedStepId(step.id);
  };

  // Handle step status update from dialog
  // When a task is marked complete, automatically select the next task on the list
  const handleUpdateStepStatus = (
    stepId: string,
    status: StepStatus,
    notes?: string,
    technician?: string
  ) => {
    const updated = WorkflowService.updateStepStatus(
      traveller,
      stepId,
      status,
      technician || traveller.operatorName,
      notes
    );
    setTraveller(updated);

    // Auto-select the next task in the active stage list when marked Complete
    if (status === 'Complete') {
      const stageSteps = updated.steps.filter((s) => s.stage === activeStage);
      const currentIndex = stageSteps.findIndex((s) => s.id === stepId);
      if (currentIndex !== -1 && currentIndex + 1 < stageSteps.length) {
        setSelectedStepId(stageSteps[currentIndex + 1].id);
      }
    }
  };

  // Handle checklist toggle
  const handleToggleChecklist = (stepId: string, checklistId: string) => {
    const updated = WorkflowService.toggleChecklistItem(traveller, stepId, checklistId);
    setTraveller(updated);
  };

  // Handle measurement update
  const handleUpdateMeasurement = (stepId: string, paramIndex: number, value: string) => {
    const updated = WorkflowService.updateMeasurement(traveller, stepId, paramIndex, value);
    setTraveller(updated);
  };

  // Handle new custom step addition (configurable workflows)
  const handleAddCustomStep = (stage: WorkflowStage, stepName: string, instructions: string) => {
    // Persist to template file store
    WorkflowTemplateService.addStepToTemplate(traveller.system, stage, stepName, [instructions]);
    const updated = WorkflowService.addStep(traveller, stage, stepName, instructions);
    setTraveller(updated);
    setNotification(`Step "${stepName}" added and persisted to template`);
  };

  // Handle operator change & Admin mode toggle
  const handleChangeOperator = (operatorName: string, isUserAdmin: boolean) => {
    setIsAdmin(isUserAdmin);
    StorageService.setLastActiveTechnician(operatorName);
    setTraveller((prev) => ({
      ...prev,
      operatorName,
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Active technician set to ${operatorName}${isUserAdmin ? ' (Admin unlocked)' : ''}`,
          user: operatorName
        },
        ...prev.auditLog
      ]
    }));
    if (isUserAdmin) {
      setNotification('Admin mode active (+Add Tab & +Add Step unlocked)');
    }
  };

  // Handle reordering steps (Admin drag and drop)
  const handleReorderSteps = (reorderedSteps: WorkflowStep[]) => {
    // Persist new ordering to template file store
    WorkflowTemplateService.updateStepsOrderInTemplate(traveller.system, reorderedSteps);
    setTraveller((prev) => ({
      ...prev,
      steps: reorderedSteps,
      updatedAt: new Date().toISOString()
    }));
  };

  // Handle barcode & unit info update (Customer Name, Job Number, Part Number, Serial Number)
  const handleUpdateDetails = (details: {
    serialNumber: string;
    customerName: string;
    jobNumber: string;
    partNumber: string;
  }) => {
    setTraveller((prev) => ({
      ...prev,
      serialNumber: details.serialNumber,
      customerName: details.customerName,
      jobNumber: details.jobNumber,
      partNumber: details.partNumber,
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Unit details updated: S/N ${details.serialNumber || 'Blank'}${
            details.customerName ? ` | Customer: ${details.customerName}` : ''
          }${details.jobNumber ? ` | Job: ${details.jobNumber}` : ''}${
            details.partNumber ? ` | Part: ${details.partNumber}` : ''
          }`,
          user: prev.operatorName
        },
        ...prev.auditLog
      ]
    }));
    setNotification('Hardware & unit details updated');
  };

  // Handle New Traveller click: opens confirmation modal with reset warning
  const handleNewTravellerClick = () => {
    setIsNewTravellerConfirmOpen(true);
  };

  // Confirm New Traveller creation: resets workflow
  const handleConfirmNewTraveller = () => {
    const newRec = StorageService.createNewTraveller(
      traveller.system,
      '', // Blank S/N until entered
      traveller.customerName,
      traveller.jobNumber,
      traveller.partNumber,
      traveller.operatorName
    );
    setTraveller(newRec);
    setSelectedStepId(null);
    setIsStepDialogOpen(false);
    setActiveStage('Setup');
    setIsNewTravellerConfirmOpen(false);
    setNotification(`New digital traveller created for ${traveller.system}. Workflow reset.`);
  };

  // Handle Export to JSON
  const handleExportJson = () => {
    StorageService.exportToJson(traveller);
    setNotification('Saved traveller JSON file');
  };

  // Trigger file dialog for importing JSON
  const handleImportJsonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Read imported JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedRecord = StorageService.importFromJsonText(content);
        setTraveller(importedRecord);
        setActiveStage(importedRecord.activeStage || 'Setup');
        setSelectedStepId(null);
        setNotification(`Opened traveller: ${importedRecord.system} (${importedRecord.serialNumber || 'Unassigned'})`);
      } catch (err: any) {
        setNotification(`Open failed: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle applied workflow template from Admin Settings (Load Workflows)
  const handleApplyWorkflows = (newStages: string[], newSteps: WorkflowStep[]) => {
    const setupStep = newSteps.find(
      (step) => step.name === SYSTEM_UNBOXING_STEP_NAME
    ) || newSteps.find((step) =>
      step.stage === 'Setup' &&
      step.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
      step.name !== SYSTEM_FOLDERS_STEP_NAME
    );
    const unboxingStep: WorkflowStep = setupStep
      ? {
          ...setupStep,
          name: SYSTEM_UNBOXING_STEP_NAME,
          stage: 'Setup',
          instructions: [
            ...setupStep.instructions,
            ...(!setupStep.instructions.some((instruction) =>
              SYSTEM_UNBOXING_STEP_INSTRUCTIONS.includes(instruction)
            ) ? SYSTEM_UNBOXING_STEP_INSTRUCTIONS : [])
          ]
        }
      : {
          id: `step-${traveller.system}-system-setup-${Date.now().toString(36)}`,
          name: SYSTEM_UNBOXING_STEP_NAME,
          stage: 'Setup',
          status: 'Not Started',
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...SYSTEM_UNBOXING_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };
    const existingDetailsStep = newSteps.find(
      (step) => step.name === RECORD_SYSTEM_DETAILS_STEP_NAME
    );
    const detailsStep = existingDetailsStep
      ? { ...existingDetailsStep, stage: 'Setup' }
      : {
          id: `step-${traveller.system}-system-details-${Date.now().toString(36)}`,
          name: RECORD_SYSTEM_DETAILS_STEP_NAME,
          stage: 'Setup',
          status: 'Not Started' as const,
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };
    const existingFolderStep = newSteps.find((step) => step.name === SYSTEM_FOLDERS_STEP_NAME);
    const folderStep = existingFolderStep
      ? { ...existingFolderStep, stage: 'Setup' }
      : {
          id: `step-${traveller.system}-system-folders-${Date.now().toString(36)}`,
          name: SYSTEM_FOLDERS_STEP_NAME,
          stage: 'Setup',
          status: 'Not Started' as const,
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...SYSTEM_FOLDERS_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };
    const normalizedStages = Array.from(new Set(['Setup', ...newStages]));
    const normalizedSteps = [unboxingStep, detailsStep, folderStep, ...newSteps.filter(
      (step) => ![
        SYSTEM_UNBOXING_STEP_NAME,
        RECORD_SYSTEM_DETAILS_STEP_NAME,
        SYSTEM_FOLDERS_STEP_NAME
      ].includes(step.name) && step !== setupStep
    )];
    setTraveller((prev) => ({
      ...prev,
      stages: normalizedStages,
      steps: normalizedSteps,
      activeStage: 'Setup',
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Admin loaded workflow template (${normalizedSteps.length} steps across ${normalizedStages.length} tabs)`,
          user: prev.operatorName
        },
        ...prev.auditLog
      ]
    }));
    setActiveStage('Setup');
    setSelectedStepId(null);
    setNotification(`Workflows loaded: ${normalizedSteps.length} steps across ${normalizedStages.length} tabs`);
  };

  const handleUpdateLaserGratingCombinations = (combinations: LaserGratingCombination[]) => {
    setTraveller((prev) => ({
      ...prev,
      laserGratingCombinations: combinations,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleCreateLaserGratingFiles = async (
    overwrite: boolean
  ): Promise<LaserGratingFileResult> => {
    const createFiles = window.desktopAPI?.createLaserGratingFiles;
    if (!createFiles) {
      return {
        success: false,
        error: 'Creating files is available in the Windows desktop app only.'
      };
    }

    const result = await createFiles(
      traveller.serialNumber,
      traveller.partNumber || '',
      traveller.customerName || '',
      StorageService.getSaveLocation(),
      traveller.laserGratingCombinations || [],
      overwrite
    );
    if (result.success) {
      const directory = result.files[0]?.replace(/[\\/][^\\/]*$/, '') || '';
      setNotification(
        `Created ${result.files.length} blank file(s) in ${directory}`
      );
    }
    return result;
  };

  const handleCreateSystemFolders = async (): Promise<SystemFolderResult> => {
    const createFolders = window.desktopAPI?.createSystemFolders;
    if (!createFolders) {
      return {
        success: false,
        error: 'Creating system folders is available in the Windows desktop app only.'
      };
    }

    const result = await createFolders(
      traveller.serialNumber,
      traveller.partNumber || '',
      traveller.customerName || '',
      StorageService.getSaveLocation()
    );
    if (result.success) {
      setNotification(`Created system folder structure in ${result.directory}`);
    }
    return result;
  };
  return (
    <WindowFrame
      system={traveller.system}
      serialNumber={traveller.serialNumber}
      theme={theme}
      isAdmin={isAdmin}
      onToggleTheme={handleToggleTheme}
      onOpenSettings={() => setIsAdminSettingsOpen(true)}
      onOpenConfig={() => setIsConfigModalOpen(true)}
      onExportJson={handleExportJson}
      onImportJsonClick={handleImportJsonClick}
      onNewTraveller={handleNewTravellerClick}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-4 z-50 bg-slate-900 border border-blue-500/70 text-slate-100 px-3.5 py-2 rounded-lg shadow-xl text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* System Selector Header */}
      <SystemSelector
        currentSystem={traveller.system}
        serialNumber={traveller.serialNumber}
        customerName={traveller.customerName}
        jobNumber={traveller.jobNumber}
        partNumber={traveller.partNumber}
        workOrderNumber={traveller.workOrderNumber}
        operatorName={traveller.operatorName}
        isAdmin={isAdmin}
        theme={theme}
        onSelectSystem={handleRequestSystemSwitch}
        onChangeOperator={handleChangeOperator}
      />

      {/* Tabs Across the Top: Setup, Calibration, Final Test & Release, plus Admin +Add tab */}
      <WorkflowTabs
        currentStage={activeStage}
        traveller={traveller}
        isAdmin={isAdmin}
        theme={theme}
        onSelectStage={handleSelectStage}
        onAddTab={handleAddTab}
      />

      {/* Split Window Body: Left Workflow Steps | Right Instrument Inspector & Summary */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Workflow Steps List with Name, Status, Timestamp */}
        <StepList
          steps={traveller.steps}
          activeStage={activeStage}
          selectedStepId={selectedStepId}
          isAdmin={isAdmin}
          theme={theme}
          onSelectStep={handleSelectStep}
          onOpenAddStep={() => setIsConfigModalOpen(true)}
          onReorderSteps={handleReorderSteps}
        />

        {/* Right Side: Step Details & Calibration Audit Trail */}
        <TravellerSummary
          traveller={traveller}
          selectedStep={selectedStep}
          theme={theme}
          onOpenStepDialog={(step) => {
            setSelectedStepId(step.id);
            setIsStepDialogOpen(true);
          }}
        />
      </div>

      {/* Step Instruction & Execution Modal Dialog */}
      <StepDialog
        step={selectedStep}
        operatorName={traveller.operatorName}
        theme={theme}
        isOpen={isStepDialogOpen}
        onClose={() => setIsStepDialogOpen(false)}
        onOpenWireKey={() => {
          setWireKeySerial(traveller.serialNumber);
          setIsWireKeyModalOpen(true);
        }}
        onOpenSystemDetails={() => setIsBarcodeModalOpen(true)}
        onUpdateStatus={handleUpdateStepStatus}
        onToggleChecklist={handleToggleChecklist}
        onUpdateMeasurement={handleUpdateMeasurement}
        serialNumber={traveller.serialNumber}
        jobNumber={traveller.jobNumber || ''}
        partNumber={traveller.partNumber || ''}
        customerName={traveller.customerName || ''}
        saveLocation={StorageService.getSaveLocation()}
        laserGratingCombinations={traveller.laserGratingCombinations || []}
        onUpdateLaserGratingCombinations={handleUpdateLaserGratingCombinations}
        onCreateLaserGratingFiles={handleCreateLaserGratingFiles}
        onCreateSystemFolders={handleCreateSystemFolders}
      />

      {/* Barcode & Unit Details Scanner Modal Dialog */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        currentSerial={traveller.serialNumber}
        currentCustomerName={traveller.customerName}
        currentJobNumber={traveller.jobNumber}
        currentPartNumber={traveller.partNumber}
        currentSystem={traveller.system}
        onClose={() => setIsBarcodeModalOpen(false)}
        onUpdateDetails={handleUpdateDetails}
      />

      {/* Configurable Workflow Modal Dialog */}
      <WorkflowConfigModal
        isOpen={isConfigModalOpen}
        traveller={traveller}
        onClose={() => setIsConfigModalOpen(false)}
        onAddStep={handleAddCustomStep}
      />

      {/* Settings Modal (Excel Hub with Network Locations, All-Systems Workflows & Add New System) */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        system={traveller.system}
        traveller={traveller}
        theme={theme}
        onClose={() => setIsAdminSettingsOpen(false)}
        onApplyWorkflows={handleApplyWorkflows}
        onUpdateTravellerFromExcel={(updatedRec, msg) => {
          setTraveller(updatedRec);
          setNotification(msg);
        }}
        onSystemAdded={(newSystem) => {
          setNotification(`Registered new system: "${newSystem}".`);
        }}
      />

      {/* Get WiRE Key Modal */}
      <WireKeyModal
        isOpen={isWireKeyModalOpen}
        initialSerialNumber={wireKeySerial || traveller.serialNumber}
        theme={theme}
        onClose={() => setIsWireKeyModalOpen(false)}
        onApplyKeyToNotes={(key) => {
          if (selectedStepId) {
            const step = traveller.steps.find((s) => s.id === selectedStepId);
            const currentNotes = step?.notes || '';
            const updatedNotes = currentNotes
              ? `${currentNotes}\nWiRE Feature Permission Key: ${key}`
              : `WiRE Feature Permission Key: ${key}`;
            const updated = WorkflowService.updateStepStatus(
              traveller,
              selectedStepId,
              step ? step.status : 'In Progress',
              traveller.operatorName,
              updatedNotes
            );
            setTraveller(updated);
            setNotification(`WiRE Key added to step "${step?.name || selectedStepId}" notes`);
          } else {
            setNotification(`WiRE Key copied: ${key}`);
          }
        }}
      />

      {/* Confirmation Modal for +New Traveller */}
      <ConfirmModal
        isOpen={isNewTravellerConfirmOpen}
        title="Start New Traveller"
        message={`Are you sure you want to create a new Digital Traveller for ${traveller.system}? The current workflow procedures, checklist completions, and measurement values will be reset.`}
        confirmText="Confirm & Reset Workflow"
        cancelText="Cancel"
        isDestructive={true}
        theme={theme}
        onConfirm={handleConfirmNewTraveller}
        onCancel={() => setIsNewTravellerConfirmOpen(false)}
      />

      {/* Confirmation Modal for Switching System */}
      <ConfirmModal
        isOpen={pendingSystemSwitch !== null}
        title={`Switch System to ${pendingSystemSwitch}`}
        message={`Are you sure you want to switch to ${pendingSystemSwitch}? The active workflow procedures and calibration checklist will be reset for the ${pendingSystemSwitch} model.`}
        confirmText={`Switch to ${pendingSystemSwitch}`}
        cancelText="Cancel"
        isDestructive={true}
        theme={theme}
        onConfirm={handleConfirmSystemSwitch}
        onCancel={() => setPendingSystemSwitch(null)}
      />
    </WindowFrame>
  );
};

export default App;
