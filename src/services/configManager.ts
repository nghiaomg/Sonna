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
    
    return Object.values(config.services).map((service: ServiceConfig) => ({
      name: service.name,
      displayName: service.displayName,
      version: service.version,
      installed: service.installed,
      downloadUrl: service.downloadUrl
    }));
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