import { ipcMain } from 'electron';
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

    // Project handlers
    ipcMain.handle('get-projects', async () => {
      return [];
    });

    ipcMain.handle('create-virtual-host', async (event, config: any) => {
      console.log('Creating virtual host:', config);
      return { success: true, message: 'Virtual host created successfully' };
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
        
        const service = configResult.config.services[serviceName];
        
        if (!service) {
          return { success: false, message: 'Service not found in config' };
        }
        
        // Delete service directory
        if (fs.existsSync(service.extractPath)) {
          await this.downloadManager.deleteDirectory(service.extractPath);
        }
        
        // Update config
        await this.configManager.updateServiceStatus(serviceName, { installed: false, running: false });
        
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

    // Service installation handler
    ipcMain.handle('download-service', async (event, serviceName: string) => {
      const mainWindow = this.windowService.getMainWindow();
      
      try {
        const configResult = await this.configManager.getConfig();
        if (!configResult.success || !configResult.config) {
          return { success: false, message: 'Config file not found' };
        }
        
        const service = configResult.config.services[serviceName];
        
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
        await this.configManager.updateServiceStatus(serviceName, { installed: isInstalled });
        
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