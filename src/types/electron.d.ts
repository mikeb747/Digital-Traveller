import {
  LaserGratingCombination,
  LaserGratingFileResult,
  SystemFolderResult
} from './traveller';

export interface CleanupFolder {
  path: string;
  category: string;
}

export interface CleanupRegistryKey {
  path: string;
  category: string;
}

export interface WireUninstallEntry {
  registryPath: string;
  displayName: string;
  displayVersion: string;
  publisher: string;
  uninstallString: string;
  productCode: string | null;
  windowsInstaller: boolean;
}

export type CleanupResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export type CleanupToolbarResult =
  | { success: true; data: undefined; message?: string }
  | { success: false; error: string; conflict?: false }
  | { success: false; conflict: true; message: string };

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
      searchCleanupFolders: () => Promise<CleanupResult<CleanupFolder[]>>;
      searchArchiveSystemResults: () => Promise<CleanupResult<CleanupFolder[]>>;
      archiveSystemResults: (paths: string[]) => Promise<CleanupResult<string[]>>;
      deleteCleanupFolders: (paths: string[]) => Promise<CleanupResult<string[]>>;
      searchCleanupRegistry: () => Promise<CleanupResult<CleanupRegistryKey[]>>;
      deleteCleanupRegistry: (paths: string[]) => Promise<CleanupResult<string[]>>;
      restoreCleanupToolbar: (
        registryPath: string,
        installDirectory: string,
        targetIndex: 0 | 1,
        overwrite: boolean
      ) => Promise<CleanupToolbarResult>;
      searchWireUninstallEntries: () => Promise<CleanupResult<WireUninstallEntry[]>>;
      killWireProcesses: () => Promise<CleanupResult<string[]>>;
      launchWireUninstall: (registryPath: string) => Promise<CleanupResult>;
    };
  }
}

export {};
