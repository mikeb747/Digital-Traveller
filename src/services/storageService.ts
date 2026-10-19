import { TravellerRecord, SystemType, WorkflowStep } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';
import { WorkflowTemplateService } from './workflowTemplateService';
import {
  LASER_GRATING_FILES_SAVE_INSTRUCTION,
  LASER_GRATING_FILES_STEP_NAME,
  LASER_GRATING_SELECTION_STEP_NAME,
  RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS,
  RECORD_SYSTEM_DETAILS_STEP_NAME,
  SYSTEM_UNBOXING_STEP_INSTRUCTIONS,
  SYSTEM_UNBOXING_STEP_NAME,
  SYSTEM_FOLDERS_STEP_NAME,
  SYSTEM_FOLDERS_STEP_INSTRUCTIONS
} from './laserGratingWorkflow';

const STORAGE_KEY_CURRENT = 'digital_traveller_current_record';
const STORAGE_KEY_RECORDS = 'digital_traveller_records_history';
const STORAGE_KEY_ACTIVE_SYSTEM = 'digital_traveller_active_system';
const STORAGE_KEY_SYSTEM_PREFIX = 'digital_traveller_system_';
const STORAGE_KEY_TECHS = 'digital_traveller_technicians';
const STORAGE_KEY_SAVE_LOCATION = 'digital_traveller_save_location';

export const DEFAULT_TECHNICIANS = [
  'P. Street',
  'M. Stinchcombe',
  'K. Pettet',
  'R. Meek',
  'M. Brown',
  'C. Smith',
  'P. Hall',
  'P. Watson'
];

export class StorageService {
  /**
   * Create a new traveler record initialized with persistent template for the selected system.
   * Loads custom tabs and steps added by Admin from WorkflowTemplateService.
   * System S/N is blank by default until entered by user or scanned.
   */
  static createNewTraveller(
    system: SystemType = 'inVia',
    customSerial?: string,
    customerName?: string,
    jobNumber?: string,
    partNumber?: string,
    operatorName?: string
  ): TravellerRecord {
    const normalizedSystem: SystemType = (system as string).toLowerCase() === 'invia' ? 'inVia' : system;
    
    // S/N is blank until entered
    const serial = customSerial !== undefined ? customSerial.trim() : '';
    const workOrder = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const operator = operatorName || this.getLastActiveTechnician() || 'M. Brown';

    // Load persistent template (persists custom tabs and steps added by Admin)
    const template = WorkflowTemplateService.getTemplate(normalizedSystem);

    const steps: WorkflowStep[] = template.steps.map((stepDef, idx) => ({
      ...stepDef,
      id: `step-${normalizedSystem}-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'Not Started',
      completedAt: null,
      startedAt: null,
      technician: '',
      notes: '',
      checklist: stepDef.checklist ? stepDef.checklist.map(c => ({ ...c })) : [],
      measuredData: stepDef.measuredData ? stepDef.measuredData.map(m => ({ ...m })) : [],
    }));

    const now = new Date().toISOString();
    return {
      id: `traveller-${Date.now()}`,
      serialNumber: serial,
      system: normalizedSystem,
      workOrderNumber: workOrder,
      customerName: customerName || '',
      jobNumber: jobNumber || '',
      partNumber: partNumber || '',
      operatorName: operator,
      createdAt: now,
      updatedAt: now,
      activeStage: template.stages[0] || 'Setup',
      stages: [...template.stages],
      steps,
      laserGratingCombinations: [],
      auditLog: [
        {
          timestamp: now,
          action: `Traveller initialized for system ${normalizedSystem}${serial ? ` (${serial})` : ''}`,
          user: operator
        }
      ]
    };
  }

  /**
   * Save current traveler to local storage and historical registry
   */
  static saveTraveller(record: TravellerRecord): void {
    try {
      const normalizedRecord: TravellerRecord = {
        ...record,
        system: (record.system as string).toLowerCase() === 'invia' ? 'inVia' : record.system
      };
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(normalizedRecord));
      localStorage.setItem(`${STORAGE_KEY_SYSTEM_PREFIX}${normalizedRecord.system}`, JSON.stringify(normalizedRecord));
      localStorage.setItem(STORAGE_KEY_ACTIVE_SYSTEM, normalizedRecord.system);

      // Update history list
      const existingHistory = this.loadHistory();
      const updated = [normalizedRecord, ...existingHistory.filter(r => r.id !== normalizedRecord.id)].slice(0, 25);
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }

  /**
   * Load active traveler for a specific system (persists across system switches)
   */
  static loadTravellerForSystem(system: SystemType): TravellerRecord {
    const normalizedSystem: SystemType = (system as string).toLowerCase() === 'invia' ? 'inVia' : system;
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_SYSTEM_PREFIX}${normalizedSystem}`);
      if (data) {
        const parsed = JSON.parse(data) as TravellerRecord;
        if (parsed && Array.isArray(parsed.steps)) {
          return this.ensureWorkflowSteps({
            ...parsed,
            system: normalizedSystem
          });
        }
      }
    } catch (e) {
      console.warn(`Could not load record for ${normalizedSystem}, creating new`, e);
    }
    const newRecord = this.createNewTraveller(normalizedSystem);
    this.saveTraveller(newRecord);
    return newRecord;
  }

  /**
   * Load active traveler from local storage, or instantiate default
   */
  static loadCurrentTraveller(): TravellerRecord {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (data) {
        const parsed = JSON.parse(data) as TravellerRecord;
        if (parsed && parsed.steps) {
          if ((parsed.system as string).toLowerCase() === 'invia') {
            parsed.system = 'inVia';
          }
          // Ensure active operator matches the last selected technician if none set
          const lastTech = this.getLastActiveTechnician();
          if (!parsed.operatorName && lastTech) {
            parsed.operatorName = lastTech;
          }
          return this.ensureWorkflowSteps(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not parse stored record, creating new', e);
    }
    const defaultRec = this.createNewTraveller('inVia');
    this.saveTraveller(defaultRec);
    return defaultRec;
  }

  /**
   * Load history of travelers
   */
  static loadHistory(): TravellerRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (data) {
        return JSON.parse(data) as TravellerRecord[];
      }
    } catch (e) {
      console.warn('Could not parse history', e);
    }
    return [];
  }

  /**
   * Technicians list storage
   */
  static getTechnicians(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TECHS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load technicians', e);
    }
    return [...DEFAULT_TECHNICIANS];
  }

