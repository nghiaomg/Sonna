import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { IServiceRunner, ServiceConfig, ServiceResult, IConfigReader } from '../interfaces';

export class ProcessServiceRunner implements IServiceRunner {
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private configReader: IConfigReader;

  constructor(configReader: IConfigReader) {
    this.configReader = configReader;
  }

  async start(serviceName: string, service: ServiceConfig): Promise<ServiceResult> {
    try {
      if (this.runningProcesses.has(serviceName)) {
        return { success: false, message: `${serviceName} is already running` };
      }

      let executablePath = path.join(service.extractPath, service.executable);

      // Handle Apache nested structure
      if (serviceName === 'apache' && !fs.existsSync(executablePath)) {
        const apacheNestedPath = path.join(service.extractPath, 'Apache24', service.executable);
        if (fs.existsSync(apacheNestedPath)) {
          executablePath = apacheNestedPath;
        }
      }

      if (!fs.existsSync(executablePath)) {
        return { success: false, message: 'Service executable not found' };
      }

      const process = await this.spawnService(serviceName, executablePath, service);
      this.runningProcesses.set(serviceName, process);
      
      // Update config
      const config = await this.configReader.getConfig();
      config.services[serviceName].running = true;
      await this.configReader.saveConfig(config);

      return { success: true, message: `${service.displayName} started successfully` };
    } catch (error) {
      console.error(`Failed to start service ${serviceName}:`, error);
      return { success: false, message: `Failed to start: ${error}` };
    }
  }

  async stop(serviceName: string): Promise<ServiceResult> {
    try {
      const process = this.runningProcesses.get(serviceName);

      if (!process) {
        return { success: false, message: `${serviceName} is not running` };
      }

      process.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);

      this.runningProcesses.delete(serviceName);

      // Update config
      try {
        const config = await this.configReader.getConfig();
        if (config.services[serviceName]) {
          config.services[serviceName].running = false;
          await this.configReader.saveConfig(config);
        }
      } catch (configError) {
        console.error('Failed to update config after stopping service:', configError);
      }

      return { success: true, message: `${serviceName} stopped successfully` };
    } catch (error) {
      console.error(`Failed to stop service ${serviceName}:`, error);
      return { success: false, message: `Failed to stop: ${error}` };
    }
  }

  isRunning(serviceName: string): boolean {
    return this.runningProcesses.has(serviceName);
  }

  async cleanup(): Promise<void> {
    const promises = Array.from(this.runningProcesses.keys()).map(serviceName => 
      this.stop(serviceName)
    );
    await Promise.all(promises);
  }

  private async spawnService(serviceName: string, executablePath: string, service: ServiceConfig): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const args = this.getServiceArguments(serviceName, service);
      const options: SpawnOptions = {
        cwd: service.extractPath,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      };

      const childProcess = spawn(executablePath, args, options);

      this.setupProcessHandlers(childProcess, serviceName);

      childProcess.on('error', (error: Error) => {
        console.error(`Failed to start ${serviceName}:`, error);
        reject(error);
      });

      childProcess.on('spawn', () => {
        console.log(`${serviceName} process spawned with PID ${childProcess.pid}`);
        resolve(childProcess);
      });
    });
  }

  private getServiceArguments(serviceName: string, service: ServiceConfig): string[] {
    switch (serviceName) {
      case 'apache':
        return ['-D', 'FOREGROUND'];
      case 'mysql':
        return [`--defaults-file=${path.join(service.extractPath, 'my.ini')}`];
      case 'nginx':
        return ['-g', 'daemon off;'];
      case 'redis':
        const redisConfPath = path.join(service.extractPath, 'redis.conf');
        return fs.existsSync(redisConfPath) ? [redisConfPath] : [];
      default:
        return [];
    }
  }

  private setupProcessHandlers(childProcess: ChildProcess, serviceName: string): void {
    childProcess.on('exit', (code, signal) => {
      console.log(`${serviceName} process exited with code ${code} and signal ${signal}`);
      this.runningProcesses.delete(serviceName);
    });

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
  }
} 