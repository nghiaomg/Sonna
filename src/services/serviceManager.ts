import type { Service } from '@/types';

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