import { LaserGratingCombination } from '../types/traveller';

export const LASER_GRATING_SELECTION_STEP_NAME = 'Select Laser and Grating Combinations';
export const LASER_GRATING_FILES_STEP_NAME = 'Create Extra Data Files';
export const PAT_TEST_STEP_NAME = 'PAT Test';
export const PRE_SYSTEM_TEST_STEP_NAME = 'Pre System Test';
export const SYSTEM_UNBOXING_STEP_NAME = 'System & PC Set Up';
export const LEGACY_SYSTEM_UNBOXING_STEP_NAME = 'System & PC Unboxing & Set Up';
export const RECORD_SYSTEM_DETAILS_STEP_NAME = 'Record System Details';
export const SYSTEM_FOLDERS_STEP_NAME = 'Create System Folders';
export const LASER_GRATING_FILES_SAVE_INSTRUCTION =
  'Files are saved in the configured system folder under Internal data/Extra Data.';
export const SYSTEM_FOLDERS_STEP_INSTRUCTIONS = [
  'Create the system folder named <Serial Number>_<Part Number>_<Customer Name>.',
  'Create Customer data\\Probe 1, Customer data\\Reg Backup, and Customer data\\System Pictures.',
  'Create Internal data\\Digital Test Sheets and Internal data\\Extra Data. Save test sheets and records in Internal data.'
];
export const PAT_TEST_STEP_INSTRUCTIONS = [
  'Perform electrical safety inspection and Portable Appliance Testing (PAT).',
  'Verify earth continuity resistance (< 0.1 Ω).',
  'Measure insulation resistance (> 2 MΩ at 500V DC).',
  'Confirm touch leakage and substitute leakage current within safe limits (< 0.5 mA).',
  'Affix passed PAT test label with test date, retest period, and tester initials.'
];
export const PRE_SYSTEM_TEST_STEP_INSTRUCTIONS = [
  'Perform initial pre-system inspection and hardware check.',
  'Verify all internal DC power supply rails (24V, 12V, 5V) before main system boot.',
  'Verify communication interfaces (USB / Ethernet) with host PC.',
  'Confirm emergency stop circuit and laser safety interlock operation.'
];
export const SYSTEM_UNBOXING_STEP_INSTRUCTIONS = [
  'Inspect system and PC for transit damage, connect required peripherals, and complete base mechanical set up.'
];
export const RECORD_SYSTEM_DETAILS_STEP_INSTRUCTIONS = [
  'Enter the system serial number, customer name, job number, and part number.'
];

export function getLaserGratingFileName(combination: LaserGratingCombination): string {
  return `${Number(combination.wavelengthNm)}nm_${Number(combination.gratingDensityLinesPerMm)}.txt`;
}

export function validateLaserGratingCombinations(
  combinations: LaserGratingCombination[]
): string | null {
  if (combinations.length === 0) {
    return 'Add at least one laser and grating combination.';
  }

  for (let index = 0; index < combinations.length; index += 1) {
    const combination = combinations[index];
    if (
      typeof combination?.wavelengthNm !== 'string' ||
      typeof combination?.gratingDensityLinesPerMm !== 'string'
    ) {
      return `Enter a wavelength and grating density in row ${index + 1}.`;
    }
    const wavelength = Number(combination.wavelengthNm);
    const gratingDensity = Number(combination.gratingDensityLinesPerMm);
    if (
      !combination.wavelengthNm.trim() ||
      !Number.isFinite(wavelength) ||
      wavelength <= 0 ||
      !combination.gratingDensityLinesPerMm.trim() ||
      !Number.isInteger(gratingDensity) ||
      gratingDensity <= 0
    ) {
      return `Enter a positive wavelength and a positive whole-number grating density in row ${index + 1}.`;
    }
  }

  return null;
}
