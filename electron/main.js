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
const fs = __importStar(require("fs"));
const utils_1 = require("./utils");
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;
let tray = null;
let isQuitting = false;
// Initialize utility managers
const serviceManager = new utils_1.ServiceManager();
const configManager = new utils_1.ConfigManager();
const serviceConfigurator = new utils_1.ServiceConfigurator();
const downloadManager = new utils_1.DownloadManager();
function createTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, '../public/logo.ico');
    const trayIcon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(trayIcon.resize({ width: 16, height: 16 }));
    // Update tray context menu with service status
    updateTrayMenu();
    tray.setToolTip('Sonna - Local Development Environment');
    // Double click to show/hide window
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}
async function updateTrayMenu() {
    if (!tray)
        return;
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
                        }
                        else {
                            await serviceManager.startService(serviceName);
                        }
                        // Update menu after service state change
                        setTimeout(updateTrayMenu, 1000);
                    }
                    catch (error) {
                        console.error(`Failed to toggle ${serviceName}:`, error);
                    }
                }
            };
        });
        const contextMenu = electron_1.Menu.buildFromTemplate([
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
                    }
                    catch (error) {
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
                    }
                    catch (error) {
                        console.error('Failed to stop all services:', error);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Thoát',
                click: () => {
                    isQuitting = true;
                    electron_1.app.quit();
                }
            }
        ]);
        tray.setContextMenu(contextMenu);
    }
    catch (error) {
        console.error('Failed to update tray menu:', error);
        // Fallback simple menu
        const contextMenu = electron_1.Menu.buildFromTemplate([
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
                    electron_1.app.quit();
                }
            }
        ]);
        tray.setContextMenu(contextMenu);
    }
}
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
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools(); // Dev tools disabled
    }
    else {
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
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', async () => {
    // Don't quit the app when all windows are closed if we have a tray
    // Only quit if explicitly requested (isQuitting = true)
    if (isQuitting) {
        // Cleanup services before quitting
        await serviceManager.cleanup();
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    }
});
electron_1.ipcMain.handle('get-services-status', async () => {
    return await serviceManager.getServicesStatus();
});
electron_1.ipcMain.handle('start-service', async (event, serviceName) => {
    const result = await serviceManager.startService(serviceName);
    // Update tray menu after service state change
    setTimeout(updateTrayMenu, 1000);
    return result;
});
electron_1.ipcMain.handle('stop-service', async (event, serviceName) => {
    const result = await serviceManager.stopService(serviceName);
    // Update tray menu after service state change
    setTimeout(updateTrayMenu, 1000);
    return result;
});
electron_1.ipcMain.handle('get-projects', async () => {
    return [];
});
electron_1.ipcMain.handle('create-virtual-host', async (event, config) => {
    console.log('Creating virtual host:', config);
    return { success: true, message: 'Virtual host created successfully' };
});
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
electron_1.ipcMain.handle('quit-app', async () => {
    isQuitting = true;
    electron_1.app.quit();
});
electron_1.ipcMain.handle('hide-to-tray', async () => {
    mainWindow?.hide();
});
electron_1.ipcMain.handle('is-window-maximized', async () => {
    return mainWindow?.isMaximized() || false;
});
// Reset installation status for testing
electron_1.ipcMain.handle('reset-installation-status', async () => {
    return await configManager.resetInstallationStatus();
});
electron_1.ipcMain.handle('refresh-config', async () => {
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
    }
    catch (error) {
        return { success: false, message: `Failed to refresh config: ${error}` };
    }
});
// Clean up applications
electron_1.ipcMain.handle('cleanup-applications', async () => {
    const applicationsPath = 'C:/sonna/applications';
    try {
        let deletedServices = [];
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
    }
    catch (error) {
        console.error('Failed to cleanup applications:', error);
        return { success: false, message: `Failed to cleanup: ${error}` };
    }
});
// Delete specific service
electron_1.ipcMain.handle('delete-service', async (event, serviceName) => {
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
    }
    catch (error) {
        console.error(`Failed to delete service ${serviceName}:`, error);
        return { success: false, message: `Failed to delete: ${error}` };
    }
});
// Setup and Configuration handlers
electron_1.ipcMain.handle('initialize-sonna', async () => {
    return await configManager.initialize();
});
electron_1.ipcMain.handle('get-sonna-config', async () => {
    return await configManager.getConfig();
});
electron_1.ipcMain.handle('download-service', async (event, serviceName) => {
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
        const downloadManagerWithProgress = new utils_1.DownloadManager((progress) => {
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
    }
    catch (error) {
        mainWindow?.webContents.send('download-progress', {
            serviceName,
            progress: 0,
            status: 'error',
            message: `Failed to install: ${error}`
        });
        return { success: false, message: `Failed to install: ${error}` };
    }
});
