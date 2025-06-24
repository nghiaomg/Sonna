import type { SonnaConfig } from '../types/config';

export const DEFAULT_CONFIG: SonnaConfig = {
  version: "1.0.0",
  installPath: "C:/sonna",
  wwwPath: "C:/sonna/www",
  services: {
    php: {
      name: "php",
      displayName: "PHP",
      version: "8.3.0",
      downloadUrl: "https://windows.php.net/downloads/releases/php-8.3.0-Win32-vs16-x64.zip",
      extractPath: "C:/sonna/applications/php",
      executable: "php.exe",
      configFile: "php.ini",
      installed: false,
      running: false
    },
    nodejs: {
      name: "nodejs",
      displayName: "Node.js",
      version: "20.11.0",
      downloadUrl: "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip",
      extractPath: "C:/sonna/applications/nodejs",
      executable: "node.exe",
      installed: false,
      running: false
    },
    apache: {
      name: "apache",
      displayName: "Apache",
      version: "2.4.63",
      downloadUrl: "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip",
      extractPath: "C:/sonna/applications/apache",
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
      extractPath: "C:/sonna/applications/nginx",
      executable: "nginx.exe",
      configFile: "conf/nginx.conf",
      port: 8080,
      installed: false,
      running: false
    },
    mysql: {
      name: "mysql",
      displayName: "MySQL",
      version: "8.0.35",
      downloadUrl: "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.35-winx64.zip",
      extractPath: "C:/sonna/applications/mysql",
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
      extractPath: "C:/sonna/applications/mongodb",
      executable: "bin/mongod.exe",
      configFile: "mongod.conf",
      port: 27017,
      installed: false,
      running: false
    },
    phpmyadmin: {
      name: "phpmyadmin",
      displayName: "phpMyAdmin",
      version: "5.2.1",
      downloadUrl: "https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip",
      extractPath: "C:/sonna/www/phpmyadmin",
      executable: "",
      configFile: "config.inc.php",
      installed: false,
      running: false
    },
    redis: {
      name: "redis",
      displayName: "Redis",
      version: "5.0.14",
      downloadUrl: "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip",
      extractPath: "C:/sonna/applications/redis",
      executable: "redis-server.exe",
      configFile: "redis.conf",
      port: 6379,
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