import * as fs from 'fs';
import * as path from 'path';

export interface ServiceConfig {
  name: string;
  displayName: string;
  version: string;
  downloadUrl: string;
  extractPath: string;
  executable: string;
  configFile?: string;
  port?: number;
  installed: boolean;
  running: boolean;
  isDefault?: boolean;
}

export interface SonnaConfig {
  version: string;
  installPath: string;
  wwwPath: string;
  services: {
    php: {
      versions: Record<string, ServiceConfig>;
      current: string;
    };
    nodejs: {
      versions: Record<string, ServiceConfig>;
      current: string;
    };
    apache: ServiceConfig;
    nginx: ServiceConfig;
    mysql: ServiceConfig;
    mongodb: ServiceConfig;
    phpmyadmin: ServiceConfig;
    redis: ServiceConfig;
    [key: string]: any;
  };
  settings: {
    autoStart: string[];
    defaultPHPVersion: string;
    defaultNodeVersion: string;
    defaultPort: number;
  };
  projectSettings: Record<string, {
    phpVersion?: string;
    nodeVersion?: string;
  }>;
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

      // Create default index.html if not exists
      const indexHtmlPath = path.join(wwwPath, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) {
        const defaultIndexContent = this.getDefaultIndexHtml();
        fs.writeFileSync(indexHtmlPath, defaultIndexContent, 'utf8');
      }

      // Create default config if not exists
      if (!fs.existsSync(this.configPath)) {
        const defaultConfig = await this.getDefaultConfig(applicationsPath, wwwPath);
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

  async saveConfig(config: SonnaConfig): Promise<{ success: boolean; message: string }> {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return { success: true, message: 'Config saved successfully' };
    } catch (error) {
      console.error('Failed to save config:', error);
      return { success: false, message: `Failed to save config: ${error}` };
    }
  }

