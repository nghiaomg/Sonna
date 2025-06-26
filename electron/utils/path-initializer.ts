/**
 * Path Initializer Utility
 * Handles initialization of Sonna paths when installation path changes
 */

import { SonnaPaths } from './constants';
import { ConfigManager } from './config-manager';

export class PathInitializer {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * Static method to update base path (for use in IPC handlers)
   */
  static async updateBasePath(newPath: string): Promise<void> {
    const initializer = new PathInitializer();
    await initializer.updateInstallationPath(newPath);
  }

  /**
   * Initialize paths from config on application startup
   */
  async initializeFromConfig(): Promise<void> {
    try {
      const configResult = await this.configManager.getConfig();
      
      if (configResult.success && configResult.config) {
        const installPath = configResult.config.installPath;
        
        if (installPath && installPath !== SonnaPaths.BASE_PATH) {
          console.log(`🔧 Updating Sonna paths from config: ${installPath}`);
          SonnaPaths.setBasePath(installPath);
        }
      }
    } catch (error) {
      console.warn('Failed to initialize paths from config:', error);
      console.log('Using default paths');
    }
  }

  /**
   * Update paths when user changes installation path
   */
  async updateInstallationPath(newPath: string): Promise<{
    success: boolean;
    message: string;
    oldPath: string;
    newPath: string;
  }> {
    try {
      const oldPath = SonnaPaths.BASE_PATH;
      
      // Validate new path
      if (!newPath || typeof newPath !== 'string') {
        throw new Error('Invalid installation path');
      }

      // Normalize path
      const normalizedPath = newPath.replace(/\\/g, '/').replace(/\/$/, '');
      
      // Update paths
      SonnaPaths.setBasePath(normalizedPath);
      
      // Update config
      const configResult = await this.configManager.getConfig();
      if (configResult.success && configResult.config) {
        configResult.config.installPath = normalizedPath;
        configResult.config.wwwPath = SonnaPaths.WWW_PATH;
        
        await this.configManager.saveConfig(configResult.config);
      }
      
      console.log(`✅ Installation path updated: ${oldPath} → ${normalizedPath}`);
      
      return {
        success: true,
        message: `Installation path updated to ${normalizedPath}`,
        oldPath,
        newPath: normalizedPath
      };
      
    } catch (error) {
      console.error('Failed to update installation path:', error);
      return {
        success: false,
        message: `Failed to update path: ${error instanceof Error ? error.message : String(error)}`,
        oldPath: SonnaPaths.BASE_PATH,
        newPath: SonnaPaths.BASE_PATH
      };
    }
  }

  /**
   * Get current paths for debugging
   */
  getCurrentPaths() {
    return {
      basePath: SonnaPaths.BASE_PATH,
      applicationsPath: SonnaPaths.APPLICATIONS_PATH,
      wwwPath: SonnaPaths.WWW_PATH,
      downloadsPath: SonnaPaths.DOWNLOADS_PATH,
      configPath: SonnaPaths.CONFIG_PATH,
      dataPath: SonnaPaths.DATA_PATH,
      tempPath: SonnaPaths.TEMP_PATH,
      backupsPath: SonnaPaths.BACKUPS_PATH,
      configFile: SonnaPaths.CONFIG_FILE
    };
  }

  /**
   * Validate if a path looks like a valid Sonna installation directory
   */
  validateInstallationPath(installPath: string): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!installPath || typeof installPath !== 'string') {
      issues.push('Path cannot be empty');
      return { valid: false, issues, warnings };
    }

    // Check for forbidden characters
    const forbiddenChars = ['<', '>', ':', '"', '|', '?', '*'];
    for (const char of forbiddenChars) {
      if (installPath.includes(char)) {
        issues.push(`Path contains forbidden character: ${char}`);
      }
    }

    // Check for spaces (warning only)
    if (installPath.includes(' ')) {
      warnings.push('Path contains spaces which may cause issues with some services');
    }

    // Check for very long paths
    if (installPath.length > 200) {
      warnings.push('Path is very long and may cause issues on Windows');
    }

    // Check if it's a system directory
    const systemPaths = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\System'];
    if (systemPaths.some(sysPath => installPath.toLowerCase().startsWith(sysPath.toLowerCase()))) {
      issues.push('Cannot install in system directories');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }
} 