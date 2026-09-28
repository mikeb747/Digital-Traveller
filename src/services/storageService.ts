import { TravellerRecord, SystemType, WorkflowStep } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';
import { WorkflowTemplateService } from './workflowTemplateService';

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
    const operator = operatorName || this.getLastActiveTechnician() || 'Senior QA / Build Tech';

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
          return {
            ...parsed,
            system: normalizedSystem
          };
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
          return parsed;
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
    return parsed as TravellerRecord;
  }
}
