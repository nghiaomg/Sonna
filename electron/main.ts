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

app.whenReady().then(async () => {
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
  
  // Initialize Sonna configuration before starting any services
  try {
    console.log('Initializing Sonna configuration...');
    const initResult = await configManager.initialize();
    if (initResult.success) {
      console.log('Sonna configuration initialized successfully');
      
      // Auto-configure services based on current installation status
      console.log('🔄 Running auto-configuration for existing services...');
      try {
        // Check if Apache and PHP are installed and configure accordingly
        const apacheExists = require('fs').existsSync('C:/sonna/applications/apache');
        const phpExists = ['8.4', '8.3', '8.2', '8.1'].some(v => 
          require('fs').existsSync(`C:/sonna/applications/php/${v}`)
        );
        const phpMyAdminExists = require('fs').existsSync('C:/sonna/applications/phpmyadmin');
        
                 if (apacheExists || phpExists || phpMyAdminExists) {
           console.log(`📊 Detected services - Apache: ${apacheExists ? '✅' : '❌'}, PHP: ${phpExists ? '✅' : '❌'}, phpMyAdmin: ${phpMyAdminExists ? '✅' : '❌'}`);
           
           // Always trigger Apache configuration if Apache is installed
           if (apacheExists) {
             console.log('🌐 Apache detected - forcing configuration update...');
             try {
               await serviceConfigurator.updateApacheConfiguration();
               console.log('✅ Apache auto-configuration completed successfully');
               
               // Special handling for phpMyAdmin without PHP
               if (phpMyAdminExists && !phpExists) {
                 console.log('⚠️ phpMyAdmin detected without PHP - requirement page should be active');
                 console.log('🌐 Visit: http://localhost/phpmyadmin/ to see PHP requirement page');
               }
             } catch (configError) {
               console.error('❌ Apache configuration failed:', configError);
               // Continue anyway - don't block app startup
             }
           }
           
           // If phpMyAdmin exists but Apache doesn't, warn user
           if (phpMyAdminExists && !apacheExists) {
             console.log('⚠️ phpMyAdmin detected without Apache - web server required');
           }
         } else {
           console.log('ℹ️ No services detected for auto-configuration');
         }
      } catch (configError) {
        console.error('Failed to run auto-configuration:', configError);
      }
    } else {
      console.error('Failed to initialize Sonna:', initResult.message);
    }
  } catch (error) {
    console.error('Critical error during Sonna initialization:', error);
  }
  
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