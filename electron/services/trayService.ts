import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ServiceManager } from '../utils/service-manager';

export class TrayService {
  private tray: Tray | null = null;
  private serviceManager: ServiceManager;
  private mainWindow: Electron.BrowserWindow | null = null;
  private isDev: boolean;
  private windowService: any = null;

  constructor(serviceManager: ServiceManager, isDev: boolean) {
    this.serviceManager = serviceManager;
    this.isDev = isDev;
  }

    /**
   * Sets the window service reference for proper app shutdown
   */
  setWindowService(windowService: any) {
    this.windowService = windowService;
  }

  /**
   * Sets the main window reference for show/hide functionality
   */
  setMainWindow(window: Electron.BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Gets the appropriate icon path for development or production environment
   */
  getIconPath(): string {
    if (this.isDev) {
      const devPaths = [
        path.join(__dirname, '../../public/logo.ico'),
        path.join(__dirname, '../../build/icons/icon.ico'),
        path.join(process.cwd(), 'public/logo.ico'),
        path.join(process.cwd(), 'build/icons/icon.ico')
      ];
      
      for (const iconPath of devPaths) {
        if (fs.existsSync(iconPath)) {
          return iconPath;
        }
      }
    } else {
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);
      
      const prodPaths = [
        path.join(process.resourcesPath, 'icons/icon.ico'),
        path.join(process.resourcesPath, 'public/logo.ico'),
        path.join(appDir, 'logo.ico'),
        path.join(process.resourcesPath, 'logo.ico'),
        path.join(__dirname, '../../logo.ico'),
        path.join(__dirname, '../../dist/logo.ico'),
        path.join(__dirname, '../../build/icons/icon.ico'),
        path.join(__dirname, '../../public/logo.ico')
      ];
      
      for (const iconPath of prodPaths) {
        if (fs.existsSync(iconPath)) {
          console.log('Found icon at:', iconPath);
          return iconPath;
        }
      }
    }
    
    return path.join(__dirname, '../../build/icons/icon.ico');
    }

  /**
   * Creates and initializes the system tray with context menu
   */
  createTray() {
    const iconPath = this.getIconPath();
    console.log('Using icon path for tray:', iconPath);
    
    let trayIcon = nativeImage.createFromPath(iconPath);
    
    if (process.platform === 'win32') {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
    
    this.tray = new Tray(trayIcon);
    
    this.updateTrayMenu();
    
    this.tray.setToolTip('Sonna - Local Development Environment');
    
    this.tray.on('double-click', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
      }
    });

    return this.tray;
    }

  /**
   * Updates the tray context menu with current service status
   */
  async updateTrayMenu() {
    if (!this.tray) return;
    
    try {
      const servicesStatus = await this.serviceManager.getServicesStatus();
      
      const serviceMenuItems = Object.entries(servicesStatus).map(([serviceName, status]) => {
        const isInstalled = status.installed;
        const isRunning = status.running;
        
        if (!isInstalled) {
          return {
            label: `${serviceName} (Not Installed)`,
            enabled: false
          };
        }
        
        return {
          label: `${serviceName} (${isRunning ? 'Running' : 'Stopped'})`,
          click: async () => {
            try {
              if (isRunning) {
                await this.serviceManager.stopService(serviceName);
              } else {
                await this.serviceManager.startService(serviceName);
              }
              setTimeout(() => this.updateTrayMenu(), 1000);
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
          label: 'Open Sonna',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          }
        },
        {
          label: 'Start All Services',
          click: async () => {
            try {
              const servicesStatus = await this.serviceManager.getServicesStatus();
              for (const [serviceName, status] of Object.entries(servicesStatus)) {
                if (status.installed && !status.running) {
                  await this.serviceManager.startService(serviceName);
                }
              }
              setTimeout(() => this.updateTrayMenu(), 2000);
            } catch (error) {
              console.error('Failed to start all services:', error);
            }
          }
        },
        {
          label: 'Stop All Services',
          click: async () => {
            try {
              await this.serviceManager.cleanup();
              setTimeout(() => this.updateTrayMenu(), 1000);
            } catch (error) {
              console.error('Failed to stop all services:', error);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: async () => {
            if (this.windowService && typeof this.windowService.setIsQuitting === 'function') {
              this.windowService.setIsQuitting(true);
            }
            
            try {
              await this.serviceManager.cleanup();
            } catch (error) {
              console.error('Error during cleanup:', error);
            }
            
            app.quit();
          }
        }
      ]);

      this.tray.setContextMenu(contextMenu);
        } catch (error) {
      console.error('Failed to update tray menu:', error);
      
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Sonna - Local Dev Environment',
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Open Sonna',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          }
        },
        {
          label: 'Exit',
          click: async () => {
            if (this.windowService && typeof this.windowService.setIsQuitting === 'function') {
              this.windowService.setIsQuitting(true);
            }
            
            try {
              await this.serviceManager.cleanup();
            } catch (error) {
              console.error('Error during cleanup:', error);
            }
            
            app.quit();
          }
        }
      ]);
      
      this.tray.setContextMenu(contextMenu);
    }
  }

  /**
   * Shows a balloon notification when the window is minimized to tray
   */
  showMinimizeNotification() {
    if (this.tray && this.mainWindow && !this.mainWindow.isVisible()) {
      this.tray.displayBalloon({
        iconType: 'info',
        title: 'Sonna',
        content: 'Application is running in the background. Click the tray icon to reopen.'
      });
    }
  }

  /**
   * Returns the tray instance
   */
  getTray() {
    return this.tray;
  }
} 