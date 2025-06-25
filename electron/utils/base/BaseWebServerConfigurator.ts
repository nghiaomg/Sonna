import * as fs from 'fs';
import * as path from 'path';
import { IWebServerConfigurator, IConfigProvider } from '../interfaces';

// Web server configurators following Single Responsibility Principle
export abstract class BaseWebServerConfigurator implements IWebServerConfigurator {
  protected configProvider: IConfigProvider;

  constructor(configProvider: IConfigProvider) {
    this.configProvider = configProvider;
  }

  abstract updateConfiguration(): Promise<void>;

  protected async getInstalledPHPInfo(): Promise<{ phpPath: string; phpDllName: string } | null> {
    try {
      const configResult = await this.configProvider.getConfig();
      if (!configResult.success || !configResult.config) return null;

      const phpVersions = configResult.config.services.php?.versions || {};
      const currentPHPVersion = configResult.config.settings?.defaultPHPVersion;

      let phpPath = '';
      let phpDllName = 'php8apache2_4.dll';

      if (currentPHPVersion && phpVersions[currentPHPVersion]?.installed) {
        phpPath = phpVersions[currentPHPVersion].extractPath;
        phpDllName = currentPHPVersion.startsWith('7.') ? 'php7apache2_4.dll' : 'php8apache2_4.dll';
      } else {
        for (const [version, phpService] of Object.entries(phpVersions)) {
          const service = phpService as any;
          if (service.installed && service.extractPath) {
            phpPath = service.extractPath;
            phpDllName = version.startsWith('7.') ? 'php7apache2_4.dll' : 'php8apache2_4.dll';
            break;
          }
        }
      }

      return phpPath && fs.existsSync(path.join(phpPath, phpDllName)) 
        ? { phpPath, phpDllName } 
        : null;
    } catch (error) {
      console.error('Failed to get PHP info:', error);
      return null;
    }
  }

  protected async getPhpMyAdminPath(): Promise<string | null> {
    try {
      const configResult = await this.configProvider.getConfig();
      if (!configResult.success || !configResult.config) return null;

      const phpMyAdminService = configResult.config.services.phpmyadmin;
      return phpMyAdminService?.installed && fs.existsSync(phpMyAdminService.extractPath) 
        ? phpMyAdminService.extractPath 
        : null;
    } catch (error) {
      console.error('Failed to get phpMyAdmin path:', error);
      return null;
    }
  }
} 