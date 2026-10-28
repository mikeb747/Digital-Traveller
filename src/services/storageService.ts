import { TravellerRecord, SystemType, WorkflowStep } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';
import { WorkflowTemplateService } from './workflowTemplateService';
import {
  LASER_GRATING_FILES_SAVE_INSTRUCTION,
  LASER_GRATING_FILES_STEP_NAME,
  LASER_GRATING_SELECTION_STEP_NAME,
  PAT_TEST_STEP_NAME,
  PRE_SYSTEM_TEST_STEP_NAME,
  RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS,
  RECORD_SYSTEM_DETAILS_STEP_NAME,
  SYSTEM_UNBOXING_STEP_INSTRUCTIONS,
  SYSTEM_UNBOXING_STEP_NAME,
  LEGACY_SYSTEM_UNBOXING_STEP_NAME,
  SYSTEM_FOLDERS_STEP_NAME,
  SYSTEM_FOLDERS_STEP_INSTRUCTIONS,
  PAT_TEST_STEP_INSTRUCTIONS,
  PRE_SYSTEM_TEST_STEP_INSTRUCTIONS
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
      activeStage: template.stages[0] || 'Set Up',
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

    // Normalize stages: rename 'Setup' to 'Set Up'
    const normalizedStages = Array.from(new Set(
      (record.stages || template.stages).map((s) => (s === 'Setup' ? 'Set Up' : s))
    ));
    if (!normalizedStages.includes('Set Up')) normalizedStages.unshift('Set Up');
    if (!normalizedStages.includes('Calibration')) normalizedStages.push('Calibration');
    if (!normalizedStages.includes('Final Test & Release')) normalizedStages.push('Final Test & Release');

    const activeStage = record.activeStage === 'Setup' ? 'Set Up' : (record.activeStage || 'Set Up');

    // Normalize existing steps
    const existingSteps = record.steps.map((step) => ({
      ...step,
      stage: step.stage === 'Setup' ? 'Set Up' : step.stage,
      name: step.name === LEGACY_SYSTEM_UNBOXING_STEP_NAME ? SYSTEM_UNBOXING_STEP_NAME : step.name
    }));

    const isinVia = record.system === 'inVia';

    if (isinVia) {
      const existingPatStep = existingSteps.find((s) => s.name === PAT_TEST_STEP_NAME);
      const patStep: WorkflowStep = existingPatStep || {
        id: `step-${record.system}-pat-${Date.now().toString(36)}`,
        name: PAT_TEST_STEP_NAME,
        stage: 'Set Up',
        status: 'Not Started',
        completedAt: null,
        startedAt: null,
        technician: '',
        notes: '',
        instructions: [...PAT_TEST_STEP_INSTRUCTIONS],
        checklist: [
          { id: 'pat1', label: 'Visual inspection of mains lead and plug passed', done: false },
          { id: 'pat2', label: 'Earth continuity test passed (< 0.1 Ω)', done: false },
          { id: 'pat3', label: 'Insulation resistance test passed (> 2.0 MΩ at 500V DC)', done: false },
          { id: 'pat4', label: 'PAT safety pass label affixed to chassis and power supply', done: false }
        ],
        measuredData: [
          { parameter: 'Earth Continuity', value: '', unit: 'Ω', tolerance: '< 0.10 Ω' },
          { parameter: 'Insulation Resistance', value: '', unit: 'MΩ', tolerance: '> 2.0 MΩ' }
        ]
      };

      const existingPreStep = existingSteps.find((s) => s.name === PRE_SYSTEM_TEST_STEP_NAME);
      const preStep: WorkflowStep = existingPreStep || {
        id: `step-${record.system}-pre-${Date.now().toString(36)}`,
        name: PRE_SYSTEM_TEST_STEP_NAME,
        stage: 'Set Up',
        status: 'Not Started',
        completedAt: null,
        startedAt: null,
        technician: '',
        notes: '',
        instructions: [...PRE_SYSTEM_TEST_STEP_INSTRUCTIONS],
        checklist: [
          { id: 'pst1', label: 'Internal DC power supply voltages verified', done: false },
          { id: 'pst2', label: 'Laser safety interlock loops and microswitches verified', done: false },
          { id: 'pst3', label: 'Host PC communication and USB/Ethernet links established', done: false }
        ],
        measuredData: [
          { parameter: 'DC 24V Rail', value: '', unit: 'V', tolerance: '24.0 ± 0.5 V' },
          { parameter: 'DC 5V Rail', value: '', unit: 'V', tolerance: '5.0 ± 0.2 V' }
        ]
      };

      const existingSetupStep = existingSteps.find(
        (s) => s.name === SYSTEM_UNBOXING_STEP_NAME || s.name === LEGACY_SYSTEM_UNBOXING_STEP_NAME
      );
      const setupStep: WorkflowStep = existingSetupStep
        ? { ...existingSetupStep, name: SYSTEM_UNBOXING_STEP_NAME, stage: 'Set Up' }
        : {
            id: `step-${record.system}-system-setup-${Date.now().toString(36)}`,
            name: SYSTEM_UNBOXING_STEP_NAME,
            stage: 'Set Up',
            status: 'Not Started',
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: '',
            instructions: [...SYSTEM_UNBOXING_STEP_INSTRUCTIONS],
            checklist: [],
            measuredData: []
          };

      const existingDetailsStep = existingSteps.find((s) => s.name === RECORD_SYSTEM_DETAILS_STEP_NAME);
      const detailsStep: WorkflowStep = existingDetailsStep
        ? { ...existingDetailsStep, stage: 'Set Up' }
        : {
            id: `step-${record.system}-system-details-${Date.now().toString(36)}`,
            name: RECORD_SYSTEM_DETAILS_STEP_NAME,
            stage: 'Set Up',
            status: 'Not Started',
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: '',
            instructions: [...RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS],
            checklist: [],
            measuredData: []
          };

      const existingFolderStep = existingSteps.find((s) => s.name === SYSTEM_FOLDERS_STEP_NAME);
      const folderStep: WorkflowStep = existingFolderStep
        ? { ...existingFolderStep, stage: 'Set Up' }
        : {
            id: `step-${record.system}-system-folders-${Date.now().toString(36)}`,
            name: SYSTEM_FOLDERS_STEP_NAME,
            stage: 'Set Up',
            status: 'Not Started',
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: '',
            instructions: [...SYSTEM_FOLDERS_STEP_INSTRUCTIONS],
            checklist: [],
            measuredData: []
          };

      const otherSteps = existingSteps.filter(
        (s) =>
          s.name !== PAT_TEST_STEP_NAME &&
          s.name !== PRE_SYSTEM_TEST_STEP_NAME &&
          s.name !== SYSTEM_UNBOXING_STEP_NAME &&
          s.name !== LEGACY_SYSTEM_UNBOXING_STEP_NAME &&
          s.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
          s.name !== SYSTEM_FOLDERS_STEP_NAME
      ).map((s) => {
        // Remap Laser Beam Alignment and Grating Turret to Calibration tab
        if (s.name === 'Laser Beam Alignment & Safety Interlocks' || s.name === 'Grating Turret & Slit Alignment') {
          return { ...s, stage: 'Calibration' };
        }
        // Remap Rayleigh Cut-off and CCD Detector Cooling to Set Up tab
        if (s.name === 'Rayleigh Cut-off Filter Calibration' || s.name === 'CCD Detector Cooling & Dark Count Test') {
          return { ...s, stage: 'Set Up' };
        }
        if (s.name === LASER_GRATING_FILES_STEP_NAME && Array.isArray(s.instructions)) {
          return {
            ...s,
            instructions: s.instructions.map((inst) =>
              inst.includes('Files are saved in My Documents') ? LASER_GRATING_FILES_SAVE_INSTRUCTION : inst
            )
          };
        }
        return s;
      });

      // Also ensure template steps exist if missing
      for (const tStep of template.steps) {
        if (
          tStep.name !== PAT_TEST_STEP_NAME &&
          tStep.name !== PRE_SYSTEM_TEST_STEP_NAME &&
          tStep.name !== SYSTEM_UNBOXING_STEP_NAME &&
          tStep.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
          tStep.name !== SYSTEM_FOLDERS_STEP_NAME &&
          !otherSteps.some((s) => s.name === tStep.name)
        ) {
          otherSteps.push({
            ...tStep,
            id: `step-${record.system}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            status: 'Not Started',
            completedAt: null,
            startedAt: null,
            technician: '',
            notes: '',
            checklist: tStep.checklist?.map((c) => ({ ...c })) || [],
            measuredData: tStep.measuredData?.map((m) => ({ ...m })) || []
          });
        }
      }

      const setUpOthers = otherSteps.filter((s) => s.stage === 'Set Up');
      const calibOthers = otherSteps.filter((s) => s.stage === 'Calibration');
      const restOthers = otherSteps.filter((s) => s.stage !== 'Set Up' && s.stage !== 'Calibration');

      const finalSteps: WorkflowStep[] = [
        patStep,
        preStep,
        setupStep,
        detailsStep,
        folderStep,
        ...setUpOthers,
        ...calibOthers,
        ...restOthers
      ];

      return {
        ...record,
        stages: normalizedStages,
        activeStage,
        steps: finalSteps,
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

    // For non-inVia systems
    const existingSetupStep = existingSteps.find(
      (step) => step.name === SYSTEM_UNBOXING_STEP_NAME || step.name === LEGACY_SYSTEM_UNBOXING_STEP_NAME
    ) || existingSteps.find((step) =>
      (step.stage === 'Set Up' || step.stage === 'Setup') &&
      step.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
      step.name !== SYSTEM_FOLDERS_STEP_NAME
    );

    const unboxingStep: WorkflowStep = existingSetupStep
      ? { ...existingSetupStep, name: SYSTEM_UNBOXING_STEP_NAME, stage: 'Set Up' }
      : {
          id: `step-${record.system}-system-setup-${Date.now().toString(36)}`,
          name: SYSTEM_UNBOXING_STEP_NAME,
          stage: 'Set Up',
          status: 'Not Started',
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...SYSTEM_UNBOXING_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };

    const existingDetailsStep = existingSteps.find((step) => step.name === RECORD_SYSTEM_DETAILS_STEP_NAME);
    const detailsStep: WorkflowStep = existingDetailsStep
      ? { ...existingDetailsStep, stage: 'Set Up' }
      : {
          id: `step-${record.system}-system-details-${Date.now().toString(36)}`,
          name: RECORD_SYSTEM_DETAILS_STEP_NAME,
          stage: 'Set Up',
          status: 'Not Started',
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };

    const existingSystemFolderStep = existingSteps.find((step) => step.name === SYSTEM_FOLDERS_STEP_NAME);
    const systemFolderStep: WorkflowStep = existingSystemFolderStep
      ? { ...existingSystemFolderStep, stage: 'Set Up' }
      : {
          id: `step-${record.system}-system-folders-${Date.now().toString(36)}`,
          name: SYSTEM_FOLDERS_STEP_NAME,
          stage: 'Set Up',
          status: 'Not Started',
          completedAt: null,
          startedAt: null,
          technician: '',
          notes: '',
          instructions: [...SYSTEM_FOLDERS_STEP_INSTRUCTIONS],
          checklist: [],
          measuredData: []
        };

    const otherSteps = existingSteps
      .filter((step) =>
        ![
          SYSTEM_UNBOXING_STEP_NAME,
          LEGACY_SYSTEM_UNBOXING_STEP_NAME,
          RECORD_SYSTEM_DETAILS_STEP_NAME,
          SYSTEM_FOLDERS_STEP_NAME
        ].includes(step.name) && step !== existingSetupStep
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
      stages: normalizedStages,
      activeStage,
      steps: [unboxingStep, detailsStep, systemFolderStep, ...otherSteps],
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
