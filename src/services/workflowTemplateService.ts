import { SystemType, WorkflowStep, WorkflowStage } from '../types/traveller';
import { SYSTEM_PROFILES } from './defaultWorkflows';
import { SystemRegistryService } from './systemRegistryService';
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

export interface WorkflowTemplateItem {
  name: string;
  stage: WorkflowStage;
  instructions: string[];
  checklist?: { id: string; label: string; done: boolean }[];
  measuredData?: { parameter: string; value: string; unit: string; tolerance?: string }[];
}

const PAT_TEST_TEMPLATE_STEP: WorkflowTemplateItem = {
  name: PAT_TEST_STEP_NAME,
  stage: 'Set Up',
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

const PRE_SYSTEM_TEST_TEMPLATE_STEP: WorkflowTemplateItem = {
  name: PRE_SYSTEM_TEST_STEP_NAME,
  stage: 'Set Up',
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

const SYSTEM_UNBOXING_TEMPLATE_STEP: WorkflowTemplateItem = {
  name: SYSTEM_UNBOXING_STEP_NAME,
  stage: 'Set Up',
  instructions: [...SYSTEM_UNBOXING_STEP_INSTRUCTIONS]
};

const RECORD_SYSTEM_DETAILS_TEMPLATE_STEP: WorkflowTemplateItem = {
  name: RECORD_SYSTEM_DETAILS_STEP_NAME,
  stage: 'Set Up',
  instructions: [...RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS]
};

const SYSTEM_FOLDERS_TEMPLATE_STEP: WorkflowTemplateItem = {
  name: SYSTEM_FOLDERS_STEP_NAME,
  stage: 'Set Up',
  instructions: [...SYSTEM_FOLDERS_STEP_INSTRUCTIONS]
};

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
          // Normalize stage names: change 'Setup' to 'Set Up'
          const stages = Array.from(new Set(parsed.stages.map((st) => (st === 'Setup' ? 'Set Up' : st))));
          if (!stages.includes('Set Up')) stages.unshift('Set Up');
          if (!stages.includes('Calibration')) stages.push('Calibration');
          if (!stages.includes('Final Test & Release')) stages.push('Final Test & Release');

          let steps = parsed.steps.map((s) => ({
            ...s,
            stage: s.stage === 'Setup' ? 'Set Up' : s.stage,
            name: s.name === LEGACY_SYSTEM_UNBOXING_STEP_NAME ? SYSTEM_UNBOXING_STEP_NAME : s.name
          }));

          const isinVia = normalizedSystem === 'inVia';
          if (isinVia) {
            const hasPat = steps.some((s) => s.name === PAT_TEST_STEP_NAME);
            const hasPre = steps.some((s) => s.name === PRE_SYSTEM_TEST_STEP_NAME);
            const hasCorrectOrder =
              steps[0]?.name === PAT_TEST_STEP_NAME &&
              steps[1]?.name === PRE_SYSTEM_TEST_STEP_NAME &&
              steps[2]?.name === SYSTEM_UNBOXING_STEP_NAME &&
              steps[3]?.name === RECORD_SYSTEM_DETAILS_STEP_NAME &&
              steps[4]?.name === SYSTEM_FOLDERS_STEP_NAME;

            const needsMigration = !hasPat || !hasPre || !hasCorrectOrder || parsed.version !== '2.1.0';
            if (needsMigration) {
              const patStep = steps.find((s) => s.name === PAT_TEST_STEP_NAME) || PAT_TEST_TEMPLATE_STEP;
              const preSysStep = steps.find((s) => s.name === PRE_SYSTEM_TEST_STEP_NAME) || PRE_SYSTEM_TEST_TEMPLATE_STEP;
              const setupStep = steps.find((s) => s.name === SYSTEM_UNBOXING_STEP_NAME || s.name === LEGACY_SYSTEM_UNBOXING_STEP_NAME) || SYSTEM_UNBOXING_TEMPLATE_STEP;
              const recordDetailsStep = steps.find((s) => s.name === RECORD_SYSTEM_DETAILS_STEP_NAME) || RECORD_SYSTEM_DETAILS_TEMPLATE_STEP;
              const folderStep = steps.find((s) => s.name === SYSTEM_FOLDERS_STEP_NAME) || SYSTEM_FOLDERS_TEMPLATE_STEP;

              const otherSteps = steps.filter((s) =>
                s.name !== PAT_TEST_STEP_NAME &&
                s.name !== PRE_SYSTEM_TEST_STEP_NAME &&
                s.name !== SYSTEM_UNBOXING_STEP_NAME &&
                s.name !== LEGACY_SYSTEM_UNBOXING_STEP_NAME &&
                s.name !== RECORD_SYSTEM_DETAILS_STEP_NAME &&
                s.name !== SYSTEM_FOLDERS_STEP_NAME
              ).map((s) => {
                // Move laser beam and grating turret to Calibration tab
                if (s.name === 'Laser Beam Alignment & Safety Interlocks' || s.name === 'Grating Turret & Slit Alignment') {
                  return { ...s, stage: 'Calibration' as const };
                }
                // Move Rayleigh Cut-off and CCD Detector Cooling to Set Up tab
                if (s.name === 'Rayleigh Cut-off Filter Calibration' || s.name === 'CCD Detector Cooling & Dark Count Test') {
                  return { ...s, stage: 'Set Up' as const };
                }
                return s;
              });

              // Also ensure required calibration steps exist
              const requiredSteps = (SYSTEM_PROFILES.inVia?.defaultSteps || []).filter(
                (step) => step.name === LASER_GRATING_SELECTION_STEP_NAME ||
                  step.name === LASER_GRATING_FILES_STEP_NAME ||
                  step.name === 'Silicon Internal Reference Standard 520.7 cm⁻¹' ||
                  step.name === 'Laser Beam Alignment & Safety Interlocks' ||
                  step.name === 'Grating Turret & Slit Alignment' ||
                  step.name === 'Rayleigh Cut-off Filter Calibration' ||
                  step.name === 'CCD Detector Cooling & Dark Count Test'
              );
              for (const req of requiredSteps) {
                if (!otherSteps.some((s) => s.name === req.name)) {
                  otherSteps.push({
                    name: req.name,
                    stage: req.stage,
                    instructions: [...req.instructions],
                    checklist: req.checklist?.map((c) => ({ ...c })),
                    measuredData: req.measuredData?.map((m) => ({ ...m }))
                  });
                }
              }

              const setUpOthers = otherSteps.filter((s) => s.stage === 'Set Up');
              const calibOthers = otherSteps.filter((s) => s.stage === 'Calibration');
              const restOthers = otherSteps.filter((s) => s.stage !== 'Set Up' && s.stage !== 'Calibration');

              const updatedTemplate: WorkflowTemplate = {
                system: 'inVia',
                stages,
                steps: [
                  { ...patStep, stage: 'Set Up' },
                  { ...preSysStep, stage: 'Set Up' },
                  { ...setupStep, stage: 'Set Up', name: SYSTEM_UNBOXING_STEP_NAME },
                  { ...recordDetailsStep, stage: 'Set Up' },
                  { ...folderStep, stage: 'Set Up' },
                  ...setUpOthers,
                  ...calibOthers,
                  ...restOthers
                ],
                version: '2.1.0',
                lastUpdated: new Date().toISOString()
              };
              this.saveTemplate(updatedTemplate);
              return updatedTemplate;
            }
          }

          return {
            ...parsed,
            stages,
            steps
          };
        }
      }
    } catch (e) {
      console.warn(`Failed to read workflow template for ${normalizedSystem}`, e);
    }

    // Default template extraction from system profile or generic template for new systems
    const profile = SYSTEM_PROFILES[normalizedSystem];
    const defaultStages = profile?.defaultSteps
      ? Array.from(new Set(profile.defaultSteps.map((s) => s.stage)))
      : ['Set Up', 'Calibration', 'Final Test & Release'];

    let defaultSteps: WorkflowTemplateItem[] = [];
    if (profile && profile.defaultSteps) {
      const isinVia = normalizedSystem === 'inVia';
      if (isinVia) {
        // Build inVia steps exactly as required
        const baseSteps = profile.defaultSteps.map((s) => ({
          name: s.name,
          stage: s.stage,
          instructions: [...s.instructions],
          checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
          measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
        }));

        const patStep = baseSteps.find((s) => s.name === PAT_TEST_STEP_NAME) || PAT_TEST_TEMPLATE_STEP;
        const preSysStep = baseSteps.find((s) => s.name === PRE_SYSTEM_TEST_STEP_NAME) || PRE_SYSTEM_TEST_TEMPLATE_STEP;
        const setupStep = baseSteps.find((s) => s.name === SYSTEM_UNBOXING_STEP_NAME) || SYSTEM_UNBOXING_TEMPLATE_STEP;

        const otherSteps = baseSteps.filter((s) =>
          s.name !== PAT_TEST_STEP_NAME &&
          s.name !== PRE_SYSTEM_TEST_STEP_NAME &&
          s.name !== SYSTEM_UNBOXING_STEP_NAME
        );

        const setUpOthers = otherSteps.filter((s) => s.stage === 'Set Up');
        const calibOthers = otherSteps.filter((s) => s.stage === 'Calibration');
        const restOthers = otherSteps.filter((s) => s.stage !== 'Set Up' && s.stage !== 'Calibration');

        defaultSteps = [
          patStep,
          preSysStep,
          setupStep,
          RECORD_SYSTEM_DETAILS_TEMPLATE_STEP,
          SYSTEM_FOLDERS_TEMPLATE_STEP,
          ...setUpOthers,
          ...calibOthers,
          ...restOthers
        ];
      } else {
        defaultSteps = profile.defaultSteps.map((s) => ({
          name: s.name,
          stage: s.stage,
          instructions: [...s.instructions],
          checklist: s.checklist ? s.checklist.map((c) => ({ ...c, done: false })) : [],
          measuredData: s.measuredData ? s.measuredData.map((m) => ({ ...m, value: '' })) : []
        }));
        const firstSetupIndex = defaultSteps.findIndex((step) => step.stage === 'Set Up' || step.stage === 'Setup');
        const initialSetupStep = firstSetupIndex >= 0
          ? defaultSteps.splice(firstSetupIndex, 1)[0]
          : SYSTEM_UNBOXING_TEMPLATE_STEP;
        defaultSteps.unshift(
          {
            ...initialSetupStep,
            name: SYSTEM_UNBOXING_STEP_NAME,
            stage: 'Set Up',
            instructions: [
              ...initialSetupStep.instructions,
              ...SYSTEM_UNBOXING_STEP_INSTRUCTIONS
            ]
          },
          RECORD_SYSTEM_DETAILS_TEMPLATE_STEP,
          SYSTEM_FOLDERS_TEMPLATE_STEP
        );
      }
    } else {
      // Default placeholder workflows for newly created custom systems
      defaultSteps = [
        {
          ...SYSTEM_UNBOXING_TEMPLATE_STEP,
          name: SYSTEM_UNBOXING_STEP_NAME,
          stage: 'Set Up',
          instructions: [
            `Verify ${normalizedSystem} baseplate and chassis integrity.`,
            'Confirm electrical grounding and safety interlock loop continuity.',
            'Record environment temperature (20°C ± 1°C) and cleanroom status.',
            ...SYSTEM_UNBOXING_STEP_INSTRUCTIONS
          ],
          checklist: [
            { id: 'c1', label: 'Chassis unboxing inspection complete', done: false },
            { id: 'c2', label: 'Earth ground resistance < 0.1 Ohm verified', done: false }
          ]
        },
        RECORD_SYSTEM_DETAILS_TEMPLATE_STEP,
        SYSTEM_FOLDERS_TEMPLATE_STEP,
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
      version: '2.1.0',
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
