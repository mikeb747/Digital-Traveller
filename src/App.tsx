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
  const [notification, setNotification] = useState<string | null>(null);

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
            action: `Admin created new tab "${tabName}"`,
            user: prev.operatorName
          },
          ...prev.auditLog
        ]
      }));
      setActiveStage(tabName);
      setSelectedStepId(null);
      setNotification(`Created tab "${tabName}"`);
    } else {
      setActiveStage(tabName);
    }
  };

  // Handle system selection (InVia / Virsa / inLux) seamlessly without blocking prompts
  const handleSelectSystem = (newSystem: SystemType) => {
    if (newSystem === traveller.system) return;

    StorageService.saveTraveller(traveller);
    const targetTraveller = StorageService.loadTravellerForSystem(newSystem);
    setTraveller(targetTraveller);
    setActiveStage(targetTraveller.activeStage || 'Setup');
    setSelectedStepId(null);
    setIsStepDialogOpen(false);
    setNotification(`Switched system to ${newSystem}`);
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
    const updated = WorkflowService.addStep(traveller, stage, stepName, instructions);
    setTraveller(updated);
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
          action: `Unit details updated: S/N ${details.serialNumber}${
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

  // Handle New Traveller creation
  const handleCreateNewTraveller = () => {
    const newRec = StorageService.createNewTraveller(
      traveller.system,
      undefined,
      traveller.customerName,
      traveller.jobNumber,
      traveller.partNumber,
      traveller.operatorName
    );
    setTraveller(newRec);
    setSelectedStepId(null);
    setIsStepDialogOpen(false);
    setActiveStage('Setup');
    setNotification(`New digital traveller record created for ${traveller.system}`);
  };

  // Handle Export to JSON
  const handleExportJson = () => {
    StorageService.exportToJson(traveller);
    setNotification('JSON record exported successfully');
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
        setNotification(`Imported traveller: ${importedRecord.system} (${importedRecord.serialNumber})`);
      } catch (err: any) {
        setNotification(`Import failed: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <WindowFrame
      system={traveller.system}
      serialNumber={traveller.serialNumber}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onOpenConfig={() => setIsConfigModalOpen(true)}
      onExportJson={handleExportJson}
      onImportJsonClick={handleImportJsonClick}
      onNewTraveller={handleCreateNewTraveller}
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
        onSelectSystem={handleSelectSystem}
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
    </WindowFrame>
  );
};

export default App;
