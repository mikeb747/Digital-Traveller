const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated desktop APIs to the React renderer
contextBridge.exposeInMainWorld('desktopAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  readNetworkFile: (filePath) => ipcRenderer.invoke('read-network-file', filePath),
  writeNetworkFile: (filePath, data) => ipcRenderer.invoke('write-network-file', { filePath, data }),
  selectNetworkDirectory: () => ipcRenderer.invoke('select-network-directory'),
  fetchWireKey: (serialNumber) => ipcRenderer.invoke('fetch-wire-key', serialNumber)
});
