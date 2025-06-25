// Core interfaces for service configuration system

export interface IServiceSetup {
  setupService(extractPath: string): Promise<void>;
}

export interface IConfigProvider {
  getConfig(): Promise<{ success: boolean; config?: any; message?: string }>;
}

export interface IWebServerConfigurator {
  updateConfiguration(): Promise<void>;
} 