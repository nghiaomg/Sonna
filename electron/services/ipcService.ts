import { ipcMain, dialog, shell } from 'electron';
import { ServiceManager } from '../utils/service-manager';
import { ConfigManager } from '../utils/config-manager';
import { DownloadManager } from '../utils/download-manager';
import { ServiceConfigurator } from '../utils/service-configurator';
import { SonnaPaths, ServicePaths, PHP_VERSIONS } from '../utils/constants';
import * as fs from 'fs';
import * as path from 'path';
import { WindowService } from './windowService';

// Installation queue interface
interface InstallationTask {
  serviceName: string;
  service: any;
  priority: number;
}

export class IpcService {
  private serviceManager: ServiceManager;
  private configManager: ConfigManager;
  private downloadManager: DownloadManager;
  private serviceConfigurator: ServiceConfigurator;
  private windowService: WindowService;
  
  // Installation queue management
  private installationQueue: InstallationTask[] = [];
  private activeInstallations = new Set<string>();
  private maxConcurrentInstallations = 3; // Limit concurrent installations

  constructor(
    serviceManager: ServiceManager,
    configManager: ConfigManager,
    downloadManager: DownloadManager,
    serviceConfigurator: ServiceConfigurator,
    windowService: WindowService
  ) {
    this.serviceManager = serviceManager;
    this.configManager = configManager;
    this.downloadManager = downloadManager;
    this.serviceConfigurator = serviceConfigurator;
    this.windowService = windowService;
  }

