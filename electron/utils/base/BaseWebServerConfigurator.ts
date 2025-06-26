import * as fs from 'fs';
import * as path from 'path';
import { IWebServerConfigurator, IConfigProvider } from '../interfaces';
import { SonnaPaths, ServicePaths, PHP_VERSIONS } from '../constants';

export abstract class BaseWebServerConfigurator implements IWebServerConfigurator {
  protected configProvider: IConfigProvider;

  constructor(configProvider: IConfigProvider) {
    this.configProvider = configProvider;
  }

  abstract updateConfiguration(): Promise<void>;

  protected async getInstalledPHPInfo(): Promise<{ phpPath: string; phpDllName: string; incomplete?: boolean } | null> {
    try {
      const configResult = await this.configProvider.getConfig();

      // First try: Use config-based detection
      if (configResult.success && configResult.config) {
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

        if (phpPath && fs.existsSync(path.join(phpPath, phpDllName))) {
          console.log(`🐘 PHP detected from config: ${phpPath} (${phpDllName})`);
          return { phpPath, phpDllName };
        }
      }

      // Second try: Fallback to filesystem scan when config is not available or outdated
      console.log('⚠️ Config-based PHP detection failed, scanning filesystem...');

      let phpWithoutDll = null; // Track PHP installations without DLL files

      const phpPaths = PHP_VERSIONS.map(version => ServicePaths.getPhpPath(version));

      for (const phpPath of phpPaths) {
        if (fs.existsSync(phpPath)) {
          const version = path.basename(phpPath);
          const phpExe = ServicePaths.getPhpExecutable(version);

          if (fs.existsSync(phpExe)) {
            const dllPath = ServicePaths.getPhpDll(version);
            
            if (fs.existsSync(dllPath)) {
              const dllName = path.basename(dllPath);
              console.log(`🐘 PHP detected from filesystem: ${phpPath} (${dllName})`);
              return { phpPath, phpDllName: dllName };
            } else {
              // Store PHP path without DLL as fallback
              if (!phpWithoutDll) {
                phpWithoutDll = { phpPath, version };
                console.log(`⚠️ PHP found but missing Apache DLL: ${phpPath}`);
              }
            }
          }
        }
      }

      // Third try: scan all subdirectories in PHP directory for flexible naming
      const phpBaseDir = `${SonnaPaths.APPLICATIONS_PATH}/php`;
      if (fs.existsSync(phpBaseDir)) {
        const phpDirs = fs.readdirSync(phpBaseDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const phpDirName of phpDirs) {
          const phpPath = ServicePaths.getPhpPath(phpDirName);
          const phpExe = ServicePaths.getPhpExecutable(phpDirName);

          if (fs.existsSync(phpExe)) {
            const dllPath = ServicePaths.getPhpDll(phpDirName);
            
            if (fs.existsSync(dllPath)) {
              const dllName = path.basename(dllPath);
              console.log(`🐘 PHP detected from subdirectory scan: ${phpPath} (${dllName})`);
              return { phpPath, phpDllName: dllName };
            } else {
              // Store PHP path without DLL as fallback
              if (!phpWithoutDll) {
                phpWithoutDll = { phpPath, version: phpDirName };
                console.log(`⚠️ PHP found but missing Apache DLL in subdir: ${phpPath}`);
              }
            }
          }
        }
      }

      // Final fallback: Use PHP without DLL if found (limited functionality)
      if (phpWithoutDll) {
        const assumedDll = phpWithoutDll.version.startsWith('7') ? 'php7apache2_4.dll' : 'php8apache2_4.dll';
        console.log(`⚠️ Using PHP without DLL as fallback: ${phpWithoutDll.phpPath} (assumed: ${assumedDll})`);
        console.log(`🔧 Note: Apache module may not work properly. Consider reinstalling PHP with complete package.`);
        console.log(`📄 Requirement page will remain active until PHP DLL is available.`);
        // Return special flag to indicate incomplete PHP installation
        return { phpPath: phpWithoutDll.phpPath, phpDllName: assumedDll, incomplete: true };
      }

      console.log('❌ No PHP installation found');
      return null;
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

      const expectedPath = phpMyAdminService?.extractPath || ServicePaths.PHPMYADMIN_PATH;
      if (fs.existsSync(path.join(expectedPath, 'index.php'))) {
        console.log('phpMyAdmin found at expected location:', expectedPath);

        if (phpMyAdminService && !phpMyAdminService.installed) {
          console.log('Note: phpMyAdmin found but not marked as installed in config');
          console.log('Consider reinstalling phpMyAdmin through Sonna to update configuration');
        }

        return expectedPath;
      }

      const commonPaths = [
        `${SonnaPaths.WWW_PATH}/phpmyadmin`,
        ServicePaths.PHPMYADMIN_PATH,
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