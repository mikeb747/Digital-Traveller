import { LaserGratingCombination, LaserGratingFileResult } from './traveller';

declare global {
  interface Window {
    desktopAPI?: {
      createLaserGratingFiles: (
        serialNumber: string,
        combinations: LaserGratingCombination[],
        overwrite: boolean
      ) => Promise<LaserGratingFileResult>;
    };
  }
}

export {};
