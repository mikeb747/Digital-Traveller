import React, { useState, useEffect, useRef } from 'react';
import { TravellerRecord, WorkflowStep, SystemType, WorkflowStage, StepStatus } from './types/traveller';
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
  const handleUpdateStepStatus = (stepId: string, status: StepStatus, notes?: string) => {
    const updated = WorkflowService.updateStepStatus(
      traveller,
      stepId,
      status,
      traveller.operatorName,
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
    setTraveller((prev) => ({
      ...prev,
      stages: newStages,
      steps: newSteps,
      activeStage: newStages[0] || 'Setup',
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Admin loaded workflow template (${newSteps.length} steps across ${newStages.length} tabs)`,
          user: prev.operatorName
        },
        ...prev.auditLog
      ]
    }));
    setActiveStage(newStages[0] || 'Setup');
    setSelectedStepId(null);
    setNotification(`Workflows loaded: ${newSteps.length} steps across ${newStages.length} tabs`);
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
        onOpenBarcodeModal={() => setIsBarcodeModalOpen(true)}
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
        isOpen={isStepDialogOpen}
        onClose={() => setIsStepDialogOpen(false)}
        onUpdateStatus={handleUpdateStepStatus}
        onToggleChecklist={handleToggleChecklist}
        onUpdateMeasurement={handleUpdateMeasurement}
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

      {/* Admin Settings Modal (Save Workflows & Load Workflows) */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        system={traveller.system}
        traveller={traveller}
        theme={theme}
        onClose={() => setIsAdminSettingsOpen(false)}
        onApplyWorkflows={handleApplyWorkflows}
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
