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
  createLaserGratingFiles: (serialNumber, combinations, overwrite) =>
    ipcRenderer.invoke('create-laser-grating-files', { serialNumber, combinations, overwrite }),
  fetchWireKey: (serialNumber) => ipcRenderer.invoke('fetch-wire-key', serialNumber)
});
