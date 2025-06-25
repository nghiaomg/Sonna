import * as fs from 'fs';
import * as path from 'path';
import { BaseWebServerConfigurator } from '../base/BaseWebServerConfigurator';
import { IConfigProvider } from '../interfaces';
import { ConfigTemplateManager } from '../config-manager/ConfigTemplateManager';

export class ApacheConfigurator extends BaseWebServerConfigurator {
  private extractPath: string;
  private templateManager: ConfigTemplateManager;

  constructor(configProvider: IConfigProvider, extractPath: string) {
    super(configProvider);
    this.extractPath = extractPath;
    this.templateManager = new ConfigTemplateManager();
  }

  async updateConfiguration(): Promise<void> {
    console.log('🔄 Auto-updating Apache configuration with PHP detection...');
    
    const apacheRoot = this.getApacheRoot();
    const httpdConfPath = path.join(apacheRoot, 'conf', 'httpd.conf');
    
    // Ensure config directory exists
    const confDir = path.dirname(httpdConfPath);
    if (!fs.existsSync(confDir)) {
      console.log('📁 Creating Apache conf directory:', confDir);
      fs.mkdirSync(confDir, { recursive: true });
    }
    
    // Check if httpd.conf exists, if not, create it from template
    if (!fs.existsSync(httpdConfPath)) {
      console.log('📝 Apache httpd.conf not found, creating from template...');
    } else {
      console.log('📝 Updating existing Apache httpd.conf...');
    }

    try {
      // Initialize config directory
      await this.templateManager.initialize();

      // Get configuration variables with auto PHP detection
      const variables = await this.getConfigVariables(apacheRoot);

      // Generate new config from template
      const generatedConfigPath = await this.templateManager.generateApacheConfig(variables);

      // Copy generated config to Apache directory
      fs.copyFileSync(generatedConfigPath, httpdConfPath);

      console.log(`✅ Apache configuration updated: ${generatedConfigPath} -> ${httpdConfPath}`);
      
      // Verify the configuration was written correctly
      if (fs.existsSync(httpdConfPath)) {
        const configSize = fs.statSync(httpdConfPath).size;
        console.log(`📊 Apache config file size: ${configSize} bytes`);
        
        // Check if phpMyAdmin configuration is included
        const configContent = fs.readFileSync(httpdConfPath, 'utf8');
        const hasPhpMyAdminConfig = configContent.includes('/phpmyadmin');
        const hasPhpWarning = configContent.includes('PHP NOT CONFIGURED');
        const hasDirectoryIndex = configContent.includes('DirectoryIndex index.html');
        
        console.log(`📋 Configuration includes:`);
        console.log(`   phpMyAdmin routing: ${hasPhpMyAdminConfig ? '✅' : '❌'}`);
        console.log(`   PHP requirement notice: ${hasPhpWarning ? '✅' : '❌'}`);
        console.log(`   DirectoryIndex index.html priority: ${hasDirectoryIndex ? '✅' : '❌'}`);
        
        // Force overwrite if not properly configured
        if (!hasDirectoryIndex) {
          console.log('⚠️ DirectoryIndex priority missing, regenerating...');
          fs.copyFileSync(generatedConfigPath, httpdConfPath);
        }
      }
      
              // Always check and handle PHP requirement page based on current status
        const phpMyAdminPath = await this.getPhpMyAdminPath();
        if (phpMyAdminPath) {
          const requirementPagePath = path.join(phpMyAdminPath, 'index.html');
          
          if (variables.PHP_MODULE_CONFIG.includes('# PHP not configured')) {
            console.log('⚠️ PHP not available - ensuring requirement page exists...');
            
            // Force create requirement page when PHP is not available
            try {
              await this.templateManager.createPHPRequirementPage();
              console.log('✅ PHP requirement page created at:', requirementPagePath);
              
              // Verify the requirement page was actually created
              if (fs.existsSync(requirementPagePath)) {
                const pageContent = fs.readFileSync(requirementPagePath, 'utf8');
                console.log(`📄 Requirement page verified: ${pageContent.length} characters`);
                
                // Ensure it contains the expected content
                if (!pageContent.includes('PHP Required')) {
                  console.log('⚠️ Requirement page content invalid, using fallback...');
                  this.createFallbackRequirementPage(phpMyAdminPath);
                }
              } else {
                console.log('⚠️ Requirement page not created, using fallback...');
                this.createFallbackRequirementPage(phpMyAdminPath);
              }
            } catch (reqError) {
              console.error('❌ Failed to create requirement page:', reqError);
              // Create a simple fallback requirement page
              this.createFallbackRequirementPage(phpMyAdminPath);
            }
            
          } else {
            // PHP is available - remove requirement page if exists
            if (fs.existsSync(requirementPagePath)) {
              fs.unlinkSync(requirementPagePath);
              console.log('🗑️ Removed PHP requirement page - PHP is now available');
            }
          }
        }
    } catch (error) {
      console.error('❌ Failed to update Apache configuration:', error);
      throw error;
    }
  }

  private getApacheRoot(): string {
    const nestedApachePath = path.join(this.extractPath, 'Apache24');
    return fs.existsSync(nestedApachePath) ? nestedApachePath : this.extractPath;
  }

