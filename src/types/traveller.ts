export type SystemType = 'InVia' | 'Virsa' | 'inLux';

export type WorkflowStage = 'Setup' | 'Calibration' | 'Final Test & Release';

export type StepStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface WorkflowStep {
  id: string;
  name: string;
  stage: WorkflowStage;
  status: StepStatus;
  completedAt?: string | null;
  startedAt?: string | null;
  technician?: string;
  instructions: string[];
  notes?: string;
  checklist?: { id: string; label: string; done: boolean }[];
  measuredData?: { parameter: string; value: string; unit: string; tolerance?: string }[];
}

export interface TravellerRecord {
  id: string;
  serialNumber: string;
  system: SystemType;
  workOrderNumber: string;
  operatorName: string;
  createdAt: string;
  updatedAt: string;
  activeStage: WorkflowStage;
  steps: WorkflowStep[];
  auditLog: {
    timestamp: string;
    action: string;
    stepName?: string;
    user: string;
  }[];
}

export interface SystemProfile {
  id: SystemType;
  displayName: string;
  tagline: string;
  description: string;
  laserOptions: string[];
  defaultSteps: Omit<WorkflowStep, 'id' | 'status' | 'completedAt' | 'startedAt'>[];
}
