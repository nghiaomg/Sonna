// This file is a bridge between the renderer process and the main process
// It provides a secure way for the renderer to access specific electron APIs

const { contextBridge, ipcRenderer, shell } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Service management
  getServicesStatus: () => ipcRenderer.invoke('get-services-status'),
  startService: (serviceName) => ipcRenderer.invoke('start-service', serviceName),
  stopService: (serviceName) => ipcRenderer.invoke('stop-service', serviceName),
  
  // Project management
  getProjects: () => ipcRenderer.invoke('get-projects'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  openExternal: (url) => shell.openExternal(url),
  
  // Path management
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  changeInstallationPath: (newPath, moveFiles) => 
    ipcRenderer.invoke('change-installation-path', newPath, moveFiles),
  
  // Virtual host management
  createVirtualHost: (config) => ipcRenderer.invoke('create-virtual-host', config),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  hideToTray: () => ipcRenderer.invoke('hide-to-tray'),
  
  // Setup and Configuration
  initializeSonna: () => ipcRenderer.invoke('initialize-sonna'),
  getSonnaConfig: () => ipcRenderer.invoke('get-sonna-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  downloadService: (serviceName) => ipcRenderer.invoke('download-service', serviceName),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  removeDownloadProgressListener: (callback) => ipcRenderer.removeListener('download-progress', callback),
  resetInstallationStatus: () => ipcRenderer.invoke('reset-installation-status'),
  refreshConfig: () => ipcRenderer.invoke('refresh-config'),
  cleanupApplications: () => ipcRenderer.invoke('cleanup-applications'),
  deleteService: (serviceName) => ipcRenderer.invoke('delete-service', serviceName),
  
  // Platform info
  platform: process.platform,
}); 