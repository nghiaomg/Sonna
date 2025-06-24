import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { ServiceManager } from './utils/service-manager';
import { DownloadManager } from './utils/download-manager';
import { ServiceConfigurator } from './utils/service-configurator';
import { ConfigManager } from './utils/config-manager';

const isDev = process.env.NODE_ENV === 'development';
let mainWindow: BrowserWindow;
let tray: Tray | null = null;
let isQuitting = false;

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Continue with your app initialization
  // ... existing code ...
}

function getIconPath() {
  if (isDev) {
    // In development, try multiple paths
    const devPaths = [
      path.join(__dirname, '../public/logo.ico'),
      path.join(__dirname, '../build/icons/icon.ico'),
      path.join(process.cwd(), 'public/logo.ico'),
      path.join(process.cwd(), 'build/icons/icon.ico')
    ];
    
    for (const iconPath of devPaths) {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    }
  } else {
    // In production, try multiple paths with priority
    const appPath = app.getAppPath();
    const appDir = path.dirname(appPath);
    
    const prodPaths = [
      // Extra resources directory (highest priority)
      path.join(process.resourcesPath, 'icons/icon.ico'),
      
      // Public directory in resources
      path.join(process.resourcesPath, 'public/logo.ico'),
      
      // App root (where we copied files)
      path.join(appDir, 'logo.ico'),
      
      // Resources directory
      path.join(process.resourcesPath, 'logo.ico'),
      
      // Other possible locations
      path.join(__dirname, '../logo.ico'),
      path.join(__dirname, '../dist/logo.ico'),
      path.join(__dirname, '../build/icons/icon.ico'),
      path.join(__dirname, '../public/logo.ico')
    ];
    
    for (const iconPath of prodPaths) {
      if (fs.existsSync(iconPath)) {
        console.log('Found icon at:', iconPath);
        return iconPath;
      }
    }
  }
  
  // Fallback - return default path
  return path.join(__dirname, '../build/icons/icon.ico');
}

// Initialize utility managers
const serviceManager = new ServiceManager();
const configManager = new ConfigManager();
const serviceConfigurator = new ServiceConfigurator();
const downloadManager = new DownloadManager();

