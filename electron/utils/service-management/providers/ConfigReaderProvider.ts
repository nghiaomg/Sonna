import * as fs from 'fs';
import { IConfigReader } from '../interfaces';
import { ConfigManager } from '../../config-manager';

export class ConfigReaderProvider implements IConfigReader {
  private configPath: string;
  private configManager: ConfigManager;

  constructor(configPath: string = 'C:/sonna/config.json') {
    this.configPath = configPath;
    this.configManager = new ConfigManager();
  }

  async getConfig(): Promise<any> {
    try {
      const result = await this.configManager.getConfig();
      
      if (result.success) {
        return result.config;
      } else {
        throw new Error(result.message || 'Failed to get config');
      }
    } catch (error) {
      console.error('ConfigReaderProvider.getConfig error:', error);
      if (!fs.existsSync(this.configPath)) {
        throw new Error('Config file not found');
      }
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }
  }

  async saveConfig(config: any): Promise<void> {
    try {
      const result = await this.configManager.saveConfig(config);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save config');
      }
    } catch (error) {
      console.error('ConfigReaderProvider.saveConfig error:', error);
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }
  }
} 