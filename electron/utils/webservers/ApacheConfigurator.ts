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
    const apacheRoot = this.getApacheRoot();
    const httpdConfPath = path.join(apacheRoot, 'conf', 'httpd.conf');
    
    if (!fs.existsSync(httpdConfPath)) return;

    // Initialize config directory
    await this.templateManager.initialize();

    // Get configuration variables
    const variables = await this.getConfigVariables(apacheRoot);

    // Generate new config from template
    const generatedConfigPath = await this.templateManager.generateApacheConfig(variables);

    // Copy generated config to Apache directory
    fs.copyFileSync(generatedConfigPath, httpdConfPath);

    console.log(`Apache configuration updated from template: ${generatedConfigPath} -> ${httpdConfPath}`);
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