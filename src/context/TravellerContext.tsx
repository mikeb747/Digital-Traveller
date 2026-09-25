import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DigitalTraveller,
  OperationStep,
  TechnicianProfile,
  CalibratedTool,
  NCRRecord,
  NCRDisposition,
  BOMItem
} from '../types';
import { INITIAL_TRAVELLERS, INITIAL_TECHNICIANS, INITIAL_TOOLS } from '../data/initialTravellers';

interface TravellerContextType {
  travellers: DigitalTraveller[];
  activeTravellerId: string;
  activeTraveller: DigitalTraveller | null;
  setActiveTravellerId: (id: string) => void;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  currentStep: OperationStep | null;
  technicians: TechnicianProfile[];
  activeTechnician: TechnicianProfile;
  setActiveTechnician: (tech: TechnicianProfile) => void;
  tools: CalibratedTool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  updateDataField: (stepId: string, fieldId: string, value: string | number | boolean) => void;
  signOffStep: (stepId: string, notes?: string) => { success: boolean; message?: string };
  raiseNCR: (ncrData: {
    stepId: string;
    stepOpCode: string;
    title: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }) => void;
  dispositionNCR: (ncrId: string, disposition: NCRDisposition, notes: string) => void;
  closeNCR: (ncrId: string) => void;
  verifyBOMItem: (bomId: string, verified: boolean, lotNumber?: string) => void;
  createTraveller: (data: {
    workOrderNumber: string;
    partNumber: string;
    partName: string;
    revision: string;
    serialNumber: string;
    lotNumber: string;
    program: string;
    customer: string;
    priority: 'routine' | 'urgent' | 'aog_critical';
    targetCompletionDate: string;
    notes?: string;
  }) => void;
  resetToFactoryDefaults: () => void;
}

const STORAGE_KEY = 'digital_traveller_data_v1';

const TravellerContext = createContext<TravellerContextType | undefined>(undefined);

