import { TravellerRecord, SystemType, WorkflowStep } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';

const STORAGE_KEY_CURRENT = 'digital_traveller_current_record';
const STORAGE_KEY_RECORDS = 'digital_traveller_records_history';
const STORAGE_KEY_ACTIVE_SYSTEM = 'digital_traveller_active_system';
const STORAGE_KEY_SYSTEM_PREFIX = 'digital_traveller_system_';
const STORAGE_KEY_TECHS = 'digital_traveller_technicians';

const DEFAULT_TECHNICIANS = [
  'Senior QA / Build Tech',
  'Mike Brown',
  'Lead Test Engineer',
  'Optical Calibration Specialist'
];

export class StorageService {
  /**
   * Create a new traveler record initialized with default steps for the selected system
   */
  static createNewTraveller(
    system: SystemType = 'InVia',
    customSerial?: string,
    customerName?: string,
    jobNumber?: string,
    partNumber?: string,
    operatorName?: string
  ): TravellerRecord {
    const profile = SYSTEM_PROFILES[system];
    const prefix = system.toUpperCase().slice(0, 3);
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const serial = customSerial?.trim() || `${prefix}-${randomSeq}`;
    const workOrder = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const operator = operatorName || this.getLastActiveTechnician() || 'Senior QA / Build Tech';

    const steps: WorkflowStep[] = profile.defaultSteps.map((stepDef, idx) => ({
      ...stepDef,
      id: `step-${system}-${idx + 1}-${Date.now().toString(36)}`,
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
      system,
      workOrderNumber: workOrder,
      customerName: customerName || '',
      jobNumber: jobNumber || '',
      partNumber: partNumber || '',
      operatorName: operator,
      createdAt: now,
      updatedAt: now,
      activeStage: 'Setup',
      steps,
      auditLog: [
        {
          timestamp: now,
          action: `Traveller initialized for system ${system} (${serial})`,
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
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(record));
      localStorage.setItem(`${STORAGE_KEY_SYSTEM_PREFIX}${record.system}`, JSON.stringify(record));
      localStorage.setItem(STORAGE_KEY_ACTIVE_SYSTEM, record.system);

      // Update history list
      const existingHistory = this.loadHistory();
      const updated = [record, ...existingHistory.filter(r => r.id !== record.id)].slice(0, 25);
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }

  /**
   * Load active traveler for a specific system (persists across system switches)
   */
  static loadTravellerForSystem(system: SystemType): TravellerRecord {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_SYSTEM_PREFIX}${system}`);
      if (data) {
        const parsed = JSON.parse(data) as TravellerRecord;
        if (parsed.system === system && Array.isArray(parsed.steps)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Could not load record for ${system}, creating new`, e);
    }
    const newRecord = this.createNewTraveller(system);
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
        return JSON.parse(data) as TravellerRecord;
      }
    } catch (e) {
      console.warn('Could not parse stored record, creating new', e);
    }
    const defaultRec = this.createNewTraveller('InVia');
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
    return localStorage.getItem('digital_traveller_last_tech') || 'Senior QA / Build Tech';
  }

  static setLastActiveTechnician(tech: string): void {
    try {
      localStorage.setItem('digital_traveller_last_tech', tech);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Export traveller record as downloadable JSON file
   */
  static exportToJson(record: TravellerRecord): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const filename = `DigitalTraveller_${record.system}_${record.serialNumber}_${new Date().toISOString().slice(0, 10)}.json`;
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
    if (!parsed.system || !parsed.steps || !Array.isArray(parsed.steps) || !parsed.serialNumber) {
      throw new Error('Invalid Digital Traveller JSON format: Missing mandatory fields.');
    }
    return parsed as TravellerRecord;
  }
}
