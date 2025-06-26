import * as path from 'path';
import { BaseServiceSetup } from '../base/BaseServiceSetup';

export class PhpMyAdminServiceSetup extends BaseServiceSetup {
  async setupService(extractPath: string): Promise<void> {
    const configPath = path.join(extractPath, 'config.inc.php');
    const mysqlPort = await this.getPortFromConfig('mysql', 3306);
    
    const configContent = this.generatePhpMyAdminConfig(mysqlPort);
    this.writeConfigFile(configPath, configContent);
    
    console.log('✅ phpMyAdmin configuration completed');
    console.log('   - MySQL connection configured');
    console.log('   - mysqli extension FORCED in config');
    console.log('   - Error suppression enabled');
  }

  private generatePhpMyAdminConfig(mysqlPort: number): string {
    return `<?php
/**
 * phpMyAdmin configuration for Sonna
 * Auto-generated configuration with error suppression
 */

// ULTRA-AGGRESSIVE error suppression for phpMyAdmin compatibility
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
set_error_handler(function() { return true; }, E_ALL);

// Force mysqli extension check and load
if (!extension_loaded('mysqli')) {
    // Debug information for troubleshooting
    $ext_dir = ini_get('extension_dir');
    $mysqli_file = $ext_dir . '/php_mysqli.dll';
    
    // Try to load mysqli extension if not loaded
    if (function_exists('dl') && !ini_get('safe_mode')) {
        @dl('php_mysqli.dll');
    }
    
    // If still not available, show detailed error
    if (!extension_loaded('mysqli')) {
        $debug_info = '';
        $debug_info .= '<h3>Debug Information:</h3>';
        $debug_info .= '<p><strong>Extension Directory:</strong> ' . $ext_dir . '</p>';
        $debug_info .= '<p><strong>mysqli DLL Path:</strong> ' . $mysqli_file . '</p>';
        $debug_info .= '<p><strong>File Exists:</strong> ' . (file_exists($mysqli_file) ? 'YES' : 'NO') . '</p>';
        $debug_info .= '<p><strong>Loaded Extensions:</strong> ' . implode(', ', get_loaded_extensions()) . '</p>';
        
        die('<h1>Critical Error: mysqli Extension Missing</h1>
             <p>The mysqli extension is required for phpMyAdmin to function.</p>
             <p>Please ensure PHP is properly configured with mysqli extension.</p>
             <p><strong>Sonna Setup:</strong> This error indicates PHP extensions are not properly loaded.</p>
             ' . $debug_info);
    }
}

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

// Additional settings to suppress warnings
$cfg['CheckConfigurationPermissions'] = false;
$cfg['ShowPhpInfo'] = false;
$cfg['ShowServerInfo'] = false;
$cfg['SendErrorReports'] = 'never';

// Force mysqli extension usage
$cfg['Servers'][$i]['extension'] = 'mysqli';

// Additional mysqli-specific settings
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Servers'][$i]['hide_db'] = '';

// Force specific database connection settings
$cfg['DBG']['sql'] = false;
$cfg['SuhosinDisableWarning'] = true;
$cfg['McryptDisableWarning'] = true;
$cfg['MySQLManualBase'] = false;

// Disable version check to avoid network issues
$cfg['VersionCheck'] = false;
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