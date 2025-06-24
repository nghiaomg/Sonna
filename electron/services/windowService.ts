import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class WindowService {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting: boolean = false;
  private isDev: boolean;
  private getIconPath: () => string;

  constructor(isDev: boolean, getIconPathFunc: () => string) {
    this.isDev = isDev;
    this.getIconPath = getIconPathFunc;
  }

  createWindow() {
    // Get icon path before creating window
    const iconPath = this.getIconPath();
    console.log('Using icon path for window:', iconPath);
    
    // Set app icon for Windows taskbar
    if (process.platform === 'win32') {
      app.setAppUserModelId(process.execPath);
    }
    
    // Determine the correct preload script path
    const preloadPath = this.getPreloadPath();
    console.log('Using preload path:', preloadPath);
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      frame: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        webSecurity: true,
        allowRunningInsecureContent: false,
        sandbox: true,
      },
      icon: iconPath,
      show: false,
    });

    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      // this.mainWindow.webContents.openDevTools(); // Dev tools disabled
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    return this.mainWindow;
  }

  // Find the correct preload script path
  private getPreloadPath(): string {
    // Try multiple possible locations for the preload script
    const possiblePaths = [
      path.join(__dirname, '../preload.js'),
      path.join(__dirname, '../../electron/preload.js'),
      path.join(__dirname, '../../../electron/preload.js'),
      path.join(process.cwd(), 'electron/preload.js'),
      path.join(app.getAppPath(), 'electron/preload.js')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    // If no path is found, return the default path and log a warning
    console.warn('Could not find preload.js, using default path');
    return path.join(__dirname, '../preload.js');
  }

  setupWindowEvents(onCloseCallback: () => void) {
    if (!this.mainWindow) return;

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
        
        // Call the callback when window is closed to system tray
        onCloseCallback();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }

  setIsQuitting(value: boolean) {
    this.isQuitting = value;
  }

  getIsQuitting() {
    return this.isQuitting;
  }

  minimizeWindow() {
    this.mainWindow?.minimize();
  }

  maximizeWindow() {
    if (this.mainWindow?.isMaximized()) {
      this.mainWindow.restore();
    } else {
      this.mainWindow?.maximize();
    }
  }

  closeWindow() {
    this.mainWindow?.close();
  }

  hideWindow() {
    this.mainWindow?.hide();
  }

  showWindow() {
    this.mainWindow?.show();
    this.mainWindow?.focus();
  }

  isWindowMaximized() {
    return this.mainWindow?.isMaximized() || false;
  }

  setAppIcon() {
    if (process.platform === 'win32') {
      const iconPath = this.getIconPath();
      try {
        // Set app user model ID for Windows - use executable path for proper association
        app.setAppUserModelId(process.execPath);
        
        // Set taskbar icon
        if (!this.isDev) {
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
} 