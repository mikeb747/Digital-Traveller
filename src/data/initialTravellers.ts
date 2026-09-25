import { DigitalTraveller, CalibratedTool, TechnicianProfile } from '../types';

export const INITIAL_TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'tech-1',
    name: 'Mike Brown',
    badgeId: 'TECH-747',
    role: 'Lead Electronics Technician',
    station: 'Bench 04 (Avionics Integration)',
    certifications: ['IPC-A-610 Class 3', 'J-STD-001', 'High Voltage Safety Level 2', 'ESD Program Lead'],
  },
  {
    id: 'tech-2',
    name: 'Sarah Chen',
    badgeId: 'QA-209',
    role: 'Senior Quality Inspector',
    station: 'QA Lab 02',
    certifications: ['AS9100 Lead Auditor', 'IPC-A-610 Class 3', 'NDT Level II', 'MRB Authorized'],
  },
  {
    id: 'tech-3',
    name: 'Alex Rivera',
    badgeId: 'TECH-312',
    role: 'Precision Mechanical Assembler',
    station: 'Bench 01 (Cleanroom Alpha)',
    certifications: ['Torque & Fastener Cert', 'Cleanroom Class 10k', 'Optical Alignment Specialist'],
  },
];

export const INITIAL_TOOLS: CalibratedTool[] = [
  {
    id: 'tool-01',
    toolNumber: 'CAL-TQ-042',
    name: 'Digital Precision Torque Screwdriver (0.2 - 3.0 Nm)',
    type: 'Torque Tool',
    calibrationDueDate: '2026-11-20',
    lastCalibrated: '2026-05-20',
    status: 'valid',
    model: 'Sturtevant Richmont DTC-30',
    location: 'Tool Crib A - Bay 3',
  },
  {
    id: 'tool-02',
    toolNumber: 'CAL-DMM-108',
    name: '6.5 Digit Precision Multimeter',
    type: 'Electrical Meter',
    calibrationDueDate: '2026-12-05',
    lastCalibrated: '2025-12-05',
    status: 'valid',
    model: 'Keysight 34465A',
    location: 'Bench 04 Rack',
  },
  {
    id: 'tool-03',
    toolNumber: 'CAL-HIPOT-015',
    name: 'Dielectric / Hi-Pot Insulation Safety Tester (5kV)',
    type: 'High Voltage Safety',
    calibrationDueDate: '2026-10-15',
    lastCalibrated: '2025-10-15',
    status: 'expiring_soon',
    model: 'Chroma 19032',
    location: 'HV Safety Enclosure B',
  },
  {
    id: 'tool-04',
    toolNumber: 'CAL-CALIPER-009',
    name: 'Digital Micrometer / Vernier Caliper (0-150mm)',
    type: 'Dimensional',
    calibrationDueDate: '2026-09-01',
    lastCalibrated: '2025-09-01',
    status: 'expired',
    model: 'Mitutoyo 500-196-30',
    location: 'Mechanical Sub-assembly',
  },
  {
    id: 'tool-05',
    toolNumber: 'CAL-OSC-022',
    name: '4-Channel 1GHz Mixed Signal Oscilloscope',
    type: 'RF & Signal',
    calibrationDueDate: '2027-02-14',
    lastCalibrated: '2026-02-14',
    status: 'valid',
    model: 'Tektronix MSO44',
    location: 'Bench 04 Rack',
  }
];