export const TravellerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [travellers, setTravellers] = useState<DigitalTraveller[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load travellers from localStorage', e);
    }
    return INITIAL_TRAVELLERS;
  });

  const [activeTravellerId, setActiveTravellerId] = useState<string>(() => {
    return INITIAL_TRAVELLERS[0]?.id || '';
  });

  const [technicians] = useState<TechnicianProfile[]>(INITIAL_TECHNICIANS);
  const [activeTechnician, setActiveTechnician] = useState<TechnicianProfile>(INITIAL_TECHNICIANS[0]);
  const [tools] = useState<CalibratedTool[]>(INITIAL_TOOLS);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Save to localStorage whenever travellers change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(travellers));
    } catch (e) {
      console.error('Failed to save travellers to localStorage', e);
    }
  }, [travellers]);

  const activeTraveller = travellers.find((t) => t.id === activeTravellerId) || travellers[0] || null;
  const currentStepIndex = activeTraveller ? activeTraveller.currentStepIndex : 0;
  const currentStep = activeTraveller && activeTraveller.steps[currentStepIndex] ? activeTraveller.steps[currentStepIndex] : null;

  const setCurrentStepIndex = (index: number) => {
    if (!activeTraveller) return;
    if (index >= 0 && index < activeTraveller.steps.length) {
      setTravellers((prev) =>
        prev.map((trav) => (trav.id === activeTraveller.id ? { ...trav, currentStepIndex: index } : trav))
      );
    }
  };

  const updateDataField = (stepId: string, fieldId: string, value: string | number | boolean) => {
    if (!activeTraveller) return;

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const updatedSteps = trav.steps.map((step) => {
          if (step.id !== stepId) return step;

          const updatedFields = step.dataFields.map((field) => {
            if (field.id !== fieldId) return field;

            let isWithinSpec: boolean | undefined = undefined;
            if (field.type === 'numeric') {
              const numVal = typeof value === 'string' ? parseFloat(value) : (value as number);
              if (!isNaN(numVal)) {
                const minCheck = field.min !== undefined ? numVal >= field.min : true;
                const maxCheck = field.max !== undefined ? numVal <= field.max : true;
                isWithinSpec = minCheck && maxCheck;
              }
            } else if (field.type === 'boolean') {
              isWithinSpec = Boolean(value);
            } else if (field.type === 'select') {
              isWithinSpec = value !== 'Non-Conforming';
            }

            return {
              ...field,
              value,
              isWithinSpec,
              recordedBy: activeTechnician.name,
              recordedAt: new Date().toISOString(),
            };
          });

          return {
            ...step,
            status: step.status === 'pending' ? 'in_progress' : step.status,
            dataFields: updatedFields,
          };
        });

        return {
          ...trav,
          status: trav.status === 'ready' ? 'in_progress' : trav.status,
          steps: updatedSteps,
        };
      })
    );
  };

  const signOffStep = (stepId: string, notes?: string): { success: boolean; message?: string } => {
    if (!activeTraveller) return { success: false, message: 'No active traveler selected' };

    const stepIndex = activeTraveller.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return { success: false, message: 'Step not found' };

    const step = activeTraveller.steps[stepIndex];

    // Check if any critical/open NCR blocks this step
    const hasBlockingNCR = activeTraveller.ncrs.some(
      (ncr) => ncr.stepId === stepId && (ncr.status === 'open' || ncr.status === 'under_review')
    );
    if (hasBlockingNCR) {
      return {
        success: false,
        message: 'Cannot sign off: This step has an open Non-Conformance Report (NCR) requiring disposition.',
      };
    }

    // Check required fields
    const missingRequired = step.dataFields.filter((f) => f.required && (f.value === undefined || f.value === ''));
    if (missingRequired.length > 0) {
      return {
        success: false,
        message: `Missing required data collection: "${missingRequired[0].label}" must be recorded before sign-off.`,
      };
    }

    // Check out-of-spec values
    const outOfSpec = step.dataFields.filter((f) => f.isWithinSpec === false);
    if (outOfSpec.length > 0) {
      return {
        success: false,
        message: `Parametric out-of-spec detected on "${outOfSpec[0].label}". Please re-measure or raise an NCR before sign-off.`,
      };
    }

    const now = new Date().toISOString();
    const signature = {
      technicianName: activeTechnician.name,
      badgeId: activeTechnician.badgeId,
      role: activeTechnician.role,
      station: activeTechnician.station,
      timestamp: now,
      signatureDataUrl: `stamp:${activeTechnician.badgeId}:${now}`,
    };

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const updatedSteps = trav.steps.map((s, idx) => {
          if (idx === stepIndex) {
            return {
              ...s,
              status: 'passed' as const,
              signature,
              notes: notes || s.notes,
              completedAt: now,
            };
          }
          return s;
        });

        // Determine next step index
        const allCompleted = updatedSteps.every((s) => s.status === 'passed' || s.status === 'skipped');
        const nextIndex = stepIndex + 1 < updatedSteps.length ? stepIndex + 1 : stepIndex;

        return {
          ...trav,
          steps: updatedSteps,
          currentStepIndex: nextIndex,
          status: allCompleted ? ('completed' as const) : ('in_progress' as const),
        };
      })
    );

    return { success: true };
  };

  const raiseNCR = (ncrData: {
    stepId: string;
    stepOpCode: string;
    title: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }) => {
    if (!activeTraveller) return;

    const ncrId = `NCR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newRecord: NCRRecord = {
      id: ncrId,
      travellerId: activeTraveller.id,
      stepId: ncrData.stepId,
      stepOpCode: ncrData.stepOpCode,
      title: ncrData.title,
      description: ncrData.description,
      severity: ncrData.severity,
      status: 'open',
      openedBy: `${activeTechnician.name} (${activeTechnician.badgeId})`,
      openedAt: now,
    };

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const updatedSteps = trav.steps.map((step) => {
          if (step.id === ncrData.stepId) {
            return {
              ...step,
              status: 'ncr_blocked' as const,
              ncrIds: [...(step.ncrIds || []), ncrId],
            };
          }
          return step;
        });

        return {
          ...trav,
          status: 'quality_hold' as const,
          steps: updatedSteps,
          ncrs: [newRecord, ...trav.ncrs],
        };
      })
    );
  };

  const dispositionNCR = (ncrId: string, disposition: NCRDisposition, notes: string) => {
    if (!activeTraveller) return;
    const now = new Date().toISOString();

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const updatedNCRs = trav.ncrs.map((ncr) => {
          if (ncr.id !== ncrId) return ncr;
          return {
            ...ncr,
            status: 'dispositioned' as const,
            disposition,
            dispositionNotes: notes,
            dispositionedBy: `${activeTechnician.name} (${activeTechnician.badgeId})`,
            dispositionedAt: now,
          };
        });

        // If dispositioned to rework, set traveller status to rework
        const newStatus = disposition === 'rework' ? 'rework' : trav.status;

        return {
          ...trav,
          status: newStatus,
          ncrs: updatedNCRs,
        };
      })
    );
  };

  const closeNCR = (ncrId: string) => {
    if (!activeTraveller) return;

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const targetNCR = trav.ncrs.find((n) => n.id === ncrId);
        if (!targetNCR) return trav;

        const updatedNCRs = trav.ncrs.map((ncr) => {
          if (ncr.id !== ncrId) return ncr;
          return {
            ...ncr,
            status: 'closed' as const,
          };
        });

        // Unblock the step if no other open NCRs for it
        const remainingOpenForStep = updatedNCRs.some(
          (n) => n.stepId === targetNCR.stepId && (n.status === 'open' || n.status === 'under_review')
        );

        const updatedSteps = trav.steps.map((step) => {
          if (step.id === targetNCR.stepId && !remainingOpenForStep && step.status === 'ncr_blocked') {
            return {
              ...step,
              status: 'in_progress' as const,
            };
          }
          return step;
        });

        const hasAnyOpenNCR = updatedNCRs.some((n) => n.status === 'open' || n.status === 'under_review');
        const travellerStatus = !hasAnyOpenNCR && trav.status === 'quality_hold' ? 'in_progress' : trav.status;

        return {
          ...trav,
          status: travellerStatus,
          steps: updatedSteps,
          ncrs: updatedNCRs,
        };
      })
    );
  };

  const verifyBOMItem = (bomId: string, verified: boolean, lotNumber?: string) => {
    if (!activeTraveller) return;

    setTravellers((prev) =>
      prev.map((trav) => {
        if (trav.id !== activeTraveller.id) return trav;

        const updatedBOM = trav.bom.map((item) => {
          if (item.id !== bomId) return item;
          return {
            ...item,
            verified,
            lotNumber: lotNumber !== undefined ? lotNumber : item.lotNumber,
          };
        });

        return {
          ...trav,
          bom: updatedBOM,
        };
      })
    );
  };

  const createTraveller = (data: {
    workOrderNumber: string;
    partNumber: string;
    partName: string;
    revision: string;
    serialNumber: string;
    lotNumber: string;
    program: string;
    customer: string;
    priority: 'routine' | 'urgent' | 'aog_critical';
    targetCompletionDate: string;
    notes?: string;
  }) => {
    const newId = `trav-${Date.now()}`;
    const defaultSteps: OperationStep[] = [
      {
        id: `step-${newId}-010`,
        opCode: 'OP-010',
        title: 'Incoming Hardware Kitting & Serialization Check',
        workCenter: 'Kitting Bay',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 20,
        status: 'pending',
        instructions: [
          'Verify physical unit serial number matches routing label.',
          'Inspect raw chassis/enclosure for surface defects, burrs, or scratches.',
          'Verify ESD protective bagging and moisture indicator.'
        ],
        dataFields: [
          {
            id: `df-${newId}-101`,
            label: 'Physical Serial Number Verified',
            type: 'boolean',
            required: true
          },
          {
            id: `df-${newId}-102`,
            label: 'Initial Visual Inspection Status',
            type: 'select',
            options: ['Conforming', 'Minor Scratch (Acceptable)', 'Defective (Hold)'],
            required: true
          }
        ]
      },
      {
        id: `step-newId-020`,
        opCode: 'OP-020',
        title: 'Sub-assembly Mechanical Fastening & Torquing',
        workCenter: 'Mechanical Bench 01',
        requiredSkill: 'Torque & Fastener Cert',
        estimatedMinutes: 30,
        status: 'pending',
        instructions: [
          'Install sub-assembly bracket into housing.',
          'Apply calibrated torque wrench to all M3/M4 fasteners.',
          'Apply torque seal tamper lacquer.'
        ],
        dataFields: [
          {
            id: `df-${newId}-201`,
            label: 'Fastener Torque Setting (1.20 - 1.40 N·m)',
            type: 'numeric',
            unit: 'N·m',
            min: 1.20,
            max: 1.40,
            nominal: 1.30,
            required: true
          }
        ]
      },
      {
        id: `step-newId-030`,
        opCode: 'OP-030',
        title: 'Electrical Continuity & Functional Verification',
        workCenter: 'Electrical Lab',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 35,
        status: 'pending',
        instructions: [
          'Perform electrical resistance check between ground pin and chassis.',
          'Apply nominal power and verify internal reference clock and rails.'
        ],
        dataFields: [
          {
            id: `df-${newId}-301`,
            label: 'Ground Bond Resistance (< 0.100 Ω)',
            type: 'numeric',
            unit: 'Ω',
            min: 0.001,
            max: 0.100,
            nominal: 0.035,
            required: true
          }
        ]
      },
      {
        id: `step-newId-040`,
        opCode: 'OP-040',
        title: 'Final Quality Review & CoC Release',
        workCenter: 'Quality Assurance Lab',
        requiredSkill: 'AS9100 Lead Auditor',
        estimatedMinutes: 15,
        status: 'pending',
        instructions: [
          'Verify all preceding traveler operations OP-010 to OP-030 have electronic stamps.',
          'Package assembly in shielded anti-static container.'
        ],
        dataFields: [
          {
            id: `df-${newId}-401`,
            label: 'All Traveler Milestones Conforming',
            type: 'boolean',
            required: true
          }
        ]
      }
    ];

    const defaultBOM: BOMItem[] = [
      {
        id: `bom-${newId}-01`,
        partNumber: data.partNumber + '-SUB',
        description: 'Core Sub-Assembly Module',
        referenceDesignator: 'MOD-01',
        quantity: 1,
        lotNumber: data.lotNumber,
        manufacturer: 'Precision Systems Inc.',
        verified: false,
      }
    ];

    const newTraveller: DigitalTraveller = {
      id: newId,
      ...data,
      status: 'ready',
      currentStepIndex: 0,
      steps: defaultSteps,
      bom: defaultBOM,
      ncrs: [],
      createdAt: new Date().toISOString(),
      assignedTechnician: `${activeTechnician.name} (${activeTechnician.badgeId})`,
    };

    setTravellers((prev) => [newTraveller, ...prev]);
    setActiveTravellerId(newId);
  };

  const resetToFactoryDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTravellers(INITIAL_TRAVELLERS);
    setActiveTravellerId(INITIAL_TRAVELLERS[0].id);
  };

  return (
    <TravellerContext.Provider
      value={{
        travellers,
        activeTravellerId,
        activeTraveller,
        setActiveTravellerId,
        currentStepIndex,
        setCurrentStepIndex,
        currentStep,
        technicians,
        activeTechnician,
        setActiveTechnician,
        tools,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        updateDataField,
        signOffStep,
        raiseNCR,
        dispositionNCR,
        closeNCR,
        verifyBOMItem,
        createTraveller,
        resetToFactoryDefaults,
      }}
    >
      {children}
    </TravellerContext.Provider>
  );
};

export const useTraveller = () => {
  const context = useContext(TravellerContext);
  if (!context) {
    throw new Error('useTraveller must be used within a TravellerProvider');
  }
  return context;
};
