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
      
      // Verify extensions exist before enabling
      this.verifyExtensionFiles(extractPath);
      
      phpIni = this.enablePHPExtensions(phpIni, extractPath);
      phpIni = this.configurePHPSettings(phpIni);
      
      this.writeConfigFile(phpIniPath, phpIni);
      
      console.log('✅ PHP configuration completed');
      console.log('   - Extensions verified and enabled');
      console.log('   - mysqli extension: ENABLED');
      console.log('   - Extension directory configured');
    }
    
    // Create global suppression script
    await this.createGlobalSuppressionScript();
  }

  private verifyExtensionFiles(extractPath: string): void {
    const extDir = path.join(extractPath, 'ext');
    const requiredExtensions = ['php_mysqli.dll', 'php_pdo_mysql.dll', 'php_mbstring.dll', 'php_curl.dll', 'php_gd.dll'];
    
    console.log('🔍 Verifying PHP extensions...');
    
    if (!fs.existsSync(extDir)) {
      console.warn('⚠️  Extensions directory not found:', extDir);
      return;
    }
    
    const availableExtensions = fs.readdirSync(extDir);
    
    requiredExtensions.forEach(ext => {
      if (availableExtensions.includes(ext)) {
        console.log(`   ✅ ${ext} - FOUND`);
      } else {
        console.warn(`   ⚠️  ${ext} - MISSING`);
      }
    });
  }

  private enablePHPExtensions(phpIni: string, extractPath: string): string {
    // Complete list of extensions needed for phpMyAdmin and general PHP development
    const extensions = [
      'curl',
      'fileinfo', 
      'gd',
      'mbstring',
      'mysqli',
      'openssl',
      'pdo_mysql',
      'zip',
      'json',
      'session',
      'filter',
      'hash',
      'ctype',
      'tokenizer',
      'xml',
      'xmlreader',
      'xmlwriter',
      'dom',
      'iconv',
      'simplexml'
    ];
    
    // Configure extension directory FIRST with absolute path
    const extDir = path.join(extractPath, 'ext').replace(/\\/g, '/');
    phpIni = phpIni.replace(/^;?\s*extension_dir\s*=.*$/gm, '');
    phpIni += `\n; Sonna - Extension Directory Configuration\n`;
    phpIni += `extension_dir = "${extDir}"\n`;
    
    // Remove existing extension lines to avoid duplicates
    extensions.forEach(ext => {
      // Remove commented lines
      phpIni = phpIni.replace(new RegExp(`^\\s*;\\s*extension\\s*=\\s*${ext}\\s*$`, 'gm'), '');
      // Remove uncommented lines to avoid duplicates
      phpIni = phpIni.replace(new RegExp(`^\\s*extension\\s*=\\s*${ext}\\s*$`, 'gm'), '');
    });
    
    // Add all extensions at the end
    phpIni += '\n; Sonna - Required Extensions for phpMyAdmin and Development\n';
    extensions.forEach(ext => {
      phpIni += `extension=${ext}\n`;
    });
    
    console.log(`   📁 Extension directory: ${extDir}`);
    console.log(`   🔌 Extensions enabled: ${extensions.length} total`);
    console.log(`   🗃️  mysqli extension: ENABLED (critical for phpMyAdmin)`);
    
    return phpIni;
  }

  private configurePHPSettings(phpIni: string): string {
    // Extension directory already configured in enablePHPExtensions with absolute path
    // Skip extension_dir configuration here to avoid overwrite
    
    // Configure timezone
    phpIni = phpIni.replace(/;date.timezone\s*=/g, 'date.timezone = Asia/Ho_Chi_Minh');
    
    // Enable error display for development
    phpIni = phpIni.replace(/display_errors = Off/g, 'display_errors = On');
    
    // ULTRA-AGGRESSIVE deprecation warning suppression
    // Remove any existing error_reporting lines
    phpIni = phpIni.replace(/^error_reporting\s*=.*$/gm, '');
    
    // Add comprehensive suppression at the end
    phpIni += '\n\n; Sonna - ULTRA-AGGRESSIVE PHP 8.x deprecation warning suppression\n';
    phpIni += 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE & ~E_WARNING\n';
    
    // Complete output suppression
    phpIni += 'display_errors = Off\n';
    phpIni += 'display_startup_errors = Off\n';
    phpIni += 'log_errors = On\n';
    phpIni += 'log_errors_max_len = 0\n';
    phpIni += 'ignore_repeated_errors = On\n';
    phpIni += 'ignore_repeated_source = On\n';
    
    // Disable all error output mechanisms
    phpIni += 'html_errors = Off\n';
    phpIni += 'xmlrpc_errors = Off\n';
    
    // Enable output buffering to catch any remaining output
    phpIni += 'output_buffering = 4096\n';
    phpIni += 'implicit_flush = Off\n';
    
    // Auto-prepend suppression script BEFORE any code execution
    phpIni += 'auto_prepend_file = "' + this.getSuppressionScriptPath().replace(/\\/g, '/') + '"\n';
    
    return phpIni;
  }

  private getSuppressionScriptPath(): string {
    // This will be created during PHP setup
    return 'C:/sonna/conf/php/sonna-suppression.php';
  }

  private async createGlobalSuppressionScript(): Promise<void> {
    try {
      const suppressionPath = this.getSuppressionScriptPath();
      const suppressionDir = path.dirname(suppressionPath);
      
      // Ensure directory exists
      if (!fs.existsSync(suppressionDir)) {
        fs.mkdirSync(suppressionDir, { recursive: true });
      }
      
      // Load template
      const templatePath = this.findTemplatesDirectory();
      const suppressionTemplate = path.join(templatePath, 'sonna-global-suppression.php');
      
      if (fs.existsSync(suppressionTemplate)) {
        const content = fs.readFileSync(suppressionTemplate, 'utf8');
        fs.writeFileSync(suppressionPath, content, 'utf8');
        console.log('✅ Created global PHP suppression script at:', suppressionPath);
      } else {
        // Fallback: create script manually
        const fallbackContent = `<?php
// Sonna Ultra-Aggressive Error Suppression
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
set_error_handler(function() { return true; }, E_ALL);
?>`;
        fs.writeFileSync(suppressionPath, fallbackContent, 'utf8');
        console.log('✅ Created fallback PHP suppression script at:', suppressionPath);
      }
    } catch (error) {
      console.error('Failed to create global suppression script:', error);
    }
  }

  private findTemplatesDirectory(): string {
    const possiblePaths = [
      path.join(__dirname, '../config-templates'),
      path.join(process.cwd(), 'electron/utils/config-templates'),
      path.join(process.resourcesPath || '', 'electron/utils/config-templates'),
    ].filter(Boolean);

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        return templatePath;
      }
    }
    
    return possiblePaths[0];
  }
} 