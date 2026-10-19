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
  fetchWireKey: (serialNumber) => ipcRenderer.invoke('fetch-wire-key', serialNumber)
});
