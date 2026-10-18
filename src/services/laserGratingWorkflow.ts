import { LaserGratingCombination } from '../types/traveller';

export const LASER_GRATING_SELECTION_STEP_NAME = 'Select Laser and Grating Combinations';
export const LASER_GRATING_FILES_STEP_NAME = 'Create Extra Data Files';

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
