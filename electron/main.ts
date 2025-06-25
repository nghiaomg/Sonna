import { app, BrowserWindow, session } from 'electron';
import { ServiceManager } from './utils/service-manager';
import { DownloadManager } from './utils/download-manager';
import { ServiceConfigurator } from './utils/service-configurator';
import { ConfigManager } from './utils/config-manager';
import { AssetService, WindowService, TrayService, IpcService } from './services';

const isDev = process.env.NODE_ENV === 'development';

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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
      } else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (windowService.getMainWindow()) {
      const mainWindow = windowService.getMainWindow();
      if (mainWindow?.isMinimized()) mainWindow.restore();
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

windowService.setAppIcon();

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const cspValue = isDev 
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws:"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspValue]
      }
    });
  });
  
  assetService.copyAssetsToAppRoot();
  
  const mainWindow = windowService.createWindow();
  
  trayService.setMainWindow(mainWindow);
  
  trayService.createTray();
  
  windowService.setupWindowEvents(() => {
    trayService.showMinimizeNotification();
  });
  
  ipcService.setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowService.createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (windowService.getIsQuitting()) {
    await serviceManager.cleanup();
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});