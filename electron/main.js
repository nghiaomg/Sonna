"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// App event listeners
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for service management
electron_1.ipcMain.handle('get-services-status', async () => {
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
electron_1.ipcMain.handle('start-service', async (event, serviceName) => {
    // Implementation for starting service
    console.log(`Starting service: ${serviceName}`);
    return { success: true, message: `${serviceName} started successfully` };
});
electron_1.ipcMain.handle('stop-service', async (event, serviceName) => {
    // Implementation for stopping service
    console.log(`Stopping service: ${serviceName}`);
    return { success: true, message: `${serviceName} stopped successfully` };
});
electron_1.ipcMain.handle('get-projects', async () => {
    // Implementation for getting local projects
    return [];
});
electron_1.ipcMain.handle('create-virtual-host', async (event, config) => {
    // Implementation for creating virtual host
    console.log('Creating virtual host:', config);
    return { success: true, message: 'Virtual host created successfully' };
});
// Window control handlers
electron_1.ipcMain.handle('minimize-window', async () => {
    mainWindow?.minimize();
});
electron_1.ipcMain.handle('maximize-window', async () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.restore();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.handle('close-window', async () => {
    mainWindow?.close();
});
electron_1.ipcMain.handle('is-window-maximized', async () => {
    return mainWindow?.isMaximized() || false;
});
