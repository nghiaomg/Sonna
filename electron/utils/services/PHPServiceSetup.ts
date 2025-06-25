import * as fs from 'fs';
import * as path from 'path';
import { BaseServiceSetup } from '../base/BaseServiceSetup';

// Single Responsibility Principle (S) - Each class handles one service
export class PHPServiceSetup extends BaseServiceSetup {
  async setupService(extractPath: string): Promise<void> {
    const phpIniPath = path.join(extractPath, 'php.ini');
    const phpIniDevPath = path.join(extractPath, 'php.ini-development');
    
    if (!fs.existsSync(phpIniPath) && fs.existsSync(phpIniDevPath)) {
      fs.copyFileSync(phpIniDevPath, phpIniPath);
    }
    
    if (fs.existsSync(phpIniPath)) {
      let phpIni = fs.readFileSync(phpIniPath, 'utf8');
      
      phpIni = this.enablePHPExtensions(phpIni);
      phpIni = this.configurePHPSettings(phpIni);
      
      this.writeConfigFile(phpIniPath, phpIni);
    }
  }

  private enablePHPExtensions(phpIni: string): string {
    const extensions = ['curl', 'mbstring', 'openssl', 'pdo_mysql', 'mysqli', 'gd', 'zip'];
    
    extensions.forEach(ext => {
      phpIni = phpIni.replace(new RegExp(`;extension=${ext}`, 'g'), `extension=${ext}`);
    });
    
    return phpIni;
  }

  private configurePHPSettings(phpIni: string): string {
    phpIni = phpIni.replace(/;date.timezone\s*=/g, 'date.timezone = Asia/Ho_Chi_Minh');
    phpIni = phpIni.replace(/display_errors = Off/g, 'display_errors = On');
    phpIni = phpIni.replace(/error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT/g, 'error_reporting = E_ALL');
    
    return phpIni;
  }
} 