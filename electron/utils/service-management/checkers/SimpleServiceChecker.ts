import * as path from 'path';
import { ServiceConfig } from '../interfaces';
import { BaseServiceChecker } from '../base/BaseServiceChecker';

export class SimpleServiceChecker extends BaseServiceChecker {
  checkInstallation(service: ServiceConfig): boolean {
    try {
      const extractPath = service.extractPath;
      this.logCheck(service.name, `Checking installation at ${extractPath}`);

      if (!this.fileSystem.exists(extractPath)) {
        this.logError(service.name, `Extract path does not exist: ${extractPath}`);
        return false;
      }

      if (!service.executable) {
        // For services without executable (like phpMyAdmin)
        return this.checkPhpMyAdmin(service);
      }

      // Check direct executable path
      const directExecutablePath = path.join(extractPath, service.executable);
      
      if (this.fileSystem.exists(directExecutablePath)) {
        this.logSuccess(service.name, directExecutablePath);
        return true;
      }

      // Search recursively for executable
      const foundExecutablePath = this.findFileRecursively(extractPath, path.basename(service.executable));
      
      if (foundExecutablePath) {
        this.logSuccess(service.name, foundExecutablePath);
        return true;
      }

      this.logError(service.name, `Executable ${service.executable} not found in ${extractPath}`);
      return false;
    } catch (error) {
      console.error(`Failed to check ${service.name} installation:`, error);
      return false;
    }
  }

  private checkPhpMyAdmin(service: ServiceConfig): boolean {
    const extractPath = service.extractPath;
    
    // Check direct path first
    const directIndexPath = path.join(extractPath, 'index.php');
    
    if (this.fileSystem.exists(directIndexPath)) {
      this.logSuccess('phpMyAdmin index.php', 'direct path');
      return true;
    }
    
    // Search recursively for index.php
    const foundIndexPath = this.findFileRecursively(extractPath, 'index.php');
    
    if (foundIndexPath) {
      // Verify it's actually phpMyAdmin by checking for specific files
      const phpMyAdminDir = path.dirname(foundIndexPath);
      const configSamplePath = path.join(phpMyAdminDir, 'config.sample.inc.php');
      const librariesPath = path.join(phpMyAdminDir, 'libraries');
      
      if (this.fileSystem.exists(configSamplePath) && this.fileSystem.exists(librariesPath)) {
        this.logSuccess('phpMyAdmin installation', phpMyAdminDir);
        console.log(`✓ Verified with config.sample.inc.php and libraries folder`);
        return true;
      }
    }
    
    this.logError('phpMyAdmin', extractPath);
    return false;
  }
} 