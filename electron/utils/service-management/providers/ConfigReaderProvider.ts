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
        // Config file doesn't exist, try to initialize it
        console.log('Config file not found, attempting to initialize...');
        const initResult = await this.configManager.initialize();
        if (initResult.success) {
          console.log('Config initialized successfully, retrying...');
          const retryResult = await this.configManager.getConfig();
          if (retryResult.success) {
            return retryResult.config;
          }
        }
        throw new Error(result.message || 'Failed to get config');
      }
    } catch (error) {
      console.error('ConfigReaderProvider.getConfig error:', error);

      // Try to initialize if file doesn't exist
      if (!fs.existsSync(this.configPath)) {
        try {
          console.log('Config file missing, attempting emergency initialization...');
          const initResult = await this.configManager.initialize();
          if (initResult.success) {
            const retryResult = await this.configManager.getConfig();
            if (retryResult.success) {
              return retryResult.config;
            }
          }
        } catch (initError) {
          console.error('Emergency initialization failed:', initError);
        }
        throw new Error('Config file not found and initialization failed');
      }

      // If file exists but is corrupted, try to read it directly
      try {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (parseError) {
        console.error('Failed to parse config file:', parseError);
        throw new Error('Config file exists but is corrupted');
      }
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
      // Fallback to direct file write
      try {
        // Ensure directory exists
        const configDir = require('path').dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        console.log('Config saved using fallback method');
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
        throw error;
      }
    }
  }
} 