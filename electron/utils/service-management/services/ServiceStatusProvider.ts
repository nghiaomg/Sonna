import { IServiceStatusProvider, ServiceStatus, IConfigReader, IServiceRunner } from '../interfaces';
import { ServiceCheckerFactory } from '../factories';
import { IFileSystem } from '../interfaces';

export class ServiceStatusProvider implements IServiceStatusProvider {
  private configReader: IConfigReader;
  private serviceRunner: IServiceRunner;
  private checkerFactory: ServiceCheckerFactory;

  constructor(
    configReader: IConfigReader,
    serviceRunner: IServiceRunner,
    fileSystem: IFileSystem
  ) {
    this.configReader = configReader;
    this.serviceRunner = serviceRunner;
    this.checkerFactory = new ServiceCheckerFactory(fileSystem);
  }

  async getServicesStatus(): Promise<Record<string, ServiceStatus>> {
    try {
      const config = await this.configReader.getConfig();
      const status: Record<string, ServiceStatus> = {};

      for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
        const service = serviceConfig as any;
        
        if (service && typeof service === 'object' && service.name) {
          const checker = this.checkerFactory.createChecker(service.name);
          const isActuallyInstalled = service.installed && checker.checkInstallation(service);

          status[serviceName] = {
            installed: isActuallyInstalled,
            running: this.serviceRunner.isRunning(serviceName)
          };
        }
      }

      return status;
    } catch (error) {
      console.error('Failed to get services status:', error);
      return this.getDefaultStatus();
    }
  }

  private getDefaultStatus(): Record<string, ServiceStatus> {
    return {
      apache: { installed: false, running: false },
      nginx: { installed: false, running: false },
      mysql: { installed: false, running: false },
      php: { installed: false, running: false },
      redis: { installed: false, running: false },
      nodejs: { installed: false, running: false },
    };
  }
} 