  private async getConfigVariables(apacheRoot: string): Promise<any> {
    const port = await this.getPortFromConfig('apache', 80);
    
    // Get PHP configuration if available
    const phpConfig = await this.getInstalledPHPInfo();
    let phpModuleConfig = '# PHP not configured';
    
    if (phpConfig) {
      // Extract version from PHP path or use default
      const phpVersion = this.extractPHPVersion(phpConfig.phpPath) || '8.0';
      const phpConfigResult = await this.templateManager.generatePHPConfig(phpConfig.phpPath, phpVersion);
      phpModuleConfig = phpConfigResult.apacheModule;
    }

    // Get phpMyAdmin configuration if available
    const phpMyAdminPath = await this.getPhpMyAdminPath();
    let phpMyAdminConfig = '# phpMyAdmin not configured';
    
    if (phpMyAdminPath) {
      const phpMyAdminConfigResult = await this.templateManager.generatePhpMyAdminConfig(phpMyAdminPath);
      phpMyAdminConfig = phpMyAdminConfigResult.apache;
    }

    return {
      APACHE_ROOT: apacheRoot.replace(/\\/g, '/'),
      APACHE_PORT: port,
      PHP_MODULE_CONFIG: phpModuleConfig,
      PHPMYADMIN_CONFIG: phpMyAdminConfig
    };
  }

  private extractPHPVersion(phpPath: string): string | null {
    // Try to extract version from path like C:/sonna/applications/php-8.0/
    const versionMatch = phpPath.match(/php[_-](\d+\.\d+)/i);
    return versionMatch ? versionMatch[1] : null;
  }

  /**
   * Create a simple fallback requirement page when template system fails
   */
  private createFallbackRequirementPage(phpMyAdminPath: string): void {
    try {
      const requirementPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Required - phpMyAdmin</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5rem;
        }
        .php-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .requirement-text {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .install-steps {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        .step {
            margin: 10px 0;
            padding: 10px;
            border-left: 4px solid #667eea;
            background: white;
            border-radius: 5px;
        }
        .refresh-info {
            margin-top: 30px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 8px;
            color: #1565c0;
        }
    </style>
    <script>
        // Auto-refresh every 30 seconds to check for PHP
        let checkCount = 0;
        setInterval(() => {
            checkCount++;
            document.getElementById('check-count').textContent = checkCount;
            
            // Try to detect if PHP is available by checking for redirect
            fetch('/phpmyadmin/index.php')
                .then(response => {
                    if (response.ok && !response.url.includes('index.html')) {
                        window.location.reload();
                    }
                })
                .catch(() => {
                    // PHP check failed, continue waiting
                });
        }, 30000);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                window.location.reload();
            }
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="php-icon">🐘</div>
        <h1>PHP Required</h1>
        <div class="requirement-text">
            phpMyAdmin requires PHP to function properly.<br>
            Please install PHP through Sonna to access the database management interface.
        </div>

        <div class="install-steps">
            <h3>📋 Installation Steps:</h3>
            <div class="step">
                <strong>1.</strong> Open Sonna application
            </div>
            <div class="step">
                <strong>2.</strong> Go to "Install" tab
            </div>
            <div class="step">
                <strong>3.</strong> Install any PHP version (8.1, 8.2, 8.3, or 8.4)
            </div>
            <div class="step">
                <strong>4.</strong> This page will automatically redirect once PHP is ready
            </div>
        </div>

        <div class="refresh-info">
            <strong>🔄 Auto-refresh:</strong> Checking for PHP every 30 seconds<br>
            <strong>⌨️ Manual refresh:</strong> Press F5 or Ctrl+R<br>
            <strong>🔍 Checks performed:</strong> <span id="check-count">0</span>
        </div>
    </div>
</body>
</html>`;

      const requirementPagePath = path.join(phpMyAdminPath, 'index.html');
      fs.writeFileSync(requirementPagePath, requirementPageContent, 'utf8');
      
      // Also create PHP check endpoint for fallback
      const wwwDir = 'C:/sonna/www';
      if (!fs.existsSync(wwwDir)) {
        fs.mkdirSync(wwwDir, { recursive: true });
      }

      const phpCheckContent = `<?php
// PHP availability check endpoint for Sonna
header('Content-Type: text/plain');
echo 'PHP_WORKING_VERSION_' . PHP_VERSION;
?>`;

      const phpCheckPath = path.join(wwwDir, 'sonna-php-check.php');
      fs.writeFileSync(phpCheckPath, phpCheckContent, 'utf8');
      
      console.log('✅ Fallback requirement page created successfully');
    } catch (error) {
      console.error('❌ Failed to create fallback requirement page:', error);
    }
  }

  private async getPortFromConfig(serviceName: string, defaultPort: number): Promise<number> {
    try {
      const configResult = await this.configProvider.getConfig();
      if (configResult.success && configResult.config?.services[serviceName]) {
        return configResult.config.services[serviceName].port || defaultPort;
      }
    } catch (error) {
      console.error(`Failed to get ${serviceName} port from config, using default:`, error);
    }
    return defaultPort;
  }
} 