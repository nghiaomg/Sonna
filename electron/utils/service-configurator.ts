import * as fs from 'fs';
import * as path from 'path';

export class ServiceConfigurator {
  
  async setupService(serviceName: string, service: any): Promise<void> {
    try {
      console.log(`Setting up ${serviceName}...`);
      
      const extractPath = service.extractPath;
      
      switch (serviceName) {
        case 'php':
          await this.setupPHP(extractPath);
          break;
        case 'apache':
          await this.setupApache(extractPath);
          break;
        case 'mysql':
          await this.setupMySQL(extractPath);
          break;
        case 'nginx':
          await this.setupNginx(extractPath);
          break;
        case 'redis':
          await this.setupRedis(extractPath);
          break;
        case 'nodejs':
          await this.setupNodeJS(extractPath);
          break;
        case 'phpmyadmin':
          await this.setupPhpMyAdmin(extractPath);
          break;
        default:
          console.log(`No specific setup required for ${serviceName}`);
      }
    } catch (error) {
      console.error(`Failed to setup ${serviceName}:`, error);
      throw error;
    }
  }

  private async setupPHP(extractPath: string): Promise<void> {
    const phpIniPath = path.join(extractPath, 'php.ini');
    const phpIniDevPath = path.join(extractPath, 'php.ini-development');
    
    // Copy php.ini-development to php.ini if it doesn't exist
    if (!fs.existsSync(phpIniPath) && fs.existsSync(phpIniDevPath)) {
      fs.copyFileSync(phpIniDevPath, phpIniPath);
    }
    
    // Basic PHP configuration
    if (fs.existsSync(phpIniPath)) {
      let phpIni = fs.readFileSync(phpIniPath, 'utf8');
      
      // Enable common extensions
      phpIni = phpIni.replace(/;extension=curl/g, 'extension=curl');
      phpIni = phpIni.replace(/;extension=mbstring/g, 'extension=mbstring');
      phpIni = phpIni.replace(/;extension=openssl/g, 'extension=openssl');
      phpIni = phpIni.replace(/;extension=pdo_mysql/g, 'extension=pdo_mysql');
      phpIni = phpIni.replace(/;extension=mysqli/g, 'extension=mysqli');
      phpIni = phpIni.replace(/;extension=gd/g, 'extension=gd');
      phpIni = phpIni.replace(/;extension=zip/g, 'extension=zip');
      
      // Set timezone
      phpIni = phpIni.replace(/;date.timezone\s*=/g, 'date.timezone = Asia/Ho_Chi_Minh');
      
      // Enable error reporting for development
      phpIni = phpIni.replace(/display_errors = Off/g, 'display_errors = On');
      phpIni = phpIni.replace(/error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT/g, 'error_reporting = E_ALL');
      
      fs.writeFileSync(phpIniPath, phpIni);
    }
  }

