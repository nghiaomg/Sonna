// Re-export all types
export * from './config';

export interface Service {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  running: boolean;
  port?: number;
  installed: boolean;
}

export interface Project {
  name: string;
  path: string;
  url: string;
  type: string;
  hasIndex: boolean;
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
  downloadService: (serviceName: string) => Promise<any>;
  onDownloadProgress: (callback: any) => void;
  resetInstallationStatus: () => Promise<any>;
  refreshConfig: () => Promise<any>;
  cleanupApplications: () => Promise<any>;
  deleteService: (serviceName: string) => Promise<any>;
  openFolder: (path: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  changeInstallationPath: (path: string, moveFiles: boolean) => Promise<{
    success: boolean;
    newPath: string;
    message?: string;
  }>;
  platform: string;
} 