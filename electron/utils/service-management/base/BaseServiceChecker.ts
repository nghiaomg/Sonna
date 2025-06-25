import * as path from 'path';
import { IServiceChecker, ServiceConfig, IFileSystem } from '../interfaces';

export abstract class BaseServiceChecker implements IServiceChecker {
  protected fileSystem: IFileSystem;

  constructor(fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
  }

  abstract checkInstallation(service: ServiceConfig): boolean;

  protected findFileRecursively(dir: string, filename: string): string | null {
    try {
      const items = this.fileSystem.readDir(dir);

      if (items.includes(filename)) {
        return path.join(dir, filename);
      }

      for (const item of items) {
        const itemPath = path.join(dir, item);
        if (this.fileSystem.isDirectory(itemPath)) {
          const found = this.findFileRecursively(itemPath, filename);
          if (found) {
            return found;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  protected logCheck(serviceName: string, message: string): void {
    console.log(`=== ${serviceName} Check: ${message} ===`);
  }

  protected logSuccess(serviceName: string, path: string): void {
    console.log(`✓ Found ${serviceName} at: ${path}`);
  }

  protected logError(serviceName: string, path: string): void {
    console.log(`✗ ${serviceName} check failed for ${path}`);
  }
} 