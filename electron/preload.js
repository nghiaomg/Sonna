"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Service management
    getServicesStatus: () => electron_1.ipcRenderer.invoke('get-services-status'),
    startService: (serviceName) => electron_1.ipcRenderer.invoke('start-service', serviceName),
    stopService: (serviceName) => electron_1.ipcRenderer.invoke('stop-service', serviceName),
    // Project management
    getProjects: () => electron_1.ipcRenderer.invoke('get-projects'),
    // Virtual host management
    createVirtualHost: (config) => electron_1.ipcRenderer.invoke('create-virtual-host', config),
    // Window controls
    minimizeWindow: () => electron_1.ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => electron_1.ipcRenderer.invoke('maximize-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'),
    isWindowMaximized: () => electron_1.ipcRenderer.invoke('is-window-maximized'),
    // Platform info
    platform: process.platform,
});
