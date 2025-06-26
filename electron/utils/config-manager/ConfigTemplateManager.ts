import * as fs from 'fs';
import * as path from 'path';
import { SonnaPaths, ServicePaths, ConfigPaths, PHP_VERSIONS, PathUtils } from '../constants';

export interface ConfigTemplateVariables {
  [key: string]: string | number;
}

export class ConfigTemplateManager {
  private outputDir: string;
  private templatesDir: string;

  constructor() {
    this.outputDir = SonnaPaths.CONFIG_PATH;
    this.templatesDir = this.findTemplatesDirectory();
  }

  /**
   * Find templates directory with fallback locations
   */
  private findTemplatesDirectory(): string {
    const possiblePaths = [
      // Development path
      typeof __dirname !== 'undefined' ? path.join(__dirname, '../config-templates') : null,
      // Production paths
      path.join(process.cwd(), 'electron/utils/config-templates'),
      path.join(process.resourcesPath || '', 'electron/utils/config-templates'),
      path.join(process.resourcesPath || '', 'app/electron/utils/config-templates'),
      // Build output path
      path.join(process.cwd(), 'dist-electron/utils/config-templates'),
      // Absolute fallback
      'C:/WorkSpace/GitHub-Projects/sonna/electron/utils/config-templates'
    ].filter(Boolean) as string[];

    for (const templatePath of possiblePaths) {
      try {
        const testFile = path.join(templatePath, 'apache.conf');
        if (fs.existsSync(testFile)) {
          console.log(`Found templates directory at: ${templatePath}`);
          return templatePath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    // If none found, use first available path as fallback
    const fallbackPath = possiblePaths[0] || 'electron/utils/config-templates';
    console.warn(`Templates directory not found in any expected location, using fallback: ${fallbackPath}`);
    
    // Ensure the directory exists
    if (!fs.existsSync(fallbackPath)) {
      console.warn(`Fallback path doesn't exist, creating: ${fallbackPath}`);
      try {
        fs.mkdirSync(fallbackPath, { recursive: true });
      } catch (error) {
        console.error('Failed to create fallback templates directory:', error);
      }
    }
    
    return fallbackPath;
  }

  /**
   * Load template content from external file
   */
  private loadTemplate(fileName: string): string {
    try {
      const filePath = path.join(this.templatesDir, fileName);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Template file not found: ${filePath}`);
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Failed to load template ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Initialize config directory
   */
  async initialize(): Promise<void> {
    try {
      // Create main conf directory
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Create service-specific subdirectories
      const subDirs = ['apache', 'nginx', 'mysql', 'redis', 'php', 'phpmyadmin', 'backups'];
      for (const subDir of subDirs) {
        const dirPath = path.join(this.outputDir, subDir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      console.log('Config directory structure initialized at C:/sonna/conf');
    } catch (error) {
      console.error('Failed to initialize config directory:', error);
      throw error;
    }
  }

  /**
   * Generate Apache configuration
   */
  async generateApacheConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.loadTemplate('apache.conf');
    const config = this.replaceVariables(template, {
      APACHE_ROOT: variables.APACHE_ROOT || `${ServicePaths.APACHE_PATH}/Apache24`,
      APACHE_PORT: variables.APACHE_PORT || 80,
      PHP_MODULE_CONFIG: variables.PHP_MODULE_CONFIG || '# PHP not configured',
      PHPMYADMIN_CONFIG: variables.PHPMYADMIN_CONFIG || '# phpMyAdmin not configured',
      ...variables
    });

    const outputPath = ConfigPaths.APACHE_CONFIG_OUTPUT;
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Apache config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate Nginx configuration
   */
  async generateNginxConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.loadTemplate('nginx.conf');
    const config = this.replaceVariables(template, {
      NGINX_PORT: variables.NGINX_PORT || 8080,
      PHP_FASTCGI_CONFIG: variables.PHP_FASTCGI_CONFIG || '# PHP not configured',
      PHPMYADMIN_CONFIG: variables.PHPMYADMIN_CONFIG || '# phpMyAdmin not configured',
      ...variables
    });

    const outputPath = ConfigPaths.NGINX_CONFIG_OUTPUT;
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Nginx config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate MySQL configuration
   */
  async generateMySQLConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.loadTemplate('mysql.cnf');
    const config = this.replaceVariables(template, {
      MYSQL_PORT: variables.MYSQL_PORT || 3306,
      MYSQL_BASEDIR: variables.MYSQL_BASEDIR || ServicePaths.MYSQL_PATH,
      MYSQL_DATADIR: variables.MYSQL_DATADIR || ServicePaths.MYSQL_DATA,
      MYSQL_TMPDIR: variables.MYSQL_TMPDIR || SonnaPaths.TEMP_PATH,
      ...variables
    });

    const outputPath = ConfigPaths.MYSQL_CONFIG_OUTPUT;
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`MySQL config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate Redis configuration
   */
  async generateRedisConfig(variables: ConfigTemplateVariables): Promise<string> {
    const template = this.loadTemplate('redis.conf');
    const config = this.replaceVariables(template, {
      REDIS_PORT: variables.REDIS_PORT || 6379,
      REDIS_DATADIR: variables.REDIS_DATADIR || ServicePaths.REDIS_DATA,
      REDIS_PASSWORD: variables.REDIS_PASSWORD || '',
      ...variables
    });

    const outputPath = ConfigPaths.REDIS_CONFIG_OUTPUT;
    fs.writeFileSync(outputPath, config, 'utf8');
    
    console.log(`Redis config generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate PHP configuration snippets
   */
  async generatePHPConfig(phpPath: string, phpVersion: string): Promise<{
    apacheModule: string;
    nginxFastCGI: string;
  }> {
    const phpDllName = this.getPHPDllName(phpVersion);
    const dllPath = path.join(phpPath, phpDllName);
    const dllExists = fs.existsSync(dllPath);
    
    // Create error suppression PHP.ini configuration
    await this.createPHPIniWithErrorSuppression(phpPath);
    
    let apacheModule;
    
    if (dllExists) {
      apacheModule = `
# PHP ${phpVersion} Configuration
LoadModule php_module "${phpPath.replace(/\\/g, '/')}/${phpDllName}"
AddType application/x-httpd-php .php
PHPIniDir "${phpPath.replace(/\\/g, '/')}/"

# Set index.php as directory index
DirectoryIndex index.html index.htm index.php`;
    } else {
      apacheModule = `
# PHP ${phpVersion} Configuration (INCOMPLETE INSTALLATION)
# WARNING: Apache DLL file not found: ${phpDllName}
# PHP files will be served as plain text until DLL is available.
# Consider reinstalling PHP with complete package.
#
# LoadModule php_module "${phpPath.replace(/\\/g, '/')}/${phpDllName}"
# AddType application/x-httpd-php .php
# PHPIniDir "${phpPath.replace(/\\/g, '/')}/"

# Set index.php as directory index (will show as text without PHP module)
DirectoryIndex index.html index.htm index.php`;
    }

    const nginxFastCGI = `
# PHP ${phpVersion} FastCGI Configuration
location ~ \\.php$ {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
    include        fastcgi_params;
}`;

    // Save PHP configs
    const phpConfigDir = ConfigPaths.PHP_CONFIG_OUTPUT;
    fs.writeFileSync(path.join(phpConfigDir, 'apache-module.conf'), apacheModule, 'utf8');
    fs.writeFileSync(path.join(phpConfigDir, 'nginx-fastcgi.conf'), nginxFastCGI, 'utf8');

    return { apacheModule, nginxFastCGI };
  }

  /**
   * Create custom PHP.ini with error suppression for maximum compatibility
   */
  private async createPHPIniWithErrorSuppression(phpPath: string): Promise<void> {
    try {
      // Copy global suppression script to PHP directory
      const suppressionTemplatePath = path.join(this.templatesDir, 'sonna-global-suppression.php');
      const suppressionFilePath = path.join(phpPath, 'sonna-error-suppression.php');
      
      if (fs.existsSync(suppressionTemplatePath)) {
        fs.copyFileSync(suppressionTemplatePath, suppressionFilePath);
        console.log(`✅ Error suppression script copied to: ${suppressionFilePath}`);
      } else {
        console.log('⚠️ Error suppression template not found, creating basic one');
        
        // Create basic error suppression if template doesn't exist
        const basicSuppression = `<?php
// Sonna Basic Error Suppression
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('html_errors', '0');
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    return true;
}, E_ALL);
?>`;
        fs.writeFileSync(suppressionFilePath, basicSuppression, 'utf8');
      }
      
      // Create custom PHP.ini with auto_prepend_file
      const customPhpIni = `; Sonna Custom PHP Configuration
; Auto-prepend error suppression for maximum compatibility

; Error suppression settings
auto_prepend_file = "${suppressionFilePath.replace(/\\/g, '/')}"
error_reporting = 0
display_errors = Off
display_startup_errors = Off
html_errors = Off
log_errors = On
ignore_repeated_errors = On
ignore_repeated_source = On

; Basic PHP settings
extension_dir = "ext"
max_execution_time = 300
max_input_time = 300
memory_limit = 512M
post_max_size = 64M
upload_max_filesize = 64M
max_file_uploads = 20

; Session settings
session.save_handler = files
session.use_cookies = 1
session.use_only_cookies = 1
session.name = PHPSESSID
session.cookie_lifetime = 0
session.cookie_path = /
session.cookie_domain =
session.cookie_httponly = 1
session.serialize_handler = php

; Date/Time settings
date.timezone = "UTC"

; Extensions for basic functionality
extension = curl
extension = fileinfo
extension = gd
extension = mbstring
extension = mysqli
extension = openssl
extension = pdo_mysql
extension = zip
extension = json
extension = session
extension = filter
extension = hash
extension = ctype
extension = tokenizer
extension = xml
extension = xmlreader
extension = xmlwriter
extension = dom
extension = iconv
extension = simplexml

; Disable problematic functions for security
disable_functions = exec,passthru,shell_exec,system,proc_open,popen
`;

      const phpIniPath = path.join(phpPath, 'php.ini');
      fs.writeFileSync(phpIniPath, customPhpIni, 'utf8');
      
      console.log(`✅ Custom PHP.ini created at: ${phpIniPath}`);
      console.log(`   - Error suppression: ENABLED (auto_prepend_file)`);
      console.log(`   - Error reporting: DISABLED`);
      console.log(`   - All PHP warnings/deprecations: SUPPRESSED`);
      
    } catch (error) {
      console.error('Failed to create PHP.ini with error suppression:', error);
      throw error;
    }
  }

  /**
   * Generate phpMyAdmin configuration snippets with provided PHP info (for consistency)
   */
  async generatePhpMyAdminConfigWithPHPInfo(
    phpMyAdminPath: string, 
    phpInfo: { available: boolean; path?: string; version?: string; dllName?: string }
  ): Promise<{
    apache: string;
    nginx: string;
  }> {
    // Use provided PHP info for consistency
    const phpConfig = phpInfo;

    let phpWarning = '';
    let phpRequirement = '';

    if (!phpConfig.available) {
      phpWarning = `
# ⚠️  WARNING: PHP NOT CONFIGURED
# phpMyAdmin requires PHP to function properly.
# Please install PHP through Sonna to enable phpMyAdmin.
# Without PHP, visiting /phpmyadmin will show raw PHP code instead of the application.`;

      phpRequirement = `
    # PHP Requirement Notice
    # Create a simple PHP check file
    <Location "/phpmyadmin">
        # If PHP is not loaded, Apache will serve raw PHP files
        # Users will see PHP source code instead of the application
        ErrorDocument 503 "PHP module not loaded. Please install PHP through Sonna to use phpMyAdmin."
    </Location>`;
    } else {
      phpWarning = `
# ✅ PHP CONFIGURED: ${phpConfig.version} at ${phpConfig.path}
# phpMyAdmin will function properly with PHP module loaded.`;
    }

    return this.generatePhpMyAdminConfigInternal(phpMyAdminPath, phpConfig, phpWarning, phpRequirement);
  }

  /**
   * Generate phpMyAdmin configuration snippets (using internal detection)
   */
  async generatePhpMyAdminConfig(phpMyAdminPath: string): Promise<{
    apache: string;
    nginx: string;
  }> {
    // Check if PHP is available and get configuration
    const phpConfig = await this.detectPHPConfiguration();

    let phpWarning = '';
    let phpRequirement = '';

    if (!phpConfig.available) {
      phpWarning = `
# ⚠️  WARNING: PHP NOT CONFIGURED
# phpMyAdmin requires PHP to function properly.
# Please install PHP through Sonna to enable phpMyAdmin.
# Without PHP, visiting /phpmyadmin will show raw PHP code instead of the application.`;

      phpRequirement = `
    # PHP Requirement Notice
    # Create a simple PHP check file
    <Location "/phpmyadmin">
        # If PHP is not loaded, Apache will serve raw PHP files
        # Users will see PHP source code instead of the application
        ErrorDocument 503 "PHP module not loaded. Please install PHP through Sonna to use phpMyAdmin."
    </Location>`;
    } else {
      phpWarning = `
# ✅ PHP CONFIGURED: ${phpConfig.version} at ${phpConfig.path}
# phpMyAdmin will function properly with PHP module loaded.`;
    }

    return this.generatePhpMyAdminConfigInternal(phpMyAdminPath, phpConfig, phpWarning, phpRequirement);
  }

  /**
   * Internal method to generate phpMyAdmin configuration
   */
  private generatePhpMyAdminConfigInternal(
    phpMyAdminPath: string,
    phpConfig: { available: boolean; path?: string; version?: string; dllName?: string },
    phpWarning: string,
    phpRequirement: string
  ): { apache: string; nginx: string } {
    const apache = `${phpWarning}
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminPath.replace(/\\/g, '/')}"

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html index.htm index.php
    
    # Handle phpMyAdmin routing
    RewriteEngine On
    
    # Allow files and directories to be accessed directly
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Fallback to index.php for phpMyAdmin routing
    RewriteRule ^(.*)$ index.php [QSA,L]
    
    # Ensure index.php is accessible
    <Files "index.php">
        Require all granted
    </Files>
    
    ${!phpConfig.available ? `
    # PHP Not Available - Show Installation Guide
    <Files "*.php">
        ForceType text/plain
        Header set Content-Type "text/html; charset=utf-8"
        Header set X-PHP-Required "true"
    </Files>` : ''}
</Directory>

# Security for phpMyAdmin
<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/libraries">
    Require all denied
</Directory>

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/setup/lib">
    Require all denied
</Directory>${phpRequirement}`;

    const nginx = `${phpWarning}
# phpMyAdmin Configuration
location /phpmyadmin {
    alias "${phpMyAdminPath.replace(/\\/g, '/')}";
    index index.php;
    
    # Try files then fallback to index.php for phpMyAdmin routing
    try_files $uri $uri/ /phpmyadmin/index.php?$query_string;
    
    ${phpConfig.available ? `
    location ~ ^/phpmyadmin/(.+\\.php)$ {
        alias "${phpMyAdminPath.replace(/\\/g, '/')}/$1";
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }` : `
    # PHP not configured - serve as plain text with installation notice
    location ~ ^/phpmyadmin/(.+\\.php)$ {
        alias "${phpMyAdminPath.replace(/\\/g, '/')}/$1";
        add_header Content-Type "text/html; charset=utf-8";
        add_header X-PHP-Required "true";
    }`}
    
    location ~* ^/phpmyadmin/(.+\\.(jpg|jpeg|gif|css|png|js|ico|html|xml|txt))$ {
        alias "${phpMyAdminPath.replace(/\\/g, '/')}/$1";
    }
}

# Security for phpMyAdmin
location ~ ^/phpmyadmin/(libraries|setup/lib) {
    deny all;
}`;

    // Save phpMyAdmin configs
    const phpMyAdminConfigDir = ConfigPaths.PHPMYADMIN_CONFIG_OUTPUT;
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'apache.conf'), apache, 'utf8');
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'nginx.conf'), nginx, 'utf8');

