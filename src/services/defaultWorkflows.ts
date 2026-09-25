import { SystemProfile, SystemType } from '../types/traveller';

export const SYSTEM_PROFILES: Record<SystemType, SystemProfile> = {
  InVia: {
    id: 'InVia',
    displayName: 'inVia™ Confocal Raman Microscope',
    tagline: 'High-performance research spectrometer',
    description: 'Precision automated Raman microscope with multi-laser kinematic grating carousels.',
    laserOptions: ['532 nm (DPSS)', '785 nm (Diode)', '633 nm (HeNe)', '325 nm (HeCd)'],
    defaultSteps: [
      // SETUP
      {
        name: 'Optical Bench Unboxing & Leveling',
        stage: 'Setup',
        instructions: [
          'Inspect the cast-aluminum optical baseplate for transit damage.',
          'Position on pneumatic vibration isolation table and level to ±0.2°.',
          'Verify mains power conditioning (230V/115V ±5%) and ground bond resistance < 0.1 Ω.'
        ],
        checklist: [
          { id: 'c1', label: 'Baseplate kinematic pads verified', done: false },
          { id: 'c2', label: 'Ground loop resistance < 0.1 Ohm verified', done: false },
          { id: 'c3', label: 'Environmental chamber 20°C ± 1°C confirmed', done: false }
        ]
      },
      {
        name: 'Laser Beam Alignment & Safety Interlocks',
        stage: 'Setup',
        instructions: [
          'Mount primary 532 nm excitation laser and secure beam steering optics.',
          'Align beam onto entrance pinhole with target quadrant detector.',
          'Test emergency beam shutter interlock and enclosure microswitches.'
        ],
        checklist: [
          { id: 'c4', label: 'Interlock circuit trip test passed (<50ms)', done: false },
          { id: 'c5', label: 'Beam circularity > 92% at microscope pupil', done: false }
        ],
        measuredData: [
          { parameter: 'Laser Power at sample', value: '', unit: 'mW', tolerance: '45 - 55 mW' },
          { parameter: 'Beam Divergence', value: '', unit: 'mrad', tolerance: '< 1.2 mrad' }
        ]
      },
      {
        name: 'Grating Turret & Slit Alignment',
        stage: 'Setup',
        instructions: [
          'Mount 1800 l/mm and 2400 l/mm holographic gratings.',
          'Initialize stepper motor home positions and verify zero-order retroreflection.'
        ],
        checklist: [
          { id: 'c6', label: 'Grating 1800 l/mm repeatability < 0.05 cm⁻¹', done: false },
          { id: 'c7', label: 'Confocal pinhole motorized centering calibrated', done: false }
        ]
      },

      // CALIBRATION
      {
        name: 'Silicon Internal Reference Standard 520.7 cm⁻¹',
        stage: 'Calibration',
        instructions: [
          'Load Renishaw certified Silicon (100) reference wafer on motorized XYZ stage.',
          'Execute automated peak center fit on the 520.7 cm⁻¹ first-order optical phonon.',
          'Record FWHM and peak position accuracy.'
        ],
        checklist: [
          { id: 'c8', label: 'Static silicon peak center within 520.7 ± 0.1 cm⁻¹', done: false },
          { id: 'c9', label: 'FWHM <= 3.2 cm⁻¹ with 1800 l/mm grating', done: false }
        ],
        measuredData: [
          { parameter: 'Si Peak Center', value: '', unit: 'cm⁻¹', tolerance: '520.70 ± 0.10' },
          { parameter: 'Silicon FWHM', value: '', unit: 'cm⁻¹', tolerance: '< 3.20' },
          { parameter: 'Peak Signal Counts', value: '', unit: 'cts/sec', tolerance: '> 85,000' }
        ]
      },
      {
        name: 'Rayleigh Cut-off Filter Calibration',
        stage: 'Calibration',
        instructions: [
          'Tune edge filter angle to achieve low wavenumber cut-off.',
          'Verify rejection optical density > OD 6 at excitation wavelength.',
          'Confirm transmission passband > 85% above 100 cm⁻¹.'
        ],
        checklist: [
          { id: 'c10', label: 'Low frequency cut-off verified below 100 cm⁻¹', done: false },
          { id: 'c11', label: 'Rayleigh peak bleed suppressed below 50 counts', done: false }
        ]
      },
      {
        name: 'CCD Detector Cooling & Dark Count Test',
        stage: 'Calibration',
        instructions: [
          'Cool Peltier CCD to operational setpoint (-70°C).',
          'Measure dark noise over 60s integration with shutter closed.',
          'Verify cosmetic defect map has no hot column defects.'
        ],
        measuredData: [
          { parameter: 'Detector Temp', value: '', unit: '°C', tolerance: '-70.0 ± 0.5' },
          { parameter: 'RMS Read Noise', value: '', unit: 'e⁻', tolerance: '< 4.5 e⁻' }
        ]
      },

      // FINAL TEST & RELEASE
      {
        name: 'Confocal Depth Profiling & Spatial Resolution',
        stage: 'Final Test & Release',
        instructions: [
          'Scan polished silicon wedge or multilayer polymer film in Z direction at 0.1 µm step.',
          'Confirm axial resolution FWHM <= 1.5 µm using 100x NA 0.9 objective.'
        ],
        checklist: [
          { id: 'c12', label: 'Lateral resolution <= 0.5 µm verified', done: false },
          { id: 'c13', label: 'Axial FWHM <= 1.5 µm verified', done: false }
        ]
      },
      {
        name: 'Full Spectral Range Repeatability Scan',
        stage: 'Final Test & Release',
        instructions: [
          'Acquire 10 consecutive extended Raman scans (100 - 3200 cm⁻¹).',
          'Compute peak shift variance across 2 hours thermal stabilization run.'
        ],
        checklist: [
          { id: 'c14', label: 'Wavenumber drift < 0.05 cm⁻¹ over 2 hours', done: false },
          { id: 'c15', label: 'Intensity stability deviation < 1.0%', done: false }
        ]
      },
      {
        name: 'Certificate of Conformity & Packaging Sign-off',
        stage: 'Final Test & Release',
        instructions: [
          'Export raw calibration files to factory quality archive.',
          'Print QA Certificate of Conformity and seal optical transport locks.',
          'Apply anti-static seal and package transit shroud.'
        ],
        checklist: [
          { id: 'c16', label: 'Optical locks torqued to 1.5 Nm specification', done: false },
          { id: 'c17', label: 'Shipping manifest & QA Certificate signed', done: false }
        ]
      }
    ]
  },

  Virsa: {
    id: 'Virsa',
    displayName: 'Virsa™ Portable Raman Analyzer',
    tagline: 'Versatile fiber-optic coupled Raman system',
    description: 'Ruggedized fiber-based Raman spectrometer for remote probe analysis outside the laboratory.',
    laserOptions: ['785 nm Laser Diode', '532 nm Fiber Source'],
    defaultSteps: [
      // SETUP
      {
        name: 'Chassis & Fiber Conduit Inspection',
        stage: 'Setup',
        instructions: [
          'Inspect rugged transport case and armored fiber patch cords.',
          'Test fiber optic interlock loop continuity.',
          'Verify DC power supply brick (24V 5A) and internal battery charge.'
        ],
        checklist: [
          { id: 'v1', label: 'Fiber jacket bends inspected (R > 50 mm)', done: false },
          { id: 'v2', label: 'Laser key switch operational', done: false }
        ]
      },
      {
        name: 'Fiber Probe Head Coupling & Shutter Test',
        stage: 'Setup',
        instructions: [
          'Attach remote objective lens head to SMA905 excitation/collection fiber.',
          'Verify integrated LED targeting illuminator and auto-focus mechanism.',
          'Test mechanical beam block actuation.'
        ],
        checklist: [
          { id: 'v3', label: 'Remote shutter open/close response < 30ms', done: false },
          { id: 'v4', label: 'Targeting spot aligns with collection cone', done: false }
        ]
      },

      // CALIBRATION
      {
        name: 'Automated Internal Reference Calibration',
        stage: 'Calibration',
        instructions: [
          'Engage internal automated reference standard.',
          'Run spectrometer polynomial wavelength calibration.',
          'Validate peak alignment against neon/argon line references.'
        ],
        checklist: [
          { id: 'v5', label: 'Internal Si reference 520.7 cm⁻¹ verified', done: false },
          { id: 'v6', label: 'Polystyrene validation standard within ± 0.5 cm⁻¹', done: false }
        ],
        measuredData: [
          { parameter: 'Reference Peak', value: '', unit: 'cm⁻¹', tolerance: '520.7 ± 0.2' },
          { parameter: 'Fiber Transmission Loss', value: '', unit: 'dB', tolerance: '< 1.8 dB' }
        ]
      },
      {
        name: 'Thermal Drift & Ambient Stability Cycle',
        stage: 'Calibration',
        instructions: [
          'Subject analyzer to temperature cycling (15°C to 35°C).',
          'Ensure internal thermo-electric stabilization locks within ±0.1°C.'
        ],
        checklist: [
          { id: 'v7', label: 'TE cooler locked in regulation', done: false }
        ]
      },

      // FINAL TEST & RELEASE
      {
        name: 'High-Throughput Sample Sensitivity Benchmark',
        stage: 'Final Test & Release',
        instructions: [
          'Record Paracetamol (acetaminophen) standard spectrum with 100ms exposure.',
          'Calculate Signal-to-Noise Ratio (SNR) for the 1648 cm⁻¹ amide band.'
        ],
        checklist: [
          { id: 'v8', label: 'SNR > 250:1 achieved on standard', done: false }
        ],
        measuredData: [
          { parameter: 'SNR (1648 cm⁻¹)', value: '', unit: 'ratio', tolerance: '> 250:1' }
        ]
      },
      {
        name: 'Packaging & Field Kit Acceptance',
        stage: 'Final Test & Release',
        instructions: [
          'Pack probe attachments, laser safety goggles, and power cables.',
          'Seal QA inspection stamp on traveler.'
        ],
        checklist: [
          { id: 'v9', label: 'Laser safety eyewear included (OD7+ @ 785nm)', done: false },
          { id: 'v10', label: 'Factory calibration certificate printed', done: false }
        ]
      }
    ]
  },

  inLux: {
    id: 'inLux',
    displayName: 'inLux™ SEM Raman Interface',
    tagline: 'In-situ Scanning Electron Microscope Raman accessory',
    description: 'Specialized hybrid SEM Raman spectrometer for vacuum chamber retrofits and correlative imaging.',
    laserOptions: ['532 nm (High Stability)', '785 nm (Low Fluorescence)'],
    defaultSteps: [
      // SETUP
      {
        name: 'SEM Vacuum Flange & Feedthrough Verification',
        stage: 'Setup',
        instructions: [
          'Clean CF flange mating surfaces and fit Viton O-ring / copper gasket.',
          'Mount optical conduit feedthrough assembly to SEM chamber port.',
          'Verify helium leak rate < 1 x 10⁻⁹ mbar·L/s.'
        ],
        checklist: [
          { id: 'x1', label: 'Vacuum leak rate < 1x10⁻⁹ mbar·L/s', done: false },
          { id: 'x2', label: 'Optical window anti-reflective coating intact', done: false }
        ]
      },
      {
        name: 'In-Chamber Objective Retractor Mechanism',
        stage: 'Setup',
        instructions: [
          'Mount motorized retractable objective arm in SEM chamber.',
          'Test pneumatic/stepper retraction travel between SEM clear and Raman park position.',
          'Verify clearance with SEM pole piece and EDS detector (> 5 mm).'
        ],
        checklist: [
          { id: 'x3', label: 'Safety park interlock switch confirmed', done: false },
          { id: 'x4', label: 'Collision prevention boundary set', done: false }
        ]
      },

      // CALIBRATION
      {
        name: 'Correlative Coordinate Transformation (SEM-Raman)',
        stage: 'Calibration',
        instructions: [
          'Load coordinate calibration standard into SEM.',
          'Align electron beam coincidence point with Raman laser focal spot.',
          'Compute affine transformation matrix for software correlative overlay.'
        ],
        checklist: [
          { id: 'x5', label: 'Beam coincidence offset < 1.0 µm', done: false },
          { id: 'x6', label: 'Overlay registration confirmed in software', done: false }
        ],
        measuredData: [
          { parameter: 'Coincidence Error X', value: '', unit: 'µm', tolerance: '< 0.8 µm' },
          { parameter: 'Coincidence Error Y', value: '', unit: 'µm', tolerance: '< 0.8 µm' }
        ]
      },
      {
        name: 'In-Situ Silicon Calibration Under Vacuum',
        stage: 'Calibration',
        instructions: [
          'Pump chamber to high vacuum (< 10⁻⁴ mbar).',
          'Acquire silicon calibration spectrum through retractable optical head.'
        ],
        checklist: [
          { id: 'x7', label: 'Silicon 520.7 cm⁻¹ verified under vacuum', done: false }
        ]
      },

      // FINAL TEST & RELEASE
      {
        name: 'Simultaneous SEM-EDS-Raman Interference Test',
        stage: 'Final Test & Release',
        instructions: [
          'Run electron beam at 15 kV alongside 532 nm Raman excitation.',
          'Check for secondary electron detector optical blindness or noise.',
          'Verify spectrometer dark counts do not increase with SEM beam on.'
        ],
        checklist: [
          { id: 'x8', label: 'Zero backscatter electron interference detected', done: false },
          { id: 'x9', label: 'SE detector baseline unaffected', done: false }
        ]
      },
      {
        name: 'Vacuum Seal Certificate & Final Release',
        stage: 'Final Test & Release',
        instructions: [
          'Affix serialized vacuum certification tag.',
          'Seal cleanroom dual-bag packaging with nitrogen purge.'
        ],
        checklist: [
          { id: 'x10', label: 'Cleanroom Class 100 bag sealed', done: false },
          { id: 'x11', label: 'QA sign-off recorded', done: false }
        ]
      }
    ]
  }
};
