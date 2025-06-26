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
    const iconPath = this.getIconPath();
    console.log('Using icon path for window:', iconPath);

    if (process.platform === 'win32') {
      app.setAppUserModelId(process.execPath);
    }

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
    } else {
      const htmlPath = path.join(__dirname, '../dist/index.html');
      console.log('Loading HTML from:', htmlPath);
      this.mainWindow.loadFile(htmlPath);
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    return this.mainWindow;
  }
      
  private getPreloadPath(): string {
    if (this.isDev) {
      const devPaths = [
        path.join(__dirname, '../preload.js'),
        path.join(__dirname, '../../electron/preload.js'),
        path.join(process.cwd(), 'electron/preload.js'),
        path.join(process.cwd(), 'dist-electron/preload.js')
      ];

      for (const p of devPaths) {
        if (fs.existsSync(p)) {
          console.log('Found preload.js in development at:', p);
          return p;
        }
      }
    } else {
      const prodPaths = [
        path.join(__dirname, 'preload.js'),
        path.join(__dirname, '../preload.js'),
        path.join(app.getAppPath(), 'dist-electron/preload.js'),
        path.join(process.resourcesPath, 'app.asar.unpacked/dist-electron/preload.js'),
        path.join(process.resourcesPath, 'app/dist-electron/preload.js')
      ];

      for (const p of prodPaths) {
        if (fs.existsSync(p)) {
          console.log('Found preload.js in production at:', p);
          return p;
        }
      }
    }

    console.warn('Could not find preload.js in any expected location');
    const defaultPath = this.isDev
      ? path.join(__dirname, '../preload.js')
      : path.join(__dirname, 'preload.js');
    console.warn('Using default path:', defaultPath);
    return defaultPath;
  }

  setupWindowEvents(onCloseCallback: () => void) {
    if (!this.mainWindow) return;

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();

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
        app.setAppUserModelId(process.execPath);

        if (!this.isDev) {
          app.on('ready', () => {
            try {
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