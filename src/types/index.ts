// Re-export all types
export * from './config';

export interface Service {
  name: string;
  displayName: string;
  icon?: React.ReactNode;
  running: boolean;
  port?: number;
  installed: boolean;
  version?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface Project {
  name: string;
  path: string;
  url: string;
  type: string;
  hasIndex: boolean;
  phpVersion?: string;
  nodeVersion?: string;
}

export interface ElectronAPI {
  getServicesStatus: () => Promise<Record<string, { installed: boolean; running: boolean }>>;
  startService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
  stopService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
  getProjects: () => Promise<{ 
    success: boolean; 
    projects: Project[]; 
    wwwPath: string;
  }>;
  createVirtualHost: (config: any) => Promise<{ success: boolean; message: string }>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  hideToTray: () => Promise<void>;
  quitApp: () => Promise<void>;
  initializeSonna: () => Promise<any>;
  getSonnaConfig: () => Promise<any>;
  updateConfig: (config: any) => Promise<{ success: boolean; message?: string }>;
  downloadService: (serviceName: string) => Promise<any>;
  onDownloadProgress: (callback: any) => void;
  removeDownloadProgressListener: (callback: any) => void;
  resetInstallationStatus: () => Promise<any>;
  refreshConfig: () => Promise<any>;
  cleanupApplications: () => Promise<any>;
  deleteService: (serviceName: string) => Promise<any>;
  openFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  openExternal: (url: string) => Promise<void>;
  selectFolder: () => Promise<string>;
  changeInstallationPath: (path: string, moveFiles: boolean) => Promise<{
    success: boolean;
    newPath: string;
    message?: string;
  }>;
  setDefaultPHPVersion: (version: string) => Promise<{ success: boolean; message?: string }>;
  setDefaultNodeVersion: (version: string) => Promise<{ success: boolean; message?: string }>;
  setProjectPHPVersion: (projectPath: string, version: string) => Promise<{ success: boolean; message?: string }>;
  setProjectNodeVersion: (projectPath: string, version: string) => Promise<{ success: boolean; message?: string }>;
  platform: string;
} 