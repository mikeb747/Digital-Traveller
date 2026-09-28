import { SystemType, WorkflowStep, WorkflowStage } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';
import { SystemRegistryService } from './systemRegistryService';

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

export interface MultiSystemWorkflowBundle {
  version: string;
  exportedAt: string;
  systems: Record<string, WorkflowTemplate>;
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

    // Default template extraction from system profile or generic template for new systems
    const profile = SYSTEM_PROFILES[normalizedSystem];
    const defaultStages = profile?.defaultSteps
      ? Array.from(new Set(profile.defaultSteps.map((s) => s.stage)))
      : ['Setup', 'Calibration', 'Final Test & Release'];

    let defaultSteps: WorkflowTemplateItem[] = [];

    if (profile && profile.defaultSteps) {
      defaultSteps = profile.defaultSteps.map((s) => ({
        name: s.name,
        stage: s.stage,
        instructions: [...s.instructions],
        checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
        measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
      }));
    } else {
      // Default placeholder workflows for newly created custom systems
      defaultSteps = [
        {
          name: `${normalizedSystem} System Unpacking & Mechanical Inspection`,
          stage: 'Setup',
          instructions: [
            `Verify ${normalizedSystem} baseplate and chassis integrity.`,
            'Confirm electrical grounding and safety interlock loop continuity.',
            'Record environment temperature (20°C ± 1°C) and cleanroom status.'
          ],
          checklist: [
            { id: 'c1', label: 'Chassis unboxing inspection complete', done: false },
            { id: 'c2', label: 'Earth ground resistance < 0.1 Ohm verified', done: false }
          ]
        },
        {
          name: `${normalizedSystem} Optical & Sensor Calibration`,
          stage: 'Calibration',
          instructions: [
            'Align laser source with entrance aperture.',
            'Execute standard silicon reference peak verification (520.7 cm⁻¹).',
            'Log detector sensitivity and background noise level.'
          ],
          checklist: [
            { id: 'c3', label: 'Reference peak alignment passed', done: false }
          ],
          measuredData: [
            { parameter: 'Calibration Peak Center', value: '', unit: 'cm⁻¹', tolerance: '520.70 ± 0.10' },
            { parameter: 'Signal Intensity', value: '', unit: 'cts/sec', tolerance: '> 50,000' }
          ]
        },
        {
          name: `${normalizedSystem} Final Test Acceptance & Quality Sign-Off`,
          stage: 'Final Test & Release',
          instructions: [
            'Complete full system automated diagnostic run.',
            'Verify all test acceptance criteria and minor deviation records.',
            'Affix quality hologram seal and generate signed certificate of conformity.'
          ],
          checklist: [
            { id: 'c4', label: 'All test sheets and parameters confirmed', done: false },
            { id: 'c5', label: 'QA acceptance sign-off recorded', done: false }
          ]
        }
      ];
    }

    const initialTemplate: WorkflowTemplate = {
      system: normalizedSystem,
      stages: defaultStages,
      steps: defaultSteps,
      version: '1.2.0',
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
   * Export ALL systems workflows in ONE single unified JSON file
   */
  static exportAllSystemsBundle(activeTravellerForCurrentSystem?: { system: SystemType; stages: string[]; steps: WorkflowStep[] }): void {
    const systems = SystemRegistryService.getSystems();
    const bundle: MultiSystemWorkflowBundle = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      systems: {}
    };

    systems.forEach((sys) => {
      // If caller provided current live traveler snapshot for this system, prefer it to capture latest edits
      if (activeTravellerForCurrentSystem && activeTravellerForCurrentSystem.system === sys) {
        bundle.systems[sys] = {
          system: sys,
          stages: [...activeTravellerForCurrentSystem.stages],
          steps: activeTravellerForCurrentSystem.steps.map((s) => ({
            name: s.name,
            stage: s.stage,
            instructions: [...s.instructions],
            checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
            measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
          })),
          version: '2.0.0',
          lastUpdated: new Date().toISOString()
        };
      } else {
        bundle.systems[sys] = this.getTemplate(sys);
      }
    });

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Renishaw_All_Systems_Workflows_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Import all workflows from a single unified JSON file (supports single or multi-system bundle)
   */
  static importAllSystemsBundle(jsonText: string): { importedSystems: string[]; totalStepsCount: number } {
    const parsed = JSON.parse(jsonText);
    const importedSystems: string[] = [];
    let totalStepsCount = 0;

    // Case 1: Multi-system bundle { systems: { inVia: {...}, Virsa: {...} } }
    if (parsed.systems && typeof parsed.systems === 'object') {
      Object.keys(parsed.systems).forEach((sysKey) => {
        const t = parsed.systems[sysKey];
        if (t && Array.isArray(t.stages) && Array.isArray(t.steps)) {
          const sysName: SystemType = sysKey.toLowerCase() === 'invia' ? 'inVia' : sysKey;
          // Register system if it was custom
          SystemRegistryService.addSystem(sysName);
          const tToSave: WorkflowTemplate = {
            system: sysName,
            stages: t.stages,
            steps: t.steps,
            version: t.version || '2.0.0',
            lastUpdated: new Date().toISOString()
          };
          this.saveTemplate(tToSave);
          importedSystems.push(sysName);
          totalStepsCount += t.steps.length;
        }
      });
    } else if (parsed.system && Array.isArray(parsed.stages) && Array.isArray(parsed.steps)) {
      // Case 2: Single system template legacy file
      const sysName: SystemType = parsed.system.toLowerCase() === 'invia' ? 'inVia' : parsed.system;
      SystemRegistryService.addSystem(sysName);
      const tToSave: WorkflowTemplate = {
        system: sysName,
        stages: parsed.stages,
        steps: parsed.steps,
        version: parsed.version || '1.2.0',
        lastUpdated: new Date().toISOString()
      };
      this.saveTemplate(tToSave);
      importedSystems.push(sysName);
      totalStepsCount += parsed.steps.length;
    } else {
      throw new Error('Unrecognized JSON format: Expected multi-system workflow bundle or system template.');
    }

    return { importedSystems, totalStepsCount };
  }

  /**
   * Export single system template (backward-compatibility alias)
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
}
