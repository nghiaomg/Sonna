import * as fs from 'fs';
import * as path from 'path';
import { IWebServerConfigurator, IConfigProvider } from '../interfaces';

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
      if (!configResult.success || !configResult.config) {
        const defaultPath = 'C:/sonna/applications/phpmyadmin';
        if (fs.existsSync(path.join(defaultPath, 'index.php'))) {
          console.log('phpMyAdmin found at default location (not marked as installed):', defaultPath);
          return defaultPath;
        }
        return null;
      }

      const phpMyAdminService = configResult.config.services.phpmyadmin;

      if (phpMyAdminService?.installed && fs.existsSync(phpMyAdminService.extractPath)) {
        const indexPath = path.join(phpMyAdminService.extractPath, 'index.php');
        if (fs.existsSync(indexPath)) {
          console.log('phpMyAdmin found via config:', phpMyAdminService.extractPath);
          return phpMyAdminService.extractPath;
        }
      }

      const expectedPath = phpMyAdminService?.extractPath || 'C:/sonna/applications/phpmyadmin';
      if (fs.existsSync(path.join(expectedPath, 'index.php'))) {
        console.log('phpMyAdmin found at expected location:', expectedPath);

        if (phpMyAdminService && !phpMyAdminService.installed) {
          console.log('Note: phpMyAdmin found but not marked as installed in config');
          console.log('Consider reinstalling phpMyAdmin through Sonna to update configuration');
        }

        return expectedPath;
      }

      const commonPaths = [
        'C:/sonna/www/phpmyadmin',
        'C:/sonna/applications/phpmyadmin',
        'C:/phpmyadmin',
      ];

      for (const searchPath of commonPaths) {
        if (fs.existsSync(path.join(searchPath, 'index.php'))) {
          console.log('phpMyAdmin found at alternative location:', searchPath);
          return searchPath;
        }
      }

      console.log('phpMyAdmin not found in any expected locations');
      return null;
    } catch (error) {
      console.error('Failed to get phpMyAdmin path:', error);
      return null;
    }
  }
} 