  static addTechnician(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getTechnicians();
    const existing = this.getTechnicians();
    if (!existing.includes(trimmed)) {
      const updated = [...existing, trimmed];
      try {
        localStorage.setItem(STORAGE_KEY_TECHS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save technicians', e);
      }
      return updated;
    }
    return existing;
  }

  static getLastActiveTechnician(): string {
    return localStorage.getItem('digital_traveller_last_tech') || 'M. Brown';
  }

  static setLastActiveTechnician(tech: string): void {
    try {
      localStorage.setItem('digital_traveller_last_tech', tech);
    } catch (e) {
      console.error(e);
    }
  }

  static getSaveLocation(): string {
    return localStorage.getItem(STORAGE_KEY_SAVE_LOCATION) || '';
  }

  static setSaveLocation(location: string): void {
    try {
      const trimmed = location.trim();
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY_SAVE_LOCATION, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY_SAVE_LOCATION);
      }
    } catch (e) {
      console.error('Failed to save file location', e);
      throw e;
    }
  }

  /**
   * Export traveller record as downloadable JSON file
   */
  static exportToJson(record: TravellerRecord): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const snPart = record.serialNumber ? record.serialNumber : 'Unassigned';
    const filename = `DigitalTraveller_${record.system}_${snPart}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Parse uploaded JSON text and validate structure
   */
  static importFromJsonText(jsonText: string): TravellerRecord {
    const parsed = JSON.parse(jsonText);
    if (!parsed.system || !parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Invalid Digital Traveller JSON format: Missing mandatory fields.');
    }
    if ((parsed.system as string).toLowerCase() === 'invia') {
      parsed.system = 'inVia';
    }
    return this.ensureWorkflowSteps(parsed as TravellerRecord);
  }

  private static ensureWorkflowSteps(record: TravellerRecord): TravellerRecord {
    const template = WorkflowTemplateService.getTemplate(record.system);
    const requiredStepNames = new Set([
      RECORD_SYSTEM_DETAILS_STEP_NAME,
      SYSTEM_FOLDERS_STEP_NAME,
      LASER_GRATING_SELECTION_STEP_NAME,
      LASER_GRATING_FILES_STEP_NAME
    ]);
    const existingNames = new Set(record.steps.map((step) => step.name));
    const missingSteps = template.steps
      .filter((step) => requiredStepNames.has(step.name) && !existingNames.has(step.name))
      .map((step, index): WorkflowStep => ({
        ...step,
        id: `step-${record.system}-laser-grating-${Date.now().toString(36)}-${index}`,
        status: 'Not Started',
        completedAt: null,
        startedAt: null,
        technician: '',
        notes: '',
        checklist: step.checklist?.map((item) => ({ ...item, done: false })) || [],
        measuredData: step.measuredData?.map((item) => ({ ...item, value: '' })) || []
      }));
    const existingUnboxingStep = record.steps.find(
      (step) => step.name === SYSTEM_UNBOXING_STEP_NAME
    );
    const originalFirstSetupStep = existingUnboxingStep ? undefined : record.steps.find(
      (step) =>
        step.stage === 'Setup' &&
        step.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
        step.name !== SYSTEM_FOLDERS_STEP_NAME &&
        step.name !== SYSTEM_UNBOXING_STEP_NAME
    );
    const unboxingStep = existingUnboxingStep
      ? { ...existingUnboxingStep, stage: 'Setup' }
      : (originalFirstSetupStep
        ? {
            ...originalFirstSetupStep,
            name: SYSTEM_UNBOXING_STEP_NAME,
            stage: 'Setup',
            instructions: [
              ...originalFirstSetupStep.instructions,
              ...SYSTEM_UNBOXING_STEP_INSTRUCTIONS
            ]
          }
        : {
            id: `step-${record.system}-system-setup-${Date.now().toString(36)}`,
            name: SYSTEM_UNBOXING_STEP_NAME,
            stage: 'Setup',
            status: 'Not Started' as const,
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: '',
            instructions: [...SYSTEM_UNBOXING_STEP_INSTRUCTIONS],
            checklist: [],
            measuredData: []
          });
    const existingDetailsStep = record.steps.find(
      (step) => step.name === RECORD_SYSTEM_DETAILS_STEP_NAME
    );
    const detailsStep = existingDetailsStep
      ? { ...existingDetailsStep, stage: 'Setup' }
      : missingSteps.find((step) => step.name === RECORD_SYSTEM_DETAILS_STEP_NAME) || {
          id: `step-${record.system}-system-details-${Date.now().toString(36)}`,
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
    const existingSystemFolderStep = record.steps.find(
      (step) => step.name === SYSTEM_FOLDERS_STEP_NAME
    );
    const systemFolderStep = existingSystemFolderStep
      ? { ...existingSystemFolderStep, stage: 'Setup' }
      : missingSteps.find((step) => step.name === SYSTEM_FOLDERS_STEP_NAME);
    const otherSteps = [...record.steps, ...missingSteps]
      .filter((step) =>
        ![
          SYSTEM_UNBOXING_STEP_NAME,
          RECORD_SYSTEM_DETAILS_STEP_NAME,
          SYSTEM_FOLDERS_STEP_NAME
        ].includes(step.name) && step !== originalFirstSetupStep
      )
      .map((step) => step.name === LASER_GRATING_FILES_STEP_NAME
        ? {
            ...step,
            instructions: (Array.isArray(step.instructions) ? step.instructions : []).map((instruction) =>
              instruction.includes('Files are saved in My Documents')
                ? LASER_GRATING_FILES_SAVE_INSTRUCTION
                : instruction
            )
          }
        : step);

    return {
      ...record,
      stages: Array.from(new Set([...(record.stages || template.stages), 'Calibration'])),
      steps: [unboxingStep, detailsStep, systemFolderStep || {
        id: `step-${record.system}-system-folders-${Date.now().toString(36)}`,
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
      }, ...otherSteps],
      laserGratingCombinations: Array.isArray(record.laserGratingCombinations)
        ? record.laserGratingCombinations.map((combination) => ({
            wavelengthNm:
              typeof combination?.wavelengthNm === 'string' ? combination.wavelengthNm : '',
            gratingDensityLinesPerMm:
              typeof combination?.gratingDensityLinesPerMm === 'string'
                ? combination.gratingDensityLinesPerMm
                : ''
          }))
        : []
    };
  }
}
