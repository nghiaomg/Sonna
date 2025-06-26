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
      const appPath = app.getAppPath();
      const appDir = path.dirname(appPath);

      const prodPaths = [
        path.join(process.resourcesPath, 'icons/icon.ico'),

        path.join(process.resourcesPath, 'public/logo.ico'),

        path.join(appDir, 'logo.ico'),

        path.join(process.resourcesPath, 'logo.ico'),

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

    return path.join(__dirname, '../../build/icons/icon.ico');
  }

  copyAssetsToAppRoot() {
    try {
      this.copyDefaultIndexHtml();

      if (!this.isDev) {
        const appPath = app.getAppPath();
        const appDir = path.dirname(appPath);

        const logoSrcPath = path.join(__dirname, '../../dist/logo.png');
        const iconSrcPath = path.join(__dirname, '../../dist/logo.ico');

        const logoDestPath = path.join(appDir, 'logo.png');
        const iconDestPath = path.join(appDir, 'logo.ico');

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

  private copyDefaultIndexHtml() {
    try {
      const wwwDir = 'C:/sonna/www';
      const indexPath = path.join(wwwDir, 'index.html');

      if (!fs.existsSync(indexPath) || this.isSimpleInstallerVersion(indexPath)) {
        if (!fs.existsSync(wwwDir)) {
          fs.mkdirSync(wwwDir, { recursive: true });
        }

        const templatePath = this.findDefaultIndexTemplate();
        if (templatePath && fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, indexPath);
          console.log('✅ Copied beautiful default-index.html to C:/sonna/www/');
        } else {
          console.log('⚠️ default-index.html template not found, keeping existing file');
        }
      }
    } catch (error) {
      console.error('Failed to copy default index.html:', error);
    }
  }

  private isSimpleInstallerVersion(indexPath: string): boolean {
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      return content.includes('Welcome to Sonna v1.3.1') && content.includes('Your modern local development environment is ready!');
    } catch {
      return false;
    }
  }

  private findDefaultIndexTemplate(): string | null {
    const possiblePaths = [
      path.join(__dirname, '../../electron/utils/config-templates/default-index.html'),
      path.join(process.cwd(), 'electron/utils/config-templates/default-index.html'),
        
      path.join(process.resourcesPath, 'templates/default-index.html'),
      path.join(__dirname, '../utils/config-templates/default-index.html'),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        console.log('Found default-index.html template at:', templatePath);
        return templatePath;
      }
    }

    console.log('No default-index.html template found in any of the expected locations');
    return null;
  }
} 