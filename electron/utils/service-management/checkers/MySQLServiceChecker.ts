import * as path from 'path';
import { ServiceConfig } from '../interfaces';
import { BaseServiceChecker } from '../base/BaseServiceChecker';

export class MySQLServiceChecker extends BaseServiceChecker {
  checkInstallation(service: ServiceConfig): boolean {
    try {
      const extractPath = service.extractPath;
      this.logCheck('MySQL', `Checking installation at ${extractPath}`);

      if (!this.fileSystem.exists(extractPath)) {
        this.logError('MySQL', `Extract path does not exist: ${extractPath}`);
        return false;
      }

      // Check direct paths first
      const directBinPath = path.join(extractPath, 'bin');
      const directMysqldPath = path.join(extractPath, 'bin', 'mysqld.exe');

      console.log(`Checking direct bin path: ${directBinPath}`);
      console.log(`Checking direct mysqld.exe path: ${directMysqldPath}`);

      if (this.fileSystem.exists(directBinPath) && this.fileSystem.exists(directMysqldPath)) {
        this.logSuccess('MySQL bin directory and mysqld.exe', 'direct paths');
        return true;
      }

      // Search recursively for nested installations
      console.log(`Direct paths not found, searching recursively...`);
      const foundMysqldPath = this.findFileRecursively(extractPath, 'mysqld.exe');
      
      if (foundMysqldPath) {
        const mysqlBinDir = path.dirname(foundMysqldPath);
        const mysqlClientPath = path.join(mysqlBinDir, 'mysql.exe');

        console.log(`Found mysqld.exe at: ${foundMysqldPath}`);
        console.log(`MySQL bin directory: ${mysqlBinDir}`);

        if (this.fileSystem.exists(mysqlClientPath)) {
          this.logSuccess('mysql.exe client', mysqlClientPath);
          this.logSuccess('MySQL installation', 'verified successfully');
          return true;
        }
      }

      this.logError('MySQL', extractPath);
      return false;
    } catch (error) {
      console.error(`Failed to check MySQL installation:`, error);
      return false;
    }
  }
} 