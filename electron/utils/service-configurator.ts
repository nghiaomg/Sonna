import { IConfigProvider } from './interfaces';
import { ServiceSetupFactory, WebServerConfiguratorFactory } from './factories';
import { ConfigManagerProvider } from './providers';

/**
 * Main service configurator following SOLID principles
 * 
 * This class orchestrates the configuration of various services
 * by delegating to appropriate service setup and web server configurator classes.
 */
export class ServiceConfigurator {
  private configProvider: IConfigProvider;
  private serviceSetupFactory: ServiceSetupFactory;
  private webServerConfiguratorFactory: WebServerConfiguratorFactory;

  constructor(configProvider?: IConfigProvider) {
    this.configProvider = configProvider || new ConfigManagerProvider();
    this.serviceSetupFactory = new ServiceSetupFactory(this.configProvider);
    this.webServerConfiguratorFactory = new WebServerConfiguratorFactory(this.configProvider);
  }

  /**
   * Setup a specific service
   * @param serviceName - Name of the service to setup
   * @param service - Service configuration object
   */
  async setupService(serviceName: string, service: any): Promise<void> {
    try {
      console.log(`Setting up ${serviceName}...`);
      
      // Handle regular services
      const serviceSetup = this.serviceSetupFactory.createServiceSetup(serviceName);
      if (serviceSetup) {
        await serviceSetup.setupService(service.extractPath);
        return;
      }

      // Handle web servers
      const webServerConfigurator = this.webServerConfiguratorFactory.createConfigurator(serviceName, service.extractPath);
      if (webServerConfigurator) {
        await webServerConfigurator.updateConfiguration();
        return;
      }

      console.log(`No specific setup required for ${serviceName}`);
    } catch (error) {
      console.error(`Failed to setup ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Update web server configurations when phpMyAdmin is installed/uninstalled
   */
  async updateWebServerConfigs(): Promise<void> {
    try {
      const configResult = await this.configProvider.getConfig();
      
      if (!configResult.success || !configResult.config) {
        console.log('No config found, skipping web server update');
        return;
      }
      
      const config = configResult.config;
      
      if (config.services.apache?.installed) {
        console.log('Updating Apache configuration for phpMyAdmin...');
        const apacheConfigurator = this.webServerConfiguratorFactory.createConfigurator('apache', config.services.apache.extractPath);
        await apacheConfigurator?.updateConfiguration();
      }
      
      if (config.services.nginx?.installed) {
        console.log('Updating Nginx configuration for phpMyAdmin...');
        const nginxConfigurator = this.webServerConfiguratorFactory.createConfigurator('nginx', config.services.nginx.extractPath);
        await nginxConfigurator?.updateConfiguration();
      }
      
      console.log('Web server configurations updated successfully');
    } catch (error) {
      console.error('Failed to update web server configurations:', error);
    }
  }

  /**
   * Update Apache configuration specifically (for auto-configuration)
   */
  async updateApacheConfiguration(): Promise<void> {
    try {
      console.log('🔄 Updating Apache configuration with current services...');
      
      const configResult = await this.configProvider.getConfig();
      
      if (!configResult.success || !configResult.config) {
        console.log('No config found, skipping Apache configuration update');
        return;
      }
      
      const config = configResult.config;
      
      if (config.services.apache?.installed) {
        const apacheConfigurator = this.webServerConfiguratorFactory.createConfigurator('apache', config.services.apache.extractPath);
        if (apacheConfigurator) {
          await apacheConfigurator.updateConfiguration();
          console.log('✅ Apache configuration updated successfully');
        } else {
          console.log('❌ Failed to create Apache configurator');
        }
      } else {
        console.log('⚠️ Apache not installed, skipping configuration update');
      }
    } catch (error) {
      console.error('❌ Failed to update Apache configuration:', error);
      throw error;
    }
  }
} 