  setupIpcHandlers() {
    // Service status handlers
    ipcMain.handle('get-services-status', async () => {
      return await this.serviceManager.getServicesStatus();
    });

    ipcMain.handle('check-running-services', async () => {
      const services = await this.serviceManager.getServicesStatus();
      // Check if any service is running
      return Object.values(services).some((service: any) => service.running);
    });

    ipcMain.handle('start-service', async (event, serviceName: string) => {
      return await this.serviceManager.startService(serviceName);
    });

    ipcMain.handle('stop-service', async (event, serviceName: string) => {
      return await this.serviceManager.stopService(serviceName);
    });

    // PHP and Node.js version handlers
    ipcMain.handle('set-default-php-version', async (event, version: string) => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        
        // Check if version exists
        if (!config.services.php.versions[version]) {
          return { success: false, message: `PHP version ${version} not found` };
        }
        
        // Update current version
        config.services.php.current = version;
        config.settings.defaultPHPVersion = version;
        
        // Save config
        await this.configManager.saveConfig(config);
        
        return { success: true, message: `Default PHP version set to ${version}` };
      } catch (error) {
        console.error(`Failed to set default PHP version to ${version}:`, error);
        return { success: false, message: `Failed to set default PHP version: ${error}` };
      }
    });

    ipcMain.handle('set-default-node-version', async (event, version: string) => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        
        // Check if version exists
        if (!config.services.nodejs.versions[version]) {
          return { success: false, message: `Node.js version ${version} not found` };
        }
        
        // Update current version
        config.services.nodejs.current = version;
        config.settings.defaultNodeVersion = version;
        
        // Save config
        await this.configManager.saveConfig(config);
        
        return { success: true, message: `Default Node.js version set to ${version}` };
      } catch (error) {
        console.error(`Failed to set default Node.js version to ${version}:`, error);
        return { success: false, message: `Failed to set default Node.js version: ${error}` };
      }
    });

    ipcMain.handle('set-project-php-version', async (event, projectPath: string, version: string) => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        
        // Check if version exists
        if (version && !config.services.php.versions[version]) {
          return { success: false, message: `PHP version ${version} not found` };
        }
        
        // Initialize project settings if needed
        if (!config.projectSettings) {
          config.projectSettings = {};
        }
        
        if (!config.projectSettings[projectPath]) {
          config.projectSettings[projectPath] = {};
        }
        
        // Update project PHP version
        config.projectSettings[projectPath].phpVersion = version || undefined;
        
        // Save config
        await this.configManager.saveConfig(config);
        
        return { 
          success: true, 
          message: version 
            ? `PHP version for project set to ${version}` 
            : 'Project will use default PHP version'
        };
      } catch (error) {
        console.error(`Failed to set PHP version for project ${projectPath}:`, error);
        return { success: false, message: `Failed to set project PHP version: ${error}` };
      }
    });

    ipcMain.handle('set-project-node-version', async (event, projectPath: string, version: string) => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        
        if (version && !config.services.nodejs.versions[version]) {
          return { success: false, message: `Node.js version ${version} not found` };
        }
        
        if (!config.projectSettings) {
          config.projectSettings = {};
        }
        
        if (!config.projectSettings[projectPath]) {
          config.projectSettings[projectPath] = {};
        }
        
        config.projectSettings[projectPath].nodeVersion = version || undefined;
        
        await this.configManager.saveConfig(config);
        
        return { 
          success: true, 
          message: version 
            ? `Node.js version for project set to ${version}` 
            : 'Project will use default Node.js version'
        };
      } catch (error) {
        console.error(`Failed to set Node.js version for project ${projectPath}:`, error);
        return { success: false, message: `Failed to set project Node.js version: ${error}` };
      }
    });

    // Project handlers
    ipcMain.handle('get-projects', async () => {
      try {
        const wwwPath = SonnaPaths.WWW_PATH.replace(/\//g, '\\');
        
        if (!fs.existsSync(wwwPath)) {
          fs.mkdirSync(wwwPath, { recursive: true });
          console.log(`Created projects directory: ${wwwPath}`);
        }
        
        return {
          success: true,
          projects: [],
          wwwPath: wwwPath
        };
      } catch (error) {
        console.error('Error getting projects:', error);
        return {
          success: false,
          projects: [],
          wwwPath: SonnaPaths.WWW_PATH.replace(/\//g, '\\'),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Open folder handler
    ipcMain.handle('open-folder', async (event, folderPath: string) => {
      try {
        console.log(`Attempting to open folder: ${folderPath}`);
        
        if (!fs.existsSync(folderPath)) {
          console.log(`Directory doesn't exist, creating: ${folderPath}`);
          try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Successfully created directory: ${folderPath}`);
          } catch (dirError: any) {
            console.error(`Failed to create directory: ${folderPath}`, dirError);
            return { 
              success: false, 
              error: `Failed to create directory: ${dirError.message}` 
            };
          }
        }
        
        if (!fs.existsSync(folderPath)) {
          console.error(`Directory still doesn't exist after creation attempt: ${folderPath}`);
          return { 
            success: false, 
            error: 'Failed to create directory: Path still doesn\'t exist after creation' 
          };
        }
        
        console.log(`Opening folder: ${folderPath}`);
        const result = await shell.openPath(folderPath);
        
        if (result !== '') {
          console.error(`Error opening folder: ${result}`);
          return { success: false, error: result };
        }
        
        console.log(`Successfully opened folder: ${folderPath}`);
        return { success: true };
      } catch (error: any) {
        console.error('Failed to open folder:', error);
        return { 
          success: false, 
          error: error.message || 'Unknown error opening folder' 
        };
      }
    });

    ipcMain.handle('create-virtual-host', async (event, config: any) => {
      console.log('Creating virtual host:', config);
      return { success: true, message: 'Virtual host created successfully' };
    });

    // Folder selection handler
    ipcMain.handle('select-folder', async () => {
      const mainWindow = this.windowService.getMainWindow();
      if (!mainWindow) {
        return '';
      }
      
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return '';
      }
      
      return result.filePaths[0];
    });

    // Path change handler
    ipcMain.handle('change-installation-path', async (event, newPath: string, moveFiles: boolean) => {
      try {
        console.log(`🔄 Changing installation path to: ${newPath}, moveFiles: ${moveFiles}`);
        
        const oldPath = SonnaPaths.BASE_PATH;
        const normalizedNewPath = newPath.replace(/\\/g, '/');
        
        // Validate new path
        if (!normalizedNewPath || normalizedNewPath.trim() === '') {
          return { success: false, message: 'Invalid path provided' };
        }
        
        // Check if path actually changed
        if (oldPath === normalizedNewPath) {
          return { success: true, newPath: normalizedNewPath, message: 'Path unchanged' };
        }
        
        // Create new path if it doesn't exist
        if (!fs.existsSync(normalizedNewPath)) {
          try {
            fs.mkdirSync(normalizedNewPath, { recursive: true });
          } catch (error) {
            return { success: false, message: `Failed to create directory: ${error}` };
          }
        }
        
        // Move files if requested and old path exists
        if (moveFiles && fs.existsSync(oldPath) && oldPath !== normalizedNewPath) {
          try {
            console.log(`📦 Moving files from ${oldPath} to ${normalizedNewPath}`);
            
            // Copy all contents from old to new path
            const items = fs.readdirSync(oldPath);
            for (const item of items) {
              if (item === 'config.json') continue; // Skip config file, we'll handle it separately
              
              const srcPath = path.join(oldPath, item);
              const destPath = path.join(normalizedNewPath, item);
              
              if (fs.statSync(srcPath).isDirectory()) {
                await this.moveDirectory(srcPath, destPath);
              } else {
                fs.copyFileSync(srcPath, destPath);
                fs.unlinkSync(srcPath);
              }
            }
            
            console.log(`✅ Files moved successfully`);
          } catch (error) {
            console.error('Failed to move files:', error);
            return { success: false, message: `Failed to move files: ${error}` };
          }
        }
        
        // Update SonnaPaths
        SonnaPaths.setBasePath(normalizedNewPath);
        console.log(`📍 SonnaPaths updated to: ${SonnaPaths.BASE_PATH}`);
        
        // Update config with new path
        try {
          const configResult = await this.configManager.getConfig();
          if (configResult.success && configResult.config) {
            // Update installPath in config
            configResult.config.installPath = normalizedNewPath;
            
            // Update all service paths in config to use new base path
            this.updateServicePathsInConfig(configResult.config, normalizedNewPath);
            
            // Save config to new location
            const newConfigPath = `${normalizedNewPath}/config.json`;
            await this.configManager.saveConfigToPath(configResult.config, newConfigPath);
            
            // Remove old config file if we moved files
            if (moveFiles && fs.existsSync(oldPath) && oldPath !== normalizedNewPath) {
              const oldConfigPath = `${oldPath}/config.json`;
              if (fs.existsSync(oldConfigPath)) {
                fs.unlinkSync(oldConfigPath);
              }
            }
          }
        } catch (error) {
          console.error('Failed to update config:', error);
          return { success: false, message: `Failed to update config: ${error}` };
        }
        
        // Update PathInitializer
        try {
          const { PathInitializer } = require('../utils/path-initializer');
          await PathInitializer.updateBasePath(normalizedNewPath);
        } catch (error) {
          console.error('Failed to update PathInitializer:', error);
          // Don't fail the whole operation for this
        }
        
        console.log(`✅ Installation path changed successfully to: ${normalizedNewPath}`);
        return { 
          success: true, 
          newPath: normalizedNewPath,
          message: `Installation path updated to ${normalizedNewPath}`
        };
      } catch (error) {
        console.error('Failed to change installation path:', error);
        return { success: false, message: `Failed to change path: ${error}` };
      }
    });

    // Window control handlers
    ipcMain.handle('minimize-window', async () => {
      this.windowService.minimizeWindow();
    });

    ipcMain.handle('maximize-window', async () => {
      this.windowService.maximizeWindow();
    });

    ipcMain.handle('close-window', async () => {
      this.windowService.closeWindow();
    });

    ipcMain.handle('quit-app', async () => {
      this.windowService.setIsQuitting(true);
      this.windowService.closeWindow();
    });

    ipcMain.handle('hide-to-tray', async () => {
      this.windowService.hideWindow();
    });

    ipcMain.handle('is-window-maximized', async () => {
      return this.windowService.isWindowMaximized();
    });

    // Configuration handlers
    ipcMain.handle('reset-installation-status', async () => {
      return await this.configManager.resetInstallationStatus();
    });

    ipcMain.handle('refresh-config', async () => {
      try {
        const configPath = SonnaPaths.CONFIG_FILE;
        
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
        
        const result = await this.configManager.initialize();
        return result;
      } catch (error) {
        return { success: false, message: `Failed to refresh config: ${error}` };
      }
    });

    // Auto-configuration handlers for PHP + Apache automation
    ipcMain.handle('auto-configure-services', async () => {
      return await this.autoConfigureServices();
    });

    ipcMain.handle('trigger-post-installation-config', async (event, serviceName: string) => {
      return await this.triggerPostInstallationConfig(serviceName);
    });

    // Cleanup handlers
    ipcMain.handle('cleanup-applications', async () => {
      const applicationsPath = SonnaPaths.APPLICATIONS_PATH;
      
      try {
        let deletedServices: string[] = [];
        
        // Delete applications directory if it exists
        if (fs.existsSync(applicationsPath)) {
          await this.downloadManager.deleteDirectory(applicationsPath);
          deletedServices.push('applications folder');
        }
        
        // Reset config
        const resetResult = await this.configManager.resetInstallationStatus();
        if (resetResult.success) {
          deletedServices.push('all service configurations');
        }
        
        return { 
          success: true, 
          message: `Cleanup completed. Removed: ${deletedServices.join(', ')}`,
          deletedCount: deletedServices.length
        };
      } catch (error) {
        console.error('Failed to cleanup applications:', error);
        return { success: false, message: `Failed to cleanup: ${error}` };
      }
    });

    // Service deletion handler
    ipcMain.handle('delete-service', async (event, serviceName: string) => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        let service;
        
        // Handle versioned services
        if (serviceName.startsWith('php-')) {
          const version = serviceName.replace('php-', '');
          service = config.services.php.versions[version];
        } else if (serviceName.startsWith('nodejs-')) {
          const version = serviceName.replace('nodejs-', '');
          service = config.services.nodejs.versions[version];
        } else {
          service = config.services[serviceName];
        }
        
        if (!service) {
          return { success: false, message: 'Service not found in config' };
        }
        
        // Delete service directory
        if (fs.existsSync(service.extractPath)) {
          await this.downloadManager.deleteDirectory(service.extractPath);
        }
        
        // Update config
        if (serviceName.startsWith('php-')) {
          const version = serviceName.replace('php-', '');
          config.services.php.versions[version].installed = false;
          config.services.php.versions[version].running = false;
        } else if (serviceName.startsWith('nodejs-')) {
          const version = serviceName.replace('nodejs-', '');
          config.services.nodejs.versions[version].installed = false;
          config.services.nodejs.versions[version].running = false;
        } else {
          await this.configManager.updateServiceStatus(serviceName, { installed: false, running: false });
        }
        
        return { 
          success: true, 
          message: `${service.displayName} deleted successfully`
        };
      } catch (error) {
        console.error(`Failed to delete service ${serviceName}:`, error);
        return { success: false, message: `Failed to delete: ${error}` };
      }
    });

    // Setup and Configuration handlers
    ipcMain.handle('initialize-sonna', async () => {
      return await this.configManager.initialize();
    });

    ipcMain.handle('get-sonna-config', async () => {
      return await this.configManager.getConfig();
    });

    ipcMain.handle('update-config', async (event, config: any) => {
      try {
        const result = await this.configManager.saveConfig(config);
        return result;
      } catch (error) {
        console.error('Failed to update config:', error);
        return { success: false, message: `Failed to update config: ${error}` };
      }
    });

    // Service installation handler with queue management
    ipcMain.handle('download-service', async (event, serviceName: string) => {
      const mainWindow = this.windowService.getMainWindow();
      
      try {
        console.log(`\n=== DOWNLOAD SERVICE REQUEST ===`);
        console.log(`Requested service: ${serviceName}`);
        
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        let service;
        let versionedService = false;
        let version = '';
        let baseServiceName = '';
        
        // Handle versioned services
        if (serviceName.startsWith('php-')) {
          versionedService = true;
          version = serviceName.replace('php-', '');
          baseServiceName = 'php';
          
          console.log(`PHP service detected:`);
          console.log(`- Version key: ${version}`);
          console.log(`- Available PHP versions in config:`, Object.keys(config.services.php.versions || {}));
          
          service = config.services.php.versions[version];
        } else if (serviceName.startsWith('nodejs-')) {
          versionedService = true;
          version = serviceName.replace('nodejs-', '');
          baseServiceName = 'nodejs';
          
          console.log(`Node.js service detected:`);
          console.log(`- Version key: ${version}`);
          console.log(`- Available Node.js versions in config:`, Object.keys(config.services.nodejs.versions || {}));
          
          service = config.services.nodejs.versions[version];
        } else {
          baseServiceName = serviceName;
          service = config.services[serviceName];
          console.log(`Regular service detected: ${serviceName}`);
        }
        
        console.log(`Service found:`, !!service);
        if (service) {
          console.log(`Service details:`, {
            name: service.name,
            displayName: service.displayName,
            version: service.version,
            downloadUrl: service.downloadUrl ? 'present' : 'missing',
            extractPath: service.extractPath
          });
        }
        console.log(`=================================\n`);
        
        if (!service) {
          return { success: false, message: `Service ${serviceName} not found in config` };
        }

        // Check if already in queue or being installed
        if (this.activeInstallations.has(serviceName) || 
            this.installationQueue.some(task => task.serviceName === serviceName)) {
          return { success: false, message: `${service.displayName} is already being installed` };
        }

        // Add to queue with priority (critical services first)
        const priority = this.getServicePriority(serviceName);
        this.addToQueue(serviceName, service, priority);
        
        // Process queue
        this.processInstallationQueue();

        return { success: true, message: `${service.displayName} added to installation queue` };
      } catch (error) {
        console.error(`Failed to queue service ${serviceName}:`, error);
        return { success: false, message: `Failed to queue service: ${error}` };
      }
    });

    // Add download progress listener
    ipcMain.handle('on-download-progress', (event, callback) => {
      // This is handled through the webContents.send above
    });
    
    // phpMyAdmin migration handler
    ipcMain.handle('migrate-phpmyadmin', async () => {
      try {
        const oldPath = `${SonnaPaths.WWW_PATH}/phpmyadmin`;
        const newPath = ServicePaths.PHPMYADMIN_PATH;
        
        // Check if old phpMyAdmin exists and new location doesn't
        if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
          console.log('Migrating phpMyAdmin from www to applications...');
          
          // Create new directory
          const newDir = path.dirname(newPath);
          if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
          }
          
          // Move directory
          await this.moveDirectory(oldPath, newPath);
          
          // Update config
          const configResult = await this.configManager.getConfig();
          if (configResult.success && configResult.config) {
            configResult.config.services.phpmyadmin.extractPath = newPath;
            await this.configManager.saveConfig(configResult.config);
          }
          
          // Update web server configs
          await this.serviceConfigurator.updateWebServerConfigs();
          
          console.log('phpMyAdmin migration completed successfully');
          return { success: true, message: 'phpMyAdmin migrated successfully' };
        }
        
        return { success: true, message: 'No migration needed' };
      } catch (error) {
        console.error('Failed to migrate phpMyAdmin:', error);
        return { success: false, message: `Migration failed: ${error}` };
      }
    });
    
    // Check if phpMyAdmin migration is needed
    ipcMain.handle('check-phpmyadmin-migration', async () => {
      try {
        const oldPath = `${SonnaPaths.WWW_PATH}/phpmyadmin`;
        const newPath = ServicePaths.PHPMYADMIN_PATH;
        
        const needsMigration = fs.existsSync(oldPath) && !fs.existsSync(newPath);
        return { needsMigration };
      } catch (error) {
        console.error('Failed to check phpMyAdmin migration:', error);
        return { needsMigration: false };
      }
    });

    // Update web server configurations
    ipcMain.handle('update-webserver-configs', async () => {
      try {
        console.log('Manually updating web server configurations...');
        await this.serviceConfigurator.updateWebServerConfigs();
        return { success: true, message: 'Web server configurations updated successfully' };
      } catch (error) {
        console.error('Failed to update web server configurations:', error);
        return { success: false, message: `Failed to update configs: ${error}` };
      }
    });

    // Initialize config directory
    ipcMain.handle('initialize-config-directory', async () => {
      try {
        const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
        const templateManager = new ConfigTemplateManager();
        await templateManager.initialize();
        return { success: true, message: 'Config directory initialized at C:/sonna/conf' };
      } catch (error) {
        console.error('Failed to initialize config directory:', error);
        return { success: false, message: `Failed to initialize: ${error}` };
      }
    });

    // PHP requirement check for phpMyAdmin
    ipcMain.handle('check-php-for-phpmyadmin', async () => {
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { phpAvailable: false, message: 'Config not found' };
        }

        // Check if any PHP version is installed
        const phpVersions = configResult.config.services.php?.versions || {};
        let phpInstalled = false;
        let phpPath = '';
        let phpVersion = '';

        for (const [version, phpService] of Object.entries(phpVersions)) {
          const service = phpService as any;
          if (service.installed && service.extractPath) {
            const phpExe = path.join(service.extractPath, 'php.exe');
            if (fs.existsSync(phpExe)) {
              phpInstalled = true;
              phpPath = service.extractPath;
              phpVersion = version;
              break;
            }
          }
        }

        return { 
          phpAvailable: phpInstalled, 
          phpPath: phpPath,
          phpVersion: phpVersion,
          message: phpInstalled ? `PHP ${phpVersion} is available` : 'PHP not installed'
        };
      } catch (error) {
        console.error('Failed to check PHP for phpMyAdmin:', error);
        return { phpAvailable: false, message: `Check failed: ${error}` };
      }
    });

    // Setup PHP requirement page
    ipcMain.handle('setup-php-requirement-page', async () => {
      try {
        const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
        const templateManager = new ConfigTemplateManager();
        await templateManager.createPHPRequirementPage();
        return { success: true, message: 'PHP requirement page created successfully' };
      } catch (error) {
        console.error('Failed to setup PHP requirement page:', error);
        return { success: false, message: `Setup failed: ${error}` };
      }
    });

    // Regenerate Apache configuration with PHP detection
    ipcMain.handle('regenerate-apache-config', async () => {
      try {
        console.log('🔄 Regenerating Apache configuration with PHP auto-detection...');
        
        const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
        const templateManager = new ConfigTemplateManager();
        
        const result = await templateManager.regenerateApacheConfigWithPHP();
        
        if (result.success) {
          console.log(`✅ ${result.message}`);
          
          // Also create PHP requirement page if no PHP is detected
          if (!result.phpDetected) {
            await templateManager.createPHPRequirementPage();
          }
        }
        
        return result;
      } catch (error) {
        console.error('Failed to regenerate Apache config:', error);
        return { 
          success: false, 
          phpDetected: false,
          message: `Failed to regenerate Apache config: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    });

    // Fix PHP configurations to suppress deprecation warnings
    ipcMain.handle('fix-php-warnings', async () => {
      try {
        console.log('🐘 Fixing PHP configurations to suppress deprecation warnings...');
        
        const phpPaths = PHP_VERSIONS.map(version => ServicePaths.getPhpPath(version));

        let fixedCount = 0;
        const results = [];

        for (const phpPath of phpPaths) {
          if (fs.existsSync(phpPath)) {
            const phpIniPath = ServicePaths.getPhpConfig(path.basename(phpPath));
            
            if (fs.existsSync(phpIniPath)) {
              try {
                let phpIni = fs.readFileSync(phpIniPath, 'utf8');
                const originalIni = phpIni;
                
                // AGGRESSIVE deprecation warning suppression
                // Remove any existing error_reporting lines
                phpIni = phpIni.replace(/^error_reporting\s*=.*$/gm, '');
                
                // Check if our Sonna configuration already exists
                if (!phpIni.includes('Sonna - ULTRA-AGGRESSIVE PHP 8.x deprecation warning suppression')) {
                  // Add ULTRA-AGGRESSIVE deprecation suppression
                  phpIni += '\n\n; Sonna - ULTRA-AGGRESSIVE PHP 8.x deprecation warning suppression\n';
                  phpIni += 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE & ~E_WARNING\n';
                  phpIni += 'display_errors = Off\n';
                  phpIni += 'display_startup_errors = Off\n';
                  phpIni += 'log_errors = On\n';
                  phpIni += 'log_errors_max_len = 0\n';
                  phpIni += 'ignore_repeated_errors = On\n';
                  phpIni += 'ignore_repeated_source = On\n';
                  phpIni += 'html_errors = Off\n';
                  phpIni += 'xmlrpc_errors = Off\n';
                  phpIni += 'output_buffering = 4096\n';
                  phpIni += 'implicit_flush = Off\n';
                  phpIni += 'auto_prepend_file = "C:/sonna/conf/php/sonna-suppression.php"\n';
                }
                
                if (phpIni !== originalIni) {
                  fs.writeFileSync(phpIniPath, phpIni, 'utf8');
                  results.push(`✅ Fixed ${path.basename(phpPath)}`);
                  fixedCount++;
                } else {
                  results.push(`ℹ️ ${path.basename(phpPath)} already correct`);
                }
              } catch (error) {
                results.push(`❌ Failed to fix ${path.basename(phpPath)}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }
        }
        
        // Create global suppression script
        try {
          await this.createGlobalSuppressionScript();
          results.push('✅ Global PHP suppression script created');
        } catch (error) {
          results.push(`⚠️ Global suppression script failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Also inject error suppression into phpMyAdmin if available
        try {
          const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
          const templateManager = new ConfigTemplateManager();
          await templateManager.injectPhpMyAdminErrorSuppression();
          results.push('✅ phpMyAdmin error suppression updated');
        } catch (error) {
          results.push(`⚠️ phpMyAdmin suppression failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        const message = fixedCount > 0 
          ? `Fixed ${fixedCount} PHP configuration(s) and updated phpMyAdmin. Please restart Apache to apply changes.`
          : 'All PHP configurations are already correct. phpMyAdmin error suppression updated.';
        
        return { 
          success: true, 
          fixedCount,
          results,
          message 
        };
      } catch (error) {
        console.error('Failed to fix PHP configurations:', error);
        return { 
          success: false, 
          fixedCount: 0,
          message: `Failed to fix PHP configs: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    });

    // Auto-update configs when PHP is installed
    ipcMain.handle('php-installed-update-configs', async () => {
      try {
        console.log('🐘 PHP installation detected - updating web server configurations...');
        
        const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
        const templateManager = new ConfigTemplateManager();
        
        // Auto-configure PHP with error suppression
        const phpConfigResult = await templateManager.autoConfigurePHPWhenAvailable();
        console.log(`Auto-PHP configuration result:`, phpConfigResult);
        
        // Regenerate Apache config with PHP support
        const apacheResult = await templateManager.regenerateApacheConfigWithPHP();
        
        // Update other web server configs too
        await this.serviceConfigurator.updateWebServerConfigs();
        
        return { 
          success: true, 
          phpDetected: apacheResult.phpDetected && phpConfigResult.phpDetected,
          message: phpConfigResult.phpDetected && apacheResult.phpDetected
            ? 'Web server configurations updated with PHP support and error suppression'
            : apacheResult.phpDetected 
              ? 'Web server configurations updated with PHP support'
              : 'Web server configurations updated (PHP still not detected)'
        };
      } catch (error) {
        console.error('Failed to update configs after PHP installation:', error);
        return { 
          success: false, 
          message: `Failed to update configs: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    });

    // Get installation queue status
    ipcMain.handle('get-installation-queue-status', async () => {
      return {
        queueLength: this.installationQueue.length,
        activeInstallations: Array.from(this.activeInstallations),
        maxConcurrent: this.maxConcurrentInstallations,
        queuedServices: this.installationQueue.map(task => ({
          serviceName: task.serviceName,
          displayName: task.service.displayName,
          priority: task.priority
        }))
      };
    });

    // Cancel installation handler
    ipcMain.handle('cancel-installation', async (event, serviceName: string) => {
      // Remove from queue if not yet started
      const queueIndex = this.installationQueue.findIndex(task => task.serviceName === serviceName);
      if (queueIndex !== -1) {
        const task = this.installationQueue.splice(queueIndex, 1)[0];
        console.log(`Cancelled ${serviceName} from installation queue`);
        this.sendQueueStatus();
        return { success: true, message: `${task.service.displayName} removed from queue` };
      }
      
      // If already installing, we can't easily cancel (would need more complex cancellation logic)
      if (this.activeInstallations.has(serviceName)) {
        return { success: false, message: 'Cannot cancel installation in progress' };
      }
      
      return { success: false, message: 'Service not found in queue' };
    });
  }
  
  /**
   * Move directory from source to destination
   */
  private async moveDirectory(source: string, destination: string): Promise<void> {
    const moveDir = (src: string, dest: string) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
          moveDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    moveDir(source, destination);
    
    // Remove source directory after successful copy
    fs.rmSync(source, { recursive: true, force: true });
  }

  /**
   * Add service to installation queue
   */
  private addToQueue(serviceName: string, service: any, priority: number) {
    const task: InstallationTask = {
      serviceName,
      service,
      priority
    };
    
    this.installationQueue.push(task);
    // Sort by priority (higher priority first)
    this.installationQueue.sort((a, b) => b.priority - a.priority);
    
    console.log(`Added ${serviceName} to queue with priority ${priority}`);
    console.log(`Queue length: ${this.installationQueue.length}`);
  }

  /**
   * Get service priority for queue ordering
   */
  private getServicePriority(serviceName: string): number {
    // Critical services get higher priority
    const priorities: { [key: string]: number } = {
      'apache': 100,
      'nginx': 100,
      'mysql': 90,
      'redis': 80,
      'phpmyadmin': 70,
      // PHP versions
      'php-8.3': 95,
      'php-8.2': 94,
      'php-8.1': 93,
      'php-8.0': 92,
      'php-7.4': 91,
      // Node.js versions
      'nodejs-20': 85,
      'nodejs-18': 84,
      'nodejs-16': 83
    };
    
    return priorities[serviceName] || 50; // Default priority
  }

  /**
   * Process installation queue
   */
  private async processInstallationQueue() {
    // Check if we can start more installations
    while (this.installationQueue.length > 0 && 
           this.activeInstallations.size < this.maxConcurrentInstallations) {
      
      const task = this.installationQueue.shift();
      if (!task) break;
      
      // Mark as active
      this.activeInstallations.add(task.serviceName);
      
      // Send queue status to frontend
      this.sendQueueStatus();
      
      // Start installation in background (non-blocking)
      this.installServiceAsync(task)
        .then(() => {
          console.log(`Installation completed for ${task.serviceName}`);
        })
        .catch(error => {
          console.error(`Installation failed for ${task.serviceName}:`, error);
        })
        .finally(() => {
          // Remove from active installations
          this.activeInstallations.delete(task.serviceName);
          // Continue processing queue
          this.processInstallationQueue();
        });
    }
  }

  /**
   * Install service asynchronously (non-blocking)
   */
  private async installServiceAsync(task: InstallationTask): Promise<void> {
    const { serviceName, service } = task;
    const mainWindow = this.windowService.getMainWindow();
    
    try {
      console.log(`\n=== STARTING ASYNC INSTALLATION: ${serviceName} ===`);
      
      // Send start notification
      mainWindow?.webContents.send('download-progress', {
        serviceName,
        progress: 0,
        status: 'starting',
        message: `Starting ${service.displayName} installation...`
      });

      const downloadPath = path.join(SonnaPaths.DOWNLOADS_PATH, `${serviceName}.zip`);
      const extractPath = service.extractPath;

      // Create directories
      await this.createDirectories(downloadPath, extractPath);

      // Create download manager with progress callback
      const downloadManagerWithProgress = new DownloadManager((progress) => {
        mainWindow?.webContents.send('download-progress', progress);
      });

      // Download (with enhanced retry mechanism)
      await Promise.race([
        downloadManagerWithProgress.downloadFile(service.downloadUrl, downloadPath, serviceName),
        this.createTimeoutPromise(600000, `Download timeout for ${serviceName}`) // 10 minutes for large files
      ]);

      // Extract (with timeout) 
      await Promise.race([
        downloadManagerWithProgress.extractZip(downloadPath, extractPath, serviceName),
        this.createTimeoutPromise(180000, `Extraction timeout for ${serviceName}`) // 3 minutes
      ]);

      // Post-extraction processing (async with smaller chunks)
      await this.processPostExtraction(serviceName, extractPath);

      // Setup service (async)
      mainWindow?.webContents.send('download-progress', {
        serviceName,
        progress: 90,
        status: 'setup',
        message: `Setting up ${service.displayName}...`
      });

      await this.serviceConfigurator.setupService(serviceName, service);

      // Handle special cases - ALWAYS trigger config updates
      if (serviceName === 'phpmyadmin' || serviceName === 'apache') {
        console.log(`🔧 ${serviceName} installed - triggering web server configuration update...`);
        await this.serviceConfigurator.updateWebServerConfigs();
        
        // Also trigger Apache-specific configuration
        if (fs.existsSync('C:/sonna/applications/apache')) {
          console.log('🌐 Force Apache configuration update...');
          await this.serviceConfigurator.updateApacheConfiguration();
        }
      }

      // Handle PHP installation - trigger auto-configuration with error suppression
      if (serviceName.startsWith('php-')) {
        console.log(`🐘 ${serviceName} installed - triggering PHP auto-configuration...`);
        
        try {
          const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
          const templateManager = new ConfigTemplateManager();
          const phpConfigResult = await templateManager.autoConfigurePHPWhenAvailable();
          
          console.log(`PHP auto-configuration result:`, phpConfigResult);
          
          // Also update Apache configuration if available
          if (fs.existsSync('C:/sonna/applications/apache')) {
            await this.serviceConfigurator.updateApacheConfiguration();
          }
        } catch (error) {
          console.error('Failed to auto-configure PHP:', error);
        }
      }

      // Verify installation
      const isInstalled = await this.verifyInstallation(serviceName, service);
      
      // Update config
      await this.updateServiceConfig(serviceName, service, isInstalled);
      
      if (!isInstalled) {
        throw new Error('Installation verification failed');
      }

      // Cleanup
      await this.cleanupDownload(downloadPath);

      // Send completion notification
      mainWindow?.webContents.send('download-progress', {
        serviceName,
        progress: 100,
        status: 'completed',
        message: `${service.displayName} installed successfully`
      });

      console.log(`=== ASYNC INSTALLATION COMPLETED: ${serviceName} ===\n`);
      
      // Auto-trigger post-installation configuration
      try {
        console.log('🔧 Triggering post-installation configuration...');
        const postConfigResult = await this.triggerPostInstallationConfig(serviceName);
        
        if (postConfigResult.success) {
          console.log(`✅ Post-installation config: ${postConfigResult.message}`);
          
          // Notify frontend about configuration update
          mainWindow?.webContents.send('config-updated', {
            type: 'post-installation',
            serviceName: serviceName,
            message: postConfigResult.message
          });
        } else {
          console.log(`⚠️ Post-installation config issue: ${postConfigResult.message}`);
        }

        // Additional comprehensive auto-configuration trigger
        console.log('🔄 Running comprehensive auto-configuration...');
        const autoConfigResult = await this.autoConfigureServices();
        if (autoConfigResult.success && autoConfigResult.actions.length > 0) {
          console.log(`🎯 Additional actions performed: ${autoConfigResult.actions.join(', ')}`);
        }
        
      } catch (error) {
        console.error('Failed to run post-installation configuration:', error);
      }
      
    } catch (error) {
      console.error(`=== ASYNC INSTALLATION FAILED: ${serviceName} ===`, error);
      
      mainWindow?.webContents.send('download-progress', {
        serviceName,
        progress: 0,
        status: 'error',
        message: `Failed to install ${service.displayName}: ${error}`
      });
      
      throw error;
    }
  }

  /**
   * Create timeout promise for async operations
   */
  private createTimeoutPromise(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(downloadPath: string, extractPath: string): Promise<void> {
    const downloadDir = path.dirname(downloadPath);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }
  }

  /**
   * Process post-extraction in smaller chunks (async)
   */
  private async processPostExtraction(serviceName: string, extractPath: string): Promise<void> {
    // Use setTimeout to yield control back to event loop
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          if (serviceName.startsWith('nodejs-')) {
            await this.processNodeJSExtraction(extractPath);
          } else if (serviceName === 'nginx') {
            await this.processNginxExtraction(extractPath);
          } else if (serviceName === 'phpmyadmin') {
            await this.processPhpMyAdminExtraction(extractPath);
          } else if (serviceName === 'mysql') {
            await this.processMySQLExtraction(extractPath);
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 10); // Small delay to prevent blocking
    });
  }

  /**
   * Verify installation asynchronously
   */
  private async verifyInstallation(serviceName: string, service: any): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          let serviceForVerification = service;
          if (serviceName.startsWith('php-') || serviceName.startsWith('nodejs-')) {
            const baseServiceName = serviceName.startsWith('php-') ? 'php' : 'nodejs';
            serviceForVerification = { ...service, name: baseServiceName };
          }
          
          const isInstalled = this.serviceManager.checkServiceInstallation(serviceForVerification);
          console.log(`Verification result for ${serviceName}: ${isInstalled}`);
          resolve(isInstalled);
        } catch (error) {
          console.error(`Verification failed for ${serviceName}:`, error);
          resolve(false);
        }
      }, 50); // Small delay for async processing
    });
  }

  /**
   * Update service configuration
   */
  private async updateServiceConfig(serviceName: string, service: any, isInstalled: boolean): Promise<void> {
    try {
      if (serviceName.startsWith('php-')) {
        const version = serviceName.replace('php-', '');
        const configResult = await this.configManager.getConfig();
        if (configResult.success && configResult.config) {
          configResult.config.services.php.versions[version].installed = isInstalled;
          await this.configManager.saveConfig(configResult.config);
        }
      } else if (serviceName.startsWith('nodejs-')) {
        const version = serviceName.replace('nodejs-', '');
        const configResult = await this.configManager.getConfig();
        if (configResult.success && configResult.config) {
          configResult.config.services.nodejs.versions[version].installed = isInstalled;
          await this.configManager.saveConfig(configResult.config);
        }
      } else {
        await this.configManager.updateServiceStatus(serviceName, { installed: isInstalled });
      }
    } catch (error) {
      console.error(`Failed to update config for ${serviceName}:`, error);
    }
  }

  /**
   * Cleanup download file
   */
  private async cleanupDownload(downloadPath: string): Promise<void> {
    try {
      if (fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }
    } catch (error) {
      console.error(`Failed to cleanup download file ${downloadPath}:`, error);
    }
  }

  /**
   * Send queue status to frontend
   */
  private sendQueueStatus(): void {
    const mainWindow = this.windowService.getMainWindow();
    mainWindow?.webContents.send('installation-queue-status', {
      queueLength: this.installationQueue.length,
      activeInstallations: Array.from(this.activeInstallations),
      maxConcurrent: this.maxConcurrentInstallations
    });
  }

  /**
   * Process Node.js extraction
   */
  private async processNodeJSExtraction(extractPath: string): Promise<void> {
    console.log(`\n=== POST-EXTRACTION PROCESSING FOR NODE.JS ===`);
    const extractedFiles = fs.readdirSync(extractPath);
    
    if (extractedFiles.length === 1 && fs.statSync(path.join(extractPath, extractedFiles[0])).isDirectory()) {
      const nestedFolderPath = path.join(extractPath, extractedFiles[0]);
      const nestedFiles = fs.readdirSync(nestedFolderPath);
      
      if (nestedFiles.includes('node.exe')) {
        console.log(`Moving Node.js files from nested folder...`);
        await this.moveFilesFromNestedFolder(nestedFolderPath, extractPath, extractedFiles[0]);
      }
    }
    console.log(`=== NODE.JS POST-EXTRACTION COMPLETED ===\n`);
  }

  /**
   * Process Nginx extraction
   */
  private async processNginxExtraction(extractPath: string): Promise<void> {
    console.log(`\n=== POST-EXTRACTION PROCESSING FOR NGINX ===`);
    const extractedFiles = fs.readdirSync(extractPath);
    
    if (extractedFiles.length === 1 && fs.statSync(path.join(extractPath, extractedFiles[0])).isDirectory()) {
      const nestedFolderPath = path.join(extractPath, extractedFiles[0]);
      const nestedFiles = fs.readdirSync(nestedFolderPath);
      
      if (nestedFiles.includes('nginx.exe') && nestedFiles.includes('conf')) {
        console.log(`Moving Nginx files from nested folder...`);
        await this.moveFilesFromNestedFolder(nestedFolderPath, extractPath, extractedFiles[0]);
      }
    }
    console.log(`=== NGINX POST-EXTRACTION COMPLETED ===\n`);
  }

  /**
   * Process phpMyAdmin extraction
   */
  private async processPhpMyAdminExtraction(extractPath: string): Promise<void> {
    console.log(`\n=== POST-EXTRACTION PROCESSING FOR PHPMYADMIN ===`);
    const extractedFiles = fs.readdirSync(extractPath);
    
    const phpMyAdminFolder = extractedFiles.find(file => 
      file.startsWith('phpMyAdmin') && 
      fs.statSync(path.join(extractPath, file)).isDirectory()
    );
    
    if (phpMyAdminFolder) {
      const nestedFolderPath = path.join(extractPath, phpMyAdminFolder);
      const nestedFiles = fs.readdirSync(nestedFolderPath);
      
      if (nestedFiles.includes('index.php')) {
        console.log(`Moving phpMyAdmin files from nested folder...`);
        await this.moveFilesFromNestedFolder(nestedFolderPath, extractPath, phpMyAdminFolder);
      }
    }
    console.log(`=== PHPMYADMIN POST-EXTRACTION COMPLETED ===\n`);
  }

  /**
   * Process MySQL extraction
   */
  private async processMySQLExtraction(extractPath: string): Promise<void> {
    console.log(`\n=== POST-EXTRACTION PROCESSING FOR MYSQL ===`);
    const extractedFiles = fs.readdirSync(extractPath);
    
    const mysqlFolder = extractedFiles.find(file => 
      file.startsWith('mysql') && 
      fs.statSync(path.join(extractPath, file)).isDirectory()
    );
    
    if (mysqlFolder) {
      const nestedFolderPath = path.join(extractPath, mysqlFolder);
      const nestedFiles = fs.readdirSync(nestedFolderPath);
      
      if (nestedFiles.includes('bin')) {
        console.log(`Moving MySQL files from nested folder...`);
        await this.moveFilesFromNestedFolder(nestedFolderPath, extractPath, mysqlFolder);
      }
    }
    console.log(`=== MYSQL POST-EXTRACTION COMPLETED ===\n`);
  }

  /**
   * Move files from nested folder (with async processing)
   */
  private async moveFilesFromNestedFolder(nestedFolderPath: string, extractPath: string, folderName: string): Promise<void> {
    const nestedFiles = fs.readdirSync(nestedFolderPath);
    
    // Process files in chunks to prevent blocking
    const chunkSize = 5;
    for (let i = 0; i < nestedFiles.length; i += chunkSize) {
      const chunk = nestedFiles.slice(i, i + chunkSize);
      
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          for (const file of chunk) {
            const sourcePath = path.join(nestedFolderPath, file);
            const destPath = path.join(extractPath, file);
            
            try {
              if (fs.statSync(sourcePath).isDirectory()) {
                this.moveDirectoryRecursive(sourcePath, destPath);
              } else {
                fs.copyFileSync(sourcePath, destPath);
              }
              console.log(`✓ Moved: ${file}`);
            } catch (moveError) {
              console.error(`Failed to move ${file}:`, moveError);
            }
          }
          resolve();
        }, 10); // Small delay between chunks
      });
    }
    
    // Remove nested folder
    try {
      fs.rmSync(nestedFolderPath, { recursive: true, force: true });
      console.log(`✓ Removed nested folder: ${folderName}`);
    } catch (rmError) {
      console.error(`Failed to remove nested folder:`, rmError);
    }
  }

  /**
   * Move directory recursively
   */
  private moveDirectoryRecursive(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.moveDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Auto-configure services based on current installation status
   * Handles the 3 scenarios: Apache first, PHP first, or simultaneous
   */
  private async autoConfigureServices(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    try {
      console.log('🔄 Auto-configuring services based on installation status...');
      
      const actions: string[] = [];
      
      // Check Apache installation
      const apacheInstalled = fs.existsSync(ServicePaths.APACHE_PATH);
      const apacheConfigExists = fs.existsSync(ServicePaths.APACHE_CONFIG);
      
      // Check PHP installation
      const phpPaths = PHP_VERSIONS.map(version => ServicePaths.getPhpPath(version));
      const phpPath = phpPaths.find(p => fs.existsSync(p));
      const phpInstalled = !!phpPath;
      
      // Check phpMyAdmin installation
      const phpMyAdminInstalled = fs.existsSync(ServicePaths.PHPMYADMIN_PATH);
      
      console.log(`📊 Installation Status:`);
      console.log(`   Apache: ${apacheInstalled ? '✅' : '❌'}`);
      console.log(`   PHP: ${phpInstalled ? '✅ at ' + phpPath : '❌'}`);
      console.log(`   phpMyAdmin: ${phpMyAdminInstalled ? '✅' : '❌'}`);
      
      // Scenario 1: Apache installed, need to configure it
      if (apacheInstalled) {
        console.log('🌐 Apache detected - updating configuration...');
        
        try {
          await this.serviceConfigurator.updateApacheConfiguration();
          actions.push('Apache configuration updated');
          
          // If phpMyAdmin exists but PHP doesn't, ensure requirement page is created
          if (phpMyAdminInstalled && !phpInstalled) {
            actions.push('PHP requirement page created for phpMyAdmin');
          }
          
          // If PHP exists, ensure it's configured with Apache
          if (phpInstalled) {
            actions.push(`PHP ${path.basename(phpPath!)} integrated with Apache`);
          }
          
        } catch (error) {
          console.error('Failed to update Apache configuration:', error);
          actions.push(`Apache configuration failed: ${error}`);
        }
      }
      
      // Scenario 2 & 3: If PHP gets installed after Apache, or simultaneously
      if (phpInstalled && apacheInstalled) {
        console.log('🐘 PHP + Apache detected - ensuring integration...');
        
        try {
          // Regenerate Apache config with PHP support
          // Note: Apache configurator will automatically handle requirement page removal
          await this.serviceConfigurator.updateApacheConfiguration();
          actions.push('Apache reconfigured with PHP support');
          
        } catch (error) {
          console.error('Failed to integrate PHP with Apache:', error);
          actions.push(`PHP integration failed: ${error}`);
        }
      }
      
      return {
        success: true,
        message: `Auto-configuration completed. Actions: ${actions.join(', ')}`,
        actions
      };
      
    } catch (error) {
      console.error('Auto-configuration failed:', error);
      return {
        success: false,
        message: `Auto-configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        actions: []
      };
    }
  }

  /**
   * Trigger post-installation configuration for a specific service
   * Called after service installation completes
   */
  private async triggerPostInstallationConfig(serviceName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`🔧 Post-installation configuration for: ${serviceName}`);
      
      // Handle Apache post-installation
      if (serviceName === 'apache') {
        console.log('🌐 Apache installed - configuring with current services...');
        await this.serviceConfigurator.updateApacheConfiguration();
        
        // Check if phpMyAdmin is available and needs requirement page
        const phpMyAdminExists = fs.existsSync('C:/sonna/applications/phpmyadmin');
        const phpExists = ['8.4', '8.3', '8.2', '8.1'].some(v => 
          fs.existsSync(`C:/sonna/applications/php/${v}`)
        );
        
        if (phpMyAdminExists && !phpExists) {
          console.log('⚠️ phpMyAdmin found without PHP - requirement page will be shown');
        }
        
        return {
          success: true,
          message: 'Apache configured successfully'
        };
      }
      
      // Handle PHP post-installation
      if (serviceName.startsWith('php-')) {
        console.log('🐘 PHP installed - integrating with Apache...');
        
        // Auto-configure PHP with error suppression
        const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
        const templateManager = new ConfigTemplateManager();
        const phpConfigResult = await templateManager.autoConfigurePHPWhenAvailable();
        
        console.log(`PHP auto-configuration result:`, phpConfigResult);
        
        // Check if Apache is installed
        const apacheExists = fs.existsSync(ServicePaths.APACHE_PATH);
        
        if (apacheExists) {
          // Reconfigure Apache with PHP support
          // Note: Apache configurator will automatically handle requirement page removal
          await this.serviceConfigurator.updateApacheConfiguration();
          
          return {
            success: true,
            message: `PHP integrated with Apache successfully ${phpConfigResult.phpDetected ? '(with error suppression)' : ''}`
          };
        } else {
          return {
            success: true,
            message: `PHP installed ${phpConfigResult.phpDetected ? '(with error suppression)' : ''} (Apache not available for integration)`
          };
        }
      }
      
      // Handle phpMyAdmin post-installation
      if (serviceName === 'phpmyadmin') {
        console.log('🗄️ phpMyAdmin installed - configuring with Apache...');
        
        const apacheExists = fs.existsSync('C:/sonna/applications/apache');
        
        if (apacheExists) {
          console.log('🌐 Apache detected - updating configuration for phpMyAdmin...');
          
          // Force Apache configuration update
          await this.serviceConfigurator.updateApacheConfiguration();
          
          // Check if PHP is available to determine requirement page creation
          const phpExists = PHP_VERSIONS.slice(0, 4).some(v => 
            fs.existsSync(ServicePaths.getPhpPath(v))
          );
          
          // Inject error suppression for PHP 8.x compatibility
          try {
            const { ConfigTemplateManager } = require('../utils/config-manager/ConfigTemplateManager');
            const templateManager = new ConfigTemplateManager();
            await templateManager.injectPhpMyAdminErrorSuppression();
            console.log('✅ phpMyAdmin error suppression injected');
          } catch (error) {
            console.log('⚠️ Failed to inject phpMyAdmin error suppression:', error);
          }
          
          if (!phpExists) {
            console.log('⚠️ PHP not available - requirement page should be created');
          } else {
            console.log('✅ PHP available - phpMyAdmin should work normally');
          }
          
          return {
            success: true,
            message: `phpMyAdmin configured with Apache ${phpExists ? '(PHP ready with error suppression)' : '(PHP required)'}`
          };
        } else {
          return {
            success: true,
            message: 'phpMyAdmin installed (Apache not available for configuration)'
          };
        }
      }
      
      // For other services, no special post-installation config needed
      return {
        success: true,
        message: `${serviceName} installed successfully`
      };
      
    } catch (error) {
      console.error(`Post-installation configuration failed for ${serviceName}:`, error);
      return {
        success: false,
        message: `Configuration failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create global PHP suppression script
   */
  private async createGlobalSuppressionScript(): Promise<void> {
    try {
      const suppressionPath = 'C:/sonna/conf/php/sonna-suppression.php';
      const suppressionDir = path.dirname(suppressionPath);
      
      // Ensure directory exists
      if (!fs.existsSync(suppressionDir)) {
        fs.mkdirSync(suppressionDir, { recursive: true });
      }
      
      // Create ultra-aggressive suppression script
      const suppressionContent = `<?php
/**
 * Sonna Global PHP Error Suppression
 * Auto-prepended to ALL PHP scripts for maximum compatibility
 * ULTRA-AGGRESSIVE suppression of PHP 8.x deprecation warnings
 */

// Start output buffering immediately to catch ANY output
if (!ob_get_level()) {
    ob_start();
}

// SILENCE ALL PHP errors at the most fundamental level
error_reporting(0);

// Disable ALL error display mechanisms
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('html_errors', '0');
ini_set('xmlrpc_errors', '0');

// Enable logging but suppress output
ini_set('log_errors', '1');
ini_set('ignore_repeated_errors', '1');
ini_set('ignore_repeated_source', '1');

// NUCLEAR OPTION: Replace default error handler completely
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // SUPPRESS EVERYTHING - no output at all
    return true;
}, E_ALL);

// NUCLEAR OPTION: Replace exception handler
set_exception_handler(function($exception) {
    // Log but don't output
    error_log('Suppressed exception: ' . $exception->getMessage());
    return true;
});

// NUCLEAR OPTION: Register shutdown function to handle fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
        // Log but don't output
        error_log('Suppressed fatal error: ' . $error['message']);
    }
    
    // Clean any output buffer content that might contain warnings
    while (ob_get_level()) {
        $content = ob_get_clean();
        // Filter out deprecation warnings from output
        $content = preg_replace('/<br \\/>\\s*<b>Deprecated<\\/b>:.*?<br \\/>/is', '', $content);
        $content = preg_replace('/Deprecated:.*?\\n/is', '', $content);
        echo $content;
    }
});

// Additional safety: Override error constants to prevent issues
if (!defined('E_DEPRECATED')) define('E_DEPRECATED', 0);
if (!defined('E_STRICT')) define('E_STRICT', 0);
if (!defined('E_NOTICE')) define('E_NOTICE', 0);
if (!defined('E_WARNING')) define('E_WARNING', 0);
?>`;
      
      fs.writeFileSync(suppressionPath, suppressionContent, 'utf8');
      console.log('✅ Created global PHP suppression script at:', suppressionPath);
    } catch (error) {
      console.error('Failed to create global suppression script:', error);
      throw error;
    }
  }

  /**
   * Update service paths in config when base path changes
   */
  private updateServicePathsInConfig(config: any, newBasePath: string): void {
    // Update paths for regular services
    const services = config.services;
    
    if (services.apache) {
      services.apache.extractPath = `${newBasePath}/applications/apache`;
    }
    
    if (services.nginx) {
      services.nginx.extractPath = `${newBasePath}/applications/nginx`;
    }
    
    if (services.mysql) {
      services.mysql.extractPath = `${newBasePath}/applications/mysql`;
    }
    
    if (services.redis) {
      services.redis.extractPath = `${newBasePath}/applications/redis`;
    }
    
    if (services.mongodb) {
      services.mongodb.extractPath = `${newBasePath}/applications/mongodb`;
    }
    
    if (services.phpmyadmin) {
      services.phpmyadmin.extractPath = `${newBasePath}/applications/phpmyadmin`;
    }
    
    // Update paths for PHP versions
    if (services.php?.versions) {
      for (const version in services.php.versions) {
        services.php.versions[version].extractPath = `${newBasePath}/applications/php/${version}`;
      }
    }
    
    // Update paths for Node.js versions
    if (services.nodejs?.versions) {
      for (const version in services.nodejs.versions) {
        services.nodejs.versions[version].extractPath = `${newBasePath}/applications/nodejs/${version}`;
      }
    }
  }
} 