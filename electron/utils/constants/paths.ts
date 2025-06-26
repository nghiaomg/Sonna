/**
 * Sonna Path Constants
 * Centralized path management for easy configuration changes
 */

export class SonnaPaths {
  private static _basePath: string = 'C:/sonna';

  /**
   * Get current base installation path
   */
  static get BASE_PATH(): string {
    return this._basePath;
  }

  /**
   * Set base installation path (when user changes it)
   */
  static setBasePath(newPath: string): void {
    this._basePath = newPath.replace(/\\/g, '/');
  }

  /**
   * Applications directory (where services are installed)
   */
  static get APPLICATIONS_PATH(): string {
    return `${this.BASE_PATH}/applications`;
  }

  /**
   * WWW directory (web root for projects)
   */
  static get WWW_PATH(): string {
    return `${this.BASE_PATH}/www`;
  }

  /**
   * Downloads directory (temporary downloads)
   */
  static get DOWNLOADS_PATH(): string {
    return `${this.BASE_PATH}/downloads`;
  }

  /**
   * Configuration directory
   */
  static get CONFIG_PATH(): string {
    return `${this.BASE_PATH}/conf`;
  }

  /**
   * Data directory (databases, logs, etc.)
   */
  static get DATA_PATH(): string {
    return `${this.BASE_PATH}/data`;
  }

  /**
   * Temporary directory
   */
  static get TEMP_PATH(): string {
    return `${this.BASE_PATH}/tmp`;
  }

  /**
   * Backups directory
   */
  static get BACKUPS_PATH(): string {
    return `${this.BASE_PATH}/backups`;
  }

  /**
   * Main config file path
   */
  static get CONFIG_FILE(): string {
    return `${this.BASE_PATH}/config.json`;
  }
}

/**
 * Service-specific path constants
 */
