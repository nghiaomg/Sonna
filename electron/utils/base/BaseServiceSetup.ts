import * as fs from 'fs';
import { IServiceSetup, IConfigProvider } from '../interfaces';

// Abstract base class following Open/Closed Principle (O)
export abstract class BaseServiceSetup implements IServiceSetup {
  protected configProvider: IConfigProvider;

  constructor(configProvider: IConfigProvider) {
    this.configProvider = configProvider;
  }

  abstract setupService(extractPath: string): Promise<void>;

  protected async getPortFromConfig(serviceName: string, defaultPort: number): Promise<number> {
    try {
      const configResult = await this.configProvider.getConfig();
      if (configResult.success && configResult.config?.services[serviceName]) {
        return configResult.config.services[serviceName].port || defaultPort;
      }
    } catch (error) {
      console.error(`Failed to get ${serviceName} port from config, using default:`, error);
    }
    return defaultPort;
  }

  protected writeConfigFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  protected ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
} 