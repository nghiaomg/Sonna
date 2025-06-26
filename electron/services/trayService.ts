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

  setWindowService(windowService: any) {
    this.windowService = windowService;
  }

  setMainWindow(window: Electron.BrowserWindow) {
    this.mainWindow = window;
  }

  getIconPath(): string {
    if (this.isDev) {
      // In development, try multiple paths
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
    
    // Fallback - return default path
    return path.join(__dirname, '../../build/icons/icon.ico');
  }

  createTray() {
    // Create tray icon
    const iconPath = this.getIconPath();
    console.log('Using icon path for tray:', iconPath);
    
    // Create native image with proper scaling
    let trayIcon = nativeImage.createFromPath(iconPath);
    
    // Ensure icon is visible by setting proper size
    if (process.platform === 'win32') {
      // Windows requires specific sizes for tray icons
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
    
    this.tray = new Tray(trayIcon);
    
    // Update tray context menu with service status
    this.updateTrayMenu();
    
    this.tray.setToolTip('Sonna - Local Development Environment');
    
    // Double click to show/hide window
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

  async updateTrayMenu() {
    if (!this.tray) return;
    
    try {
      // Get current service status
      const servicesStatus = await this.serviceManager.getServicesStatus();
      
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
                await this.serviceManager.stopService(serviceName);
              } else {
                await this.serviceManager.startService(serviceName);
              }
              // Update menu after service state change
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
          label: 'Mở Sonna',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          }
        },
        {
          label: 'Khởi động tất cả dịch vụ',
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
          label: 'Dừng tất cả dịch vụ',
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
          label: 'Thoát',
          click: async () => {
            // Set quitting flag to allow proper shutdown
            if (this.windowService && typeof this.windowService.setIsQuitting === 'function') {
              this.windowService.setIsQuitting(true);
            }
            
            // Force cleanup and quit
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
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          }
        },
        {
          label: 'Thoát',
          click: async () => {
            // Set quitting flag to allow proper shutdown
            if (this.windowService && typeof this.windowService.setIsQuitting === 'function') {
              this.windowService.setIsQuitting(true);
            }
            
            // Force cleanup and quit
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

  showMinimizeNotification() {
    if (this.tray && this.mainWindow && !this.mainWindow.isVisible()) {
      this.tray.displayBalloon({
        iconType: 'info',
        title: 'Sonna',
        content: 'Ứng dụng đang chạy ngầm. Click vào biểu tượng khay hệ thống để mở lại.'
      });
    }
  }

  getTray() {
    return this.tray;
  }
} 