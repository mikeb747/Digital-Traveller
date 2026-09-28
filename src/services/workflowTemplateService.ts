import { SystemType, WorkflowStep, WorkflowStage } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';

export interface WorkflowTemplateItem {
  name: string;
  stage: WorkflowStage;
  instructions: string[];
  checklist?: { id: string; label: string; done: boolean }[];
  measuredData?: { parameter: string; value: string; unit: string; tolerance?: string }[];
}

export interface WorkflowTemplate {
  system: SystemType;
  stages: string[];
  steps: WorkflowTemplateItem[];
  version: string;
  lastUpdated: string;
}

const TEMPLATE_STORAGE_PREFIX = 'digital_traveller_workflow_template_';

export class WorkflowTemplateService {
  /**
   * Get the active workflow template for a system model.
   * If an admin has added custom tabs or steps, they are loaded from persistent storage.
   * Otherwise, the base defaults are initialized and saved.
   */
  static getTemplate(system: SystemType): WorkflowTemplate {
    const normalizedSystem: SystemType = (system as string).toLowerCase() === 'invia' ? 'inVia' : system;
    const storageKey = `${TEMPLATE_STORAGE_PREFIX}${normalizedSystem}`;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as WorkflowTemplate;
        if (parsed && Array.isArray(parsed.stages) && Array.isArray(parsed.steps)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Failed to read workflow template for ${normalizedSystem}`, e);
    }

    // Default template extraction from system profile
    const profile = SYSTEM_PROFILES[normalizedSystem] || SYSTEM_PROFILES['inVia'];
    const defaultStages = ['Setup', 'Calibration', 'Final Test & Release'];
    const defaultSteps: WorkflowTemplateItem[] = profile.defaultSteps.map((s) => ({
      name: s.name,
      stage: s.stage,
      instructions: [...s.instructions],
      checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
      measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
    }));

    const initialTemplate: WorkflowTemplate = {
      system: normalizedSystem,
      stages: defaultStages,
      steps: defaultSteps,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    this.saveTemplate(initialTemplate);
    return initialTemplate;
  }

  /**
   * Save workflow template to persistent storage
   */
  static saveTemplate(template: WorkflowTemplate): void {
    const normalizedSystem: SystemType = (template.system as string).toLowerCase() === 'invia' ? 'inVia' : template.system;
    const storageKey = `${TEMPLATE_STORAGE_PREFIX}${normalizedSystem}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...template,
        system: normalizedSystem,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.error(`Failed to save workflow template for ${normalizedSystem}`, e);
    }
  }

  /**
   * Add a new workflow stage/tab to the persistent template
   */
  static addTabToTemplate(system: SystemType, tabName: string): WorkflowTemplate {
    const template = this.getTemplate(system);
    if (!template.stages.includes(tabName)) {
      template.stages.push(tabName);
      this.saveTemplate(template);
    }
    return template;
  }

  /**
   * Add a new workflow step to the persistent template
   */
  static addStepToTemplate(
    system: SystemType,
    stage: string,
    stepName: string,
    instructions: string[]
  ): WorkflowTemplate {
    const template = this.getTemplate(system);
    if (!template.stages.includes(stage)) {
      template.stages.push(stage);
    }
    template.steps.push({
      name: stepName,
      stage,
      instructions,
      checklist: [{ id: `chk-${Date.now()}`, label: 'Verify procedure completed', done: false }]
    });
    this.saveTemplate(template);
    return template;
  }

  /**
   * Update the ordering of steps in the persistent template
   */
  static updateStepsOrderInTemplate(system: SystemType, activeSteps: WorkflowStep[]): void {
    const template = this.getTemplate(system);
    // Map current full steps order back into template items
    const templateSteps: WorkflowTemplateItem[] = activeSteps.map((s) => ({
      name: s.name,
      stage: s.stage,
      instructions: [...s.instructions],
      checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
      measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
    }));

    template.steps = templateSteps;
    this.saveTemplate(template);
  }

  /**
   * Export the workflow template file as JSON (for backup, sharing, or version control)
   */
  static exportTemplateToFile(system: SystemType): void {
    const template = this.getTemplate(system);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `WorkflowTemplate_${system}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Import workflow template from JSON file
   */
  static importTemplateFromFile(system: SystemType, jsonContent: string): WorkflowTemplate {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed.stages) || !Array.isArray(parsed.steps)) {
      throw new Error('Invalid workflow template JSON format.');
    }
    const template: WorkflowTemplate = {
      system,
      stages: parsed.stages,
      steps: parsed.steps,
      version: parsed.version || '1.1.0',
      lastUpdated: new Date().toISOString()
    };
    this.saveTemplate(template);
    return template;
  }
}
