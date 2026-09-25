import { TravellerRecord, WorkflowStep, StepStatus, WorkflowStage } from '../types/traveller';

export class WorkflowService {
  /**
   * Update step status with proper timestamp and audit log
   */
  static updateStepStatus(
    record: TravellerRecord,
    stepId: string,
    newStatus: StepStatus,
    technicianName?: string,
    notes?: string
  ): TravellerRecord {
    const now = new Date().toISOString();
    const updatedSteps = record.steps.map(step => {
      if (step.id !== stepId) return step;

      const updatedStep: WorkflowStep = {
        ...step,
        status: newStatus,
        technician: technicianName || step.technician || record.operatorName,
        notes: notes !== undefined ? notes : step.notes,
      };

      if (newStatus === 'In Progress' && !step.startedAt) {
        updatedStep.startedAt = now;
      } else if (newStatus === 'Complete') {
        updatedStep.completedAt = now;
        if (!step.startedAt) updatedStep.startedAt = now;
      } else if (newStatus === 'Not Started') {
        updatedStep.startedAt = null;
        updatedStep.completedAt = null;
      }

      return updatedStep;
    });

    const targetStep = record.steps.find(s => s.id === stepId);
    const stepName = targetStep ? targetStep.name : stepId;

    const auditEntry = {
      timestamp: now,
      action: `Step "${stepName}" marked as ${newStatus}`,
      stepName,
      user: technicianName || record.operatorName
    };

    return {
      ...record,
      updatedAt: now,
      steps: updatedSteps,
      auditLog: [auditEntry, ...record.auditLog]
    };
  }

  /**
   * Update checklist item for a step
   */
  static toggleChecklistItem(record: TravellerRecord, stepId: string, checklistId: string): TravellerRecord {
    const updatedSteps = record.steps.map(step => {
      if (step.id !== stepId) return step;
      const updatedChecklist = (step.checklist || []).map(item =>
        item.id === checklistId ? { ...item, done: !item.done } : item
      );
      return {
        ...step,
        checklist: updatedChecklist
      };
    });

    return {
      ...record,
      updatedAt: new Date().toISOString(),
      steps: updatedSteps
    };
  }

  /**
   * Update measurement values for a step
   */
  static updateMeasurement(record: TravellerRecord, stepId: string, paramIndex: number, value: string): TravellerRecord {
    const updatedSteps = record.steps.map(step => {
      if (step.id !== stepId) return step;
      const measurements = [...(step.measuredData || [])];
      if (measurements[paramIndex]) {
        measurements[paramIndex] = {
          ...measurements[paramIndex],
          value
        };
      }
      return {
        ...step,
        measuredData: measurements
      };
    });

    return {
      ...record,
      updatedAt: new Date().toISOString(),
      steps: updatedSteps
    };
  }

  /**
   * Add a custom step to a stage (fulfilling future configurable workflows)
   */
  static addStep(record: TravellerRecord, stage: WorkflowStage, stepName: string, instructions: string): TravellerRecord {
    const newStep: WorkflowStep = {
      id: `custom-step-${Date.now().toString(36)}`,
      name: stepName.trim(),
      stage,
      status: 'Not Started',
      instructions: instructions.split('\n').filter(line => line.trim().length > 0),
      notes: '',
      checklist: [
        { id: `c-${Date.now()}-1`, label: 'Operator standard verification', done: false }
      ]
    };

    const now = new Date().toISOString();
    return {
      ...record,
      updatedAt: now,
      steps: [...record.steps, newStep],
      auditLog: [
        {
          timestamp: now,
          action: `Added custom step "${stepName}" to ${stage}`,
          user: record.operatorName
        },
        ...record.auditLog
      ]
    };
  }

  /**
   * Compute stage completion statistics
   */
  static getStageStats(record: TravellerRecord, stage: WorkflowStage) {
    const stageSteps = record.steps.filter(s => s.stage === stage);
    const total = stageSteps.length;
    const completed = stageSteps.filter(s => s.status === 'Complete').length;
    const inProgress = stageSteps.filter(s => s.status === 'In Progress').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, percent };
  }

  /**
   * Overall progress percentage
   */
  static getOverallStats(record: TravellerRecord) {
    const total = record.steps.length;
    const completed = record.steps.filter(s => s.status === 'Complete').length;
    const inProgress = record.steps.filter(s => s.status === 'In Progress').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, percent };
  }
}
