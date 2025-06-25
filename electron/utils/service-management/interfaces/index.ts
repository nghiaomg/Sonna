// Core interfaces for service management system

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

export interface ServiceStatus {
  installed: boolean;
  running: boolean;
}

export interface ServiceResult {
  success: boolean;
  message: string;
}

export interface IServiceChecker {
  checkInstallation(service: ServiceConfig): boolean;
}

export interface IServiceRunner {
  start(serviceName: string, service: ServiceConfig): Promise<ServiceResult>;
  stop(serviceName: string): Promise<ServiceResult>;
  isRunning(serviceName: string): boolean;
}

export interface IConfigReader {
  getConfig(): Promise<any>;
  saveConfig(config: any): Promise<void>;
}

export interface IServiceStatusProvider {
  getServicesStatus(): Promise<Record<string, ServiceStatus>>;
}

export interface IFileSystem {
  exists(filePath: string): boolean;
  readDir(dirPath: string): string[];
  isDirectory(filePath: string): boolean;
} 