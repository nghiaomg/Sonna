import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseServiceSetup } from '../base/BaseServiceSetup';
import { ConfigTemplateManager } from '../config-manager/ConfigTemplateManager';
import { IConfigProvider } from '../interfaces';

const execAsync = promisify(exec);

export class MySQLServiceSetup extends BaseServiceSetup {
  private templateManager: ConfigTemplateManager;

  constructor(configProvider: IConfigProvider) {
    super(configProvider);
    this.templateManager = new ConfigTemplateManager();
  }

  async setupService(extractPath: string): Promise<void> {
    console.log(`Setting up MySQL at: ${extractPath}`);
    
    // Initialize config directory
    await this.templateManager.initialize();

    // Get port from config
    const port = await this.getPortFromConfig('mysql', 3306);
    
    // Create necessary directories
    this.createMySQLDirectories(extractPath);

    // Generate MySQL configuration using template
    const configPath = await this.generateMySQLConfigFromTemplate(extractPath, port);
    
    // Copy config to MySQL directory
    const myIniPath = path.join(extractPath, 'my.ini');
    fs.copyFileSync(configPath, myIniPath);

    // Initialize MySQL database if not already done
    await this.initializeMySQLDatabase(extractPath);
    
    console.log(`MySQL setup completed: ${extractPath}`);
  }

  private async generateMySQLConfigFromTemplate(extractPath: string, port: number): Promise<string> {
    const variables = {
      MYSQL_PORT: port,
      MYSQL_BASEDIR: extractPath.replace(/\\/g, '/'),
      MYSQL_DATADIR: path.join(extractPath, 'data').replace(/\\/g, '/'),
      MYSQL_TMPDIR: path.join(extractPath, 'tmp').replace(/\\/g, '/')
    };

    return await this.templateManager.generateMySQLConfig(variables);
  }

  private createMySQLDirectories(extractPath: string): void {
    const dataDir = path.join(extractPath, 'data');
    const logsDir = path.join(extractPath, 'logs');
    const tmpDir = path.join(extractPath, 'tmp');
    
    this.ensureDirectoryExists(dataDir);
    this.ensureDirectoryExists(logsDir);
    this.ensureDirectoryExists(tmpDir);
  }

  private async initializeMySQLDatabase(extractPath: string): Promise<void> {
    const dataDir = path.join(extractPath, 'data');
    const mysqldPath = path.join(extractPath, 'bin', 'mysqld.exe');
    
    // Check if database is already initialized
    const mysqlDir = path.join(dataDir, 'mysql');
    if (fs.existsSync(mysqlDir)) {
      console.log('MySQL database already initialized');
      return;
    }

    console.log('Initializing MySQL database...');
    
    try {
      // Initialize MySQL database
      const initCommand = `"${mysqldPath}" --initialize-insecure --basedir="${extractPath}" --datadir="${dataDir}"`;
      console.log(`Running MySQL initialization: ${initCommand}`);
      
      const { stdout, stderr } = await execAsync(initCommand, { 
        timeout: 60000, // 1 minute timeout
        windowsHide: true 
      });
      
      if (stderr && !stderr.includes('warnings')) {
        console.warn('MySQL initialization warnings:', stderr);
      }
      
      console.log('MySQL database initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize MySQL database:', error);
      // Don't throw error - MySQL might still work with manual initialization
    }
  }
} 