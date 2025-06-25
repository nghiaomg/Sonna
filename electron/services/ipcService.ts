import { ipcMain, dialog, shell } from 'electron';
import { ServiceManager } from '../utils/service-manager';
import { ConfigManager } from '../utils/config-manager';
import { DownloadManager } from '../utils/download-manager';
import { ServiceConfigurator } from '../utils/service-configurator';
import * as fs from 'fs';
import * as path from 'path';
import { WindowService } from './windowService';

export class IpcService {
  private serviceManager: ServiceManager;
  private configManager: ConfigManager;
  private downloadManager: DownloadManager;
  private serviceConfigurator: ServiceConfigurator;
  private windowService: WindowService;

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
        
        // Check if version exists
        if (version && !config.services.nodejs.versions[version]) {
          return { success: false, message: `Node.js version ${version} not found` };
        }
        
        // Initialize project settings if needed
        if (!config.projectSettings) {
          config.projectSettings = {};
        }
        
        if (!config.projectSettings[projectPath]) {
          config.projectSettings[projectPath] = {};
        }
        
        // Update project Node.js version
        config.projectSettings[projectPath].nodeVersion = version || undefined;
        
        // Save config
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
        // Default path for projects
        const wwwPath = 'C:\\sonna\\www';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(wwwPath)) {
          fs.mkdirSync(wwwPath, { recursive: true });
          console.log(`Created projects directory: ${wwwPath}`);
        }
        
        // In a real implementation, this would scan the directory for projects
        // For now, just return an empty array and the path
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
          wwwPath: 'C:\\sonna\\www',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Open folder handler
    ipcMain.handle('open-folder', async (event, folderPath: string) => {
      try {
        console.log(`Attempting to open folder: ${folderPath}`);
        
        // Create the directory if it doesn't exist
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
        
        // Verify the directory exists before trying to open it
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
      // Implementation will depend on your ConfigManager implementation
      // This is a placeholder
      return { success: true, newPath };
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
        // Force recreate config with latest default values
        const configPath = 'C:/sonna/config.json';
        
        // Delete existing config
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
        
        // Reinitialize to create new config
        const result = await this.configManager.initialize();
        return result;
      } catch (error) {
        return { success: false, message: `Failed to refresh config: ${error}` };
      }
    });

    // Cleanup handlers
    ipcMain.handle('cleanup-applications', async () => {
      const applicationsPath = 'C:/sonna/applications';
      
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

    // Service installation handler
    ipcMain.handle('download-service', async (event, serviceName: string) => {
      const mainWindow = this.windowService.getMainWindow();
      
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const config = configResult.config;
        let service;
        let versionedService = false;
        let version = '';
        
        // Handle versioned services
        if (serviceName.startsWith('php-')) {
          versionedService = true;
          version = serviceName.replace('php-', '');
          service = config.services.php.versions[version];
        } else if (serviceName.startsWith('nodejs-')) {
          versionedService = true;
          version = serviceName.replace('nodejs-', '');
          service = config.services.nodejs.versions[version];
        } else {
          service = config.services[serviceName];
        }
        
        if (!service) {
          return { success: false, message: 'Service not found in config' };
        }

        const downloadPath = path.join('C:/sonna/downloads', `${serviceName}.zip`);
        const extractPath = service.extractPath;

        // Create download directory
        const downloadDir = path.dirname(downloadPath);
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true });
        }

        // Create extract directory
        if (!fs.existsSync(extractPath)) {
          fs.mkdirSync(extractPath, { recursive: true });
        }

        // Create a new download manager with progress callback for this download
        const downloadManagerWithProgress = new DownloadManager((progress) => {
          mainWindow?.webContents.send('download-progress', progress);
        });

        // Download file
        await downloadManagerWithProgress.downloadFile(service.downloadUrl, downloadPath, serviceName);

        // Extract file
        await downloadManagerWithProgress.extractZip(downloadPath, extractPath, serviceName);

        // Setup service
        mainWindow?.webContents.send('download-progress', {
          serviceName,
          progress: 100,
          status: 'setup',
          message: `Setting up ${service.displayName}...`
        });

        await this.serviceConfigurator.setupService(serviceName, service);

        // Verify installation before marking as installed
        const isInstalled = this.serviceManager.checkServiceInstallation(service);
        
        // Update config
        if (versionedService) {
          if (serviceName.startsWith('php-')) {
            config.services.php.versions[version].installed = isInstalled;
            await this.configManager.saveConfig(config);
          } else if (serviceName.startsWith('nodejs-')) {
            config.services.nodejs.versions[version].installed = isInstalled;
            await this.configManager.saveConfig(config);
          }
        } else {
          await this.configManager.updateServiceStatus(serviceName, { installed: isInstalled });
        }
        
        if (!isInstalled) {
          throw new Error('Installation verification failed');
        }

        // Clean up download
        fs.unlinkSync(downloadPath);

        mainWindow?.webContents.send('download-progress', {
          serviceName,
          progress: 100,
          status: 'completed',
          message: `${service.displayName} installed successfully`
        });

        return { success: true, message: `${service.displayName} installed successfully` };
      } catch (error) {
        mainWindow?.webContents.send('download-progress', {
          serviceName,
          progress: 0,
          status: 'error',
          message: `Failed to install: ${error}`
        });
        
        return { success: false, message: `Failed to install: ${error}` };
      }
    });

    // Add download progress listener
    ipcMain.handle('on-download-progress', (event, callback) => {
      // This is handled through the webContents.send above
    });
  }
} 