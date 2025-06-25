import * as path from 'path';
import { ServiceConfig } from '../interfaces';
import { BaseServiceChecker } from '../base/BaseServiceChecker';

export class NginxServiceChecker extends BaseServiceChecker {
  checkInstallation(service: ServiceConfig): boolean {
    try {
      const extractPath = service.extractPath;
      this.logCheck('Nginx', `Checking installation at ${extractPath}`);

      if (!this.fileSystem.exists(extractPath)) {
        this.logError('Nginx', `Extract path does not exist: ${extractPath}`);
        return false;
      }

      const directNginxExe = path.join(extractPath, 'nginx.exe');
      const directNginxConf = path.join(extractPath, 'conf', 'nginx.conf');

      console.log(`Checking direct nginx.exe path: ${directNginxExe}`);
      console.log(`Checking direct nginx.conf path: ${directNginxConf}`);

      if (this.fileSystem.exists(directNginxExe) && this.fileSystem.exists(directNginxConf)) {
        this.logSuccess('Nginx executable and config', 'direct paths');
        return true;
      }

      console.log(`Direct paths not found, searching recursively...`);
      const foundNginxExe = this.findFileRecursively(extractPath, 'nginx.exe');
      
      if (foundNginxExe) {
        const nginxDir = path.dirname(foundNginxExe);
        const nginxConf = path.join(nginxDir, 'conf', 'nginx.conf');
        
        if (this.fileSystem.exists(nginxConf)) {
          this.logSuccess('Nginx executable', foundNginxExe);
          this.logSuccess('Nginx config', nginxConf);
          return true;
        }
      }

      this.logError('Nginx', extractPath);
      return false;
    } catch (error) {
      console.error(`Failed to check Nginx installation:`, error);
      return false;
    }
  }
} 