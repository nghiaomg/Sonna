import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class AssetService {
  private isDev: boolean;

  constructor(isDev: boolean) {
    this.isDev = isDev;
  }

  getIconPath(): string {
    if (this.isDev) {
      // In development, try multiple paths
      const devPaths = [
        path.join(__dirname, '../../public/logo.ico'),
        path.join(__dirname, '../../build/icons/icon.ico'),
        path.join(process.cwd(), 'public/logo.ico'),
        path.join(process.cwd(), 'build/icons/icon.ico')
      ];
      
      for (const iconPath of devPaths) {
        if (fs.existsSync(iconPath)) {
          return iconPath;
        }
      }
    } else {
      // In production, try multiple paths with priority
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);
      
      const prodPaths = [
        // Extra resources directory (highest priority)
        path.join(process.resourcesPath, 'icons/icon.ico'),
        
        // Public directory in resources
        path.join(process.resourcesPath, 'public/logo.ico'),
        
        // App root (where we copied files)
        path.join(appDir, 'logo.ico'),
        
        // Resources directory
        path.join(process.resourcesPath, 'logo.ico'),
        
        // Other possible locations
        path.join(__dirname, '../../logo.ico'),
        path.join(__dirname, '../../dist/logo.ico'),
        path.join(__dirname, '../../build/icons/icon.ico'),
        path.join(__dirname, '../../public/logo.ico')
      ];
      
      for (const iconPath of prodPaths) {
        if (fs.existsSync(iconPath)) {
          console.log('Found icon at:', iconPath);
          return iconPath;
        }
      }
    }
    
    // Fallback - return default path
    return path.join(__dirname, '../../build/icons/icon.ico');
  }

  copyAssetsToAppRoot() {
    try {
      // In production, copy logo files to app root for easy access
      if (!this.isDev) {
        const appPath = app.getAppPath();
        const appDir = path.dirname(appPath);
        
        // Source paths
        const logoSrcPath = path.join(__dirname, '../../dist/logo.png');
        const iconSrcPath = path.join(__dirname, '../../dist/logo.ico');
        
        // Destination paths (app root)
        const logoDestPath = path.join(appDir, 'logo.png');
        const iconDestPath = path.join(appDir, 'logo.ico');
        
        // Copy files if they exist
        if (fs.existsSync(logoSrcPath)) {
          fs.copyFileSync(logoSrcPath, logoDestPath);
          console.log('Copied logo.png to app root');
        }
        
        if (fs.existsSync(iconSrcPath)) {
          fs.copyFileSync(iconSrcPath, iconDestPath);
          console.log('Copied logo.ico to app root');
        }
      }
    } catch (error) {
      console.error('Failed to copy assets to app root:', error);
    }
  }
} 