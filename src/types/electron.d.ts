import {
  LaserGratingCombination,
  LaserGratingFileResult,
  SystemFolderResult
} from './traveller';

declare global {
  interface Window {
    desktopAPI?: {
      createLaserGratingFiles: (
        serialNumber: string,
        partNumber: string,
        customerName: string,
        saveLocation: string,
        combinations: LaserGratingCombination[],
        overwrite: boolean
      ) => Promise<LaserGratingFileResult>;
      createSystemFolders: (
        serialNumber: string,
        partNumber: string,
        customerName: string,
        saveLocation: string
      ) => Promise<SystemFolderResult>;
      selectNetworkDirectory: () => Promise<string | null>;
    };
  }
}

export {};
