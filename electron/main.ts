import { app, BrowserWindow } from 'electron';
import { ServiceManager } from './utils/service-manager';
import { DownloadManager } from './utils/download-manager';
import { ServiceConfigurator } from './utils/service-configurator';
import { ConfigManager } from './utils/config-manager';
import { AssetService, WindowService, TrayService, IpcService } from './services';

// Application state
const isDev = process.env.NODE_ENV === 'development';

// Initialize services
const serviceManager = new ServiceManager();
const configManager = new ConfigManager();
const serviceConfigurator = new ServiceConfigurator();
const downloadManager = new DownloadManager();
const assetService = new AssetService(isDev);
const windowService = new WindowService(isDev, () => assetService.getIconPath());
const trayService = new TrayService(serviceManager, isDev);
const ipcService = new IpcService(
  serviceManager, 
  configManager, 
  downloadManager, 
  serviceConfigurator, 
  windowService
);

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    if (windowService.getMainWindow()) {
      const mainWindow = windowService.getMainWindow();
      if (mainWindow?.isMinimized()) mainWindow.restore();
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// Set app icon early
windowService.setAppIcon();

app.whenReady().then(() => {
  // Copy assets to app root for production builds
  assetService.copyAssetsToAppRoot();
  
  // Create main window
  const mainWindow = windowService.createWindow();
  
  // Set main window for tray service
  trayService.setMainWindow(mainWindow);
  
  // Create tray icon
  trayService.createTray();
  
  // Setup window events
  windowService.setupWindowEvents(() => {
    // Show tray notification on first minimize
    trayService.showMinimizeNotification();
  });
  
  // Setup IPC handlers
  ipcService.setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowService.createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Don't quit the app when all windows are closed if we have a tray
  // Only quit if explicitly requested (isQuitting = true)
  if (windowService.getIsQuitting()) {
    // Cleanup services before quitting
    await serviceManager.cleanup();
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
}); 