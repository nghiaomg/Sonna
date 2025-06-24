import * as fs from 'fs';
import * as path from 'path';

export interface SonnaConfig {
  version: string;
  installPath: string;
  wwwPath: string;
  services: Record<string, any>;
  settings: {
    autoStart: string[];
    defaultPHPVersion: string;
    defaultPort: number;
  };
}

export class ConfigManager {
  private configPath: string;
  private sonnaPath: string;

  constructor(sonnaPath: string = 'C:/sonna') {
    this.sonnaPath = sonnaPath;
    this.configPath = path.join(sonnaPath, 'config.json');
  }

  async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      const applicationsPath = path.join(this.sonnaPath, 'applications');
      const wwwPath = path.join(this.sonnaPath, 'www');

      // Create directories
      if (!fs.existsSync(this.sonnaPath)) {
        fs.mkdirSync(this.sonnaPath, { recursive: true });
      }
      if (!fs.existsSync(applicationsPath)) {
        fs.mkdirSync(applicationsPath, { recursive: true });
      }
      if (!fs.existsSync(wwwPath)) {
        fs.mkdirSync(wwwPath, { recursive: true });
      }

      // Create default config if not exists
      if (!fs.existsSync(this.configPath)) {
        const defaultConfig = this.getDefaultConfig(applicationsPath, wwwPath);
        fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
      }

      return { success: true, message: 'Sonna initialized successfully' };
    } catch (error) {
      console.error('Failed to initialize Sonna:', error);
      return { success: false, message: `Failed to initialize: ${error}` };
    }
  }

  async getConfig(): Promise<{ success: boolean; config?: SonnaConfig; message?: string }> {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { success: true, config };
      } else {
        return { success: false, message: 'Config file not found' };
      }
    } catch (error) {
      return { success: false, message: `Failed to read config: ${error}` };
    }
  }

  async updateConfig(updates: Partial<SonnaConfig>): Promise<{ success: boolean; message: string }> {
    try {
      const currentConfig = await this.getConfig();
      if (!currentConfig.success || !currentConfig.config) {
        return { success: false, message: 'Failed to read current config' };
      }

      const newConfig = { ...currentConfig.config, ...updates };
      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
      
      return { success: true, message: 'Config updated successfully' };
    } catch (error) {
      return { success: false, message: `Failed to update config: ${error}` };
    }
  }

  async updateServiceStatus(serviceName: string, updates: { installed?: boolean; running?: boolean }): Promise<void> {
    const configResult = await this.getConfig();
    if (configResult.success && configResult.config) {
      if (configResult.config.services[serviceName]) {
        if (updates.installed !== undefined) {
          configResult.config.services[serviceName].installed = updates.installed;
        }
        if (updates.running !== undefined) {
          configResult.config.services[serviceName].running = updates.running;
        }
        
        fs.writeFileSync(this.configPath, JSON.stringify(configResult.config, null, 2));
      }
    }
  }

  async resetInstallationStatus(): Promise<{ success: boolean; message: string }> {
    try {
      const configResult = await this.getConfig();
      if (!configResult.success || !configResult.config) {
        return { success: false, message: 'Config file not found' };
      }

      // Reset all services to not installed
      for (const serviceName of Object.keys(configResult.config.services)) {
        configResult.config.services[serviceName].installed = false;
        configResult.config.services[serviceName].running = false;
      }

      fs.writeFileSync(this.configPath, JSON.stringify(configResult.config, null, 2));
      return { success: true, message: 'Installation status reset successfully' };
    } catch (error) {
      console.error('Failed to reset installation status:', error);
      return { success: false, message: `Failed to reset: ${error}` };
    }
  }

  private getDefaultConfig(applicationsPath: string, wwwPath: string): SonnaConfig {
    return {
      version: "1.0.0",
      installPath: this.sonnaPath,
      wwwPath: wwwPath,
      services: {
        php: {
          name: "php",
          displayName: "PHP",
          version: "8.3.0",
          downloadUrl: "https://windows.php.net/downloads/releases/php-8.3.0-Win32-vs16-x64.zip",
          extractPath: path.join(applicationsPath, 'php'),
          executable: "php.exe",
          installed: false,
          running: false
        },
        nodejs: {
          name: "nodejs",
          displayName: "Node.js",
          version: "20.11.0",
          downloadUrl: "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip",
          extractPath: path.join(applicationsPath, 'nodejs'),
          executable: "node.exe",
          installed: false,
          running: false
        },
        apache: {
          name: "apache",
          displayName: "Apache",
          version: "2.4.63",
          downloadUrl: "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip",
          extractPath: path.join(applicationsPath, 'apache'),
          executable: "bin/httpd.exe",
          port: 80,
          installed: false,
          running: false
        },
        mysql: {
          name: "mysql",
          displayName: "MySQL",
          version: "8.0.35",
          downloadUrl: "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.35-winx64.zip",
          extractPath: path.join(applicationsPath, 'mysql'),
          executable: "bin/mysqld.exe",
          port: 3306,
          installed: false,
          running: false
        },
        nginx: {
          name: "nginx",
          displayName: "Nginx",
          version: "1.24.0",
          downloadUrl: "http://nginx.org/download/nginx-1.24.0.zip",
          extractPath: path.join(applicationsPath, 'nginx'),
          executable: "nginx.exe",
          port: 8080,
          installed: false,
          running: false
        },
        redis: {
          name: "redis",
          displayName: "Redis",
          version: "3.0.504",
          downloadUrl: "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip",
          extractPath: path.join(applicationsPath, 'redis'),
          executable: "redis-server.exe",
          port: 6379,
          installed: false,
          running: false
        },
        phpmyadmin: {
          name: "phpmyadmin",
          displayName: "phpMyAdmin",
          version: "5.2.1",
          downloadUrl: "https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip",
          extractPath: path.join(wwwPath, 'phpmyadmin'),
          executable: "",
          installed: false,
          running: false
        }
      },
      settings: {
        autoStart: [],
        defaultPHPVersion: "8.3.0",
        defaultPort: 80
      }
    };
  }
} 