export class ServicePaths {
  /**
   * Apache paths
   */
  static get APACHE_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/apache`;
  }

  static get APACHE_HTDOCS(): string {
    return `${this.APACHE_PATH}/Apache24/htdocs`;
  }

  static get APACHE_CONFIG(): string {
    return `${this.APACHE_PATH}/Apache24/conf/httpd.conf`;
  }

  static get APACHE_EXECUTABLE(): string {
    return `${this.APACHE_PATH}/Apache24/bin/httpd.exe`;
  }

  /**
   * Nginx paths
   */
  static get NGINX_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/nginx`;
  }

  static get NGINX_CONFIG(): string {
    return `${this.NGINX_PATH}/conf/nginx.conf`;
  }

  static get NGINX_EXECUTABLE(): string {
    return `${this.NGINX_PATH}/nginx.exe`;
  }

  /**
   * MySQL paths
   */
  static get MYSQL_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/mysql`;
  }

  static get MYSQL_CONFIG(): string {
    return `${this.MYSQL_PATH}/my.ini`;
  }

  static get MYSQL_EXECUTABLE(): string {
    return `${this.MYSQL_PATH}/bin/mysqld.exe`;
  }

  static get MYSQL_DATA(): string {
    return `${SonnaPaths.DATA_PATH}/mysql`;
  }

  /**
   * Redis paths
   */
  static get REDIS_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/redis`;
  }

  static get REDIS_CONFIG(): string {
    return `${this.REDIS_PATH}/redis.conf`;
  }

  static get REDIS_EXECUTABLE(): string {
    return `${this.REDIS_PATH}/redis-server.exe`;
  }

  static get REDIS_DATA(): string {
    return `${SonnaPaths.DATA_PATH}/redis`;
  }

  /**
   * MongoDB paths
   */
  static get MONGODB_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/mongodb`;
  }

  static get MONGODB_CONFIG(): string {
    return `${this.MONGODB_PATH}/mongod.conf`;
  }

  static get MONGODB_EXECUTABLE(): string {
    return `${this.MONGODB_PATH}/bin/mongod.exe`;
  }

  static get MONGODB_DATA(): string {
    return `${SonnaPaths.DATA_PATH}/mongodb`;
  }

  /**
   * phpMyAdmin paths
   */
  static get PHPMYADMIN_PATH(): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/phpmyadmin`;
  }

  static get PHPMYADMIN_CONFIG(): string {
    return `${this.PHPMYADMIN_PATH}/config.inc.php`;
  }

  /**
   * PHP paths (versioned)
   */
  static getPhpPath(version: string): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/php/${version}`;
  }

  static getPhpExecutable(version: string): string {
    return `${this.getPhpPath(version)}/php.exe`;
  }

  static getPhpConfig(version: string): string {
    return `${this.getPhpPath(version)}/php.ini`;
  }

  static getPhpDll(version: string): string {
    const phpPath = this.getPhpPath(version);
    const majorVersion = version.split('.')[0];

    // Primary DLL name based on major version
    const primaryDll = majorVersion === '7' ? 'php7apache2_4.dll' : 'php8apache2_4.dll';
    const primaryPath = `${phpPath}/${primaryDll}`;

    // Check if primary DLL exists
    try {
      const fs = require('fs');
      if (fs.existsSync(primaryPath)) {
        return primaryPath;
      }

      // Fallback: scan for any Apache DLL files
      const dllFiles = fs.readdirSync(phpPath).filter((file: string) =>
        file.includes('apache') && file.endsWith('.dll')
      );

      if (dllFiles.length > 0) {
        console.log(`Found alternative PHP Apache DLL: ${dllFiles[0]}`);
        return `${phpPath}/${dllFiles[0]}`;
      }

    } catch (error) {
      // If directory doesn't exist or other error, fall back to primary
    }

    // Return primary path even if it doesn't exist (for consistency)
    return primaryPath;
  }

  /**
   * Node.js paths (versioned)
   */
  static getNodePath(version: string): string {
    return `${SonnaPaths.APPLICATIONS_PATH}/nodejs/${version}`;
  }

  static getNodeExecutable(version: string): string {
    return `${this.getNodePath(version)}/node.exe`;
  }
}

/**
 * Template and configuration paths
 */
export class ConfigPaths {
  /**
   * Templates directory
   */
  static get TEMPLATES_PATH(): string {
    return `${SonnaPaths.CONFIG_PATH}/templates`;
  }

  /**
   * Generated config files
   */
  static get APACHE_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/apache/httpd.conf`;
  }

  static get NGINX_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/nginx/nginx.conf`;
  }

  static get MYSQL_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/mysql/my.cnf`;
  }

  static get REDIS_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/redis/redis.conf`;
  }

  static get PHP_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/php`;
  }

  static get PHPMYADMIN_CONFIG_OUTPUT(): string {
    return `${SonnaPaths.CONFIG_PATH}/phpmyadmin`;
  }
}

/**
 * Well-known PHP versions for scanning
 */
export const PHP_VERSIONS = [
  '8.4', '8.3', '8.2', '8.1', '8.0', '7.4'
] as const;

/**
 * Well-known Node.js versions for scanning
 */
export const NODEJS_VERSIONS = [
  '20', '18', '16'
] as const;

/**
 * Default ports
 */
export const DEFAULT_PORTS = {
  APACHE: 80,
  NGINX: 8080,
  MYSQL: 3306,
  MONGODB: 27017,
  REDIS: 6379
} as const;

/**
 * Utility functions for path operations
 */
export class PathUtils {
  /**
   * Convert Windows path to Unix-style for configs
   */
  static toUnixPath(windowsPath: string): string {
    return windowsPath.replace(/\\/g, '/');
  }

  /**
   * Convert Unix path to Windows-style
   */
  static toWindowsPath(unixPath: string): string {
    return unixPath.replace(/\//g, '\\');
  }

  /**
   * Ensure path ends with trailing slash/backslash
   */
  static ensureTrailingSlash(path: string, isWindows: boolean = true): string {
    const separator = isWindows ? '\\' : '/';
    return path.endsWith(separator) ? path : path + separator;
  }

  /**
   * Join paths safely
   */
  static join(...paths: string[]): string {
    return paths.join('/').replace(/\/+/g, '/');
  }
} 