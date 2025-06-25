import * as path from 'path';
import { BaseServiceSetup } from '../base/BaseServiceSetup';

export class PhpMyAdminServiceSetup extends BaseServiceSetup {
  async setupService(extractPath: string): Promise<void> {
    const configPath = path.join(extractPath, 'config.inc.php');
    const mysqlPort = await this.getPortFromConfig('mysql', 3306);
    
    const configContent = this.generatePhpMyAdminConfig(mysqlPort);
    this.writeConfigFile(configPath, configContent);
  }

  private generatePhpMyAdminConfig(mysqlPort: number): string {
    return `<?php
/**
 * phpMyAdmin configuration for Sonna
 */

// Servers configuration
$i = 0;

// Server 1 (MySQL)
$i++;
$cfg['Servers'][$i]['verbose'] = 'MySQL';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = ${mysqlPort};
$cfg['Servers'][$i]['socket'] = '';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['user'] = '';
$cfg['Servers'][$i]['password'] = '';

// Global settings
$cfg['blowfish_secret'] = '${this.generateBlowfishSecret()}';
$cfg['DefaultLang'] = 'en';
$cfg['ServerDefault'] = 1;
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';

// Theme
$cfg['ThemeDefault'] = 'pmahomme';

// Security
$cfg['AllowArbitraryServer'] = false;
$cfg['LoginCookieValidity'] = 1440;
?>`;
  }

  private generateBlowfishSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
} 