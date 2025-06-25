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

export interface VersionedServiceConfig extends ServiceConfig {
  isDefault?: boolean;
}

export interface SonnaConfig {
  version: string;
  installPath: string;
  wwwPath: string;
  services: {
    php: {
      versions: Record<string, VersionedServiceConfig>;
      current: string;
    };
    nodejs: {
      versions: Record<string, VersionedServiceConfig>;
      current: string;
    };
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
    defaultNodeVersion: string;
    defaultPort: number;
  };
  projectSettings: Record<string, {
    phpVersion?: string;
    nodeVersion?: string;
  }>;
}

export interface DownloadProgress {
  serviceName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error';
  message: string;
} 