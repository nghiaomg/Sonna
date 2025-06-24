import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow;

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

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
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

// App event listeners
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for service management
ipcMain.handle('get-services-status', async () => {
  // Implementation for getting services status
  return {
    apache: false,
    nginx: false,
    mysql: false,
    php: false,
    redis: false,
    nodejs: false,
  };
});

ipcMain.handle('start-service', async (event, serviceName: string) => {
  // Implementation for starting service
  console.log(`Starting service: ${serviceName}`);
  return { success: true, message: `${serviceName} started successfully` };
});

ipcMain.handle('stop-service', async (event, serviceName: string) => {
  // Implementation for stopping service
  console.log(`Stopping service: ${serviceName}`);
  return { success: true, message: `${serviceName} stopped successfully` };
});

ipcMain.handle('get-projects', async () => {
  // Implementation for getting local projects
  return [];
});

ipcMain.handle('create-virtual-host', async (event, config: any) => {
  // Implementation for creating virtual host
  console.log('Creating virtual host:', config);
  return { success: true, message: 'Virtual host created successfully' };
});

// Window control handlers
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