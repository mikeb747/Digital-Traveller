export type StepStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped' | 'ncr_blocked';

export type TravellerStatus = 'ready' | 'in_progress' | 'quality_hold' | 'rework' | 'completed';

export type NCRSeverity = 'minor' | 'major' | 'critical';

export type NCRStatus = 'open' | 'under_review' | 'dispositioned' | 'closed';

export type NCRDisposition = 'rework' | 'scrap' | 'use_as_is' | 'return_to_vendor' | 'mrb_pending';

export interface DataCollectionField {
  id: string;
  label: string;
  type: 'numeric' | 'boolean' | 'text' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  nominal?: number;
  options?: string[];
  required: boolean;
  value?: string | number | boolean;
  isWithinSpec?: boolean;
  recordedBy?: string;
  recordedAt?: string;
}

export interface StepSignature {
  technicianName: string;
  badgeId: string;
  role: string;
  timestamp: string;
  signatureDataUrl?: string;
  stationId?: string;
  station?: string;
}

export interface OperationStep {
  id: string;
  opCode: string; // e.g. "OP-010"
  title: string;
  workCenter: string; // e.g. "SMT Assembly", "High Voltage Test Bay", "Final QA"
  requiredSkill: string; // e.g. "IPC-A-610 Class 3", "Hi-Pot Certified"
  estimatedMinutes: number;
  instructions: string[];
  safetyCautions?: string[];
  toolIds?: string[]; // IDs of tools required
  status: StepStatus;
  dataFields: DataCollectionField[];
  signature?: StepSignature;
  notes?: string;
  ncrIds?: string[];
  completedAt?: string;
}

export interface BOMItem {
  id: string;
  partNumber: string;
  description: string;
  referenceDesignator: string; // e.g. "U1, U2", "R12-R18"
  quantity: number;
  lotNumber?: string;
  manufacturer: string;
  verified: boolean;
}

export interface NCRRecord {
  id: string; // e.g. "NCR-2026-081"
  travellerId: string;
  stepId: string;
  stepOpCode: string;
  title: string;
  description: string;
  severity: NCRSeverity;
  status: NCRStatus;
  disposition?: NCRDisposition;
  openedBy: string;
  openedAt: string;
  dispositionedBy?: string;
  dispositionNotes?: string;
  dispositionedAt?: string;
}

export interface CalibratedTool {
  id: string;
  toolNumber: string;
  name: string;
  type: string;
  calibrationDueDate: string;
  lastCalibrated: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  model: string;
  location: string;
}

export interface DigitalTraveller {
  id: string;
  workOrderNumber: string; // e.g. "WO-84920-A"
  partNumber: string; // e.g. "PN-AV-9002-01"
  partName: string;
  revision: string; // e.g. "Rev C"
  serialNumber: string; // e.g. "SN-AVC-990142"
  lotNumber: string;
  program: string; // e.g. "Aerospace & Defense"
  customer: string;
  priority: 'routine' | 'urgent' | 'aog_critical';
  status: TravellerStatus;
  currentStepIndex: number;
  steps: OperationStep[];
  bom: BOMItem[];
  ncrs: NCRRecord[];
  createdAt: string;
  targetCompletionDate: string;
  assignedTechnician?: string;
  notes?: string;
}

export interface TechnicianProfile {
  id: string;
  name: string;
  badgeId: string;
  role: string;
  station: string;
  certifications: string[];
}
