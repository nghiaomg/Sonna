import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { 
  ServiceManager, 
  DownloadManager, 
  ServiceConfigurator, 
  ConfigManager 
} from './utils';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow;

// Initialize utility managers
const serviceManager = new ServiceManager();
const configManager = new ConfigManager();
const serviceConfigurator = new ServiceConfigurator();
const downloadManager = new DownloadManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/logo.ico'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Dev tools disabled
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Cleanup services before quitting
  await serviceManager.cleanup();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-services-status', async () => {
  return await serviceManager.getServicesStatus();
});



ipcMain.handle('start-service', async (event, serviceName: string) => {
  return await serviceManager.startService(serviceName);
});

ipcMain.handle('stop-service', async (event, serviceName: string) => {
  return await serviceManager.stopService(serviceName);
});

ipcMain.handle('get-projects', async () => {
  return [];
});

ipcMain.handle('create-virtual-host', async (event, config: any) => {
  console.log('Creating virtual host:', config);
  return { success: true, message: 'Virtual host created successfully' };
});
    
ipcMain.handle('minimize-window', async () => {
  mainWindow?.minimize();
});

ipcMain.handle('maximize-window', async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('close-window', async () => {
  mainWindow?.close();
});

ipcMain.handle('is-window-maximized', async () => {
  return mainWindow?.isMaximized() || false;
});

// Reset installation status for testing
ipcMain.handle('reset-installation-status', async () => {
  return await configManager.resetInstallationStatus();
});

ipcMain.handle('refresh-config', async () => {
  try {
    // Force recreate config with latest default values
    const fs = require('fs');
    const configPath = 'C:/sonna/config.json';
    
    // Delete existing config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Reinitialize to create new config
    const result = await configManager.initialize();
    return result;
  } catch (error) {
    return { success: false, message: `Failed to refresh config: ${error}` };
  }
});

// Clean up applications
ipcMain.handle('cleanup-applications', async () => {
  const applicationsPath = 'C:/sonna/applications';
  
  try {
    let deletedServices: string[] = [];
    
    // Delete applications directory if it exists
    if (fs.existsSync(applicationsPath)) {
      await downloadManager.deleteDirectory(applicationsPath);
      deletedServices.push('applications folder');
    }
    
    // Reset config
    const resetResult = await configManager.resetInstallationStatus();
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

// Delete specific service
ipcMain.handle('delete-service', async (event, serviceName: string) => {
  try {
    const configResult = await configManager.getConfig();
    if (!configResult.success || !configResult.config) {
      return { success: false, message: 'Config file not found' };
    }
    
    const service = configResult.config.services[serviceName];
    
    if (!service) {
      return { success: false, message: 'Service not found in config' };
    }
    
    // Delete service directory
    if (fs.existsSync(service.extractPath)) {
      await downloadManager.deleteDirectory(service.extractPath);
    }
    
    // Update config
    await configManager.updateServiceStatus(serviceName, { installed: false, running: false });
    
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
  return await configManager.initialize();
});

ipcMain.handle('get-sonna-config', async () => {
  return await configManager.getConfig();
});

ipcMain.handle('download-service', async (event, serviceName: string) => {
  try {
    const configResult = await configManager.getConfig();
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

    await serviceConfigurator.setupService(serviceName, service);

    // Verify installation before marking as installed
    const isInstalled = serviceManager.checkServiceInstallation(service);
    
    // Update config
    await configManager.updateServiceStatus(serviceName, { installed: isInstalled });
    
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

 