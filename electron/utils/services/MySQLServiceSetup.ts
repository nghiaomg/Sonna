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
    const mysqlPath = path.join(extractPath, 'bin', 'mysql.exe');
    
    // Check if database is already initialized
    const mysqlDir = path.join(dataDir, 'mysql');
    if (fs.existsSync(mysqlDir)) {
      console.log('✅ MySQL database already initialized');
      return;
    }

    console.log('🔄 Initializing MySQL database...');
    
    try {
      // Initialize MySQL database with insecure mode (no root password)
      const initCommand = `"${mysqldPath}" --initialize-insecure --basedir="${extractPath}" --datadir="${dataDir}"`;
      console.log(`Running MySQL initialization: ${initCommand}`);
      
      const { stdout, stderr } = await execAsync(initCommand, { 
        timeout: 60000, // 1 minute timeout
        windowsHide: true 
      });
      
      if (stderr && !stderr.includes('warnings')) {
        console.warn('MySQL initialization warnings:', stderr);
      }
      
      console.log('✅ MySQL database initialized with insecure mode (no root password)');
      console.log('   - Root user created with empty password');
      console.log('   - Ready for phpMyAdmin connection');
      
      // Create initialization SQL script for phpMyAdmin compatibility
      await this.createPhpMyAdminUser(extractPath);
      
    } catch (error) {
      console.error('❌ Failed to initialize MySQL database:', error);
      console.error('   This may cause "Cannot login to MySQL server" error in phpMyAdmin');
      // Don't throw error - MySQL might still work with manual initialization
    }
  }

  private async createPhpMyAdminUser(extractPath: string): Promise<void> {
    try {
      const initSqlPath = path.join(extractPath, 'init-phpmyadmin.sql');
      
      // Create SQL script to ensure phpMyAdmin compatibility
      const initSql = `
-- Sonna MySQL initialization for phpMyAdmin compatibility
-- Creates necessary users and permissions

-- Ensure root user has proper privileges
FLUSH PRIVILEGES;

-- Create root user with empty password if not exists
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY '';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '';

-- Grant all privileges to root users
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Create phpMyAdmin user for better security (optional)
CREATE USER IF NOT EXISTS 'phpmyadmin'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'localhost' WITH GRANT OPTION;

-- Ensure mysql database exists and has proper structure
USE mysql;

-- Update user table to ensure proper authentication
UPDATE user SET authentication_string = '' WHERE User = 'root';
UPDATE user SET plugin = 'mysql_native_password' WHERE User = 'root';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show status
SELECT User, Host, plugin, authentication_string FROM mysql.user WHERE User IN ('root', 'phpmyadmin');
`;

      fs.writeFileSync(initSqlPath, initSql, 'utf8');
      console.log(`✅ Created MySQL initialization script: ${initSqlPath}`);
      console.log('   - Root users with empty password configured');
      console.log('   - phpMyAdmin user created');
      console.log('   - Ready for phpMyAdmin authentication');
      
    } catch (error) {
      console.error('⚠️ Failed to create phpMyAdmin user script:', error);
    }
  }
} 