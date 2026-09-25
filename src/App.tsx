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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state changes to storage
  useEffect(() => {
    StorageService.saveTraveller(traveller);
  }, [traveller]);

  // Find currently active step
  const selectedStep = traveller.steps.find(s => s.id === selectedStepId) || null;

  // Handle stage selection
  const handleSelectStage = (stage: WorkflowStage) => {
    setActiveStage(stage);
    setTraveller(prev => ({
      ...prev,
      activeStage: stage,
      updatedAt: new Date().toISOString()
    }));
  };

  // Handle system selection (InVia / Virsa / inLux)
  const handleSelectSystem = (newSystem: SystemType) => {
    if (newSystem === traveller.system) return;

    if (window.confirm(`Switch system to ${newSystem}? A new traveller record will be initialized for this system model.`)) {
      const newRec = StorageService.createNewTraveller(newSystem);
      setTraveller(newRec);
      setActiveStage('Setup');
      setSelectedStepId(null);
      setIsStepDialogOpen(false);
    }
  };

  // Handle step selection from list: open dialog window as required
  const handleSelectStep = (step: WorkflowStep) => {
    setSelectedStepId(step.id);
    setIsStepDialogOpen(true);
  };

  // Handle step status update from dialog
  const handleUpdateStepStatus = (stepId: string, status: StepStatus, notes?: string) => {
    const updated = WorkflowService.updateStepStatus(
      traveller,
      stepId,
      status,
      traveller.operatorName,
      notes
    );
    setTraveller(updated);
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

  // Handle operator change
  const handleChangeOperator = (operatorName: string) => {
    setTraveller(prev => ({
      ...prev,
      operatorName,
      updatedAt: new Date().toISOString()
    }));
  };

  // Handle barcode update
  const handleUpdateSerial = (newSerial: string) => {
    setTraveller(prev => ({
      ...prev,
      serialNumber: newSerial,
      updatedAt: new Date().toISOString(),
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: `Instrument serial barcode updated to ${newSerial}`,
          user: prev.operatorName
        },
        ...prev.auditLog
      ]
    }));
  };

  // Handle New Traveller creation
  const handleCreateNewTraveller = () => {
    if (window.confirm('Create a new blank digital traveller for this system?')) {
      const newRec = StorageService.createNewTraveller(traveller.system);
      setTraveller(newRec);
      setSelectedStepId(null);
      setIsStepDialogOpen(false);
    }
  };

  // Handle Export to JSON
  const handleExportJson = () => {
    StorageService.exportToJson(traveller);
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
        alert(`Successfully imported traveller for ${importedRecord.system} (${importedRecord.serialNumber})`);
      } catch (err: any) {
        alert(`Failed to import JSON: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <WindowFrame
      system={traveller.system}
      serialNumber={traveller.serialNumber}
      onOpenConfig={() => setIsConfigModalOpen(true)}
      onOpenBarcode={() => setIsBarcodeModalOpen(true)}
      onExportJson={handleExportJson}
      onImportJsonClick={handleImportJsonClick}
      onNewTraveller={handleCreateNewTraveller}
    >
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
        workOrderNumber={traveller.workOrderNumber}
        operatorName={traveller.operatorName}
        onSelectSystem={handleSelectSystem}
        onOpenBarcodeModal={() => setIsBarcodeModalOpen(true)}
        onChangeOperator={handleChangeOperator}
      />

      {/* Tabs Across the Top: Setup, Calibration, Final Test & Release */}
      <WorkflowTabs
        currentStage={activeStage}
        traveller={traveller}
        onSelectStage={handleSelectStage}
      />

      {/* Split Window Body: Left Workflow Steps | Right Instrument Inspector & Summary */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Workflow Steps List with Name, Status, Timestamp */}
        <StepList
          steps={traveller.steps}
          activeStage={activeStage}
          selectedStepId={selectedStepId}
          onSelectStep={handleSelectStep}
          onOpenAddStep={() => setIsConfigModalOpen(true)}
        />

        {/* Right Side: Instrument Details, Progress & Calibration Audit Trail */}
        <TravellerSummary
          traveller={traveller}
          selectedStep={selectedStep}
          onOpenStepDialog={(step) => {
            setSelectedStepId(step.id);
            setIsStepDialogOpen(true);
          }}
          onExportJson={handleExportJson}
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

      {/* Barcode Scanner Modal Dialog */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        currentSerial={traveller.serialNumber}
        currentSystem={traveller.system}
        onClose={() => setIsBarcodeModalOpen(false)}
        onUpdateSerial={handleUpdateSerial}
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
