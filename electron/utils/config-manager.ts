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

      // Create default index.html if not exists
      const indexHtmlPath = path.join(wwwPath, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) {
        const defaultIndexContent = this.getDefaultIndexHtml();
        fs.writeFileSync(indexHtmlPath, defaultIndexContent, 'utf8');
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

  private getDefaultIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello Sonna</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        }
        h1 {
            color: #333;
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        .emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
        }
        p {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 2rem;
        }
        .feature {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 10px;
            font-size: 0.9rem;
            color: #495057;
        }
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="emoji">🚀</span>
        <h1>Hello Sonna!</h1>
        <p>Welcome to your local development environment. Sonna is now running and ready to serve your web projects from <code>C:/sonna/www</code>.</p>
        
        <div class="features">
            <div class="feature">
                <strong>🌐 Web Server</strong><br>
                Apache/Nginx ready
            </div>
            <div class="feature">
                <strong>💾 Database</strong><br>
                MySQL/MongoDB support
            </div>
            <div class="feature">
                <strong>🐘 PHP</strong><br>
                Modern PHP versions
            </div>
            <div class="feature">
                <strong>⚡ Fast</strong><br>
                Optimized for speed
            </div>
        </div>
        
        <div class="footer">
            Sonna - Modern Local Development Environment
        </div>
    </div>
</body>
</html>`;
  }
} 