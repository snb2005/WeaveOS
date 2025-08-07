const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  
  // Browser controls
  openURL: (url) => ipcRenderer.invoke('open-url', url),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),
  
  // File system access
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  
  // Window controls
  minimize: () => ipcRenderer.invoke('minimize'),
  maximize: () => ipcRenderer.invoke('maximize'),
  close: () => ipcRenderer.invoke('close'),
  
  // Download management
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback)
});
