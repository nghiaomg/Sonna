import { IConfigProvider } from '../interfaces';
import { ConfigManager } from '../config-manager';

// Config provider implementation
export class ConfigManagerProvider implements IConfigProvider {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  async getConfig(): Promise<{ success: boolean; config?: any; message?: string }> {
    return await this.configManager.getConfig();
  }
} 