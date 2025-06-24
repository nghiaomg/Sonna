import { contextBridge, ipcRenderer, shell } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Service management
  getServicesStatus: () => ipcRenderer.invoke('get-services-status'),
  startService: (serviceName: string) => ipcRenderer.invoke('start-service', serviceName),
  stopService: (serviceName: string) => ipcRenderer.invoke('stop-service', serviceName),
  
  // Project management
  getProjects: () => ipcRenderer.invoke('get-projects'),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
  openExternal: (url: string) => shell.openExternal(url),
  
  // Path management
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  changeInstallationPath: (newPath: string, moveFiles: boolean) => 
    ipcRenderer.invoke('change-installation-path', newPath, moveFiles),
  
  // Virtual host management
  createVirtualHost: (config: any) => ipcRenderer.invoke('create-virtual-host', config),
  
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
  updateConfig: (config: any) => ipcRenderer.invoke('update-config', config),
  downloadService: (serviceName: string) => ipcRenderer.invoke('download-service', serviceName),
  onDownloadProgress: (callback: any) => ipcRenderer.on('download-progress', callback),
  removeDownloadProgressListener: (callback: any) => ipcRenderer.removeListener('download-progress', callback),
  resetInstallationStatus: () => ipcRenderer.invoke('reset-installation-status'),
  refreshConfig: () => ipcRenderer.invoke('refresh-config'),
  cleanupApplications: () => ipcRenderer.invoke('cleanup-applications'),
  deleteService: (serviceName: string) => ipcRenderer.invoke('delete-service', serviceName),
  
  // Platform info
  platform: process.platform,
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getServicesStatus: () => Promise<any>;
      startService: (serviceName: string) => Promise<any>;
      stopService: (serviceName: string) => Promise<any>;
      getProjects: () => Promise<any>;
      openFolder: (path: string) => Promise<any>;
      openExternal: (url: string) => Promise<void>;
      selectFolder: () => Promise<string>;
      changeInstallationPath: (newPath: string, moveFiles: boolean) => Promise<any>;
      createVirtualHost: (config: any) => Promise<any>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isWindowMaximized: () => Promise<boolean>;
      quitApp: () => Promise<void>;
      hideToTray: () => Promise<void>;
      initializeSonna: () => Promise<any>;
      getSonnaConfig: () => Promise<any>;
      updateConfig: (config: any) => Promise<any>;
      downloadService: (serviceName: string) => Promise<any>;
      onDownloadProgress: (callback: any) => void;
      removeDownloadProgressListener: (callback: any) => void;
      resetInstallationStatus: () => Promise<any>;
      cleanupApplications: () => Promise<any>;
      deleteService: (serviceName: string) => Promise<any>;
      platform: string;
    };
  }
} 