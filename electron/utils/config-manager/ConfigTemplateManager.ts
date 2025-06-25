import * as fs from 'fs';
import * as path from 'path';

export interface ConfigTemplateVariables {
  [key: string]: string | number;
}

export class ConfigTemplateManager {
  private outputDir: string;
  private templatesDir: string;

  constructor() {
    this.outputDir = 'C:/sonna/conf';
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
      APACHE_ROOT: variables.APACHE_ROOT || 'C:/sonna/applications/apache/Apache24',
      APACHE_PORT: variables.APACHE_PORT || 80,
      PHP_MODULE_CONFIG: variables.PHP_MODULE_CONFIG || '# PHP not configured',
      PHPMYADMIN_CONFIG: variables.PHPMYADMIN_CONFIG || '# phpMyAdmin not configured',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'apache', 'httpd.conf');
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

    const outputPath = path.join(this.outputDir, 'nginx', 'nginx.conf');
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
      MYSQL_BASEDIR: variables.MYSQL_BASEDIR || 'C:/sonna/applications/mysql',
      MYSQL_DATADIR: variables.MYSQL_DATADIR || 'C:/sonna/data/mysql',
      MYSQL_TMPDIR: variables.MYSQL_TMPDIR || 'C:/sonna/tmp',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'mysql', 'my.cnf');
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
      REDIS_DATADIR: variables.REDIS_DATADIR || 'C:/sonna/data/redis',
      REDIS_PASSWORD: variables.REDIS_PASSWORD || '',
      ...variables
    });

    const outputPath = path.join(this.outputDir, 'redis', 'redis.conf');
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
    
    const apacheModule = `
# PHP ${phpVersion} Configuration
LoadModule php_module "${phpPath.replace(/\\/g, '/')}/${phpDllName}"
AddType application/x-httpd-php .php
PHPIniDir "${phpPath.replace(/\\/g, '/')}/"

# Set index.php as directory index
DirectoryIndex index.html index.htm index.php`;

    const nginxFastCGI = `
# PHP ${phpVersion} FastCGI Configuration
location ~ \\.php$ {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
    include        fastcgi_params;
}`;

    // Save PHP configs
    const phpConfigDir = path.join(this.outputDir, 'php');
    fs.writeFileSync(path.join(phpConfigDir, 'apache-module.conf'), apacheModule, 'utf8');
    fs.writeFileSync(path.join(phpConfigDir, 'nginx-fastcgi.conf'), nginxFastCGI, 'utf8');

    return { apacheModule, nginxFastCGI };
  }

  /**
   * Generate phpMyAdmin configuration snippets
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

    const apache = `${phpWarning}
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminPath.replace(/\\/g, '/')}"

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html index.php index.htm
    
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
    const phpMyAdminConfigDir = path.join(this.outputDir, 'phpmyadmin');
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'apache.conf'), apache, 'utf8');
    fs.writeFileSync(path.join(phpMyAdminConfigDir, 'nginx.conf'), nginx, 'utf8');

    return { apache, nginx };
  }

  /**
   * Detect PHP configuration for phpMyAdmin
   */
  private async detectPHPConfiguration(): Promise<{
    available: boolean;
    path?: string;
    version?: string;
    dllName?: string;
  }> {
    try {
      // Check common PHP installation paths
      const phpPaths = [
        'C:/sonna/applications/php/8.4',
        'C:/sonna/applications/php/8.3',
        'C:/sonna/applications/php/8.2',
        'C:/sonna/applications/php/8.1',
        'C:/sonna/applications/php/8.0',
        'C:/sonna/applications/php/7.4',
      ];

      for (const phpPath of phpPaths) {
        if (fs.existsSync(phpPath)) {
          const phpExe = path.join(phpPath, 'php.exe');

          // Check for common DLL names
          const dllNames = ['php8apache2_4.dll', 'php7apache2_4.dll'];

          for (const dllName of dllNames) {
            const dllPath = path.join(phpPath, dllName);
            if (fs.existsSync(phpExe) && fs.existsSync(dllPath)) {
              const version = this.extractVersionFromPath(phpPath);
              return {
                available: true,
                path: phpPath,
                version: version,
                dllName: dllName
              };
            }
          }
        }
      }

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
      const phpMyAdminPath = 'C:/sonna/applications/phpmyadmin';
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
        APACHE_ROOT: 'C:/sonna/applications/apache/Apache24',
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
   * Create PHP requirement page for phpMyAdmin
   */
  async createPHPRequirementPage(): Promise<void> {
    const phpMyAdminPath = 'C:/sonna/applications/phpmyadmin';
    
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
      
      const wwwDir = 'C:/sonna/www';
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
} 