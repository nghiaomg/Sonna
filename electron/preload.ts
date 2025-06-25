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
  
  // Version management
  setDefaultPHPVersion: (version: string) => ipcRenderer.invoke('set-default-php-version', version),
  setDefaultNodeVersion: (version: string) => ipcRenderer.invoke('set-default-node-version', version),
  setProjectPHPVersion: (projectPath: string, version: string) => ipcRenderer.invoke('set-project-php-version', projectPath, version),
  setProjectNodeVersion: (projectPath: string, version: string) => ipcRenderer.invoke('set-project-node-version', projectPath, version),
  downloadService: (serviceName: string) => ipcRenderer.invoke('download-service', serviceName),
  onDownloadProgress: (callback: any) => ipcRenderer.on('download-progress', callback),
  removeDownloadProgressListener: (callback: any) => ipcRenderer.removeListener('download-progress', callback),
  
  // Installation queue management
  getInstallationQueueStatus: () => ipcRenderer.invoke('get-installation-queue-status'),
  cancelInstallation: (serviceName: string) => ipcRenderer.invoke('cancel-installation', serviceName),
  onInstallationQueueStatus: (callback: any) => ipcRenderer.on('installation-queue-status', callback),
  removeInstallationQueueStatusListener: (callback: any) => ipcRenderer.removeListener('installation-queue-status', callback),
  
  resetInstallationStatus: () => ipcRenderer.invoke('reset-installation-status'),
  refreshConfig: () => ipcRenderer.invoke('refresh-config'),
  cleanupApplications: () => ipcRenderer.invoke('cleanup-applications'),
  deleteService: (serviceName: string) => ipcRenderer.invoke('delete-service', serviceName),
  
  // phpMyAdmin migration
  checkPhpMyAdminMigration: () => ipcRenderer.invoke('check-phpmyadmin-migration'),
  migratePhpMyAdmin: () => ipcRenderer.invoke('migrate-phpmyadmin'),
  
  // Web server configuration
  updateWebServerConfigs: () => ipcRenderer.invoke('update-webserver-configs'),
  regenerateApacheConfig: () => ipcRenderer.invoke('regenerate-apache-config'),
  
  // Config directory management
  initializeConfigDirectory: () => ipcRenderer.invoke('initialize-config-directory'),
  
  // PHP requirement for phpMyAdmin
  checkPhpForPhpMyAdmin: () => ipcRenderer.invoke('check-php-for-phpmyadmin'),
  setupPhpRequirementPage: () => ipcRenderer.invoke('setup-php-requirement-page'),
  
  // Auto-configuration
  autoConfigureServices: () => ipcRenderer.invoke('auto-configure-services'),
  triggerPostInstallationConfig: (serviceName: string) => ipcRenderer.invoke('trigger-post-installation-config', serviceName),
  onConfigUpdated: (callback: any) => ipcRenderer.on('config-updated', callback),
  removeConfigUpdatedListener: (callback: any) => ipcRenderer.removeListener('config-updated', callback),
  
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
      setDefaultPHPVersion: (version: string) => Promise<any>;
      setDefaultNodeVersion: (version: string) => Promise<any>;
      setProjectPHPVersion: (projectPath: string, version: string) => Promise<any>;
      setProjectNodeVersion: (projectPath: string, version: string) => Promise<any>;
      downloadService: (serviceName: string) => Promise<any>;
      onDownloadProgress: (callback: any) => void;
      removeDownloadProgressListener: (callback: any) => void;
      getInstallationQueueStatus: () => Promise<any>;
      cancelInstallation: (serviceName: string) => Promise<any>;
      onInstallationQueueStatus: (callback: any) => void;
      removeInstallationQueueStatusListener: (callback: any) => void;
      resetInstallationStatus: () => Promise<any>;
      cleanupApplications: () => Promise<any>;
      deleteService: (serviceName: string) => Promise<any>;
      checkPhpMyAdminMigration: () => Promise<{ needsMigration: boolean }>;
      migratePhpMyAdmin: () => Promise<{ success: boolean; message: string }>;
      updateWebServerConfigs: () => Promise<{ success: boolean; message: string }>;
      regenerateApacheConfig: () => Promise<{ success: boolean; message: string; phpDetected: boolean }>;
      initializeConfigDirectory: () => Promise<{ success: boolean; message: string }>;
      autoConfigureServices: () => Promise<{ success: boolean; message: string; actions: string[] }>;
      triggerPostInstallationConfig: (serviceName: string) => Promise<{ success: boolean; message: string }>;
      onConfigUpdated: (callback: any) => void;
      removeConfigUpdatedListener: (callback: any) => void;
      platform: string;
    };
  }
} 