  private async setupApache(extractPath: string): Promise<void> {
    const httpdConfPath = path.join(extractPath, 'conf', 'httpd.conf');
    
    if (fs.existsSync(httpdConfPath)) {
      let httpdConf = fs.readFileSync(httpdConfPath, 'utf8');
      
      // Update server root and document root
      httpdConf = httpdConf.replace(/ServerRoot ".*"/g, `ServerRoot "${extractPath.replace(/\\/g, '/')}"`);
      httpdConf = httpdConf.replace(/DocumentRoot ".*"/g, 'DocumentRoot "C:/sonna/www"');
      httpdConf = httpdConf.replace(/<Directory ".*">/g, '<Directory "C:/sonna/www">');
      
      // Enable common modules
      httpdConf = httpdConf.replace(/#LoadModule rewrite_module/g, 'LoadModule rewrite_module');
      httpdConf = httpdConf.replace(/#LoadModule ssl_module/g, 'LoadModule ssl_module');
      
      // Set ServerName to avoid warnings
      if (!httpdConf.includes('ServerName')) {
        httpdConf += '\nServerName localhost:80\n';
      }
      
      // Enable .htaccess
      httpdConf = httpdConf.replace(/AllowOverride None/g, 'AllowOverride All');
      
      fs.writeFileSync(httpdConfPath, httpdConf);
    }
  }

  private async setupMySQL(extractPath: string): Promise<void> {
    const myIniPath = path.join(extractPath, 'my.ini');
    
    // Create basic MySQL configuration
    const myIniContent = `[mysqld]
basedir="${extractPath.replace(/\\/g, '/')}"
datadir="${extractPath.replace(/\\/g, '/')}/data"
port=3306
socket=/tmp/mysql.sock

# InnoDB Settings
default-storage-engine=INNODB
innodb_buffer_pool_size=256M
innodb_log_file_size=64M
innodb_file_per_table=1

# Character Set
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# Logging
general_log=1
general_log_file="${extractPath.replace(/\\/g, '/')}/logs/mysql.log"
log-error="${extractPath.replace(/\\/g, '/')}/logs/error.log"
slow_query_log=1
slow_query_log_file="${extractPath.replace(/\\/g, '/')}/logs/slow.log"

[mysql]
default-character-set=utf8mb4

[client]
default-character-set=utf8mb4
port=3306
socket=/tmp/mysql.sock`;

    fs.writeFileSync(myIniPath, myIniContent);
    
    // Create necessary directories
    const dataDir = path.join(extractPath, 'data');
    const logsDir = path.join(extractPath, 'logs');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private async setupNginx(extractPath: string): Promise<void> {
    const nginxConfPath = path.join(extractPath, 'conf', 'nginx.conf');
    
    if (fs.existsSync(nginxConfPath)) {
      let nginxConf = fs.readFileSync(nginxConfPath, 'utf8');
      
      // Update root directory
      nginxConf = nginxConf.replace(/root\s+html;/g, 'root C:/sonna/www;');
      nginxConf = nginxConf.replace(/listen\s+80;/g, 'listen 8080;');
      
      // Add PHP support
      const phpLocation = `
    location ~ \\.php$ {
        root           C:/sonna/www;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }`;
      
      if (!nginxConf.includes('location ~ \\.php$')) {
        nginxConf = nginxConf.replace(/location \/ {[^}]*}/g, 
          `location / {
            root   C:/sonna/www;
            index  index.html index.htm index.php;
            try_files $uri $uri/ =404;
        }
        
        ${phpLocation}`);
      }
      
      fs.writeFileSync(nginxConfPath, nginxConf);
    }
  }

  private async setupRedis(extractPath: string): Promise<void> {
    const redisConfPath = path.join(extractPath, 'redis.conf');
    
    // Create basic Redis configuration
    const redisConfContent = `# Redis Configuration for Sonna
port 6379
bind 127.0.0.1
dir "${extractPath.replace(/\\/g, '/')}"

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile "${extractPath.replace(/\\/g, '/')}/redis.log"

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Security
# requirepass yourpasswordhere

# Append only file
appendonly yes
appendfilename "appendonly.aof"`;

    fs.writeFileSync(redisConfPath, redisConfContent);
  }

  private async setupNodeJS(extractPath: string): Promise<void> {
    // Node.js typically doesn't need special configuration
    // Just ensure npm is available and set up basic directories
    
    const nodeModulesPath = path.join(extractPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      fs.mkdirSync(nodeModulesPath, { recursive: true });
    }
    
    console.log('Node.js setup completed');
  }

  private async setupPhpMyAdmin(extractPath: string): Promise<void> {
    const configPath = path.join(extractPath, 'config.inc.php');
    
    // Create basic phpMyAdmin configuration
    const configContent = `<?php
/**
 * phpMyAdmin configuration for Sonna
 */

// Servers configuration
$i = 0;

// Server 1 (MySQL)
$i++;
$cfg['Servers'][$i]['verbose'] = 'MySQL';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = 3306;
$cfg['Servers'][$i]['socket'] = '';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['user'] = '';
$cfg['Servers'][$i]['password'] = '';

// Global settings
$cfg['blowfish_secret'] = '${this.generateBlowfishSecret()}';
$cfg['DefaultLang'] = 'en';
$cfg['ServerDefault'] = 1;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';

// Theme
$cfg['ThemeDefault'] = 'pmahomme';

// Security
$cfg['AllowArbitraryServer'] = false;
$cfg['LoginCookieValidity'] = 1440;
?>`;

    fs.writeFileSync(configPath, configContent);
  }

  private generateBlowfishSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
} 