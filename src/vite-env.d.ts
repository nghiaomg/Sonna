/// <reference types="vite/client" />
/// <reference types="node" />

declare global {
  interface Window {
    electronAPI: {
      getServicesStatus: () => Promise<Record<string, boolean>>;
      startService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
      stopService: (serviceName: string) => Promise<{ success: boolean; message: string }>;
      getProjects: () => Promise<any[]>;
      createVirtualHost: (config: any) => Promise<{ success: boolean; message: string }>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isWindowMaximized: () => Promise<boolean>;
      platform: string;
    };
  }
}

export {};
