import type { Service, SonnaConfig } from '@/types';

/**
 * Service Manager class for handling service operations
 */
export class ServiceManager {
  /**
   * Get status of all services
   */
  static async getServicesStatus(services: Service[]): Promise<Service[]> {
    if (!window.electronAPI) {
      return services;
    }
    
    try {
      const status = await window.electronAPI.getServicesStatus();
      
      return services.map(service => ({
        ...service,
        installed: status[service.name]?.installed || false,
        running: status[service.name]?.running || false
      }));
    } catch (error) {
      console.error('Failed to load services status:', error);
      return services;
    }
  }

  /**
   * Get all available PHP versions
   */
  static async getPHPVersions(): Promise<Service[]> {
    if (!window.electronAPI) {
      return [];
    }
    
    try {
      const configResult = await window.electronAPI.getSonnaConfig();
      if (!configResult.success || !configResult.config) {
        return [];
      }
      
      const config = configResult.config as SonnaConfig;
      const currentPHPVersion = config.services.php.current;
      
      return Object.entries(config.services.php.versions).map(([version, phpConfig]) => ({
        name: `php-${version}`,
        displayName: phpConfig.displayName,
        version: version,
        icon: null, // Will be set by the UI component
        installed: phpConfig.installed,
        running: phpConfig.running,
        isDefault: version === currentPHPVersion,
        isActive: version === currentPHPVersion
      }));
    } catch (error) {
      console.error('Failed to get PHP versions:', error);
      return [];
    }
  }

  /**
   * Get all available Node.js versions
   */
  static async getNodeVersions(): Promise<Service[]> {
    if (!window.electronAPI) {
      return [];
    }
    
    try {
      const configResult = await window.electronAPI.getSonnaConfig();
      if (!configResult.success || !configResult.config) {
        return [];
      }
      
      const config = configResult.config as SonnaConfig;
      const currentNodeVersion = config.services.nodejs.current;
      
      return Object.entries(config.services.nodejs.versions).map(([version, nodeConfig]) => ({
        name: `nodejs-${version}`,
        displayName: nodeConfig.displayName,
        version: version,
        icon: null, // Will be set by the UI component
        installed: nodeConfig.installed,
        running: nodeConfig.running,
        isDefault: version === currentNodeVersion,
        isActive: version === currentNodeVersion
      }));
    } catch (error) {
      console.error('Failed to get Node.js versions:', error);
      return [];
    }
  }

  /**
   * Set default PHP version
   */
  static async setDefaultPHPVersion(version: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.setDefaultPHPVersion(version);
      return result.success;
    } catch (error) {
      console.error(`Failed to set default PHP version to ${version}:`, error);
      return false;
    }
  }

  /**
   * Set default Node.js version
   */
  static async setDefaultNodeVersion(version: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.setDefaultNodeVersion(version);
      return result.success;
    } catch (error) {
      console.error(`Failed to set default Node.js version to ${version}:`, error);
      return false;
    }
  }

  /**
   * Set PHP version for a specific project
   */
  static async setProjectPHPVersion(projectPath: string, version: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.setProjectPHPVersion(projectPath, version);
      return result.success;
    } catch (error) {
      console.error(`Failed to set PHP version for project ${projectPath}:`, error);
      return false;
    }
  }

  /**
   * Set Node.js version for a specific project
   */
  static async setProjectNodeVersion(projectPath: string, version: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.setProjectNodeVersion(projectPath, version);
      return result.success;
    } catch (error) {
      console.error(`Failed to set Node.js version for project ${projectPath}:`, error);
      return false;
    }
  }

  /**
   * Start a service
   */
  static async startService(serviceName: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.startService(serviceName);
      return result.success;
    } catch (error) {
      console.error(`Failed to start ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Stop a service
   */
  static async stopService(serviceName: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.stopService(serviceName);
      return result.success;
    } catch (error) {
      console.error(`Failed to stop ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Toggle a service (start if stopped, stop if running)
   */
  static async toggleService(serviceName: string, isRunning: boolean): Promise<boolean> {
    if (isRunning) {
      return await this.stopService(serviceName);
    } else {
      return await this.startService(serviceName);
    }
  }

  /**
   * Start all services
   */
  static async startAllServices(services: Service[]): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    let allSuccessful = true;
    
    for (const service of services) {
      if (!service.running && service.installed) {
        const success = await this.startService(service.name);
        if (!success) {
          allSuccessful = false;
        }
      }
    }
    
    return allSuccessful;
  }

  /**
   * Stop all services
   */
  static async stopAllServices(services: Service[]): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    let allSuccessful = true;
    
    for (const service of services) {
      if (service.running) {
        const success = await this.stopService(service.name);
        if (!success) {
          allSuccessful = false;
        }
      }
    }
    
    return allSuccessful;
  }
} 