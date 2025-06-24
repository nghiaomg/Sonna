/// <reference types="vite/client" />
/// <reference types="node" />

declare global {
  interface Window {
    electronAPI: {
      getServicesStatus: () => Promise<Record<string, { installed: boolean; running: boolean }>>;
      startService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
      stopService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
      getProjects: () => Promise<any[]>;
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
      platform: string;
    };
  }
}

export {};
