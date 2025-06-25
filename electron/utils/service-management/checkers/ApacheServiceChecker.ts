import * as path from 'path';
import { ServiceConfig } from '../interfaces';
import { BaseServiceChecker } from '../base/BaseServiceChecker';

export class ApacheServiceChecker extends BaseServiceChecker {
  checkInstallation(service: ServiceConfig): boolean {
    try {
      const extractPath = service.extractPath;
      this.logCheck('Apache', `Checking installation at ${extractPath}`);

      if (!this.fileSystem.exists(extractPath)) {
        this.logError('Apache', `Extract path does not exist: ${extractPath}`);
        return false;
      }

      const apacheConfigPaths = [
        path.join(extractPath, 'conf', 'httpd.conf'),
        path.join(extractPath, 'Apache24', 'conf', 'httpd.conf'),
        path.join(extractPath, 'httpd-2.4.63-250207-win64-VS17', 'conf', 'httpd.conf')
      ];

      for (const configPath of apacheConfigPaths) {
        if (this.fileSystem.exists(configPath)) {
          this.logSuccess('Apache config', configPath);
          return true;
        }
      }

      const binPaths = [
        path.join(extractPath, 'bin'),
        path.join(extractPath, 'Apache24', 'bin'),
        path.join(extractPath, 'httpd-2.4.63-250207-win64-VS17', 'bin')
      ];

      for (const binPath of binPaths) {
        if (this.fileSystem.exists(binPath)) {
          this.logSuccess('Apache bin directory', binPath);
          return true;
        }
      }

      this.logError('Apache', extractPath);
      return false;
    } catch (error) {
      console.error(`Failed to check Apache installation:`, error);
      return false;
    }
  }
} 