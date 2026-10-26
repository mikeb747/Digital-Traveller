const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated desktop APIs to the React renderer
contextBridge.exposeInMainWorld('desktopAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  minimizeToTray: () => ipcRenderer.send('window-minimize-to-tray'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  readNetworkFile: (filePath) => ipcRenderer.invoke('read-network-file', filePath),
  writeNetworkFile: (filePath, data) => ipcRenderer.invoke('write-network-file', { filePath, data }),
  selectNetworkDirectory: () => ipcRenderer.invoke('select-network-directory'),
  createSystemFolders: (serialNumber, partNumber, customerName, saveLocation) =>
    ipcRenderer.invoke('create-system-folders', {
      serialNumber,
      partNumber,
      customerName,
      saveLocation
    }),
  createLaserGratingFiles: (
    serialNumber,
    partNumber,
    customerName,
    saveLocation,
    combinations,
    overwrite
  ) => ipcRenderer.invoke('create-laser-grating-files', {
    serialNumber,
    partNumber,
    customerName,
    saveLocation,
    combinations,
    overwrite
  }),
  searchCleanupFolders: () => ipcRenderer.invoke('search-cleanup-folders'),
  searchArchiveSystemResults: () => ipcRenderer.invoke('search-archive-system-results'),
  archiveSystemResults: (paths) => ipcRenderer.invoke('archive-system-results', paths),
  deleteCleanupFolders: (paths) => ipcRenderer.invoke('delete-cleanup-folders', paths),
  searchCleanupRegistry: () => ipcRenderer.invoke('search-cleanup-registry'),
  deleteCleanupRegistry: (paths) => ipcRenderer.invoke('delete-cleanup-registry', paths),
  restoreCleanupToolbar: (registryPath, installDirectory, targetIndex, overwrite) =>
    ipcRenderer.invoke('restore-cleanup-toolbar', {
      registryPath,
      installDirectory,
      targetIndex,
      overwrite
    }),
  searchWireUninstallEntries: () => ipcRenderer.invoke('search-wire-uninstall-entries'),
  launchWireUninstall: (registryPath) =>
    ipcRenderer.invoke('launch-wire-uninstall', registryPath),
  fetchWireKey: (serialNumber) => ipcRenderer.invoke('fetch-wire-key', serialNumber)
});