  async saveConfigToPath(config: SonnaConfig, filePath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
      return { success: true, message: `Config saved to ${filePath}` };
    } catch (error) {
      console.error('Failed to save config to path:', error);
      return { success: false, message: `Failed to save config: ${error}` };
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

      const config = configResult.config;

      // Reset PHP versions
      for (const version in config.services.php.versions) {
        config.services.php.versions[version].installed = false;
        config.services.php.versions[version].running = false;
      }

      // Reset Node.js versions
      for (const version in config.services.nodejs.versions) {
        config.services.nodejs.versions[version].installed = false;
        config.services.nodejs.versions[version].running = false;
      }

      // Reset other services - auto-detect all non-versioned services
      Object.entries(config.services).forEach(([serviceName, serviceConfig]) => {
        if (serviceName !== 'php' && serviceName !== 'nodejs' && serviceConfig && typeof serviceConfig === 'object') {
          config.services[serviceName].installed = false;
          config.services[serviceName].running = false;
        }
      });

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return { success: true, message: 'Installation status reset successfully' };
    } catch (error) {
      console.error('Failed to reset installation status:', error);
      return { success: false, message: `Failed to reset: ${error}` };
    }
  }

  /**
   * Load default config from frontend source - makes it extensible without backend changes
   */
  private async getDefaultConfig(applicationsPath: string, wwwPath: string): Promise<SonnaConfig> {
    return {
      version: "1.0.0",
      installPath: this.sonnaPath,
      wwwPath: wwwPath,
      services: {
        php: {
          versions: {
            "8.4.8": {
              name: "php",
              displayName: "PHP 8.4",
              version: "8.4.8",
              downloadUrl: "https://windows.php.net/downloads/releases/php-8.4.8-Win32-vs17-x64.zip",
              extractPath: path.join(applicationsPath, 'php/8.4'),
              executable: "php.exe",
              configFile: "php.ini",
              installed: false,
              running: false,
              isDefault: true
            },
            "8.3.22": {
              name: "php",
              displayName: "PHP 8.3",
              version: "8.3.0",
              downloadUrl: "https://windows.php.net/downloads/releases/php-8.3.22-Win32-vs16-x64.zip",
              extractPath: path.join(applicationsPath, 'php/8.3.0'),
              executable: "php.exe",
              configFile: "php.ini",
              installed: false,
              running: false
            },
            "8.2.28": {
              name: "php",
              displayName: "PHP 8.2",
              version: "8.2.15",
              downloadUrl: "https://windows.php.net/downloads/releases/php-8.2.28-Win32-vs16-x64.zip",
              extractPath: path.join(applicationsPath, 'php/8.2.15'),
              executable: "php.exe",
              configFile: "php.ini",
              installed: false,
              running: false
            },
            "7.4 latest": {
              name: "php",
              displayName: "PHP 7.4",
              version: "7.4",
              downloadUrl: "https://windows.php.net/downloads/releases/latest/php-7.4-Win32-vc15-x64-latest.zip",
              extractPath: path.join(applicationsPath, 'php/7.4'),
              executable: "php.exe",
              configFile: "php.ini",
              installed: false,
              running: false
            }
          },
          current: "8.3.0"
        },
        nodejs: {
          versions: {
            "20.11.0": {
              name: "nodejs",
              displayName: "Node.js 20",
              version: "20.11.0",
              downloadUrl: "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip",
              extractPath: path.join(applicationsPath, 'nodejs/20.11.0'),
              executable: "node.exe",
              installed: false,
              running: false,
              isDefault: true
            },
            "18.19.0": {
              name: "nodejs",
              displayName: "Node.js 18",
              version: "18.19.0",
              downloadUrl: "https://nodejs.org/dist/v18.19.0/node-v18.19.0-win-x64.zip",
              extractPath: path.join(applicationsPath, 'nodejs/18.19.0'),
              executable: "node.exe",
              installed: false,
              running: false
            },
            "16.20.2": {
              name: "nodejs",
              displayName: "Node.js 16",
              version: "16.20.2",
              downloadUrl: "https://nodejs.org/dist/v16.20.2/node-v16.20.2-win-x64.zip",
              extractPath: path.join(applicationsPath, 'nodejs/16.20.2'),
              executable: "node.exe",
              installed: false,
              running: false
            },
            "14.21.3": {
              name: "nodejs",
              displayName: "Node.js 14",
              version: "14.21.3",
              downloadUrl: "https://nodejs.org/dist/v14.21.3/node-v14.21.3-win-x64.zip",
              extractPath: path.join(applicationsPath, 'nodejs/14.21.3'),
              executable: "node.exe",
              installed: false,
              running: false
            }
          },
          current: "20.11.0"
        },
        apache: {
          name: "apache",
          displayName: "Apache",
          version: "2.4.63",
          downloadUrl: "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip",
          extractPath: path.join(applicationsPath, 'apache'),
          executable: "bin/httpd.exe",
          configFile: "conf/httpd.conf",
          port: 80,
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
          configFile: "conf/nginx.conf",
          port: 8080,
          installed: false,
          running: false
        },
        mysql: {
          name: "mysql",
          displayName: "MySQL",
          version: "9.3.0",
          downloadUrl: "https://cdn.mysql.com/Downloads/MySQL-9.3/mysql-9.3.0-winx64.zip",
          extractPath: path.join(applicationsPath, 'mysql'),
          executable: "bin/mysqld.exe",
          configFile: "my.ini",
          port: 3306,
          installed: false,
          running: false
        },
        mongodb: {
          name: "mongodb",
          displayName: "MongoDB",
          version: "7.0.4",
          downloadUrl: "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.4.zip",
          extractPath: path.join(applicationsPath, 'mongodb'),
          executable: "bin/mongod.exe",
          configFile: "mongod.conf",
          port: 27017,
          installed: false,
          running: false
        },
        redis: {
          name: "redis",
          displayName: "Redis",
          version: "5.0.14",
          downloadUrl: "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip",
          extractPath: path.join(applicationsPath, 'redis'),
          executable: "redis-server.exe",
          configFile: "redis.conf",
          port: 6379,
          installed: false,
          running: false
        },
        phpmyadmin: {
          name: "phpmyadmin",
          displayName: "phpMyAdmin",
          version: "5.2.1",
          downloadUrl: "https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip",
          extractPath: path.join(applicationsPath, 'phpmyadmin'),
          executable: "",
          configFile: "config.inc.php",
          installed: false,
          running: false
        }
      },
      settings: {
        autoStart: [],
        defaultPHPVersion: "8.3.0",
        defaultNodeVersion: "20.11.0",
        defaultPort: 80
      },
      projectSettings: {}
    };
  }

  /**
   * Find templates directory with multiple fallback paths
   */
  private findTemplatesDirectory(): string {
    const possiblePaths = [
      // Development path
      typeof __dirname !== 'undefined' ? path.join(__dirname, 'config-templates') : null,
      // Production paths
      path.join(process.cwd(), 'electron/utils/config-templates'),
      path.join(process.resourcesPath || '', 'electron/utils/config-templates'),
      path.join(process.resourcesPath || '', 'app/electron/utils/config-templates'),
      // Build output path
      path.join(process.cwd(), 'dist-electron/utils/config-templates'),
      // Absolute fallback
      'electron/utils/config-templates'
    ].filter(Boolean) as string[];

    for (const templatePath of possiblePaths) {
      try {
        const testFile = path.join(templatePath, 'default-index.html');
        if (fs.existsSync(testFile)) {
          console.log(`Found templates directory at: ${templatePath}`);
          return templatePath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    // If none found, use first available path as fallback
    const fallbackPath = possiblePaths[0] || 'electron/utils/config-templates';
    console.warn(`Templates directory not found, using fallback: ${fallbackPath}`);
    return fallbackPath;
  }

  /**
   * Load template content from external file
   */
  private loadTemplate(fileName: string): string {
    try {
      const templatesDir = this.findTemplatesDirectory();
      const filePath = path.join(templatesDir, fileName);
      
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      } else {
        console.warn(`Template file not found: ${filePath}, using fallback`);
        return this.getFallbackIndexHtml();
      }
    } catch (error) {
      console.error(`Failed to load template ${fileName}:`, error);
      return this.getFallbackIndexHtml();
    }
  }

  /**
   * Get default index HTML from external template
   */
  private getDefaultIndexHtml(): string {
    return this.loadTemplate('default-index.html');
  }

  /**
   * Fallback HTML content if template loading fails
   */
  private getFallbackIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello Sonna</title>
    <style>
        :root {
            --background: 0 0% 3.9%;
            --foreground: 0 0% 98%;
            --card: 0 0% 9%;
            --card-foreground: 0 0% 98%;
            --border: 0 0% 14.9%;
            --primary: 221.2 83.2% 53.3%;
            --muted: 0 0% 63.9%;
        }
        
        * { box-sizing: border-box; }
        
        body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            text-align: center;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            padding: 2.5rem 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
        }
        
        h1 {
            color: hsl(var(--foreground));
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        .emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        p {
            color: hsl(var(--muted));
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .version {
            background: hsl(var(--primary) / 0.1);
            border: 1px solid hsl(var(--primary) / 0.2);
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1.5rem;
            color: hsl(var(--primary));
            font-size: 0.95rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="emoji">🚀</span>
        <h1>Hello Sonna!</h1>
        <p>Welcome to your local development environment. Sonna is now running and ready to serve your web projects.</p>
        <div class="version">
            <strong>Sonna v1.4.0</strong> - Enhanced Stability & Performance Optimization
        </div>
    </div>
</body>
</html>`;
  }
} 