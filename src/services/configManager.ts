import type { ServiceConfig, SonnaConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/config/default-config';

/**
 * Config Manager class for handling configuration operations
 */
export class ConfigManager {
  /**
   * Get Sonna configuration
   */
  static async getSonnaConfig(): Promise<SonnaConfig> {
    if (!window.electronAPI) {
      return DEFAULT_CONFIG as SonnaConfig;
    }
    
    try {
      const configResult = await window.electronAPI.getSonnaConfig();
      if (configResult.success && configResult.config) {
        return configResult.config as SonnaConfig;
      }
      return DEFAULT_CONFIG as SonnaConfig;
    } catch (error) {
      console.error('Failed to load service configurations:', error);
      return DEFAULT_CONFIG as SonnaConfig;
    }
  }

  /**
   * Get services for download manager
   */
  static async getDownloadServices(): Promise<any[]> {
    const config = await this.getSonnaConfig();
    const services: any[] = [];
    
    try {
      // Add PHP versions
      if (config.services.php && config.services.php.versions) {
        Object.entries(config.services.php.versions).forEach(([version, phpConfig]) => {
          services.push({
            name: `php-${version}`,
            displayName: phpConfig.displayName || `PHP ${version}`,
            version: phpConfig.version || version,
            installed: phpConfig.installed || false,
            downloadUrl: phpConfig.downloadUrl || ''
          });
        });
      }
      
      // Add Node.js versions
      if (config.services.nodejs && config.services.nodejs.versions) {
        Object.entries(config.services.nodejs.versions).forEach(([version, nodeConfig]) => {
          services.push({
            name: `nodejs-${version}`,
            displayName: nodeConfig.displayName || `Node.js ${version}`,
            version: nodeConfig.version || version,
            installed: nodeConfig.installed || false,
            downloadUrl: nodeConfig.downloadUrl || ''
          });
        });
      }
      
      // Add other services (non-versioned)
      const otherServices = ['apache', 'nginx', 'mysql', 'mongodb', 'phpmyadmin', 'redis'];
      otherServices.forEach(serviceName => {
        const service = (config.services as any)[serviceName];
        if (service) {
          services.push({
            name: service.name || serviceName,
            displayName: service.displayName || serviceName,
            version: service.version || 'latest',
            installed: service.installed || false,
            downloadUrl: service.downloadUrl || ''
          });
        }
      });
    } catch (error) {
      console.error('Error processing services:', error);
      // Return fallback services if there's an error
      return [
        { name: 'apache', displayName: 'Apache', version: '2.4.63', installed: false, downloadUrl: '' },
        { name: 'mysql', displayName: 'MySQL', version: '8.0.35', installed: false, downloadUrl: '' },
        { name: 'php-8.3.0', displayName: 'PHP 8.3', version: '8.3.0', installed: false, downloadUrl: '' },
        { name: 'nodejs-20.11.0', displayName: 'Node.js 20', version: '20.11.0', installed: false, downloadUrl: '' }
      ];
    }
    
    return services;
  }

  /**
   * Change installation path
   */
  static async changeInstallationPath(newPath: string, moveFiles: boolean): Promise<{
    success: boolean;
    newPath?: string;
    message?: string;
  }> {
    if (!window.electronAPI) {
      return { success: false, message: 'Electron API not available' };
    }
    
    try {
      const result = await window.electronAPI.changeInstallationPath(newPath, moveFiles);
      return result;
    } catch (error) {
      console.error('Failed to change installation path:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Select folder using system dialog
   */
  static async selectFolder(): Promise<string> {
    if (!window.electronAPI) {
      return '';
    }
    
    try {
      return await window.electronAPI.selectFolder();
    } catch (error) {
      console.error('Failed to select folder:', error);
      return '';
    }
  }
} 