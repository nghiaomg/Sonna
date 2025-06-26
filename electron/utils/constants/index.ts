/**
 * Sonna Constants - Centralized Configuration
 * 
 * This module provides centralized path management and configuration constants
 * for the Sonna local development environment.
 */

export {
  SonnaPaths,
  ServicePaths,
  ConfigPaths,
  PathUtils,
  PHP_VERSIONS,
  NODEJS_VERSIONS,
  DEFAULT_PORTS
} from './paths';

/**
 * Initialize paths with user-configured base path
 * Call this when the application starts or when user changes installation path
 */
export function initializePaths(basePath?: string): void {
  if (basePath) {
    const { SonnaPaths } = require('./paths');
    SonnaPaths.setBasePath(basePath);
    console.log(`Sonna paths initialized with base: ${basePath}`);
  }
}

/**
 * Get all current paths for debugging/logging
 */
export function getAllPaths() {
  const { SonnaPaths, ServicePaths, ConfigPaths } = require('./paths');
  
  return {
    base: {
      BASE_PATH: SonnaPaths.BASE_PATH,
      APPLICATIONS_PATH: SonnaPaths.APPLICATIONS_PATH,
      WWW_PATH: SonnaPaths.WWW_PATH,
      DOWNLOADS_PATH: SonnaPaths.DOWNLOADS_PATH,
      CONFIG_PATH: SonnaPaths.CONFIG_PATH,
      DATA_PATH: SonnaPaths.DATA_PATH,
      TEMP_PATH: SonnaPaths.TEMP_PATH,
      BACKUPS_PATH: SonnaPaths.BACKUPS_PATH,
      CONFIG_FILE: SonnaPaths.CONFIG_FILE
    },
    services: {
      APACHE_PATH: ServicePaths.APACHE_PATH,
      NGINX_PATH: ServicePaths.NGINX_PATH,
      MYSQL_PATH: ServicePaths.MYSQL_PATH,
      REDIS_PATH: ServicePaths.REDIS_PATH,
      MONGODB_PATH: ServicePaths.MONGODB_PATH,
      PHPMYADMIN_PATH: ServicePaths.PHPMYADMIN_PATH
    },
    configs: {
      APACHE_CONFIG_OUTPUT: ConfigPaths.APACHE_CONFIG_OUTPUT,
      NGINX_CONFIG_OUTPUT: ConfigPaths.NGINX_CONFIG_OUTPUT,
      MYSQL_CONFIG_OUTPUT: ConfigPaths.MYSQL_CONFIG_OUTPUT,
      REDIS_CONFIG_OUTPUT: ConfigPaths.REDIS_CONFIG_OUTPUT,
      PHP_CONFIG_OUTPUT: ConfigPaths.PHP_CONFIG_OUTPUT,
      PHPMYADMIN_CONFIG_OUTPUT: ConfigPaths.PHPMYADMIN_CONFIG_OUTPUT
    }
  };
} 