export const INITIAL_TRAVELLERS: DigitalTraveller[] = [
  {
    id: 'trav-001',
    workOrderNumber: 'WO-84920-A',
    partNumber: 'PN-AV-9002-01',
    partName: 'Avionics Isolated Power Converter Unit (28V to 5V/12V)',
    revision: 'Rev C',
    serialNumber: 'SN-AVC-990142',
    lotNumber: 'LOT-2026-W38',
    program: 'Orbital Cargo Transport (OCT-V)',
    customer: 'AeroDynamics Global LLC',
    priority: 'urgent',
    status: 'in_progress',
    currentStepIndex: 2,
    createdAt: '2026-09-22T08:30:00Z',
    targetCompletionDate: '2026-09-28T17:00:00Z',
    assignedTechnician: 'Mike Brown (TECH-747)',
    notes: 'Unit subjected to vibration screening after OP-040. Ensure thermal paste conformal thickness adheres strictly to SOP-ENG-441.',
    steps: [
      {
        id: 'step-010',
        opCode: 'OP-010',
        title: 'Incoming Substrate & SMT Mechanical Pre-Inspection',
        workCenter: 'SMT Inspection Bay',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 25,
        status: 'passed',
        instructions: [
          'Verify bare PCB substrate serial number matches Work Order traveler SN-AVC-990142.',
          'Examine solder joints under 10x binocular microscope for bridging, insufficient wetting, or voiding exceeding 15%.',
          'Verify tantalum capacitor polarities (C12, C14, C18) against layout revision C.',
          'Confirm no foreign object debris (FOD) or particulate contamination on gold plated landing pads.'
        ],
        safetyCautions: [
          'ESD wrist strap and grounded dissipative mat mandatory (max 10^7 ohms).',
          'Avoid touching optical sensors or gold finger contacts directly.'
        ],
        toolIds: ['tool-02'],
        dataFields: [
          {
            id: 'df-101',
            label: 'ESD Grounding Verification (< 1.0 MΩ)',
            type: 'numeric',
            unit: 'MΩ',
            min: 0.1,
            max: 1.0,
            nominal: 0.8,
            required: true,
            value: 0.74,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T09:15:00Z'
          },
          {
            id: 'df-102',
            label: 'PCB Serialization Barcode Verified',
            type: 'boolean',
            required: true,
            value: true,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T09:18:00Z'
          },
          {
            id: 'df-103',
            label: 'SMT Joint Quality Rating (IPC-610 Class 3)',
            type: 'select',
            options: ['Conforming - Class 3', 'Conforming - Class 2', 'Non-Conforming'],
            required: true,
            value: 'Conforming - Class 3',
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T09:22:00Z'
          }
        ],
        signature: {
          technicianName: 'Mike Brown',
          badgeId: 'TECH-747',
          role: 'Lead Electronics Technician',
          station: 'Bench 04',
          timestamp: '2026-09-22T09:25:00Z',
          signatureDataUrl: 'e-sign:MikeBrown:TECH-747:OK'
        },
        completedAt: '2026-09-22T09:25:00Z'
      },
      {
        id: 'step-020',
        opCode: 'OP-020',
        title: 'Thermal Core Mounting & Choke Torquing',
        workCenter: 'Mechanical Integration Bay',
        requiredSkill: 'Torque & Fastener Cert',
        estimatedMinutes: 35,
        status: 'passed',
        instructions: [
          'Apply Henkel Bergquist Gap Pad 1500 to underside of MOSFET heat spreader plate (thickness 0.50mm +/- 0.05mm).',
          'Position PCB into anodized aluminum chassis enclosure P/N ENC-AV-880.',
          'Using calibrated torque screwdriver CAL-TQ-042, tighten four M3 stainless Torx screws in crisscross star sequence.',
          'Apply blue Vibra-Tite tamper indicator lacquer to screw heads.'
        ],
        safetyCautions: [
          'Do NOT exceed 1.25 N·m torque on M3 mounting bosses to prevent micro-fracturing chassis threads.',
          'Ensure torque tool calibration label is unexpired before starting.'
        ],
        toolIds: ['tool-01'],
        dataFields: [
          {
            id: 'df-201',
            label: 'Torque Screwdriver Tool Serial ID',
            type: 'text',
            required: true,
            value: 'CAL-TQ-042',
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T11:05:00Z'
          },
          {
            id: 'df-202',
            label: 'M3 Fastener Final Torque (1.10 - 1.25 N·m)',
            type: 'numeric',
            unit: 'N·m',
            min: 1.10,
            max: 1.25,
            nominal: 1.18,
            required: true,
            value: 1.19,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T11:12:00Z'
          },
          {
            id: 'df-203',
            label: 'Thermal Interface Material (TIM) Lot Code',
            type: 'text',
            required: true,
            value: 'LOT-BG1500-8842',
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T11:15:00Z'
          },
          {
            id: 'df-204',
            label: 'Tamper Seal Lacquer Applied to 4x Bosses',
            type: 'boolean',
            required: true,
            value: true,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-22T11:18:00Z'
          }
        ],
        signature: {
          technicianName: 'Mike Brown',
          badgeId: 'TECH-747',
          role: 'Lead Electronics Technician',
          station: 'Bench 04',
          timestamp: '2026-09-22T11:20:00Z',
          signatureDataUrl: 'e-sign:MikeBrown:TECH-747:OK'
        },
        completedAt: '2026-09-22T11:20:00Z'
      },
      {
        id: 'step-030',
        opCode: 'OP-030',
        title: 'Dielectric Insulation Resistance & Hi-Pot Safety Test',
        workCenter: 'High Voltage Test Bay',
        requiredSkill: 'High Voltage Safety Level 2',
        estimatedMinutes: 30,
        status: 'in_progress',
        instructions: [
          'Connect Hi-Pot safety earth harness to chassis enclosure grounding lug.',
          'Tie all DC input pins (VIN+, VIN-) together to High Voltage probe.',
          'Apply 1500V DC dielectric proof stress for 60 seconds dwell time.',
          'Measure leakage current (must NOT exceed 2.00 mA).',
          'Discharge high voltage circuit completely, then measure DC insulation resistance at 500V (must be > 100 MΩ).'
        ],
        safetyCautions: [
          'DANGER: High Voltage 1500V Test Enclosure must have interlock cage fully latched.',
          'Ensure grounding clip is bonded before powering on Chroma tester.'
        ],
        toolIds: ['tool-03', 'tool-02'],
        dataFields: [
          {
            id: 'df-301',
            label: 'Test Interlock Enclosure Safety Checked',
            type: 'boolean',
            required: true,
            value: true,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-23T08:45:00Z'
          },
          {
            id: 'df-302',
            label: 'Hi-Pot Applied Voltage (1480 - 1520 V DC)',
            type: 'numeric',
            unit: 'V DC',
            min: 1480,
            max: 1520,
            nominal: 1500,
            required: true,
            value: 1502,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-23T08:52:00Z'
          },
          {
            id: 'df-303',
            label: 'Leakage Current @ 1500V (< 2.00 mA)',
            type: 'numeric',
            unit: 'mA',
            min: 0.01,
            max: 2.00,
            nominal: 0.45,
            required: true,
            value: 0.38,
            isWithinSpec: true,
            recordedBy: 'Mike Brown',
            recordedAt: '2026-09-23T08:54:00Z'
          },
          {
            id: 'df-304',
            label: 'Insulation Resistance @ 500V (> 100 MΩ)',
            type: 'numeric',
            unit: 'MΩ',
            min: 100,
            max: 9999,
            nominal: 750,
            required: true,
            value: undefined,
            isWithinSpec: undefined
          }
        ],
        notes: 'Ready for final 500V DC resistance reading.'
      },
      {
        id: 'step-040',
        opCode: 'OP-040',
        title: 'Powered Functional Calibration & Rail Voltage Verification',
        workCenter: 'Electrical Functional Test Lab',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 40,
        status: 'pending',
        instructions: [
          'Energize unit with 28.00V DC lab power supply via current-limited channel (3.0A trip).',
          'Measure primary regulated 5.0V output rail under 10% minimal load and 100% full load (5.0A).',
          'Measure secondary auxiliary 12.0V rail.',
          'Verify ripple and noise on oscilloscope CAL-OSC-022 does not exceed 35 mV peak-to-peak.',
          'Program onboard EEPROM unit calibration table via SPI debug header.'
        ],
        safetyCautions: [
          'Check polarity before switching on 28V DC bench bus.',
          'Observe thermal camera for hot spots (>85°C).'
        ],
        toolIds: ['tool-02', 'tool-05'],
        dataFields: [
          {
            id: 'df-401',
            label: '5V Regulated Rail @ 5A Load (4.95 - 5.05 V)',
            type: 'numeric',
            unit: 'V DC',
            min: 4.95,
            max: 5.05,
            nominal: 5.00,
            required: true
          },
          {
            id: 'df-402',
            label: '12V Auxiliary Rail @ 2A Load (11.85 - 12.15 V)',
            type: 'numeric',
            unit: 'V DC',
            min: 11.85,
            max: 12.15,
            nominal: 12.00,
            required: true
          },
          {
            id: 'df-403',
            label: 'Peak-to-Peak Switching Ripple (< 35.0 mV)',
            type: 'numeric',
            unit: 'mV pk-pk',
            min: 0.1,
            max: 35.0,
            nominal: 18.0,
            required: true
          },
          {
            id: 'df-404',
            label: 'EEPROM Calibration Checksum Verified',
            type: 'boolean',
            required: true
          }
        ]
      },
      {
        id: 'step-050',
        opCode: 'OP-050',
        title: 'Final Quality Conformance & Packaging Seal',
        workCenter: 'Quality Assurance Lab',
        requiredSkill: 'AS9100 Lead Auditor',
        estimatedMinutes: 20,
        status: 'pending',
        instructions: [
          'Perform 100% visual inspection of exterior markings, Mil-Spec label, and tamper paint.',
          'Verify all preceding traveler operations OP-010 through OP-040 have valid electronic stamps.',
          'Place assembly into Mil-B-81705 ESD barrier shielding bag with fresh humidity indicator card and desiccant.',
          'Affix serialized QA acceptance green holographic tag.'
        ],
        safetyCautions: [
          'Ensure humidity indicator card is blue (<10% RH) prior to heat sealing.'
        ],
        toolIds: ['tool-02'],
        dataFields: [
          {
            id: 'df-501',
            label: 'Physical Label & Revision Matches Traveler',
            type: 'boolean',
            required: true
          },
          {
            id: 'df-502',
            label: 'All Traveler Steps Signed Without Open NCRs',
            type: 'boolean',
            required: true
          },
          {
            id: 'df-503',
            label: 'Humidity Indicator Card Color Status',
            type: 'select',
            options: ['Active Blue (< 10% RH)', 'Pink Warning (> 20% RH)'],
            required: true
          }
        ]
      }
    ],
    bom: [
      {
        id: 'bom-01',
        partNumber: 'TI-LM5176-Q1',
        description: 'Automotive 55V Synchronous 4-Switch Buck-Boost Controller',
        referenceDesignator: 'U1',
        quantity: 1,
        lotNumber: 'LOT-26A-4921',
        manufacturer: 'Texas Instruments',
        verified: true
      },
      {
        id: 'bom-02',
        partNumber: 'VISHAY-WSLP2512',
        description: 'Current Sense Resistor 0.005 Ohm 1% 3W Metal Plate',
        referenceDesignator: 'R1, R2',
        quantity: 2,
        lotNumber: 'LOT-25H-1102',
        manufacturer: 'Vishay Dale',
        verified: true
      },
      {
        id: 'bom-03',
        partNumber: 'KEMET-T543D157M016ATE025',
        description: 'Polymer Tantalum Capacitor 150uF 16V 10% ESR 25mOhm',
        referenceDesignator: 'C12, C14, C18',
        quantity: 3,
        lotNumber: 'LOT-26C-9901',
        manufacturer: 'KEMET',
        verified: true
      },
      {
        id: 'bom-04',
        partNumber: 'ENC-AV-880',
        description: '6061-T6 Aluminum CNC Milled EMI Enclosure Anodized Black',
        referenceDesignator: 'MECH-01',
        quantity: 1,
        lotNumber: 'LOT-CNC-2026-04',
        manufacturer: 'AeroMachining Tech',
        verified: true
      },
      {
        id: 'bom-05',
        partNumber: 'BERGQUIST-GAP-1500',
        description: 'Thermally Conductive Silicone Gap Filler Pad 0.50mm',
        referenceDesignator: 'TIM-01',
        quantity: 1,
        lotNumber: 'LOT-BG1500-8842',
        manufacturer: 'Henkel Loctite',
        verified: true
      }
    ],
    ncrs: []
  },
  {
    id: 'trav-002',
    workOrderNumber: 'WO-84921-B',
    partNumber: 'PN-LID-4020-03',
    partName: 'Autonomous Lidar Dual-Axis Optical Sensor Gimbal',
    revision: 'Rev E',
    serialNumber: 'SN-LID-004812',
    lotNumber: 'LOT-2026-LIDAR-09',
    program: 'Autonomous Defense Mobility (ADM)',
    customer: 'Hexagon Robotics Corp',
    priority: 'urgent',
    status: 'quality_hold',
    currentStepIndex: 1,
    createdAt: '2026-09-20T14:00:00Z',
    targetCompletionDate: '2026-09-27T12:00:00Z',
    assignedTechnician: 'Alex Rivera (TECH-312)',
    notes: 'TRAVELER ON QUALITY HOLD: NCR-2026-044 opened during collimator laser beam centering. Waiting for MRB Engineering disposition.',
    steps: [
      {
        id: 'step-lid-010',
        opCode: 'OP-010',
        title: 'Precision Bearing & Direct-Drive Motor Seating',
        workCenter: 'Cleanroom Alpha',
        requiredSkill: 'Cleanroom Class 10k',
        estimatedMinutes: 45,
        status: 'passed',
        instructions: [
          'De-bag gimbal housing under laminar flow clean hood.',
          'Install matched angular contact ceramic hybrid bearings P/N BRG-CER-7002.',
          'Measure motor stator runout with Mitutoyo dial gauge (< 0.008 mm allowable).'
        ],
        dataFields: [
          {
            id: 'df-lid-101',
            label: 'Radial Runout Tolerancing (< 0.008 mm)',
            type: 'numeric',
            unit: 'mm',
            min: 0.001,
            max: 0.008,
            nominal: 0.004,
            required: true,
            value: 0.005,
            isWithinSpec: true,
            recordedBy: 'Alex Rivera',
            recordedAt: '2026-09-21T10:30:00Z'
          }
        ],
        signature: {
          technicianName: 'Alex Rivera',
          badgeId: 'TECH-312',
          role: 'Precision Mechanical Assembler',
          station: 'Cleanroom Alpha',
          timestamp: '2026-09-21T11:00:00Z'
        },
        completedAt: '2026-09-21T11:00:00Z'
      },
      {
        id: 'step-lid-020',
        opCode: 'OP-020',
        title: 'Laser Diode Array Alignment & Optical Collimation',
        workCenter: 'Optical Alignment Bay',
        requiredSkill: 'Optical Alignment Specialist',
        estimatedMinutes: 60,
        status: 'ncr_blocked',
        instructions: [
          'Mount 905nm pulsed laser diode module into gimbal aperture.',
          'Align beam axis using Thorlabs CMOS beam profiler at 5m calibration wall.',
          'Check beam divergence angle (< 0.12 mrad required).',
          'Tighten piezo micrometer lock screws.'
        ],
        safetyCautions: [
          'WARNING: Class 3B Laser. Wear optical density OD 6+ certified safety goggles at 905nm.'
        ],
        dataFields: [
          {
            id: 'df-lid-201',
            label: 'Beam Divergence Half-Angle (< 0.120 mrad)',
            type: 'numeric',
            unit: 'mrad',
            min: 0.040,
            max: 0.120,
            nominal: 0.085,
            required: true,
            value: 0.148,
            isWithinSpec: false,
            recordedBy: 'Alex Rivera',
            recordedAt: '2026-09-21T15:20:00Z'
          },
          {
            id: 'df-lid-202',
            label: 'Centration Offset (< 15.0 µm)',
            type: 'numeric',
            unit: 'µm',
            min: 0.0,
            max: 15.0,
            nominal: 6.0,
            required: true,
            value: 22.4,
            isWithinSpec: false,
            recordedBy: 'Alex Rivera',
            recordedAt: '2026-09-21T15:22:00Z'
          }
        ],
        notes: 'Values exceed maximum optical divergence limits. Raised NCR-2026-044.',
        ncrIds: ['NCR-2026-044']
      },
      {
        id: 'step-lid-030',
        opCode: 'OP-030',
        title: 'Environmental Chamber Thermal Cycling (-40°C to +85°C)',
        workCenter: 'Environmental Test Lab',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 120,
        status: 'pending',
        instructions: [
          'Place unit in Tenney Environmental chamber.',
          'Execute 4-cycle rapid thermal ramp profiles.',
          'Continuous telemetry monitoring for packet dropout.'
        ],
        dataFields: []
      }
    ],
    bom: [
      {
        id: 'bom-lid-01',
        partNumber: 'OSRAM-SPL-S4L90A',
        description: '905nm Multi-Junction Pulsed Laser Diode 125W',
        referenceDesignator: 'LD1',
        quantity: 1,
        lotNumber: 'LOT-OSR-905-22',
        manufacturer: 'ams OSRAM',
        verified: true
      },
      {
        id: 'bom-lid-02',
        partNumber: 'EDMUND-OPT-TECHSPEC-68',
        description: 'Precision Aspheric Collimating Doublet Lens 12.5mm Dia',
        referenceDesignator: 'OPT-LENS-01',
        quantity: 1,
        lotNumber: 'LOT-EDM-4412',
        manufacturer: 'Edmund Optics',
        verified: true
      }
    ],
    ncrs: [
      {
        id: 'NCR-2026-044',
        travellerId: 'trav-002',
        stepId: 'step-lid-020',
        stepOpCode: 'OP-020',
        title: 'Laser Divergence & Centration Exceeds AS9100 Tolerance',
        description: 'Measured beam divergence at 0.148 mrad (limit 0.120 mrad) and optical centration offset at 22.4 µm (limit 15.0 µm). Suspected slight mechanical tilt in lens retaining collar threads.',
        severity: 'critical',
        status: 'under_review',
        disposition: 'mrb_pending',
        openedBy: 'Alex Rivera (TECH-312)',
        openedAt: '2026-09-21T15:25:00Z',
        dispositionedBy: 'Sarah Chen (QA-209)',
        dispositionNotes: 'MRB review meeting scheduled with Chief Optical Engineer. Recommending replacement of lens sleeve retainer P/N SLV-402.',
        dispositionedAt: '2026-09-22T08:00:00Z'
      }
    ]
  },
  {
    id: 'trav-003',
    workOrderNumber: 'WO-84922-C',
    partNumber: 'PN-MED-3001-02',
    partName: 'Smart Infusion Pump Micro-Stepping Controller Board',
    revision: 'Rev B',
    serialNumber: 'SN-MED-771203',
    lotNumber: 'LOT-2026-MED-14',
    program: 'Critical Care Infusion Devices (ISO 13485)',
    customer: 'BioVanguard Medical Systems',
    priority: 'routine',
    status: 'ready',
    currentStepIndex: 0,
    createdAt: '2026-09-24T16:00:00Z',
    targetCompletionDate: '2026-10-02T17:00:00Z',
    assignedTechnician: 'Mike Brown (TECH-747)',
    notes: 'Standard medical routing. Full lot traceability required on all safety-critical flow sensing components.',
    steps: [
      {
        id: 'step-med-010',
        opCode: 'OP-010',
        title: 'Component Kit Kitting & Lot Traceability Sign-in',
        workCenter: 'Kitting & Stockroom',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 20,
        status: 'pending',
        instructions: [
          'Verify all bagged components against Bill of Materials BOM-MED-3001.',
          'Scan manufacturer reel 2D barcodes into shop traveler database.',
          'Confirm shelf-life expiration on solder flux and conformal coat bottles.'
        ],
        dataFields: [
          {
            id: 'df-med-101',
            label: 'All BOM Item Lots Scanned and Recorded',
            type: 'boolean',
            required: true
          },
          {
            id: 'df-med-102',
            label: 'Solder Paste Lot Number',
            type: 'text',
            required: true
          }
        ]
      },
      {
        id: 'step-med-020',
        opCode: 'OP-020',
        title: 'Micro-stepping Driver Hall Sensor Calibration',
        workCenter: 'SMT Assembly',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 30,
        status: 'pending',
        instructions: [
          'Power stepper motor controller with 12V DC.',
          'Verify quadrature encoder 256 micro-step index pulses.'
        ],
        dataFields: [
          {
            id: 'df-med-201',
            label: 'Pulse Accuracy Error (< 0.20%)',
            type: 'numeric',
            unit: '%',
            min: 0.0,
            max: 0.20,
            nominal: 0.05,
            required: true
          }
        ]
      }
    ],
    bom: [
      {
        id: 'bom-med-01',
        partNumber: 'TMC2209-LA',
        description: 'Ultra-silent Motor Driver IC with StealthChop2',
        referenceDesignator: 'U4',
        quantity: 1,
        lotNumber: 'LOT-TRIN-2026-01',
        manufacturer: 'Trinamic / ADI',
        verified: true
      }
    ],
    ncrs: []
  },
  {
    id: 'trav-004',
    workOrderNumber: 'WO-84923-D',
    partNumber: 'PN-BMS-8050-04',
    partName: 'Electric Drivetrain Battery Management Master Module',
    revision: 'Rev D',
    serialNumber: 'SN-BMS-551980',
    lotNumber: 'LOT-2026-BMS-33',
    program: 'Heavy Commercial EV Platform',
    customer: 'Voltaic Powertrain Dynamics',
    priority: 'routine',
    status: 'completed',
    currentStepIndex: 2,
    createdAt: '2026-09-18T09:00:00Z',
    targetCompletionDate: '2026-09-24T17:00:00Z',
    assignedTechnician: 'Sarah Chen (QA-209)',
    notes: 'Finished traveler. Conformance certificate stamped and ready for packing slip.',
    steps: [
      {
        id: 'step-bms-010',
        opCode: 'OP-010',
        title: 'Cell Voltage Monitoring ADC Precision Verification',
        workCenter: 'Bench 02',
        requiredSkill: 'IPC-A-610 Class 3',
        estimatedMinutes: 30,
        status: 'passed',
        instructions: ['Measure all 16 channel inputs with 4.200V precision voltage standard.'],
        dataFields: [
          {
            id: 'df-bms-101',
            label: 'Max Channel Measurement Delta (< 1.5 mV)',
            type: 'numeric',
            unit: 'mV',
            min: 0.0,
            max: 1.5,
            nominal: 0.4,
            required: true,
            value: 0.6,
            isWithinSpec: true,
            recordedBy: 'Sarah Chen',
            recordedAt: '2026-09-23T14:10:00Z'
          }
        ],
        signature: {
          technicianName: 'Sarah Chen',
          badgeId: 'QA-209',
          role: 'Senior Quality Inspector',
          station: 'QA Lab 02',
          timestamp: '2026-09-23T14:15:00Z'
        },
        completedAt: '2026-09-23T14:15:00Z'
      },
      {
        id: 'step-bms-020',
        opCode: 'OP-020',
        title: 'High-Current Shunt Discharge & Contact Resistance Check',
        workCenter: 'Power Bay',
        requiredSkill: 'High Voltage Safety Level 2',
        estimatedMinutes: 25,
        status: 'passed',
        instructions: ['Pulse 200A load through main busbars and measure millivolt drop across copper shunt.'],
        dataFields: [
          {
            id: 'df-bms-201',
            label: 'Shunt Resistance (48.0 - 52.0 µΩ)',
            type: 'numeric',
            unit: 'µΩ',
            min: 48.0,
            max: 52.0,
            nominal: 50.0,
            required: true,
            value: 49.8,
            isWithinSpec: true,
            recordedBy: 'Sarah Chen',
            recordedAt: '2026-09-23T15:30:00Z'
          }
        ],
        signature: {
          technicianName: 'Sarah Chen',
          badgeId: 'QA-209',
          role: 'Senior Quality Inspector',
          station: 'QA Lab 02',
          timestamp: '2026-09-23T15:40:00Z'
        },
        completedAt: '2026-09-23T15:40:00Z'
      },
      {
        id: 'step-bms-030',
        opCode: 'OP-030',
        title: 'Final Conformance Review & Customer CoC Sign-off',
        workCenter: 'QA Lab 02',
        requiredSkill: 'AS9100 Lead Auditor',
        estimatedMinutes: 15,
        status: 'passed',
        instructions: ['Generate and verify Certificate of Conformance. Apply quality hologram seal.'],
        dataFields: [
          {
            id: 'df-bms-301',
            label: 'Certificate of Conformance Authorized',
            type: 'boolean',
            required: true,
            value: true,
            isWithinSpec: true,
            recordedBy: 'Sarah Chen',
            recordedAt: '2026-09-23T16:20:00Z'
          }
        ],
        signature: {
          technicianName: 'Sarah Chen',
          badgeId: 'QA-209',
          role: 'Senior Quality Inspector',
          station: 'QA Lab 02',
          timestamp: '2026-09-23T16:25:00Z'
        },
        completedAt: '2026-09-23T16:25:00Z'
      }
    ],
    bom: [
      {
        id: 'bom-bms-01',
        partNumber: 'ADI-LTC6811-1',
        description: '12-Channel High Voltage Battery Stack Monitor IC',
        referenceDesignator: 'U1, U2',
        quantity: 2,
        lotNumber: 'LOT-ADI-2026-9',
        manufacturer: 'Analog Devices',
        verified: true
      }
    ],
    ncrs: []
  }
];
