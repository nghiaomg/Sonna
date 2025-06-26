import type { SonnaConfig } from '../types/config';
import { SonnaPaths, ServicePaths, DEFAULT_PORTS } from '../../electron/utils/constants';

export type { SonnaConfig } from '../../electron/utils/config-manager';

export const DEFAULT_CONFIG: SonnaConfig = {
  version: "1.3.0",
  installPath: SonnaPaths.BASE_PATH,
  wwwPath: SonnaPaths.WWW_PATH,
  services: {
    php: {
      versions: {
        "8.4.8": {
          name: "php",
          displayName: "PHP 8.4",
          version: "8.4.8",
          downloadUrl: "https://windows.php.net/downloads/releases/php-8.4.8-Win32-vs17-x64.zip",
          extractPath: ServicePaths.getPhpPath("8.4"),
          executable: "php.exe",
          configFile: "php.ini",
          installed: false,
          running: false,
          isDefault: true
        }
      },
      current: "8.4.8"
    },
    nodejs: {
      versions: {},
      current: "20.11.0"
    },
    apache: {
      name: "apache",
      displayName: "Apache",
      version: "2.4.63",
      downloadUrl: "",
      extractPath: ServicePaths.APACHE_PATH,
      executable: "bin/httpd.exe",
      configFile: "conf/httpd.conf",
      port: DEFAULT_PORTS.APACHE,
      installed: false,
      running: false
    },
    nginx: {
      name: "nginx",
      displayName: "Nginx",
      version: "1.24.0",
      downloadUrl: "",
      extractPath: ServicePaths.NGINX_PATH,
      executable: "nginx.exe",
      configFile: "conf/nginx.conf",
      port: DEFAULT_PORTS.NGINX,
      installed: false,
      running: false
    },
    mysql: {
      name: "mysql",
      displayName: "MySQL",
      version: "9.3.0",
      downloadUrl: "",
      extractPath: ServicePaths.MYSQL_PATH,
      executable: "bin/mysqld.exe",
      configFile: "my.ini",
      port: DEFAULT_PORTS.MYSQL,
      installed: false,
      running: false
    },
    mongodb: {
      name: "mongodb",
      displayName: "MongoDB",
      version: "7.0.4",
      downloadUrl: "",
      extractPath: ServicePaths.MONGODB_PATH,
      executable: "bin/mongod.exe",
      configFile: "mongod.conf",
      port: DEFAULT_PORTS.MONGODB,
      installed: false,
      running: false
    },
    phpmyadmin: {
      name: "phpmyadmin",
      displayName: "phpMyAdmin",
      version: "5.2.1",
      downloadUrl: "",
      extractPath: ServicePaths.PHPMYADMIN_PATH,
      executable: "",
      configFile: "config.inc.php",
      installed: false,
      running: false
    },
    redis: {
      name: "redis",
      displayName: "Redis",
      version: "5.0.14",
      downloadUrl: "",
      extractPath: ServicePaths.REDIS_PATH,
      executable: "redis-server.exe",
      configFile: "redis.conf",
      port: DEFAULT_PORTS.REDIS,
      installed: false,
      running: false
    }
  },
  settings: {
    autoStart: [],
    defaultPHPVersion: "8.4.8",
    defaultNodeVersion: "20.11.0",
    defaultPort: DEFAULT_PORTS.APACHE
  },
  projectSettings: {}
}; 