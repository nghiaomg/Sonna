export interface ServiceConfig {
  name: string;
  displayName: string;
  version: string;
  downloadUrl: string;
  extractPath: string;
  executable: string;
  configFile?: string;
  port?: number;
  installed: boolean;
  running: boolean;
}

export interface SonnaConfig {
  version: string;
  installPath: string;
  wwwPath: string;
  services: {
    php: ServiceConfig;
    nodejs: ServiceConfig;
    apache: ServiceConfig;
    nginx: ServiceConfig;
    mysql: ServiceConfig;
    mongodb: ServiceConfig;
    phpmyadmin: ServiceConfig;
    redis: ServiceConfig;
  };
  settings: {
    autoStart: string[];
    defaultPHPVersion: string;
    defaultPort: number;
  };
}

export interface DownloadProgress {
  serviceName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error';
  message: string;
} 