function createTray() {
  // Create tray icon
  const iconPath = getIconPath();
  console.log('Using icon path for tray:', iconPath);
  
  // Create native image with proper scaling
  let trayIcon = nativeImage.createFromPath(iconPath);
  
  // Ensure icon is visible by setting proper size
  if (process.platform === 'win32') {
    // Windows requires specific sizes for tray icons
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }
  
  tray = new Tray(trayIcon);
  
  // Update tray context menu with service status
  updateTrayMenu();
  
  tray.setToolTip('Sonna - Local Development Environment');
  
  // Double click to show/hide window
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

async function updateTrayMenu() {
  if (!tray) return;
  
  try {
    // Get current service status
    const servicesStatus = await serviceManager.getServicesStatus();
    
    const serviceMenuItems = Object.entries(servicesStatus).map(([serviceName, status]) => {
      const isInstalled = status.installed;
      const isRunning = status.running;
      
      if (!isInstalled) {
        return {
          label: `${serviceName} (Chưa cài đặt)`,
          enabled: false
        };
      }
      
      return {
        label: `${serviceName} (${isRunning ? 'Đang chạy' : 'Dừng'})`,
        click: async () => {
          try {
            if (isRunning) {
              await serviceManager.stopService(serviceName);
            } else {
              await serviceManager.startService(serviceName);
            }
            // Update menu after service state change
            setTimeout(updateTrayMenu, 1000);
          } catch (error) {
            console.error(`Failed to toggle ${serviceName}:`, error);
          }
        }
      };
    });
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Sonna - Local Dev Environment',
        enabled: false
      },
      { type: 'separator' },
      ...serviceMenuItems,
      { type: 'separator' },
      {
        label: 'Mở Sonna',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Khởi động tất cả dịch vụ',
        click: async () => {
          try {
            const servicesStatus = await serviceManager.getServicesStatus();
            for (const [serviceName, status] of Object.entries(servicesStatus)) {
              if (status.installed && !status.running) {
                await serviceManager.startService(serviceName);
              }
            }
            setTimeout(updateTrayMenu, 2000);
          } catch (error) {
            console.error('Failed to start all services:', error);
          }
        }
      },
      {
        label: 'Dừng tất cả dịch vụ',
        click: async () => {
          try {
            await serviceManager.cleanup();
            setTimeout(updateTrayMenu, 1000);
          } catch (error) {
            console.error('Failed to stop all services:', error);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Thoát',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Failed to update tray menu:', error);
    
    // Fallback simple menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Sonna - Local Dev Environment',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Mở Sonna',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Thoát',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
}

function copyAssetsToAppRoot() {
  try {
    // In production, copy logo files to app root for easy access
    if (!isDev) {
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);
      
      // Source paths
      const logoSrcPath = path.join(__dirname, '../dist/logo.png');
      const iconSrcPath = path.join(__dirname, '../dist/logo.ico');
      
      // Destination paths (app root)
      const logoDestPath = path.join(appDir, 'logo.png');
      const iconDestPath = path.join(appDir, 'logo.ico');
      
      // Copy files if they exist
      if (fs.existsSync(logoSrcPath)) {
        fs.copyFileSync(logoSrcPath, logoDestPath);
        console.log('Copied logo.png to app root');
      }
      
      if (fs.existsSync(iconSrcPath)) {
        fs.copyFileSync(iconSrcPath, iconDestPath);
        console.log('Copied logo.ico to app root');
      }
    }
  } catch (error) {
    console.error('Failed to copy assets to app root:', error);
  }
}

function createWindow() {
  // Get icon path before creating window
  const iconPath = getIconPath();
  console.log('Using icon path for window:', iconPath);
  
  // Set app icon for Windows taskbar
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath);
  }
  
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
    icon: iconPath,
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

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show tray notification on first minimize
      if (tray && !mainWindow.isVisible()) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Sonna',
          content: 'Ứng dụng đang chạy ngầm. Click vào biểu tượng khay hệ thống để mở lại.'
        });
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// Set app icon early
function setAppIcon() {
  if (process.platform === 'win32') {
    const iconPath = getIconPath();
    try {
      // Set app user model ID for Windows - use executable path for proper association
      app.setAppUserModelId(process.execPath);
      
      // Set taskbar icon
      if (!isDev) {
        app.on('ready', () => {
          try {
            // Force refresh icon cache
            const { execSync } = require('child_process');
            execSync(`ie4uinit.exe -show`);
          } catch (e) {
            console.log('Could not refresh icon cache:', e);
          }
        });
      }
      
      console.log('App icon set successfully');
    } catch (error) {
      console.error('Failed to set app icon:', error);
    }
  }
}

// Set icon early in the process
setAppIcon();

