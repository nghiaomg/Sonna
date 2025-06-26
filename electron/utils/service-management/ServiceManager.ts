import {
  ServiceConfig,
  ServiceStatus,
  ServiceResult,
  IServiceStatusProvider,
  IServiceRunner,
  IConfigReader,
  IServiceChecker,
  IFileSystem
} from './interfaces';
import { ProcessServiceRunner } from './runners';
import { ServiceStatusProvider } from './services';
import { ServiceCheckerFactory } from './factories';
import { FileSystemProvider, ConfigReaderProvider } from './providers';
import { SonnaPaths } from '../constants';

/**
 * Main service manager following SOLID principles
 * 
 * This class orchestrates service management by delegating to appropriate
 * specialized classes for checking, running, and status tracking.
 */
export class ServiceManager {
  private configReader: IConfigReader;
  private serviceRunner: IServiceRunner;
  private statusProvider: IServiceStatusProvider;
  private checkerFactory: ServiceCheckerFactory;
  private fileSystem: IFileSystem;

  constructor(configPath: string = SonnaPaths.CONFIG_FILE) {
    // Dependency injection setup
    this.fileSystem = new FileSystemProvider();
    this.configReader = new ConfigReaderProvider(configPath);
    this.serviceRunner = new ProcessServiceRunner(this.configReader);
    this.statusProvider = new ServiceStatusProvider(
      this.configReader,
      this.serviceRunner,
      this.fileSystem
    );
    this.checkerFactory = new ServiceCheckerFactory(this.fileSystem);
  }

  /**
   * Get status of all services
   */
  async getServicesStatus(): Promise<Record<string, ServiceStatus>> {
    return await this.statusProvider.getServicesStatus();
  }

  /**
   * Start a specific service
   */
  async startService(serviceName: string): Promise<ServiceResult> {
    try {
      const config = await this.configReader.getConfig();
      const service = config.services[serviceName];

      if (!service) {
        return { success: false, message: 'Service not found' };
      }

      const checker = this.checkerFactory.createChecker(service.name);
      
      if (!service.installed || !checker.checkInstallation(service)) {
        return { success: false, message: 'Service not installed' };
      }

      return await this.serviceRunner.start(serviceName, service);
    } catch (error) {
      console.error(`Failed to start service ${serviceName}:`, error);
      return { success: false, message: `Failed to start: ${error}` };
    }
  }

  /**
   * Stop a specific service
   */
  async stopService(serviceName: string): Promise<ServiceResult> {
    return await this.serviceRunner.stop(serviceName);
  }

  /**
   * Check if a service is running
   */
  isServiceRunning(serviceName: string): boolean {
    return this.serviceRunner.isRunning(serviceName);
  }

  /**
   * Check installation of a specific service
   */
  checkServiceInstallation(service: ServiceConfig): boolean {
    const checker = this.checkerFactory.createChecker(service.name);
    return checker.checkInstallation(service);
  }

  /**
   * Cleanup all running services
   */
  async cleanup(): Promise<void> {
    if (this.serviceRunner && 'cleanup' in this.serviceRunner) {
      await (this.serviceRunner as any).cleanup();
    }
  }

  /**
   * Get service configuration
   */
  async getServiceConfig(serviceName: string): Promise<ServiceConfig | null> {
    try {
      const config = await this.configReader.getConfig();
      return config.services[serviceName] || null;
    } catch (error) {
      console.error(`Failed to get service config for ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Update service status in config
   */
  async updateServiceStatus(serviceName: string, updates: { installed?: boolean; running?: boolean }): Promise<void> {
    try {
      const config = await this.configReader.getConfig();
      
      if (config.services[serviceName]) {
        if (updates.installed !== undefined) {
          config.services[serviceName].installed = updates.installed;
        }
        if (updates.running !== undefined) {
          config.services[serviceName].running = updates.running;
        }
        
        await this.configReader.saveConfig(config);
      }
    } catch (error) {
      console.error(`Failed to update service status for ${serviceName}:`, error);
    }
  }
} 