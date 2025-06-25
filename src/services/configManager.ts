import type { SonnaConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/config/default-config';

export class ConfigManager {
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

  static async getDownloadServices(): Promise<any[]> {
    const config = await this.getSonnaConfig();
    const services: any[] = [];
    
    try {
      if (config.services.php && config.services.php.versions) {
        Object.entries(config.services.php.versions).forEach(([versionKey, phpConfig]) => {
          services.push({
            name: `php-${versionKey}`,  
            displayName: phpConfig.displayName || `PHP ${versionKey}`,
            version: phpConfig.version || versionKey,
            installed: phpConfig.installed || false,
            downloadUrl: phpConfig.downloadUrl || ''
          });
        });
      }
      
      if (config.services.nodejs && config.services.nodejs.versions) {
        Object.entries(config.services.nodejs.versions).forEach(([versionKey, nodeConfig]) => {
          services.push({
            name: `nodejs-${versionKey}`,
            displayName: nodeConfig.displayName || `Node.js ${versionKey}`,
            version: nodeConfig.version || versionKey,
            installed: nodeConfig.installed || false,
            downloadUrl: nodeConfig.downloadUrl || ''
          });
        });
      }
      
      Object.entries(config.services).forEach(([serviceName, serviceConfig]) => {
        if (serviceName === 'php' || serviceName === 'nodejs') return;
        
        const service = serviceConfig as any;
        if (service && service.name) {
          services.push({
            name: service.name,
            displayName: service.displayName || serviceName,
            version: service.version || 'latest',
            installed: service.installed || false,
            downloadUrl: service.downloadUrl || ''
          });
        }
      });
      
    } catch (error) {
      console.error('Error processing services:', error);
      return [
        { name: 'apache', displayName: 'Apache', version: '2.4.63', installed: false, downloadUrl: '' },
        { name: 'mysql', displayName: 'MySQL', version: '8.0.35', installed: false, downloadUrl: '' },
        { name: 'php-8.3.0', displayName: 'PHP 8.3', version: '8.3.0', installed: false, downloadUrl: '' },
        { name: 'nodejs-20.11.0', displayName: 'Node.js 20', version: '20.11.0', installed: false, downloadUrl: '' }
      ];
    }
    
    console.log('Generated services:', services);
    return services;
  }

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