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
exports.ServiceManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class ServiceManager {
    constructor(configPath = 'C:/sonna/config.json') {
        this.runningProcesses = new Map();
        this.configPath = configPath;
    }
    async getServicesStatus() {
        try {
            if (!fs.existsSync(this.configPath)) {
                return this.getDefaultStatus();
            }
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            const status = {};
            for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
                const service = serviceConfig;
                const isActuallyInstalled = service.installed && this.checkServiceInstallation(service);
                status[serviceName] = {
                    installed: isActuallyInstalled,
                    running: this.runningProcesses.has(serviceName)
                };
            }
            return status;
        }
        catch (error) {
            console.error('Failed to get services status:', error);
            return this.getDefaultStatus();
        }
    }
    async startService(serviceName) {
        try {
            if (this.runningProcesses.has(serviceName)) {
                return { success: false, message: `${serviceName} is already running` };
            }
            const config = await this.getConfig();
            const service = config.services[serviceName];
            if (!service) {
                return { success: false, message: 'Service not found' };
            }
            if (!service.installed || !this.checkServiceInstallation(service)) {
                return { success: false, message: 'Service not installed' };
            }
            const executablePath = path.join(service.extractPath, service.executable);
            if (!fs.existsSync(executablePath)) {
                return { success: false, message: 'Service executable not found' };
            }
            const process = await this.spawnService(serviceName, executablePath, service);
            this.runningProcesses.set(serviceName, process);
            // Update config
            config.services[serviceName].running = true;
            await this.saveConfig(config);
            return { success: true, message: `${service.displayName} started successfully` };
        }
        catch (error) {
            console.error(`Failed to start service ${serviceName}:`, error);
            return { success: false, message: `Failed to start: ${error}` };
        }
    }
    async stopService(serviceName) {
        try {
            const process = this.runningProcesses.get(serviceName);
            if (!process) {
                return { success: false, message: `${serviceName} is not running` };
            }
            const config = await this.getConfig();
            const service = config.services[serviceName];
            // Gracefully terminate the process
            process.kill('SIGTERM');
            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            }, 5000);
            this.runningProcesses.delete(serviceName);
            // Update config
            if (service) {
                config.services[serviceName].running = false;
                await this.saveConfig(config);
            }
            return { success: true, message: `${service?.displayName || serviceName} stopped successfully` };
        }
        catch (error) {
            console.error(`Failed to stop service ${serviceName}:`, error);
            return { success: false, message: `Failed to stop: ${error}` };
        }
    }
    checkServiceInstallation(service) {
        try {
            const extractPath = service.extractPath;
            if (!fs.existsSync(extractPath)) {
                return false;
            }
            if (service.executable && service.executable !== "") {
                const executablePath = path.join(extractPath, service.executable);
                if (!fs.existsSync(executablePath)) {
                    return false;
                }
            }
            switch (service.name) {
                case 'apache':
                    return fs.existsSync(path.join(extractPath, 'conf', 'httpd.conf'));
                case 'mysql':
                    return fs.existsSync(path.join(extractPath, 'bin')) &&
                        fs.existsSync(path.join(extractPath, 'my.ini'));
                case 'nginx':
                    return fs.existsSync(path.join(extractPath, 'conf', 'nginx.conf'));
                case 'php':
                    return fs.existsSync(path.join(extractPath, 'php.exe')) ||
                        fs.existsSync(path.join(extractPath, 'php.ini'));
                case 'redis':
                    return fs.existsSync(path.join(extractPath, 'redis-server.exe'));
                case 'nodejs':
                    return fs.existsSync(path.join(extractPath, 'node.exe'));
                case 'phpmyadmin':
                    return fs.existsSync(path.join(extractPath, 'index.php'));
                default:
                    return true;
            }
        }
        catch (error) {
            console.error(`Failed to check installation for ${service.name}:`, error);
            return false;
        }
    }
    async spawnService(serviceName, executablePath, service) {
        return new Promise((resolve, reject) => {
            let args = [];
            let options = {
                cwd: service.extractPath,
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            };
            // Service-specific arguments and options
            switch (serviceName) {
                case 'apache':
                    args = ['-D', 'FOREGROUND'];
                    break;
                case 'mysql':
                    args = ['--defaults-file=' + path.join(service.extractPath, 'my.ini')];
                    break;
                case 'nginx':
                    // Nginx runs in foreground with -g daemon off
                    args = ['-g', 'daemon off;'];
                    break;
                case 'redis':
                    if (fs.existsSync(path.join(service.extractPath, 'redis.conf'))) {
                        args = [path.join(service.extractPath, 'redis.conf')];
                    }
                    break;
            }
            const childProcess = (0, child_process_1.spawn)(executablePath, args, options);
            childProcess.on('error', (error) => {
                console.error(`Failed to start ${serviceName}:`, error);
                reject(error);
            });
            childProcess.on('spawn', () => {
                console.log(`${serviceName} process spawned with PID ${childProcess.pid}`);
                resolve(childProcess);
            });
            childProcess.on('exit', (code, signal) => {
                console.log(`${serviceName} process exited with code ${code} and signal ${signal}`);
                this.runningProcesses.delete(serviceName);
            });
            // Log output for debugging
            if (childProcess.stdout) {
                childProcess.stdout.on('data', (data) => {
                    console.log(`${serviceName} stdout:`, data.toString());
                });
            }
            if (childProcess.stderr) {
                childProcess.stderr.on('data', (data) => {
                    console.error(`${serviceName} stderr:`, data.toString());
                });
            }
        });
    }
    async getConfig() {
        if (!fs.existsSync(this.configPath)) {
            throw new Error('Config file not found');
        }
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }
    async saveConfig(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }
    getDefaultStatus() {
        return {
            apache: { installed: false, running: false },
            nginx: { installed: false, running: false },
            mysql: { installed: false, running: false },
            php: { installed: false, running: false },
            redis: { installed: false, running: false },
            nodejs: { installed: false, running: false },
        };
    }
    async cleanup() {
        // Stop all running services on cleanup
        for (const [serviceName] of this.runningProcesses) {
            await this.stopService(serviceName);
        }
    }
}
exports.ServiceManager = ServiceManager;