    return { apache, nginx };
  }

  /**
   * Detect PHP configuration for phpMyAdmin (using actual installed services)
   */
  private async detectPHPConfiguration(): Promise<{
    available: boolean;
    path?: string;
    version?: string;
    dllName?: string;
  }> {
    try {
      // First try: Use current installation pattern that scan all PHP directories
      const phpPaths = PHP_VERSIONS.map(version => ServicePaths.getPhpPath(version));

      for (const phpPath of phpPaths) {
        if (fs.existsSync(phpPath)) {
          const version = path.basename(phpPath);
          const phpExe = ServicePaths.getPhpExecutable(version);
          const dllPath = ServicePaths.getPhpDll(version);

          if (fs.existsSync(phpExe) && fs.existsSync(dllPath)) {
            const dllName = path.basename(dllPath);
            console.log(`✅ PHP ${version} detected at: ${phpPath} (${dllName})`);
            return {
              available: true,
              path: phpPath,
              version: version,
              dllName: dllName
            };
          }
        }
      }

      // Second try: scan all subdirectories in PHP directory for flexible naming
      const phpBaseDir = `${SonnaPaths.APPLICATIONS_PATH}/php`;
      if (fs.existsSync(phpBaseDir)) {
        const phpDirs = fs.readdirSync(phpBaseDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const phpDirName of phpDirs) {
          const phpPath = ServicePaths.getPhpPath(phpDirName);
          const phpExe = ServicePaths.getPhpExecutable(phpDirName);
          const dllPath = ServicePaths.getPhpDll(phpDirName);

          if (fs.existsSync(phpExe) && fs.existsSync(dllPath)) {
            const dllName = path.basename(dllPath);
            const version = this.extractVersionFromPath(phpPath) || phpDirName;
            console.log(`✅ PHP ${version} detected at: ${phpPath} (${dllName})`);
            return {
              available: true,
              path: phpPath,
              version: version,
              dllName: dllName
            };
          }
        }
      }

      console.log('⚠️ No PHP installation found with required Apache DLL');
      return { available: false };
    } catch (error) {
      console.error('Error detecting PHP configuration:', error);
      return { available: false };
    }
  }

  /**
   * Extract PHP version from installation path
   */
  private extractVersionFromPath(phpPath: string): string {
    const pathParts = phpPath.split(/[/\\]/);
    const versionPart = pathParts[pathParts.length - 1];

    // Match version patterns like "8.3", "8.2.15", etc.
    const versionMatch = versionPart.match(/^(\d+\.\d+(?:\.\d+)?)$/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  }

  /**
   * Get config file paths
   */
  getConfigPaths() {
    return {
      apache: path.join(this.outputDir, 'apache', 'httpd.conf'),
      nginx: path.join(this.outputDir, 'nginx', 'nginx.conf'),
      mysql: path.join(this.outputDir, 'mysql', 'my.cnf'),
      redis: path.join(this.outputDir, 'redis', 'redis.conf'),
      php: path.join(this.outputDir, 'php'),
      phpmyadmin: path.join(this.outputDir, 'phpmyadmin')
    };
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: ConfigTemplateVariables): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Get PHP DLL name based on version
   */
  private getPHPDllName(version: string): string {
    const majorVersion = version.split('.')[0];
    return `php${majorVersion}apache2_4.dll`;
  }

  /**
   * Auto-regenerate Apache config when PHP status changes
   */
  async regenerateApacheConfigWithPHP(): Promise<{
    success: boolean;
    phpDetected: boolean;
    configPath?: string;
    message: string;
  }> {
    try {
      console.log('🔄 Auto-regenerating Apache configuration with PHP detection...');
      
      // Detect current PHP installation
      const phpConfig = await this.detectPHPConfiguration();
      
      // Get phpMyAdmin path (if available)
      const phpMyAdminPath = ServicePaths.PHPMYADMIN_PATH;
      const hasPhpMyAdmin = fs.existsSync(path.join(phpMyAdminPath, 'index.php'));
      
      let phpModuleConfig = '# PHP not configured';
      let phpMyAdminConfig = '# phpMyAdmin not configured';
      
      if (phpConfig.available) {
        console.log(`✅ PHP detected: ${phpConfig.version} at ${phpConfig.path}`);
        
        // Generate PHP module configuration
        const phpConfigResult = await this.generatePHPConfig(phpConfig.path!, phpConfig.version!);
        phpModuleConfig = phpConfigResult.apacheModule;
        
        // Generate phpMyAdmin configuration with PHP support
        if (hasPhpMyAdmin) {
          const phpMyAdminConfigResult = await this.generatePhpMyAdminConfig(phpMyAdminPath);
          phpMyAdminConfig = phpMyAdminConfigResult.apache;
        }
      } else {
        console.log('⚠️ PHP not detected - generating config without PHP support');
        
        // Generate phpMyAdmin configuration without PHP (requirement page)
        if (hasPhpMyAdmin) {
          const phpMyAdminConfigResult = await this.generatePhpMyAdminConfig(phpMyAdminPath);
          phpMyAdminConfig = phpMyAdminConfigResult.apache;
        }
      }
      
      // Generate Apache config with proper PHP and phpMyAdmin configuration
      const configPath = await this.generateApacheConfig({
        APACHE_ROOT: `${ServicePaths.APACHE_PATH}/Apache24`,
        APACHE_PORT: 80,
        PHP_MODULE_CONFIG: phpModuleConfig,
        PHPMYADMIN_CONFIG: phpMyAdminConfig
      });
      
      const message = phpConfig.available 
        ? `Apache configuration updated with PHP ${phpConfig.version} support`
        : 'Apache configuration updated without PHP (requirement page active)';
      
      return {
        success: true,
        phpDetected: phpConfig.available,
        configPath,
        message
      };
      
    } catch (error) {
      console.error('Failed to regenerate Apache config:', error);
      return {
        success: false,
        phpDetected: false,
        message: `Failed to regenerate Apache config: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Inject error suppression into phpMyAdmin for PHP 8.x compatibility
   */
  async injectPhpMyAdminErrorSuppression(): Promise<void> {
    const phpMyAdminPath = ServicePaths.PHPMYADMIN_PATH;
    const indexPhpPath = path.join(phpMyAdminPath, 'index.php');
    
    if (!fs.existsSync(indexPhpPath)) {
      console.log('⚠️ phpMyAdmin index.php not found, skipping error suppression injection');
      return;
}

    try {
      // Read existing index.php
      let indexPhpContent = fs.readFileSync(indexPhpPath, 'utf8');
      
      // Check if our suppression is already injected
      if (indexPhpContent.includes('Sonna phpMyAdmin Error Suppression')) {
        console.log('ℹ️ Error suppression already injected in phpMyAdmin');
        return;
      }

      // Load error suppression template
      const suppressionScript = this.loadTemplate('phpmyadmin-error-suppression.php');
      
      // Find the opening <?php tag and inject right after it
      const phpOpenMatch = indexPhpContent.match(/^<\?php/m);
      if (phpOpenMatch) {
        const insertPosition = phpOpenMatch.index! + phpOpenMatch[0].length;
        
        // Insert suppression script right after opening <?php tag
        const beforePhpOpen = indexPhpContent.substring(0, insertPosition);
        const afterPhpOpen = indexPhpContent.substring(insertPosition);
        
        // Remove the opening <?php from suppression script since we're injecting after existing one
        const suppressionCode = suppressionScript.replace(/^<\?php\s*/, '\n');
        
        indexPhpContent = beforePhpOpen + suppressionCode + afterPhpOpen;
        
        // Write back to file
        fs.writeFileSync(indexPhpPath, indexPhpContent, 'utf8');
        
        console.log('✅ Error suppression injected into phpMyAdmin index.php');
      } else {
        console.log('⚠️ Could not find PHP opening tag in phpMyAdmin index.php');
        }
    } catch (error) {
      console.error('Failed to inject error suppression:', error);
      throw error;
        }
  }

  /**
   * Create PHP requirement page for phpMyAdmin
   */
  async createPHPRequirementPage(): Promise<void> {
    const phpMyAdminPath = ServicePaths.PHPMYADMIN_PATH;
    
    // Check if phpMyAdmin directory exists and has the key files
    const hasPhpMyAdminDir = fs.existsSync(phpMyAdminPath);
    const hasIndexPhp = hasPhpMyAdminDir && fs.existsSync(path.join(phpMyAdminPath, 'index.php'));
    const hasConfigSample = hasPhpMyAdminDir && fs.existsSync(path.join(phpMyAdminPath, 'config.sample.inc.php'));
    
    console.log(`📊 phpMyAdmin detection:`);
    console.log(`   Directory exists: ${hasPhpMyAdminDir ? '✅' : '❌'}`);
    console.log(`   index.php exists: ${hasIndexPhp ? '✅' : '❌'}`);  
    console.log(`   config.sample.inc.php exists: ${hasConfigSample ? '✅' : '❌'}`);
    
    if (!hasPhpMyAdminDir) {
      console.log('⚠️ phpMyAdmin directory not found, skipping requirement page creation');
      return;
    }
    
    if (!hasIndexPhp && !hasConfigSample) {
      console.log('⚠️ phpMyAdmin installation appears incomplete (missing key files)');
      console.log('📁 Creating requirement page anyway for potential future installation...');
  }

    try {
      // Load HTML template from external file
      const requirementPageContent = this.loadTemplate('php-requirement-page.html');

      // Write requirement page
      const requirementPagePath = path.join(phpMyAdminPath, 'index.html');
      fs.writeFileSync(requirementPagePath, requirementPageContent, 'utf8');
      
      // Create PHP check endpoint
      const phpCheckContent = `<?php
// PHP availability check endpoint for Sonna
header('Content-Type: text/plain');
echo 'PHP_WORKING_VERSION_' . PHP_VERSION;
?>`;
      
      const wwwDir = SonnaPaths.WWW_PATH;
      if (!fs.existsSync(wwwDir)) {
        fs.mkdirSync(wwwDir, { recursive: true });
      }
      
      const phpCheckPath = path.join(wwwDir, 'sonna-php-check.php');
      fs.writeFileSync(phpCheckPath, phpCheckContent, 'utf8');
      
      console.log('✅ PHP requirement page created at:', requirementPagePath);
      console.log('✅ PHP check endpoint created at:', phpCheckPath);
    } catch (error) {
      console.error('Failed to create PHP requirement page:', error);
      throw error;
    }
  }

  /**
   * Backup current configs
   */
  async backupConfigs(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.outputDir, 'backups', timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy all config files to backup
    const configFiles = [
      'apache/httpd.conf',
      'nginx/nginx.conf', 
      'mysql/my.cnf',
      'redis/redis.conf'
    ];

    for (const configFile of configFiles) {
      const sourcePath = path.join(this.outputDir, configFile);
      const backupPath = path.join(backupDir, configFile);
      
      if (fs.existsSync(sourcePath)) {
        const backupFileDir = path.dirname(backupPath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, backupPath);
      }
    }

    console.log(`Configs backed up to: ${backupDir}`);
    return backupDir;
  }

  /**
   * Auto-trigger PHP config regeneration when PHP is newly installed
   */
  async autoConfigurePHPWhenAvailable(): Promise<{
    success: boolean;
    phpDetected: boolean;
    message: string;
  }> {
    try {
      console.log('🔍 Auto-checking for PHP installation and configuring...');
      
      // Detect PHP
      const phpConfig = await this.detectPHPConfiguration();
      
      if (phpConfig.available && phpConfig.path && phpConfig.version) {
        console.log(`✅ PHP ${phpConfig.version} detected, configuring...`);
        
        // Generate PHP config with error suppression
        await this.generatePHPConfig(phpConfig.path, phpConfig.version);
        
        // Regenerate Apache config with PHP support
        const apacheResult = await this.regenerateApacheConfigWithPHP();
        
        return {
          success: true,
          phpDetected: true,
          message: `PHP ${phpConfig.version} configured successfully with error suppression`
        };
      } else {
        return {
          success: true,
          phpDetected: false,
          message: 'No PHP installation detected, configuration skipped'
        };
      }
    } catch (error) {
      console.error('Failed to auto-configure PHP:', error);
      return {
        success: false,
        phpDetected: false,
        message: `Failed to auto-configure PHP: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
} 