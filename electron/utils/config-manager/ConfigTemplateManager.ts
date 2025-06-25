import * as fs from 'fs';
import * as path from 'path';

export interface ConfigTemplateVariables {
  [key: string]: string | number;
}

export class ConfigTemplateManager {
  private outputDir: string;

  constructor() {
    this.outputDir = 'C:/sonna/conf';
  }

  /**
   * Initialize config directory
   */
  async initialize(): Promise<void> {
    try {
      // Create main conf directory
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Create service-specific subdirectories
      const subDirs = ['apache', 'nginx', 'mysql', 'redis', 'php', 'phpmyadmin', 'backups'];
      for (const subDir of subDirs) {
        const dirPath = path.join(this.outputDir, subDir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      console.log('Config directory structure initialized at C:/sonna/conf');
    } catch (error) {
      console.error('Failed to initialize config directory:', error);
      throw error;
    }
  }

  /**
   * Generate Apache configuration
   */
  async generateApacheConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.getApacheTemplate();
    const config = this.replaceVariables(template, {
      APACHE_ROOT: variables.APACHE_ROOT || 'C:/sonna/applications/apache/Apache24',
      APACHE_PORT: variables.APACHE_PORT || 80,
      PHP_MODULE_CONFIG: variables.PHP_MODULE_CONFIG || '# PHP not configured',
      PHPMYADMIN_CONFIG: variables.PHPMYADMIN_CONFIG || '# phpMyAdmin not configured',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'apache', 'httpd.conf');
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Apache config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate Nginx configuration
   */
  async generateNginxConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.getNginxTemplate();
    const config = this.replaceVariables(template, {
      NGINX_PORT: variables.NGINX_PORT || 8080,
      PHP_FASTCGI_CONFIG: variables.PHP_FASTCGI_CONFIG || '# PHP not configured',
      PHPMYADMIN_CONFIG: variables.PHPMYADMIN_CONFIG || '# phpMyAdmin not configured',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'nginx', 'nginx.conf');
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Nginx config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate MySQL configuration
   */
  async generateMySQLConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.getMySQLTemplate();
    const config = this.replaceVariables(template, {
      MYSQL_PORT: variables.MYSQL_PORT || 3306,
      MYSQL_BASEDIR: variables.MYSQL_BASEDIR || 'C:/sonna/applications/mysql',
      MYSQL_DATADIR: variables.MYSQL_DATADIR || 'C:/sonna/data/mysql',
      MYSQL_TMPDIR: variables.MYSQL_TMPDIR || 'C:/sonna/tmp',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'mysql', 'my.cnf');
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`MySQL config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate Redis configuration
   */
  async generateRedisConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.getRedisTemplate();
    const config = this.replaceVariables(template, {
      REDIS_PORT: variables.REDIS_PORT || 6379,
      REDIS_DATADIR: variables.REDIS_DATADIR || 'C:/sonna/data/redis',
      REDIS_PASSWORD: variables.REDIS_PASSWORD || '',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'redis', 'redis.conf');
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Redis config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate PHP configuration snippets
   */
  async generatePHPConfig(phpPath: string, phpVersion: string): Promise<{
    apacheModule: string;
    nginxFastCGI: string;
  }> {
    const phpDllName = this.getPHPDllName(phpVersion);
    
    const apacheModule = `
# PHP ${phpVersion} Configuration
LoadModule php_module "${phpPath.replace(/\\/g, '/')}/${phpDllName}"
AddType application/x-httpd-php .php
PHPIniDir "${phpPath.replace(/\\/g, '/')}/"

# Set index.php as directory index
DirectoryIndex index.html index.htm index.php`;

    const nginxFastCGI = `
# PHP ${phpVersion} FastCGI Configuration
location ~ \\.php$ {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
    include        fastcgi_params;
}`;

    // Save PHP configs
    const phpConfigDir = path.join(this.outputDir, 'php');
    fs.writeFileSync(path.join(phpConfigDir, 'apache-module.conf'), apacheModule, 'utf8');
    fs.writeFileSync(path.join(phpConfigDir, 'nginx-fastcgi.conf'), nginxFastCGI, 'utf8');

    return { apacheModule, nginxFastCGI };
  }

  /**
   * Generate phpMyAdmin configuration snippets
   */
  async generatePhpMyAdminConfig(phpMyAdminPath: string): Promise<{
    apache: string;
    nginx: string;
  }> {
    const apache = `
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminPath.replace(/\\/g, '/')}"

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.php
</Directory>

# Security for phpMyAdmin
<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/libraries">
    Require all denied
</Directory>

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/setup/lib">
    Require all denied
</Directory>`;

    const nginx = `
# phpMyAdmin Configuration
location /phpmyadmin {
    alias "${phpMyAdminPath.replace(/\\/g, '/')}";
    index index.php;
    
    location ~ ^/phpmyadmin/(.+\\.php)$ {
        alias "${phpMyAdminPath.replace(/\\/g, '/')}/$1";
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }
    
    location ~* ^/phpmyadmin/(.+\\.(jpg|jpeg|gif|css|png|js|ico|html|xml|txt))$ {
        alias "${phpMyAdminPath.replace(/\\/g, '/')}/$1";
    }
}

# Security for phpMyAdmin
location ~ ^/phpmyadmin/(libraries|setup/lib) {
    deny all;
}`;

    // Save phpMyAdmin configs
    const phpMyAdminConfigDir = path.join(this.outputDir, 'phpmyadmin');
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'apache.conf'), apache, 'utf8');
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'nginx.conf'), nginx, 'utf8');

    return { apache, nginx };
  }

  /**
   * Get config file paths
   */
  getConfigPaths() {
    return {
      apache: path.join(this.outputDir, 'apache', 'httpd.conf'),
      nginx: path.join(this.outputDir, 'nginx', 'nginx.conf'),
      mysql: path.join(this.outputDir, 'mysql', 'my.cnf'),
      redis: path.join(this.outputDir, 'redis', 'redis.conf'),
      php: path.join(this.outputDir, 'php'),
      phpmyadmin: path.join(this.outputDir, 'phpmyadmin')
    };
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: ConfigTemplateVariables): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Get Apache template (embedded)
   */
  private getApacheTemplate(): string {
    return `# Apache Configuration Template for Sonna
# This file will be used to generate Apache httpd.conf

# Basic Server Configuration
ServerRoot "{{APACHE_ROOT}}"
ServerName localhost:{{APACHE_PORT}}
Listen {{APACHE_PORT}}

# Module Loading
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule authz_user_module modules/mod_authz_user.so
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authn_file_module modules/mod_authn_file.so
LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule access_compat_module modules/mod_access_compat.so
LoadModule alias_module modules/mod_alias.so
LoadModule deflate_module modules/mod_deflate.so
LoadModule dir_module modules/mod_dir.so
LoadModule env_module modules/mod_env.so
LoadModule expires_module modules/mod_expires.so
LoadModule headers_module modules/mod_headers.so
LoadModule mime_module modules/mod_mime.so
LoadModule negotiation_module modules/mod_negotiation.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule setenvif_module modules/mod_setenvif.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule log_config_module modules/mod_log_config.so

# PHP Module (will be enabled when PHP is installed)
{{PHP_MODULE_CONFIG}}

# Document Root
DocumentRoot "C:/sonna/www"

# Directory Configuration
<Directory "C:/sonna/www">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html index.htm index.php
</Directory>

# Security Configuration
<Files ".ht*">
    Require all denied
</Files>

<Files "*.ini">
    Require all denied
</Files>

# MIME Types
TypesConfig conf/mime.types

# phpMyAdmin Configuration
{{PHPMYADMIN_CONFIG}}

# Error and Access Logs
ErrorLog logs/error.log
LogLevel warn
LogFormat "%h %l %u %t \\"%r\\" %>s %b \\"%{Referer}i\\" \\"%{User-Agent}i\\"" combined
LogFormat "%h %l %u %t \\"%r\\" %>s %b" common
CustomLog logs/access.log combined

# Server Information
ServerTokens Prod
ServerSignature Off`;
  }

  /**
   * Get Nginx template (embedded)
   */
  private getNginxTemplate(): string {
    return `# Nginx Configuration Template for Sonna

worker_processes auto;
error_log logs/error.log;
pid logs/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log logs/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Default server block
    server {
        listen {{NGINX_PORT}};
        server_name localhost;
        root C:/sonna/www;
        index index.html index.htm index.php;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Main location
        location / {
            try_files $uri $uri/ =404;
        }

        # PHP processing
        {{PHP_FASTCGI_CONFIG}}

        # phpMyAdmin configuration
        {{PHPMYADMIN_CONFIG}}

        # Security: deny access to sensitive files
        location ~ /\\.ht {
            deny all;
        }

        location ~ /\\.env {
            deny all;
        }

        location ~ \\.ini$ {
            deny all;
        }

        # Error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }
}`;
  }

  /**
   * Get MySQL template (embedded)
   */
  private getMySQLTemplate(): string {
    return `# MySQL Configuration Template for Sonna
# Based on MySQL 8.0+ defaults with optimizations for development

[mysqld]
# Basic Settings
port = {{MYSQL_PORT}}
basedir = {{MYSQL_BASEDIR}}
datadir = {{MYSQL_DATADIR}}
tmpdir = {{MYSQL_TMPDIR}}

# Socket and PID (Windows compatible)
pid-file = {{MYSQL_DATADIR}}/mysql.pid

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Connection Settings
max_connections = 151
max_connect_errors = 100000

# Buffer Settings (optimized for development)
innodb_buffer_pool_size = 128M
innodb_log_file_size = 48M
key_buffer_size = 16M
max_allowed_packet = 64M
table_open_cache = 64
sort_buffer_size = 512K
net_buffer_length = 16K
read_buffer_size = 256K
read_rnd_buffer_size = 512K
myisam_sort_buffer_size = 8M

# Logging
log-error = {{MYSQL_DATADIR}}/error.log
general_log = 0
slow_query_log = 0

# Security
local_infile = 0

# SQL Mode
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO

# InnoDB Settings
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
innodb_file_per_table = 1

# Binary Logging (disabled for development)
skip-log-bin

# Performance Schema (reduced for development)
performance_schema = OFF

# Windows specific settings
named_pipe = ON
shared_memory = ON

[mysql]
default-character-set = utf8mb4

[client]
port = {{MYSQL_PORT}}
default-character-set = utf8mb4`;
  }

  /**
   * Get Redis template (embedded)
   */
  private getRedisTemplate(): string {
    return `# Redis Configuration Template for Sonna
# Optimized for development environment

# Network
bind 127.0.0.1
port {{REDIS_PORT}}
timeout 0
tcp-keepalive 300

# General
daemonize no
supervised no
pidfile {{REDIS_DATADIR}}/redis.pid
loglevel notice
logfile {{REDIS_DATADIR}}/redis.log

# Database
databases 16
dir {{REDIS_DATADIR}}

# Snapshotting (development settings)
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# Memory management
maxmemory-policy allkeys-lru

# Append only file (disabled for development)
appendonly no

# Security
requirepass {{REDIS_PASSWORD}}

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# TCP listen backlog
tcp-backlog 511

# Client timeout
timeout 0

# No password warning disabled
protected-mode no`;
  }

  /**
   * Get PHP DLL name based on version
   */
  private getPHPDllName(version: string): string {
    const majorVersion = version.split('.')[0];
    return `php${majorVersion}apache2_4.dll`;
  }

  /**
   * Backup current configs
   */
  async backupConfigs(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.outputDir, 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy all config files to backup
    const configFiles = [
      'apache/httpd.conf',
      'nginx/nginx.conf', 
      'mysql/my.cnf',
      'redis/redis.conf'
    ];

    for (const configFile of configFiles) {
      const sourcePath = path.join(this.outputDir, configFile);
      const backupPath = path.join(backupDir, configFile);
      
      if (fs.existsSync(sourcePath)) {
        const backupFileDir = path.dirname(backupPath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, backupPath);
      }
    }

    console.log(`Configs backed up to: ${backupDir}`);
    return backupDir;
  }
} 