app.whenReady().then(() => {
  // Copy assets to app root for production builds
  copyAssetsToAppRoot();
  
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Don't quit the app when all windows are closed if we have a tray
  // Only quit if explicitly requested (isQuitting = true)
  if (isQuitting) {
    // Cleanup services before quitting
    await serviceManager.cleanup();
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

ipcMain.handle('get-services-status', async () => {
  return await serviceManager.getServicesStatus();
});

ipcMain.handle('start-service', async (event, serviceName: string) => {
  const result = await serviceManager.startService(serviceName);
  // Update tray menu after service state change
  setTimeout(updateTrayMenu, 1000);
  return result;
});

ipcMain.handle('stop-service', async (event, serviceName: string) => {
  const result = await serviceManager.stopService(serviceName);
  // Update tray menu after service state change
  setTimeout(updateTrayMenu, 1000);
  return result;
});

ipcMain.handle('get-projects', async () => {
  try {
    const configResult = await configManager.getConfig();
    if (!configResult.success || !configResult.config) {
      return { success: false, projects: [], message: 'Config file not found' };
    }
    
    const wwwPath = configResult.config.wwwPath || 'C:/sonna/www';
    
    if (!fs.existsSync(wwwPath)) {
      fs.mkdirSync(wwwPath, { recursive: true });
      return { success: true, projects: [] };
    }
    
    // Read all directories in www folder
    const entries = fs.readdirSync(wwwPath, { withFileTypes: true });
    const projects = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(dir => {
        const projectPath = path.join(wwwPath, dir.name);
        let projectType = 'generic';
        let hasIndex = false;
        
        // Try to detect project type
        if (fs.existsSync(path.join(projectPath, 'wp-config.php'))) {
          projectType = 'wordpress';
        } else if (fs.existsSync(path.join(projectPath, 'artisan'))) {
          projectType = 'laravel';
        } else if (fs.existsSync(path.join(projectPath, 'composer.json'))) {
          projectType = 'php';
        } else if (fs.existsSync(path.join(projectPath, 'package.json'))) {
          projectType = 'node';
        }
        
        // Check if it has an index file
        const indexFiles = ['index.php', 'index.html', 'index.htm'];
        hasIndex = indexFiles.some(file => fs.existsSync(path.join(projectPath, file)));
        
        return {
          name: dir.name,
          path: projectPath,
          url: `http://${dir.name}.test`,
          type: projectType,
          hasIndex
        };
      });
    
    return { 
      success: true, 
      projects,
      wwwPath
    };
  } catch (error) {
    console.error('Failed to get projects:', error);
    return { success: false, projects: [], message: `Failed to get projects: ${error}` };
  }
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

ipcMain.handle('quit-app', async () => {
  isQuitting = true;
  app.quit();
});

ipcMain.handle('hide-to-tray', async () => {
  mainWindow?.hide();
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

ipcMain.handle('update-config', async (event, config: any) => {
  return await configManager.updateConfig(config);
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

    // Update tray menu after installation
    setTimeout(updateTrayMenu, 1000);

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

// Add a handler for selecting folders
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Installation Folder'
  });
  
  if (result.canceled) {
    return '';
  }
  
  return result.filePaths[0];
});

// Add a handler for changing the installation path
ipcMain.handle('change-installation-path', async (event, newPath: string, moveFiles: boolean) => {
  try {
    const configResult = await configManager.getConfig();
    if (!configResult.success || !configResult.config) {
      return { success: false, message: 'Config file not found' };
    }
    
    const currentPath = configResult.config.installPath;
    const wwwPath = configResult.config.wwwPath;
    
    // Create new directories
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    
    const newWwwPath = path.join(newPath, 'www');
    if (!fs.existsSync(newWwwPath)) {
      fs.mkdirSync(newWwwPath, { recursive: true });
    }
    
    // If moveFiles is true, copy all files from old path to new path
    if (moveFiles && fs.existsSync(currentPath)) {
      // Copy www directory
      if (fs.existsSync(wwwPath)) {
        await copyDirectory(wwwPath, newWwwPath);
      }
      
      // Copy other important directories
      const dirsToMove = ['applications', 'downloads', 'config.json'];
      for (const dir of dirsToMove) {
        const srcPath = path.join(currentPath, dir);
        const destPath = path.join(newPath, dir);
        
        if (fs.existsSync(srcPath)) {
          if (fs.lstatSync(srcPath).isDirectory()) {
            await copyDirectory(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      
      // Delete old directories if copy was successful
      try {
        if (fs.existsSync(currentPath)) {
          await downloadManager.deleteDirectory(currentPath);
        }
      } catch (error) {
        console.error('Failed to delete old directory:', error);
        // Continue with the path change even if deletion fails
      }
    }
    
    // Update config with new paths
    const updatedConfig = {
      ...configResult.config,
      installPath: newPath,
      wwwPath: newWwwPath
    };
    
    // Update service paths
    for (const [serviceName, service] of Object.entries(updatedConfig.services)) {
      if (service.extractPath && service.extractPath.startsWith(currentPath)) {
        service.extractPath = service.extractPath.replace(currentPath, newPath);
      }
    }
    
    // Save updated config
    await configManager.updateConfig(updatedConfig);
    
    return { 
      success: true, 
      message: 'Installation path updated successfully',
      newPath,
      newWwwPath
    };
  } catch (error) {
    console.error('Failed to change installation path:', error);
    return { success: false, message: `Failed to change installation path: ${error}` };
  }
});

// Helper function to copy a directory recursively
async function copyDirectory(src: string, dest: string): Promise<void> {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

 